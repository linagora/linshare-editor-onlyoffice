const expect = require('chai').expect,
      mockery = require('mockery'),
      sinon = require('sinon'),
      { PUBSUB_EVENTS, WEBSOCKET_EVENTS } = require('../../../src/lib/constants'),
      noop = () => {};

describe('The wsserver documents module', function() {
  let helpersMock;

  beforeEach(function() {
    helpersMock = {
      getSocketInfo: sinon.stub().returns({ user: {} })
    };
  });

  it('should emit error to only requester if failed to load document state', function(done) {
    const util = require('util');
    const events = require('events');
    const eventEmitter = new events.EventEmitter();

    eventEmitter.use = noop;
    eventEmitter.of = () => eventEmitter;

    function Socket(handshake) {
      this.request = handshake;
      events.EventEmitter.call(this);
    }
    util.inherits(Socket, events.EventEmitter);

    Socket.prototype.join = noop;

    function DocumentMock() {}
    const loadError = new Error('an error');
    const jsonError = {
      code: 500,
      message: 'Server Error',
      details: 'Error while getting document'
    };

    DocumentMock.prototype.load = sinon.stub().returns(Promise.reject(loadError));

    helpersMock.build500Error = sinon.stub().returns(jsonError);

    mockery.registerMock('../lib/document', DocumentMock);
    mockery.registerMock('./helpers', helpersMock);

    const documents = this.helpers.requireBackend('wsserver/documents');

    documents.init(eventEmitter);

    const socket = new Socket();

    eventEmitter.emit('connection', socket);

    process.nextTick(function() {
      socket.emit('subscribe', {
        workGroupId: 'wgrId',
        documentId: 'docId',
        documentStorageServerUrl: 'url'
      });

      socket.emit = sinon.spy();
      setImmediate(function() {
        expect(DocumentMock.prototype.load).to.have.been.called;
        expect(helpersMock.build500Error).to.have.been.calledWith('Error while getting document', loadError);
        expect(socket.emit).to.have.been.calledWith(WEBSOCKET_EVENTS.DOCUMENT_LOAD_FAILED, jsonError);

        done();
      });
    });
  });

  it('should emit error to all users in room if got PUBSUB_EVENTS.DOCUMENT_DOWNLOAD_FAILED from pubsub', function(done) {
    const emitMock = sinon.spy();
    const ioToMock = sinon.stub().returns({
      emit: emitMock
    });
    const ioMock = {
      use: noop,
      of: () => ({
        on: noop,
        to: ioToMock
      })
    };
    const jsonError = {
      code: 500,
      message: 'Server Error',
      details: 'Error while getting document'
    };

    helpersMock.build500Error = sinon.stub().returns(jsonError);

    mockery.registerMock('../lib/document', {});
    mockery.registerMock('./helpers', helpersMock);

    const documents = this.helpers.requireBackend('wsserver/documents');
    const pubsub = this.helpers.requireBackend('lib/pubsub');

    documents.init(ioMock);

    const data = {
      document: { uuid: '123' },
      error: 'download error'
    };
    pubsub.topic(PUBSUB_EVENTS.DOCUMENT_DOWNLOAD_FAILED).publish(data);

    process.nextTick(function() {
      expect(helpersMock.build500Error).to.have.been.calledWith('Error while getting document', data.error);
      expect(ioToMock).to.have.been.calledWith(data.document.uuid);
      expect(emitMock).to.have.been.calledWith(WEBSOCKET_EVENTS.DOCUMENT_LOAD_FAILED, jsonError);

      done();
    });
  });
});
