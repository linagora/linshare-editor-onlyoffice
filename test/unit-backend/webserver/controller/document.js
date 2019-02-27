const mockery = require('mockery');
const { expect } = require('chai');
const sinon = require('sinon');
const { DOCUMENT_STATES } = require('../../../../src/lib/constants');

describe('The document controller', function() {
  describe('The update function', function() {
    let documentLib, helperMock, filesMock, document;

    beforeEach(function() {
      document = {
        name: 'abc',
        uuid: '456',
        parent: 'xyz',
        workgroup: '123',
        state: DOCUMENT_STATES.downloaded
      };

      documentLib = function() {};

      documentLib.prototype.populateMetadata = sinon.stub().returns(Promise.resolve());
      documentLib.prototype.update = sinon.stub().returns(Promise.resolve());
      documentLib.prototype.remove = sinon.spy();

      helperMock = {
        createLinshareClient: () => ({
          user: {
            workgroup: {
              getNode: () => Promise.resolve(document),
              createDocumentFromUrl: () => Promise.resolve(document)
            }
          }
        }),
        createDirectory: () => {},
        getFileExtension: () => {},
        getFileType: () => {},
        existsSync: () => {},
        deleteFile: sinon.stub().returns(Promise.resolve())
      };

      filesMock = {
        create: () => Promise.resolve(),
        updateByUuid: sinon.spy(),
        getByUuid: () => Promise.resolve(document)
      };
    });

    it('should save the document to Linshare if the document is forced save', function(done) {
      mockery.registerMock('../../lib/document', documentLib);

      const controller = this.helpers.requireBackend('webserver/controller/document');
      const req = {
        query: {
          workGroupUuid: 123,
          documentUuid: 456,
          userEmail: 'abc@def.com'
        },
        body: {
          status: 6, // Forced save
          url: 'http://example.com'
        }
      };
      const res = this.helpers.express.response(
        status => {
          expect(status).to.equal(200);
          expect(documentLib.prototype.update).to.have.been.calledWith('http://example.com');
          expect(documentLib.prototype.remove).to.not.have.been.called;
          done();
        }
      );

      controller.update(req, res);
    });

    it('should update the document state to "saving" before, and to "removed" after save file to Linshare if the document is normal saved', function(done) {
      mockery.registerMock('../lib/files', filesMock);
      mockery.registerMock('./helpers', helperMock);
      mockery.registerMock('uuid/v4', () => '112233');

      const controller = this.helpers.requireBackend('webserver/controller/document');
      const req = {
        query: {
          workGroupUuid: document.workgroup,
          documentUuid: document.uuid
        },
        body: {
          status: 2,
          url: 'http://example.com'
        }
      };
      const res = this.helpers.express.response(
        status => {
          expect(status).to.equal(200);
          expect(filesMock.updateByUuid.firstCall.args).to.shallowDeepEqual(
            [
              document.uuid,
              { state: DOCUMENT_STATES.saving }
            ]
          );
          expect(filesMock.updateByUuid.secondCall.args).to.shallowDeepEqual(
            [
              document.uuid,
              { state: DOCUMENT_STATES.removed, key: '112233' }
            ]
          );

          done();
        }
      );

      controller.update(req, res);
    });

    it('should save the document to Linshare and generate new key if the document is normal saved', function(done) {
      const createDocumentFromUrlMock = sinon.spy();

      helperMock.createLinshareClient = () => ({
        user: {
          workgroup: {
            getNode: () => Promise.resolve(document),
            createDocumentFromUrl: createDocumentFromUrlMock
          }
        }
      });

      mockery.registerMock('../lib/files', filesMock);
      mockery.registerMock('./helpers', helperMock);
      mockery.registerMock('uuid/v4', () => '112233');

      const controller = this.helpers.requireBackend('webserver/controller/document');
      const req = {
        query: {
          workGroupUuid: document.workgroup,
          documentUuid: document.uuid
        },
        body: {
          status: 2,
          url: 'http://example.com'
        }
      };
      const res = this.helpers.express.response(
        status => {
          expect(status).to.equal(200);
          expect(createDocumentFromUrlMock).to.have.been.calledWith(
            document.workgroup,
            { fileName: document.name, url: 'http://example.com' },
            { async: false, parent: document.parent }
          );
          done();
        }
      );

      controller.update(req, res);
    });
  });
});
