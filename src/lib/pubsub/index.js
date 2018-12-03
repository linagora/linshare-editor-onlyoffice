const { EventEmitter2 } = require('eventemitter2');
const Pubsub = require('./pubsub');

const emitter = new EventEmitter2();
const { removeListener } = emitter;

emitter.removeListener = function(event, handler) {
  let count = this.listeners(event).length;
  let countAfterRemove = 0;

  while (count !== countAfterRemove) {
    count = countAfterRemove;
    removeListener.call(this, event, handler);
    countAfterRemove = this.listeners(event).length;
  }
};

module.exports = new Pubsub('local', emitter);
