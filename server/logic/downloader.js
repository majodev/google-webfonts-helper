var _ = require('lodash');
var async = require('async');
var fs = require('fs');
var https = require('https');
var mkdirp = require('mkdirp');

var conf = require('./conf');
var debug = require('debug')('gwfh:downloader');

function downloadFontFiles(fontItem, cb) {

  var filePaths = [];

  mkdirp.sync(conf.CACHE_DIR);

  async.each(fontItem.variants, function (variantItem, variantCB) {
    debug(_.keys(conf.USER_AGENTS));
    async.each(_.keys(conf.USER_AGENTS), function (formatKey, typeCB) {

      var filename = conf.CACHE_DIR + fontItem.id + "-" + fontItem.version + "-" + fontItem.storeID + "-" + variantItem.id + "." + formatKey;

      if (!variantItem[formatKey]) {
        // font format is not available for download...
        console.warn(filename, "format not available for download", formatKey);
        typeCB(); // bailout non available variant, no error.
        return;
      }

      // download the file for type (filename now known)
      downloadFile(variantItem[formatKey], filename, function (err) {

        if (!_.isNil(err)) {
          console.warn(filename, "format failed to download", formatKey, err);
          typeCB(err); // bubble up error, full retry.
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
        variantCB('variant failed: ' + variantItem.id + " err: ", err, "loaded:", filePaths.length, "of:", _.keys(conf.USER_AGENTS).length);
      } else {
        variantCB();
      }
    });
  }, function (err) {
    if (err) {
      console.error("family failed: " + fontItem.id + " err: " + err);
      throw new Error("family failed: " + fontItem.id + " err: " + err);
    } else {
      debug("family downloaded");
      cb(filePaths);
    }
  });

}

function downloadFile(url, dest, cb) {
  debug("downloadFile", url, dest);
  var req = https.get(url, function (response) {
    var file = fs.createWriteStream(dest);
    response.pipe(file);
    file.on('error', function (e) {
      file.destroy();
      cb(e);
    });
    file.on('finish', function () {
      file.close(cb);
    });
  });

  req.on('error', function (e) {
    console.error('problem with request: ' + e.message + " for url: " + url + " dest: " + dest);
    cb(e);
  });

  req.end();
}

module.exports = downloadFontFiles;
