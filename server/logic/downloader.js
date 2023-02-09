var _ = require('lodash');
var async = require('async');
var fs = require('fs');
var https = require('https');
var stream = require('stream');

var conf = require('./conf');
var debug = require('debug')('gwfh:downloader');

function downloadFontFiles(fontItem, cb) {

  var filePaths = [];

  async.each(fontItem.variants, function (variantItem, variantCB) {
    async.each(_.keys(conf.USER_AGENTS), function (formatKey, typeCB) {

      var filename = conf.CACHE_DIR + fontItem.id + "-" + fontItem.version + "-" + fontItem.storeID + "-" + variantItem.id + "." + formatKey;

      if (!variantItem[formatKey]) {
        // font format is not available for download...
        console.error("downloadFontFiles", filename, "format not available for download", formatKey);
        typeCB(new Error(`${filename} not available to download`)); // non available format for variant
        return;
      }

      // download the file for type (filename now known)
      downloadFile(variantItem[formatKey], filename, formatKey, function (err) {

        if (!_.isNil(err)) {
          console.error("downloadFontFiles", filename, "format failed to download", formatKey, err.message);
          typeCB(err); // non available format for variant
          return;
        }

        filePaths.push({
          variant: variantItem.id, // variants and format are used to filter them out later!
          format: formatKey,
          path: filename
        });
        typeCB();
      });

    }, function (err) {
      if (err) {
        variantCB(err);
      } else {
        variantCB();
      }
    });
  }, function (err) {
    if (err) {
      debug("downloadFontFiles family failed: " + fontItem.id + " err: ", err);
      cb(err, filePaths);
    } else {
      debug("downloadFontFiles family downloaded");
      cb(null, filePaths);
    }
  });

}

function downloadFile(url, dest, formatKey, cb) {
  debug("downloadFile starting", url, formatKey, dest);
  https.get(url, function (response) {
    debug("downloadFile received", url, formatKey, dest, response.statusCode, response.headers['content-type']);

    if (response.statusCode !== 200) {
      cb(new Error(`${url} downloadFile request failed. status code: ${response.statusCode}`));
      response.resume(); // Consume response data to free up memory
      return;
    }

    if (_.isEmpty(response.headers['content-type'])
      || response.headers['content-type'].indexOf(formatKey) === -1) {
      cb(new Error(`${url} downloadFile request failed. expected ${formatKey} to be in content-type header: ${response.headers['content-type']}`));
      response.resume(); // Consume response data to free up memory
      return;
    }

    var file = fs.createWriteStream(dest);
    stream.pipeline(response, file, function (err) {
      if (err) {
        console.error(`downloadFile ${url}: error while piping response to the file writeStream ${dest}`, err);
        cb(err);
        return;
      }
      debug("downloadFile written", url, formatKey, dest);
      cb();
    });
  });
}

module.exports = downloadFontFiles;
