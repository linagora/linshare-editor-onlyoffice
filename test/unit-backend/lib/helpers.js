const { expect } = require('chai');
const mockery = require('mockery');
const { ACCOUNT_NOT_A_MEMBER, ACCOUNT_NOT_AUTHORIZED_TO_LIST } = require('../../../src/lib/constants').LINSHARE_ERROR_CODES;

describe('The lib helpers', function() {
  describe('The verifyUserEditPermission function', function() {
    beforeEach(function() {
      mockery.registerMock('./jwt', { generateToken() {} });
      mockery.registerMock('config', { get: () => ({
        algorithm: 'foo',
        expiresIn: 'boo',
        issuer: 'bar'
      }) });
    });

    it('should reject with custom error if user is not a member of shared space', function(done) {
      function ClientMock() {
        this.user = {
          sharedSpaces: {
            getMembers() {
              const error = new Error();

              error.response = { data: { errCode: ACCOUNT_NOT_A_MEMBER } };

              return Promise.reject(error);
            }
          }
        };
      }

      mockery.registerMock('linshare-api-client', { Client: ClientMock });

      this.helpers.requireBackend('lib/helpers').verifyUserEditPermission({ mail: 'foo@bar' })
        .then(() => {
          done(new Error('should not resolve'));
        })
        .catch(error => {
          expect(error.message).to.equal('Unable to find user in target workgroup');
          done();
        });
    });

    it('should reject on error of finding member in target workgroup', function(done) {
      function ClientMock() {
        this.user = {
          sharedSpaces: {
            getMembers() {
              return Promise.reject(new Error('something wrong'));
            }
          }
        };
      }

      mockery.registerMock('linshare-api-client', { Client: ClientMock });

      this.helpers.requireBackend('lib/helpers').verifyUserEditPermission({ mail: 'foo@bar' })
        .then(() => {
          done(new Error('should not resolve'));
        })
        .catch(error => {
          expect(error.message).to.equal('something wrong');
          done();
        });
    });

    it('should reject on error of getting permissions', function(done) {
      function ClientMock() {
        this.user = {
          sharedSpaces: {
            getMembers() {
              return Promise.resolve([{ role: { uuid: '123' } }]);
            }
          },
          sharedSpaceRoles: {
            findAllPermissions() {
              return Promise.reject(new Error('something wrong'));
            }
          }
        };
      }

      mockery.registerMock('linshare-api-client', { Client: ClientMock });

      this.helpers.requireBackend('lib/helpers').verifyUserEditPermission({ mail: 'foo@bar' })
        .then(() => {
          done(new Error('should not resolve'));
        })
        .catch(error => {
          expect(error.message).to.equal('something wrong');
          done();
        });
    });

    it('should resolve with false if user has no authorization to get shared spaces members', function() {
      function ClientMock() {
        this.user = {
          sharedSpaces: {
            getMembers() {
              const error = new Error();

              error.response = { data: { errCode: ACCOUNT_NOT_AUTHORIZED_TO_LIST } };

              return Promise.reject(error);
            }
          }
        };
      }

      mockery.registerMock('linshare-api-client', { Client: ClientMock });

      const helpers = this.helpers.requireBackend('lib/helpers');

      expect(helpers.verifyUserEditPermission({ mail: 'foo@bar' })).to.eventually.equal(false);
    });

    it('should resolve with false if user has no UPDATE permission on FILE resource', function() {
      function ClientMock() {
        this.user = {
          sharedSpaces: {
            getMembers() {
              return Promise.resolve([{ role: { uuid: '123' } }]);
            }
          },
          sharedSpaceRoles: {
            findAllPermissions() {
              return Promise.resolve([{ action: 'CREATE', resource: 'FILE' }]);
            }
          }
        };
      }

      mockery.registerMock('linshare-api-client', { Client: ClientMock });

      const helpers = this.helpers.requireBackend('lib/helpers');

      expect(helpers.verifyUserEditPermission({ mail: 'foo@bar' })).to.eventually.equal(false);
    });

    it('should resolve with true if user has no UPDATE permission on FILE resource', function() {
      function ClientMock() {
        this.user = {
          sharedSpaces: {
            getMembers() {
              return Promise.resolve([{ role: { uuid: '123' } }]);
            }
          },
          sharedSpaceRoles: {
            findAllPermissions() {
              return Promise.resolve([{ action: 'UPDATE', resource: 'FILE' }]);
            }
          }
        };
      }

      mockery.registerMock('linshare-api-client', { Client: ClientMock });

      const helpers = this.helpers.requireBackend('lib/helpers');

      expect(helpers.verifyUserEditPermission({ mail: 'foo@bar' })).to.eventually.equal(true);
    });
  });
});
