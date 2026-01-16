import Padavan from 'padavan';
/** @import { Credentials } from 'padavan' */
/** @import { Node, NodeAPI, NodeDef } from 'node-red' */

/** @typedef {'username'|'password'|'token'} CredentialKeys */
/** @typedef {Pick<Credentials, CredentialKeys>} NodeCredentials */
/** @typedef {Omit<Credentials, CredentialKeys>} NodeDefaults */
/** @typedef {NodeDefaults & { name: string, debug: boolean }} Config */
/** @typedef {NodeDef & Config} ConfigDef */
/** @typedef {Node<NodeCredentials> & { instance: ConfigNode }} NodeInstance */

export class ConfigNode {
	/** @type {NodeInstance} */ #node;
	/** @type {ConfigDef} */ #config;
	/** @type {Padavan} */ #client;

	constructor(/** @type {NodeInstance} */ node, /** @type {ConfigDef} */ config) {
		this.#node = node;
		this.#config = config;
		this.#node.on('close', this.#onClose.bind(this));
	};

	get client() {
		if (!this.#client)
			this.#client = new Padavan({
				credentials: {
					...this.#config,
					...this.#node.credentials
				},
				logLevel: this.#config.debug ? 'debug' : 'none'
			});
		return this.#client;
	};

	async #onClose(/** @type {boolean} */ removed, /** @type {() => void} */ done) {
		this.#node.debug(`Closing config node ${this.#node.id} (removed: ${!!removed})`);
		this.#client = null;
		done();
	};
};

export default function (/** @type {NodeAPI} */ RED) {
	RED.nodes.registerType('padavan-config', function (/** @type {ConfigDef} */ config) {
		RED.nodes.createNode(this, config);
		const node = /** @type {NodeInstance} */ (this);
		node.instance = new ConfigNode(node, config);
	}, {
		credentials: {
			// Router
			username: { type: 'text' },
			password: { type: 'password' },
			// Github
			token: { type: 'password' }
		}
	});
};
