module.exports = {
  requireQueries,
  validateSession
};

function validateSession(req, res, next) {
  // TODO: validate request by sessionId
  req.user = { email: 'user1@linshare.org' };
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
