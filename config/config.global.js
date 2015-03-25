// Global default settings (run Node without set NODE_ENV)
var config = module.exports = {
  // Environment
  env: 'development',

  // App (required package dependencies)
  app: {
    set: {
      // Sets address where server listen to
      address: 'localhost',
      // Sets port where server listen to
      port: 9002,
      // Sets location of view pages
      views: '/views',
      // Sets view render engine
      engine: 'jade',
      // Sets view options
      options: {
        layout: false
      },
      // Sets location of static client side content
      static: '/public',
      // Sets location of the favicon
      favicon: '/public/images/favicon.ico'
    },
    cookie: {
      options: {
        // Name of the session ID cookie to set in the response
        key: 'FFID',
        // The secret used to sign the session ID cookie
        secret: 'keyboard cat',
        // Forces the session to be saved back to the session store,
        // even if the session was never modified during the request
        resave: false,
        // Forces a session that is "uninitialized" to be saved to the store
        saveUninitialized: true,
        cookie: {
          path: '/',
          httpOnly: true,
          // Requires an https-enabled website, i.e., HTTPS is necessary for secure cookies
          secure: false,
          // By default cookie.maxAge is null, meaning no "expires" parameter is set
          // so the cookie becomes a browser-session cookie. When the user closes the
          // browser the cookie (and session) will be removed.
          maxAge: 60 * 60 * 1000
        },
        // Force a cookie to be set on every response. This resets the expiration date
        rolling: true,
      }
    }
  },

  // Log levels [silly|debug|verbose|info|warn|error]
  loggers: {
    log: {
      console: {
        level: 'info',
        handleExceptions: true,
        colorize: true,
        timestamp: function() {
          return new Date().toISOString().substr(0, 11) + new Date().toLocaleTimeString();
        },
        prettyPrint: true,
        formatter: true,
        json: false
      }
    }
  },

  // Custom
  custom: {
    upload: 'public/data/upload/',
    output: 'public/data/output/',
    preview: 'public/data/preview/',
    assets: 'public/data/assets/'
  }
};
