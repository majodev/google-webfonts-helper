// adapted from http://stackoverflow.com/questions/5752002/find-all-possible-subset-combos-in-an-array

function getSubsets(input, minsize) {
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
    if (result.length >= minsize) {
      results.push(result);
    }
  }

  return results;
}


module.exports = getSubsets;