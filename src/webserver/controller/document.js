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
      await document.save();
    }

    if (document.state === DOCUMENT_STATES.downloaded) {
      await document.populateMetadata();
    }

    return res.status(200).json({
      ...document.denormalize(),
      url: getDocumentUri(req, document.uuid)
    });
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

function getDocumentUri(req, documentUuid) {
  return `${req.protocol}://${req.get('host')}/files/${documentUuid}`;
}
