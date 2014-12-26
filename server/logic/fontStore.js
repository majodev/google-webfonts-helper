var _ = require('lodash');

var googleFontsAPI = require('./googleFontsAPI');
var urlFetcher = require('./urlFetcher');
var downloader = require('./downloader');
var zipper = require('./zipper');

var EventEmitter = require('events').EventEmitter;


// -----------------------------------------------------------------------------
// Variables
// -----------------------------------------------------------------------------

// manage multiple requests to non-complete resources via an emitter ()
var emitter = new EventEmitter();

var googleAPIFontItems = [];
var cachedFonts = [];
var urlStore = {};
var zipStore = {};


// -----------------------------------------------------------------------------
// Private
// -----------------------------------------------------------------------------

function getDownloadPaths(font, callback) {

  if (_.isUndefined(urlStore[font.id]) === false) {
    if (urlStore[font.id].isDirty !== true) {
      // already cached, return instantly
      callback(_.merge(_.cloneDeep(font), urlStore[font.id]));
      return;
    } else {
      // process has already begun, wait until it has finished...
      emitter.once(font.id + "-cached", function (fontItem) {
        callback(fontItem);
      });
    }
  }

  // Download path wasn't fetched till now
  // add a new entry
  urlStore[font.id] = {};
  urlStore[font.id].variants = [];
  urlStore[font.id].isDirty = true;

  // Fetch it!
  // setTimeout(function() {
  urlFetcher(font, urlStore, function(fontItem) {
    downloader(fontItem, function(localPaths) {
      zipper(fontItem.id, localPaths, function(zipItemPath) {
        // all loaded, no longer dirty.
        delete urlStore[font.id].isDirty;
        delete fontItem.isDirty;
        
        // save path to zip in extra store
        zipStore[font.id] = zipItemPath;

        // fullfill the original request
        callback(fontItem);

        // fullfill still pending requests awaiting process completion
        emitter.emit(font.id + "-cached", fontItem);
      });
    });
  });
  // }, 10000);
}

// -----------------------------------------------------------------------------
// Initialize
// -----------------------------------------------------------------------------

(function init() {
  // setTimeout(function() {

  googleFontsAPI(googleAPIFontItems, cachedFonts, function(items) {
    emitter.emit("initialized");
    console.log("initialized.");
  });

  // }, 10000);
}());

// -----------------------------------------------------------------------------
// Exports for REST API
// -----------------------------------------------------------------------------

module.exports.getAll = function getAll(callback) {
  if (cachedFonts.length > 0) {
    callback(cachedFonts);
  } else {
    emitter.once("initialized", function() {
      callback(cachedFonts);
    });
  }
};

module.exports.get = function get(id, callback) {

  var font = _.find(cachedFonts, {
    id: id
  });

  if (_.isUndefined(font) === false) {
    getDownloadPaths(font, function(fontItem) {
      callback(fontItem);
    });
  } else {
    // font not found!
    console.error("font not found: " + id);
    callback(null);
  }

};

module.exports.getDownload = function getDownload(id, callback) {

  var font = _.find(cachedFonts, {
    id: id
  });

  if (_.isUndefined(font) === false) {
    if (_.isUndefined(zipStore[font.id]) === true) {
      // font wasn't downloaded, do it...
      getDownloadPaths(font, function(fontItem) {
        callback(zipStore[font.id]);
      });
    } else {
      // font downloaded and path found, return it...
      callback(zipStore[font.id]);
    }
  } else {
    // font not found!
    console.error("font not found: " + id);
    callback(null);
  }

};