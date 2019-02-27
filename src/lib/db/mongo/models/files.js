const mongoose = require('mongoose');

const FilesSchema = new mongoose.Schema({
  uuid: { type: String, unique: true, required: true },
  key: { type: String, unique: true, required: true },
  state: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('files', FilesSchema);
