const logger = require('../../lib/logger');
const Document = require('../../lib/document');
const { DOCUMENT_STATES } = require('../../lib/constants');

module.exports = {
  getDocumentInfo
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
