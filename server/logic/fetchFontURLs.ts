import * as _ from "lodash";
import { config, IUserAgents } from "../config";
import { fetchCSS } from "./fetchCSS";
import * as Bluebird from "bluebird";

export interface IFontURLStore {
  variants: IVariantItem[];
  storeID: string;
}

interface IVariantURL {
  format: keyof IUserAgents;
  url: string;
}

interface IVariantItem {
  id: string;
  fontFamily: null | string;
  fontStyle: null | string;
  fontWeight: null | string;
  urls: IVariantURL[]
}

const VARIANT_CONCURRENCY = 2;
const CSS_DOWNLOAD_CONCURRENCY = 2;

const TARGETS = _.map(_.keys(config.USER_AGENTS), (key) => {
  return {
    format: <keyof IUserAgents>key,
    userAgent: <string>config.USER_AGENTS[<keyof IUserAgents>key]
  };
});

export async function fetchFontURLs(fontFamily: string, fontVariants: string[], storeID: string): Promise<IFontURLStore | null> {

  const urlStore: IFontURLStore = {
    variants: [],
    storeID
  };

  const cssSubsetString = storeID.split("_").join(","); // make the variant string google API compatible...

  await Bluebird.map(fontVariants, async (variant) => {

    const cssFontFamily = fontFamily + ":" + variant;

    const variantItem: IVariantItem = {
      id: variant,
      fontFamily: null,
      fontStyle: null,
      fontWeight: null,
      urls: []
    };

    await Bluebird.map(TARGETS, async (target) => {
      const resources = await fetchCSS(cssFontFamily, cssSubsetString, target.format, target.userAgent);

      if (resources.length === 0) {
        console.warn(`fetchFontURLs: no css ressources encountered for fontFamily='${cssFontFamily}' subset='${cssSubsetString}' format=${target.format}`, resources);
        return;
      }

      if (resources.length > 1) {
        console.warn(`fetchFontURLs: multiple css ressources encountered for fontFamily='${cssFontFamily}' subset='${cssSubsetString}' format=${target.format}`, resources);
      }

      _.each(resources, (resource) => {
        // save the format (woff, eot, svg, ttf, usw...)
        variantItem.urls.push({
          format: target.format,
          // rewrite url to use https instead on http!
          url: resource.url.split("http://").join("https://") // resource.url.replace(/^http:\/\//i, 'https://');
        });

        // if not defined, also save procedded font-family, fontstyle, font-weight, unicode-range
        if (_.isNil(variantItem.fontFamily) && !_.isNil(resource.fontFamily)) {
          variantItem.fontFamily = resource.fontFamily;
        }

        if (_.isNil(variantItem.fontStyle) && !_.isNil(resource.fontStyle)) {
          variantItem.fontStyle = resource.fontStyle;
        }

        if (_.isNil(variantItem.fontWeight) && !_.isNil(resource.fontWeight)) {
          variantItem.fontWeight = resource.fontWeight;
        }
      });

    }, { concurrency: CSS_DOWNLOAD_CONCURRENCY });

    urlStore.variants.push(variantItem);

  }, { concurrency: VARIANT_CONCURRENCY });

  urlStore.variants = _.sortBy(urlStore.variants, function ({ fontWeight, fontStyle }) {
    const styleOrder = fontStyle === "normal" ? 0 : 1;
    return `${fontWeight}-${styleOrder}`
  });

  return urlStore;
}
