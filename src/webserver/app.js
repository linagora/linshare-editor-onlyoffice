const express = require('express');
const http = require('http');
const cors = require('cors');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const logger = require('../lib/logger');
const api = require('./api');

const app = express();
let format = 'combined';

app.server = http.createServer(app);
if (process.env.NODE_ENV === 'development') {
  format = 'dev';
}

app.use(morgan(format, { stream: logger.stream }));
app.use(cors({ origin: true, credentials: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use('/api', api());

module.exports = app;
