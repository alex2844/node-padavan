module.exports = function(RED) {
	function Devices(config) {
		RED.nodes.createNode(this, config);
		const settings = RED.nodes.getNode(config.settings);
		this.on('input', msg => {
			settings.getClient().then(client => client.getDevices())
			.then(payload => {
				if (!payload)
					return;
				msg.payload = payload;
				msg.numConnectedDevices = payload.length;
				this.status({
					fill: 'green',
					shape: 'dot',
					text: msg.numConnectedDevices
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
	RED.nodes.registerType('padavan-devices', Devices);
}
