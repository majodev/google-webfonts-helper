var fs = require('fs');
var archiver = require('archiver');
var _ = require('lodash');

var CACHE_DIR = __dirname + "/cachedFonts/";

function zip(fontID, filePaths, cb) {

  var filename = CACHE_DIR + fontID + '.zip';

  var output = fs.createWriteStream(filename);
  var archive = archiver('zip');

  output.on('close', function() {
    // console.log(archive.pointer() + ' total bytes');
    // console.log('archiver has been finalized and the output file descriptor has closed.');

    deleteTmpFonts(filePaths);

    cb(filename);
  });

  archive.on('error', function(err) {
    throw err;
  });

  archive.pipe(output);

  _.each(filePaths, function(path) {
    archive.append(fs.createReadStream(path), {
      name: path.replace(CACHE_DIR, '')
    })
  });

  archive.finalize();
}


function deleteTmpFonts(filePaths) {

  _.each(filePaths, function(filePath) {
    fs.unlink(filePath, function(err) {
      if (err) throw err;
    });
  });

}

module.exports = zip;