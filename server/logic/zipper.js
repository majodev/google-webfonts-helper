var fs = require('fs');
var archiver = require('archiver');
var _ = require('lodash');

var conf = require('./conf');

function zip(filePaths) {
  var archive = archiver('zip');

  archive.on('error', function(err) {
    throw err;
  });

  _.each(filePaths, function(fileItem) {
    archive.append(fs.createReadStream(fileItem.path), {
      name: fileItem.path.replace(conf.CACHE_DIR, '')
    })
  });

  archive.finalize();

  return archive; // this can be piped upon the request...
}

module.exports = zip;