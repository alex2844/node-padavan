module.exports = function(RED) {
	function SpeedTest(config) {
		RED.nodes.createNode(this, config);
		const settings = RED.nodes.getNode(config.settings);
		this.on('input', msg => {
			this.status({
				fill: 'yellow',
				shape: 'ring',
				text: 'Start...'
			});
			this.send([ null, null, {
				topic: 'networkSpeedTestInProgress',
				payload: true
			}]);
			settings.getClient().then(client => client.startSpeedTest())
			.then(payload => {
				if (!payload)
					return;
				const date = new Date();
				const timestamp = parseInt(date.getTime() / 1000);
				this.status({
					fill: 'green',
					shape: 'dot',
					text: `${payload.networkDownloadSpeedMbps}Mbps / ${payload.networkUploadSpeedMbps}Mbps`
				});
				this.send([{
					topic: 'NetworkControl',
					payload: {
						...payload,
						status: 'SUCCESS',
						followUpToken: msg.params?.followUpToken
					}
				}, {
					date: date.toLocaleString(),
					payload: {
						lastNetworkDownloadSpeedTest: {
							downloadSpeedMbps: payload.networkDownloadSpeedMbps,
							unixTimestampSec: timestamp,
							status: 'SUCCESS'
						},
						lastNetworkUploadSpeedTest: {
							uploadSpeedMbps: payload.networkUploadSpeedMbps,
							unixTimestampSec: timestamp,
							status: 'SUCCESS'
						}
					}
				}, null ]);
			})
			.catch(({ message, code }) => {
				msg.code = code;
				msg.payload = message;
				this.status({
					fill: 'red',
					shape: 'ring',
					text: message,
				});
				this.error(message, msg);
			})
			.then(() => this.send([ null, null, {
				topic: 'networkSpeedTestInProgress',
				payload: false
			}]));
		});
	};
	RED.nodes.registerType('padavan-speedtest', SpeedTest);
}
