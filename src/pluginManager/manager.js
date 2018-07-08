// eslint-disable-next-line spaced-comment
/// <reference path="../../typings/index.d.ts" />
const { Collection } = require('discord.js');
const Plugin = require('./base');
const PluginGroup = require('./pluginGroup');
const { oneLine } = require('common-tags');
const { isConstructor } = require('../utils');
const EventProxyHandler = require('./eventProxyHandler');

/**
 * @typedef {import('../client')} Client
 */
/**
 * @typedef {import('discord.js-plugins').PluginClass} PluginClass
 */

 /**
  * @class {PluginManager} PluginManager
  */
class PluginManager {
    /** @param {Client} client - Client to use  */
	constructor(client) {
        /**
         * The client that instantiated this
         * @name PluginManager#client
         * @type {Client}
         * @readonly
         */
		Object.defineProperty(this, 'client', { value: client });

        /**
         * Registered plugins
         * @type {Collection<string, Plugin>}
         */
		this.plugins = new Collection();

        /**
         * Registered plugin groups
         * @type {Collection<string, PluginGroup>}
         */
		this.groups = new Collection([['default', new PluginGroup(client, 'default')]]);

		/**
         * Event listeners that each plugin has registered.
         * @type {Collection<Plugin, Collection<string, Set<Function>>>}
         */
		this.listeners = new Collection();

        /**
         * Fully resolved path to the bot's plugins directory
         * @type {?string}
         */
		this.pluginsPath = null;
	}

  /**
   * Registers a single group
   * @param {PluginGroup|Function|Object|string} group - A PluginGroup instance, a constructor, or the group ID
   * @param {string} [name] - Name for the group (if the first argument is the group ID)
   * @param {boolean} [guarded] - Whether the group should be guarded (if the first argument is the group ID)
   * @return {PluginManager}
   * @see {@link PluginManager#registerGroups}
   */
	registerGroup(group, name, guarded) {
		if(typeof group === 'string') {
			group = new PluginGroup(this.client, group, name, guarded);
		} else if(typeof group === 'function') {
			group = new group(this.client); // eslint-disable-line new-cap
		} else if(typeof group === 'object' && !(group instanceof PluginGroup)) {
			group = new PluginGroup(this.client, group.id, group.name, group.guarded);
		}

		const existing = this.groups.get(group.id);
		if(existing) {
			existing.name = group.name;
			this.client.emit('debug', `Plugin group ${group.id} is already registered; renamed it to "${group.name}".`);
		} else {
			this.groups.set(group.id, group);
      /**
       * Emitted when a group is registered
       * @event PluginsClient#pluginGroupRegister
       * @param {PluginGroup} group - Group that was registered
       * @param {PluginManager} manager - Registry that the group was registered to
       */
			this.client.emit('pluginGroupRegister', group, this);
			this.client.emit('debug', `Registered plugin group ${group.id}.`);
		}

		return this;
	}

  /**
   * Registers multiple groups
   * @param {PluginGroup[]|Function[]|Object[]|Array<string[]>} groups - An array of PluginGroup instances,
   * constructors, plain objects (with ID, name, and guarded properties),
   * or arrays of {@link PluginManager#registerGroup} parameters
   * @return {PluginManager}
   * @example
   * plugins.registerGroups([
   * 	['fun', 'Fun'],
   * 	['mod', 'Moderation']
   * ]);
   * @example
   * plugins.registerGroups([
   * 	{ id: 'fun', name: 'Fun' },
   * 	{ id: 'mod', name: 'Moderation' }
   * ]);
   */
	registerGroups(groups) {
		if(!Array.isArray(groups)) throw new TypeError('Groups must be an Array.');
		for(const group of groups) {
			if(Array.isArray(group)) this.registerGroup(...group);
			else this.registerGroup(group);
		}
		return this;
	}

