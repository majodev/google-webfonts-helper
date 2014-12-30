// adapted from http://stackoverflow.com/questions/5752002/find-all-possible-subset-combos-in-an-array
var _ = require('lodash');

var MINIMAL_SUBSET_SIZE = 1;

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
      results.push(getDefaultSubsetObj(result, input));
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
//   vietnamese: false
// }

function getDefaultSubsetObj(uniqueCombArr, inputArr) {
  var obj = {};

  _.each(inputArr, function(inputItem) {
    obj[inputItem] = false;
  });

  _.each(uniqueCombArr, function(uniqueItem) {
    // obj.id += uniqueItem + "-";
    obj[uniqueItem] = true;
  });
  
  return obj;
}


module.exports = getSubsets;