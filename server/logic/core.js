var _ = require('lodash');

var googleFontsAPI = require('./googleFontsAPI');
var urlFetcher = require('./urlFetcher');
var downloader = require('./downloader');
var zipper = require('./zipper');
var subsetGen = require('./subsetGen');

var EventEmitter = require('events').EventEmitter;


// -----------------------------------------------------------------------------
// Variables
// -----------------------------------------------------------------------------

// manage multiple requests to non-complete resources via an emitter ()
var emitter = new EventEmitter();

var googleAPIFontItems = []; // holds originally fetched items from the Google Fonts API
var cachedFonts = []; // holds actual item list that can get requested - houses a "font" Object

// The subsetStore is utilzing the subsetTuples generator and identified by the font.id!
var subsetStore = {}; // every item in here holds a urlStore Object + a unique subset combo.
// urlStore holds fetched urls to all conf.USER_AGENTS font formats
// gets merged with an item from cachedFonts to form a so called "fontItem" Object

// fileStore holds arrays of local paths to font files, id = font.id + "-" + subsetStoreID
var fileStore = {};


// -----------------------------------------------------------------------------
// Private
// -----------------------------------------------------------------------------

function getFilterObject(font, subsetArr) {
  var filterObj = {};

  if (_.isArray(subsetArr) === false || subsetArr.length === 0) {
    _.each(font.subsets, function(subsetItem) {
      // supply filter with the default subset as defined in googleFontsAPI fetcher (latin or if no found other)
      filterObj[subsetItem] = (subsetItem === font.defSubset) ? true : false;
    });
  } else {
    _.each(font.subsets, function(subsetItem) {
      filterObj[subsetItem] = _.contains(subsetArr, subsetItem);
    });
  }


  // console.log(filterObj);
  return filterObj;
}

function getUrlStoreKey(font, subsetArr) {

  var fontSubsetStore = subsetStore[font.id];
  var fontSubsetKey;

  // console.log(fontSubsetStore);

  if (_.isUndefined(fontSubsetStore) === false) {
    fontSubsetKey = _.findKey(fontSubsetStore, {
      subsetMap: getFilterObject(font, subsetArr)
    });
    // console.log(fontSubsetKey);
    if (_.isUndefined(fontSubsetKey) === false) {
      return fontSubsetKey;
    } else {
      throw new Error("fontSubsetKey for " + font.id + " subset " + subsetArr + " not found!");
    }
  } else {
    throw new Error("fontSubsetStore for " + font.id + " not found!");
  }
}


function getFontItem(font, subsetArr, callback) {

  // find the relevant subsetStore Object that holds the needed unique urlStore to fetch
  var subsetStoreKey = getUrlStoreKey(font, subsetArr);
  var urlStore = subsetStore[font.id][subsetStoreKey];

  // console.log(urlStore);

  if (_.isUndefined(urlStore.variants) === false) {
    // console.log(urlStore);
    if (urlStore.isDirty !== true) {
      // already cached, return instantly
      // console.log("already cached!");
      callback(_.merge(_.cloneDeep(font), urlStore));
    } else {
      // process to cache has already begun, wait until it has finished...
      // console.log("waiting until cache...");
      emitter.once(font.id + "-pathFetched-" + urlStore.storeID, function(fontItem) {
        callback(fontItem);
      });
    }
    // return here - attached to emitter or callbacked!
    return;
  }

  // Download paths weren't fetched till now
  // add a new entry
  urlStore.variants = [];
  urlStore.isDirty = true;

  // console.log(subsetStore);

  // Fetch fontItem for the first time...
  urlFetcher(font, subsetStoreKey, function(urlStoreObject) {

    var fontItem;

    // save the urlStoreObject...
    _.assign(subsetStore[font.id][subsetStoreKey], urlStoreObject);

    // fontItem is ready, no longer dirty (but files still are!)
    // remove dirty flag from store...
    delete subsetStore[font.id][subsetStoreKey].isDirty;


    // set and build up a proper fontItem
    fontItem = _.merge(_.cloneDeep(font), subsetStore[font.id][subsetStoreKey])

    // fullfill the original request
    callback(fontItem);

    // fullfill still pending requests awaiting process completion
    emitter.emit(font.id + "-pathFetched-" + urlStoreObject.storeID, fontItem);

    // trigger obviating downloading of font files (even tough it's might not needed!)
    getFontFiles(fontItem, null);

    // console.log(urlStore);

  });
}

