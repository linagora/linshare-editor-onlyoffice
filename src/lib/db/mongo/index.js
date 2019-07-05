/* eslint-disable no-process-env */
/* eslint-disable no-plusplus */
/* eslint-disable no-underscore-dangle */

const url = require('url');
const mongoose = require('mongoose');
const config = require('config');
const logger = require('../../logger');

const ATTEMPTS_LIMIT = config.has('db.attemptsLimit') ? config.get('db.attemptsLimit') : 10;
const MONGO_DEFAULT_HOST = 'localhost';
const MONGO_DEFAULT_PORT = 20018;
const MONGO_DEFAULT_DBNAME = 'linshare-oo-editor';

let initialized = false;
let connected = false;

const models = {
  files: require('./models/files')
};

let reconnectAttemptCounter = 0;
let connectionLost = false;

module.exports = {
  buildConnectionString,
  getDefaultOptions,
  init,
  isInitalized,
  isConnected,
  models
};

mongoose.connection.on('error', (err) => {
  onConnectError(err);
  initialized = false;
});

mongoose.connection.on('connected', (err) => {
  logger.debug('Connected to MongoDB', err);
  connected = true;
  reconnectAttemptCounter = 0;
  connectionLost = false;
});

mongoose.connection.on('disconnected', () => {
  if (!connectionLost) {
    logger.debug('Connection to MongoDB has been lost');
    connected = false;
    connectionLost = true;
  }

  if (forceReconnect() && (reconnectAttemptCounter < ATTEMPTS_LIMIT)) {
    logger.debug('Reconnecting to MongoDB');
    reconnectAttemptCounter++;
    setTimeout(mongooseConnect, _fibonacci(reconnectAttemptCounter) * 1000);
  }

  if (reconnectAttemptCounter === ATTEMPTS_LIMIT) {
    logger.error(`Failed to connect to MongoDB ${ATTEMPTS_LIMIT} time - No more attempts - Please contact your administrator to restart the database server`);
  }
});

function forceReconnect() {
  if (process.env.MONGO_FORCE_RECONNECT) {
    return process.env.MONGO_FORCE_RECONNECT;
  }

  return !!(config.db && config.db.forceReconnectOnDisconnect);
}

function onConnectError(err) {
  if (!connectionLost || firstAttempt()) {
    logger.error(`Failed to connect to MongoDB - Attempt #${reconnectAttemptCounter}/${ATTEMPTS_LIMIT} at ${Date()}: `, err);
  } else {
    logger.error(`Failed to connect to MongoDB - Attempt #${reconnectAttemptCounter}/${ATTEMPTS_LIMIT} at ${Date()} - Please contact your administrator to restart the database server`);
  }
}

function _fibonacci(number) {
  const sequence = [1, 1];

  for (let i = 2; i < number; i++) {
    sequence[i] = sequence[i - 1] + sequence[i - 2];
  }

  return sequence[number - 1];
}

function firstAttempt() {
  return reconnectAttemptCounter === 1;
}

function getTimeout() {
  return process.env.MONGO_TIMEOUT || 10000;
}

function getHost() {
  return process.env.MONGO_HOST || MONGO_DEFAULT_HOST;
}

function getPort() {
  return process.env.MONGO_PORT || MONGO_DEFAULT_PORT;
}

function getDbName() {
  return process.env.MONGO_DBNAME || MONGO_DEFAULT_DBNAME;
}

function getUsername() {
  return process.env.MONGO_USERNAME;
}

function getPassword() {
  return process.env.MONGO_PASSWORD;
}

function buildConnectionString(hostname, port, dbname, username, password, connectionOptions) {
  const timeout = getTimeout();

  connectionOptions = connectionOptions || {
    connectTimeoutMS: timeout,
    socketTimeoutMS: timeout
  };

  const connectionHash = {
    protocol: 'mongodb',
    slashes: true,
    hostname,
    port,
    pathname: `/${dbname}`,
    query: connectionOptions
  };

  if (username) {
    connectionHash.auth = `${username}:${password}`;
  }

  return url.format(connectionHash);
}

function getConnectionStringFromEnvOrDefaults() {
  return buildConnectionString(getHost(), getPort(), getDbName(), getUsername(), getPassword());
}

function getDefaultOptions() {
  const timeout = getTimeout();

  return {
    w: 1,
    autoReconnect: true,
    socketTimeoutMS: timeout,
    keepAlive: timeout,
    poolSize: 10,
    useNewUrlParser: true,
    useCreateIndex: true
  };
}

function getConnectionStringAndOptions() {
  if (!config.db) {
    return false;
  }

  const connectionString = config.db.connectionString || getConnectionStringFromEnvOrDefaults();
  const connectionOptions = config.db.connectionOptions || getDefaultOptions();

  return {
    url: connectionString,
    options: connectionOptions
  };
}

function mongooseConnect() {
  const connectionInfos = getConnectionStringAndOptions();

  if (!connectionInfos) {
    return false;
  }

  try {
    logger.debug(`launch mongoose.connect on ${connectionInfos.url}`);
    mongoose.connect(connectionInfos.url, connectionInfos.options);
  } catch (e) {
    onConnectError(e);

    return false;
  }
  initialized = true;

  return true;
}

function init() {
  if (initialized) {
    return mongoose.disconnect(() => {
      initialized = false;
      mongooseConnect();
    });
  }

  return mongooseConnect();
}

function isInitalized() {
  return initialized;
}

function isConnected() {
  return connected;
}
