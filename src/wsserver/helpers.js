const logger = require('../lib/logger');

module.exports = {
  build400Error,
  build401Error,
  build403Error,
  build404Error,
  build500Error,
  getSocketInfo
};

function getSocketInfo(socket) {
  if (!socket || !socket.request) {
    return null;
  }

  return {
    query: socket.request && socket.request._query,
    user: socket.request && socket.request.user
  };
}

function build404Error(details) {
  return {
    code: 404,
    message: 'Not Found',
    details
  };
}

function build400Error(details) {
  return {
    code: 400,
    message: 'Bad Request',
    details
  };
}

function build401Error(details) {
  return {
    code: 401,
    message: 'Unauthorized',
    details
  };
}

function build403Error(details) {
  return {
    code: 403,
    message: 'Forbidden',
    details
  };
}

function build500Error(details, error) {
  logger.error(details, error);

  return {
    code: 500,
    message: 'Server Error',
    details
  };
}
