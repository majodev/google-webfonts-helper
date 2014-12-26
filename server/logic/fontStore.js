var _ = require('lodash');

var googleFontsAPI = require('./googleFontsAPI');
var urlFetcher = require('./urlFetcher');
var downloader = require('./downloader');
var zipper = require('./zipper');


// -----------------------------------------------------------------------------
// Variables
// -----------------------------------------------------------------------------

var googleAPIFontItems = [];
var cachedFonts = [];
var urlStore = {};
var zipStore = {};


// -----------------------------------------------------------------------------
// Private
// -----------------------------------------------------------------------------

function getDownloadPaths(font, callback) {

  if (_.isUndefined(urlStore[font.family]) === false) {
    // already cached, return instantly
    callback(_.merge(_.cloneDeep(font), urlStore[font.family]));
    return;
  }

  // Download path wasn't fetched till now
  // add a new entry
  urlStore[font.family] = {};
  urlStore[font.family].variants = [];

  // Fetch it!
  urlFetcher(font, urlStore, function(fontItem) {
    downloader(fontItem, function(localPaths) {
      zipper(fontItem.id, localPaths, function(zipItemPath) {
        zipStore[font.family] = zipItemPath;
        callback(fontItem);
      });
    });
  });
}

// -----------------------------------------------------------------------------
// Initialize
// -----------------------------------------------------------------------------

(function init() {
  googleFontsAPI(googleAPIFontItems, cachedFonts);
}());

// -----------------------------------------------------------------------------
// Exports for REST API
// -----------------------------------------------------------------------------

module.exports.getAll = function getAll(callback) {
  if (cachedFonts.length > 0) {
    callback(cachedFonts);
  } else {
    // wait until first time populated...
    var timer = setInterval(function() {
      if (cachedFonts.length > 0) {
        callback(cachedFonts);
        clearInterval(timer);
        // console.log("POPULATED!");
      } else {
        // console.log("waiting for populate....")
      }
    }, 500)
  }
};

module.exports.get = function get(id, callback) {

  var font = _.find(cachedFonts, {
    id: id
  });

  if (_.isUndefined(font) === false) {
    getDownloadPaths(font, function(item) {
      callback(item);
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
    if (_.isUndefined(zipStore[font.family]) === true) {
      // font wasn't downloaded, do it...
      getDownloadPaths(font, function(item) {
        callback(zipStore[font.family]);
      });
    } else {
      // font downloaded and path found, return it...
      callback(zipStore[font.family]);
    }
  } else {
    // font not found!
    console.error("font not found: " + id);
    callback(null);
  }

};