const { expect } = require('chai');
const request = require('supertest');
const app = require('../../');

describe('GET /api', function() {
  afterEach(function(done) {
    app.server.close(done);
  });

  it('should return Hello World!', function(done) {
    request(app)
      .get('/api')
      .end((req, res) => {
        expect(res.status).to.equal(200);
        expect(res.body.message).to.equal('Hello World!');
        done();
      });
  });
});
