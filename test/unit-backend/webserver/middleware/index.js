const jwt = require('jsonwebtoken');
const { expect } = require('chai');

describe('The validateToken middleware', function() {
  beforeEach(function() {
    Object.assign(this.config, {
      enable: true,
      secret: 'secret',
      algorithm: 'HS256',
      authorizationHeader: 'authorization',
      authorizationHeaderPrefix: 'Bearer '
    });
  });

  it('should call next if disabled', function(done) {
    this.config.enable = false;

    const middleware = require('../../../../src/webserver/middleware');
    const res = this.helpers.express.response(() => {
      done(new Error('should call next instead'));
    });

    middleware.validateToken({}, res, () => {
      done();
    });
  });

  it('should return 400 if jwt token not found', function(done) {
    const middleware = require('../../../../src/webserver/middleware');
    const res = this.helpers.express.jsonResponse((status, data) => {
      expect(status).to.eq(400);
      expect(data.error.details).to.eq('Requires JWT token');
      done();
    });

    middleware.validateToken({ headers: {} }, res, () => {
      done(new Error('should return 400 instead'));
    });
  });

  it('should return 400 if token is signed with invalid secret', function(done) {
    const token = jwt.sign({}, 'wrong-secret', { algorithm: this.config.algorithm });
    const middleware = require('../../../../src/webserver/middleware');

    const req = {
      headers: {
        authorization: `Bearer ${token}`
      }
    };
    const res = this.helpers.express.jsonResponse((status, data) => {
      expect(status).to.eq(400);
      expect(data.error.details).to.eq('Invalid JWT token');
      done();
    });

    middleware.validateToken(req, res, () => {
      done(new Error('should return 400 instead'));
    });
  });

  it('should call next if the token is verified', function(done) {
    const token = jwt.sign({}, this.config.secret, { algorithm: this.config.algorithm });
    const middleware = require('../../../../src/webserver/middleware');
    const req = {
      headers: {
        authorization: `Bearer ${token}`
      }
    };
    const res = this.helpers.express.response(() => {
      done(new Error('should call next instead'));
    });

    middleware.validateToken(req, res, done);
  });
});
