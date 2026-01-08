import { Buffer } from 'buffer';
import { DEFAULT_HTTP_CONFIG } from '../constants.js';

/**
 * @typedef {Object} Config
 * @property {string} [host] IP-адрес или хостнейм роутера.
 * @property {number} [port] Порт веб-интерфейса.
 * @property {string} [username] Имя пользователя для входа в роутер.
 * @property {string} [password] Пароль администратора.
 */

/**
 * Класс для HTTP взаимодействия с роутером.
 * Реализует Basic Authentication.
 */
export default class HttpClient {
	/**
	 * Конфигурация для подключения.
	 * @type {Config}
	 */
	#config = {};

	#logger;

	/**
	 * @param {Config} config
	 * @param {function(string, ...any): void} logger
	 */
	constructor(config, logger) {
		this.#config = { ...DEFAULT_HTTP_CONFIG, ...config };
		this.#logger = logger;
	};

	/**
	 * Генерирует заголовок авторизации.
	 * @returns {string}
	 */
	get #authHeader() {
		const { username, password } = this.#config;
		return 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');
	};

	/**
	 * Базовый URL.
	 * @returns {string}
	 */
	get #baseUrl() {
		const { host, port } = this.#config;
		const portSuffix = port === 80 ? '' : `:${port}`;
		return `http://${host}${portSuffix}`;
	};

	/**
	 * Выполняет HTTP запрос к роутеру.
	 * @param {string} path Путь относительно хоста.
	 * @param {RequestInit} [options] Опции для fetch.
	 * @returns {Promise<string>} Текстовый ответ сервера.
	 */
	async request(path, options = {}) {
		const url = `${this.#baseUrl}/${path}`;
		try {
			const res = await fetch(url, {
				...options,
				headers: {
					'Authorization': this.#authHeader,
					...options.headers
				}
			});
			if (!res.ok) {
				if (res.status === 401)
					throw new Error('Authentication failed');
				throw new Error(`HTTP ${res.status} ${res.statusText}`);
			}
			return await res.text();
		} catch (err) {
			const method = options.method || 'GET';
			this.#logger('error', `HTTP ${method} ${path} failed:`, err);
			throw err;
		}
	};

	/**
	 * Выполняет GET запрос.
	 * @param {string} path Путь относительно хоста (например 'device-map/clients.asp').
	 * @returns {Promise<string>} Текстовый ответ сервера.
	 */
	async get(path) {
		return this.request(path);
	};

	/**
	 * Выполняет POST запрос с данными формы (application/x-www-form-urlencoded).
	 * @param {string} path Путь относительно хоста.
	 * @param {Record<string, any>} data Объект с данными для отправки.
	 * @returns {Promise<string>} Текстовый ответ сервера.
	 */
	async post(path, data) {
		return this.request(path, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			body: new URLSearchParams(data)
		});
	};

	/**
	 * Выполняет загрузку файла (multipart/form-data).
	 * @param {string} path Путь относительно хоста.
	 * @param {FormData} formData Объект FormData с файлом.
	 * @returns {Promise<string>} Текстовый ответ сервера.
	 */
	async postFile(path, formData) {
		return this.request(path, {
			method: 'POST',
			body: formData
		});
	};
};
