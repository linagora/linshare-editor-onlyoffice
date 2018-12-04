const documents = require('./documents');

const init = function(sio) {
  documents.init(sio);
};

module.exports = {
  init
};
