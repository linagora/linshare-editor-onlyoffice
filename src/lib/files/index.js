const mongoose = require('mongoose');

const File = mongoose.model('files');

module.exports = {
  create,
  getByUuid,
  updateByUuid,
  removeByUuid
};

function create(file) {
  const fileAsModel = file instanceof File ? file : new File(file);

  return fileAsModel.save();
}

function getByUuid(uuid) {
  return File.findOne({ uuid }).exec();
}

function updateByUuid(uuid, modified) {
  return File.findOneAndUpdate({ uuid }, { $set: modified }, { new: true }).exec();
}

function removeByUuid(uuid) {
  return File.remove({ uuid }).exec();
}
