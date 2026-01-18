/** @import { Node, NodeAPI, NodeDef, NodeMessage } from 'node-red' */
/** @import { NodeInstance as ConfigNodeInstance, ConfigNode } from '../config/runtime.js' */

/** @typedef {{ name: string, settings: string, topic: string, topicType: string }} Config */
/** @typedef {NodeDef & Config} ConfigDef */
/** @typedef {Node & { instance: UpgradeNode }} NodeInstance */

export class UpgradeNode {
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

		try {
			this.#node.status({ fill: 'blue', shape: 'dot', text: 'Processing...' });
			let payload;
			switch (topic) {
				case 'changelog': {
					this.#node.status({ fill: 'blue', shape: 'dot', text: 'Checking updates...' });
					payload = await this.client.getChangelog();
					if (payload.messages && payload.messages.length > 0)
						this.#node.status({ fill: 'green', shape: 'dot', text: `New updates: ${payload.messages.length}` });
					else
						this.#node.status({ fill: 'green', shape: 'ring', text: 'Up to date' });
					break;
				};
				case 'build': {
					this.#node.status({ fill: 'blue', shape: 'dot', text: 'Triggering build...' });
					await this.client.startBuild();
					payload = { status: 'success', message: 'Build triggered' };
					this.#node.status({ fill: 'green', shape: 'dot', text: 'Build started' });
					setTimeout(() => this.#node.status({}), 5_000);
					break;
				};
				case 'upgrade': {
					this.#node.status({ fill: 'blue', shape: 'dot', text: 'Downloading & Flashing...' });
					await this.client.startUpgrade();
					payload = { status: 'success', message: 'Firmware uploaded, router is rebooting' };
					this.#node.status({ fill: 'green', shape: 'dot', text: 'Rebooting...' });
					setTimeout(() => this.#node.status({}), 10_000);
					break;
				};
				default:
					throw new Error(`Invalid topic: "${topic}". Must be 'changelog', 'build', or 'upgrade'.`);
			}
			if (payload) {
				if (!msg.topic)
					msg.topic = topic;
				msg.payload = payload;
				send(msg);
			}
			done();
		} catch (err) {
			this.#node.status({ fill: 'red', shape: 'ring', text: 'Error' });
			done(err);
		}
	}
};

export default function (/** @type {NodeAPI} */ RED) {
	RED.nodes.registerType('padavan-upgrade', function (/** @type {ConfigDef} */ config) {
		RED.nodes.createNode(this, config);
		const node = /** @type {NodeInstance} */ (this);
		node.instance = new UpgradeNode(node, config, RED);
	});
};
