var _ = require('lodash');
var async = require('async');
var fs = require('fs');
var https = require('https');
var mkdirp = require('mkdirp');

var conf = require('./conf');

function downloadFontFiles(fontItem, cb) {

  var filePaths = [];

  mkdirp(conf.CACHE_DIR, function(err) {
    if (err) {
      throw new Error("unable to create CACHE directory!" + err);
    } else {
      async.each(fontItem.variants, function(variantItem, variantCB) {
        async.each(conf.FONT_FORMATS, function(formatKey, typeCB) {

          var filename = conf.CACHE_DIR + fontItem.id + "-" + variantItem.id + "." + formatKey;

          if (formatKey === "woff2") {
            // woff2 has multiple files
            async.each(variantItem.woff2, function(woff2item, woff2CB) {
              var woff2Filename = conf.CACHE_DIR + fontItem.id + "-" + variantItem.id + "-" + woff2item.subset + "." + formatKey;
              downloadFile(woff2item.url, woff2Filename, function() {
                filePaths.push(woff2Filename);
                woff2CB();
              });
            }, function(err) {
              if (err) {
                typeCB("woff2 failed! err: " + err);
              } else {
                typeCB();
              }
            });

          } else {
            downloadFile(variantItem[formatKey], filename, function() {
              filePaths.push(filename);
              typeCB();
            });
          }

        }, function(err) {
          if (err) {
            variantCB('variant failed: ' + variantItem.id + " err: " + err);
          } else {
            variantCB();
          }
        });
      }, function(err) {
        if (err) {
          console.error("family failed: " + fontItem.id + " err: " + err);
          throw new Error("family failed: " + fontItem.id + " err: " + err);
        } else {
          // console.log("family downloaded");
          cb(filePaths);
        }
      });
    }
  });

}

function downloadFile(url, dest, cb) {
  var file = fs.createWriteStream(dest);
  var req = https.get(url, function(response) {
    response.pipe(file);
    file.on('finish', function() {
      file.close(cb);
    });
  });

  req.on('error', function(e) {
    console.log('problem with request: ' + e.message);
  });

  req.end();

}

module.exports = downloadFontFiles;