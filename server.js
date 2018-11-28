const io = require('socket.io');
const { mongo } = require('./src/lib/db');
const app = require('./src/webserver/app');
const wss = require('./src/wsserver');

mongo.init();
app.init();
wss.init(io(app.server));
