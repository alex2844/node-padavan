module.exports = async function(RED) {
	const { Padavan } = await import('../main.mjs');
	function Config(config) {
		RED.nodes.createNode(this, config);
		this.getClient = async function() {
			return new Padavan({
				...config,
				...this.credentials
			});
		};
	};
	RED.nodes.registerType('padavan-config', Config, {
		credentials: {
			token: { type: 'password' },
			username: { type: 'text' },
			password: { type: 'password' }
		}
	});
}
