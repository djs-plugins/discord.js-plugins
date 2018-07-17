const { Client } = require('discord.js');
const PluginManager = require('./pluginManager/manager');

/**
 * @external ClientOptions
 */

/**
 * Discord.js Client with a plugin framework
 * @extends {Client}
 */
class PluginsClient extends Client {
	/**
	 * @param {ClientOptions} [options] - Options for the client
	 */
	constructor(options) {
		super(options);

		/**
		 * The client's command registry
		 * @type {PluginManager}
		 */
		this.plugins = new PluginManager(this);
	}

	async destroy() {
		await this.plugins.unloadAll();
		await super.destroy();
	}
}

module.exports = PluginsClient;
