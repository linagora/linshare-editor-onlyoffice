const config = require('config');
const app = require('./src/webserver/app');
const { mongo } = require('./src/lib/db');
const logger = require('./src/lib/logger');

mongo.init();

app.server.listen(process.env.PORT || config.webserver.port, () => {
  logger.info(`Server started on port ${app.server.address().port}`);
});
