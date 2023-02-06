'use strict';

var path = require('path');
var _ = require('lodash');

function requiredProcessEnv(name) {
  if (!process.env[name]) {
    throw new Error('You must set the ' + name + ' environment variable');
  }
  return process.env[name];
}

// All configurations will extend these options
// ============================================
var all = {
  env: process.env.NODE_ENV,

  // Root path of server
  root: path.normalize(__dirname + '/../../..'),

  // Server port
  port: process.env.PORT
    || 9000,

  // Server port
  serverTimeout: process.env.TIMEOUT_MS
    || 60 * 1000, // 60 seconds

  // Middlewares
  enableMiddlewareAccessLog: process.env.ENABLE_MIDDLEWARE_ACCESS_LOG === 'true' ? true : false, // default false
  enableMiddlewareCompression: process.env.ENABLE_MIDDLEWARE_COMPRESSION === 'false' ? false : true // default true
};

// Export the config object based on the NODE_ENV
// ==============================================
module.exports = _.merge(
  all,
  require('./' + process.env.NODE_ENV + '.js') || {});