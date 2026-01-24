import { SYSTEM_ACTION, WIFI_BANDS } from 'padavan/constants.js';
import { createTypedInputOptions } from '../../utils/node-red.js';
/** @import { EditorRED, EditorNodePropertiesDef } from 'node-red' */
/** @import { TypedInputOption, TypedInputDefinition } from '../../utils/node-red.js' */
/** @import { Action, Config } from './runtime.js' */

let /** @type {EditorRED} */ RED = window['RED'];

RED.nodes.registerType('padavan-system', {
	category: 'Padavan',
	/** @type {EditorNodePropertiesDef<Config>} */ defaults: {
		settings: { value: '', type: 'padavan-config', required: true },
		name: { value: '' },
		topic: { value: 'topic' },
		topicType: { value: 'msg' },
		band: { value: WIFI_BANDS[0] },
		bandType: { value: 'band' },
		action: { value: SYSTEM_ACTION.SYSTEM_CMD },
		actionType: { value: 'mode' }
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
						{ value: 'doctor', label: this._('system.action.doctor') },
						{ value: 'call', label: this._('system.action.call') }
					]
				}
			],
			typeField: '#node-input-topicType'
		}).on('change', function () {
			const type = $('#node-input-topicType').val();
			const value = $('#node-input-topic').val();
			const showBand = (type === 'action' && (value === 'scan' || value === 'doctor')) || (type === 'msg');
			const showAction = (type === 'action' && value === 'call') || (type === 'msg');
			$('#node-input-band-row').toggle(showBand);
			$('#node-input-action-row').toggle(showAction);
		});

		$('#node-input-band').typedInput({
			/** @type {TypedInputDefinition<Config['bandType']>[]} */
			types: [
				{
					value: 'band',
					options: WIFI_BANDS.map(band => ({
						value: band,
						label: `${band} GHz`
					}))
				},
				'msg'
			],
			typeField: '#node-input-bandType'
		});

		$('#node-input-action').typedInput({
			/** @type {TypedInputDefinition<Config['actionType']>[]} */
			types: [
				{
					value: 'mode',
					options: createTypedInputOptions(Object.values(SYSTEM_ACTION))
				},
				'str', 'msg'
			],
			typeField: '#node-input-actionType'
		});
	}
});
