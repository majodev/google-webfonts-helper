import * as fs from "fs";
import * as JSZip from "jszip";
import * as _ from "lodash";
import * as path from "path";

export function zip(filePaths: string[]) {
  const archive = new JSZip();

  _.each(filePaths, function (filePath) {
    archive.file(path.basename(filePath), fs.createReadStream(filePath))
  });

  return archive.generateNodeStream({
    streamFiles: true,
    compression: 'DEFLATE'
  });
}