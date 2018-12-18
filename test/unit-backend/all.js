const mockery = require('mockery'),
      chai = require('chai'),
      helpers = require('../helpers');

before(function() {
  chai.use(require('chai-shallow-deep-equal'));
  chai.use(require('sinon-chai'));
  chai.use(require('chai-as-promised'));
  this.helpers = {};
  this.config = {};
  helpers(this.helpers);
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
