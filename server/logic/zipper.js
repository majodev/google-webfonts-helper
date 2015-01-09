var fs = require('fs');
var archiver = require('archiver');
var _ = require('lodash');

var conf = require('./conf');

function zip(fontItem, filePaths, cb) {

  var filename = conf.CACHE_DIR + fontItem.id + "-" + fontItem.version + "-" + fontItem.storeID + '.zip';

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
      name: path.replace(conf.CACHE_DIR, '')
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