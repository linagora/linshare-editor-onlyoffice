const express = require('express');
const http = require('http');
const cors = require('cors');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const path = require('path');
const config = require('config');
const logger = require('../lib/logger');
const api = require('./api');

const app = express();
let format = 'combined';

app.server = http.createServer(app);

module.exports = {
  init,
  server: app.server
};

function init() {
  if (process.env.NODE_ENV === 'development') {
    format = 'dev';
  }

  app.use(morgan(format, { stream: logger.stream }));
  app.use(cors({ origin: true, credentials: true }));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({
    extended: true
  }));
  // TODO: add authorization method for getting static files
  app.use('/files', express.static(path.join(__dirname, 'files')));
  app.use('/api', api());

  app.server.listen(process.env.PORT || config.webserver.port, () => {
    logger.info(`Server started on port ${app.server.address().port}`);
  });
}
