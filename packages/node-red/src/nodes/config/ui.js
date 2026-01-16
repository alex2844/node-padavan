/** @import { EditorRED, EditorNodePropertiesDef, EditorNodeCredentials, EditorNodeCredential } from 'node-red' */
/** @import { NodeCredentials, Config } from './runtime.js' */
/** @typedef {EditorNodeCredential & { validate: () => boolean }} CredentialDef */

let /** @type {EditorRED} */ RED = window['RED'];

function onchangerepo(/** @type {JQuery.ChangeEvent<HTMLElement, null>} */ event) {
	const regexp = /https:\/\/github\.com\/?([^\/]+\/[^\/]+)(?:\/tree\/(.+))?/;
	const [repo, branch] = event.target.value.match(regexp)?.slice(1) || [];
	if (repo)
		$('#node-config-input-repo').val(repo);
	if (branch)
		$('#node-config-input-branch').val(branch);
};

RED.nodes.registerType('padavan-config', {
	category: 'config',
	/** @type {EditorNodePropertiesDef<Config>} */ defaults: {
		name: { value: '' },
		host: { value: '' },
		repo: { value: '' },
		branch: { value: '' },
		debug: { value: false }
	},
	/** @type {EditorNodeCredentials<NodeCredentials>} */ credentials: {
		username: { type: 'text' },
		password: { type: 'password' },
		token: { type: 'password' }
	},
	label: function () {
		return this.name || this.host || 'Padavan';
	},
	oneditprepare: function () {
		$('#node-config-input-repo').on('change', onchangerepo);
	}
});
