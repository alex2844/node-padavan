/** @import { Node, NodeAPI, NodeDef, NodeMessage } from 'node-red' */
/** @import { NodeInstance as ConfigNodeInstance, ConfigNode } from '../config/runtime.js' */

/**
 * @typedef {{
 *  name: string, settings: string, topic: string, topicType: string,
 *  payload: string, payloadType: string,
 *  page: string, pageType: string,
 *  sid: string, sidType: string,
 *  group: string, groupType: string,
 *  script: string, scriptType: string,
 *  action: string, actionType: string
 * }} Config
 */
/** @typedef {NodeDef & Config} ConfigDef */
/** @typedef {Node & { instance: ParamsNode }} NodeInstance */

export class ParamsNode {
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
		const payload = this.#RED.util.evaluateNodeProperty(this.#config.payload, this.#config.payloadType, this.#node, msg);
		const action_mode = this.#RED.util.evaluateNodeProperty(this.#config.action, this.#config.actionType, this.#node, msg);
		const action_script = this.#RED.util.evaluateNodeProperty(this.#config.script, this.#config.scriptType, this.#node, msg);
		const sid_list = this.#RED.util.evaluateNodeProperty(this.#config.sid, this.#config.sidType, this.#node, msg);
		const group_id = this.#RED.util.evaluateNodeProperty(this.#config.group, this.#config.groupType, this.#node, msg);
		const current_page = this.#RED.util.evaluateNodeProperty(this.#config.page, this.#config.pageType, this.#node, msg);
		try {
			this.#node.status({ fill: 'blue', shape: 'dot', text: 'Processing...' });
			let result;
			switch (topic) {
				case 'list': {
					result = await this.client.getParams();
					break;
				};
				case 'get': {
					result = await this.client.getParams(payload, current_page);
					break;
				};
				case 'set': {
					if (!payload || typeof payload !== 'object')
						throw new Error('Input payload missing or not an object');
					await this.client.setParams(payload, { action_mode, action_script, sid_list, group_id, current_page });
					result = payload;
					break;
				};
				default:
					throw new Error(`Invalid topic: "${topic}". Must be 'list', 'get', or 'set'.`);
			}
			if (result) {
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
	RED.nodes.registerType('padavan-params', function (/** @type {ConfigDef} */ config) {
		RED.nodes.createNode(this, config);
		const node = /** @type {NodeInstance} */ (this);
		node.instance = new ParamsNode(node, config, RED);
	});
};
