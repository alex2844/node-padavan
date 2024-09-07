module.exports = function(RED) {
	function Params(config) {
		RED.nodes.createNode(this, config);
		const settings = RED.nodes.getNode(config.settings);
		this.on('input', msg => {
			const payload = RED.util.evaluateNodeProperty(config.payload, config.payloadType, this, msg);
			const topic = RED.util.evaluateNodeProperty(config.topic, config.topicType, this, msg);
			if ([ 'list', 'get', 'set' ].includes(topic))
				settings.getClient().then(client => {
					if (topic === 'list')
						return client.getParams();
					else{
						if (!payload || !Object.keys(payload).length)
							throw new Error('Input payload missing');
						if (topic === 'get')
							return client.getParams(payload);
						else if (topic === 'set')
							return client.setParams(payload);
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
