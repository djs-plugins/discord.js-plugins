/**
 * @external Collection
 * @see {@link https://discord.js.org/#/docs/main/master/class/Collection}
 */

/**
 * @external Client
 * @see {@link https://discord.js.org/#/docs/main/master/class/Client}
 */

/**
 * @external ClientOptions
 * @see {@link https://discord.js.org/#/docs/main/master/typedef/ClientOptions}
 */

/**
 * @external Iterator
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols}
 */

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
