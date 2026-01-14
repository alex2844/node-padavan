/** Идентификатор библиотеки для debuglog. */
export const LIB_ID = 'padavan';

/**
 * Уровни логирования.
 * @enum {number}
 */
export const LOG_LEVELS = /** @type {const} */ ({
	none: 0,
	error: 1,
	warn: 2,
	info: 3,
	debug: 4
});

/** Уровень логирования по умолчанию. */
export const DEFAULT_LOG_LEVEL = 'none';

/** Репозиторий с прошивками по умолчанию. */
export const DEFAULT_FIRMWARE_REPO = 'alex2844/node-padavan';

/** Конфигурация HTTP клиента по умолчанию. */
export const DEFAULT_HTTP_CONFIG = {
	host: '192.168.1.1',
	port: 80,
	username: 'admin',
	password: 'admin'
};

/**
 * Режимы действия для apply.cgi.
 * Обратите внимание: большинство команд требуют пробелы по краям.
 * @typedef {(typeof ACTION_MODE)[number]} ActionMode
 */
export const ACTION_MODE = /** @type {const} */ ([
	' Apply ', ' Restart ', ' Reboot ', ' Shutdown ',
	' Add ', ' Del ', ' ClearLog ', ' SystemCmd ',
	' CommitFlash ', ' RestoreNVRAM ', ' RestoreStorage ', ' FreeMemory ',
	' NTPSyncNow ', ' CreateCertHTTPS ', ' CheckCertHTTPS ',
	' CreateCertOVPNS ', ' ExportConfOVPNC ', ' ExportWGConf ',
	' wg_action ', 'Update'
]);

/**
 * Идентификаторы сервисов (Service ID).
 * Используются для уведомления демонов (rc) о необходимости перечитать конфиги.
 * @typedef {(typeof SERVICE_ID)[number]} ServiceId
 */
export const SERVICE_ID = /** @type {const} */ ([
	'General', 'LANHostConfig', 'IPConnection', 'PPPConnection', 'FirewallConfig', 'RouterConfig',
	'WLANConfig11a', 'WLANConfig11b', 'WLANAuthentication11a', 'WLANAuthentication11b',
	'Storage', 'IP6Connection', 'Layer3Forwarding'
]);

/**
 * Идентификаторы групп для списков (NVRAM Lists).
 * Ообязателен, если action_mode=' Add ' или ' Del '.
 * @typedef {(typeof GROUP_ID)[number]} GroupId
 */
export const GROUP_ID = /** @type {const} */ ([
	'ManualDHCPList', 'VSList', 'GWStatic', 'UrlList', 'MFList',
	'ACLList', 'rt_ACLList', 'RBRList', 'rt_RBRList',
	'LWFilterList', 'VPNSACLList'
]);

/** Системные команды роутера. */
export const COMMANDS = {
	NVRAM_SHOW: 'nvram showall'
};

/** Список используемых страниц веб-интерфейса. */
export const PAGES = {
	/** Основной список клиентов (ARP + Wireless) */
	CLIENTS: 'device-map/clients.asp',
	/** Логи драйвера 2.4GHz */
	WIFI_2G: 'Main_WStatus2g_Content.asp',
	/** Логи драйвера 5GHz */
	WIFI_5G: 'Main_WStatus_Content.asp',
	/** Инициация сканирования 2.4GHz */
	SCAN_2G: 'wds_aplist_2g.asp',
	/** Инициация сканирования 5GHz */
	SCAN_5G: 'wds_aplist.asp',
	/** Текущий статус системы (JSON-like) */
	STATUS: 'system_status_data.asp',
	/** История трафика */
	TRAFFIC: 'Main_TrafficMonitor_daily.asp',
	/** Результат выполнения системной команды */
	CONSOLE_RESPONSE: 'console_response.asp',
	/** Системный журнал */
	SYSLOG: 'Main_LogStatus_Content.asp',
	/** Страница обновления прошивки (POST) */
	UPGRADE: 'upgrade.cgi',
	/** Основная точка входа для применения настроек (POST) */
	APPLY: 'apply.cgi'
};
