import * as _ from "lodash";
import { zip } from "./zipper";
import * as debugPkg from "debug";
import { downloadFontFiles } from "./downloader";
import { fetchUrls } from "./urlFetcher";
import { IFontItem, IFullFontItem } from "./font";
import { getFileStore, getFontUrlStore, getStoredFontItemById, getStoredFontItems, getSubsetStored, getSubsetStoreKey, IFileStoreItem, saveFileStoreItem, saveFontUrlStore } from "./store";
import { synchronizedBy } from "./synchronized";

const debug = debugPkg('gwfh:core');

async function loadFullFontItem(fontID: string, subsetArr: string[] | null): Promise<IFullFontItem | null> {
  const font = getStoredFontItemById(fontID);

  if (_.isNil(font)) {
    return null;
  }

  const subsetStoreKey = getSubsetStoreKey(font, subsetArr);

  if (_.isNil(subsetStoreKey)) {
    return null;
  }

  const synchronizedCacheKey = `${fontID}_${subsetStoreKey}`;

  return internalLoadFullFontItem(synchronizedCacheKey, font, subsetStoreKey, subsetArr);

}
const internalLoadFullFontItem = synchronizedBy(_internalLoadFullFontItem);
async function _internalLoadFullFontItem(font: IFontItem, subsetStoreKey: string, subsetArr: string[] | null): Promise<IFullFontItem | null> {

  const fontUrlStore = getFontUrlStore(font, subsetArr);

  if (!_.isNil(fontUrlStore)) {

    const subsetStored = getSubsetStored(font.id, subsetStoreKey);

    // TODO recator full font item fuckup merge
    return {
      ...font,
      ...({ subsetMap: subsetStored }),
      ...fontUrlStore
    };
  }

  const fetchedFontUrlStore = await fetchUrls(font, subsetStoreKey);

  if (fetchedFontUrlStore === null) {
    console.error('urlStoreObject resolved null for font ' + font.id + ' subset ' + subsetStoreKey);
    return null;
  }

  // SIDE-EFFECT!
  saveFontUrlStore(font.id, fetchedFontUrlStore);

  debug("fetched fontItem for font.id=" + font.id + " subsetStoreKey=" + subsetStoreKey, fetchedFontUrlStore);

  const subsetStored = getSubsetStored(font.id, subsetStoreKey);

  // TODO recator full font item fuckup merge
  return {
    ...font,
    ...({ subsetMap: subsetStored }),
    ...fetchedFontUrlStore
  };

}

const loadFileStoreItem = synchronizedBy(_loadFileStoreItem);
async function _loadFileStoreItem(fontItem: IFullFontItem): Promise<IFileStoreItem> {

  const fontFileStore = getFileStore(fontItem.id, fontItem.storeID);

  if (!_.isNil(fontFileStore)) {
    return fontFileStore;
  }

  const localPaths = await downloadFontFiles(fontItem);

  if (localPaths.length === 0) {
    throw new Error(`No local paths received for ${fontItem.id}, ${fontItem.storeID}`);
  }

  const fileStoreItem: IFileStoreItem = {
    files: localPaths,
    zippedFilename: fontItem.id + "-" + fontItem.version + "-" + fontItem.storeID + '.zip'
  }

  // SIDE-EFFECT!
  saveFileStoreItem(fontItem.id, fontItem.storeID, fileStoreItem);

  return fileStoreItem;
}

// -----------------------------------------------------------------------------
// Exports for REST API
// -----------------------------------------------------------------------------

export function getFontItems(): IFontItem[] {
  return getStoredFontItems();
};

export async function getFullFontItem(id: string, subsetArr: string[] | null): Promise<IFullFontItem | null> {
  return loadFullFontItem(id, subsetArr);
};

export async function getDownload(id: string, subsetArr: string[] | null, variantsArr: string[] | null, formatsArr: string[] | null): Promise<{
  stream: NodeJS.ReadableStream,
  filename: string
} | null> {

  const fontItem = await loadFullFontItem(id, subsetArr);

  if (_.isNil(fontItem)) {
    debug("font loading failed for id: " + id + " subsetArr: " + subsetArr + " variantsArr " + variantsArr + " formatsArr" + formatsArr);
    return null;
  }

  const synchronizedLoadFileStoreItem = `${fontItem.id}_${fontItem.storeID}`
  const fileStoreItem = await loadFileStoreItem(synchronizedLoadFileStoreItem, fontItem);

  const filteredFiles = _.filter(fileStoreItem.files, (file) => {
    return (_.isNil(variantsArr) || _.includes(variantsArr, file.variant))
      && (_.isNil(formatsArr) || _.includes(formatsArr, file.format));
  });

  if (filteredFiles.length === 0) {
    return null;
  }

  return {
    stream: zip(_.map(filteredFiles, "path")),
    filename: fileStoreItem.zippedFilename
  };
};
