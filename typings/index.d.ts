// Dummy typedefs for Commando, so the project can build without it.
declare module 'discord.js-commando' {
	export type CommandoClientOptions = never;
	export class Client {}
}

declare module 'discord.js-plugins' {
	import { Client as dClient } from 'discord.js';
	import { Client as cClient } from 'discord.js-commando';
	export class PluginManager {
		constructor(client: Client);
		readonly client: Client;
		private readonly proxyClient: Client;
	}
	export class Client extends dClient implements cClient {
		plugins: PluginManager;
	}
	export class Plugin {

	}
	export type PluginClass = typeof Plugin;
	export function inject<T extends dClient>(client: T) : Client
}