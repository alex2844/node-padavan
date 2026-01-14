#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import Padavan from '../src/index.js';
import { formatBytes, formatUptime } from '../src/utils/formatting.js';
import { DEFAULT_HTTP_CONFIG, DEFAULT_FIRMWARE_REPO, ACTION_MODE, SERVICE_ID, GROUP_ID } from '../src/constants.js';
/** @import { ActionMode, ServiceId, GroupId } from '../src/constants.js' */
/** @import { ArgumentsCamelCase } from 'yargs' */
/** @import { Device, WifiNetwork, ChannelAnalysis } from '../src/index.js' */

/**
 * @typedef {Object} CommonArgs
 * @property {string} host
 * @property {number} port
 * @property {string} user
 * @property {string} password
 * @property {boolean} verbose
 * @property {boolean} json
 */

/**
 * @typedef {Object} FirmwareArgs
 * @property {string} action
 * @property {string} [repo]
 * @property {string} [branch]
 * @property {string} [token]
 * @property {string} [model]
 */

const logInfo = (/** @type {string} */ msg) => console.error(msg);

/**
 * @param {CommonArgs} argv
 * @param {any} data
 * @param {(item: any) => any} [tableTransform]
 */
const printOutput = (argv, data, tableTransform = null) => {
	if (argv.json)
		return console.log(JSON.stringify(data, null, 2));
	let output = data;
	if (tableTransform)
		output = Array.isArray(data) ? data.map(tableTransform) : tableTransform(data);
	if (Array.isArray(output))
		return output.length ? console.table(output) : logInfo('No results found.');
	if (output && typeof output === 'object')
		return Object.keys(output).length ? console.table(output) : logInfo('No results found.');
	console.log(output);
};

const getClient = (/** @type {ArgumentsCamelCase<CommonArgs & Partial<FirmwareArgs>>} */ argv) => {
	const logLevel = argv.verbose ? 'debug' : 'none';
	return new Padavan({ credentials: argv, logLevel });
};

const args = hideBin(process.argv);
const cli = yargs(args)
	.env('PADAVAN')
	.option('host', { type: 'string', describe: 'Router IP', default: DEFAULT_HTTP_CONFIG.host })
	.option('port', { type: 'number', describe: 'Port', default: DEFAULT_HTTP_CONFIG.port })
	.option('user', { type: 'string', describe: 'Username', default: DEFAULT_HTTP_CONFIG.username })
	.option('password', { type: 'string', describe: 'Password', default: DEFAULT_HTTP_CONFIG.password })
	.option('json', { type: 'boolean', describe: 'Output result as JSON', default: false })
	.option('verbose', { type: 'boolean', describe: 'Show debug logs' });

// --- STATUS & INFO ---

cli.command('status', 'Get system status', {}, async (/** @type {ArgumentsCamelCase<CommonArgs>} */ argv) => {
	const client = getClient(argv);
	const status = await client.getStatus();
	printOutput(argv, status, (s) => ({
		'Uptime': formatUptime(s.uptime),
		'Load Avg': s.lavg,
		'RAM Free': formatBytes(s.ram.free * 1024),
		'RAM Used': formatBytes(s.ram.used * 1024),
		'RAM Total': formatBytes(s.ram.total * 1024)
	}));
});

cli.command('devices', 'List connected devices', {}, async (/** @type {ArgumentsCamelCase<CommonArgs>} */ argv) => {
	const client = getClient(argv);
	const devices = await client.getDevices();
	printOutput(argv, devices, (/** @type {Device} */ d) => ({
		MAC: d.mac,
		IP: d.ip,
		HostName: d.hostname,
		Type: d.type,
		RSSI: d.rssi ? d.rssi + '%' : null
	}));
});

cli.command('log', 'Get system log', {}, async (/** @type {ArgumentsCamelCase<CommonArgs>} */ argv) => {
	const client = getClient(argv);
	const log = await client.getLog();
	console.log(log);
});

cli.command('traffic', 'Get traffic history', {}, async (/** @type {ArgumentsCamelCase<CommonArgs>} */ argv) => {
	const client = getClient(argv);
	const history = await client.getHistory();
	if (argv.json) {
		printOutput(argv, history);
		return;
	}
	const trafficTable = (/** @type {any} */ item) => ({
		Date: item.dateStr,
		Download: formatBytes(item.download * 1024),
		Upload: formatBytes(item.upload * 1024),
		Total: formatBytes((item.download + item.upload) * 1024)
	});
	logInfo('Daily History (Last 10):');
	console.table(history.daily.slice().reverse().slice(0, 10).map(trafficTable));
	logInfo('Monthly History (Last 10):');
	console.table(history.monthly.slice().reverse().slice(0, 10).map(trafficTable));
});

// --- WIFI DOCTOR ---

cli.command('scan [band]', 'Scan Wi-Fi networks', (yargs) => {
	return yargs.positional('band', { type: 'string', choices: ['2.4', '5'], default: '2.4' });
}, async (/** @type {ArgumentsCamelCase<CommonArgs & {band: '2.4'|'5'}>} */ argv) => {
	const client = getClient(argv);
	logInfo(`Scanning ${argv.band}GHz networks...`);
	const networks = await client.startScan(argv.band);
	printOutput(argv, networks, (/** @type {WifiNetwork} */ n) => ({
		SSID: n.ssid,
		Channel: n.channel,
		Quality: n.quality + '%',
		BSSID: n.bssid
	}));
});

