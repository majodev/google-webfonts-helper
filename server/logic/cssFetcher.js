var css = require('css');
var _ = require('lodash');
var http = require('http');

var debug = require('debug')('gwfh:cssFetcher');

function parseRemoteCSS(remoteCSS, type, callback) {
  var parsedCSS;

  try {
    parsedCSS = css.parse(remoteCSS);
  } catch (e) {
    console.error("CSS couldn't be parsed:" + type);
    // console.error(e);
    callback("CSS couldn't be parsed:" + type + " error:" + e, []);
    return;
  }


  var resources = [];

  _.each(parsedCSS.stylesheet.rules, function(rule) {

    var resource = {};
    var localNames;

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

    debug(type);
    debug(resource);

    try {

      // extract the url
      if (type === "svg") {
        resource._extracted.url = resource.src.match("http:\\/\\/[^\\)]+")[0];
      } else {
        resource._extracted.url = resource.src.match("http:\\/\\/[^\\)]+\\." + type)[0];
      }

      debug(resource._extracted.url);

      // get both local names via regex
      localNames = resource.src.split(/local\(\'(.*?)\'\)/g);
      if (localNames.length >= 3) {
        resource.localName = [];
        resource.localName.push(localNames[1]);
        if (localNames.length >= 5) {
          resource.localName.push(localNames[3]);
        }
      }

      // push the current rule (= resource) to the resources array
      resources.push(resource);

    } catch (e) {
      console.error("cannot load resource of type " + type);
    }

  });

  callback(null, resources);
}

function fetchCSS(family, cssSubsetString, type, userAgent, callback) {

  debug("fonts.googleapis.com" + '/css?family=' + encodeURIComponent(family) + '&subset=' + cssSubsetString);

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
