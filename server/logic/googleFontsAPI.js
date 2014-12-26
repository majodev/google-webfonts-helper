var _ = require('lodash');
var https = require('https');
var getSlug = require('speakingurl');

var GOOGLE_FONTS_API_KEY = 'AIzaSyDY-C-Lt9uyPP5fSTjMCR4bB944SlI4spw';

// build up fonts cache via google API...
var getFontsToDownload = _.once(function(googleAPIFontItems, cachedFonts, cb) {
  var req = https.request({
    hostname: "www.googleapis.com",
    method: 'GET',
    port: 443,
    path: '/webfonts/v1/webfonts?key=' + GOOGLE_FONTS_API_KEY,
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
      _.each(googleAPIFontItems, function(item) {

        cachedFonts.push({
          id: getSlug(item.family),
          family: item.family,
          variants: item.variants,
          subsets: item.subsets,
          category: item.category,
          version: item.version,
          lastModified: item.lastModified
        });

      });

      cb(cachedFonts);

    });

  });

  req.on('error', function(e) {
    console.error('problem with request: ' + e.message);
    throw (e);
  });

  req.end();

});

module.exports = getFontsToDownload;