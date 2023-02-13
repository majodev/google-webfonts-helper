import * as _ from "lodash";
import * as stream from "stream";
import { Request, Response, NextFunction } from "express";
import * as debugPkg from "debug";
import { getDownload, getFullFontItem, getFontItems } from "../logic/core";

const debug = debugPkg('gwfh:fonts:controller');

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

    const fonts = getFontItems();

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
        defVariant: font.defVariant
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
  }
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
    const subsetsArr = _.isString(req.query.subsets) ? _.without(req.query.subsets.split(/[,]+/), '') : null;
    const variantsArr = _.isString(req.query.variants) ? _.without(req.query.variants.split(/[,]+/), '') : null;
    const formatsArr = _.isString(req.query.formats) ? _.without(req.query.formats.split(/[,]+/), '') : null;

    if (req.query.download === "zip") {
      const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
      const zipStream = await getDownload(req.params.id, subsetsArr, variantsArr, formatsArr);

      if (_.isNil(zipStream)) {
        // files not found.
        return res.status(404)
          .send('Not found');
      }

      // Tell the browser that this is a zip file.
      res.writeHead(200, {
        'Content-Type': 'application/zip',
        'Content-disposition': 'attachment; filename=' + zipStream.filename
      });

      return stream.pipeline(zipStream.stream, res, function (err) {
        if (err) {
          debug(`${url}: error while piping archive to the response stream`, err);
        }
      });

    }

    const fullFontItem = await getFullFontItem(req.params.id, subsetsArr);

    if (fullFontItem === null) {
      return res.status(404).send('Not found');
    }

    const apiFont: IAPIFont = {
      id: fullFontItem.id,
      family: fullFontItem.family,
      subsets: fullFontItem.subsets,
      category: fullFontItem.category,
      version: fullFontItem.version,
      lastModified: fullFontItem.lastModified,
      popularity: fullFontItem.popularity,
      defSubset: fullFontItem.defSubset,
      defVariant: fullFontItem.defVariant,
      subsetMap: fullFontItem.subsetMap,
      storeID: fullFontItem.storeID,
      variants: fullFontItem.variants
    };

    return res.json(apiFont);
  } catch (e) {
    next(e);
  }
}
