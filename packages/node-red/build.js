#!/usr/bin/env bun

import path from 'path';
import { rm, mkdir, readdir, stat } from 'fs/promises';

const SRC_DIR = path.resolve(import.meta.dir, 'src');
const LOCALES_DIR = path.resolve(import.meta.dir, 'src/locales');
const DOCS_DIR = path.resolve(import.meta.dir, 'docs');
const DIST_DIR = path.resolve(import.meta.dir, 'dist');

const packageJsonPath = path.resolve(import.meta.dir, 'package.json');
const packageJson = await Bun.file(packageJsonPath).json();

const nodePrefix = packageJson.name?.split('-').pop();
if (!nodePrefix)
	throw new Error(`Could not determine node prefix from package name: ${packageJson.name}`);

/**
 * Проверяет, существует ли директория по указанному пути.
 * @param {string} dirPath - Путь к директории.
 * @returns {Promise<boolean>}
 */
async function dirExists(dirPath) {
	try {
		const stats = await stat(dirPath);
		return stats.isDirectory();
	} catch (error) {
		if (error.code === 'ENOENT')
			return false;
		throw error;
	}
};

/**
 * Подготавливает Markdown для отображения в панели справки Node-RED.
 * 1. Удаляет заголовок H1 (так как Node-RED показывает имя узла сам).
 * 2. Сдвигает уровни заголовков (## -> ###), чтобы соответствовать стилю панели.
 * @param {string} markdown Исходный текст.
 * @returns {string} Обработанный текст.
 */
