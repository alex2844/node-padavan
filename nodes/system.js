module.exports = function(RED) {
	function System(config) {
		RED.nodes.createNode(this, config);
		const settings = RED.nodes.getNode(config.settings);
		this.on('input', msg => {
			msg.topic = RED.util.evaluateNodeProperty(config.topic, config.topicType, this, msg);
			if ([ 'status', 'log', 'reboot' ].includes(msg.topic))
				settings.getClient().then(client => {
					if (msg.topic === 'status')
						return client.getStatus();
					else if (msg.topic === 'log')
						return client.getLog();
					else if (msg.topic === 'reboot')
						return client.startReboot();
				})
				.then(payload => {
					if (!payload)
						return;
					msg.payload = payload;
					this.send(msg);
				})
				.catch(({ message, code }) => {
					msg.code = code;
					msg.payload = message;
					this.error(message, msg);
				});
		});
	};
	RED.nodes.registerType('padavan-system', System);
}
