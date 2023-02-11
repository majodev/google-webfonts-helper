import * as _ from "lodash";
import { Readable } from "stream";
import { finished } from "stream/promises";
import * as fs from "fs";
import { config } from "../config";
import * as debugPkg from "debug"
import { IFullFontItem } from "./font";
import * as Bluebird from "bluebird";

const debug = debugPkg('gwfh:downloader');

export interface IFontFilePath {
  variant: string;
  format: string;
  path: string;
}

export async function downloadFontFiles(fontItem: IFullFontItem): Promise<IFontFilePath[]> {

  const filePaths: IFontFilePath[] = [];

  await Bluebird.map(fontItem.variants, async (variantItem) => {
    await Bluebird.map(_.keys(config.USER_AGENTS), async (formatKey) => {
      const filename = config.CACHE_DIR + fontItem.id + "-" + fontItem.version + "-" + fontItem.storeID + "-" + variantItem.id + "." + formatKey;

      if (!variantItem[formatKey]) {
        // font format is not available for download...
        console.error("downloadFontFiles", filename, "format not available for download", formatKey);
        return;
      }

      // download the file for type (filename now known)
      try {
        await downloadFile(variantItem[formatKey], filename, formatKey);
      } catch (e) {
        // if a specific format does not work, silently discard it.

        console.error("downloadFontFiles discarding", fontItem.id, fontItem.storeID, variantItem[formatKey], formatKey, filename, e);
        return;
      }

      filePaths.push({
        variant: variantItem.id, // variants and format are used to filter them out later!
        format: formatKey,
        path: filename
      });

    });
  });

  return filePaths;

}

async function downloadFile(url: string, dest: string, formatKey: string) {
  debug("downloadFile starting", url, formatKey, dest);

  const response = await fetch(url);

  debug("downloadFile received", url, formatKey, dest, response.status, response.headers['content-type']);

  if (response.status !== 200) {
    throw new Error(`${url} downloadFile request failed. status code: ${response.status}`);
  }

  if (_.isEmpty(response.headers.get('content-type'))
    || response.headers.get('content-type').indexOf(formatKey) === -1) {
    throw new Error(`${url} downloadFile request failed. expected ${formatKey} to be in content-type header: ${response.headers.get('content-type')}`);
  }

  const stream = fs.createWriteStream(dest);
  // TODO typing mismatch ReadableStream<any> vs ReadableStream<Uint8Array>
  await finished(Readable.fromWeb((<any>response.body)).pipe(stream));
}
