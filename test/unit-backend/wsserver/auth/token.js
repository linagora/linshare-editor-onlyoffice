const mockery = require('mockery');
const { expect } = require('chai');
const sinon = require('sinon');

describe('The wsserver auth token middleware', function() {
  it('should reject if there is no socket info', async function() {
    const helpersMock = {
      getSocketInfo: sinon.stub().returns(null)
    };
    mockery.registerMock('../helpers', helpersMock);
    const getModule = this.helpers.requireBackend('wsserver/auth/token');

    const next = sinon.spy(error => {
      expect(error.message).to.equal('Invalid socket object passed in argument');
    });

    const socket = { foo: 'bar' };

    await getModule(socket, next);

    expect(next).to.have.been.called;
    expect(helpersMock.getSocketInfo).to.have.been.calledWith(socket);
  });

  it('should reject if there is no socket query', async function() {
    const helpersMock = {
      getSocketInfo: sinon.stub().returns({})
    };
    mockery.registerMock('../helpers', helpersMock);
    const getModule = this.helpers.requireBackend('wsserver/auth/token');

    const next = sinon.spy(error => {
      expect(error.message).to.equal('Invalid socket object passed in argument');
    });

    const socket = { foo: 'bar' };

    await getModule(socket, next);

    expect(next).to.have.been.called;
    expect(helpersMock.getSocketInfo).to.have.been.calledWith(socket);
  });

  it('should reject if there is no token in socket query', async function() {
    const helpersMock = {
      getSocketInfo: sinon.stub().returns({
        query: {}
      })
    };
    mockery.registerMock('../helpers', helpersMock);
    const getModule = this.helpers.requireBackend('wsserver/auth/token');

    const next = sinon.spy(error => {
      expect(error.message).to.equal('Token or user email not found');
    });

    const socket = { foo: 'bar' };

    await getModule(socket, next);

    expect(next).to.have.been.called;
    expect(helpersMock.getSocketInfo).to.have.been.calledWith(socket);
  });

  it('should reject if there is no user email in socket query', async function() {
    const helpersMock = {
      getSocketInfo: sinon.stub().returns({
        query: { token: 'abc' }
      })
    };
    mockery.registerMock('../helpers', helpersMock);
    const getModule = this.helpers.requireBackend('wsserver/auth/token');

    const next = sinon.spy(error => {
      expect(error.message).to.equal('Token or user email not found');
    });

    const socket = { foo: 'bar' };

    await getModule(socket, next);

    expect(next).to.have.been.called;
    expect(helpersMock.getSocketInfo).to.have.been.calledWith(socket);
  });

  it('should reject if there is no linshare user from the token', async function() {
    const token = 'abc';
    const helpersMock = {
      getSocketInfo: sinon.stub().returns({
        query: { token, userEmail: 'user@linshare.org' }
      })
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

    const next = sinon.spy(error => {
      expect(error.message).to.equal('No data from token system');
    });

    const socket = { foo: 'bar' };

    await getModule(socket, next);

    expect(next).to.have.been.called;
    expect(helpersMock.getSocketInfo).to.have.been.calledWith(socket);
  });

  it('should reject if there is there is a bad user email', async function() {
    const token = 'abc';
    const helpersMock = {
      getSocketInfo: sinon.stub().returns({
        query: { token, userEmail: 'user@linshare.org' }
      })
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

    const next = sinon.spy(error => {
      expect(error.message).to.equal('Bad user email');
    });

    const socket = { foo: 'bar' };

    await getModule(socket, next);

    expect(next).to.have.been.called;
    expect(helpersMock.getSocketInfo).to.have.been.calledWith(socket);
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

    const next = sinon.spy();

    const socket = { foo: 'bar', request: {} };

    await getModule(socket, next);

    expect(next).to.have.been.called;
    expect(helpersMock.getSocketInfo).to.have.been.calledWith(socket);
    expect(socket.request.user).to.deep.equal(user);
  });
});