  /**
   * Loads a single plugin
   * @param {PluginClass} PluginClass - a constructor for a Plugin
   * @return {PluginManager}
   * @see {@link PluginManager#loadPlugins}
   */
	loadPlugin(PluginClass) {
		if(!isConstructor(PluginClass)) throw new Error(`Plugin is not a constructor: ${PluginClass}`);
		if(!(PluginClass.prototype instanceof Plugin)) {
			throw new Error(`${PluginClass} is not a subclass of Plugin`);
		}
		const proxyHandler = new EventProxyHandler(this);
		const plugin = new PluginClass(new Proxy(this.client, proxyHandler));
		proxyHandler.setPlugin(plugin);

        // Make sure there aren't any conflicts
		if(this.plugins.some(mod => mod.name === plugin.name)) {
			throw new Error(`A plugin with the name "${plugin.name}" is already registered.`);
		}
		const group = this.groups.find(grp => grp.id === plugin.groupID);
		if(!group) throw new Error(`Group "${plugin.groupID}" is not registered.`);

		// Add the plugin
		plugin.group = group;
		group.plugins.set(plugin.name, plugin);
		this.plugins.set(plugin.name, plugin);

		/**
		 * Emitted when a plugin is registered
		 * @event Client#pluginRegister
		 * @param {Plugin} plugin - Plugin that was registered
		 * @param {PluginManager} manager - Registry that the plugin was registered to
		 */
		this.client.emit('pluginLoaded', plugin, this);
		this.client.emit('debug', `Loaded plugin ${group.id}:${plugin.name}.`);

		if(plugin.autostart || (plugin.autostart !== false && group.autostart) || plugin.guarded || group.guarded) {
			if(plugin.autostart === false && plugin.guarded) {
				this.client.emit('warn', oneLine`${plugin} have disabled autostart, but have guarded set.
				this is probably incorrect. Guarded overrides autostart, so autostarting plugin anyway`);
			}
			if(plugin.autostart === false && !plugin.guarded) {
				this.client.emit('warn', oneLine`${plugin} did not have autostart set, is part of
				${group} which has guarded set. This is probably incorrect.
				Guarded overrides autostart, so autostarting plugin anyway`);
			}
			plugin.start();
		}

		return this;
	}

  /**
   * Loads a single plugin
   * @param {PluginClass[]} pluginClasses - a constructor for a Plugin
   * @param {boolean} [ignoreInvalid=false] - Whether to skip over invalid plugins without throwing an error
   * @return {PluginManager}
   * @see {@link PluginManager#registerPlugins}
   */
	loadPlugins(pluginClasses, ignoreInvalid = false) {
		if(!Array.isArray(pluginClasses)) throw new TypeError('Plugins must be an Array.');
		for(const pluginClass of pluginClasses) {
			if(ignoreInvalid && (!isConstructor(pluginClass) || !(pluginClass.prototype instanceof Plugin))) {
				this.client.emit('warn', `Attempting to register an invalid plugin class: ${pluginClass}; skipping.`);
				continue;
			}
			this.loadPlugin(pluginClass);
		}
		return this;
	}

	/**
	 * Loads all plugins in a directory. The files must export a Plugin class constructor.
	 * @param {string|RequireAllOptions} options - The path to the directory, or a require-all options object
	 * @return {PluginManager}
	 * @example
	 * const path = require('path');
	 * plugins.loadPluginsIn(path.join(__dirname, 'plugins'));
	 */
	loadPluginsIn(options) {
		const obj = require('require-all')(options);
		const plugins = [];
		for(const group of Object.values(obj)) {
			for(let plugin of Object.values(group)) {
				if(typeof plugin.default === 'function') plugin = plugin.default;
				plugins.push(plugin);
			}
		}
		if(typeof options === 'string' && !this.pluginsPath) this.pluginsPath = options;
		return this.loadPlugins(plugins, true);
	}

	unloadPlugin(plugin) {
		if(!this.plugins.has(plugin.name) && !this.plugins.has(plugin)) throw new Error('Plugin not loaded');
		if(!(plugin instanceof Plugin)) plugin = this.plugins.get(plugin);
		if(plugin.guarded) throw new Error(`Refusing to unload plugin, ${plugin} is guarded`);
		if(plugin.group.guarded) {
			throw new Error(oneLine`Refusing to unload plugin, ${plugin}
			is part of ${plugin.group} and that group is guarded`);
		}

		const cmdPath = this.resolvePluginPath(plugin.groupID, plugin.memberName);
		if(!require.cache[cmdPath]) throw new Error('Plugin cannot be unloaded.');

		plugin.stop();
		plugin.destroy();

		delete require.cache[cmdPath];
		this.plugins.delete(plugin.name);
	}
}

module.exports = PluginManager;
