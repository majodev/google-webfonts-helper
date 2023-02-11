import * as _ from "lodash";
import * as stream from "stream";
import { Request, Response, NextFunction } from "express";
import * as debugPkg from "debug";
import { getDownload, getFullFontItem, getFontItems } from "../logic/core";

const debug = debugPkg('gwfh:fonts:controller');

// Get list of fonts
// /api/fonts
export async function getApiFonts(req: Request, res: Response, next: NextFunction) {
  try {
    return res.json(getFontItems());
  } catch (e) {
    next(e);
  }
}

// Get specific fonts including links
// /api/fonts/:id
export async function getApiFontsById(req: Request, res: Response, next: NextFunction) {

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

    return res.json(fullFontItem);
  } catch (e) {
    next(e);
  }
}
