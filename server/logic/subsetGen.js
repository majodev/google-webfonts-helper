var _ = require('lodash');

var MINIMAL_SUBSET_SIZE = 1;


// get all possible unique subset combinations of a font, based on its subset array
// adapted from http://stackoverflow.com/questions/5752002/find-all-possible-subset-combos-in-an-array
function getSubsets(input) {
  var results = [],
    result, mask, total = Math.pow(2, input.length);
  for (mask = 0; mask < total; mask++) {
    result = [];
    var i = input.length - 1;
    do {
      if ((mask & (1 << i)) !== 0) {
        result.push(input[i]);
      }
    } while (i--);
    if (result.length >= MINIMAL_SUBSET_SIZE) {

      // save in a object with unique id not array - as not as easily manipulateable
      results[getUniqueStoreID(result)] = getDefaultSubsetObj(result, input);

      //results.push(getDefaultSubsetObj(result, input));
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
      // e.g. IDpart_IDpart_IDpart
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