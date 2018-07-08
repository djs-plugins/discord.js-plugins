const Plugin = require('../../../src/pluginManager/base');

class TestPluginFile extends Plugin {
	constructor(client) {
		const info = {
			name: 'file',
			description: 'file test plugin'
		};
		super(client, info);
	}
}

module.exports = TestPluginFile;
