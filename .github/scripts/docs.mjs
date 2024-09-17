#!/usr/bin/env node

import { _pathCache } from 'module';
import fs from 'fs';
import path from 'path';

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
const locales = JSON.parse(fs.readFileSync('docs/locales.json', 'utf-8'));

function readMarkdown(filename) {
	if (!fs.existsSync(filename))
		return;
	const regexp = /^\s*-\s+\[(.+)\]\(([a-z]+(?:\/[a-z]+)*\.md)\)$/;
	const lines = fs.readFileSync(filename, 'utf-8').split('\n');
	lines.splice(0, lines.findLastIndex(line => line.startsWith('[!') || line.startsWith('# ')) + 1);
	lines.forEach((line, i) => {
		const [ title, file ] = line.match(regexp)?.slice(1) || [];
		if (!file)
			return;
		const content = readMarkdown(path.join(path.dirname(path.resolve(filename)), file));
		if (!content)
			return;
		lines[i] = lines[i].replace(file, '#'+title.toLowerCase().replace(/ /g, '-'));
		lines.push('', '', '## '+title, '', content);
	});
	return lines.join('\n').trim();
};

function main(engine) {
	switch (engine) {
		case 'node-js': {
			fs.writeFileSync('README.md', readMarkdown(`docs/${locales[0][0]}/README.md`));
			return true;
		};
		case 'node-red': {
			const regexp = /registerType\('(.+)',/;
			fs.writeFileSync('README.md', readMarkdown(`docs/${locales[0][0]}/node-red/README.md`));
			locales.forEach(([ locale ]) => {
				fs.mkdirSync('nodes/locales/'+locale, { recursive: true });
				Object.entries(pkg['node-red'].nodes).forEach(([ node, module ]) => {
					const [ name ] = fs.readFileSync(module, 'utf-8').match(regexp)?.slice(1) || [];
					const content = readMarkdown(`docs/${locale}/node-red/${node}.md`);
					if (content)
						fs.writeFileSync(
							`nodes/locales/${locale}/${node}.html`,
							`<script type="text/markdown" data-help-name="${name}">\n${content}\n</script>`
						);
				});
			});
			return true;
		};
		case 'locales': {
			const nodes = Object.keys(pkg['node-red'].nodes);
			const tables = locales.reduce((res, cur) => {
				const regexp = /^#\s+(.+)$/;
				res[0][0].push(fs.existsSync(`docs/${cur[0]}/README.md`) ? `| [${cur[1]}](${cur[0]}/README.md)` : `| ${cur[1]}`);
				res[1][0].push(fs.existsSync(`docs/${cur[0]}/node-red/README.md`) ? `| [${cur[1]}](${cur[0]}/node-red/README.md)` : `| ${cur[1]}`);
				res[0][1].push('| ---');
				res[1][1].push('| ---');
				nodes.forEach((node, i) => {
					if (fs.existsSync(`docs/${cur[0]}/node-red/${node}.md`)) {
						const line = fs.readFileSync(`docs/${cur[0]}/node-red/${node}.md`, 'utf-8').split('\n').slice(0, 1).join();
						const [ title ] = line.match(regexp)?.slice(1) || [];
						res[1][i+2].push(`| [${title}](${cur[0]}/node-red/${node}.md)`);
					}else
						res[1][i+2].push(`| ${node}`);
				});
				return res;
			}, [
				[[], []],
				[[], [], ...nodes.map(() => ([])) ]
			]);
			const lines = [
				'# '+pkg.name, '',
				'## NodeJS', '', ...tables[0].map(row => row.join(' ')), '',
				'## NodeRED', '', ...tables[1].map(row => row.join(' '))
			];
			fs.writeFileSync('docs/README.md', lines.join('\n'));
			return true;
		};
		default: {
			throw new Error('node-js|node-red|locales');
		};
	};
};

export default main;

if (!import.meta.filename || Object.values(_pathCache).includes(import.meta.filename))
	main(...process.argv.slice(2));
