const config = require('config'),
      jwt = require('jsonwebtoken');
const { Client } = require('linshare-api-client');

const logger = require('../../lib/logger');
const { getTokenFromHeaders } = require('../../lib/jwt');

module.exports = {
  validateToken,
  requireQueries,
  loadAuthorizedUser
};

async function loadAuthorizedUser(req, res, next) {
  const { authorizationHeader, authorizationHeaderPrefix } = config.get('linshare.jwt.token');
  const token = getTokenFromHeaders(req.headers, { authorizationHeader, authorizationHeaderPrefix });

  if (!token) {
    res.status(400).json({
      error: {
        code: 400,
        message: 'Bad Request',
        details: 'Requires jwt authorization token'
      }
    });
  }

  const client = new Client({
    baseUrl: config.get('linshare.baseUrl'),
    auth: {
      type: 'jwt',
      token
    }
  });

  try {
    req.user = await client.user.authentication.authorized();
  } catch (error) {
    if (error.response && error.response.status === 401) {
      return res.status(401).json({
        error: {
          code: 401,
          message: 'Unauthorized',
          details: 'Invalid user authorization information'
        }
      });
    }

    const details = 'Unable to check user authorization';

    logger.error(details, error);

    return res.status(500).json({
      error: {
        code: 500,
        message: 'Server Error',
        details
      }
    });
  }

  next();
}

function requireQueries(queries) {
  queries = Array.isArray(queries) ? queries : [queries];

  return (req, res, next) => {
    const missingQueries = queries.filter(query => !req.query[query]);

    if (missingQueries.length > 0) {
      return res.status(400).json({
        error: {
          code: 400,
          message: 'Bad Request',
          details: `Missing ${missingQueries.join(', ')} in query`
        }
      });
    }

    next();
  };
}

function validateToken(req, res, next) {
  const jwtInRequestConfig = config.get('documentServer.signature.request.incoming');

  if (!jwtInRequestConfig.enable) {
    return next();
  }

  const { secret, algorithm, authorizationHeader, authorizationHeaderPrefix } = jwtInRequestConfig;
  const token = getTokenFromHeaders(req.headers, { authorizationHeader, authorizationHeaderPrefix });

  if (!token) {
    return res.status(400).json({
      error: {
        code: 400,
        message: 'Bad Request',
        details: 'Requires JWT token'
      }
    });
  }

  try {
    jwt.verify(token, secret, { algorithms: [algorithm] });
  } catch (error) {
    return res.status(400).json({
      error: {
        code: 400,
        message: 'Bad Request',
        details: 'Invalid JWT token'
      }
    });
  }

  next();
}
