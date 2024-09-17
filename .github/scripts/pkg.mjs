#!/usr/bin/env node

import { _pathCache } from 'module';
import fs from 'fs';

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));

function main(engine) {
	switch (engine) {
		case 'node-js': {
			delete pkg['node-red'];
			pkg.name = pkg.name.replace(new RegExp('^node-'), '');
			pkg.files = pkg.files.filter(file => file !== 'nodes/');
			pkg.keywords = pkg.keywords.filter(keyword => keyword !== 'node-red');
			fs.writeFileSync('package.json', JSON.stringify(pkg, null, '\t'));
			return true;
		};
		case 'node-red': {
			pkg.name = 'node-red-contrib-'+pkg.name.replace(new RegExp('^node-'), '');
			fs.writeFileSync('package.json', JSON.stringify(pkg, null, '\t'));
			return true;
		};
		default: {
			throw new Error('node-js|node-red');
		};
	};
};

export default main;

if (!import.meta.filename || Object.values(_pathCache).includes(import.meta.filename))
	main(...process.argv.slice(2));
