const { loadAuthorizedUser, requireQueries, requireAuthorizedEditor } = require('../middleware');
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
    requireAuthorizedEditor,
    requireQueries(['documentUuid', 'workGroupUuid', 'userEmail']),
    update);
};
