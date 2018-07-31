// eslint-disable-next-line spaced-comment
/// <reference path="../../typings/index.d.ts" />
const EventEmitter = require('events');
const { oneLine } = require('common-tags');

/**
 * Parses dependencies from the info format to a general format
 * @param {string} defaultGroup The group which to use if no group is
 * explicitly specified
 * @param {Array} dependencies The dependency array to parse
 * @return {?Array}
 */
function parseDependencies(defaultGroup, dependencies) {
	if(!dependencies) return null;
	const parsedDeps = [];
	for(let dependency in dependencies) {
		let dependencyName;
		let reloadWithDependency = false;
		if(typeof dependency === 'string') {
			dependencyName = dependency;
		} else {
			dependencyName = dependency[0];
		}
		dependencyName = (dependencyName.includes(':') ? '' : defaultGroup) + dependencyName;

		if(Array.isArray(dependency) && dependency.length === 2) {
			reloadWithDependency = dependency[1];
		}

		parsedDeps.push([dependencyName, reloadWithDependency]);
	}
	return parsedDeps;
}

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
		 * @function
		 * @param {boolean} throwOnFail Whether to rethrow any errors during reloading,
		 * or if to attempt a revert and just return the error.
		 * NOTE: It will still throw in some instances,
		 * if the error happened in a way that rollback would be deemed unstable, even when this is set to false.
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
		 * @function
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
		 * Other plugins this plugin depends on
		 * @type {?Array}
		 */
		this.dependencies = parseDependencies(info.group, info.dependencies);

		/**
		 * Whether the plugin should start on load
		 * @type {boolean}
		 */
		this.autostart = 'autostart' in info ? info.autostart : true;

		/**
		 * Wait for which event to start this plugin with autostart
		 * @type {?string}
		 */
		this.startOn = 'startOn' in info ? Array.isArray(info.startOn) ? info.startOn : [info.startOn] : null;

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

		/**
		 * Wether this plugin is destroyed
		 * @name Plugin#destroyed
		 * @function
		 * @type {boolean}
		 * @readonly
		 */
		Reflect.defineProperty(this, 'crash', {
			value: function crash(err) {
				this.client.plugins.crash(this, err);
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
				if(_started) {
					this.stop();
				} else {
					this.client.removeAllListeners();
				}
				origDestroy.apply(this, args);
				_destroyed = true;
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
	 * @param {DependencyInfo} dependencies - Info to validate
	 * @private
	 */
	static validateDependencies(dependencies) {
		if(!Array.isArray(dependencies)) throw new TypeError('Dependencies must be an array if set');
		for(let dependency of dependencies) {
			if(typeof dependency === 'string') continue;
			if(!Array.isArray(dependency)) throw new TypeError('Each dependency must either be a string or array');
			if(dependency.length > 2 || dependency.length <= 0) {
				throw new TypeError('If a dependency is an array, ' +
				'its length should be greater than or equal to 1 and less than or equal to 2');
			}
			if(typeof dependency[0] !== 'string') {
				throw new TypeError('If a dependency is an array, first element should be a string');
			}
			if(dependency.length === 2 && typeof dependency[1] !== 'boolean') {
				throw new TypeError('If a dependency is an array, second element should be a boolean if set');
			}
		}
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
			a plugin directly, use PluginManager#load.`);
		}
		if(typeof info !== 'object') throw new TypeError('Plugin info must be an Object.');
		if(typeof info.name !== 'string') throw new TypeError('Plugin name must be a string.');
		if(typeof info.group !== 'string') throw new TypeError('Plugin group must be a string.');
		if(typeof info.description !== 'string') throw new TypeError('Plugin description must be a string.');
		if('details' in info && typeof info.details !== 'string') {
			throw new TypeError('Plugin details must be a string if set.');
		}
		if('startOn' in info && typeof info.startOn !== 'string' && !Array.isArray(info.startOn)) {
			throw new TypeError('Plugin startOn must be a string or array of strings if set.');
		}
		if(Array.isArray(info.startOn) && info.startOn.some(evt => typeof evt !== 'string')) {
			throw new TypeError('All elements of startOn must be a string.');
		}
		if('autostart' in info && typeof info.autostart !== 'boolean') {
			throw new TypeError('Plugin autostart must be a boolean if set.');
		}
		if('depedencies' in info) this.validateDependencies(info.dependencies);
	}
}

module.exports = Plugin;
