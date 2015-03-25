var config = require('./config.global');

// Overrides global config (run Node with NODE_ENV=test)

config.env = 'test';
config.app.set.port = 9090;
config.db.name = '/liptest';
config.loggers.log.console.level = 'silly';
config.loggers.log.console.label = 'TEST';

module.exports = config;
