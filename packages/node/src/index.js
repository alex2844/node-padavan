import { debuglog, inspect } from 'util';
import jszip from 'jszip';
import HttpClient from './transport/http.js';
import GitHubClient from './transport/github.js';
import {
	parsePageInputs, parseNvramOutput, parseLooseJson, normalizeTrafficHistory,
	extractJsVariable, extractTextareaValue, extractMacsFromTextarea, extractCurrentChannel
} from './utils/parsers.js';
import { LOG_LEVELS, DEFAULT_LOG_LEVEL, LIB_ID, PAGES, COMMANDS } from './constants.js';
/** @import { Config as HttpConfig } from './transport/http.js' */
/** @import { Config as GithubConfig } from './transport/github.js' */
/** @typedef {HttpConfig & GithubConfig} Credentials */

/**
 * @typedef {Object} Config
 * @property {Credentials} [credentials] Учетные данные.
 * @property {('none'|'error'|'warn'|'info'|'debug')} [logLevel='none'] Уровень детализации логов.
 */

/**
 * @typedef {Object} Device
 * @property {string} mac MAC-адрес устройства.
 * @property {string} ip IP-адрес устройства.
 * @property {string|null} hostname Имя хоста.
 * @property {'eth'|'wifi'|'2.4GHz'|'5GHz'} type Тип подключения.
 */

/**
 * @typedef {Object} WifiNetwork
 * @property {string} ssid Имя сети (SSID).
 * @property {string} bssid MAC-адрес точки доступа (BSSID).
 * @property {number} channel Номер канала.
 * @property {number} rssi Уровень сигнала (качество в %).
 */

/**
 * @typedef {Object} ChannelAnalysis
 * @property {number} currentChannel Текущий канал.
 * @property {number} bestChannel Рекомендуемый канал.
 * @property {boolean} isCurrentOptimal Является ли текущий канал оптимальным.
 * @property {number} score Условный рейтинг загруженности рекомендуемого канала (меньше = лучше).
 * @property {Record<number, number>} ratings Рейтинг всех проверенных каналов { канал: штраф }.
 * @property {string} reason Текстовое пояснение рекомендации.
 */

/**
 * @typedef {Object} SetParamsOptions
 * @property {string} [current_page] Текущая страница (для эмуляции поведения браузера).
 * @property {string} [next_page] Следующая страница (для редиректа).
 * @property {string} [sid_list] Список сервисов для перезапуска (например 'WLANConfig11b;'). Если не указан, библиотека попытается найти его на странице `current_page`.
 * @property {string} [group_id] ID группы (требуется для некоторых списков).
 * @property {' Apply '|' Restart '} [action_mode=' Apply '] Режим действия.
 */

/**
 * Основной класс для управления роутером с прошивкой Padavan.
 * Работает через HTTP/Web-интерфейс.
 */
export default class Padavan {
	/**
	 * Экземпляр debuglog для вывода отладочной информации при NODE_DEBUG=LIB_ID.
	 */
	#debugLog;

	/**
	 * Флаг, указывающий, включен ли вывод через NODE_DEBUG=LIB_ID.
	 * @type {boolean}
	 */
	#isDebugEnvEnabled = false;

	/**
	 * Числовой уровень логирования, установленный через конструктор.
	 * @type {number}
	 */
	#logLevelNumber = LOG_LEVELS[DEFAULT_LOG_LEVEL];

	/**
	 * Экземпляр класса HttpClient.
	 * @type {HttpClient|undefined}
	 */
	#http;

	/**
	 * Экземпляр класса GitHub.
	 * @type {GitHubClient|undefined}
	 */
	#github;

	/**
	 * Конфигурация для подключения.
	 * @type {Config}
	 */
	config = null;

	/**
	 * Конструктор класса Padavan.
	 * @param {Config} config Конфигурация для подключения.
	 */
	constructor(config = {}) {
		this.config = config;
		this.#debugLog = debuglog(LIB_ID);
		this.#isDebugEnvEnabled = process.env.NODE_DEBUG && new RegExp(`\\b${LIB_ID}\\b`, 'i').test(process.env.NODE_DEBUG);
		this.#logLevelNumber = LOG_LEVELS[config?.logLevel] || LOG_LEVELS[DEFAULT_LOG_LEVEL];
		this.#http = new HttpClient(this.config?.credentials, this.log.bind(this));
		this.#github = new GitHubClient(this.config?.credentials, this.log.bind(this));
		this.log('debug', 'Padavan instance created with config:', config);
	};

