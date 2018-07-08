const Client = require('./client');
const Manager = require('./pluginManager/manager');
const Plugin = require('./pluginManager/base');
const PluginGroup = require('./pluginManager/group');

function inject(client) {
	const manager = new Manager(client);
	manager.plugins = manager;
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
