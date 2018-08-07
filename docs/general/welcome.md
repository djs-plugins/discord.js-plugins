# Welcome!
Welcome to the discord.js-plugins documentation.

discord.js-plugins is a 3rd party framework and not affiliated with the discord.js library in any way.

discord.js-plugins is still very much a work in progress and not suited for production use.
The API is also not set in stone and may change drastically as development moves forward.
Once we reach initial release the API will be more stable and we'll try to not make too many drastic
breaking changes to the API after that, any breaking changes will result in a major version update.

## About
discord.js-plugins is an unofficial plugin framework for [discord.js](https://discord.js.org/#/).
It adds a plugin manager to the main discord.js client which can be loaded/unloaded/reloaded at runtime.

It also includes some rudamentary crash handler, for when a plugin crashes. This is not perfect, but
should catch most basic errors that occurs within an eventhandler of a plugin, and just unload that
specific bad plugin rather than crashing the entire bot.

It's flexible, object oriented and makes it easy to create a modular bot.

## Installation
**ONLY TESTED ON Node.js 10.5.0**  
`npm install git+https://github.com/NbOpposite/discord.js-plugins.git`