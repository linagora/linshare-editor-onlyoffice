const express = require('express');

const documentApi = require('./document');

module.exports = () => {
  const router = express.Router();

  documentApi(router);

  return router;
};
