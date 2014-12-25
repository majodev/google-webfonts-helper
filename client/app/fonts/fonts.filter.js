'use strict';

angular.module('googleWebfontsHelperApp')
  .filter('fontsFilter', function () {
    return function (input) {
      console.log(input);
      return input;
    };
  });
