const mongoose = require('mongoose');

const FilesSchema = new mongoose.Schema({
  uuid: { type: String, unique: true, required: true },
  workGroup: { type: String, required: true },
  parent: { type: String },
  path: { type: String },
  name: { type: String },
  mimeType: { type: String },
  state: { type: String, required: true },
  size: { type: Number },
  sha256sum: { type: String },
  description: { type: String },
  fileType: { type: String },
  documentType: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('files', FilesSchema);
