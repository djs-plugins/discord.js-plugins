/* eslint-env node, mocha */
/* eslint-disable prefer-arrow-callback,func-names */
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const should = chai.should(); // eslint-disable-line no-unused-vars
const EventEmitter = require('events');
const PluginManager = require('../src/pluginManager/manager');
const Plugin = require('../src/pluginManager/base');
const PluginGroup = require('../src/pluginManager/pluginGroup');

describe('PluginManager', function() {
	describe('core', function() {
		let client;
		/**
		 * @type {PluginManager}
		 */
		let manager;
		beforeEach(function() {
			client = new EventEmitter();
			manager = new PluginManager(client);
		});
		afterEach(function() {
			client.removeAllListeners();
		});
		xit('constructor', function() {
			manager.plugins.size.should.be.equal(0, 'Plugins should be empty');
			manager.groups.size.should.be.equal(1, 'Groups should be one');
			manager.groups.firstKey().should.be.equal(manager.groups.first().id, 'Group id should be key of groups');
		});
		xit('registerGroup', function() {
			class TestGroup extends PluginGroup {
				constructor(_client) {
					super(_client, 'test1');
				}
			}
			manager.registerGroup(TestGroup);
			manager.groups.size.should.be.equal(2);
			manager.groups.get('test1').should.be.instanceof(TestGroup);
		});
		xit('registerPlugin', function() {
			class EmptyPlugin extends Plugin {
				constructor(_client) {
					const info = {
						name: 'empty',
						description: 'empty test plugin'
					};
					super(_client, info);
				}
			}
			manager.loadPlugin(EmptyPlugin);
			manager.plugins.size.should.be.equal(1);
			manager.plugins.get('empty').should.be.instanceof(EmptyPlugin);
		});
		xit('registerPluginsIn', function() {
			const path = require('path');
			manager.loadPluginsIn(path.join(__dirname, 'plugins'));
			manager.plugins.size.should.be.equal(1);
			manager.plugins.get('file').should.be.instanceof(require('./plugins/default/testPluginFile'));
		});
	});
});
