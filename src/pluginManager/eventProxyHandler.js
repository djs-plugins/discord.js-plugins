const { stripIndents } = require('common-tags');
const Plugin = require('./base');
const { Collection } = require('discord.js');

 /**
  * @class {EventProxyHandler} EventProxyHandler
  */
class EventProxyHandler {
	constructor(manager) {
		this.manager = manager;
		this.cache = new Collection();
		this.plugin = null;
	}
	setPlugin(plugin) {
		if(this.plugin) throw new Error('Attempting to set plugin twice');
		if(!(plugin instanceof Plugin)) throw new Error(`${Plugin} is not a valid Plugin instance`);
		if(this.cache.size) {
			this.manager.client.emit('warn', stripIndents`
			Plugin ${plugin} is registering listeners in the constructor.
			You probably want to register listeners in the Plugin#load method instead.`);
		}
		this.manager.listeners.set(plugin, this.cache);
		delete this.cache;
		this.plugin = plugin;
	}
	get(target, prop, receiver, ...args) {
		const manager = this.manager;
		const cache = this.cache;
		const plugin = this.plugin;
		switch(prop) {
			case 'addListener':
			case 'on':
			case 'prependListener':
			case 'prependOnceListener':
				// eslint-disable-next-line func-names
				return { [prop]: (eventName, listener) => {
					const wrappedListner = async(...listnerArgs) => {
						try {
							await listener(...listnerArgs);
						} catch(err) {
							manager.crash(plugin, err);
						}
					};
					target[prop](eventName, wrappedListner);
					const listeners = cache || manager.listeners.get(plugin);

					let fns = listeners.get(eventName);
					if(!fns) listeners.set(eventName, fns = new Map());

					fns.set(listener, wrappedListner);
					return receiver;
				} }[prop];
			case 'removeListener':
			case 'off':
				return { [prop]: (eventName, listener) => {
					const listeners = cache || manager.listeners.get(plugin);
					if(!listeners.has(eventName) || !listeners.get(eventName).has(listener)) {
						return receiver;
					}
					const wrappedListner = listeners.get(eventName).get(listener);
					target[prop](eventName, wrappedListner);
					if(!target.listeners(eventName).includes(wrappedListner)) {
						listeners.get(eventName).delete(listener);
					}
					return receiver;
				} }[prop];
			case 'removeAllListeners':
				return function removeAllListeners(eventName) {
					const listeners = cache || manager.listeners.get(plugin);
					if(!eventName) {
						listeners.forEach((fns, ev) => {
							for(let fn of fns) {
								target.listeners(ev).filter(evListner => evListner === fn).forEach(() => {
									target.off(eventName, fn);
								});
							}
						});
					} else {
						for(let fn of listeners.get(eventName)) {
							target.listeners(eventName).filter(evListner => evListner === fn).forEach(() => {
								target.off(eventName, fn);
							});
						}
					}
					return receiver;
				};
			case 'listeners':
				return function listeners(eventName) {
					const proxyListeners = (cache || manager.listeners.get(plugin)).get(eventName);
					if(!proxyListeners) return [];
					return target.listeners(eventName).map(listner => proxyListeners.get(listner)).filter(listner => listner);
				};
			case 'listnerCount':
				return function listnerCount(eventName) {
					return receiver.listners(eventName).length;
				};
			default:
				return Reflect.get(target, prop, receiver, ...args);
		}
	}
}
module.exports = EventProxyHandler;
