/** @import { NodeAPI, Node, NodeMessage, EditorWidgetTypedInputType } from 'node-red' */

/**
 * Определение одной опции для выпадающего списка внутри typedInput.
 * @template T
 * @typedef {{ value: T, label: string }} TypedInputOption
 */

/**
 * Кастомный тип для typedInput (объект с value и options).
 * @template T
 * @typedef {{ value: T, label?: string, icon?: string, options?: TypedInputOption<any>[] }} CustomTypedInputType
 */

/**
 * Определение элемента массива types в typedInput.
 * Может быть либо стандартный тип Node-RED (строка), либо кастомный объект.
 * @template {string} T - union строк из Config['myFieldType'] (например 'msg' | 'action')
 * @typedef {(T & EditorWidgetTypedInputType) | CustomTypedInputType<Exclude<T, EditorWidgetTypedInputType>>} TypedInputDefinition
 */

/**
 * Преобразует массив строк в опции для typedInput.
 * @param {readonly string[]} list Массив строковых значений.
 * @returns {TypedInputOption<string>[]} Массив опций typedInput.
 */
export function createTypedInputOptions(list) {
	return list.map(value => ({
		value,
		label: value.trim()
	}));
};

/**
 * Вычисляет значение свойства узла с поддержкой всех типов, включая JSONata.
 * @param {NodeAPI} RED Объект Node-RED.
 * @param {any} value Значение свойства.
 * @param {EditorWidgetTypedInputType|string} type Тип свойства (str, msg, flow, global, jsonata, etc.).
 * @param {Node} node Узел Node-RED.
 * @param {NodeMessage} msg Входящее сообщение.
 * @returns {Promise<any>} Результат вычисления свойства.
 */
export function evaluateNodeProperty(RED, value, type, node, msg) {
	return new Promise((resolve, reject) => {
		if (type === 'jsonata')
			RED.util.evaluateNodeProperty(value, type, node, msg, (err, result) => {
				if (err)
					reject(err);
				else
					resolve(result);
			});
		else
			try {
				const result = RED.util.evaluateNodeProperty(value, type, node, msg);
				resolve(result);
			} catch (err) {
				reject(err);
			}
	});
};

/**
 * Вычисляет значения нескольких свойств одновременно.
 * @param {NodeAPI} RED Объект Node-RED.
 * @param {Node} node Узел Node-RED.
 * @param {NodeMessage} msg Входящее сообщение.
 * @param {{value: any, type: EditorWidgetTypedInputType|string}[]} properties Массив свойств для вычисления.
 * @returns {Promise<any[]>} Массив результатов вычисления.
 */
export async function evaluateNodeProperties(RED, node, msg, properties) {
	const promises = properties.map(({ value, type }) => evaluateNodeProperty(RED, value, type, node, msg));
	return Promise.all(promises);
};
