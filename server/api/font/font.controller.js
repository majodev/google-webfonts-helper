/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /things              ->  index
 * POST    /things              ->  create
 * GET     /things/:id          ->  show
 * PUT     /things/:id          ->  update
 * DELETE  /things/:id          ->  destroy
 */
'use strict';

var _ = require('lodash');

var cachedFonts = require('./cachedFonts');

// Get list of fonts
exports.index = function(req, res) {

  cachedFonts.getAll(function(items) {
    // setTimeout(function() {
      res.json(items);
    // }, 3000);
  })

};

// Get specific fonts including links
exports.show = function(req, res) {

  cachedFonts.get(req.params.id, function(item) {
    // setTimeout(function() {
      res.json(item);
    // }, 3000);

  });

};