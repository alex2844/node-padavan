#!/usr/bin/env bun
// #!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import Padavan from '../src/index.js';
import { DEFAULT_HTTP_CONFIG } from '../src/constants.js';

const printOutput = (argv, data, tableTransform = null) => {
	if (argv.json)
		console.log(JSON.stringify(data, null, 2));
	else {
		let outputData = data;
		if (tableTransform) {
			if (Array.isArray(data))
				outputData = data.map(tableTransform);
			else
				outputData = tableTransform(data);
		}
		if (Array.isArray(outputData) && outputData.length > 0)
			console.table(outputData);
		else if (typeof outputData === 'object' && outputData !== null)
			console.table(outputData);
		else
			console.log(outputData);
	}
};

const getClient = (argv) => {
	const logLevel = argv.verbose ? 'debug' : 'error';
	return new Padavan({ credentials: argv, logLevel });
};

let args = hideBin(process.argv);
// if (args.length === 0) args = ['firmware', 'search', '--verbose'];
const cli = yargs(args)
	.env('PADAVAN')
	.option('host', { type: 'string', describe: 'Router IP', default: DEFAULT_HTTP_CONFIG.host })
	.option('port', { type: 'number', describe: 'Port', default: DEFAULT_HTTP_CONFIG.port })
	.option('user', { type: 'string', describe: 'Username', default: DEFAULT_HTTP_CONFIG.username })
	.option('password', { type: 'string', describe: 'Password', default: DEFAULT_HTTP_CONFIG.password })
	.option('verbose', { type: 'boolean', describe: 'Show debug logs' })
	.option('json', { type: 'boolean', describe: 'Output result as JSON', default: false });

// --- STATUS & INFO ---

cli.command('status', 'Get system status', {}, async (argv) => {
	const status = await getClient(argv).getStatus();
	const toMB = (kb) => (parseInt(kb) / 1024).toFixed(1) + ' MB';
	printOutput(argv, status, (s) => ({
		'Uptime': `${s.uptime.days}d ${s.uptime.hours}h ${s.uptime.minutes}m`,
		'Load Avg': s.lavg,
		'RAM Free': toMB(s.ram.free),
		'RAM Used': toMB(s.ram.used),
		'RAM Total': toMB(s.ram.total)
	}));
});

cli.command('devices', 'List connected devices', {}, async (argv) => {
	const client = getClient(argv);
	const devices = await client.getDevices();
	printOutput(argv, devices);
});

cli.command('log', 'Get system log', {}, async (argv) => {
	const client = getClient(argv);
	const log = await client.getLog();
	console.log(log);
});

cli.command('traffic', 'Get traffic history', {}, async (argv) => {
	const client = getClient(argv);
	const history = await client.getHistory();
	console.log('Daily History (Last 5):');
	console.table(history.daily.slice(0, 5));
	console.log('Monthly History (Last 5):');
	console.table(history.monthly.slice(0, 5));
});

// --- WIFI DOCTOR ---

cli.command('scan [band]', 'Scan Wi-Fi networks', (yargs) => {
	return yargs.positional('band', { choices: ['2.4', '5'], default: '2.4' });
}, async (argv) => {
	const client = getClient(argv);
	const networks = await client.startScan(argv.band);
	printOutput(argv, networks, (n) => ({
		SSID: n.ssid,
		Channel: n.channel,
		RSSI: n.rssi + '%',
		BSSID: n.bssid
	}));
});

cli.command('doctor [band]', 'Analyze Wi-Fi environment and recommend channel', (yargs) => {
	return yargs.positional('band', { choices: ['2.4', '5'], default: '2.4' });
}, async (argv) => {
	const client = getClient(argv);
	console.log(`Scanning and analyzing ${argv.band}GHz spectrum...`);
	const result = await client.getBestChannel(argv.band);
	printOutput(argv, result, (r) => ({
		'Current': r.currentChannel,
		'Best': r.bestChannel,
		'Optimal?': r.isCurrentOptimal ? 'Yes' : 'No',
		'Reason': r.reason
	}));
});

// --- PARAMS (NVRAM) ---

cli.command('params [keys..]', 'Get NVRAM parameters', {}, async (argv) => {
	const client = getClient(argv);
	try {
		const params = await client.getParams(argv.keys);
		printOutput(argv, params);
	} catch (e) {
		console.error(e.message);
		process.exit(1);
	}
});

cli.command('set <pairs..>', 'Set NVRAM parameters (key=value)', (yargs) => {
	return yargs
		.option('sid', { type: 'string', describe: 'Service ID to apply changes (e.g. WLANConfig11b;)' })
		.example('$0 set rt_ssid=MyWifi rt_channel=6 --sid "WLANConfig11b;"', 'Change Wi-Fi settings');
}, async (argv) => {
	const client = getClient(argv);
	const params = {};
	argv.pairs.forEach(p => {
		const [k, ...v] = p.split('=');
		if (k) params[k] = v.join('=');
	});
	
	try {
		await client.setParams(params, { sid_list: argv.sid });
		console.log('OK');
	} catch (e) {
		console.error(e.message);
		process.exit(1);
	}
});

// --- FIRMWARE ---

cli.command('firmware <action>', 'Manage firmware', (yargs) => {
	return yargs
		.positional('action', { choices: ['check', 'changelog', 'build', 'upgrade', 'search'] })
		.option('repo', { type: 'string', describe: 'GitHub Owner/Repo with firmware actions' })
		.option('branch', { type: 'string', describe: 'Branch name', default: 'main' })
		.option('token', { type: 'string', describe: 'GitHub Personal Access Token' })
		.option('model', { type: 'string', describe: 'Model filter for search' });
}, async (argv) => {
	if (!argv.repo) {
		console.error('Error: --repo is required for firmware operations (or PADAVAN_REPO env var)');
		process.exit(1);
	}
	const client = getClient(argv);
	try {
		switch (argv.action) {
			case 'search': {
				break;
			}
			case 'build': {
				console.log(`Triggering build in ${argv.repo} (${argv.branch})...`);
				await client.startBuild();
				console.log('Build started! Check GitHub Actions tab.');
				break;
			}
			case 'changelog': {
				const log = await client.getChangelog();
				console.log(`\nChanges from ${log.from} to ${log.to}:`);
				if (log.messages.length === 0) {
					console.log('No changes (versions are identical).');
				} else {
					log.messages.forEach(msg => console.log(`- ${msg}`));
				}
				break;
			}
			case 'upgrade': {
				console.log('WARNING: This will download the latest artifact and flash your router.');
				console.log('Do not turn off power!');
				await client.startUpgrade();
				console.log('Upgrade process started. Router is rebooting...');
				break;
			}
		}
	} catch (e) {
		console.error(e.message);
		process.exit(1);
	}
});

// --- SYSTEM ---

cli.command('reboot', 'Reboot the router', {}, async (argv) => {
	const client = getClient(argv);
	try {
		await client.startReboot();
		console.log('Reboot command sent.');
	} catch (e) {
		console.error(e.message);
		process.exit(1);
	}
});

cli
	.demandCommand(1, '')
	.recommendCommands()
	.showHelpOnFail(args.length === 0)
	.help().alias('h', 'help')
	.version().alias('v', 'version')
	.parse();
