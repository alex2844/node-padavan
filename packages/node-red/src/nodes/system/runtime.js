import { formatUptime } from 'padavan/utils/formatting.js';
import { evaluateNodeProperties } from '../../utils/node-red.js';
/** @import { Node, NodeAPI, NodeDef, NodeMessage } from 'node-red' */
/** @import { NodeInstance as ConfigNodeInstance, ConfigNode } from '../config/runtime.js' */

/** @typedef {'status'|'log'|'reboot'|'scan'|'doctor'} Action */
/** @typedef {'2.4'|'5'} Band */

/**
 * @typedef {{
 *  name: string, settings: string,
 *  topic: Action|(string & {}), topicType: 'msg'|'action'
 *  band: Band|(string & {}), bandType: 'band'|'msg'
 * }} Config
 */
/** @typedef {NodeDef & Config} ConfigDef */
/** @typedef {Node & { instance: SystemNode }} NodeInstance */

export class SystemNode {
	/** @type {NodeAPI} */ #RED;
	/** @type {NodeInstance} */ #node;
	/** @type {Config} */ #config;
	/** @type {ConfigNode} */ #settings;
	/** @type {{ state: object, timestamp: number }|null} */ #lastCpu = null;

	constructor(/** @type {NodeInstance} */ node, /** @type {ConfigDef} */ config, /** @type {NodeAPI} */ RED) {
		this.#node = node;
		this.#config = config;
		this.#RED = RED;

		const configNode = RED.nodes.getNode(config.settings);
		if (configNode)
			this.#settings = /** @type {ConfigNodeInstance} */ (configNode).instance;
		else
			this.#node.warn('Config node not found or configured.');
		this.#node.on('input', this.#onInput.bind(this));
		this.#node.on('close', () => {
			this.#lastCpu = null;
		});
	};

	get client() {
		if (!this.#settings)
			throw new Error('Client is not initialized. Check configuration.');
		return this.#settings.client;
	};

	async #onInput(/** @type {NodeMessage} */ msg, /** @type {(...args: any[]) => void} */ send, /** @type {(err?: Error) => void} */ done) {
		try {
			const [topic, band] = await evaluateNodeProperties(this.#RED, this.#node, msg, [
				{ value: this.#config.topic, type: this.#config.topicType },
				{ value: this.#config.band, type: this.#config.bandType }
			]);
			this.#node.status({ fill: 'blue', shape: 'dot', text: `Running ${topic}...` });
			let payload;
			switch (/** @type {Action} */ (topic)) {
				case 'status': {
					const now = Date.now();
					payload = await this.client.getStatus();
					if (payload.ram?.total > 0)
						payload.ramPercent = Math.round((payload.ram.used / payload.ram.total) * 100);
					if (payload.uptime)
						payload.uptimeStr = formatUptime(payload.uptime);
					if (payload.cpu) {
						payload.cpuPercent = null;
						if (this.#lastCpu && (now - this.#lastCpu.timestamp < 30_000)) {
							const busy_diff = payload.cpu.busy - this.#lastCpu.state.busy;
							const total_diff = payload.cpu.total - this.#lastCpu.state.total;
							if (total_diff > 0 && busy_diff >= 0)
								payload.cpuPercent = Math.round((busy_diff / total_diff) * 100);
						}
						this.#lastCpu = { state: payload.cpu, timestamp: now };
					}
					break;
				};
				case 'log': {
					payload = await this.client.getLog();
					break;
				};
				case 'reboot': {
					payload = await this.client.startReboot();
					break;
				};
				case 'scan': {
					payload = await this.client.startScan(band);
					break;
				};
				case 'doctor': {
					payload = await this.client.getBestChannel(band);
					break;
				};
				default:
					throw new Error(`Invalid topic: "${topic}".`);
			}
			if (payload !== undefined) {
				if (!msg.topic)
					msg.topic = topic;
				msg.payload = payload;
				send(msg);
			}
			this.#node.status({});
			done();
		} catch (err) {
			this.#node.status({ fill: 'red', shape: 'ring', text: 'Error' });
			done(err);
		}
	};
};

export default function (/** @type {NodeAPI} */ RED) {
	RED.nodes.registerType('padavan-system', function (/** @type {ConfigDef} */ config) {
		RED.nodes.createNode(this, config);
		const node = /** @type {NodeInstance} */ (this);
		node.instance = new SystemNode(node, config, RED);
	});
};
