const pubsub = require('../lib/pubsub');
const logger = require('../lib/logger');
const { PUBSUB_EVENTS, WEBSOCKET_EVENTS } = require('../lib/constants');

const NAMESPACE = '/documents';
let initialized = false;

const init = function(sio) {
  if (initialized) {
    logger.warn('The documents service is already initialized');

    return;
  }

  const documentNamespace = sio.of(NAMESPACE);

  pubsub.topic(PUBSUB_EVENTS.DOCUMENT_DOWNLOADED).subscribe(_onDocumentDownloaded);

  documentNamespace.on('connection', function(socket) {
    logger.info(`New connection on ${NAMESPACE}`);

    socket.on('subscribe', documentId => {
      logger.info(`Joining document room ${documentId}`);
      socket.join(documentId);
    });

    socket.on('unsubscribe', documentId => {
      logger.info(`Leaving document room ${documentId}`);
      socket.leave(documentId);
    });
  });

  initialized = true;

  function _onDocumentDownloaded(document) {
    if (documentNamespace) {
      documentNamespace.to(document.uuid).emit(WEBSOCKET_EVENTS.DOCUMENT_LOAD_DONE, {
        document,
        room: document.uuid
      });
    }
  }
};

module.exports = {
  init
};
