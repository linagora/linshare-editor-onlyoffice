const jwt = require('jsonwebtoken');

module.exports = {
  generateToken,
  getTokenFromHeaders
};

function generateToken(payload = {}, options = {}) {
  const { algorithm, key, expiresIn, issuer } = options;

  if (!key) {
    throw Error('Key is required when generating JWT token');
  }

  if (!algorithm) {
    throw Error('Algorithm is required when generating JWT token');
  }

  const jwtOptions = {
    algorithm,
    expiresIn
  };

  if (issuer) {
    jwtOptions.issuer = issuer;
  }

  return jwt.sign(payload, options.key, jwtOptions);
}

function getTokenFromHeaders(headers, options = {}) {
  const { authorizationHeader, authorizationHeaderPrefix } = options;

  const authorization = headers[authorizationHeader];

  if (authorization && authorization.startsWith(authorizationHeaderPrefix)) {
    return authorization.substring(authorizationHeaderPrefix.length);
  }
}
