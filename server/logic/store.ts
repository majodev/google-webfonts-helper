import { mkdir } from "fs/promises";
import * as _ from "lodash";
import { config } from "../config";
import { IFontSubsetArchive } from "./fetchFontSubsetArchive";
import { IVariantItem } from "./fetchFontURLs";
import { fetchGoogleFonts, IFontItem } from "./fetchGoogleFonts";

// FontBundle holds:
// * the found stored font from google,
// * the requested (and found) subsets and
// * the unique storeID to access Maps in the store.
// It should be used as the sole way to interact with the store and must be build via store.getFontBundle
export interface IFontBundle {
  storeID: string;
  subsets: string[];
  font: IFontItem;
}

const fontMap = new Map<string, IFontItem>();
const urlMap = new Map<string, IVariantItem[]>();
const archiveMap = new Map<string, IFontSubsetArchive>();

export async function initStore() {
  await mkdir(config.CACHE_DIR, { recursive: true });

  _.each(await fetchGoogleFonts(), (font: IFontItem) => {
    fontMap.set(font.id, font);
  });
}

export async function reinitStore() {
  if (config.ENV !== "test") {
    console.warn("reinitStore was called, building fresh stores...");
  }

  fontMap.clear();
  urlMap.clear();
  archiveMap.clear();

  return initStore();
}

export function getStoredFontItems(): IFontItem[] {
  return Array.from(fontMap.values());
}

export function getFontBundle(fontID: string, wantedSubsets: string[] | null): IFontBundle | null {
  const font = fontMap.get(fontID);

  if (_.isNil(font)) {
    return null;
  }

  const match =
    !_.isArray(wantedSubsets) || wantedSubsets.length === 0
      ? [font.defSubset] // supply filter with the default subset as defined in googleFontsAPI fetcher (latin or if no found other)
      : _.intersection(font.subsets, wantedSubsets);

  const subsets = _.sortBy(_.uniq(match));

  if (subsets.length === 0) {
    return null;
  }

  return {
    // not this must be a stable key fully identifying the font, its version and wantedSubsets
    storeID: `${font.id}@${font.version}__${subsets.join("_")}`,
    subsets,
    font,
  };
}

export function getStoredVariantItems({ storeID }: IFontBundle): IVariantItem[] | null {
  const variants = urlMap.get(storeID);
  if (_.isNil(variants)) {
    return null;
  }
  return variants;
}

export function getStoredFontSubsetArchive({ storeID }: IFontBundle): IFontSubsetArchive | null {
  const subsetFontArchive = archiveMap.get(storeID);
  if (_.isNil(subsetFontArchive)) {
    return null;
  }
  return subsetFontArchive;
}

export function storeVariantItems({ storeID }: IFontBundle, variants: IVariantItem[]) {
  const existings = urlMap.get(storeID);

  if (!_.isNil(existings)) {
    console.warn("storeVariantItems: duplicate save of storeID: ", storeID);
    if (config.ENV === "test") {
      throw new Error("storeVariantItems duplicate write");
    }
    return;
  }

  urlMap.set(storeID, variants);
}

export function storeFontSubsetArchive({ storeID }: IFontBundle, subsetFontArchive: IFontSubsetArchive) {
  const existings = archiveMap.get(storeID);

  if (!_.isNil(existings)) {
    console.warn("storeFontSubsetArchive: duplicate save of storeID: ", storeID);
    if (config.ENV === "test") {
      throw new Error("storeFontSubsetArchive duplicate write");
    }
    return;
  }

  archiveMap.set(storeID, subsetFontArchive);
}

export function getStats() {
  return {
    fontMap: fontMap.size,
    urlMap: urlMap.size,
    archiveMap: archiveMap.size,
    urls: _.sumBy(Array.from(urlMap.values()), function (f) {
      return f.length;
    }),
    files: _.sumBy(Array.from(archiveMap.values()), function (archive) {
      return archive.files.length;
    }),
  };
}
