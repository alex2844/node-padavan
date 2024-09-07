module.exports = function(RED) {
	function Upgrade(config) {
		RED.nodes.createNode(this, config);
		const settings = RED.nodes.getNode(config.settings);
		this.on('input', msg => {
			const topic = RED.util.evaluateNodeProperty(config.topic, config.topicType, this, msg);
			if ([ 'build', 'changelog', 'upgrade' ].includes(topic))
				settings.getClient().then(client => {
					if (topic === 'build')
						return client.startBuild();
					else if (topic === 'changelog')
						return client.getChangelog();
					else if (topic === 'upgrade')
						return client.startUpgrade();
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
	RED.nodes.registerType('padavan-upgrade', Upgrade);
}
