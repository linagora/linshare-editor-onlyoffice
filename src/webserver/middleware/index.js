const config = require('config');
const { Client } = require('linshare-api-client');

const logger = require('../../lib/logger');
const { getTokenFromHeaders } = require('../../lib/jwt');

module.exports = {
  requireAuthorizedEditor,
  requireQueries,
  loadAuthorizedUser
};

function requireAuthorizedEditor(req, res, next) {
  // TODO: validate request from Document server
  next();
}

async function loadAuthorizedUser(req, res, next) {
  const token = getTokenFromHeaders(req.headers);

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
