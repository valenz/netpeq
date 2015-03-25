var express = require('express');
var app = express();
var expressSession = require('express-session');
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var fs = require('fs');

var multer = require('multer');
var morgan = require('morgan');
var winston = require('winston');
var flash = require('connect-flash');

var pkg = require('./package');
var config = require('./config');

// Stores FFmpeg processes
var _renderids = {};

// Logging
winston.loggers.add('log', config.loggers.log);
var log = winston.loggers.get('log');
log.transports.console.label = pkg.name;
log.exitOnError = false;

// Configure Express
app.set('port', process.env.PORT || config.app.set.port);
app.set('address', process.env.ADDRESS || config.app.set.address);
app.set('env', process.argv[2] || process.env.NODE_ENV || config.env);

app.set('views', __dirname + config.app.set.views);
app.set('view engine', config.app.set.engine);
app.set('view options', config.app.set.options);

// Fires the server.
server.listen(app.get('port'), app.get('address'), function() {
  log.info('%s (%s) is running. Process id is %d.', process.title, process.version, process.pid);
  log.info('%s listening on %s:%d in %s mode.', pkg.name, server.address().address, server.address().port, app.settings.env);
});

// Body parser
app.use(multer());

// Request Logger
morgan.token('status', function(req, res) {
  var color = 32; // green
  var status = res.statusCode;

  if (status >= 500) color = 31; // red
  else if (status >= 400) color = 33; // yellow
  else if (status >= 300) color = 36; // cyan

  return '\x1b['+color+'m'+status;
})
app.use(morgan('\x1b[32m:date[clf]\x1b[0m: :method :url :status \x1b[0m:response-time ms | :res[content-length] | :remote-addr :remote-user HTTP/:http-version | :user-agent'));

// Local Routing Path
app.use(express.static(__dirname + config.app.set.static));

// Session/Cookie
app.use(expressSession(config.app.cookie.options));

// Flashing
app.use(flash());



// Socket connections
io.on('connection', function(socket){
  socket.on('conn_proc', function(rid) {
    log.info('Client connected. Render id is "%s".', rid);
  });

  // Renice increase
  socket.on('reniceup_proc', function(rid) {
    if(_renderids[rid]) {
      var getNiceness = _renderids[rid].options.niceness;
      var setNiceness = getNiceness == -20 ? -20 : getNiceness - 1;
      _renderids[rid].renice(setNiceness);
      log.warn('Priority of the process "%s" has been increased from %d to %d.', rid, getNiceness, setNiceness);
      io.sockets.emit('stat_proc', {
        renderid: rid,
        info: 'Priority has been increased from '+ getNiceness +' to '+ setNiceness +'.'
      });
    }
  });
  // Renice decrease
  socket.on('renicedown_proc', function(rid) {
    if(_renderids[rid]) {
      var getNiceness = _renderids[rid].options.niceness;
      var setNiceness = getNiceness == 20 ? 20 : getNiceness + 1;
      _renderids[rid].renice(setNiceness);
      log.warn('Priority of the process "%s" has been decreased from %d to %d.', rid, getNiceness, setNiceness);
      io.sockets.emit('stat_proc', {
        renderid: rid,
        info: 'Priority has been decreased from '+ getNiceness +' to '+ setNiceness +'.'
      });
    }
  });

  // Halt the process
  socket.on('stop_proc', function(rid){
    if(rid == 'sigstopall') {
      if(_renderids) {
        for(var rid in _renderids) {
          _renderids[rid].kill('SIGSTOP');
          log.warn('Process "%s" has been paused.', rid);
          io.sockets.emit('stat_proc', {
            renderid: rid,
            info: 'Process has been paused.'
          });
        }
      }
    } else {
      if(_renderids[rid]) {
        _renderids[rid].kill('SIGSTOP');
        log.warn('Process "%s" has been paused.', rid);
        io.sockets.emit('stat_proc', {
          renderid: rid,
          info: 'Process has been paused.'
        });
      } else {
        log.warn('No valid process found for id "%s".', rid);
        io.sockets.emit('stat_proc', {
          renderid: rid,
          info: 'No valid process found.'
        });
      }
    }
  });

  // Continue the process
  socket.on('cont_proc', function(rid){
    if(rid == 'sigcontall') {
      if(_renderids) {
        for(var rid in _renderids) {
          _renderids[rid].kill('SIGCONT');
          log.warn('Process "%s" has been resumed.', rid);
          io.sockets.emit('stat_proc', {
            renderid: rid,
            info: 'Process has been resumed.'
          });
        }
      }
    } else {
      if(_renderids[rid]) {
        _renderids[rid].kill('SIGCONT');
        log.warn('Process "%s" has been resumed.', rid);
        io.sockets.emit('stat_proc', {
          renderid: rid,
          info: 'Process has been resumed.'
        });
      } else {
        log.warn('No valid process found for id "%s".', rid);
        io.sockets.emit('stat_proc', {
          renderid: rid,
          info: 'No valid process found.'
        });
      }
    }
  });

  // Terminate the process
  socket.on('kill_proc', function(rid){
    if(rid == 'sigkillall') {
      if(_renderids) {
        for(var rid in _renderids) {
          _renderids[rid].kill('SIGKILL');
          log.error('Process "%s" has been killed.', rid);
        }
      }
    } else {
      if(_renderids[rid]) {
        _renderids[rid].kill('SIGKILL');
        log.error('Process "%s" has been killed.', rid);
      } else {
        log.warn('No valid process found for id "%s".', rid);
        io.sockets.emit('stat_proc', {
          renderid: rid,
          info: 'No valid process found.'
        });
      }
    }
  });
});



// Route dependencies
var routes = require('./routes/routes');

// Configure routes
app.get('/', routes.index);
app.get('/ugrid', routes.ugrid); // Upload grid
app.get('/ogrid', routes.ogrid); // Output grid
app.get('/agrid', routes.agrid); // Asset grid
app.get('/upload', routes.upload);
app.get('/queue', routes.queue(_renderids));

app.post('/upload', routes.postUpload);
app.post('/delete', routes.postDelete);
app.post('/update', routes.postUpdate);
app.post('/render', routes.postRender(io, _renderids));



// Error handling
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  if(req.user) {
    var err = new Error();
    err.message = 'Failed to load resource "'+ req.url +'". The server responded with a status of 404 (Not Found).';
    err.status = 404;
    err.method = req.method;
    err.header = req.headers;
    err.url = req.url;
    next(err);
  } else {
    res.redirect('/');
  }
});

// Handles uncaught exceptions.
process.on('uncaughtException', function (e) {
  log.debug('Caught exception: ', e.stack);
  log.error('Caught exception: ', e.message);
  return;
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.enable('verbose errors');
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    log.error(err.message);
    res.render('sites/status', {
      title: err.status,
      user: req.user,
      fallover: err,
      header: err.header,
      message: err.message
    });
  });
}

// production error handler
// no stacktraces leaked to user
if (app.get('env') === 'production') {
  app.disable('verbose errors');
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    log.error(err.message);
    res.render('sites/status', {
      title: err.status,
      user: req.user,
      fallover: err,
      header: {},
      message: err.message
    });
  });
}
