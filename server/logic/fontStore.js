var _ = require('lodash');

var googleFontsAPI = require('./googleFontsAPI');
var urlFetcher = require('./urlFetcher');


// -----------------------------------------------------------------------------
// Variables
// -----------------------------------------------------------------------------

var googleAPIFontItems = [];
var cachedFonts = [];
var urlStore = {};


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
  urlFetcher(font, urlStore, callback);
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