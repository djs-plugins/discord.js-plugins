const discord = require('discord.js');
const PluginManager = require('./pluginManager/manager');

/**
 * @typedef {ClientOptions} PluginsClientOptions
 * @property {number?} [pluginFatalGracePeriod=5000] - How many milliseconds to wait before crashing the bot
 * forcibly after a fatal error in the plugin manager.
 * (Setting this to a null will prevent the plugin manager from forcibly killing the bot.
 * Make sure you listen for the {@link PluginsClient#pluginFatal} and restart/kill the bot manually if you do!)
 */

/**
 * Discord.js Client with a plugin framework
 * @extends {Client}
 */
class PluginsClient extends discord.Client {
	/**
	 * @param {PluginsClientOptions} [options] - Options for the client
	 */
	constructor(options) {
		super(options);

		/**
		 * The client's plugin manager
		 * @type {PluginManager}
		 */
		this.plugins = new PluginManager(this, options);
	}

	async destroy() {
		await this.plugins.unloadAll();
		await super.destroy();
	}
}

/**
 * Emitted when a plugin is registered
 * @event PluginsClient#pluginRegister
 * @param {Plugin} plugin - Plugin that was registered
 * @param {PluginManager} manager - Registry that the plugin was registered to
 */

/**
 * Emitted when a group is registered
 * @event PluginsClient#pluginGroupRegister
 * @param {PluginGroup} group - Group that was registered
 * @param {PluginManager} manager - Registry that the group was registered to
 */

/**
 * Emitted when a {@link Plugin} throws an uncaught error. When this event is emitted
 * the plugin is considered to have crashed.
 * @event PluginsClient#pluginError
 * @param {Plugin} plugin - Plugin that errored
 * @param {Error} error - The thrown error
 */

/**
 * Emitted when the {@link PluginManager} fails to unload a crashed {@link Plugin}.
 * When this event is emitted, the client is considered to be in an
 * irrecoverably unstable state, and it will disconnect the client
 * and crash the process after a 5 seconds grace period to let any
 * logging finish.
 * @event PluginsClient#pluginFatal
 * @param {Plugin} plugin - Plugin that errored
 * @param {Error} error - The error that prevented the manager from unloading the plugin
 */

module.exports = PluginsClient;
