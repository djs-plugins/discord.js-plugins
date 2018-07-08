// eslint-disable-next-line spaced-comment
/// <reference path="../../typings/index.d.ts" />
const EventEmitter = require('events');
const { oneLine } = require('common-tags');
/**
 * @typedef {import('../client')} Client
 */

/** A plugin that can be loaded in a client
 * @abstract
*/
class Plugin {
	/**
	 * @typedef {Object} PluginInfo
	 * @property {string} name - The name of the plugin (must be lowercase)
	 * @property {string} group - The ID of the group the plugin belongs to (must be lowercase)
	 * @property {string} [guarded=false] - Whether the plugin is protected from being disabled
	 * @property {string} [autostart=true] - Whether the plugin should start on load
	 * @property {string} description - A short description of the plugin
	 * @property {string} [details] - A detailed description of the plugin and its functionality
	 */

	/**
	 * Constructor, do not initiate any on listeners {@link Client} here.
	 * They can, and will be removed with {@link Plugin#stop}. Initiate
	 * listeners in {@link Plugin#start} instead.
	 * @param {Client} client - The client the plugin is for
	 * @param {PluginInfo} info - The plugin information
	 * @private
	 */
	constructor(client, info) {
		if(new.target === Plugin) {
			throw new TypeError('Cannot construct Abstract instances directly');
		}

		/**
		 * Client that this plugin is for
		 * @name Plugin#client
		 * @type {PluginsClient}
		 * @readonly
		 */
		Reflect.defineProperty(this, 'client', { value: client });

		/**
		 * Reload this plugin
		 * @name Plugin#reload
		 * @type {Function:void}
		 * @return {void}
		 * @readonly
		 */
		Reflect.defineProperty(this, 'reload', {
			value: function unload() {
				this.client.plugins.reload(this);
			}
		});

		/**
		 * Unload this plugin
		 * @name Plugin#unload
		 * @type {Function:void}
		 * @return {void}
		 * @readonly
		 */
		Reflect.defineProperty(this, 'unload', {
			value: function unload() {
				this.client.plugins.unload(this);
			}
		});

		/**
		 * Name of this plugin
		 * @type {string}
		 */
		this.name = info.name;

		/**
		 * ID of the group the plugin belongs to
		 * @type {string}
		 */
		this.groupID = info.group || 'default';

		/**
		 * The group the plugin belongs to, assigned upon registration
		 * @type {?PluginGroup}
		 */
		this.group = null;

		/**
		 * Short description of the plugin
		 * @type {string}
		 */
		this.description = info.description;

		/**
		 * Long description of the plugin
		 * @type {?string}
		 */
		this.details = info.details || null;

		/**
		 * Whether the plugin is protected from being disabled
		 * @type {boolean}
		 */
		this.guarded = Boolean(info.guarded);

		/**
		 * Whether the plugin should start on load
		 * @type {boolean}
		 */
		this.autostart = info.autostart !== 'undefined' ? Boolean(info.autostart) : true;
	}

	/**
	 * Starts the plugin. Register any event listeners to {@link Client} here.
	 * @abstract
	 */
	start() {
		// ABSTRACT
	}

	/**
	 * Called when the plugin gets stopped. Event listeners on {@link Client} are automatically cleared.
	 * If you override this, make sure you call `super.stop()` to automatically clear all registered listeners.
	 */
	stop() {
		this.client.removeAllListeners();
	}

	/**
	 * Called when the plugin gets unloaded.
	 * Using {@link Plugin#stop} over `Plugin#destroy` is preferred.
	 * @abstract
	 */
	destroy() {
		// ABSTRACT
	}

	/**
	 * Validates the constructor parameters
	 * @param {Client} client - Client to validate
	 * @param {PluginInfo} info - Info to validate
	 * @private
	 */
	static validateInfo(client, info) {
		if(!client) throw new Error('A client must be specified.');
		if(client.on === EventEmitter.prototype.on) {
			throw new Error(oneLine`You should not instantiate
			a plugin directly, use to PluginManager#load.`);
		}
		if(typeof info !== 'object') throw new TypeError('Plugin info must be an Object.');
		if(typeof info.name !== 'string') throw new TypeError('Plugin name must be a string.');
		if('group' in info && typeof info.group !== 'string') throw new TypeError('Plugin group must be a string if set.');
		if(typeof info.description !== 'string') throw new TypeError('Plugin description must be a string.');
		if('details' in info && typeof info.details !== 'string') throw new TypeError('Plugin details must be a string.');
	}
}

module.exports = Plugin;
