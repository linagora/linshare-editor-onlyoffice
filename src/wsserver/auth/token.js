const { Client } = require('linshare-api-client');
const config = require('config');

const logger = require('../../lib/logger');
const { getSocketInfo } = require('../helpers');

module.exports = async function(socket, next) {
  const socketInfo = getSocketInfo(socket);

  if (!socketInfo || !socketInfo.query) {
    return next(new Error('Invalid socket object passed in argument'));
  }

  const { token, userEmail } = socketInfo.query;

  if (!token || !userEmail) {
    return next(new Error('Token or user email not found'));
  }

  const linShareClient = new Client({
    baseUrl: config.get('linshare.baseUrl'),
    auth: {
      type: 'jwt',
      token
    }
  });

  try {
    const linShareUser = await linShareClient.user.authentication.authorized();

    if (!linShareUser) {
      return next(new Error('No data from token system'));
    }

    if (linShareUser.mail !== userEmail) {
      return next(new Error('Bad user email'));
    }

    socket.request.user = linShareUser;

    next();
  } catch (error) {
    logger.error('Error while authenticating socket token', error);
    next(error);
  }
};
