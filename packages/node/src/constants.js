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

/** Время жизни кэша NVRAM в миллисекундах. */
export const NVRAM_CACHE_TTL = 3_000;

/**
 * Режимы действия для apply.cgi.
 * @typedef {(typeof SYSTEM_ACTION)[keyof typeof SYSTEM_ACTION]} SystemAction
 */
export const SYSTEM_ACTION = /** @type {const} */ ({
	/** Полная перезагрузка роутера */
	REBOOT: ' Reboot ',
	/** Выключение роутера */
	SHUTDOWN: ' Shutdown ',
	/** Очистить системный лог */
	CLEAR_LOG: ' ClearLog ',
	/** Выполнить системную команду */
	SYSTEM_CMD: ' SystemCmd ',
	/** Сохранить NVRAM во флеш-память */
	COMMIT_FLASH: ' CommitFlash ',
	/** Сброс настроек к заводским */
	RESTORE_NVRAM: ' RestoreNVRAM ',
	/** Восстановить /etc/storage из сжатого файла */
	RESTORE_STORAGE: ' RestoreStorage ',
	/** Сбросить кэши памяти */
	FREE_MEMORY: ' FreeMemory ',
	/** Принудительная синхронизация времени */
	NTP_SYNC_NOW: ' NTPSyncNow ',
	/** Генерировать сертификат для HTTPS */
	CREATE_CERT_HTTPS: ' CreateCertHTTPS ',
	/** Проверка наличия SSL сертификата */
	CHECK_CERT_HTTPS: ' CheckCertHTTPS ',
	/** Генерировать ключи/сертификаты для OpenVPN сервера */
	CREATE_CERT_OVPNS: ' CreateCertOVPNS ',
	/** Экспорт конфига OpenVPN клиента */
	EXPORT_CONF_OVPNC: ' ExportConfOVPNC ',
	/** Экспорт конфига WireGuard */
	EXPORT_WG_CONF: ' ExportWGConf ',
	/** Действия WireGuard (требует доп. параметр action: genkey, pubkey, genpsk). */
	WG_ACTION: ' wg_action '
});

/**
 * Режимы действия для start_apply.htm.
 * @typedef {(typeof CONFIG_ACTION)[keyof typeof CONFIG_ACTION]} ConfigAction
 */
export const CONFIG_ACTION = /** @type {const} */ ({
	/** Применить настройки (без перезагрузки всего роутера, если возможно) */
	APPLY: ' Apply ',
	/** Применить настройки с явным перезапуском связанных сервисов */
	RESTART: ' Restart ',
	/** Добавить запись в список (используется с group_id) */
	ADD: ' Add ',
	/** Удалить запись из списка (используется с group_id) */
	DEL: ' Del ',
	/** Используется в связке с action_script (например, для обновления DDNS или статуса принтера) */
	UPDATE: 'Update'
});

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

/**
 * Диапазоны Wi-Fi.
 * @typedef {(typeof WIFI_BANDS)[number]} WifiBand
 */
export const WIFI_BANDS = /** @type {const} */ (['2.4', '5']);

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
	/** Обработчик мгновенных действий (Reboot, Shell, AJAX) без редиректа */
	APPLY: 'apply.cgi',
	/** Обработчик применения настроек с сохранением NVRAM и перезапуском сервисов */
	START_APPLY: 'start_apply.htm'
};
