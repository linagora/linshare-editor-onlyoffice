const mockery = require('mockery');
const chai = require('chai');
const path = require('path');
const helpers = require('../helpers');

before(function() {
  chai.use(require('chai-shallow-deep-equal'));
  chai.use(require('sinon-chai'));
  chai.use(require('chai-as-promised'));

  const basePath = path.resolve(`${__dirname}/../..`);

  this.testEnv = {
    basePath,
    initCore: callback => {
      const core = require(`${basePath}/src/lib`);

      core.init();
      if (callback) {
        callback();
      }
      return core;
    }
  };

  this.helpers = {};
  this.config = {};

  helpers(this.helpers, this.testEnv);
});

beforeEach(function() {
  mockery.enable({ warnOnReplace: false, warnOnUnregistered: false, useCleanCache: true });
  mockery.registerMock('winston', {
    createLogger: () => ({
      stream: {},
      ...require('../fixtures/logger-noop'),
      add: () => {}
    }),
    transports: {
      Console: function() {} // eslint-disable-line
    },
    format: {
      printf: () => {},
      splat: () => {},
      combine: () => {},
      colorize: () => {},
      timestamp: () => {}
    },
    version: '3.0.0'
  });

  mockery.registerMock('config', {
    get: () => this.config,
    has: () => {},
    log: {
      file: {
        enabled: false
      },
      console: {
        enabled: false
      }
    }
  });
});

afterEach(function() {
  mockery.resetCache();
  mockery.deregisterAll();
  mockery.disable();
});
