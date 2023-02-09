var _ = require('lodash');
var mkdirp = require('mkdirp');

var conf = require('./conf');
var googleFontsAPI = require('./googleFontsAPI');
var urlFetcher = require('./urlFetcher');
var downloader = require('./downloader');
var zipper = require('./zipper');
var subsetGen = require('./subsetGen');

var EventEmitter = require('events').EventEmitter;

var debug = require('debug')('gwfh:core');


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

// fileStore holds arrays of local paths to font files, id = fontItem.id + "-" + fontItem.storeID
var fileStore = {};

if (debug.enabled) {
  setInterval(function () {
    var events = emitter.eventNames();
    var listenersCount = _.reduce(_.map(events, function (event) {
      return emitter.listenerCount(event);
    }), function (sum, n) {
      return sum + n;
    }, 0);
    // console.log("tracked events: ", events);
    debug("core emitter ops tracked_events=" + events.length + " listeners=" + listenersCount + " eventNames=" + events);
  }, 10000)
}

// -----------------------------------------------------------------------------
// Private
// -----------------------------------------------------------------------------

function getFilterObject(font, subsetArr) {
  var filterObj = {};

  if (_.isArray(subsetArr) === false || subsetArr.length === 0) {
    _.each(font.subsets, function (subsetItem) {
      // supply filter with the default subset as defined in googleFontsAPI fetcher (latin or if no found other)
      filterObj[subsetItem] = (subsetItem === font.defSubset) ? true : false;
    });
  } else {
    _.each(font.subsets, function (subsetItem) {
      filterObj[subsetItem] = _.includes(subsetArr, subsetItem);
    });
  }


  debug(filterObj);
  return filterObj;
}

function getUrlStoreKey(font, subsetArr) {

  var fontSubsetStore = subsetStore[font.id];
  var fontSubsetKey;

  debug(fontSubsetStore);

  if (_.isUndefined(fontSubsetStore) === false) {
    fontSubsetKey = _.findKey(fontSubsetStore, {
      subsetMap: getFilterObject(font, subsetArr)
    });
    debug("fontSubsetKey for " + font.id, fontSubsetKey);
    if (_.isUndefined(fontSubsetKey) === false) {
      return fontSubsetKey;
    } else {
      debug("fontSubsetKey for " + font.id + " subset " + subsetArr + " not found!");
      return null;
    }
  } else {
    debug("fontSubsetStore for " + font.id + " not found!");
    return null;
  }
}


