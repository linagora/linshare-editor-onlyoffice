const logger = require('../../lib/logger');
const Document = require('../../lib/document');
const pubsub = require('../../lib/pubsub');
const { DOCUMENT_STATES, PUBSUB_EVENTS } = require('../../lib/constants');

module.exports = {
  getDocumentInfo,
  update
};

async function getDocumentInfo(req, res) {
  try {
    const { documentUuid, workGroupUuid } = req.query;
    const userEmail = req.user.mail;
    const document = new Document(documentUuid, workGroupUuid, userEmail);

    await document.load();

    if (!document.state) {
      await document.setState(DOCUMENT_STATES.downloading);

      document.save()
        .catch(error => logger.error('Error while saving document', error));
    }

    if (document.isDownloaded()) {
      await document.populateMetadata();
    }

    return res.status(200).json(document.denormalize());
  } catch (error) {
    logger.error('Error while getting document', error);

    return res.status(500).json({
      error: {
        code: 500,
        message: 'Server Error',
        details: 'Unable to get document info'
      }
    });
  }
}

/**
 * Update document to Document storage service (LinShare) base on status of document returned from Document server.
 *
 * This method will handle two kinds of the saving event from document server:
 * - Normal saving: is received after the document is closed for editing with the identifier
 * of the user who was the last to send the changes to the document editing service
 * - Force saving: is received when the force saving request is performed.
 *
 * @param {Object} req Request from Document server https://api.onlyoffice.com/editors/callback
 * @param {Object} res
 */
async function update(req, res) {
  const { status, url, users } = req.body;

  let savingMethod;

  if (status === 2) {
    savingMethod = _normalSaving;
  } else if (status === 6) {
    savingMethod = _forceSaving;
  }

  if (savingMethod) {
    const { workGroupUuid, documentUuid } = req.query;
    const document = new Document(documentUuid, workGroupUuid, { mail: users[0] });

    try {
      await savingMethod(document, url);
    } catch (err) {
      const details = 'Error while updating document';

      pubsub.topic(PUBSUB_EVENTS.DOCUMENT_SAVE_FAILED).publish(document);
      logger.error(details, err);

      return res.status(500).json({
        error: {
          code: 500,
          message: 'Server Error',
          details
        }
      });
    }
  }

  res.status(200).json({
    error: 0
  });
}

async function _forceSaving(document, url) {
  await document.populateMetadata();
  await document.update(url);
}

async function _normalSaving(document, url) {
  try {
    await document.setState(DOCUMENT_STATES.saving);
    await document.populateMetadata();
    await document.update(url);
    await document.remove();

    pubsub.topic(PUBSUB_EVENTS.DOCUMENT_SAVED).publish(document);
  } catch (err) {
    await document.remove();

    throw err;
  }
}
