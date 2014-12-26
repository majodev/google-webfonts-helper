var _ = require('lodash');
var cssFetcher = require('./cssFetcher');
var async = require('async');

var USER_AGENTS = {
  eot: 'Mozilla/5.0 (compatible; MSIE 8.0; Windows NT 6.1; Trident/4.0)',
  woff: 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:27.0) Gecko/20100101 Firefox/27.0',
  woff2: 'Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML like Gecko) Chrome/38.0.2125.104 Safari/537.36',
  svg: 'Mozilla/4.0 (iPad; CPU OS 4_0_1 like Mac OS X) AppleWebKit/534.46 (KHTML, like Gecko) Version/4.1 Mobile/9A405 Safari/7534.48.3',
  ttf: 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/534.54.16 (KHTML, like Gecko) Version/5.1.4 Safari/534.54.16'
};

function fetchUrls(font, urlStore, callback) {
  async.each(font.variants, function(variant, variantCB) {

    var variantItem = {
      id: variant
    };

    async.each(_.pairs(USER_AGENTS), function(typeAgentPair, requestCB) {

      cssFetcher(font.family + ":" + variant, typeAgentPair[0], typeAgentPair[1], function(err, resources) {
        if (err) {
          requestCB(err);
          return;
        }

        // save the type (woff, eot, svg, ttf, usw...)
        var type = typeAgentPair[0];
        var url = resources[0]._extracted.url;

        // woff2 has multiple urls and unicode-range set - return an array with url, unicodeRange and subset properties
        if (type === "woff2") {

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
              console.error("Cannot produce woff2 entry for " + resources[0]["font-family"] + ", unicode-range missing")
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
        urlStore[font.family].variants.push(variantItem);

        variantCB();
      }
    });

  }, function(err) {
    if (err) {
      console.log(err);
    } else {
      // console.log("All variants processed.");
      callback(_.merge(_.cloneDeep(font), urlStore[font.family]));
    }
  });
}

module.exports = fetchUrls;