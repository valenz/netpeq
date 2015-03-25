var config = require('./config.global');

// Overrides global config (run Node with NODE_ENV=production)

config.env = 'production';
config.loggers.log.console.level = 'info';

module.exports = config;
