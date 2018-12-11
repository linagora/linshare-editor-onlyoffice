const config = require('config');
const winston = require('winston');

const { format } = winston;
const { combine, colorize, splat, printf, timestamp } = format;

const customFormat = printf(({ timestamp, level, message, meta }) => {
  const result = `${timestamp} ${level} ${message}`;

  if (meta instanceof Error) {
    return `${result}: ${meta.stack}`;
  }

  if (typeof meta === 'string') {
    return `${result}: ${meta}`;
  }

  if (Array.isArray(meta)) {
    return `${result}: ${meta.join(' ')}`;
  }

  if (meta instanceof Object && !Array.isArray(meta)) {
    return `${result}`;
  }

  return result;
});

const logger = winston.createLogger({ exitOnError: false, format: combine(splat(), timestamp(), colorize(), customFormat) });


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
