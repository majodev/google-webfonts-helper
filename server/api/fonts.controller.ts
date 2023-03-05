import { NextFunction, Request, Response } from "express";
import * as fs from "fs";
import * as JSZip from "jszip";
import * as _ from "lodash";
import * as path from "path";
import * as stream from "stream";
import { IUserAgents } from "../config";
import { loadFontBundle, loadFontFilePaths, loadFontItems, loadSubsetMap, loadVariantItems } from "../logic/core";

// Get list of fonts
// /api/fonts
interface IAPIListFont {
  id: string;
  family: string;
  variants: string[];
  subsets: string[];
  category: string;
  version: string;
  lastModified: string; // e.g. 2022-09-22
  popularity: number;
  defSubset: string;
  defVariant: string;
}
export async function getApiFonts(req: Request, res: Response<IAPIListFont[]>, next: NextFunction) {
  try {
    const fonts = loadFontItems();

    const apiListFonts: IAPIListFont[] = _.map(fonts, (font) => {
      return {
        id: font.id,
        family: font.family,
        variants: font.variants,
        subsets: font.subsets,
        category: font.category,
        version: font.version,
        lastModified: font.lastModified,
        popularity: font.popularity,
        defSubset: font.defSubset,
        defVariant: font.defVariant,
      };
    });

    return res.json(apiListFonts);
  } catch (e) {
    next(e);
  }
}

// Get specific fonts (fixed charsets) including links
// /api/fonts/:id
interface IAPIFont {
  id: string;
  family: string;
  subsets: string[];
  category: string;
  version: string;
  lastModified: string; // e.g. 2022-09-22
  popularity: number;
  defSubset: string;
  defVariant: string;
  subsetMap: {
    [subset: string]: boolean;
  };
  storeID: string;
  variants: {
    id: string;
    fontFamily: string | null;
    fontStyle: string | null;
    fontWeight: string | null;
    eot?: string;
    woff?: string;
    woff2?: string;
    svg?: string;
    ttf?: string;
  }[];
}
export async function getApiFontsById(req: Request, res: Response<IAPIFont | string | NodeJS.WritableStream>, next: NextFunction) {
  try {
    // get the subset string if it was supplied...
    // e.g. "subset=latin,latin-ext," will be transformed into ["latin","latin-ext"] (non whitespace arrays)
    const subsets = _.isString(req.query.subsets) ? _.without(req.query.subsets.split(/[,]+/), "") : null;

    const fontBundle = await loadFontBundle(req.params.id, subsets);

    if (_.isNil(fontBundle)) {
      return res.status(404).send("Not found");
    }

    const subsetMap = loadSubsetMap(fontBundle);
    const variantItems = await loadVariantItems(fontBundle);

    if (_.isNil(variantItems)) {
      return res.status(404).send("Not found");
    }

    // default case: json serialize...
    if (req.query.download !== "zip") {
      const { font } = fontBundle;

      const apiFont: IAPIFont = {
        id: font.id,
        family: font.family,
        subsets: font.subsets,
        category: font.category,
        version: font.version,
        lastModified: font.lastModified,
        popularity: font.popularity,
        defSubset: font.defSubset,
        defVariant: font.defVariant,
        subsetMap: subsetMap,
        // be compatible with legacy storeIDs, without binding on our new convention.
        storeID: fontBundle.subsets.join("_"),
        variants: _.map(variantItems, (variant) => {
          return {
            id: variant.id,
            fontFamily: variant.fontFamily,
            fontStyle: variant.fontStyle,
            fontWeight: variant.fontWeight,
            ..._.reduce(
              variant.urls,
              (sum, vurl) => {
                sum[vurl.format] = vurl.url;
                return sum;
              },
              {} as IUserAgents
            ),
          };
        }),
      };

      return res.json(apiFont);
    }

    // otherwise: download as zip
    const variants = _.isString(req.query.variants) ? _.without(req.query.variants.split(/[,]+/), "") : null;
    const formats = _.isString(req.query.formats) ? _.without(req.query.formats.split(/[,]+/), "") : null;

    const subsetFontArchive = await loadFontFilePaths(fontBundle, variantItems);

    const filteredFiles = _.filter(subsetFontArchive.paths, (file) => {
      return (_.isNil(variants) || _.includes(variants, file.variant)) && (_.isNil(formats) || _.includes(formats, file.format));
    });

    if (filteredFiles.length === 0) {
      return res.status(404).send("Not found");
    }

    // we build a new .zip from the existing cached .zip, filtered by the requested variants and formats.
    const archive = await new JSZip.external.Promise(function (resolve, reject) {
      fs.readFile(subsetFontArchive.zippedFileName, function (err, data) {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    }).then(function (data: unknown) {
      return JSZip.loadAsync(<Buffer>data);
    });

    _.each(subsetFontArchive.paths, function (fontFilePath) {
      const includeInArchive =
        (_.isNil(variants) || _.includes(variants, fontFilePath.variant)) && (_.isNil(formats) || _.includes(formats, fontFilePath.format));

      if (!includeInArchive) {
        archive.remove(path.basename(fontFilePath.path));
      }
    });

    // Tell the browser that this is a zip file.
    res.writeHead(200, {
      "Content-Type": "application/zip",
      "Content-disposition": `attachment; filename=${path.basename(subsetFontArchive.zippedFileName)}`,
    });

    const zipStream = archive.generateNodeStream({
      // streamFiles: true,
      compression: "DEFLATE"
    });
    

    return stream.pipeline(zipStream, res, function (err) {
      if (err) {
        // noop, client cancelled.
      }
    });
  } catch (e) {
    next(e);
  }
}
