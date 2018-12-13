const pubsub = require('../lib/pubsub');
const logger = require('../lib/logger');
const Document = require('../lib/document');
const { DOCUMENT_STATES } = require('../lib/constants');
const { getSocketInfo } = require('./helpers');

const { PUBSUB_EVENTS, WEBSOCKET_EVENTS } = require('../lib/constants');

const NAMESPACE = '/documents';
let initialized = false;

const init = function(sio) {
  if (initialized) {
    logger.warn('The documents service is already initialized');

    return;
  }
  sio.use(require('./auth/token'));

  const documentNamespace = sio.of(NAMESPACE);

  pubsub.topic(PUBSUB_EVENTS.DOCUMENT_DOWNLOADED).subscribe(_onDocumentDownloaded);

  documentNamespace.on('connection', function(socket) {
    logger.info(`New connection on ${NAMESPACE}`);

    socket.on('subscribe', async function({ workGroupId, documentId }) {
      logger.info(`Joining document room ${documentId}`);
      socket.join(documentId);

      const { userEmail } = getSocketInfo(socket).query;

      try {
        const document = new Document(documentId, workGroupId, userEmail);

        await document.loadState();

        if (!document.state) {
          await document.setState(DOCUMENT_STATES.downloading);

          document.save()
            .catch(error => logger.error('Error while saving document', error));
        }

        if (document.isDownloaded()) {
          await document.populateMetadata();

          documentNamespace.to(documentId).emit(WEBSOCKET_EVENTS.DOCUMENT_LOAD_DONE, {
            document: document.denormalize()
          });
        }
      } catch (error) {
        logger.error('Error while getting document', error);
        documentNamespace.to(documentId).emit(WEBSOCKET_EVENTS.ERROR, new Error('Error while getting document'));
      }
    });

    socket.on('unsubscribe', ({ documentId }) => {
      logger.info(`Leaving document room ${documentId}`);
      socket.leave(documentId);
    });
  });

  initialized = true;

  function _onDocumentDownloaded(document) {
    if (documentNamespace) {
      documentNamespace.to(document.uuid).emit(WEBSOCKET_EVENTS.DOCUMENT_LOAD_DONE, {
        document
      });
    }
  }
};

module.exports = {
  init
};
