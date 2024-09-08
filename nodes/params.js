module.exports = function(RED) {
	function Params(config) {
		RED.nodes.createNode(this, config);
		const settings = RED.nodes.getNode(config.settings);
		this.on('input', msg => {
			msg.payload = RED.util.evaluateNodeProperty(config.payload, config.payloadType, this, msg);
			msg.topic = RED.util.evaluateNodeProperty(config.topic, config.topicType, this, msg);
			if ([ 'list', 'get', 'set' ].includes(msg.topic))
				settings.getClient().then(client => {
					if (msg.topic === 'list')
						return client.getParams();
					else{
						if (!msg.payload || !Object.keys(msg.payload).length)
							throw new Error('Input payload missing');
						if (msg.topic === 'get')
							return client.getParams(msg.payload);
						else if (msg.topic === 'set')
							return client.setParams(msg.payload);
					}
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
	RED.nodes.registerType('padavan-params', Params);
}
