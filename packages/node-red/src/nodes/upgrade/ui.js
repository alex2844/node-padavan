/** @import { EditorRED, EditorNodePropertiesDef } from 'node-red' */
/** @import { Config } from './runtime.js' */

let /** @type {EditorRED} */ RED = window['RED'];

RED.nodes.registerType('padavan-upgrade', {
	category: 'Padavan',
	/** @type {EditorNodePropertiesDef<Config>} */ defaults: {
		settings: { value: '', type: 'padavan-config', required: true },
		name: { value: '' },
		topic: { value: 'topic' },
		topicType: { value: 'msg' }
	},
	icon: 'font-awesome/fa-cloud-upload',
	inputs: 1,
	outputs: 1,
	color: '#49AFCD',
	paletteLabel: 'Upgrade',
	label: function () {
		return this.name || 'Upgrade';
	},
	oneditprepare: function () {
		$('#node-input-topic').typedInput({
			types: [
				'msg',
				{
					value: 'action',
					options: [
						{ value: 'changelog', label: this._('upgrade.action.changelog') },
						{ value: 'build', label: this._('upgrade.action.build') },
						{ value: 'upgrade', label: this._('upgrade.action.upgrade') }
					]
				}
			],
			typeField: '#node-input-topicType'
		});
	}
});
