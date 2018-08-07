let PluginManager;
const handler = { construct() { return {}; } };

/**
 * Contains various general-purpose utility methods.
 */
class Util {
	/**
	 * Checks if the provided object is a constructor.
	 * @param {*} func The object to check.
	 * @returns {boolean} True if the provided object is a constructor function, false otherwise.
	 */
	static isConstructor(func) {
		try {
			return !!new new Proxy(func, handler)();
		} catch(err) {
			return false;
		}
	}
	/**
	 * Inject a {@link PluginManager} in an already existing {@link Client} object.
	 * @param {Client} client - The client object to inject plugin manager into
	 * @param {PluginsClientOptions} [options] - Options for the client
	 * @returns {PluginsClient} The client object, but now with added plugin functionality!
	 */
	static inject(client, options) {
		const manager = new PluginManager(client, options);
		client.plugins = manager;
		return client;
	}
}
module.exports = Util;

PluginManager = require('./pluginManager/manager');
