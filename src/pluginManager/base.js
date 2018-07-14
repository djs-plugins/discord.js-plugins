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
		this.constructor.validateInfo(client, info);

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
			value: function reload(throwOnFail = false) {
				this.client.plugins.reloadPlugin(this, throwOnFail);
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
				this.client.plugins.unloadPlugin(this);
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
		this.groupID = info.group;

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
		this.autostart = 'autostart' in info ? info.autostart : true;

		let _started = false, _destroyed = false;

		/**
		 * Wether this plugin is started
		 * @name Plugin#started
		 * @type {boolean}
		 * @readonly
		 */
		Reflect.defineProperty(this, 'started', {
			get() {
				return _started;
			}
		});

		/**
		 * Wether this plugin is destroyed
		 * @name Plugin#destroyed
		 * @type {boolean}
		 * @readonly
		 */
		Reflect.defineProperty(this, 'destroyed', {
			get() {
				return _destroyed;
			}
		});

		const origStart = this.start;
		Reflect.defineProperty(this, 'start', {
			value: function start(...args) {
				if(this._destroyed) {
					throw Error(`Cannot start plugin '${this.groupID}:${this.name}', plugin destroyed`);
				}
				if(_started) return;
				origStart.apply(this, args);
				_started = true;
			}
		});

		const origStop = this.stop;
		Reflect.defineProperty(this, 'stop', {
			value: function stop(...args) {
				if(!_started) return;
				origStop.apply(this, args);
				this.client.removeAllListeners();
				_started = false;
			}
		});

		const origDestroy = this.destroy;
		Reflect.defineProperty(this, 'destroy', {
			value: function destroy(...args) {
				if(_started) this.stop();
				origDestroy.apply(this, args);
				_destroyed = true;
			}
		});

		Reflect.defineProperty(this, 'crash', {
			value: function crash(err) {
				this.client.plugins.crash(this, err);
			}
		});
	}

	/**
	 * Starts the plugin.
	 * Overload this to register any event listeners or {@link Plugin#client} here.
	 */
	start() {
		// ABSTRACT
	}

	/**
	 * Called when the plugin gets stopped. Event listeners on {@link Plugin#client} are automatically cleared.
	 */
	stop() {
		// ABSTRACT
	}

	/**
	 * Called when the plugin gets unloaded.
	 * Using {@link Plugin#stop} over `Plugin#destroy` is preferred.
	 * Will automatically call {@link Plugin#stop} if plugin is not stopped already.
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
		if(typeof info.group !== 'string') throw new TypeError('Plugin group must be a string.');
		if(typeof info.description !== 'string') throw new TypeError('Plugin description must be a string.');
		if('details' in info && typeof info.details !== 'string') throw new TypeError('Plugin details must be a string.');
		if('autostart' in info && typeof info.autostart !== 'boolean') {
			throw new TypeError('Plugin autostart must be a boolean if set.');
		}
	}
}

module.exports = Plugin;
