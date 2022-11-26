var _ = require('lodash');
var https = require('https');
var getSlug = require('speakingurl');

var conf = require('./conf');

var debug = require('debug')('gwfh:googleFontsAPI');

// build up fonts cache via google API...
var getFontsToDownload = _.once(function (googleAPIFontItems, cachedFonts, cb) {
  
  var hostname = "www.googleapis.com";
  var reqPath = '/webfonts/v1/webfonts?sort=popularity&key=';

  var req = https.request({
    hostname: hostname,
    method: 'GET',
    port: 443,
    path: reqPath + conf.GOOGLE_FONTS_API_KEY,
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

      googleAPIFontItems = JSON.parse(output).items;

      // populate our items
      _.each(googleAPIFontItems, function(item, index) {

        debug(index + " - " + item.family);

        // property order is guranteed --> popularity via index attr.
        cachedFonts.push({
          id: getSlug(item.family),
          family: item.family,
          variants: item.variants,
          subsets: item.subsets,
          category: item.category,
          version: item.version,
          lastModified: item.lastModified,
          popularity: index + 1,
          // use latin per default, else first found font
          defSubset: _.contains(item.subsets, 'latin') ? 'latin' : item.subsets[0],
          defVariant: _.contains(item.variants, 'regular') ? 'regular' : item.variants[0]
        });

      });

      cb(cachedFonts);

    });

  });

  req.on('error', function(e) {
    console.error('Failed to load base google fonts list! Problem with request: ' + e.message + ' tried: ' + hostname + reqPath);
    console.error(e);

    // service would be deadlocked, we can't continue. error exit now.
    console.error("Error: Exit 1")
    process.exit(1);
  });

  req.end();

});

module.exports = getFontsToDownload;
