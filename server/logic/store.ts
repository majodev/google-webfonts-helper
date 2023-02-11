import * as _ from "lodash";
import * as mkdirp from "mkdirp";
import { IFontItem } from "./font";
import { getFontsToDownload } from "./googleFontsAPI";
import { getSubsets, ISubsetMap, ISubsetStored, ISubsetTree } from "./subsetGen";
import { config } from "../config";
import * as debugPkg from "debug";
import { IFontURLStore } from "./urlFetcher";
import { IFontFilePath } from "./downloader";

const debug = debugPkg('gwfh:store');
let storedFonts: IFontItem[];

interface ISubsetStore {
    [fontID: string]: ISubsetTree
}

const subsetStore: ISubsetStore = {}; // every item in here holds a urlStore Object + a unique subset combo.

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

    storedFonts = await getFontsToDownload();

    let subsetStoreUniqueCombos = 0;
    _.each(storedFonts, function (item) {
        var uniqueSubsetCombos = getSubsets(item.subsets);

        // Create subsetStore for item
        subsetStore[item.id] = uniqueSubsetCombos;

        // for startup: remember count of items to print it out...
        subsetStoreUniqueCombos += _.keys(uniqueSubsetCombos).length;
    });

    debug("fonts cached and subsets initialized. num fonts: " + storedFonts.length +
        " num unique subset combos: " + subsetStoreUniqueCombos);

};

export function getStoredFontItemById(fontID: string): IFontItem | null {
    return _.find(storedFonts, { id: fontID });
}

export function getStoredFontItems(): IFontItem[] {
    return storedFonts;
}

export function getSubsetStoreKey(font: IFontItem, subsetArr: string[]): string | null {
    const fontSubsetStore = subsetStore[font.id];

    if (_.isNil(fontSubsetStore)) {
        debug("fontSubsetStore for " + font.id + " not found!");
        return null;
    }

    const fontSubsetKey = _.findKey(fontSubsetStore, {
        subsetMap: getFilterObject(font, subsetArr)
    });

    if (_.isNil(fontSubsetKey)) {
        debug("fontSubsetKey for " + font.id + " subset " + subsetArr + " not found!");
        return null;
    }

    return fontSubsetKey;
}

export function getSubsetStored(fontID: string, subsetStoreKey: string): ISubsetStored {
    return subsetStore[fontID][subsetStoreKey];
}

export function saveFontUrlStore(fontID: string, fontUrlStore: IFontURLStore) {

    // console.log("save:", fontID, fontUrlStore.storeID);

    const existing = _.find(fontUrlStores, (previousStore) => {
        return previousStore.fontID === fontID && previousStore.store.storeID === fontUrlStore.storeID
    });

    if (existing) {
        console.warn("duplicate save of storeID: ", fontUrlStore.storeID);
        return;
    }

    fontUrlStores.push({
        fontID,
        store: fontUrlStore
    });
}

export function getFontUrlStore(font: IFontItem, subsetArr: string[]): IFontURLStore {
    const storeID = getSubsetStoreKey(font, subsetArr);

    const store = _.find(fontUrlStores, (previousStore) => {
        return previousStore.fontID === font.id && previousStore.store.storeID === storeID
    })

    if (!store) {
        return null;
    }

    return store.store;
}

function getFilterObject(font: IFontItem, subsetArr: string[]): { [subset: string]: boolean } {
    if (!_.isArray(subsetArr) || subsetArr.length === 0) {
        // supply filter with the default subset as defined in googleFontsAPI fetcher (latin or if no found other)
        return _.reduce(font.subsets, (sum, subsetItem) => {
            sum[subsetItem] = (subsetItem === font.defSubset);
            return sum;
        }, {});
    }

    return _.reduce(font.subsets, (sum, subsetItem) => {
        sum[subsetItem] = _.includes(subsetArr, subsetItem);
        return sum;
    }, {});
}

export function getFileStore(fontID: string, storeID: string) {
    const fileStoreID = fontID + "-" + storeID; // unique identifier in filestore.
    return fileStore[fileStoreID];
}

export function saveFileStoreItem(fontID: string, storeID: string, fileStoreItem: IFileStoreItem) {
    const fileStoreID = fontID + "-" + storeID; // unique identifier in filestore.
    if (!_.isNil(fileStore[fileStoreID])) {
        console.warn("duplicate save of fileStoreItem: ", fileStoreID);
    }

    fileStore[fileStoreID] = fileStoreItem;
}

export function getFileStoreLengthIds() {
    return _.keys(fileStore).length;
}

export function getFileStoreTrackedFiles() {
    return _.sumBy(_.values(fileStore), function (f) { return (f.files) ? f.files.length : 0; });
}
