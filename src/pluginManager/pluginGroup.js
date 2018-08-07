const { Collection } = require('discord.js');

/** A group for plugins
 * @extends {Collection<string,Plugin>}
*/
class PluginGroup extends Collection {
	/**
	 * @param {PluginsClient} client - The client the group is for
	 * @param {string} id - The ID for the group
	 * @param {string} [name=id] - The name of the group
	 * @param {boolean} [guarded=false] - Whether the group should be protected from disabling
	 */
	constructor(client, id, name, guarded = false) {
		super();
		if(!client) throw new Error('A client must be specified.');
		if(typeof id !== 'string') throw new TypeError('Group ID must be a string.');
		if(id.includes(':')) throw new Error('Group ID cannot include \':\'');

		/**
		 * Client that this group is for
		 * @name PluginGroup#client
		 * @type {PluginsClient}
		 * @readonly
		 */
		Object.defineProperty(this, 'client', { value: client });

		/**
		 * ID of this group
		 * @type {string}
		 */
		this.id = id;

		/**
		 * Name of this group
		 * @type {string}
		 */
		this.name = name || id;

		/**
		 * Whether or not this group is protected from being disabled
		 * @type {boolean}
		 */
		this.guarded = guarded;
	}

	/**
	 * Stops all of the group's plugins
	 */
	stop() {
		for(const plugin of this.values()) plugin.stop();
	}

	/**
	 * Stops all of the group's plugins
	 */
	start() {
		for(const plugin of this.values()) plugin.start();
	}

	/**
	 * Unloads all of the group's plugins
	 */
	unload() {
		for(const plugin of this.values()) plugin.unload();
	}

	/**
	 * Reloads all of the group's plugins
	 */
	reload() {
		for(const plugin of this.values()) plugin.reload();
	}
}

module.exports = PluginGroup;
