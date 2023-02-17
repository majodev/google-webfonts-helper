import * as _ from "lodash";
import * as mkdirp from "mkdirp";
import { IFontItem } from "./font";
import { fetchGoogleFonts } from "./fetchGoogleFonts";
import { getSubsets, ISubsetMap, IFontSubsetMap } from "./subsetGen";
import { config } from "../config";
import * as debugPkg from "debug";
import { IFontURLStore } from "./fetchFontURLs";
import { IFontFilePath } from "./fetchFontFiles";

const debug = debugPkg('gwfh:store');
let storedFonts: IFontItem[];

interface ISubsetStore {
  [fontID: string]: IFontSubsetMap;
}

let subsetStore: ISubsetStore;

const fontUrlStores: {
  fontID: string;
  store: IFontURLStore;
}[] = [];

interface IFileStore {
  [fileStoreID: string]: IFileStoreItem;
}

export interface IFileStoreItem {
  files: IFontFilePath[];
  zippedFilename: string;
}

// fileStore holds arrays of local paths to font files, id = fontItem.id + "-" + fontItem.storeID
const fileStore: IFileStore = {};

export async function initStore() {
  await mkdirp(config.CACHE_DIR);

  storedFonts = await fetchGoogleFonts();
  subsetStore = _.reduce(storedFonts, (sum, item) => {
    const subsets = getSubsets(item.subsets);
    sum[item.id] = subsets;
    return sum;
  }, <ISubsetStore>{});

  debug("initStore: fonts cached and subsets initialized");

};

export function getStoredFontItemById(fontID: string): IFontItem | null {

  const font = _.find(storedFonts, { id: fontID });
  if (_.isNil(font)) {
    return null;
  }

  return font;
}

export function getStoredFontItems(): IFontItem[] {
  return storedFonts;
}

export function getStoreID(font: IFontItem, subsets: string[] | null): string | null {
  const fontSubsetStore = subsetStore[font.id];

  if (_.isNil(fontSubsetStore)) {
    debug("fontSubsetStore for " + font.id + " not found!");
    return null;
  }

  const fontSubsetKey = _.findKey(fontSubsetStore, getFilterObject(font, subsets));

  if (_.isNil(fontSubsetKey)) {
    debug("fontSubsetKey for " + font.id + " subset " + subsets + " not found!");
    return null;
  }

  return fontSubsetKey;
}

export function getSubsetMap(fontID: string, storeID: string): ISubsetMap {
  return subsetStore[fontID][storeID];
}

export function saveFontUrlStore(fontID: string, fontUrlStore: IFontURLStore) {

  // console.log("save:", fontID, fontUrlStore.storeID);

  const existing = _.find(fontUrlStores, (previousStore) => {
    return previousStore.fontID === fontID && previousStore.store.storeID === fontUrlStore.storeID
  });

  if (existing) {
    console.warn("saveFontUrlStore: duplicate save of fontID: ", fontID, "storeID:", fontUrlStore.storeID);
    if (config.ENV === "test") {
      throw new Error("saveFontUrlStore duplicate write");
    }
    return;
  }

  fontUrlStores.push({
    fontID,
    store: fontUrlStore
  });
}

export function getFontUrlStore(font: IFontItem, subsets: string[] | null): IFontURLStore | null {
  const storeID = getStoreID(font, subsets);

  const store = _.find(fontUrlStores, (fontUrlStore) => {
    return fontUrlStore.fontID === font.id && fontUrlStore.store.storeID === storeID
  })

  if (!store) {
    return null;
  }

  return store.store;
}

function getFilterObject(font: IFontItem, subsets: string[] | null): ISubsetMap {
  if (!_.isArray(subsets) || subsets.length === 0) {
    // supply filter with the default subset as defined in googleFontsAPI fetcher (latin or if no found other)
    return _.reduce(font.subsets, (sum, subsetItem) => {
      sum[subsetItem] = (subsetItem === font.defSubset);
      return sum;
    }, {} as ISubsetMap);
  }

  return _.reduce(font.subsets, (sum, subsetItem) => {
    sum[subsetItem] = _.includes(subsets, subsetItem);
    return sum;
  }, {} as ISubsetMap);
}

export function getFileStore(fontID: string, storeID: string) {
  const fileStoreID = fontID + "-" + storeID; // unique identifier in filestore.
  return fileStore[fileStoreID];
}

export function saveFileStoreItem(fontID: string, storeID: string, fileStoreItem: IFileStoreItem) {
  const fileStoreID = fontID + "-" + storeID; // unique identifier in filestore.

  const existing = fileStore[fileStoreID];

  if (!_.isNil(existing)) {
    console.warn("saveFileStoreItem: duplicate save of fileStoreID: ", fileStoreID, "existing:", existing, "discarded:", fileStoreItem);
    if (config.ENV === "test") {
      throw new Error("saveFileStoreItem duplicate write");
    }
    return;
  }

  fileStore[fileStoreID] = fileStoreItem;
}

export function getFileStoreLengthIds() {
  return _.keys(fileStore).length;
}

export function getFileStoreTrackedFiles() {
  return _.sumBy(_.values(fileStore), function (f) { return (f.files) ? f.files.length : 0; });
}
