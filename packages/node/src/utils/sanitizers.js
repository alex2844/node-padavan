/**
 * Рекурсивно очищает объект от пустых значений и неразрешенных ключей
 * @param {Object} obj Исходный объект.
 * @param {string[]} [allowedKeys] Список разрешенных ключей (если null - разрешены все).
 * @returns {Object} Очищенный объект.
 */
export function sanitizeObject(obj, allowedKeys = null) {
	if (!obj || typeof obj !== 'object' || Array.isArray(obj))
		return obj;

	const result = {};
	for (const [key, value] of Object.entries(obj)) {
		if (allowedKeys && !allowedKeys.includes(key))
			continue;
		if (value === '' || value === null || value === undefined)
			continue;
		if (typeof value === 'object' && !Array.isArray(value)) {
			const cleaned = sanitizeObject(value);
			if (Object.keys(cleaned).length > 0)
				result[key] = cleaned;
		} else
			result[key] = value;
	}

	return result;
};
