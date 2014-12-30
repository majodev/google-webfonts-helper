var _ = require('lodash');
var async = require('async');

var conf = require('./conf');
var cssFetcher = require('./cssFetcher');

function fetchUrls(font, storeID, callback) {

  var tmpUrlStoreObject = {
    variants: [],
    storeID: storeID
  };

  var cssSubsetString = _.clone(storeID).replace(/_/g, ","); // make the variant string google API compatible...
  // console.log(cssSubsetString);

  async.each(font.variants, function(variant, variantCB) {

    var variantItem = {
      id: variant
    };

    async.each(_.pairs(conf.USER_AGENTS), function(typeAgentPair, requestCB) {

      cssFetcher(font.family + ":" + variant, cssSubsetString, typeAgentPair[0], typeAgentPair[1], function(err, resources) {
        if (err) {
          requestCB(err);
          return;
        }

        // save the type (woff, eot, svg, ttf, usw...)
        var type = typeAgentPair[0];
        var url = resources[0]._extracted.url;

        // woff2Subsets has multiple urls and unicode-range set - return an array with url, unicodeRange and subset properties
        if (type === "woff2Subsets") {

          variantItem[type] = [];

          _.each(resources, function(resource, index) {
            var woff2url = resource._extracted.url;
            // rewrite url to use https instead on http!
            woff2url = woff2url.replace(/^http:\/\//i, 'https://');

            if (_.isUndefined(resource["unicode-range"]) !== true) {

              // it looks like the order of the css statements correlates to the 
              // subsets array provided by google api
              // attach that information too
              variantItem[type].push({
                url: woff2url,
                unicodeRange: resource["unicode-range"],
                subset: font.subsets[index]
              });
            } else {
              console.error("Cannot produce woff2Subsets entry for " + resources[0]["font-family"] + ", unicode-range missing")
            }

          });
        } else {
          // safe the url directly
          // rewrite url to use https instead on http!
          url = url.replace(/^http:\/\//i, 'https://');
          variantItem[type] = url;
        }


        // if not defined, also save procedded font-family, fontstyle, font-weight, unicode-range
        if (_.isUndefined(variantItem.fontFamily) && _.isUndefined(resources[0]["font-family"]) === false) {
          variantItem.fontFamily = resources[0]["font-family"];
        }

        if (_.isUndefined(variantItem.fontStyle) && _.isUndefined(resources[0]["font-style"]) === false) {
          variantItem.fontStyle = resources[0]["font-style"];
        }

        if (_.isUndefined(variantItem.fontWeight) && _.isUndefined(resources[0]["font-weight"]) === false) {
          variantItem.fontWeight = resources[0]["font-weight"];
        }

        if (_.isUndefined(variantItem.local) && _.isUndefined(resources[0].localName) === false) {
          variantItem.local = resources[0].localName;
        }

        // successfully added type of variant, callback...
        requestCB(null);

      });

    }, function(err) {
      if (err) {
        variantCB('A font css request failed: ' + err);
      } else {

        // push complete variantItem to urlStore's variants
        tmpUrlStoreObject.variants.push(variantItem);

        variantCB();
      }
    });

  }, function(err) {
    if (err) {
      console.log(err);
    } else {
      // console.log("All variants processed.");
      // return the processed urlStoreObject...
      callback(tmpUrlStoreObject);
    }
  });
}

module.exports = fetchUrls;