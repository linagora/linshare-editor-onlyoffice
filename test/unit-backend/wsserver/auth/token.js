const mockery = require('mockery');
const { expect } = require('chai');
const sinon = require('sinon');

describe('The wsserver auth token middleware', function() {
  let jsonError, next;

  beforeEach(() => {
    jsonError = {
      code: 400,
      message: 'Bad Request',
      details: 'details'
    };
    next = sinon.spy(error => {
      expect(JSON.parse(error.message)).to.deep.equal(jsonError);
    });
  });

  it('should reject if there is no socket info', async function() {
    jsonError.details = 'Invalid socket object passed in argument';
    const helpersMock = {
      getSocketInfo: sinon.stub().returns(null),
      build400Error: sinon.stub().returns(jsonError)
    };

    mockery.registerMock('../helpers', helpersMock);
    const getModule = this.helpers.requireBackend('wsserver/auth/token');

    const socket = { foo: 'bar' };

    await getModule(socket, next);

    expect(next).to.have.been.called;
    expect(helpersMock.getSocketInfo).to.have.been.calledWith(socket);
    expect(helpersMock.build400Error).to.have.been.calledWith('Invalid socket object passed in argument');
  });

  it('should reject if there is no socket query', async function() {
    jsonError.details = 'Invalid socket object passed in argument';
    const helpersMock = {
      getSocketInfo: sinon.stub().returns({}),
      build400Error: sinon.stub().returns(jsonError)
    };

    mockery.registerMock('../helpers', helpersMock);
    const getModule = this.helpers.requireBackend('wsserver/auth/token');
    const socket = { foo: 'bar' };

    await getModule(socket, next);

    expect(next).to.have.been.called;
    expect(helpersMock.getSocketInfo).to.have.been.calledWith(socket);
    expect(helpersMock.build400Error).to.have.been.calledWith('Invalid socket object passed in argument');
  });

  it('should reject if there is no token in socket query', async function() {
    jsonError.details = 'Token or user email not found';
    const helpersMock = {
      getSocketInfo: sinon.stub().returns({
        query: {}
      }),
      build400Error: sinon.stub().returns(jsonError)
    };

    mockery.registerMock('../helpers', helpersMock);
    const getModule = this.helpers.requireBackend('wsserver/auth/token');
    const socket = { foo: 'bar' };

    await getModule(socket, next);

    expect(next).to.have.been.called;
    expect(helpersMock.getSocketInfo).to.have.been.calledWith(socket);
    expect(helpersMock.build400Error).to.have.been.calledWith('Token or user email not found');
  });

  it('should reject if there is no user email in socket query', async function() {
    jsonError.details = 'Token or user email not found';
    const helpersMock = {
      getSocketInfo: sinon.stub().returns({
        query: { token: 'abc' }
      }),
      build400Error: sinon.stub().returns(jsonError)
    };

    mockery.registerMock('../helpers', helpersMock);
    const getModule = this.helpers.requireBackend('wsserver/auth/token');
    const socket = { foo: 'bar' };

    await getModule(socket, next);

    expect(next).to.have.been.called;
    expect(helpersMock.build400Error).to.have.been.calledWith('Token or user email not found');
  });

  it('should reject if there is no linshare user from the token', async function() {
    jsonError = {
      code: 500,
      message: 'Server Error',
      details: 'No data from token system'
    };
    const token = 'abc';
    const helpersMock = {
      getSocketInfo: sinon.stub().returns({
        query: { token, userEmail: 'user@linshare.org' }
      }),
      build500Error: sinon.stub().returns(jsonError)
    };

    mockery.registerMock('../helpers', helpersMock);

    const linshareAPIClientMock = {
      Client: function(options) { //eslint-disable-line
        expect(options).to.shallowDeepEqual({ auth: { type: 'jwt', token } });

        return {
          user: {
            authentication: {
              authorized: () => {}
            }
          }
        };
      }
    };

    mockery.registerMock('../helpers', helpersMock);
    mockery.registerMock('linshare-api-client', linshareAPIClientMock);
    const getModule = this.helpers.requireBackend('wsserver/auth/token');
    const socket = { foo: 'bar' };

    await getModule(socket, next);

    expect(next).to.have.been.called;
    expect(helpersMock.getSocketInfo).to.have.been.calledWith(socket);
    expect(helpersMock.build500Error).to.have.been.calledWith('No data from token system');
  });

  it('should reject if there is there is a bad user email', async function() {
    jsonError = {
      code: 401,
      message: 'Unauthorized',
      details: 'Invalid user authorization information'
    };
    const token = 'abc';
    const helpersMock = {
      getSocketInfo: sinon.stub().returns({
        query: { token, userEmail: 'user@linshare.org' }
      }),
      build401Error: sinon.stub().returns(jsonError)
    };

    mockery.registerMock('../helpers', helpersMock);

    const linshareAPIClientMock = {
      Client: function(options) { //eslint-disable-line
        expect(options).to.shallowDeepEqual({ auth: { type: 'jwt', token } });

        return {
          user: {
            authentication: {
              authorized: () => ({ mail: 'aff2018@linshare.org' })
            }
          }
        };
      }
    };

    mockery.registerMock('../helpers', helpersMock);
    mockery.registerMock('linshare-api-client', linshareAPIClientMock);

    const getModule = this.helpers.requireBackend('wsserver/auth/token');
    const socket = { foo: 'bar' };

    await getModule(socket, next);

    expect(next).to.have.been.called;
    expect(helpersMock.getSocketInfo).to.have.been.calledWith(socket);
    expect(helpersMock.build401Error).to.have.been.calledWith('Invalid user authorization information');
  });

  it('should reject if user is not authorized', async function() {
    jsonError = {
      code: 401,
      message: 'Unauthorized',
      details: 'Invalid user authorization information'
    };
    const token = 'abc';
    const helpersMock = {
      getSocketInfo: sinon.stub().returns({
        query: { token, userEmail: 'user@linshare.org' }
      }),
      build401Error: sinon.stub().returns(jsonError)
    };

    mockery.registerMock('../helpers', helpersMock);

    const linshareAPIClientMock = {
      Client: function(options) { //eslint-disable-line
        expect(options).to.shallowDeepEqual({ auth: { type: 'jwt', token } });

        return {
          user: {
            authentication: {
              authorized: () => (
                Promise.reject({ // eslint-disable-line
                  response: { status: 401 }
                })
              )
            }
          }
        };
      }
    };

    mockery.registerMock('../helpers', helpersMock);
    mockery.registerMock('linshare-api-client', linshareAPIClientMock);

    const getModule = this.helpers.requireBackend('wsserver/auth/token');
    const socket = { foo: 'bar' };

    await getModule(socket, next);

    expect(next).to.have.been.called;
    expect(helpersMock.getSocketInfo).to.have.been.calledWith(socket);
    expect(helpersMock.build401Error).to.have.been.calledWith('Invalid user authorization information');
  });

  it('should reject if there is error while authenticating user', async function() {
    jsonError = {
      code: 500,
      message: 'Server Error',
      details: 'Error while authenticating socket token'
    };
    const token = 'abc';
    const helpersMock = {
      getSocketInfo: sinon.stub().returns({
        query: { token, userEmail: 'user@linshare.org' }
      }),
      build500Error: sinon.stub().returns(jsonError)
    };

    mockery.registerMock('../helpers', helpersMock);

    const linshareAPIClientMock = {
      Client: function(options) { //eslint-disable-line
        expect(options).to.shallowDeepEqual({ auth: { type: 'jwt', token } });

        return {
          user: {
            authentication: {
              authorized: () => (
                Promise.reject({ // eslint-disable-line
                  response: { status: 'not-401' }
                })
              )
            }
          }
        };
      }
    };

    mockery.registerMock('../helpers', helpersMock);
    mockery.registerMock('linshare-api-client', linshareAPIClientMock);
    const getModule = this.helpers.requireBackend('wsserver/auth/token');
    const socket = { foo: 'bar' };

    await getModule(socket, next);

    expect(next).to.have.been.called;
    expect(helpersMock.getSocketInfo).to.have.been.calledWith(socket);
    expect(helpersMock.build500Error).to.have.been.calledWith('Error while authenticating socket token');
  });

  it('should attach user to socket request', async function() {
    const token = 'abc';
    const user = { mail: 'user@linshare.org' };
    const helpersMock = {
      getSocketInfo: sinon.stub().returns({
        query: { token, userEmail: user.mail }
      })
    };
    mockery.registerMock('../helpers', helpersMock);

    const linshareAPIClientMock = {
      Client: function(options) { //eslint-disable-line
        expect(options).to.shallowDeepEqual({ auth: { type: 'jwt', token } });

        return {
          user: {
            authentication: {
              authorized: () => user
            }
          }
        };
      }
    };

    mockery.registerMock('../helpers', helpersMock);
    mockery.registerMock('linshare-api-client', linshareAPIClientMock);

    const getModule = this.helpers.requireBackend('wsserver/auth/token');

    next = sinon.spy();

    const socket = { foo: 'bar', request: {} };

    await getModule(socket, next);

    expect(next).to.have.been.called;
    expect(helpersMock.getSocketInfo).to.have.been.calledWith(socket);
    expect(socket.request.user).to.deep.equal(user);
  });
});
