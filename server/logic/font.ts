import { ISubsetMap } from "./subsetGen";
import { IFontURLStore } from "./fetchFontURLs";

export interface IFontItem {
  id: string;
  family: string;
  subsets: string[];
  category: string;
  version: string;
  lastModified: string;
  popularity: number;
  defSubset: string;
  defVariant: string;
  variants: string[];
}

export interface IFontBundle {
  font: IFontItem;
  subsetMap: ISubsetMap;
  fontURLStore: IFontURLStore;
};