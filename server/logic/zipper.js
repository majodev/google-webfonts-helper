var fs = require('fs');
var JSZip = require('jszip');
var _ = require('lodash');

var conf = require('./conf');

function zip(filePaths) {
  var archive = new JSZip();

  _.each(filePaths, function (fileItem) {
    archive.file(fileItem.path.replace(conf.CACHE_DIR, ''), fs.createReadStream(fileItem.path))
  });

  return archive.generateNodeStream({
    streamFiles: true,
    compression: 'DEFLATE'
  }); // this can be piped upon the request...
}

module.exports = zip;