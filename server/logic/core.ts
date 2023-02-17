import * as _ from "lodash";
import * as JSZip from "jszip";
import * as path from "path";
import * as fs from "fs";
import * as debugPkg from "debug";
import { fetchFontFiles } from "./fetchFontFiles";
import { fetchFontURLs, IFontURLStore } from "./fetchFontURLs";
import { IFontItem, IFontBundle } from "./font";
import { getFileStore, getFontUrlStore, getStoredFontItemById, getStoredFontItems, getSubsetMap, getStoreID, IFileStoreItem, saveFileStoreItem, saveFontUrlStore } from "./store";
import { synchronizedBy } from "../utils/synchronized";

const debug = debugPkg('gwfh:core');

async function loadFontBundle(fontID: string, subsets: string[] | null): Promise<IFontBundle | null> {
  const font = getStoredFontItemById(fontID);

  if (_.isNil(font)) {
    return null;
  }

  const storeID = getStoreID(font, subsets);

  if (_.isNil(storeID)) {
    return null;
  }

  const synchronizedCacheKey = `${fontID}_${storeID}`;

  return internalLoadFontBundle(synchronizedCacheKey, font, storeID, subsets);

}
const internalLoadFontBundle = synchronizedBy(_internalLoadFontBundle);
async function _internalLoadFontBundle(font: IFontItem, storeID: string, subsets: string[] | null): Promise<IFontBundle | null> {

  const fontURLStore = getFontUrlStore(font, subsets);

  if (!_.isNil(fontURLStore)) {

    const subsetMap = getSubsetMap(font.id, storeID);

    return {
      font,
      subsetMap,
      fontURLStore
    };
  }

  const fetchedFontUrlStore = await fetchFontURLs(font.family, font.variants, storeID);

  if (fetchedFontUrlStore === null) {
    console.error('urlStoreObject resolved null for font ' + font.id + ' subset ' + storeID);
    return null;
  }

  // SIDE-EFFECT!
  saveFontUrlStore(font.id, fetchedFontUrlStore);

  debug("fetched fontItem for font.id=" + font.id + " storeID=" + storeID);

  const subsetMap = getSubsetMap(font.id, storeID);

  return {
    font,
    subsetMap,
    fontURLStore: fetchedFontUrlStore
  };

}

const loadFileStoreItem = synchronizedBy(_loadFileStoreItem);
async function _loadFileStoreItem(fontID: string, fontVersion: string, fontURLStore: IFontURLStore): Promise<IFileStoreItem> {

  const fontFileStore = getFileStore(fontID, fontURLStore.storeID);

  if (!_.isNil(fontFileStore)) {
    return fontFileStore;
  }

  const localPaths = await fetchFontFiles(fontID, fontVersion, fontURLStore);

  if (localPaths.length === 0) {
    throw new Error(`No local paths received for ${fontID}, ${fontURLStore.storeID}`);
  }

  const fileStoreItem: IFileStoreItem = {
    files: localPaths,
    zippedFilename: fontID + "-" + fontVersion + "-" + fontURLStore.storeID + '.zip'
  }

  // SIDE-EFFECT!
  saveFileStoreItem(fontID, fontURLStore.storeID, fileStoreItem);

  return fileStoreItem;
}

// -----------------------------------------------------------------------------
// Exports for REST API
// -----------------------------------------------------------------------------

export function getFontItems(): IFontItem[] {
  return getStoredFontItems();
};

export async function getFontBundle(id: string, subsets: string[] | null): Promise<IFontBundle | null> {
  return loadFontBundle(id, subsets);
};

export async function getDownload(id: string, subsets: string[] | null, variants: string[] | null, formats: string[] | null): Promise<{
  stream: NodeJS.ReadableStream,
  filename: string
} | null> {

  const fontBundle = await loadFontBundle(id, subsets);

  if (_.isNil(fontBundle)) {
    debug("font loading failed for id: " + id + " subsets: " + subsets + " variants " + variants + " formats" + formats);
    return null;
  }

  const { font, fontURLStore, subsetMap } = fontBundle;

  const synchronizedLoadFileStoreItem = `${font.id}_${fontURLStore.storeID}`
  const fileStoreItem = await loadFileStoreItem(synchronizedLoadFileStoreItem, font.id, font.version, fontURLStore);

  const filteredFiles = _.filter(fileStoreItem.files, (file) => {
    return (_.isNil(variants) || _.includes(variants, file.variant))
      && (_.isNil(formats) || _.includes(formats, file.format));
  });

  if (filteredFiles.length === 0) {
    return null;
  }

  const archive = new JSZip();

  _.each(filteredFiles, function (file) {
    archive.file(path.basename(file.path), fs.createReadStream(file.path))
  });

  return {
    stream: archive.generateNodeStream({
      streamFiles: true,
      compression: 'DEFLATE'
    }),
    filename: fileStoreItem.zippedFilename
  }

};
