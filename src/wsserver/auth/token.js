const { Client } = require('linshare-api-client');
const config = require('config');
const { getSocketInfo, build400Error, build401Error, build500Error } = require('../helpers');

module.exports = async function(socket, next) {
  const socketInfo = getSocketInfo(socket);

  if (!socketInfo || !socketInfo.query) {
    return next(new Error(JSON.stringify(build400Error('Invalid socket object passed in argument'))));
  }

  const { token, userEmail } = socketInfo.query;

  if (!token || !userEmail) {
    return next(new Error(JSON.stringify(build400Error('Token or user email not found'))));
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
      return next(new Error(JSON.stringify(build500Error('No data from token system'))));
    }

    if (linShareUser.mail !== userEmail) {
      return next(new Error(JSON.stringify(build401Error('Invalid user authorization information'))));
    }

    socket.request.user = linShareUser;

    next();
  } catch (error) {
    if (error.response && error.response.status === 401) {
      return next(new Error(JSON.stringify(build401Error('Invalid user authorization information'))));
    }

    next(new Error(JSON.stringify(build500Error('Error while authenticating socket token', error))));
  }
};
