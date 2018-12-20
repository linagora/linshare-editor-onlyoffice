const fs = require('fs');
const { Client } = require('linshare-api-client');
const path = require('path');
const config = require('config');
const { generateToken } = require('./jwt');

const { DOCUMENT_EXTENSIONS, DOCUMENT_TYPES, LINSHARE_ROLE_ACTIONS, LINSHARE_ROLE_RESOURCE_TYPES } = require('./constants');

module.exports = {
  createDirectory,
  deleteFile,
  existsSync,
  getFileExtension,
  getFileType,
  writeFile,
  createLinshareClient,
  verifyUserEditPermission
};

function existsSync(path) {
  let result = true;

  try {
    fs.accessSync(path, fs.F_OK);
  } catch (e) {
    result = false;
  }

  return result;
}

function createDirectory(path) {
  !existsSync(path) && fs.mkdirSync(path);
}

async function deleteFile(filePath) {
  existsSync(filePath) && fs.unlink(filePath, (error) => {
    if (error) throw error;
  });
}

async function writeFile(filePath, data) {
  fs.writeFile(filePath, data, (error) => {
    if (error) throw error;
  });
}

function getFileExtension(filename) {
  return `${filename.split('.').pop().toLowerCase()}`;
}

function getFileType(filename) {
  const extension = getFileExtension(filename);

  if (DOCUMENT_EXTENSIONS.spreadsheet.indexOf(extension) > -1) return DOCUMENT_TYPES.spreadsheet;
  if (DOCUMENT_EXTENSIONS.presentation.indexOf(extension) > -1) return DOCUMENT_TYPES.presentation;

  return DOCUMENT_TYPES.text;
}

function createLinshareClient(tokenPayload) {
  const { algorithm, expiresIn, issuer } = config.get('linshare.jwt');

  return new Client({
    baseUrl: config.get('linshare.baseUrl'),
    auth: {
      type: 'jwt',
      token: generateToken(
        tokenPayload,
        {
          key: fs.readFileSync(path.join(__dirname, '../../config/jwt.key')),
          algorithm,
          expiresIn,
          issuer
        }
      )
    }
  });
}

async function verifyUserEditPermission(user, workGroupId) {
  let sharedSpaceNodeMember;
  const linshareClient = createLinshareClient({ sub: user.mail });
  try {
    sharedSpaceNodeMember = await linshareClient.user.sharedSpaceNodes.findMemberByAccountUuid(workGroupId, user.uuid);
  } catch (error) {
    if (error.response.status === 404) {
      return false;
    }

    throw error;
  }
  const permissions = await linshareClient.user.sharedSpaceRoles.findAllPermissions(sharedSpaceNodeMember.role.uuid);
  let canCreate = false,
      canDelete = false;

  for (let i = 0; i < permissions.length; i++) {
    if (permissions[i].resource === LINSHARE_ROLE_RESOURCE_TYPES.file) {
      if (permissions[i].action === LINSHARE_ROLE_ACTIONS.create) {
        canCreate = true;
      }

      if (permissions[i].action === LINSHARE_ROLE_ACTIONS.delete) {
        canDelete = true;
      }

      if (canCreate && canDelete) {
        return true;
      }
    }
  }

  return false;
}
