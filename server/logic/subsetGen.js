var _ = require('lodash');

var MINIMAL_SUBSET_SIZE = 1;

// get all possible unique subset combinations of a font, based on its subset array
// adapted from http://stackoverflow.com/questions/5752002/find-all-possible-subset-combos-in-an-array
function getSubsets(input) {

  if (_.isArray(input) === false || input.length < MINIMAL_SUBSET_SIZE) {
    return {};
  }

  var uniqueInput = _.uniq(input);
  var results = [],
    result, mask, total = Math.pow(2, uniqueInput.length);

  for (mask = 0; mask < total; mask++) {
    result = [];
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

function getUniqueStoreID(uniqueCombArr) {
  var storeID = '';
  var lastItemIndex = uniqueCombArr.length - 1;

  _.each(uniqueCombArr, function(uniqueItem, index) {
    if (index < lastItemIndex) {
      storeID += uniqueItem + "_";
    } else {
      storeID += uniqueItem;
    }
  });

  return storeID;
}

// represent the data with a set of booleans, which is duplicate free 
// and easy to filter
function getDefaultSubsetObj(uniqueCombArr, inputArr) {
  // within the subset object, a urlStore is setuped. 
  var urlStore = {
    subsetMap: {}
  };

  _.each(inputArr, function(inputItem) {
    urlStore.subsetMap[inputItem] = _.contains(uniqueCombArr, inputItem);
  });

  return urlStore;
}

module.exports = getSubsets;