import * as Bluebird from "bluebird";
import * as fs from "fs";
import * as JSZip from "jszip";
import * as _ from "lodash";
import * as path from "path";
import { finished } from "stream/promises";
import { config } from "../config";
import { asyncRetry } from "../utils/asyncRetry";
import { IVariantItem } from "./fetchFontURLs";
import { Readable } from "stream";
import axios from "axios";

const RETRIES = 2;
const REQUEST_TIMEOUT_MS = 6000;

export interface IFontSubsetArchive {
  zipPath: string; // absolute path to the zip file
  files: IFontFile[];
}

export interface IFontFile {
  variant: string;
  format: string;
  path: string; // relative path within the zip file
}

export async function fetchFontSubsetArchive(
  fontID: string,
  fontVersion: string,
  subsets: string[],
  variants: IVariantItem[]
): Promise<IFontSubsetArchive> {
  const subsetFontArchive: IFontSubsetArchive = {
    zipPath: path.join(config.CACHE_DIR, `/${fontID}-${fontVersion}-${subsets.join("_")}.zip`),
    files: [],
  };

  const archive = new JSZip();

  const streams: (Readable | fs.WriteStream)[] = _.compact(
    _.flatten(
      await Bluebird.map(variants, (variant) => {
        return Bluebird.map(variant.urls, async (variantUrl) => {
          const filename = `${fontID}-${fontVersion}-${subsets.join("_")}-${variant.id}.${variantUrl.format}`;

          // download the file for type (filename now known)
          let readable: Readable;
          try {
            // console.log("fetchFontSubsetArchive...", variantUrl.format, filename, variantUrl.url);
            readable = await fetchFontSubsetArchiveStream(variantUrl.url);
            archive.file(filename, readable);
          } catch (e) {
            // if a specific format does not work, silently discard it.
            console.error("fetchFontSubsetArchive discarding", variantUrl.format, filename, variantUrl.url, e);
            return null;
          }

          subsetFontArchive.files.push({
            variant: variant.id, // variants and format are used to filter them out later!
            format: variantUrl.format,
            path: filename,
          });

          return readable;
        });
      })
    )
  );

  const target = fs.createWriteStream(subsetFontArchive.zipPath);
  streams.push(target);

  console.info(`fetchFontSubsetArchive create archive... file=${subsetFontArchive.zipPath}`);

  try {
    await finished(archive.generateNodeStream({
      compression: "DEFLATE",
    }).pipe(target));

    console.info(`fetchFontSubsetArchive create archive done! file=${subsetFontArchive.zipPath}`);
  } catch (e) {
    console.error("fetchFontSubsetArchive archive.generateNodeStream pipe failed", e);
    // ensure all fs streams into the archive and the actual zip file are destroyed
    _.each(streams, (stream, index) => {
      try {
        console.warn(`fetchFontSubsetArchive archive.generateNodeStream destroy stream ${index}/${streams.length}...`)
        stream.destroy();
      } catch (err) {
        console.error("fetchFontSubsetArchive archive.generateNodeStream pipe failed, stream.destroy failed (caught)", fontID, subsets, err);
      }
    });

    console.error("fetchFontSubsetArchive archive.generateNodeStream pipe failed, streams destroyed. Rethrowing err...", fontID, subsets, e);
    throw e;
  }

  return subsetFontArchive;
}

async function fetchFontSubsetArchiveStream(url: string): Promise<Readable> {
  return asyncRetry<Readable>(
    async () => {

      const res = await axios.get<Readable>(url, {
        timeout: REQUEST_TIMEOUT_MS,
        responseType: "stream",
        maxRedirects: 0 // https://github.com/axios/axios/issues/2610
      });

      return res.data;

    },
    { retries: RETRIES }
  );
}
