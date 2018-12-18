const io = require('socket.io');
const lib = require('./src/lib');
const app = require('./src/webserver/app');
const wss = require('./src/wsserver');

lib.init();
app.init();
wss.init(io(app.server));
