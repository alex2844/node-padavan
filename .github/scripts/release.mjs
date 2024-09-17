#!/usr/bin/env node

import fs from 'fs';

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));

function main(github, context) {
	return github.rest.repos.listReleases({
		per_page: 1,
		owner: context?.repo.owner,
		repo: context?.repo.repo
	}).then(({ data: [ latest ] }) => {
		if (latest?.tag_name != pkg.version) {
			const release = {
				tag_name: pkg.version,
				name: 'Release '+pkg.version,
				owner: context?.repo.owner,
				repo: context?.repo.repo
			};
			const log = fs.existsSync('docs/CHANGELOG.md') ? fs.readFileSync('docs/CHANGELOG.md', 'utf-8') : null;
			const body = log?.split('## [').find(tag => tag.startsWith(pkg.version+']'))?.split('\n').slice(1).join('\n').trim();
			if (body)
				release.body = body;
			else
				release.generate_release_notes = true;
			return github.rest.repos.createRelease(release).then(release => true);
		}else
			return false;
	});
};

export default main;
