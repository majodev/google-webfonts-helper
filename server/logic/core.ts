import * as _ from "lodash";
import { fetchFontFiles, IFontFilePath } from "./fetchFontFiles";
import { fetchFontURLs, IVariantItem } from "./fetchFontURLs";
import { synchronizedBy } from "../utils/synchronized";
import { IFontItem } from "./fetchGoogleFonts";
import { getFontBundle, getStoredFontFilePaths, getStoredFontItems, getStoredVariantItems, IFontBundle, storeFontFilePaths, storeVariantItems } from "./store";

export function loadFontItems(): IFontItem[] {
  return getStoredFontItems();
}

export function loadFontBundle(fontID: string, subsets: string[] | null): IFontBundle | null {
  return getFontBundle(fontID, subsets);
}

export async function loadVariantItems(fontBundle: IFontBundle): Promise<IVariantItem[] | null> {
  return _loadVariantItems(fontBundle.storeID, fontBundle);
}
const _loadVariantItems = synchronizedBy(async function (fontBundle: IFontBundle): Promise<IVariantItem[] | null> {

  const storedVariantItems = getStoredVariantItems(fontBundle);

  if (!_.isNil(storedVariantItems)) {
    return storedVariantItems;
  }

  const { storeID, font, subsets } = fontBundle;
  const variantItems = await fetchFontURLs(font.family, font.variants, subsets);

  if (variantItems === null) {
    console.error('urlStoreObject resolved null for ' + storeID);
    return null;
  }

  // SIDE-EFFECT!
  storeVariantItems(fontBundle, variantItems);

  return variantItems;
});

export async function loadFontFilePaths(fontBundle: IFontBundle, variants: IVariantItem[]): Promise<IFontFilePath[]> {
  return _loadFontFilePaths(fontBundle.storeID, fontBundle, variants);
}
const _loadFontFilePaths = synchronizedBy(async function (fontBundle: IFontBundle, variants: IVariantItem[]): Promise<IFontFilePath[]> {
  const storedFontFilePaths = getStoredFontFilePaths(fontBundle);

  if (!_.isNil(storedFontFilePaths)) {
    return storedFontFilePaths;
  }

  const fontFilePaths = await fetchFontFiles(fontBundle.font.id, fontBundle.font.version, variants);

  if (fontFilePaths.length === 0) {
    throw new Error(`No local paths received for ${fontBundle.font.id}, ${fontBundle.storeID}`);
  }

  // SIDE-EFFECT!
  storeFontFilePaths(fontBundle, fontFilePaths);

  return fontFilePaths;
});
export interface ISubsetMap {
  [subset: string]: boolean;
}

export function loadSubsetMap(fontBundle: IFontBundle): ISubsetMap {
  return _.reduce(fontBundle.font.subsets, (sum, subset) => {
    sum[subset] = _.includes(fontBundle.subsets, subset);
    return sum;
  }, {} as ISubsetMap);
}

