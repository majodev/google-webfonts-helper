/**
 * Express configuration
 */

'use strict';

var express = require('express');
var path = require('path');
var config = require('./environment');

module.exports = function (app) {
  var env = app.get('env');

  app.set('viewPath', config.root + '/server/views');

  if (config.enableMiddlewareCompression) {
    app.use(require('compression')());
  }

  if (env === 'production') {
    app.use(express.static(path.join(config.root, 'public')));
    app.set('appPath', config.root + '/public');
    if (config.enableMiddlewareAccessLog) {
      app.use(require('morgan')(':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length]'));
    }
  } else {
    app.use(require('connect-livereload')());
    app.use(express.static(path.join(config.root, '.tmp')));
    app.use(express.static(path.join(config.root, 'client')));
    app.set('appPath', config.root + '/client');
    app.use(require('morgan')('dev'));
    app.use(require('errorhandler')()); // Error handler - has to be last
  }
};