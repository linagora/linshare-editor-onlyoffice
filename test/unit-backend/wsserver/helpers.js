const { expect } = require('chai');

describe('The wsserver helpers', function() {
  describe('The getSocketInfo function', function() {
    it('should return null if there is no socket', function() {
      const helpers = this.helpers.requireBackend('wsserver/helpers');

      expect(helpers.getSocketInfo()).to.be.null;
    });

    it('should return null if there is no #socket.request', function() {
      const helpers = this.helpers.requireBackend('wsserver/helpers');

      expect(helpers.getSocketInfo()).to.be.null;
    });

    it('should return socket information', function() {
      const helpers = this.helpers.requireBackend('wsserver/helpers');
      const query = { foo: 'FOO' };
      const user = { uuid: '123' };

      const socket = {
        request: {
          _query: query,
          user
        }
      };

      expect(helpers.getSocketInfo(socket)).to.be.deep.equal({
        query,
        user
      });
    });
  });
});
