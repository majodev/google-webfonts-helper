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

var googleAPIFontItems = []; // holds originally fetched items from the Google Fonts API
var cachedFonts = []; // holds actual item list that can get requested - houses a "font" Object

// urlStore holds fetched urls (prop = font.id) to all conf.USER_AGENTS font formats
// gets merged with an item from cachedFonts to form a so called "fontItem" Object
var urlStore = {}; 

// zipStore holds path (prop = font.id) to locally cached zip (with all fonts in it)
// the socalled "zipItem" Object
var zipStore = {}; 


// -----------------------------------------------------------------------------
// Private
// -----------------------------------------------------------------------------

function getFontItem(font, callback) {

  if (_.isUndefined(urlStore[font.id]) === false) {
    if (urlStore[font.id].isDirty !== true) {
      // already cached, return instantly
      callback(_.merge(_.cloneDeep(font), urlStore[font.id]));
    } else {
      // process has already begun, wait until it has finished...
      emitter.once(font.id + "-pathFetched", function(fontItem) {
        callback(fontItem);
      });
    }
    // return here - attached to emitter or callbacked!
    return;
  }

  // Download path wasn't fetched till now
  // add a new entry
  urlStore[font.id] = {};
  urlStore[font.id].variants = [];
  urlStore[font.id].isDirty = true;

  // Fetch it!
  // setTimeout(function() {
  urlFetcher(font, urlStore, function(fontItem) {

    // fontItem is ready, no longer dirty (but files still are!)
    // remove dirty flag from store...
    delete urlStore[font.id].isDirty;
    // .. and cloned fontItem
    delete fontItem.isDirty;

    // fullfill the original request
    callback(fontItem);

    // fullfill still pending requests awaiting process completion
    emitter.emit(font.id + "-pathFetched", fontItem);

    // trigger obviating downloading of font files (even tough it's might not needed!)
    getFontFiles(fontItem, null);

  });
  // }, 10000);
}

function getFontFiles(fontItem, cb) {

  if (_.isUndefined(zipStore[fontItem.id]) === false) {
    if (zipStore[fontItem.id].isDirty !== true) {
      // already cached, return instantly
      // callback (if null, it's only obviating)
      if (_.isFunction(cb) === true) {
        // fullfill the original request
        cb(zipStore[fontItem.id]);
      } else {
        // nothing needs to be done, no callback (obviating)!
      }
    } else {
      // process has already begun, wait until it has finished...
      emitter.once(fontItem.id + "-filesFetched", function(zipItem) {
        // console.log("Download: fulfilling pending download request...");
        // callback (if null, it's only obviating)
        if (_.isFunction(cb) === true) {
          // fullfill the original request
          cb(zipItem);
        } else {
          // console.log("fulfill fail no callback!");
          // nothing needs to be done, no callback (obviating)!
        }
      });
    }
    // return here - attached to emitter or callbacked!
    return;
  }

  zipStore[fontItem.id] = {};
  zipStore[fontItem.id].isDirty = true;


  // trigger downloading of font files...
  downloader(fontItem, function(localPaths) {
    zipper(fontItem.id, localPaths, function(zipItemPath) {

      // save path to zip with all fonts in store
      zipStore[fontItem.id].zip = zipItemPath;

      // zip is ready, no longer dirty
      // remove dirty flag from store...
      delete zipStore[fontItem.id].isDirty;

      // callback (if null, it's only obviating)
      if (_.isFunction(cb) === true) {
        // fullfill the original request
        // console.log("Download: fulfill original request...");
        cb(zipStore[fontItem.id]);
      } else {
        // console.log("obsiation, no callback!");
      }

      // fullfill still pending requests awaiting process completion
      emitter.emit(fontItem.id + "-filesFetched", zipStore[fontItem.id]);

    });
  });
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
    getFontItem(font, function(fontItem) {
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
    getFontItem(font, function(fontItem) {
      getFontFiles(fontItem, function(zipItem) {
        callback(zipItem.zip);
      });
    });
  } else {
    // font not found!
    console.error("font not found: " + id);
    callback(null);
  }

};