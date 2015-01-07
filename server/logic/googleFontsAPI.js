var _ = require('lodash');
var https = require('https');
var getSlug = require('speakingurl');

var conf = require('./conf');

// build up fonts cache via google API...
var getFontsToDownload = _.once(function(googleAPIFontItems, cachedFonts, cb) {
  var req = https.request({
    hostname: "www.googleapis.com",
    method: 'GET',
    port: 443,
    path: '/webfonts/v1/webfonts?sort=popularity&key=' + conf.GOOGLE_FONTS_API_KEY,
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

        // console.log(index + " - " + item.family);

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
    console.error('problem with request: ' + e.message);
    throw (e);
  });

  req.end();

});

module.exports = getFontsToDownload;