function getFontItem(font, subsetArr, callback) {

  // find the relevant subsetStore Object that holds the needed unique urlStore to fetch
  var subsetStoreKey = getUrlStoreKey(font, subsetArr);

  if (subsetStoreKey === null) {
    callback(null); // bailout.
    return;
  }

  var urlStore = subsetStore[font.id][subsetStoreKey];

  debug("urlStore for font.id=" + font.id + " subsetStoreKey=" + subsetStoreKey, urlStore);

  if (_.isUndefined(urlStore.variants) === false) {
    if (urlStore.isDirty !== true) {
      // already cached, return instantly
      debug("urlStore for font.id=" + font.id + " subsetStoreKey=" + subsetStoreKey, "already cached!");
      callback(_.merge(_.cloneDeep(font), urlStore));
    } else {
      // process to cache has already begun, wait until it has finished...
      debug("urlStore for font.id=" + font.id + " subsetStoreKey=" + subsetStoreKey, "waiting until cache...");

      // // DEBUG ONLY exit now
      // // TODO delete me
      // // !!!!!!!!!!!!!!!!!!!!!!!!
      // if (!urlStore.storeID) {
      //   console.error("urlStore.storeID is undefined for font " + font.id + " subset " + subsetStoreKey);
      //   process.exit(1);
      // }
      emitter.once(font.id + "-pathFetched-" + subsetStoreKey, function (fontItem) {
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

  // debug(subsetStore);

  // Fetch fontItem for the first time...
  urlFetcher(font, subsetStoreKey, function (urlStoreObject) {

    if (urlStoreObject === null) {
      console.error('urlStoreObject resolved null for font ' + font.id + ' subset ' + subsetStoreKey);
      urlStore.variants = undefined;
      callback(null);
      emitter.emit(font.id + "-pathFetched-" + subsetStoreKey, null);
      return;
    }

    debug("fetched fontItem for font.id=" + font.id + " subsetStoreKey=" + subsetStoreKey, urlStoreObject);

    var fontItem;

    // save the urlStoreObject...
    _.assign(subsetStore[font.id][subsetStoreKey], urlStoreObject);

    // fontItem is ready, no longer dirty (but files still are!)
    // remove dirty flag from store...
    delete subsetStore[font.id][subsetStoreKey].isDirty;

    // set and build up a proper fontItem
    fontItem = _.merge(_.cloneDeep(font), subsetStore[font.id][subsetStoreKey]);

    debug("saveable fontItem processed for font.id=" + font.id + " subsetStoreKey=" + subsetStoreKey, "fontItem=", fontItem);

    // fullfill the original request
    callback(fontItem);

    // fullfill still pending requests awaiting process completion
    emitter.emit(font.id + "-pathFetched-" + subsetStoreKey, fontItem);

    // trigger obviating downloading of font files (even tough it's might not needed!)
    getFontFiles(fontItem, null);

    // debug(urlStore);

  });
}

function getFontFiles(fontItem, cb) {

  var fileStoreID = fontItem.id + "-" + fontItem.storeID; // unique identifier in filestore.

  if (_.isUndefined(fileStore[fileStoreID]) === false) {
    if (fileStore[fileStoreID].isDirty !== true) {
      // already cached, return instantly
      // callback (if null, it's only obviating)
      if (_.isFunction(cb) === true) {
        // fullfill the original request
        cb(fileStore[fileStoreID]);
      } else {
        // nothing needs to be done, no callback (obviating)!
      }
    } else {
      // process has already begun, wait until it has finished...
      emitter.once(fontItem.id + "-filesFetched-" + fontItem.storeID, function (fileStoreItem) {
        debug(fileStoreID + " download: fulfilling pending download request...");
        // callback (if null, it's only obviating)
        if (_.isFunction(cb) === true) {
          // fullfill the original request
          cb(fileStoreItem);
        } else {
          debug(fileStoreID + " fulfill fail no callback!");
          // nothing needs to be done, no callback (obviating)!
        }
      });
    }
    // return here - attached to emitter or callbacked!
    return;
  }

  fileStore[fileStoreID] = {};
  fileStore[fileStoreID].isDirty = true;


  // trigger downloading of font files...
  downloader(fontItem, function (localPaths) {

    fileStore[fileStoreID].files = localPaths;
    fileStore[fileStoreID].zippedFilename = fontItem.id + "-" + fontItem.version + "-" + fontItem.storeID + '.zip'

    // fileStore for item is ready, no longer dirty
    // remove dirty flag from store...
    delete fileStore[fileStoreID].isDirty;

    // callback (if null, it's only obviating)
    if (_.isFunction(cb) === true) {
      // fullfill the original request
      debug(fileStoreID + " download: fulfill original request...");
      cb(fileStore[fileStoreID]);
    } else {
      debug(fileStoreID + " obsiation, no callback!");
    }

    // fullfill still pending requests awaiting process completion
    emitter.emit(fontItem.id + "-filesFetched-" + fontItem.storeID, fileStore[fileStoreID]);

  });
}

// -----------------------------------------------------------------------------
// Initialize
// -----------------------------------------------------------------------------

(function init() {
  // setTimeout(function() {

  process.once('SIGINT', function () {
    console.log('SIGINT received, removing core emitter listeners...');
    emitter.removeAllListeners();
  });

  process.once('SIGTERM', function () {
    console.log('SIGTERM received, removing core emitter listeners...');
    emitter.removeAllListeners();
  });

  mkdirp.sync(conf.CACHE_DIR);

  googleFontsAPI(googleAPIFontItems, cachedFonts, function (items) {

    // items are cached, build up the subsetStore...
    var subsetStoreUniqueCombos = 0;

    _.each(items, function (item) {
      var uniqueSubsetCombos = subsetGen(item.subsets);

      // Create subsetStore for item
      subsetStore[item.id] = uniqueSubsetCombos;

      // for startup: remember count of items to print it out...
      subsetStoreUniqueCombos += _.keys(uniqueSubsetCombos).length;
    });

    emitter.emit("initialized");

    debug("fonts cached and initialized. num fonts: " + items.length +
      " num unique subset combos: " + subsetStoreUniqueCombos);

  });

  // }, 10000);
}());


// -----------------------------------------------------------------------------
// Lodash Utility filters
// -----------------------------------------------------------------------------

// http://stackoverflow.com/questions/17251764/lodash-filter-collection-using-array-of-values
_.mixin({
  'findByValues': function (collection, property, values) {
    return _.filter(collection, function (item) {
      return _.includes(values, item[property]);
    });
  }
});

// -----------------------------------------------------------------------------
// Exports for REST API
// -----------------------------------------------------------------------------

module.exports.healthy = function healthy() {

  var events = emitter.eventNames();
  var listenersCount = _.reduce(_.map(events, function (event) {
    return emitter.listenerCount(event);
  }), function (sum, n) {
    return sum + n;
  }, 0);

  return `${cachedFonts.length} fonts.
Cached ${_.keys(fileStore).length} variants, ${_.sumBy(_.values(fileStore), function (f) { return (f.files) ? f.files.length : 0; })} files (${events.length}/${listenersCount} in-flight).
${events.length > 0 ? events.join(", ") : "No in-flight requests."}`;
}

module.exports.getAll = function getAll(callback) {
  if (cachedFonts.length > 0) {
    callback(cachedFonts);
  } else {
    emitter.once("initialized", function () {
      callback(cachedFonts);
    });
  }
};

module.exports.get = function get(id, subsetArr, callback) {

  var font = _.find(cachedFonts, {
    id: id
  });

  if (_.isUndefined(font) === false) {
    getFontItem(font, subsetArr, function (fontItem) {

      if (fontItem === null) {
        debug("font loading failed for id: " + id + " subsetArr: " + subsetArr);
        callback(null);
        return;
      }

      callback(fontItem);
    });
  } else {
    // font not found!
    debug("font not found: " + id);
    callback(null);
  }

};

module.exports.getDownload = function getDownload(id, subsetArr, variantsArr, formatsArr, callback) {

  var font = _.find(cachedFonts, {
    id: id
  });

  if (_.isUndefined(font) === false) {
    getFontItem(font, subsetArr, function (fontItem) {

      if (fontItem === null) {
        debug("font loading failed for id: " + id + " subsetArr: " + subsetArr + " variantsArr " + variantsArr + " formatsArr" + formatsArr);
        callback(null);
        return;
      }

      getFontFiles(fontItem, function (fileStoreItem) {

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
          // no files left, return null
          callback(null);
        }

      });
    });
  } else {
    // font not found!
    debug("font not found: " + id);
    callback(null);
  }

};
