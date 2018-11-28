const mongoose = require('mongoose');

const FilesSchema = new mongoose.Schema({
  uuid: { type: String, unique: true, required: true },
  workGroup: { type: String, required: true },
  parent: { type: String, required: true },
  path: { type: String },
  name: { type: String, required: true },
  mimeType: { type: String, required: true },
  state: { type: String, required: true },
  size: { type: Number },
  sha256sum: { type: String },
  description: { type: String },
  fileType: { type: String },
  documentType: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('files', FilesSchema);
