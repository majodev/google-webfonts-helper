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
    res.json(items);
  })

  // res.json(cachedFonts.getAll());
};

exports.show = function(req, res) {

  cachedFonts.get(req.params.id, function (item) {
    res.json(item);
  });

  // cachedFonts.getAll(function(items) {
  //   res.json(_.find(items, {
  //     id: req.params.id
  //   }));
  // })

  // res.json(_.find(cachedFonts.get(), {
  //   id: req.params.id
  // }));
};