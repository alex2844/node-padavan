#!/usr/bin/env node

import { _pathCache } from 'module';
import fs from 'fs';

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));

function main() {
	return fetch('https://flows.nodered.org/add/node').then(res => {
		if (!pkg.name.startsWith('node-red-contrib-'))
			pkg.name = 'node-red-contrib-'+pkg.name.replace(new RegExp('^node-'), '');
		return res.text().then(text => {
			const regexp = [
				/(_csrf=.+?)\;/,
				/name="_csrf" type="hidden" value="(.+)"/,
			];
			const [ cookie ] = res.headers.get('set-cookie').match(regexp[0])?.slice(1) || [];
			const [ _csrf ] = text.match(regexp[1])?.slice(1) || [];
			return fetch('https://flows.nodered.org/add/node', {
				method: 'POST',
				headers: { cookie },
				body: new URLSearchParams({
					_csrf,
					module: pkg.name
				})
			}).then(res => {
				return res.text().then(text => {
					if (res.status !== 200)
						throw new Error(text);
					return text;
				});
			});
		});
	});
};

export default main;

if (!import.meta.filename || Object.values(_pathCache).includes(import.meta.filename))
	main(...process.argv.slice(2));
