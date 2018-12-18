const mockery = require('mockery');
const { expect } = require('chai');
const sinon = require('sinon');

describe('The document controller', function() {
  describe('The update function', function() {
    it('should remove the document after update document to Linshare successfully', function(done) {
      const documentLib = function() {};

      documentLib.prototype.populateMetadata = () => Promise.resolve();
      documentLib.prototype.update = () => Promise.resolve();
      documentLib.prototype.remove = sinon.spy();

      mockery.registerMock('../../lib/document', documentLib);

      const controller = this.helpers.requireBackend('webserver/controller/document');
      const req = {
        query: {
          workGroupUuid: 123,
          documentUuid: 456,
          userEmail: 'abc@def.com'
        },
        body: {
          status: 2,
          url: 'http://example.com'
        }
      };
      const res = this.helpers.express.response(
        status => {
          expect(status).to.equal(200);
          expect(documentLib.prototype.remove).to.have.been.called;
          done();
        }
      );

      controller.update(req, res);
    });
  });
});
