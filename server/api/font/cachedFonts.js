var http = require('http');
var https = require('https');
var _ = require('lodash');
var getSlug = require('speakingurl');
var css = require('css');
var async = require('async');

// stores
var googleAPIFontItems = [];
var cachedFonts = [];
var urlStore = {};


var USER_AGENTS = {
  eot: 'Mozilla/5.0 (compatible; MSIE 8.0; Windows NT 6.1; Trident/4.0)',
  woff: 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:27.0) Gecko/20100101 Firefox/27.0',
  woff2: 'Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML like Gecko) Chrome/38.0.2125.104 Safari/537.36',
  svg: 'Mozilla/4.0 (iPad; CPU OS 4_0_1 like Mac OS X) AppleWebKit/534.46 (KHTML, like Gecko) Version/4.1 Mobile/9A405 Safari/7534.48.3',
  ttf: 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/534.54.16 (KHTML, like Gecko) Version/5.1.4 Safari/534.54.16'
};

// STARTUP: build up fonts cache via google API...
(function getFontsToDownload() {
  var req = https.request({
    hostname: "www.googleapis.com",
    method: 'GET',
    port: 443,
    path: '/webfonts/v1/webfonts?key=AIzaSyDY-C-Lt9uyPP5fSTjMCR4bB944SlI4spw',
    headers: {
      'Accept': 'application/json',
    }
  }, function(res) {

    var output = '';

    res.setEncoding('utf8');

    res.on('data', function(chunk) {
      output += chunk;
    });

    res.on('end', function() {

      var id = 1;

      googleAPIFontItems = JSON.parse(output).items;

      // populate our items
      _.each(googleAPIFontItems, function(item) {

        var properVariants = [];
        _.each(item.variants, function (variantID) {
          if(variantID === "regular") {
            properVariants.push("400");
          } else {
            properVariants.push(variantID);
          }
        })

        cachedFonts.push({
          id: getSlug(item.family),
          family: item.family,
          variants: properVariants
        });
        id += 1;
      });

    });

  });

  req.on('error', function(e) {
    console.log('problem with request: ' + e.message);
    throw (e);
  });

  req.end();
}());


function parseRemoteCSS(remoteCSS, type, callback) {
  var parsedCSS = css.parse(remoteCSS);

  var resources = [];

  _.each(parsedCSS.stylesheet.rules, function(rule) {

    var resource = {};

    // only font-face rules are relevant...
    if (rule.type !== "font-face") {
      return;
    }

    // add every property in the css that has to do with a font-face to the resource
    _.each(rule.declarations, function(declaration) {
      resource[declaration.property] = declaration.value;
    });

    // parse the resource (_extracted is hopefully not used as CSS property very often!)
    resource._extracted = {};

    if (type !== "svg") {
      resource._extracted.url = resource.src.match("http:\\/\\/[^\\)]+\\." + type)[0];
    } else {
      resource._extracted.url = resource.src.match("http:\\/\\/[^\\)]+")[0];
    }

    // push the current rule (= resource) to the resources array
    resources.push(resource);

  });

  callback(null, resources);
}

function requestRemoteCSS(family, type, userAgent, callback) {
  var req = http.request({
    hostname: "fonts.googleapis.com",
    method: 'GET',
    port: 80,
    path: '/css?family=' + encodeURIComponent(family),
    headers: {
      'accept': 'text/css,*/*;q=0.1',
      'User-Agent': userAgent
    }
  }, function(res) {

    var output = '';

    res.setEncoding('utf8');
    res.on('data', function(chunk) {
      output += chunk;
    });

    res.on('end', function() {
      parseRemoteCSS(output, type, callback);
    });

  });

  req.on('error', function(e) {
    console.log('problem with request: ' + e.message);

    callback('problem with request: ' + e.message);
  });

  req.end();
}

function getDownloadPaths(font, callback) {

  if (_.isUndefined(urlStore[font.family]) === false) {
    // already cached, return instantly
    callback(_.merge(_.cloneDeep(font), urlStore[font.family]));
    return;
  } else {
    urlStore[font.family] = {};
    urlStore[font.family].variants = [];
  }

  async.each(font.variants, function(variant, variantCB) {

    var variantItem = {
      id: variant
    };

    async.each(_.pairs(USER_AGENTS), function(typeAgentPair, requestCB) {

      requestRemoteCSS(font.family + ":" + variant, typeAgentPair[0], typeAgentPair[1], function(err, resources) {
        if (err) {
          requestCB(err);
          return;
        }

        //urlStore[font.family][variant][typeAgentPair[0]] = resources;
        //urlStore[font.family][variant][typeAgentPair[0]] = resources[0]._extracted.url;
        variantItem[typeAgentPair[0]] = resources[0]._extracted.url;

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
      console.log("All variants processed.");
      callback(_.merge(_.cloneDeep(font), urlStore[font.family]));
    }
  });

}

// -----------------------------------------------------------------------------
// Exports
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
        console.log("POPULATED!");
      } else {
        console.log("waiting for populate....")
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
    console.log("font not found!");
    callback(null);
  }

};