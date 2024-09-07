
import path from 'path';
import fs from 'fs';
import ini from 'ini';
import ssh from 'ssh2';
import jszip from 'jszip';

export class Padavan {
	constructor(credentials={}) {
		this.credentials = credentials;
	};
	exec(SystemCmd) {
		/* return this.router('apply.cgi', {
			SystemCmd,
			action_mode: ' SystemCmd '
		}, 'POST').then(res => this.router('console_response.asp').then(res => res.text())); */
		return new Promise((res, rej) => {
			const stdout = [];
			const stderr = [];
			const conn = new ssh.Client();
			conn.on('error', rej);
			conn.on('ready', () => {
				conn.exec(SystemCmd, (err, stream) => {
					if (err)
						return rej(err);
					stream.on('close', (code, signal) => {
						conn.end();
						if (code)
							return rej({
								code,
								message: stderr.join('')
							});
						return res(stdout.join(''))
					}).on('data', chunk => stdout.push(chunk)).stderr.on('data', chunk => stderr.push(chunk));
				});
			}).connect({
				host: this.credentials.host,
				username: this.credentials.username,
				password: this.credentials.password
			});
		});
	};
	nvram(key, value) {
		if (key) {
			if (value === undefined)
				return this.exec(`nvram get ${key}`).then(value => value.slice(0, -1));
			else if (value === null)
				return this.exec(`nvram set ${key}`);
			else
				return this.exec(`nvram set ${key}=${value}`);
		}else
			return this.exec('nvram showall').then(ini.parse);
	};
	async setParams(data) {
		if (!data || !Object.keys(data).length)
			throw new Error('Input data missing');
		if (data.sid_list) {
			if (!data.action_mode)
				data.action_mode = ' Apply ';
			return this.router('start_apply.htm', data, 'POST').then(res => res.text()).then(text => text.includes('<script>done_committing();</script>'));
		}else
			return Promise.all(Object.entries(data).map(([ key, value ]) => this.nvram(key, value))).then(() => {
				return this.exec('nvram commit').then(() => true);
			});
	};
	getParams(keys) {
		return this.nvram().then(nvram => {
			if (!keys)
				return nvram;
			return Object.fromEntries([].concat(keys).map(key => [ key, nvram[key] ]));
		});
	};
	getLog() {
		return this.router('log_content.asp').then(res => res.text());
	};
	getStatus() {
		return this.router('system_status_data.asp').then(res => res.text()).then(text => {
			return JSON.parse(
				text.slice(11, -1)
				.replace(new RegExp('(\\w+):\\s', 'g'), '"$1": ')
				.replace(new RegExp('0x([0-9a-fA-F]+)', 'g'), (match, hex) => parseInt(hex, 16))
			);
		});
	};
	getHistory() {
		// return this.exec('cat /var/spool/rstats-history.js').then(text => {
		return this.router('Main_TrafficMonitor_daily.asp').then(res => res.text()).then(text => {
			text = text.substring(text.indexOf('netdev'));
			text = text.substring(0, text.indexOf('\n\n'));
			text = text.trim()
				.replace(new RegExp('\'', 'g'), '"')
				.replace(new RegExp('^(.*) =', 'gm'), '"$1":')
				.replace(new RegExp(';', 'g'), ',')
				.replace(new RegExp(',$', 'g'), '')
				.replace(new RegExp('0x([0-9a-fA-F]+)', 'g'), (match, hex) => parseInt(hex, 16));
			const json = JSON.parse('{'+text+'}');
			for (var k in json) {
				if (k.endsWith('_history'))
					json[k].forEach(stat => {
						stat[0] = [(((stat[0] >> 16) & 0xFF) + 1900), ((stat[0] >>> 8) & 0xFF), (stat[0] & 0xFF)];
					});
			}
			return json;
		});
	};
	getDevices() {
		// cat /tmp/static_ip.inf
		// cat /proc/net/arp
		// arp -a
		return this.router('device-map/clients.asp').then(res => res.text()).then(text => {
			const ipmonitor = JSON.parse(text.match(new RegExp('^var ipmonitor = (.*?);$', 'm'))[1]);
			const wireless = JSON.parse(text.match(new RegExp('^var wireless = (.*?);$', 'm'))[1]);
			return ipmonitor.filter(device => device[5] !== '1').map(device => ({
				name: device[2],
				ip: device[0],
				mac: device[1],
				rssi: wireless[device[1]]
			}));
		});
	};
	router(path, body, method) {
		return fetch(`http://${this.credentials.host}/${path}`, {
			method,
			headers: {
				authorization: 'Basic '+btoa(this.credentials.username+':'+this.credentials.password)
			},
			body: (body?.constructor.name === 'Object') ? new URLSearchParams(body) : body
		}).then(res => {
			if (!res.ok)
				return Promise.reject({
					message: res.statusText,
					code: res.status
				});
			return res;
		});
	};
	github(path, body, method, headers={}) {
		if (!path)
			path = `https://api.github.com/repos/${this.credentials.repo}`;
		else if (!path.startsWith('http'))
			path = `https://api.github.com/repos/${this.credentials.repo}/${path}`;
		if (body) {
			if (method === 'POST')
				body = JSON.stringify(body);
			else{
				path += '?'+new URLSearchParams(body);
				body = null;
			}
		}
		if (this.credentials.token)
			headers.authorization = `Bearer ${this.credentials.token}`;
		return fetch(path, { method, headers, body }).then(res => {
			if (!res.ok)
				return Promise.reject({
					message: res.statusText,
					code: res.status
				});
			return res;
		});
	};
	getCommits(repo, page=1, per_page=100) {
		return fetch(`https://gitlab.com/api/v4/projects/${repo}/repository/commits?`+new URLSearchParams({ page, per_page })).then(res => res.json());
	};
	getWorkflowId() {
		return this.github('actions/workflows').then(res => res.json()).then(json => {
			return json.workflows?.find(workflow => workflow.path.endsWith('build.yml'))?.id;
		});
	};
	async getRunId(id, code='success', per_page='1') {
		if (!id)
			id = await this.getWorkflowId();
		return this.github(`actions/workflows/${id}/runs`, {
			status: 'success',
			branch: this.credentials.branch || 'main',
			per_page: 1
		}).then(res => res.json()).then(json => json.workflow_runs[0]?.id);
	};
	async getArtifact(id) {
		if (!id)
			id = await this.getRunId();
		return this.github(`actions/runs/${id}/artifacts`).then(res => res.json()).then(json => {
			const artifact = json.artifacts?.find(artifact => !artifact.expired);
			if (artifact)
				return artifact;
			throw new Error('Firmware not found');
		});
	};
	async getChangelog(from_id, to_id) {
		if (!from_id)
			from_id = (await this.nvram('firmver_sub')).split('_')[1];
		if (!to_id)
			to_id = (await this.getArtifact())?.name.split('-').slice(-1)[0];
		if (to_id.length > 7)
			to_id = to_id.slice(0, 7);
		if (from_id != to_id)
			return this.github('contents/variables', undefined, undefined, {
				accept: 'application/vnd.github.raw+json'
			}).then(res => res.text()).then(text => {
				let [ padavan_repo ] = text.match(new RegExp('^PADAVAN_REPO="(.*?)"$', 'm'))?.slice(1) || [];
				if (!padavan_repo)
					throw new Error('PADAVAN_REPO not found in variables');
				const firstSlashIndex = padavan_repo.indexOf('/', padavan_repo.indexOf('//') + 2);
				const host = padavan_repo.substring(padavan_repo.indexOf('//') + 2, firstSlashIndex);
				if (host !== 'gitlab.com')
					throw new Error('Currently only gitlab.com is supported');
				padavan_repo = encodeURIComponent(padavan_repo.substring(firstSlashIndex + 1, padavan_repo.length - 4));
				const data = [];
				return this.getCommits(padavan_repo).then(arr => {
					for (const json of arr) {
						if (json.id.startsWith(from_id))
							break;
						if (json.id.startsWith(to_id) || data.length)
							data.push(json.title);
					}
					return { from_id, to_id, data };
				});
			});
	};
	startReboot() {
		return this.exec('reboot');
	};
	startSpeedTest() {
		const shell = fs.readFileSync(path.join(import.meta.dirname, 'services', 'speedtest.sh')).toString();
		return this.exec(shell).then(ini.parse).then(res => ({
			networkDownloadSpeedMbps: Number(parseFloat(res.download / 125000).toFixed(2)),
			networkUploadSpeedMbps: Number(parseFloat(res.upload / 125000).toFixed(2))
		}));
	};
	async startBuild(id) {
		if (!id)
			id = await this.getWorkflowId();
		return this.github(`actions/workflows/${id}/dispatches`, {
			ref: this.credentials.branch || 'main'
		}, 'POST').then(() => id);
	};
	async startUpgrade(id) {
		if (!id)
			id = (await this.getArtifact())?.id;
		return this.github(`actions/artifacts/${id}/zip`).then(res => res.arrayBuffer()).then(jszip.loadAsync).then(zip => {
			const [ firmware, config ] = Object.values(zip.files);
			return firmware.async('blob').then(blob => {
				const data = new FormData();
				data.append('file', blob, firmware.name);
				return this.router('upgrade.cgi', data, 'POST').then(res => res.text()).then(text => text.includes('showUpgradeBar'));
			});
		});
	};
	async getForks(page=1, result=[]) {
		const repo = await this.github().then(res => res.json());
		const source = repo.source?.full_name || repo.full_name;
		const res = await this.github(`https://api.github.com/repos/${source}/forks`, {
			page,
			per_page: 100
		});
		const forks = await res.json();
		result.push(...forks);
		if (res.headers.get('Link')?.includes('rel="next"'))
			return await this.getForks(page + 1, result);
		return result;
	};
	async find(id) {
		if (!id)
			id = await this.nvram('productid');
		console.log('get forks list');
		return this.getForks().then(async forks => {
			const result = [];
			for (const fork of forks) {
				try {
					console.log(`get artifacts: ${fork.full_name}`);
					const res = await this.github(`https://api.github.com/repos/${fork.full_name}/actions/artifacts`);
					const { artifacts } = await res.json();
					result.push(...artifacts.filter((artifact, i) => {
						return artifacts.findIndex(cur => artifact.workflow_run.head_branch === cur.workflow_run.head_branch) === i;
					}).filter(artifact => artifact.name.includes(id)).map(artifact => {
						return {
							repo: fork.full_name,
							branch: artifact.workflow_run.head_branch,
							active: !artifact.expired,
							created_at: artifact.created_at,
							name: artifact.name
						};
					}));
				} catch (e) {
					console.error(e);
				}
			}
			return result;
		});
	};
};
export default Padavan;
