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

/** Идентификатор библиотеки для debuglog. */
export const LIB_ID = 'padavan';

/** Конфигурация HTTP клиента по умолчанию. */
export const DEFAULT_HTTP_CONFIG = {
	host: '192.168.1.1',
	port: 80,
	username: 'admin',
	password: 'admin'
};

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
