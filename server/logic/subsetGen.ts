import * as _ from "lodash";

export interface ISubsetTree {
  [storeID: string]: ISubsetStored;
}

export interface ISubsetStored {
  subsetMap: ISubsetMap;
}

export interface ISubsetMap {
  [subset: string]: boolean;
}

const MINIMAL_SUBSET_SIZE = 1;

// get all possible unique subset combinations of a font, based on its subset array
// adapted from http://stackoverflow.com/questions/5752002/find-all-possible-subset-combos-in-an-array
export function getSubsets(input: string[]): ISubsetTree {

  if (_.isArray(input) === false || input.length < MINIMAL_SUBSET_SIZE) {
    return {};
  }

  const uniqueInput = _.uniq(input);
  const results: ISubsetTree = {};
  const total = Math.pow(2, uniqueInput.length);

  for (let mask = 0; mask < total; mask++) {
    const result = [];
    var i = uniqueInput.length - 1;
    do {
      if ((mask & (1 << i)) !== 0) {
        result.push(uniqueInput[i]);
      }
    } while (i--);
    if (result.length >= MINIMAL_SUBSET_SIZE) {
      results[getUniqueStoreID(result)] = getDefaultSubsetObj(result, uniqueInput);
    }
  }

  return results;
}

function getUniqueStoreID(uniqueCombinations: string[]) {
  return uniqueCombinations.join("_");
}

// represent the data with a set of booleans, which is duplicate free 
// and easy to filter
function getDefaultSubsetObj(uniqueCombinations: string[], input: string[]): { subsetMap: ISubsetMap } {
  // within the subset object, a urlStore is setuped. 
  return {
    subsetMap: _.reduce(input, (sum, inputItem) => {
      sum[inputItem] = _.includes(uniqueCombinations, inputItem);
      return sum;
    }, {})
  }
}