	/**
	 * Записывает лог-сообщение.
	 * Учитывает logLevel, установленный в конструкторе, и переменную окружения NODE_DEBUG=LIB_ID.
	 * @param {('error'|'warn'|'info'|'debug')} level Уровень сообщения.
	 * @param {...any} args Аргументы для логирования.
	 */
	log(level, ...args) {
		const prefix = `[${level.toUpperCase()}]`;
		this.#debugLog(prefix, ...args.map(arg => typeof arg === 'object' ? inspect(arg, { depth: null }) : arg));
		if (!this.#isDebugEnvEnabled && (LOG_LEVELS[level] <= this.#logLevelNumber))
			console[level](`[${LIB_ID}]`, prefix, ...args);
	};

	/**
	 * Выполняет системную команду через эмулятор консоли (HTTP).
	 * @param {string} command Команда (например, 'ls -la' или 'nvram show').
	 * @returns {Promise<string>} Вывод команды (stdout + stderr).
	 */
	async exec(command) {
		this.log('debug', `Executing command: ${command}`);
		if (!this.#http)
			throw new Error('HTTP client not initialized');
		try {
			await this.#http.post(PAGES.APPLY, {
				action_mode: ' SystemCmd ',
				SystemCmd: command
			});
			const response = await this.#http.get(PAGES.CONSOLE_RESPONSE);
			return response.trim();
		} catch (e) {
			this.log('error', `Command execution failed: ${command}`, e);
			throw e;
		}
	};

	/**
	 * Получает параметры роутера.
	 * Если указана страница, парсит HTML-поля ввода. Иначе выполняет `nvram show`.
	 * @param {string|string[]} [keys] Имя параметра или массив имен для фильтрации.
	 * @param {string} [page] Если указана страница (напр. 'Advanced_DHCP_Content.asp'), парсит её HTML.
	 * @returns {Promise<Record<string, string>|string>} Объект с параметрами или значение конкретного параметра.
	 */
	async getParams(keys, page = null) {
		let /** @type {Record<string, string>} */ allParams = {};
		if (page) {
			this.log('debug', `Fetching params from page: ${page}`);
			const html = await this.#http.get(page);
			allParams = parsePageInputs(html);
		} else {
			this.log('debug', 'Fetching params via NVRAM...');
			const output = await this.exec(COMMANDS.NVRAM_SHOW);
			allParams = parseNvramOutput(output);
		}
		if (!keys)
			return allParams;
		if (typeof keys === 'string')
			return allParams[keys];
		if (Array.isArray(keys)) {
			const /** @type {Record<string, string>} */ result = {};
			keys.forEach(k => {
				if (allParams[k] !== undefined)
					result[k] = allParams[k];
			});
			return result;
		}
		return allParams;
	};

