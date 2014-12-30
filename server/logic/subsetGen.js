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


// represent the data with a set of booleans, which is duplicate free 
// and easy to filter
// e.g. one tuple:
// {
//   greek-ext: true,
//   latin: false,
//   vietnamese: false,
//   urlStore: {
//     storeID: "greek-ext"
//   }
// }

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

function getDefaultSubsetObj(uniqueCombArr, inputArr) {

  var obj = {
    urlStore: { // within the subset object, a urlStore is setuped. 
    }
  };

  //var lastItemIndex = uniqueCombArr.length - 1;

  _.each(inputArr, function(inputItem) {
    obj[inputItem] = _.contains(uniqueCombArr, inputItem);
  });

  //_.each(uniqueCombArr, function(uniqueItem) {

    //obj[uniqueItem] = true;

    // console.log(uniqueItem);

    // if (index < lastItemIndex) {
    //   obj.urlStore.storeID += uniqueItem + "_";
    //   // e.g. IDpart_IDpart_IDpart
    // } else {
    //   obj.urlStore.storeID += uniqueItem;
    // }

  //});

  return obj;
}


module.exports = getSubsets;