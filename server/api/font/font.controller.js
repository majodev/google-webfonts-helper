/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /fonts              ->  index
 * POST    /fonts              ->  create
 * GET     /fonts/:id          ->  show
 * PUT     /fonts/:id          ->  update
 * DELETE  /fonts/:id          ->  destroy
 */
'use strict';

var _ = require('lodash');

var core = require('./../../logic/core');

// Get list of fonts
exports.index = function(req, res) {

  core.getAll(function(items) {
    // setTimeout(function() {
    res.json(items);
    // }, 3000);
  })

};

// Get specific fonts including links
exports.show = function(req, res) {

  if (req.query.download === "zip") {
    // don't return a json, return a zipped download...

    core.getDownload(req.params.id, function(localZipPath) {

      if (localZipPath === null) {
        res.status(404) // HTTP status 404: NotFound
          .send('Not found');
      } else {
        res.download(localZipPath);
      }

    });

  } else {
    core.get(req.params.id, function(item) {
      // setTimeout(function() {
      if (item === null) {
        res.status(404) // HTTP status 404: NotFound
          .send('Not found');
      } else {
        res.json(item);
      }
      // }, 3000);
    });
  }

};