	/**
	 * Устанавливает параметры роутера.
	 * Автоматически находит sid_list, если указан current_page.
	 * @param {Record<string, string|number>} params Параметры { key: value }.
	 * @param {SetParamsOptions} [options] Опции.
	 * @returns {Promise<boolean>}
	 */
	async setParams(params, options = {}) {
		const kvPairs = Object.entries(params);
		if (kvPairs.length === 0)
			return;

		let sidList = options.sid_list;
		const page = options.current_page || options.next_page;

		if (!sidList && page) {
			this.log('debug', `sid_list not provided, searching on ${page}...`);
			try {
				const html = await this.#http.get(page);
				const pageInputs = parsePageInputs(html);
				if (pageInputs['sid_list']) {
					sidList = pageInputs['sid_list'];
					this.log('debug', `Found sid_list: ${sidList}`);
				} else
					this.log('warn', `Could not find sid_list on ${page}`);
			} catch (e) {
				this.log('warn', `Failed to fetch ${page} for sid_list extraction`, e);
			}
		}

		this.log('info', `Setting params: ${Object.keys(params).join(', ')}`);
		if (sidList) {
			const data = {
				action_mode: options.action_mode || ' Apply ',
				sid_list: sidList,
				group_id: options.group_id || '',
				current_page: page || 'index.asp',
				next_page: options.next_page || page || 'index.asp',
				...params
			};
			try {
				await this.#http.post(PAGES.APPLY, data);
				return true;
			} catch (e) {
				this.log('debug', 'setParams (UI) finished', e.message);
				return true;
			}
		}

		this.log('warn', 'sid_list not found/provided. Using NVRAM fallback (requires reboot to apply).');
		const commands = kvPairs.map(([k, v]) => {
			const safeValue = String(v).replace(/'/g, "'\\''");
			return `nvram set ${k}='${safeValue}'`;
		});
		commands.push('nvram commit');

		await this.exec(commands.join('; '));
		return true;
	};

	/**
	 * Получает текущий статус системы (CPU, RAM, Uptime, LoadAvg).
	 * @returns {Promise<Object>}
	 */
	async getStatus() {
		this.log('debug', 'Fetching system status...');
		try {
			const html = await this.#http.get(PAGES.STATUS);
			const status = parseLooseJson(html);
			if (!status)
				throw new Error('Failed to parse system status data');
			return status;
		} catch (e) {
			this.log('error', 'getStatus failed:', e);
			throw e;
		}
	};

	/**
	 * Получает историю трафика (ежедневную и ежемесячную).
	 * @returns {Promise<{daily: any[], monthly: any[]}>}
	 */
	async getHistory() {
		this.log('debug', 'Fetching traffic history...');
		try {
			const html = await this.#http.get(PAGES.TRAFFIC);
			const rawDaily = extractJsVariable(html, 'daily_history');
			const rawMonthly = extractJsVariable(html, 'monthly_history');
			return {
				daily: normalizeTrafficHistory(rawDaily),
				monthly: normalizeTrafficHistory(rawMonthly)
			};
		} catch (e) {
			this.log('error', 'getHistory failed:', e);
			throw e;
		}
	};

	/**
	 * Получает системный журнал.
	 * @returns {Promise<string>} Текст лога.
	 */
	async getLog() {
		this.log('debug', 'Fetching system log...');
		if (!this.#http) throw new Error('HTTP client not initialized');

		try {
			const html = await this.#http.get(PAGES.SYSLOG);
			return extractTextareaValue(html);
		} catch (e) {
			const err = e instanceof Error ? e : new Error(String(e));
			this.log('error', 'getLog failed:', err);
			throw err;
		}
	};

	/**
	 * Получает список подключенных устройств.
	 * @returns {Promise<Device[]>}
	 */
	async getDevices() {
		this.log('debug', 'Fetching devices info via HTTP...');
		const [clientsHtml, wifi2gHtml, wifi5gHtml] = await Promise.all([
			this.#http.get(PAGES.CLIENTS),
			this.#http.get(PAGES.WIFI_2G),
			this.#http.get(PAGES.WIFI_5G)
		]);
		const ipmonitor = extractJsVariable(clientsHtml, 'ipmonitor') || [];
		const wirelessObj = extractJsVariable(clientsHtml, 'wireless') || {};

		const macs2g = new Set(extractMacsFromTextarea(wifi2gHtml));
		const macs5g = new Set(extractMacsFromTextarea(wifi5gHtml));
		const wirelessMacs = new Set(Object.keys(wirelessObj));

		return ipmonitor.map((/** @type {string[]} */ item) => {
			const ip = item[0];
			const mac = item[1]?.toUpperCase();
			const hostname = item[2];
			if (!mac)
				return null;

			let /** @type {Device['type']} */ type = 'eth';
			if (wirelessMacs.has(mac) || macs2g.has(mac) || macs5g.has(mac)) {
				if (macs5g.has(mac))
					type = '5GHz';
				else if (macs2g.has(mac))
					type = '2.4GHz';
				else
					type = 'wifi';
			}
			return { mac, ip, hostname, type };
		}).filter(Boolean);
	};

	/**
	 * Сканирование эфира.
	 * ВНИМАНИЕ: Если вы подключены по Wi-Fi к сканируемому диапазону, соединение разорвется.
	 * @param {'2.4'|'5'} [band='2.4'] Частотный диапазон.
	 * @returns {Promise<WifiNetwork[]>} Список найденных сетей, отсортированный по уровню сигнала.
	 */
	async startScan(band = '2.4') {
		this.log('info', `Starting Site Survey for ${band}GHz...`);
		const page = band === '5' ? PAGES.SCAN_5G : PAGES.SCAN_2G;
		let html;
		try {
			html = await this.#http.get(page);
		} catch (e) {
			this.log('error', `Scan failed due to connection loss. Are you connected via Wi-Fi to the same band?`, e.message);
			throw new Error('Connection lost during scan. Cannot retrieve results via Wi-Fi.');
		}

		const rawList = extractJsVariable(html, 'wds_aplist');
		if (!Array.isArray(rawList)) {
			this.log('warn', 'Scan returned empty or invalid data');
			return [];
		}

		return rawList.map(item => ({
			ssid: decodeURIComponent(item[0]),
			bssid: item[1].toUpperCase(),
			channel: parseInt(item[2], 10),
			rssi: parseInt(item[3], 10)
		})).filter(n => n.bssid && n.channel).sort((a, b) => b.rssi - a.rssi);
	};

	/**
	 * Анализирует эфир и предлагает лучший канал с учетом совместимости и региона.
	 * @param {'2.4'|'5'} [band='2.4'] Частотный диапазон.
	 * @param {WifiNetwork[]} [scanResults] Опционально: результаты сканирования.
	 * @returns {Promise<ChannelAnalysis>} Результат анализа.
	 */
	async getBestChannel(band = '2.4', scanResults = null) {
		const is24 = band === '2.4';
		const configPrefix = is24 ? 'rt' : 'wl';
		const statusPage = is24 ? PAGES.WIFI_2G : PAGES.WIFI_5G;

		const [settings, statusHtml] = await Promise.all([
			this.getParams([`${configPrefix}_channel`, `${configPrefix}_country_code`]),
			this.#http.get(statusPage)
		]);

		const configuredChannel = parseInt(settings[`${configPrefix}_channel`] || '0', 10);
		const countryCode = settings[`${configPrefix}_country_code`] || 'DB';

		let currentChannel = configuredChannel;
		if (currentChannel === 0) {
			const logText = extractTextareaValue(statusHtml);
			currentChannel = extractCurrentChannel(logText);
		}

		let /** @type {number[]} */ validChannels = [];
		let /** @type {number[]} */ safeChannels = [];

		if (is24) {
			const maxCh = (countryCode === 'US' || countryCode === 'CA') ? 11 : 13;
			for (let i = 1; i <= maxCh; i++)
				validChannels.push(i);
			safeChannels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
		} else {
			validChannels = [36, 40, 44, 48];
			safeChannels = [...validChannels];

			const dfsChannels = [52, 56, 60, 64, 100, 104, 108, 112, 116, 120, 124, 128, 132, 136, 140, 144];
			const highChannels = [149, 153, 157, 161, 165];

			if (['RU', 'US', 'CN', 'SG', 'AU', 'DB'].includes(countryCode)) {
				validChannels.push(...highChannels);
				safeChannels.push(...highChannels);
			}
			if (countryCode !== 'DB')
				validChannels.push(...dfsChannels);
		}

		if (validChannels.length === 0)
			return {
				currentChannel,
				bestChannel: 0,
				isCurrentOptimal: false,
				score: 0,
				ratings: {},
				reason: 'No channels available in this region'
			};

		const /** @type {Record<number, number>} */ channelScores = {};
		validChannels.forEach(ch => channelScores[ch] = 0);

		const networks = scanResults || await this.startScan(band);
		networks.forEach(net => {
			const penalty = net.rssi;
			if (is24) {
				for (let offset = -4; offset <= 4; offset++) {
					const targetCh = net.channel + offset;
					if (channelScores[targetCh] !== undefined) {
						const weight = 1 - (Math.abs(offset) * 0.2);
						if (weight > 0)
							channelScores[targetCh] += penalty * weight;
					}
				}
			} else {
				if (channelScores[net.channel] !== undefined)
					channelScores[net.channel] += penalty;
			}
		});

		// Штрафы за специфические типы каналов
		const PENALTY_UNSAFE = 25; // Для каналов с меньшей совместимостью (12-13)
		const PENALTY_DFS = 15; // Для DFS-каналов (требуют детекции радаров)

		validChannels.forEach(ch => {
			if (is24) {
				if (!safeChannels.includes(ch))
					channelScores[ch] += PENALTY_UNSAFE;
			} else {
				if (ch >= 52 && ch <= 144)
					channelScores[ch] += PENALTY_DFS;
			}
		});

		let bestChannel = validChannels[0];
		let minScore = Infinity;

		for (const ch of validChannels) {
			channelScores[ch] = Math.round(channelScores[ch]);
			if (channelScores[ch] < minScore) {
				minScore = channelScores[ch];
				bestChannel = ch;
			}
		}

		let isCurrentOptimal = false;
		let reason = '';

		if (validChannels.includes(currentChannel)) {
			const currentScore = channelScores[currentChannel];
			const improvementThreshold = Math.max(currentScore * 0.2, 15);

			if (currentChannel === bestChannel) {
				isCurrentOptimal = true;
				reason = 'Current channel is optimal';
			} else if ((currentScore - minScore) < improvementThreshold) {
				bestChannel = currentChannel;
				minScore = currentScore;
				isCurrentOptimal = true;
				reason = 'Current channel is OK, no need to change';
			} else
				reason = `Better channel found (interference: ${minScore} < ${currentScore})`;
		} else
			reason = 'Current channel is auto or not supported';

		if (is24 && !isCurrentOptimal) {
			const standardChannels = [1, 6, 11];
			const availableStandard = standardChannels.find(c => validChannels.includes(c));
			if (availableStandard && !standardChannels.includes(bestChannel)) {
				if (channelScores[availableStandard] <= minScore * 1.1) {
					bestChannel = availableStandard;
					minScore = channelScores[availableStandard];
					reason = `Channel ${availableStandard} selected (less interference with neighbors)`;
				}
			}
		}

		return {
			currentChannel,
			bestChannel,
			isCurrentOptimal,
			score: minScore,
			ratings: channelScores,
			reason
		};
	};

	/**
	 * Перезагрузка роутера через HTTP.
	 * @returns {Promise<boolean>}
	 */
	async startReboot() {
		this.log('warn', 'Rebooting router via HTTP...');
		try {
			await this.#http.post(PAGES.APPLY, {
				action_mode: ' Reboot '
			});
		} catch (e) {
			this.log('debug', 'Reboot request sent (network error expected)', e.message);
		}
		return true;
	};

