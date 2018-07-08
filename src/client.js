const discord = require('discord.js');
const PluginManager = require('./pluginManager/manager');

/**
 * @typedef {import('discord.js').ClientOptions} ClientOptions
 * @typedef {import('discord.js-commando').CommandoClientOptions} CommandoClientOptions
 */

/**
 * @type {'discord.js-commando'}
 */
let commando;
try {
	commando = require('discord.js-commando');
} catch(err) {
	commando = null;
}

/**
 * Discord.js Client with a plugin framework
 * @extends {discord.Client}
 * @implements {commando.Client}
 */
class PluginsClient extends (commando || discord).Client {
	/**
	 * @param {ClientOptions|CommandoClientOptions} [options] - Options for the client
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
