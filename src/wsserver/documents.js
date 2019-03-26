const pubsub = require('../lib/pubsub');
const logger = require('../lib/logger');
const Document = require('../lib/document');
const { DOCUMENT_STATES } = require('../lib/constants');
const { getSocketInfo, build400Error, build403Error, build404Error, build500Error } = require('./helpers');

const { PUBSUB_EVENTS, WEBSOCKET_EVENTS } = require('../lib/constants');

const NAMESPACE = '/documents';
let initialized = false;

module.exports = {
  init
};

function init(sio) {
  if (initialized) {
    logger.warn('The documents service is already initialized');

    return;
  }
  sio.use(require('./auth/token'));

  const documentNamespace = sio.of(NAMESPACE);

  pubsub.topic(PUBSUB_EVENTS.DOCUMENT_DOWNLOADED).subscribe(_onDocumentDownloaded);
  pubsub.topic(PUBSUB_EVENTS.DOCUMENT_DOWNLOAD_FAILED).subscribe(_onDocumentDownloadFailed);
  pubsub.topic(PUBSUB_EVENTS.DOCUMENT_SAVED).subscribe(_onDocumentSaveDone);
  pubsub.topic(PUBSUB_EVENTS.DOCUMENT_SAVE_FAILED).subscribe(_onDocumentSaveFailed);

  documentNamespace.on('connection', function(socket) {
    logger.info(`New connection on ${NAMESPACE}`);

    socket.on('subscribe', async function({ workGroupId, documentId }) {
      const { user } = getSocketInfo(socket);

      try {
        const document = new Document(documentId, workGroupId, user);

        await document.load();

        if (!await document.canBeEdited()) {
          return socket.emit(WEBSOCKET_EVENTS.DOCUMENT_LOAD_FAILED, build403Error('User does not have required permissions to edit the document'));
        }

        await document.populateMetadata();

        if (!document.isEditableExtension()) {
          return socket.emit(WEBSOCKET_EVENTS.DOCUMENT_LOAD_FAILED, build400Error('Document extension is not supported'));
        }

        logger.info(`Joining document room ${documentId}`);
        socket.join(documentId);

        if (!document.state || document.state === DOCUMENT_STATES.removed) {
          return _downloadDocument(document);
        }

        if (document.isDownloaded()) {
          socket.emit(WEBSOCKET_EVENTS.DOCUMENT_LOAD_DONE, document.buildDocumentserverPayload());
        }
      } catch (error) {
        if (
          error.message === 'Document not found'
          || error.message === 'Unable to find user in target workgroup'
        ) {
          return socket.emit(WEBSOCKET_EVENTS.DOCUMENT_LOAD_FAILED, build404Error(error.message));
        }

        socket.emit(WEBSOCKET_EVENTS.DOCUMENT_LOAD_FAILED, build500Error('Error while getting document', error));
      }
    });

    socket.on('unsubscribe', ({ documentId }) => {
      logger.info(`Leaving document room ${documentId}`);
      socket.leave(documentId);
    });
  });

  initialized = true;

  async function _downloadDocument(document) {
    try {
      await document.setState(DOCUMENT_STATES.downloading);
      await document.save();
    } catch (error) {
      logger.error('Error while saving document', error);
    }
  }

  function _onDocumentDownloaded(document) {
    if (documentNamespace) {
      documentNamespace.to(document.uuid).emit(WEBSOCKET_EVENTS.DOCUMENT_LOAD_DONE, document.buildDocumentserverPayload());
    }
  }

  function _onDocumentDownloadFailed(data) {
    if (documentNamespace) {
      documentNamespace.to(data.document.uuid).emit(WEBSOCKET_EVENTS.DOCUMENT_LOAD_FAILED, build500Error('Error while getting document', data.error));
    }
  }

  function _onDocumentSaveDone(document) {
    const roomClients = documentNamespace.adapter.rooms[document.uuid];

    if (roomClients && roomClients.length) {
      _downloadDocument(document);
    }
  }

  function _onDocumentSaveFailed(document) {
    const roomClients = documentNamespace.adapter.rooms[document.uuid];

    if (roomClients && roomClients.length) {
      documentNamespace.to(document.uuid).emit(WEBSOCKET_EVENTS.DOCUMENT_LOAD_FAILED, build500Error('Error while getting document'));
    }
  }
}
