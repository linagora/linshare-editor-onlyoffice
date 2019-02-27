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
 * Must return { error: 0 } as response.
 * Ref: https://api.onlyoffice.com/editors/callback#error-0
 */
async function update(req, res) {
  const { workGroupUuid, documentUuid } = req.query;
  const { status, url, users } = req.body;
  const userEmail = Array.isArray(users) && users[0]; // https://api.onlyoffice.com/editors/callback#users
  const document = new Document(documentUuid, workGroupUuid, { mail: userEmail });

  try {
    if (status === 6 || status === 7) { // Force save
      await document.populateMetadata();
      await document.update(url);
    }

    if (status === 2 || status === 3) {
      await document.setState(DOCUMENT_STATES.saving);
      await document.populateMetadata();
      await document.update(url);
      await document.remove(); // Only remove local file and generate new key when the document is normal saved (not force save)

      /*
      Currently, the key sent to document server will
      immediately become invalid after document server
      sends a request to callbackUrl along with the status
      of 2 and the edited document download url.

      To avoid users try to access the document using
      the old invalid key while it being saved to Linshare,
      let the user wait until saving is done and new key
      is generated (by set "saving" state for the document).

      This solution does not totally get rid of invalid key
      problem as the user might try to access the document
      by the time document state being updated from "downloaded"
      to "saving". Having said that, this will minimize the
      possibility.

      Read more:
      https://api.onlyoffice.com/editors/troubleshooting#key
      https://github.com/ONLYOFFICE/DocumentServer/issues/513
      */
      pubsub.topic(PUBSUB_EVENTS.DOCUMENT_SAVED).publish(document); // Successfully saving file to Linshare
    }
  } catch (error) {
    const details = 'Error while updating document';

    pubsub.topic(PUBSUB_EVENTS.DOCUMENT_SAVE_FAILED).publish(document);
    logger.error(details, error);

    return res.status(500).json({
      error: {
        code: 500,
        message: 'Server Error',
        details
      }
    });
  }

  res.status(200).json({
    error: 0
  });
}
