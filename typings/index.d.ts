declare module 'discord.js-plugins' {
	import { Client as dClient } from 'discord.js';
	export class PluginManager {
		constructor(client: Client);
		readonly client: Client;
		private readonly proxyClient: Client;
	}
	export class Client extends dClient {
		plugins: PluginManager;
	}
	export class Plugin {

	}
	export type PluginClass = typeof Plugin;
	export function inject<T extends dClient>(client: T) : T & Client
}