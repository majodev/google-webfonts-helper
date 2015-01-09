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

  // get the subset string if it was supplied... 
  // e.g. "subset=latin,latin-ext," will be transformed into ["latin","latin-ext"] (non whitespace arrays)
  var subsetsArr = _.isUndefined(req.query.subsets) ? null : _.without(req.query.subsets.split(/[,]+/), '');

  // console.log(subsets);

  if (req.query.download === "zip") {
    // don't return a json, return a zipped download...

    core.getDownload(req.params.id, subsetsArr, function(archiveStream, filename) {

      // Tell the browser that this is a zip file.
      res.writeHead(200, {
          'Content-Type': 'application/zip',
          'Content-disposition': 'attachment; filename=' + filename
      });

      // pipe the stream from the zipper to res...
      archiveStream.pipe(res);

    });

  } else {
    core.get(req.params.id, subsetsArr, function(item) {
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