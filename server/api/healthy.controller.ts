import { NextFunction, Request, Response } from "express";
import { getStats } from "../logic/store";

// /-/healthy
export async function getHealthy(req: Request, res: Response<string>, next: NextFunction) {
  try {
    const { fontMap, urlMap, fileMap, files, urls } = getStats();

    res.type("text/plain");

    return res.send(`${fontMap} fonts available.
${urlMap} unique subsets loaded (${urls} URLs), ${fileMap} subsets fetched (${files} files).`);
  } catch (e) {
    next(e);
  }
}
