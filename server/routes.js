/**
 * Main application routes
 */

'use strict';

var errors = require('./components/errors');
var core = require('./logic/core');

module.exports = function (app) {

  // Insert routes below
  app.use('/api/fonts', require('./api/font'));

  app.route('/-/healthy')
    .get(function (req, res) {
      res.type('text/plain');
      res.send(core.healthy());
    });

  // All undefined asset or api routes should return a 404
  app.route('/:url(api|auth|components|app|bower_components|assets)/*')
    .get(errors[404]);

  // All other routes should redirect to the index.html
  app.route('/*')
    .get(function (req, res) {
      res.sendFile(app.get('appPath') + '/index.html');
    });
};
