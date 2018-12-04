const jwt = require('jsonwebtoken');
const config = require('config');
const fs = require('fs');
const path = require('path');

const privateKey = fs.readFileSync(path.join(__dirname, '../../config/jwt.key'));

module.exports = {
  generateToken,
  getTokenFromHeaders
};

function generateToken(payload = {}) {
  return jwt.sign(payload, privateKey, {
    algorithm: 'RS256',
    expiresIn: config.get('linshare.jwt.expirationTime') || 300000,
    issuer: config.get('linshare.jwt.issuer')
  });
}

function getTokenFromHeaders(headers) {
  const authorizationHeader = config.get('linshare.jwt.token.authorizationHeader');
  const authorizationHeaderPrefix = config.get('linshare.jwt.token.authorizationHeaderPrefix');

  const authorization = headers[authorizationHeader];

  if (authorization && authorization.startsWith(authorizationHeaderPrefix)) {
    return authorization.substring(authorizationHeaderPrefix.length);
  }
}
