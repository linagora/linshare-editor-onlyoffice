const fs = require('fs');

const { DOCUMENT_EXTENSIONS, DOCUMENT_TYPES } = require('./constants');

module.exports = {
  createDirectory,
  deleteFile,
  existsSync,
  getFileExtension,
  getFileType,
  writeFile
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
  return `.${filename.split('.').pop().toLowerCase()}`;
}

function getFileType(filename) {
  const extension = getFileExtension(filename);

  if (DOCUMENT_EXTENSIONS.spreadsheet.indexOf(extension) > -1) return DOCUMENT_TYPES.spreadsheet;
  if (DOCUMENT_EXTENSIONS.presentation.indexOf(extension) > -1) return DOCUMENT_TYPES.presentation;

  return DOCUMENT_TYPES.text;
}
