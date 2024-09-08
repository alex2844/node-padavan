module.exports = function(RED) {
	function Upgrade(config) {
		RED.nodes.createNode(this, config);
		const settings = RED.nodes.getNode(config.settings);
		this.on('input', msg => {
			msg.topic = RED.util.evaluateNodeProperty(config.topic, config.topicType, this, msg);
			if ([ 'build', 'changelog', 'upgrade' ].includes(msg.topic))
				settings.getClient().then(client => {
					if (msg.topic === 'build')
						return client.startBuild();
					else if (msg.topic === 'changelog')
						return client.getChangelog();
					else if (msg.topic === 'upgrade')
						return client.getArtifact().then(async artifact => {
							const to_id = artifact.name.split('-').slice(-1)[0].slice(0, 7);
							const from_id = await client.nvram('firmver_sub');
							if (from_id.split('_')[1] === to_id)
								return;
							return client.startUpgrade(artifact.id).then(() => {
								return new Promise(res => {
									setTimeout(function loop() {
										client.nvram('firmver_sub').then(firmver_sub => {
											if (firmver_sub !== from_id)
												return res(true);
											setTimeout(loop, 5000);
										}).catch(() => setTimeout(loop, 5000))
									}, 5000);
								});
							});
						});
				})
				.then(payload => {
					if (!payload)
						msg.error = 'Firmware not found';
					else
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
