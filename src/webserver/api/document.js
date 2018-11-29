const { validateSession, requireQueries } = require('../middleware');
const { getDocumentInfo } = require('../controller/document');

module.exports = (router) => {
  router.get('/documents',
    requireQueries(['documentUuid', 'workGroupUuid']),
    validateSession,
    getDocumentInfo);
};
