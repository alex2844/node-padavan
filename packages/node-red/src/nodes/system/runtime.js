import { formatUptime } from 'padavan/utils/formatting.js';
import { evaluateNodeProperties } from '../../utils/node-red.js';
/** @import { Node, NodeAPI, NodeDef, NodeMessage } from 'node-red' */
/** @import { NodeInstance as ConfigNodeInstance, ConfigNode } from '../config/runtime.js' */
/** @import { SystemAction, WifiBand } from 'padavan/constants.js' */

/** @typedef {'status'|'log'|'reboot'|'scan'|'doctor'|'call'} Action */

/**
 * @typedef {{
 *  name: string, settings: string,
 *  topic: Action|(string & {}), topicType: 'msg'|'action'
 *  band: WifiBand|(string & {}), bandType: 'band'|'msg',
 *  action: SystemAction|(string & {}), actionType: 'mode'|'str'|'msg'
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
			const [topic, band, action] = await evaluateNodeProperties(this.#RED, this.#node, msg, [
				{ value: this.#config.topic, type: this.#config.topicType },
				{ value: this.#config.band, type: this.#config.bandType },
				{ value: this.#config.action, type: this.#config.actionType }
			]);
			this.#node.status({ fill: 'blue', shape: 'dot', text: `Running ${topic}...` });
			let result;
			switch (/** @type {Action} */ (topic)) {
				case 'status': {
					result = await this.client.getStatus();
					if (result.uptime)
						msg.uptimeStr = formatUptime(result.uptime);
					if (result.ram?.total > 0)
						msg.ramPercent = Math.round((result.ram.used / result.ram.total) * 100);
					if (result.cpu) {
						msg.cpuPercent = null;
						const now = Date.now();
						if (this.#lastCpu && (now - this.#lastCpu.timestamp < 30_000)) {
							const busy_diff = result.cpu.busy - this.#lastCpu.state.busy;
							const total_diff = result.cpu.total - this.#lastCpu.state.total;
							if (total_diff > 0 && busy_diff >= 0)
								msg.cpuPercent = Math.round((busy_diff / total_diff) * 100);
						}
						this.#lastCpu = { state: result.cpu, timestamp: now };
					}
					break;
				};
				case 'log': {
					result = await this.client.getLog();
					break;
				};
				case 'reboot': {
					result = await this.client.startReboot();
					break;
				};
				case 'scan': {
					result = await this.client.startScan(band);
					break;
				};
				case 'doctor': {
					result = await this.client.getBestChannel(band);
					break;
				};
				case 'call': {
					if (!action)
						throw new Error('System Action is required for "call" operation');
					let data = {};
					if (typeof msg.payload === 'object' && msg.payload !== null)
						data = msg.payload;
					else if (typeof msg.payload === 'string' && action.trim() === 'SystemCmd')
						data = { SystemCmd: msg.payload };
					result = await this.client.sendAction(action, data);
					break;
				};
				default:
					throw new Error(`Invalid topic: "${topic}".`);
			}
			if (result !== undefined) {
				if (!msg.topic)
					msg.topic = topic;
				msg.payload = result;
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
