import * as _ from "lodash";
import { Readable } from "stream";
import { finished } from "stream/promises";
import * as fs from "fs";
import { config } from "../config";
import * as debugPkg from "debug"
import * as Bluebird from "bluebird";
import { IFontURLStore } from "./fetchFontURLs";
import { asyncRetry } from "../utils/asyncRetry";

const debug = debugPkg('gwfh:downloader');

export interface IFontFilePath {
  variant: string;
  format: string;
  path: string;
}

const RETRIES = 5;

export async function fetchFontFiles(fontID: string, fontVersion: string, fontURLStore: IFontURLStore): Promise<IFontFilePath[]> {

  const filePaths: IFontFilePath[] = [];

  await Bluebird.map(fontURLStore.variants, async (variant) => {
    await Bluebird.map(variant.urls, async (variantUrl) => {
      const filename = config.CACHE_DIR + fontID + "-" + fontVersion + "-" + fontURLStore.storeID + "-" + variant.id + "." + variantUrl.format;

      // download the file for type (filename now known)
      try {
        await downloadFile(variantUrl.url, filename, variantUrl.format);
      } catch (e) {
        // if a specific format does not work, silently discard it.

        console.error("fetchFontFiles discarding", fontID, fontURLStore.storeID, variantUrl.url, variantUrl.format, filename, e);
        return;
      }

      filePaths.push({
        variant: variant.id, // variants and format are used to filter them out later!
        format: variantUrl.format,
        path: filename
      });

    });
  });

  return filePaths;

}

async function downloadFile(url: string, dest: string, format: string) {
  await asyncRetry(async () => {

    debug("downloadFile starting", url, format, dest);

    const response = await fetch(url);
    const contentType = response.headers.get('content-type');

    debug("downloadFile received", url, format, dest, response.status, contentType);

    if (response.status !== 200) {
      throw new Error(`${url} downloadFile request failed. status code: ${response.status} ${response.statusText}`);
    }

    if (_.isNil(contentType)
      || _.isEmpty(contentType)
      || contentType.indexOf(format) === -1) {
      throw new Error(`${url} downloadFile request failed. expected ${format} to be in content-type header: ${contentType}`);
    }

    const stream = fs.createWriteStream(dest);
    // TODO typing mismatch ReadableStream<any> vs ReadableStream<Uint8Array>
    await finished(Readable.fromWeb((<any>response.body)).pipe(stream));

  }, { retries: RETRIES });

}
