/**
 * Main application file
 */

'use strict';

// Set default node environment to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// DEBUG: programatically force the use of debug statements throughout the app...
// process.env.DEBUG = 'gwfh*';

var debug = require('debug')('gwfh:app');
var _ = require('lodash');
var express = require('express');
var config = require('./config/environment');
// Setup server
var app = express();
var server = require('http').createServer(app);
server.timeout = _.parseInt(config.serverTimeout); // 60 seconds

require('./config/express')(app);
require('./routes')(app);

// Start server
server.listen(config.port, config.ip, function () {
  console.log('Express server listening on %d, in %s mode (timeout=%dms, compress=%s, accesslog=%s)', config.port, app.get('env'), server.timeout, config.enableMiddlewareCompression, config.enableMiddlewareAccessLog);
  debug("debug enabled.");
});

process.once('SIGINT', function () {
  console.log('SIGINT received, closing server...');
  server.close();
});

process.once('SIGTERM', function () {
  console.log('SIGTERM received, closing server...');
  server.close();
});

// Expose app
exports = module.exports = app;
