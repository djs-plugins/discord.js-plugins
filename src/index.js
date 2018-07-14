const Client = require('./client');
const Manager = require('./pluginManager/manager');
const Plugin = require('./pluginManager/base');
const PluginGroup = require('./pluginManager/pluginGroup');

function inject(client) {
	const manager = new Manager(client);
	client.plugins = manager;
	return client;
}

module.exports = {
	Client,
	PluginsClient: Client,
	Manager,
	PluginManager: Manager,
	Plugin,
	PluginGroup,
	inject,

	version: require('../package').version
};
