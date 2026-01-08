/**
 * Парсит HTML страницу и извлекает значения всех полей ввода.
 * Поддерживает:
 * <input name="..." value="...">
 * <textarea name="...">value</textarea>
 * <select name="...">...<option selected>value</option>...</select>
 * @param {string} html Исходный HTML код страницы.
 * @returns {Record<string, string>} Словарь параметров { имя_поля: значение }.
 */
export function parsePageInputs(html) {
	const /** @type {Record<string, string>} */ params = {};

	// 1. Поиск <input name="..." value="...">
	const inputRegex = /<input[^>]+name=["']([^"']+)["'][^>]*value=["'](.*?)["']/gi;
	let match;
	while ((match = inputRegex.exec(html)) !== null) {
		params[match[1]] = match[2];
	}

	// 2. Поиск <input value="..." name="..."> (обратный порядок атрибутов)
	const inputRevRegex = /<input[^>]+value=["'](.*?)["'][^>]*name=["']([^"']+)["']/gi;
	while ((match = inputRevRegex.exec(html)) !== null) {
		params[match[2]] = match[1];
	}

	// 3. Поиск <textarea name="...">value</textarea>
	const textareaRegex = /<textarea[^>]+name=["']([^"']+)["'][^>]*>([\s\S]*?)<\/textarea>/gi;
	while ((match = textareaRegex.exec(html)) !== null) {
		params[match[1]] = match[2];
	}

	// 4. Поиск <select name="...">...</select>
	const selectRegex = /<select[^>]+name=["']([^"']+)["'][^>]*>([\s\S]*?)<\/select>/gi;
	while ((match = selectRegex.exec(html)) !== null) {
		const name = match[1];
		const content = match[2];
		const optionMatch = content.match(/<option[^>]+value=["']([^"']+)["'][^>]*selected/i);
		if (optionMatch)
			params[name] = optionMatch[1];
		else {
			const firstOption = content.match(/<option[^>]+value=["']([^"']+)["']/i);
			if (firstOption)
				params[name] = firstOption[1];
		}
	}
	return params;
};

/**
 * Извлекает значение JS переменной из исходного кода страницы.
 * Обрабатывает особенности синтаксиса Padavan (отсутствие кавычек у ключей, hex-числа).
 * @param {string} html Исходный HTML.
 * @param {string} varName Имя переменной (например, 'ipmonitor').
 * @returns {any} Распаршенный объект/массив или null.
 */
export function extractJsVariable(html, varName) {
	const regex = new RegExp(`(?:var\\s+)?${varName}\\s*=\\s*([\\{\\[][\\s\\S]*?[\\}\\]]);`);
	const match = html.match(regex);
	if (!match)
		return null;

	let jsonStr = match[1];
	try {
		jsonStr = jsonStr.replace(/'/g, '"');
		jsonStr = jsonStr.replace(/0x([0-9a-fA-F]+)/g, (_match, hex) => parseInt(hex, 16).toString());
		return JSON.parse(jsonStr);
	} catch (e) {
		return null;
	}
};

/**
 * Извлекает содержимое тега textarea из HTML.
 * @param {string} html Исходный HTML.
 * @returns {string} Содержимое textarea или пустая строка.
 */
export function extractTextareaValue(html) {
	const match = html.match(/<textarea[^>]*>([\s\S]*?)<\/textarea>/i);
	return match ? match[1].trim() : '';
};

/**
 * Извлекает MAC-адреса из содержимого textarea в HTML.
 * @param {string} html Исходный HTML.
 * @returns {string[]} Список MAC-адресов в верхнем регистре.
 */
export function extractMacsFromTextarea(html) {
	const macs = [];
	const content = extractTextareaValue(html);
	if (!content)
		return macs;
	const macRegex = /([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}/g;
	let match;
	while ((match = macRegex.exec(content)) !== null) {
		macs.push(match[0].toUpperCase());
	}
	return macs;
};

/**
 * Извлекает текущий канал из текстового лога Wireless Status.
 * Поддерживает форматы:
 * - "Channel : 13"
 * - "Channel Main : 13"
 * - "Central Channel : 36"
 * - "Primary Channel : 36"
 *
 * @param {string} text Содержимое лога.
 * @returns {number} Номер канала или 0.
 */
export function extractCurrentChannel(text) {
	if (!text)
		return 0;
	const regex = /(?:Central|Primary)?\s*Channel(?:\s+Main)?\s*:\s*(\d+)/i;
	const match = text.match(regex);
	return match ? parseInt(match[1], 10) : 0;
};

/**
 * Парсит вывод команды `nvram show`.
 * @param {string} text Текстовый вывод команды.
 * @returns {Record<string, string>} Словарь параметров.
 */
export function parseNvramOutput(text) {
	const /** @type {Record<string, string>} */ params = {};
	if (!text)
		return params;
	const lines = text.split('\n');
	for (const line of lines) {
		const eqIndex = line.indexOf('=');
		if (eqIndex > 0) {
			const key = line.substring(0, eqIndex);
			const value = line.substring(eqIndex + 1).replace(/\r$/, '');
			params[key] = value;
		}
	}
	return params;
};

/**
 * Декодирует дату из формата Padavan Traffic Monitor.
 * Формат: биты кодируют (Year << 16) | (Month << 8) | Day.
 * @param {number} n Закодированная дата.
 * @returns {number[]} Массив [Год, Месяц(0-11), День].
 */
function decodeTrafficDate(n) {
	return [
		((n >> 16) & 0xFF) + 1900,
		(n >>> 8) & 0xFF,
		n & 0xFF
	];
};

/**
 * Нормализует массив истории трафика в удобный формат объектов.
 * @param {Array[]} historyArray Массив вида [[dateInt, downBytes, upBytes], ...].
 * @returns {{date: Date, dateStr: string, download: number, upload: number}[]} Массив объектов истории.
 */
export function normalizeTrafficHistory(historyArray) {
	if (!Array.isArray(historyArray))
		return [];
	return historyArray.map(item => {
		const dateParts = decodeTrafficDate(item[0]);
		return {
			date: new Date(dateParts[0], dateParts[1], dateParts[2]),
			dateStr: `${dateParts[0]}-${String(dateParts[1] + 1).padStart(2, '0')}-${String(dateParts[2]).padStart(2, '0')}`,
			download: item[1],
			upload: item[2]
		};
	});
};

/**
 * Парсит "грязный" JSON-подобный объект JavaScript, который отдает Padavan.
 * Особенности: ключи без кавычек, использование HEX чисел.
 * @param {string} str Строка JS кода (например "var si_new = { ... };").
 * @returns {any} Распаршенный объект или null в случае ошибки.
 */
export function parseLooseJson(str) {
	try {
		// Убираем объявление переменной и точку с запятой
		let clean = str.replace(/^var\s+\w+\s*=\s*/, '').replace(/;$/, '');
		// Оборачиваем ключи в кавычки
		clean = clean.replace(/([a-zA-Z0-9_]+)\s*:/g, '"$1":');
		// Одинарные кавычки в двойные
		clean = clean.replace(/'/g, '"');
		// HEX в десятичные
		clean = clean.replace(/0x([0-9a-fA-F]+)/g, (_match, hex) => parseInt(hex, 16).toString());
		return JSON.parse(clean);
	} catch (e) {
		return null;
	}
};
