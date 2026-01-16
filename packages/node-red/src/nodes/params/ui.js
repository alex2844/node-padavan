import { ACTION_MODE, SERVICE_ID, GROUP_ID } from 'padavan/constants.js';
/** @import { EditorRED, EditorNodePropertiesDef } from 'node-red' */
/** @import { Config } from './runtime.js' */

let /** @type {EditorRED} */ RED = window['RED'];

const mapOptions = (/** @type {readonly string[]} */ list) => list.map(value => ({ value, label: value.trim() }));

const ACTION_MODES = mapOptions(ACTION_MODE);
const SERVICE_IDS = mapOptions(SERVICE_ID);
const GROUP_IDS = mapOptions(GROUP_ID);

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
		action: { value: ' Apply ' },
		actionType: { value: 'str' }
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
			types: [
				'msg',
				{
					value: 'action',
					options: [
						{ value: 'list', label: this._('params.action.list') },
						{ value: 'get', label: this._('params.action.get') },
						{ value: 'set', label: this._('params.action.set') }
					]
				}
			],
			typeField: '#node-input-topicType'
		});

		$('#node-input-payload').typedInput({
			types: ['msg', 'json', 'str'],
			typeField: '#node-input-payloadType'
		});

		$('#node-input-page').typedInput({
			types: ['str', 'msg'],
			typeField: '#node-input-pageType'
		});

		$('#node-input-sid').typedInput({
			types: [
				'str', 'json', 'msg',
				{
					value: 'sid',
					options: SERVICE_IDS
				}
			],
			typeField: '#node-input-sidType'
		});

		$('#node-input-group').typedInput({
			types: [
				'str', 'msg',
				{
					value: 'group',
					options: GROUP_IDS
				}
			],
			typeField: '#node-input-groupType'
		});

		$('#node-input-script').typedInput({
			types: ['str', 'msg'],
			typeField: '#node-input-scriptType'
		});

		$('#node-input-action').typedInput({
			types: [
				{
					value: 'mode',
					options: ACTION_MODES
				},
				'str', 'msg'
			],
			typeField: '#node-input-actionModeType'
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
