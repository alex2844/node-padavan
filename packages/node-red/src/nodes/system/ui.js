/** @import { EditorRED, EditorNodePropertiesDef } from 'node-red' */
/** @import { TypedInputOption, TypedInputDefinition } from '../../utils/node-red.js' */
/** @import { Action, Band, Config } from './runtime.js' */

let /** @type {EditorRED} */ RED = window['RED'];

RED.nodes.registerType('padavan-system', {
	category: 'Padavan',
	/** @type {EditorNodePropertiesDef<Config>} */ defaults: {
		settings: { value: '', type: 'padavan-config', required: true },
		name: { value: '' },
		topic: { value: 'topic' },
		topicType: { value: 'msg' },
		band: { value: '2.4' },
		bandType: { value: 'band' }
	},
	icon: 'font-awesome/fa-server',
	inputs: 1,
	outputs: 1,
	color: '#49AFCD',
	paletteLabel: 'System',
	label: function () {
		return this.name || 'System';
	},
	oneditprepare: function () {
		$('#node-input-topic').typedInput({
			/** @type {TypedInputDefinition<Config['topicType']>[]} */
			types: [
				'msg',
				{
					value: 'action',
					/** @type {TypedInputOption<Action>[]} */ options: [
						{ value: 'status', label: this._('system.action.status') },
						{ value: 'log', label: this._('system.action.log') },
						{ value: 'reboot', label: this._('system.action.reboot') },
						{ value: 'scan', label: this._('system.action.scan') },
						{ value: 'doctor', label: this._('system.action.doctor') }
					]
				}
			],
			typeField: '#node-input-topicType'
		}).on('change', function () {
			const type = $('#node-input-topicType').val();
			const value = $('#node-input-topic').val();
			const showBand = (type === 'action' && (value === 'scan' || value === 'doctor')) || (type === 'msg');
			$('#node-input-band-row').toggle(showBand);
		});

		$('#node-input-band').typedInput({
			/** @type {TypedInputDefinition<Config['bandType']>[]} */
			types: [
				{
					value: 'band',
					/** @type {TypedInputOption<Band>[]} */ options: [
						{ value: '2.4', label: '2.4 GHz' },
						{ value: '5', label: '5 GHz' }
					]
				},
				'msg'
			],
			typeField: '#node-input-bandType'
		});
	}
});
