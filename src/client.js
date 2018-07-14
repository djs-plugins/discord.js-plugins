const { Client } = require('discord.js');
const PluginManager = require('./pluginManager/manager');

/**
 * @typedef {import('discord.js').ClientOptions} ClientOptions
 * @typedef {import('discord.js').Client} Client
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