cli.command('doctor [band]', 'Analyze Wi-Fi environment and recommend channel', (yargs) => {
	return yargs.positional('band', { type: 'string', choices: ['2.4', '5'], default: '2.4' });
}, async (/** @type {ArgumentsCamelCase<CommonArgs & {band: '2.4'|'5'}>} */ argv) => {
	const client = getClient(argv);
	logInfo(`Scanning and analyzing ${argv.band}GHz spectrum...`);
	const result = await client.getBestChannel(argv.band);
	printOutput(argv, result, (/** @type {ChannelAnalysis} */ r) => ({
		'Current': r.currentChannel,
		'Best': r.bestChannel,
		'Optimal?': r.isCurrentOptimal ? 'Yes' : 'No',
		'Reason': r.reason
	}));
});

// --- PARAMS (NVRAM) ---

cli.command('params [keys..]', 'Get parameters (NVRAM or Page inputs)', (yargs) => {
	return yargs
		.option('page', { type: 'string', describe: 'Target ASP page to parse inputs from' });
}, async (/** @type {ArgumentsCamelCase<CommonArgs & {keys?: string[], page?: string}>} */ argv) => {
	const client = getClient(argv);
	const params = await client.getParams(argv.keys, argv.page);
	printOutput(argv, params);
});

cli.command('set <pairs..>', 'Set parameters (key=value)', (yargs) => {
	return yargs
		.option('page', { type: 'string', describe: 'Current page (for auto-SID detection)' })
		.option('sid', { type: 'array', describe: 'Service ID list', choices: SERVICE_ID })
		.option('group', { type: 'string', describe: 'Group ID (required for Add/Del actions)', choices: GROUP_ID })
		.option('script', { type: 'string', describe: 'Action script' })
		.option('action', {
			type: 'string',
			describe: 'Action mode',
			default: 'Apply',
			coerce: (arg) => {
				const clean = arg.trim();
				const match = ACTION_MODE.map(m => m.trim()).find(m => m.toLowerCase() === clean.toLowerCase());
				return match || arg;
			},
			choices: ACTION_MODE.map(m => m.trim())
		})
		.example('$0 set rt_ssid=MyWifi --page "Advanced_WAdvanced_Content.asp"', 'Apply settings via Web UI')
		.example('$0 set "rt_ACLList=AA:BB:CC:DD:EE:FF" --action Add --group rt_ACLList', 'Add MAC to filter');
}, async (/** @type {ArgumentsCamelCase<CommonArgs & {pairs: string[], sid?: string|ServiceId[], page?: string, action?: ActionMode, group?: GroupId, script?: string}>} */ argv) => {
	const client = getClient(argv);
	const /** @type {Record<string, string>} */ params = {};
	argv.pairs.forEach(p => {
		const [k, ...v] = p.split('=');
		if (k)
			params[k] = v.join('=');
	});
	const action_mode = ACTION_MODE.find(m => m.trim() === argv.action) || argv.action;
	await client.setParams(params, {
		action_mode,
		action_script: argv.script,
		sid_list: argv.sid,
		group_id: argv.group,
		current_page: argv.page
	});
	logInfo('Settings applied successfully.');
});

// --- FIRMWARE ---

cli.command('firmware <action>', 'Manage firmware', (yargs) => {
	return yargs
		.positional('action', { choices: ['changelog', 'build', 'upgrade', 'search'] })
		.option('repo', { type: 'string', describe: 'GitHub Owner/Repo', default: DEFAULT_FIRMWARE_REPO })
		.option('branch', { type: 'string', describe: 'Branch name' })
		.option('token', { type: 'string', describe: 'GitHub Token' })
		.option('model', { type: 'string', describe: 'Model filter for search' });
}, async (/** @type {ArgumentsCamelCase<CommonArgs & FirmwareArgs>} */ argv) => {
	if (argv.action !== 'search' && !argv.repo)
		throw new Error(`--repo is required for ${argv.action}`);

	const client = getClient(argv);
	switch (argv.action) {
		case 'search': {
			logInfo(`Searching firmware (Source: ${argv.repo}, Model: ${argv.model || 'Auto'})...`);
			const results = await client.findFirmware(argv.model);
			printOutput(argv, results, (r) => ({
				'Date': new Date(r.created_at).toLocaleDateString(),
				'Repo': r.repo,
				'Branch': r.branch,
				'Firmware': r.name,
				'Size': formatBytes(r.size)
			}));
			break;
		}
		case 'build': {
			logInfo(`Triggering build in ${argv.repo}...`);
			await client.startBuild();
			logInfo('Build started! Check GitHub Actions tab.');
			break;
		}
		case 'changelog': {
			logInfo('Fetching changelog...');
			const log = await client.getChangelog();
			logInfo(`\nChanges from ${log.from} to ${log.to}:`);
			if (log.messages.length === 0)
				logInfo('No changes (versions are identical).');
			else
				log.messages.forEach(msg => console.log(`- ${msg}`));
			break;
		}
		case 'upgrade': {
			logInfo('WARNING: This will download the latest artifact and flash your router.');
			logInfo('Do not turn off power!');
			await client.startUpgrade();
			logInfo('Upgrade process started. Router is rebooting...');
			break;
		}
	}
});

// --- SYSTEM ---

cli.command('reboot', 'Reboot the router', {}, async (/** @type {ArgumentsCamelCase<CommonArgs>} */ argv) => {
	const client = getClient(argv);
	logInfo('Sending reboot command...');
	await client.startReboot();
	logInfo('Reboot command sent.');
});

cli.fail((msg, err, yargs) => {
	if (err)
		console.error(err.message);
	else if (msg && !(args.length === 1 && args[0] === 'firmware'))
		console.error(msg);
	else
		yargs.showHelp();
	process.exit(1);
});

cli
	.demandCommand(1, '')
	.recommendCommands()
	.help().alias('h', 'help')
	.version().alias('v', 'version')
	.parse();
