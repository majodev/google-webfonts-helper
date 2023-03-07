import * as _ from "lodash";
import { synchronizedBy } from "../utils/synchronized";
import { fetchFontSubsetArchive, IFontSubsetArchive } from "./fetchFontSubsetArchive";
import { fetchFontURLs, IVariantItem } from "./fetchFontURLs";
import { IFontItem } from "./fetchGoogleFonts";
import {
  getFontBundle,
  getStoredFontItems,
  getStoredFontSubsetArchive,
  getStoredVariantItems,
  IFontBundle,
  storeFontSubsetArchive,
  storeVariantItems,
} from "./store";

export function loadFontItems(): IFontItem[] {
  return getStoredFontItems();
}

export function loadFontBundle(fontID: string, subsets: string[] | null): IFontBundle | null {
  return getFontBundle(fontID, subsets);
}

export async function loadVariantItems(fontBundle: IFontBundle): Promise<IVariantItem[] | null> {
  return _loadVariantItems(`loadVariantItems__${fontBundle.storeID}`, fontBundle);
}
const _loadVariantItems = synchronizedBy(async function (fontBundle: IFontBundle): Promise<IVariantItem[] | null> {
  const storedVariantItems = getStoredVariantItems(fontBundle);

  if (!_.isNil(storedVariantItems)) {
    return storedVariantItems;
  }

  const { storeID, font, subsets } = fontBundle;
  const variantItems = await fetchFontURLs(font.family, font.variants, subsets);

  if (variantItems === null) {
    console.error(`loadVariantItems resolved null for storeID=${storeID}`);
    return null;
  }

  // SIDE-EFFECT!
  storeVariantItems(fontBundle, variantItems);

  return variantItems;
});

export async function loadFontSubsetArchive(fontBundle: IFontBundle, variants: IVariantItem[]): Promise<IFontSubsetArchive> {
  return _loadFontSubsetArchive(`loadFontSubsetArchive__${fontBundle.storeID}`, fontBundle, variants);
}
const _loadFontSubsetArchive = synchronizedBy(async function (
  fontBundle: IFontBundle,
  variants: IVariantItem[]
): Promise<IFontSubsetArchive> {
  const storedFontSubsetArchive = getStoredFontSubsetArchive(fontBundle);

  if (!_.isNil(storedFontSubsetArchive)) {
    return storedFontSubsetArchive;
  }

  const fontSubsetArchive = await fetchFontSubsetArchive(fontBundle.font.id, fontBundle.font.version, fontBundle.subsets, variants);

  if (fontSubsetArchive.files.length === 0) {
    throw new Error(`No files received for '${fontBundle.storeID}' font subset archive!`);
  }

  // SIDE-EFFECT!
  storeFontSubsetArchive(fontBundle, fontSubsetArchive);

  return fontSubsetArchive;
});
export interface ISubsetMap {
  [subset: string]: boolean;
}

export function loadSubsetMap(fontBundle: IFontBundle): ISubsetMap {
  return _.reduce(
    fontBundle.font.subsets,
    (sum, subset) => {
      sum[subset] = _.includes(fontBundle.subsets, subset);
      return sum;
    },
    {} as ISubsetMap
  );
}
