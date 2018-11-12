const config = require('config');
const winston = require('winston');

const { format } = winston;
const { combine, colorize, simple } = format;
const logger = winston.createLogger({ exitOnError: false, format: combine(colorize(), simple()) });

logger.stream = {
  write: (message) => {
    logger.info(message.replace(/\n$/, ''));
  }
};

if (config.log.console.enabled) {
  logger.add(new winston.transports.Console(config.log.console.options));
}

if (config.log.file.enabled) {
  logger.info('Logger: registering file logger');
  logger.add(new winston.transports.File(config.log.file.options));
}

module.exports = logger;