function getFontFiles(fontItem, cb) {

  if (_.isUndefined(fileStore[fontItem.id + "-" + fontItem.storeID]) === false) {
    if (fileStore[fontItem.id + "-" + fontItem.storeID].isDirty !== true) {
      // already cached, return instantly
      // callback (if null, it's only obviating)
      if (_.isFunction(cb) === true) {
        // fullfill the original request
        cb(fileStore[fontItem.id + "-" + fontItem.storeID]);
      } else {
        // nothing needs to be done, no callback (obviating)!
      }
    } else {
      // process has already begun, wait until it has finished...
      emitter.once(fontItem.id + "-filesFetched-" + fontItem.storeID, function(fileStoreItem) {
        // console.log("Download: fulfilling pending download request...");
        // callback (if null, it's only obviating)
        if (_.isFunction(cb) === true) {
          // fullfill the original request
          cb(fileStoreItem);
        } else {
          // console.log("fulfill fail no callback!");
          // nothing needs to be done, no callback (obviating)!
        }
      });
    }
    // return here - attached to emitter or callbacked!
    return;
  }

  fileStore[fontItem.id + "-" + fontItem.storeID] = {};
  fileStore[fontItem.id + "-" + fontItem.storeID].isDirty = true;


  // trigger downloading of font files...
  downloader(fontItem, function(localPaths) {

    fileStore[fontItem.id + "-" + fontItem.storeID].files = localPaths;
    fileStore[fontItem.id + "-" + fontItem.storeID].zippedFilename = fontItem.id + "-" + fontItem.version + "-" + fontItem.storeID + '.zip'

    // fileStore for item is ready, no longer dirty
    // remove dirty flag from store...
    delete fileStore[fontItem.id + "-" + fontItem.storeID].isDirty;

    // callback (if null, it's only obviating)
    if (_.isFunction(cb) === true) {
      // fullfill the original request
      // console.log("Download: fulfill original request...");
      cb(fileStore[fontItem.id + "-" + fontItem.storeID]);
    } else {
      // console.log("obsiation, no callback!");
    }

    // fullfill still pending requests awaiting process completion
    emitter.emit(fontItem.id + "-filesFetched-" + fontItem.storeID, fileStore[fontItem.id + "-" + fontItem.storeID]);

  });
}

// -----------------------------------------------------------------------------
// Initialize
// -----------------------------------------------------------------------------

(function init() {
  // setTimeout(function() {

  googleFontsAPI(googleAPIFontItems, cachedFonts, function(items) {

    // items are cached, build up the subsetStore...
    var subsetStoreUniqueCombos = 0;

    _.each(items, function(item) {
      var uniqueSubsetCombos = subsetGen(item.subsets);

      // Create subsetStore for item
      subsetStore[item.id] = uniqueSubsetCombos;

      // for startup: remember count of items to print it out...
      subsetStoreUniqueCombos += _.keys(uniqueSubsetCombos).length;
    });

    emitter.emit("initialized");

    console.log("fonts cached and initialized. num fonts: " + items.length +
      " num unique subset combos: " + subsetStoreUniqueCombos);

  });

  // }, 10000);
}());


// -----------------------------------------------------------------------------
// Lodash Utility filters
// -----------------------------------------------------------------------------

// http://stackoverflow.com/questions/17251764/lodash-filter-collection-using-array-of-values
_.mixin({
  'findByValues': function(collection, property, values) {
    return _.filter(collection, function(item) {
      return _.contains(values, item[property]);
    });
  }
});

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

module.exports.get = function get(id, subsetArr, callback) {

  var font = _.find(cachedFonts, {
    id: id
  });

  if (_.isUndefined(font) === false) {
    getFontItem(font, subsetArr, function(fontItem) {
      callback(fontItem);
    });
  } else {
    // font not found!
    console.error("font not found: " + id);
    callback(null);
  }

};

module.exports.getDownload = function getDownload(id, subsetArr, variantsArr, formatsArr, callback) {

  var font = _.find(cachedFonts, {
    id: id
  });

  if (_.isUndefined(font) === false) {
    getFontItem(font, subsetArr, function(fontItem) {
      getFontFiles(fontItem, function(fileStoreItem) {

        var filteredFiles = fileStoreItem.files;

        // filter away unwanted variants...
        if (variantsArr !== null) {
          filteredFiles = _.findByValues(filteredFiles, "variant", variantsArr);
        }

        // filter away unwanted formats...
        if (formatsArr !== null) {
          filteredFiles = _.findByValues(filteredFiles, "format", formatsArr);
        }


        if (filteredFiles.length > 0) {
          // callback and return archiveStream + zipped filename
          callback(zipper(filteredFiles), fileStoreItem.zippedFilename);
        } else {
          // no files left, return all nulled.
          callback(null, null);
        }

      });
    });
  } else {
    // font not found!
    console.error("font not found: " + id);
    callback(null);
  }

};