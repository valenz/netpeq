var config = require('./config.global');

// Overrides global config (run Node with NODE_ENV=development)

config.env = 'development';
config.app.set.port = 3000;

module.exports = config;
