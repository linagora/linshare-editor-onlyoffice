const logger = require('../../lib/logger');
const Document = require('../../lib/document');
const { DOCUMENT_STATES } = require('../../lib/constants');

module.exports = {
  getDocumentInfo,
  update
};

async function getDocumentInfo(req, res) {
  try {
    const { documentUuid, workGroupUuid } = req.query;
    const userEmail = req.user.mail;
    const document = new Document(documentUuid, workGroupUuid, userEmail);

    await document.loadState();

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
  const { workGroupUuid, documentUuid, userEmail } = req.query;
  const { status, url } = req.body;

  if (status === 2 || status === 3) { // must save document, https://api.onlyoffice.com/editors/callback#status
    const document = new Document(documentUuid, workGroupUuid, userEmail);

    try {
      await document.populateMetadata();

      await document.update(url);
    } catch (error) {
      const details = 'Error while updating document';

      logger.error(details, error);

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
