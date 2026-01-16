/** @import { EditorRED, EditorNodePropertiesDef } from 'node-red' */
/** @import { Config } from './runtime.js' */

let /** @type {EditorRED} */ RED = window['RED'];

RED.nodes.registerType('padavan-history', {
	category: 'Padavan',
	/** @type {EditorNodePropertiesDef<Config>} */ defaults: {
		settings: { value: '', type: 'padavan-config', required: true },
		name: { value: '' }
	},
	icon: 'font-awesome/fa-history',
	inputs: 1,
	outputs: 1,
	color: '#49AFCD',
	paletteLabel: 'History',
	label: function () {
		return this.name || 'History';
	}
});
