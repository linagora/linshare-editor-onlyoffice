const { loadAuthorizedUser, requireQueries, validateToken } = require('../middleware');
const { getDocumentInfo, update } = require('../controller/document');

module.exports = (router) => {
  router.get('/documents',
    requireQueries(['documentUuid', 'workGroupUuid']),
    loadAuthorizedUser,
    getDocumentInfo);

  /**
   * Handles the notification comes from Document server.
   * Ref: https://api.onlyoffice.com/editors/callback
   */
  router.post('/documents/track',
    validateToken,
    requireQueries(['documentUuid', 'workGroupUuid']),
    update);
};
