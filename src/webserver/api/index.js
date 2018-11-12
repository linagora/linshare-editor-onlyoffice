const express = require('express');
const { sayHello } = require('../middleware');

module.exports = () => {
  const router = express.Router();

  router.get('/', sayHello);

  return router;
};
