const PluginsClient = require('./client');
const Manager = require('./pluginManager/manager');
const Plugin = require('./pluginManager/base');
const PluginGroup = require('./pluginManager/pluginGroup');
const Util = require('./util');

module.exports = {
	Client: PluginsClient,
	PluginsClient,
	Manager,
	PluginManager: Manager,
	Plugin,
	PluginGroup,
	util: Util,
	Util: Util,
	inject: Util.inject,
	isConstructor: Util.isConstructor,
	version: require('../package').version
};
