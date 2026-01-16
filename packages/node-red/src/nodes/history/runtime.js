import { formatBytes } from 'padavan/utils/formatting.js';
/** @import { Node, NodeAPI, NodeDef, NodeMessage } from 'node-red' */
/** @import { NodeInstance as ConfigNodeInstance, ConfigNode } from '../config/runtime.js' */

/** @typedef {{ name: string, settings: string }} Config */
/** @typedef {NodeDef & Config} ConfigDef */
/** @typedef {Node & { instance: HistoryNode }} NodeInstance */

export class HistoryNode {
	/** @type {NodeInstance} */ #node;
	/** @type {ConfigNode} */ #settings;

	constructor(/** @type {NodeInstance} */ node, /** @type {ConfigDef} */ config, /** @type {NodeAPI} */ RED) {
		this.#node = node;
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
		if (!this.#settings) {
			done(new Error('Config node not configured'));
			return;
		}
		try {
			this.#node.status({ fill: 'blue', shape: 'dot', text: 'Fetching...' });

			const history = await this.client.getHistory();
			let dataPoint = null;
			let periodLabel = 'No data';

			if (history.monthly && history.monthly.length > 0) {
				dataPoint = history.monthly[history.monthly.length - 1];
				periodLabel = 'Month';
			} else if (history.daily && history.daily.length > 0) {
				dataPoint = history.daily[history.daily.length - 1];
				periodLabel = 'Today';
			}

			const totalKB = dataPoint ? (dataPoint.download + dataPoint.upload) : 0;

			msg.networkUsage = formatBytes(totalKB * 1024);
			msg.networkUsageMB = Math.floor(totalKB / 1024);
			msg.payload = history;

			const statusText = totalKB > 0 ? `${periodLabel}: ${msg.networkUsage}` : periodLabel;
			this.#node.status({ fill: 'green', shape: 'dot', text: statusText });
			send(msg);
			done();
		} catch (err) {
			this.#node.status({ fill: 'red', shape: 'ring', text: 'Error' });
			done(err);
		}
	};
};

export default function (/** @type {NodeAPI} */ RED) {
	RED.nodes.registerType('padavan-history', function (/** @type {ConfigDef} */ config) {
		RED.nodes.createNode(this, config);
		const node = /** @type {NodeInstance} */ (this);
		node.instance = new HistoryNode(node, config, RED);
	});
};