	/**
	 * Запускает сборку прошивки в GitHub репозитории.
	 * Требует наличия `repo`, `branch`, `token` в credentials.
	 * @param {string} [workflowName='build.yml'] Имя файла workflow в `.github/workflows/`.
	 * @returns {Promise<boolean>}
	 */
	async startBuild(workflowName = 'build.yml') {
		this.log('info', `Triggering build in repository...`);
		try {
			await this.#github.startBuild(workflowName);
			this.log('info', 'Build successfully triggered.');
			return true;
		} catch (e) {
			this.log('error', 'Failed to start build:', e);
			throw e;
		}
	};

	/**
	 * Получает список изменений (changelog) между текущей прошивкой и последней доступной.
	 * @returns {Promise<{from: string, to: string, messages: string[]}>}
	 */
	async getChangelog() {
		this.log('debug', 'Fetching changelog...');
		try {
			const currentFirmware = /** @type {string} */ (await this.getParams('firmver_sub') || '');
			const fromId = (currentFirmware.split('_')[1] || '').substring(0, 7);

			const artifact = await this.#github.getLatestArtifact();
			const toIdMatch = artifact.name.match(/-([0-9a-f]{7,})$/);
			const toId = toIdMatch ? toIdMatch[1]?.substring(0, 7) : null;

			if (!fromId || !toId)
				throw new Error(`Could not determine firmware versions (current: ${fromId}, latest: ${toId})`);

			if (fromId === toId) {
				this.log('info', 'Firmware is up to date.');
				return { from: fromId, to: toId, messages: [] };
			}

			this.log('debug', 'Fetching build.conf to determine source repo...');
			const buildConf = await this.#github.getFileContent('build.conf');

			const repoMatch = buildConf.match(/^PADAVAN_REPO=["'](.*?)["']/m);
			if (!repoMatch)
				throw new Error('PADAVAN_REPO not found in build.conf');
			let sourceRepoUrl = repoMatch[1];
			this.log('debug', `Source repo identified: ${sourceRepoUrl}`);

			const messages = await this.#github.getCommitsBetween(sourceRepoUrl, fromId, toId);
			return { from: fromId, to: toId, messages };
		} catch (e) {
			this.log('error', 'Failed to get changelog:', e);
			throw e;
		}
	};

	/**
	 * Устанавливает последнюю доступную прошивку из репозитория.
	 * @returns {Promise<boolean>}
	 */
	async startUpgrade() {
		this.log('warn', `Starting firmware upgrade process...`);

		const artifact = await this.#github.getLatestArtifact();
		this.log('info', `Found latest firmware artifact: ${artifact.name}`);

		const buffer = await this.#github.downloadArtifact(artifact.id);
		this.log('debug', `Downloaded ${buffer.byteLength} bytes.`);

		const zip = await jszip.loadAsync(buffer);
		const firmwareFile = Object.values(zip.files).find(f => f.name.match(/\.(bin|trx)$/));
		if (!firmwareFile)
			throw new Error('Firmware file (.bin or .trx) not found in artifact');

		this.log('info', `Found firmware file in archive: ${firmwareFile.name}`);

		const firmwareBlob = await firmwareFile.async('blob');
		const formData = new FormData();
		formData.append('file', firmwareBlob, firmwareFile.name);

		this.log('info', `Uploading ${firmwareFile.name} to the router...`);
		const res = await this.#http.postFile(PAGES.UPGRADE, formData);
		if (res.includes('showUpgradeBar')) {
			this.log('info', 'Firmware uploaded successfully. Router is now flashing.');
			return true;
		}

		this.log('error', 'Firmware upload failed. Router response did not contain success marker.');
		throw new Error('Firmware upload failed');
	};
};
