/** @import { Device } from 'padavan' */
/** @import { Node, NodeAPI, NodeDef, NodeMessage } from 'node-red' */
/** @import { NodeInstance as ConfigNodeInstance, ConfigNode } from '../config/runtime.js' */

/** @typedef {{ name: string, settings: string }} Config */
/** @typedef {NodeDef & Config} ConfigDef */
/** @typedef {Node & { instance: DevicesNode }} NodeInstance */

export class DevicesNode {
	/** @type {NodeInstance} */ #node;
	/** @type {ConfigNode} */ #settings;
	/** @type {Map<string, Device>} */ #cache = new Map();

	constructor(/** @type {NodeInstance} */ node, /** @type {ConfigDef} */ config, /** @type {NodeAPI} */ RED) {
		this.#node = node;

		const configNode = RED.nodes.getNode(config.settings);
		if (configNode)
			this.#settings = /** @type {ConfigNodeInstance} */ (configNode).instance;
		else
			this.#node.warn('Config node not found or configured.');
		this.#node.on('input', this.#onInput.bind(this));
		this.#node.on('close', () => this.#cache.clear());
	};

	get client() {
		if (!this.#settings) {
			throw new Error('Client is not initialized. Check configuration.');
		}
		return this.#settings.client;
	};

	async #onInput(/** @type {NodeMessage} */ msg, /** @type {(...args: any[]) => void} */ send, /** @type {(err?: Error) => void} */ done) {
		try {
			this.#node.status({ fill: 'blue', shape: 'dot', text: 'Fetching...' });
			const rawDevices = await this.client.getDevices();

			const currentMap = new Map();
			const added = [];
			const changed = [];

			const /** @type {Device[]} */ processedDevices = rawDevices.map(dev => {
				const prev = this.#cache.get(dev.mac);
				if (prev && dev.type === 'eth' && ['wifi', '2.4GHz', '5GHz'].includes(prev.type))
					dev.type = prev.type;
				currentMap.set(dev.mac, dev);
				if (!prev)
					added.push(dev);
				else if (prev.ip !== dev.ip || prev.type !== dev.type || prev.hostname !== dev.hostname)
					changed.push(dev);
				return dev;
			});

			const removed = [];
			for (const [mac, dev] of this.#cache) {
				if (!currentMap.has(mac))
					removed.push(dev);
			}

			this.#cache = currentMap;

			msg.payload = processedDevices;
			msg.numConnectedDevices = processedDevices.length;

			msg.changes = {
				added,
				removed,
				changed,
				hasChanges: (added.length > 0 || removed.length > 0 || changed.length > 0)
			};

			this.#node.status({
				fill: 'green',
				shape: 'dot',
				text: `Found: ${processedDevices.length}`
			});

			send(msg);
			done();
		} catch (err) {
			this.#node.status({ fill: 'red', shape: 'ring', text: 'Error' });
			done(err);
		}
	};
};

export default function (/** @type {NodeAPI} */ RED) {
	RED.nodes.registerType('padavan-devices', function (/** @type {ConfigDef} */ config) {
		RED.nodes.createNode(this, config);
		const node = /** @type {NodeInstance} */ (this);
		node.instance = new DevicesNode(node, config, RED);
	});
};
