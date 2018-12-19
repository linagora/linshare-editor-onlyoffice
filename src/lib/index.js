const { mongo } = require('./db');

module.exports = {
  init
};

function init() {
  mongo.init();
}
