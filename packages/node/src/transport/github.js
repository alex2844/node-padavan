/**
 * @typedef {Object} Config
 * @property {string} [repo] Репозиторий с прошивками.
 * @property {string} [branch] Ветка репозитория для отслеживания обновлений.
 * @property {string} [token] Персональный токен доступа (PAT) для API GitHub/GitLab.
 */

/**
 * Класс для работы с GitHub API.
 * Используется для проверки, скачивания и управления сборками прошивок.
 */
export default class GitHubClient {
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
		this.#config = config;
		this.#logger = logger;
	};

	/**
	 * Возвращает заголовки для запросов к API.
	 * @returns {HeadersInit}
	 */
	get #headers() {
		const /** @type {Record<string, string>} */ headers = {
			accept: 'application/vnd.github.v3+json'
		};
		if (this.#config.token)
			headers.authorization = `Bearer ${this.#config.token}`;
		return headers;
	};

	/**
	 * Выполняет запрос к GitHub API.
	 * @param {string} path Путь API или полный URL.
	 * @param {RequestInit} [options] - Дополнительные опции для fetch.
	 * @returns {Promise<any>} JSON ответ.
	 */
	async request(path, options = {}) {
		const { repo } = this.#config;
		if (!repo)
			throw new Error('Repository not configured');
		const url = path.startsWith('http') ? path : `https://api.github.com/repos/${repo}/${path}`;
		const res = await fetch(url, {
			...options,
			headers: { ...this.#headers, ...options?.headers }
		});

		if (!res.ok) {
			const errorBody = await res.text();
			this.#logger('error', `GitHub API request failed to ${url} with status ${res.status}:`, errorBody);
			throw new Error(`GitHub API Error: ${res.status}`);
		}

		if (res.headers.get('content-type')?.includes('application/json'))
			return res.json();
		return res;
	};

	/**
	 * Получает сырое содержимое файла из репозитория.
	 * @param {string} path Путь к файлу (например 'build.conf')
	 * @returns {Promise<string>}
	 */
	async getFileContent(path) {
		const res = await this.request(`contents/${path}`, {
			headers: {
				accept: 'application/vnd.github.raw'
			}
		});
		return res.text();
	};

	/**
	 * Находит ID workflow по его имени.
	 * @param {string} workflowName - Имя файла (e.g., 'build.yml').
	 * @returns {Promise<number>}
	 */
	async #getWorkflowId(workflowName) {
		const { workflows } = await this.request('actions/workflows');
		const workflow = workflows.find((/** @type {any} */ w) => w.path.endsWith(workflowName));
		if (!workflow)
			throw new Error(`Workflow '${workflowName}' not found`);
		return workflow.id;
	};

	/**
	 * Запускает сборку прошивки через GitHub Actions.
	 * @param {string} [workflowName='build.yml'] - Имя файла workflow.
	 */
	async startBuild(workflowName = 'build.yml') {
		const workflowId = await this.#getWorkflowId(workflowName);
		const { branch } = this.#config;
		if (!branch)
			throw new Error('Branch is not configured');
		await this.request(`actions/workflows/${workflowId}/dispatches`, {
			method: 'POST',
			body: JSON.stringify({ ref: branch })
		});
	};

	/**
	 * Находит последний успешный артефакт сборки.
	 * @param {string} [workflowName='build.yml'] Имя workflow файла.
	 * @returns {Promise<any>} Объект артефакта.
	 */
	async getLatestArtifact(workflowName = 'build.yml') {
		const { branch } = this.#config;
		const workflowId = await this.#getWorkflowId(workflowName);

		let runsUrl = `actions/workflows/${workflowId}/runs?status=success&per_page=1`;
		if (branch)
			runsUrl += `&branch=${branch}`;

		const { workflow_runs } = await this.request(runsUrl);
		const run = workflow_runs[0];
		if (!run)
			throw new Error('No successful runs found');

		const { artifacts } = await this.request(run.artifacts_url);
		const firmware = artifacts.find((/** @type {any} */ a) => !a.expired);
		if (!firmware)
			throw new Error('No valid artifacts found in the latest run');

		return firmware;
	};

	/**
	 * Скачивает артефакт.
	 * @param {number} artifactId ID артефакта.
	 * @returns {Promise<ArrayBuffer>} Бинарные данные архива.
	 */
	async downloadArtifact(artifactId) {
		const { repo } = this.#config;
		const url = `https://api.github.com/repos/${repo}/actions/artifacts/${artifactId}/zip`;
		const res = await fetch(url, { headers: this.#headers });
		if (!res.ok)
			throw new Error('Download failed');
		return res.arrayBuffer();
	};

	/**
	 * Получает список коммитов между двумя хэшами из внешнего репозитория.
	 * @param {string} repoUrl URL репозитория из build.conf.
	 * @param {string} fromId Текущий хэш.
	 * @param {string} toId Целевой хэш.
	 * @returns {Promise<string[]>} Список коммитов.
	 */
	async getCommitsBetween(repoUrl, fromId, toId) {
		const cleanUrl = repoUrl.replace(/\.git$/, '').replace(/\/$/, '');
		try {
			if (cleanUrl.includes('gitlab.com'))
				return await this.#fetchGitLabCommits(cleanUrl, fromId, toId);
			else if (cleanUrl.includes('github.com'))
				return await this.#fetchGitHubCommits(cleanUrl, fromId, toId);
			else {
				this.#logger('warn', `Unsupported repository host: ${cleanUrl}`);
				return [];
			}
		} catch (e) {
			this.#logger('error', `Failed to fetch external commits`, e);
			return [];
		}
	};

	/**
	 * Получает список коммитов из репозитория GitLab.
	 * Парсит URL для получения ID проекта и запрашивает историю через API.
	 * @param {string} url URL репозитория (например, https://gitlab.com/user/project).
	 * @param {string} fromId Хэш начального коммита.
	 * @param {string} toId Хэш конечного коммита.
	 * @returns {Promise<string[]>} Список заголовков коммитов в диапазоне.
	 */
	async #fetchGitLabCommits(url, fromId, toId) {
		const repoPath = url.split('gitlab.com/')[1];
		const projectEncoded = encodeURIComponent(repoPath);

		const apiUrl = `https://gitlab.com/api/v4/projects/${projectEncoded}/repository/commits?per_page=100`;
		const res = await fetch(apiUrl);
		if (!res.ok)
			throw new Error(`GitLab API error: ${res.status}`);

		const commits = await res.json();
		const messages = [];

		for (const commit of commits) {
			const sha = commit.id;
			const shortSha = sha.substring(0, 7);
			if (sha.startsWith(fromId) || shortSha === fromId)
				break;
			if (sha.startsWith(toId) || shortSha === toId || messages.length > 0)
				messages.push(commit.title);
		}
		return messages;
	};

	/**
	 * Получает список коммитов из репозитория GitHub.
	 * Использует Compare API для получения разницы между двумя ревизиями.
	 * @param {string} url URL репозитория (например, https://github.com/user/project).
	 * @param {string} fromId Хэш начального коммита (старый).
	 * @param {string} toId Хэш конечного коммита (новый).
	 * @returns {Promise<string[]>} Список сообщений коммитов.
	 */
	async #fetchGitHubCommits(url, fromId, toId) {
		const repoPath = url.split('github.com/')[1];
		const apiUrl = `https://api.github.com/repos/${repoPath}/compare/${fromId}...${toId}`;
		const { commits } = await this.request(apiUrl);
		return commits.map((/** @type {any} */ c) => c.commit.message);
	};
};
