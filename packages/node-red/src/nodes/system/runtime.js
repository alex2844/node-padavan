/** @import { Node, NodeAPI, NodeDef, NodeMessage } from 'node-red' */
/** @import { NodeInstance as ConfigNodeInstance, ConfigNode } from '../config/runtime.js' */

/** @typedef {{ name: string, settings: string, topic: string, topicType: string, band: string, bandType: string }} Config */
/** @typedef {NodeDef & Config} ConfigDef */
/** @typedef {Node & { instance: SystemNode }} NodeInstance */

export class SystemNode {
	/** @type {NodeAPI} */ #RED;
	/** @type {NodeInstance} */ #node;
	/** @type {Config} */ #config;
	/** @type {ConfigNode} */ #settings;

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
	};

	get client() {
		if (!this.#settings)
			throw new Error('Client is not initialized. Check configuration.');
		return this.#settings.client;
	};

	async #onInput(/** @type {NodeMessage} */ msg, /** @type {(...args: any[]) => void} */ send, /** @type {(err?: Error) => void} */ done) {
		const topic = this.#RED.util.evaluateNodeProperty(this.#config.topic, this.#config.topicType, this.#node, msg);
		const band = this.#RED.util.evaluateNodeProperty(this.#config.band, this.#config.bandType, this.#node, msg) || '2.4';
		try {
			this.#node.status({ fill: 'blue', shape: 'dot', text: `Running ${topic}...` });
			let payload;
			switch (topic) {
				case 'status': {
					payload = await this.client.getStatus();
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
