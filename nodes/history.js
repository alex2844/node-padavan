module.exports = function(RED) {
	function History(config) {
		RED.nodes.createNode(this, config);
		const settings = RED.nodes.getNode(config.settings);
		this.on('input', msg => {
			settings.getClient().then(client => client.getHistory())
			.then(payload => {
				if (!payload)
					return;
				const kb = payload.monthly_history.slice(-1)[0].slice(1).reduce((a, b) => a + b, 0);
				const k = kb > 0 ? Math.floor((Math.log2(kb)/10)) : 0;
				const rank = (k > 0 ? 'MGT'[k - 1] : '') + 'b';
				const count = Math.floor(kb / Math.pow(1024, k));
				msg.networkUsage = count + rank;
				msg.networkUsageMB = parseInt(kb / 1024);
				msg.payload = payload;
				this.status({
					fill: 'green',
					shape: 'dot',
					text: msg.networkUsage
				});
				this.send(msg);
			})
			.catch(({ message, code }) => {
				msg.code = code;
				msg.payload = message;
				this.error(message, msg);
			});
		});
	};
	RED.nodes.registerType('padavan-history', History);
}
