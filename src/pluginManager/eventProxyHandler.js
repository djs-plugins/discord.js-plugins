const { stripIndents } = require('common-tags');
const Plugin = require('./base');
const { Collection } = require('discord.js');
const ReversibleMap = require('../reversibleMap');
const listenersMap = new WeakMap();

 /**
  * A proxy handler for {@link Client} this isolates the event listeners
  * on {@link Client} on a per-plugin basis and catches any errors that any
  * listeners to {@link Client} may throw.
  * @private
  */
class EventProxyHandler {
	constructor() {
		this.cache = new Collection();
		this.plugin = null;
	}

	/**
	 * Sets the plugin for this event handler.
	 * This will also cause a warning to be emitted on the plugins client object
	 * in the event that any listeners got registered prior to the plugin being set,
	 * since this likely means that the plugin was registering listeners in the constructor.
	 * @param {Plugin} plugin - The plugin this handler is for
	 * @throws {Error} If you try to set the plugin twice.
	 */
	setPlugin(plugin) {
		if(this.plugin) throw new Error('Attempting to set plugin twice');
		if(!(plugin instanceof Plugin)) throw new Error(`${Plugin} is not a valid Plugin instance`);
		if(this.cache.size) {
			plugin.client.emit('warn', stripIndents`
			Plugin ${plugin} is registering listeners in the constructor.
			You probably want to register listeners in the Plugin#load method instead.`);
		}
		listenersMap.set(plugin, this.cache);
		delete this.cache;
		this.plugin = plugin;
	}
	get(target, prop, receiver, ...args) {
		const cache = this.cache;
		const plugin = this.plugin;
		switch(prop) {
			case 'addListener':
			case 'on':
			case 'prependListener':
			case 'prependOnceListener':
				return { [prop]: (eventName, listener) => {
					const wrappedListener = async(...listenerArgs) => {
						try {
							await listener(...listenerArgs);
						} catch(err) {
							plugin.crash(err);
						}
					};
					target[prop](eventName, wrappedListener);
					const listeners = cache || listenersMap.get(plugin);

					let fns = listeners.get(eventName);
					if(!fns) listeners.set(eventName, fns = new ReversibleMap());

					fns.set(listener, wrappedListener);
					return receiver;
				} }[prop];
			case 'removeListener':
			case 'off':
				return { [prop]: (eventName, listener) => {
					const listeners = cache || listenersMap.get(plugin);
					if(!listeners.has(eventName) || !listeners.get(eventName).has(listener)) {
						return receiver;
					}
					const wrappedListener = listeners.get(eventName).get(listener);
					target[prop](eventName, wrappedListener);
					if(!target.listeners(eventName).includes(wrappedListener)) {
						listeners.get(eventName).delete(listener);
					}
					return receiver;
				} }[prop];
			case 'removeAllListeners':
				return function removeAllListeners(eventName) {
					const listeners = cache || listenersMap.get(plugin);
					if(!eventName) {
						listeners.forEach((fns, ev) => {
							const wrappedListeners = [...fns.values()];
							target.listeners(ev).filter(evListener => wrappedListeners.includes(evListener)).forEach(fn => {
								target.off(ev, fn);
							});
						});
						listeners.clear();
					} else {
						const fns = listeners.get(eventName);
						const wrappedListeners = [...fns.values()];
						target.listeners(eventName).filter(evListener => wrappedListeners.includes(evListener)).forEach(fn => {
							target.off(eventName, fn);
						});
						fns.clear();
					}
					return receiver;
				};
			case 'listeners':
				return function listeners(eventName) {
					const proxyListeners = (cache || listenersMap.get(plugin)).get(eventName);
					if(!proxyListeners) return [];
					return target.listeners(eventName)
						.map(listener => proxyListeners.reversed.get(listener)).filter(listener => listener);
				};
			case 'listenerCount':
				return function listenerCount(eventName) {
					return receiver.listeners(eventName).length;
				};
			default:
				return Reflect.get(target, prop, receiver, ...args);
		}
	}
}
module.exports = EventProxyHandler;
