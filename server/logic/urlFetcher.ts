import * as _ from "lodash";
import { config, IUserAgents } from "../config";
import * as debugPkg from "debug"
import { fetchCSS } from "./cssFetcher";
import { IFontItem } from "./font";
import * as Bluebird from "bluebird";

const debug = debugPkg('gwfh:urlFetcher');

export interface IFontURLStore {
  variants: IVariantItem[];
  storeID: string;
}

interface IVariantItem extends Partial<IUserAgents> {
  id: string;
  fontFamily: null | string;
  fontStyle: null | string;
  fontWeight: null | string;
}

const TARGETS = _.map(_.keys(config.USER_AGENTS), (key) => {
  return {
    format: <keyof IUserAgents>key,
    userAgent: <string>config.USER_AGENTS[key]
  };
});

export async function fetchUrls(font: IFontItem, storeID: string): Promise<IFontURLStore | null> {

  const urlStore: IFontURLStore = {
    variants: [],
    storeID
  };

  const cssSubsetString = storeID.split("_").join(","); // make the variant string google API compatible...

  await Bluebird.map(font.variants, async (variant) => {

    const variantItem: IVariantItem = {
      id: variant,
      fontFamily: null,
      fontStyle: null,
      fontWeight: null
    };

    await Bluebird.map(TARGETS, async (target) => {
      const resources = await fetchCSS(font.family + ":" + variant, cssSubsetString, target.format, target.userAgent);

      // save the type (woff, eot, svg, ttf, usw...)
      const type = target.format;

      if (resources.length === 0) {
        return;
      }

      // rewrite url to use https instead on http!
      variantItem[type] = resources[0].url.split("http://").join("https://"); // resources[0].url.replace(/^http:\/\//i, 'https://');

      // if not defined, also save procedded font-family, fontstyle, font-weight, unicode-range
      if (_.isNil(variantItem.fontFamily) && !_.isNil(resources[0].fontFamily)) {
        variantItem.fontFamily = resources[0].fontFamily;
      }

      if (_.isNil(variantItem.fontStyle) && !_.isNil(resources[0].fontStyle)) {
        variantItem.fontStyle = resources[0].fontStyle;
      }

      if (_.isNil(variantItem.fontWeight) && !_.isNil(resources[0].fontWeight)) {
        variantItem.fontWeight = resources[0].fontWeight;
      }
    });

    urlStore.variants.push(variantItem);

  });

  urlStore.variants = _.sortBy(urlStore.variants, function ({ fontWeight, fontStyle }) {
    const styleOrder = fontStyle === "normal" ? 0 : 1;
    return `${fontWeight}-${styleOrder}`
  });

  return urlStore;
}
