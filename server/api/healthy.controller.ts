import * as _ from "lodash";
import { Request, Response, NextFunction } from "express";
import { getFileStoreLengthIds, getFileStoreTrackedFiles, getStoredFontItems } from "../logic/store";

// /-/healthy
export async function getHealthy(req: Request, res: Response, next: NextFunction) {
    try {
        res.type('text/plain');
        return res.send(`${getStoredFontItems().length} fonts.
Cached ${getFileStoreLengthIds()} variants, ${getFileStoreTrackedFiles()} files.`);
    } catch (e) {
        next(e);
    }
}