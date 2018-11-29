const { mongo } = require('./src/lib/db');
const app = require('./src/webserver/app');

mongo.init();
app.init();
