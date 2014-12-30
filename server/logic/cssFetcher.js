var css = require('css');
var _ = require('lodash');
var http = require('http');

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

    if (type === "svg") {
      resource._extracted.url = resource.src.match("http:\\/\\/[^\\)]+")[0];
    // } else if (type === "woff2Subsets") {
    //   resource._extracted.url = resource.src.match("http:\\/\\/[^\\)]+\\." + "woff2")[0];
    } else {
      resource._extracted.url = resource.src.match("http:\\/\\/[^\\)]+\\." + type)[0];
    }

    // get both local names via regex
    var localNames = resource.src.split(/local\(\'(.*?)\'\)/g);
    if (localNames.length >= 3) {
      resource.localName = [];
      resource.localName.push(localNames[1]);
      if (localNames.length >= 5) {
        resource.localName.push(localNames[3]);
      }
    }

    // push the current rule (= resource) to the resources array
    resources.push(resource);

  });

  callback(null, resources);
}

function fetchCSS(family, cssSubsetString, type, userAgent, callback) {
  var req = http.request({
    hostname: "fonts.googleapis.com",
    method: 'GET',
    port: 80,
    path: '/css?family=' + encodeURIComponent(family) + '&subset=' + cssSubsetString,
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
    console.error('problem with request: ' + e.message);

    callback('problem with request: ' + e.message);
  });

  req.end();
}

module.exports = fetchCSS;