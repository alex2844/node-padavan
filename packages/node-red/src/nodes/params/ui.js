import { CONFIG_ACTION, SERVICE_ID, GROUP_ID } from 'padavan/constants.js';
import { createTypedInputOptions } from '../../utils/node-red.js';
/** @import { EditorRED, EditorNodePropertiesDef } from 'node-red' */
/** @import { TypedInputOption, TypedInputDefinition } from '../../utils/node-red.js' */
/** @import { Action, Config } from './runtime.js' */

let /** @type {EditorRED} */ RED = window['RED'];

RED.nodes.registerType('padavan-params', {
	category: 'Padavan',
	/** @type {EditorNodePropertiesDef<Config>} */ defaults: {
		settings: { value: '', type: 'padavan-config', required: true },
		name: { value: '' },
		topic: { value: 'topic' },
		topicType: { value: 'msg' },
		payload: { value: 'payload' },
		payloadType: { value: 'msg' },
		page: { value: '' },
		pageType: { value: 'str' },
		sid: { value: '' },
		sidType: { value: 'str' },
		group: { value: '' },
		groupType: { value: 'str' },
		script: { value: '' },
		scriptType: { value: 'str' },
		action: { value: CONFIG_ACTION.APPLY },
		actionType: { value: 'mode' }
	},
	icon: 'font-awesome/fa-cogs',
	inputs: 1,
	outputs: 1,
	color: '#49AFCD',
	paletteLabel: 'Params',
	label: function () {
		return this.name || 'Params';
	},
	oneditprepare: function () {
		$('#node-input-topic').typedInput({
			/** @type {TypedInputDefinition<Config['topicType']>[]} */
			types: [
				'msg',
				{
					value: 'action',
					/** @type {TypedInputOption<Action>[]} */ options: [
						{ value: 'list', label: this._('params.action.list') },
						{ value: 'get', label: this._('params.action.get') },
						{ value: 'set', label: this._('params.action.set') }
					]
				}
			],
			typeField: '#node-input-topicType'
		});

		$('#node-input-payload').typedInput({
			/** @type {TypedInputDefinition<Config['payloadType']>[]} */
			types: ['msg', 'json', 'str', 'jsonata'],
			typeField: '#node-input-payloadType'
		});

		$('#node-input-page').typedInput({
			/** @type {TypedInputDefinition<Config['pageType']>[]} */
			types: ['str', 'msg'],
			typeField: '#node-input-pageType'
		});

		$('#node-input-sid').typedInput({
			/** @type {TypedInputDefinition<Config['sidType']>[]} */
			types: [
				'str', 'json', 'msg',
				{
					value: 'sid',
					options: createTypedInputOptions(SERVICE_ID)
				}
			],
			typeField: '#node-input-sidType'
		});

		$('#node-input-group').typedInput({
			/** @type {TypedInputDefinition<Config['groupType']>[]} */
			types: [
				'str', 'msg',
				{
					value: 'group',
					options: createTypedInputOptions(GROUP_ID)
				}
			],
			typeField: '#node-input-groupType'
		});

		$('#node-input-script').typedInput({
			/** @type {TypedInputDefinition<Config['scriptType']>[]} */
			types: ['str', 'msg'],
			typeField: '#node-input-scriptType'
		});

		$('#node-input-action').typedInput({
			/** @type {TypedInputDefinition<Config['actionType']>[]} */
			types: [
				{
					value: 'mode',
					options: createTypedInputOptions(Object.values(CONFIG_ACTION))
				},
				'str', 'msg'
			],
			typeField: '#node-input-actionType'
		});

		$('#node-input-topic').on('change', function () {
			const type = $('#node-input-topicType').val();
			const value = $('#node-input-topic').val();

			const isSet = (type === 'action' && value === 'set') || (type === 'msg');
			const isList = (type === 'action' && value === 'list');

			$('#node-row-payload').toggle(!isList);
			$('#node-row-page').toggle(!isList);
			$('#node-row-sid').toggle(isSet);
			$('#node-row-group').toggle(isSet);
			$('#node-row-script').toggle(isSet);
			$('#node-row-action').toggle(isSet);
		});
	}
});
