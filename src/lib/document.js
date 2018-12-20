const config = require('config');
const fs = require('fs');
const path = require('path');
const { Client } = require('linshare-api-client');

const pubsub = require('../lib/pubsub');
const { PUBSUB_EVENTS } = require('../lib/constants');
const Files = require('../lib/files');
const { generateToken } = require('./jwt');
const { DOCUMENT_STATES } = require('./constants');
const {
  createDirectory,
  deleteFile,
  existsSync,
  getFileType,
  getFileExtension,
  writeFile
} = require('./helpers');

const STORAGE_DIR = path.join(__dirname, '../../files');

class Document {
  constructor(documentUuid, workGroupUuid, user, documentStorageServerUrl) {
    this.uuid = documentUuid;
    this.workGroup = workGroupUuid;
    this.user = user;
    this.documentStorageServerUrl = documentStorageServerUrl;
    this.filePath = path.join(STORAGE_DIR, this.uuid);

    const { algorithm, expiresIn, issuer } = config.get('linshare.jwt');

    this.storageService = new Client({
      baseUrl: config.get('linshare.baseUrl'),
      auth: {
        type: 'jwt',
        token: generateToken(
          { sub: user.mail },
          {
            key: fs.readFileSync(path.join(__dirname, '../../config/jwt.key')),
            algorithm,
            expiresIn,
            issuer
          }
        )
      }
    }).user.workgroup;

    createDirectory(STORAGE_DIR);
  }

  async populateMetadata() {
    const document = await this.storageService.getNode(this.workGroup, this.uuid);

    document.fileType = getFileExtension(document.name);
    document.documentType = getFileType(document.name);
    if (this.isDownloaded()) {
      document.downloadUrlPath = `/files/${this.uuid}`;
      document.callbackUrlPath = `/api/documents/track?workGroupUuid=${this.workGroup}&documentUuid=${this.uuid}&userEmail=${this.user.mail}`;
    }

    Object.assign(this, document);
  }

  async update(url) {
    const newDocument = await this.storageService.createDocumentFromUrl(
      this.workGroup,
      { url, fileName: this.name },
      { parent: this.parent, async: false }
    );

    await this.storageService.deleteNode(this.workGroup, this.uuid);

    newDocument.name = this.name;
    await this.storageService.updateNode(this.workGroup, newDocument.uuid, newDocument);
  }

  async save() {
    try {
      const fileData = await this.storageService.downloadDocument(this.workGroup, this.uuid, {
        responseType: 'arraybuffer'
      });

      await writeFile(this.filePath, fileData);
      await this.setState(DOCUMENT_STATES.downloaded);
      await this.populateMetadata();

      pubsub.topic(PUBSUB_EVENTS.DOCUMENT_DOWNLOADED).publish(this);
    } catch (error) {
      // TODO: if removing document from db is failed, we cannot open that document anymore. It is always in "downloading" state!!!
      await this.remove();

      pubsub.topic(PUBSUB_EVENTS.DOCUMENT_DOWNLOAD_FAILED).publish({
        document: this,
        error
      });

      throw error;
    }
  }

  async loadState() {
    const document = await Files.getByUuid(this.uuid);

    if (document) {
      this.state = document.state;
    }
  }

  async setState(state) {
    this.state = state;

    const document = await Files.getByUuid(this.uuid);

    if (document) {
      await Files.updateByUuid(this.uuid, { state });
    } else {
      await Files.create(this);
    }
  }

  async remove() {
    await Files.removeByUuid(this.uuid);
    await deleteFile(this.filePath);
  }

  denormalize() {
    const denormalized = { ...this };

    delete denormalized.filePath;

    return denormalized;
  }

  isDownloaded() {
    return existsSync(this.filePath) && this.state === DOCUMENT_STATES.downloaded;
  }

  isDownloading() {
    return this.state === DOCUMENT_STATES.downloading;
  }

  buildDocumentserverPayload() {
    const payload = {
      document: {
        fileType: this.fileType,
        title: this.name,
        url: `${this.documentStorageServerUrl}${this.downloadUrlPath}`,
        key: this.uuid
      },
      documentType: this.documentType,
      editorConfig: {
        user: {
          id: this.user.uuid,
          name: `${this.user.firstName} ${this.user.lastName}`
        },
        callbackUrl: `${this.documentStorageServerUrl}${this.callbackUrlPath}`
      }
    };

    const { enable, secret, algorithm, expiresIn } = config.get('documentServer.signature.browser');

    if (!enable) {
      return payload;
    }

    return {
      ...payload,
      token: generateToken(payload, {
        key: secret,
        algorithm,
        expiresIn
      })
    };
  }
}

module.exports = Document;