function transformMarkdownForNodeRed(markdown) {
	let content = markdown.replace(/^\s*#\s+.+(\r?\n|$)/, '');
	content = content.replace(/^(#{2,})/gm, '#$1');
	return content.trim();
};

/**
 * Выполняет сборку одного узла Node-RED по его имени.
 * @param {string} nodeName - Имя узла (совпадает с именем директории в `src/nodes`).
 * @returns {Promise<void>}
 */
async function buildNode(nodeName) {
	const nodeSrcDir = path.join(SRC_DIR, 'nodes', nodeName);
	const nodeDistDir = path.join(DIST_DIR, 'nodes');

	// 1. Сборка JS для runtime (Node.js)
	const runtimeSrc = path.join(nodeSrcDir, 'runtime.js');
	if (await Bun.file(runtimeSrc).exists()) {
		const buildResult = await Bun.build({
			entrypoints: [runtimeSrc],
			outdir: nodeDistDir,
			naming: `${nodeName}.js`,
			packages: 'external',
			target: 'node',
			minify: true
		});
		if (buildResult.success)
			console.log(`✅ Built ${nodeName}.js`);
		else
			console.error(`❌ Build failed for ${nodeName}.js:`, buildResult.logs);
	}

	// 2. Сборка HTML-части (UI)
	const finalHtmlParts = [];

	// 2a. Сборка UI-скрипта для браузера
	const uiSrc = path.join(nodeSrcDir, 'ui.js');
	if (await Bun.file(uiSrc).exists()) {
		const buildResult = await Bun.build({
			entrypoints: [uiSrc],
			target: 'browser',
			minify: {
				syntax: true,
				whitespace: true
			}
		});
		if (buildResult.success) {
			const [artifact] = buildResult.outputs;
			const content = await artifact.text();
			finalHtmlParts.push(`<script type="text/javascript">\n${content}</script>`);
		} else
			console.error(`❌ Build failed for ${nodeName}/ui.js:`, buildResult.logs);
	}

	// 2b. Добавление HTML-шаблона
	const templateSrc = path.join(nodeSrcDir, 'template.html');
	if (await Bun.file(templateSrc).exists()) {
		const content = await Bun.file(templateSrc).text();
		finalHtmlParts.push(`<script type="text/html" data-template-name="${nodePrefix}-${nodeName}">\n${content}</script>`);
	}

	// 2c. Запись итогового .html файла
	if (finalHtmlParts.length > 0) {
		const htmlDest = path.join(nodeDistDir, `${nodeName}.html`);
		await Bun.write(htmlDest, finalHtmlParts.join('\n\n'));
		console.log(`📦 Assembled ${nodeName}.html`);
	}

	// 3. Копирование иконок
	const iconSrcDir = path.join(nodeSrcDir, 'icons');
	if (await dirExists(iconSrcDir)) {
		const iconDistDir = path.join(nodeDistDir, 'icons');
		await mkdir(iconDistDir, { recursive: true });

		const glob = new Bun.Glob(path.join(iconSrcDir, '*'));
		for await (const file of glob.scan()) {
			const dest = path.join(iconDistDir, path.basename(file));
			await Bun.write(dest, Bun.file(file));
		}
		console.log(`🎨 Copied icons for ${nodeName}`);
	}
};

/**
 * Находит и копирует файлы документации (.md) для всех узлов.
 * При копировании трансформирует Markdown для Node-RED.
 * @param {string[]} nodeNames - Список имен всех собираемых узлов.
 * @returns {Promise<void>}
 */
async function copyAllDocs(nodeNames) {
	if (!(await dirExists(DOCS_DIR)))
		return;
	let copied = false;
	const langDirEntries = await readdir(DOCS_DIR, { withFileTypes: true });
	for (const dirent of langDirEntries) {
		if (!dirent.isDirectory())
			continue;
		const lang = dirent.name;
		const localeDistDir = path.join(DIST_DIR, 'nodes', 'locales', lang);
		for (const nodeName of nodeNames) {
			const docSrc = path.join(DOCS_DIR, lang, 'nodes', `${nodeName}.md`);
			if (await Bun.file(docSrc).exists()) {
				await mkdir(localeDistDir, { recursive: true });
				const dest = path.join(localeDistDir, `${nodeName}.html`);
				const rawContent = await Bun.file(docSrc).text();
				const content = transformMarkdownForNodeRed(rawContent);
				await Bun.write(dest, `<script type="text/markdown" data-help-name="${nodePrefix}-${nodeName}" data-lang="${lang}">\n${content}\n</script>`);
				copied = true;
			}
		}
	}
	if (copied)
		console.log('🌍 Copied docs files.');
};

/**
 * Находит и копирует файлы локализации (.json) для всех узлов.
 * @param {string[]} nodeNames - Список имен всех собираемых узлов.
 * @returns {Promise<void>}
 */
async function copyAllLocales(nodeNames) {
	if (!(await dirExists(LOCALES_DIR)))
		return;
	let copied = false;
	const langDirEntries = await readdir(LOCALES_DIR, { withFileTypes: true });
	for (const dirent of langDirEntries) {
		if (!dirent.isDirectory())
			continue;
		const lang = dirent.name;
		const langPath = path.join(LOCALES_DIR, lang);
		const localeDistDir = path.join(DIST_DIR, 'nodes', 'locales', lang);
		for (const nodeName of nodeNames) {
			const localeSrc = path.join(langPath, `${nodeName}.json`);
			if (await Bun.file(localeSrc).exists()) {
				await mkdir(localeDistDir, { recursive: true });
				const dest = path.join(localeDistDir, `${nodeName}.json`);
				await Bun.write(dest, Bun.file(localeSrc));
				copied = true;
			}
		}
	}
	if (copied)
		console.log('🌍 Copied locale files.');
};

export default async function build() {
	console.time('✨ Build complete');
	console.log(`📦 Using node prefix: "${nodePrefix}"`);

	await rm(DIST_DIR, { recursive: true, force: true });
	console.log(`🧹 Cleaned ${DIST_DIR} directory.`);

	const distNodesDir = path.join(DIST_DIR, 'nodes');
	await mkdir(distNodesDir, { recursive: true });

	const nodesSrcDir = path.join(SRC_DIR, 'nodes');
	if (!(await dirExists(nodesSrcDir))) {
		console.warn(`⚠️  Source directory for nodes not found at ${nodesSrcDir}. Nothing to build.`);
		return;
	}

	const nodeDirEntries = await readdir(nodesSrcDir, { withFileTypes: true });
	const nodeNames = nodeDirEntries
		.filter(dirent => dirent.isDirectory())
		.map(dirent => dirent.name);

	if (nodeNames.length === 0) {
		console.log('🤷 No nodes found to build.');
		return;
	}

	console.log(`🔍 Found ${nodeNames.length} nodes: ${nodeNames.join(', ')}`);

	await Promise.all([
		...nodeNames.map(buildNode),
		copyAllDocs(nodeNames),
		copyAllLocales(nodeNames)
	]);

	console.timeEnd('✨ Build complete');
};

if (import.meta.path === Bun.main)
	build();
