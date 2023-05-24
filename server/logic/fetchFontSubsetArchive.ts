import * as Bluebird from "bluebird";
import * as fs from "fs";
import * as JSZip from "jszip";
import * as _ from "lodash";
import * as path from "path";
import { finished } from "stream/promises";
import { config } from "../config";
import { asyncRetry } from "../utils/asyncRetry";
import { IVariantItem } from "./fetchFontURLs";

const RETRIES = 3;

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

  // const streams: (Readable | fs.WriteStream)[] = _.compact(
  //   _.flatten(
  await Bluebird.map(variants, async (variant) => {
    return await Bluebird.map(variant.urls, async (variantUrl) => {
      const filename = `${fontID}-${fontVersion}-${subsets.join("_")}-${variant.id}.${variantUrl.format}`;

      // download the file for type (filename now known)
      let arrayBuffer: ArrayBuffer;
      try {
        console.log("fetchFontSubsetArchive...", fontID, subsets, variantUrl.url, variantUrl.format, filename);
        arrayBuffer = await fetchFontSubsetArchiveStream(variantUrl.url, filename, variantUrl.format);
        archive.file(filename, arrayBuffer);
      } catch (e) {
        // if a specific format does not work, silently discard it.
        console.error("fetchFontSubsetArchive discarding", fontID, subsets, variantUrl.url, variantUrl.format, filename, e);
        return null;
      }

      subsetFontArchive.files.push({
        variant: variant.id, // variants and format are used to filter them out later!
        format: variantUrl.format,
        path: filename,
      });

      // return stream;
    });
  });
  //   )
  // );

  const target = fs.createWriteStream(subsetFontArchive.zipPath);
  // streams.push(target);

  console.info(`fetchFontSubsetArchive create archive... file=${subsetFontArchive.zipPath}`, fontID, subsets);

  try {
    await finished(
      archive
        .generateNodeStream({
          compression: "DEFLATE",
          streamFiles: true,
        })
        .pipe(target)
    );

    console.info(`fetchFontSubsetArchive create archive done! file=${subsetFontArchive.zipPath}`, fontID, subsets);
  } catch (e) {
    console.error("fetchFontSubsetArchive archive.generateNodeStream pipe failed", fontID, subsets, e);
    // ensure all fs streams into the archive and the actual zip file are destroyed
    // _.each(streams, (stream) => {
    //   try {
    //     stream.destroy();
    //   } catch (err) {
    //     console.error("fetchFontSubsetArchive archive.generateNodeStream pipe failed, stream.destroy failed (catched)", fontID, subsets, err);
    //   }
    // });

    // console.error("fetchFontSubsetArchive archive.generateNodeStream pipe failed, streams destroyed. Rethrowing err...", fontID, subsets, e);
    throw e;
  }

  return subsetFontArchive;
}

async function fetchFontSubsetArchiveStream(url: string, dest: string, format: string): Promise<ArrayBuffer> {
  return asyncRetry<ArrayBuffer>(
    async () => {
      const response = await fetch(url);
      const contentType = response.headers.get("content-type");

      if (response.status !== 200) {
        throw new Error(`${url} fetchFontSubsetArchiveStream request failed. status code: ${response.status} ${response.statusText}`);
      }

      if (_.isNil(contentType) || _.isEmpty(contentType) || contentType.indexOf(format) === -1) {
        throw new Error(
          `${url} fetchFontSubsetArchiveStream request failed. expected ${format} to be in content-type header: ${contentType}`
        );
      }

      if (_.isNil(response.body)) {
        throw new Error(`${url} fetchFontSubsetArchiveStream request failed. response.body is null`);
      }

      // hold in mem while creating archive.
      return response.arrayBuffer();

      // // TODO typing mismatch ReadableStream<any> vs ReadableStream<Uint8Array>
      // // eslint-disable-next-line @typescript-eslint/no-explicit-any
      // return Readable.fromWeb(<any>response.body);
    },
    { retries: RETRIES }
  );
}
