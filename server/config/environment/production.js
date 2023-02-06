'use strict';

// Production specific configuration
// =================================
module.exports = {
  // Server IP
  ip: process.env.IP
    || undefined,

  // Server port
  port: process.env.PORT
    || 8080,
};