import * as _ from "lodash";
import { Request, Response, NextFunction } from "express";
import { getStoredFilePathsLength, getStoredFilePathsFilesLength, getStoredFontItems } from "../logic/store";

// /-/healthy
export async function getHealthy(req: Request, res: Response<string>, next: NextFunction) {
  try {
    res.type('text/plain');
    return res.send(`${getStoredFontItems().length} fonts.
Cached ${getStoredFilePathsLength()} variants, ${getStoredFilePathsFilesLength()} files.`);
  } catch (e) {
    next(e);
  }
}