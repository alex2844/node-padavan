/**
 * Форматирует число байт в читаемую строку (KB, MB, GB).
 * @param {number|string} bytes Число байт.
 * @param {number} [decimals=2] Количество знаков после запятой.
 * @returns {string} Строка вида "10.5 MB".
 */
export function formatBytes(bytes, decimals = 2) {
	const b = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes;
	if (b === 0 || isNaN(b))
		return '0 B';
	const k = 1024;
	const dm = decimals < 0 ? 0 : decimals;
	const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
	const i = Math.floor(Math.log(b) / Math.log(k));
	return parseFloat((b / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Форматирует объект uptime в строку.
 * @param {{days: number, hours: number, minutes: number}} uptime
 * @returns {string} Строка вида "5d 12h 30m"
 */
export function formatUptime(uptime) {
	if (!uptime)
		return 'N/A';
	return `${uptime.days}d ${uptime.hours}h ${uptime.minutes}m`;
};
