'use strict';

function apiError($scope, status, headers, config) {
  // called asynchronously if an error occurs
  // or server returns response with an error status.
  $scope.error = true;
  $scope.errorStatus = status;
  $scope.errorHeaders = JSON.stringify(headers, null, 2);
  $scope.errorConfig = JSON.stringify(config, null, 2);
}

var previousFontItem = false; // holds reference to previous font item, for partial refreshs, will be nulled if fontID changes

var subsetsChkbTimeoutP = null; // timeout - promise for cgBusy 3000ms until request for customization is made
var subsetsChkbReload = null; // interval - promise for cgBusy loading text rewrite (waiting till customization) 1000ms

var variantsMap = {}; // map holds currently checked variants of a fontItem

angular.module('googleWebfontsHelperApp')
  .controller('FontsCtrl', function($scope, $http) {

    $scope.fonts = [];
    $scope.sponsors = [];
    $scope.busy = true;
    $scope.selectedItemID = '';

    $scope.predicate = {
      name: 'by family',
      filter: 'family',
      bindArg: 'category'
    }; // default ordering predicate

    $scope.reverse = false;

    $scope.fontsPromise = $http.get('/api/fonts')
      .success(function(fonts) {
        $scope.fonts = fonts;
        $scope.busy = false;
      })
      .error(function(data, status, headers, config) {
        apiError($scope, status, headers, config);
      });
    
    $scope.sponsorsPromise = $http.get('https://sponsors.mranftl.com/json')
      .success(function (data) {
        $scope.sponsors = data.sponsors;
        $scope.busy = false;
      }) // err is not handled, because it is not critical

    $scope.scrollListTop = function() {
      $('.scrollerLeft').scrollTop(0);
    };

  })

.controller('FontsItemCtrl', function($scope, $stateParams, $http, $state, $timeout, $interval) {

  var subSetString = $stateParams.subsets || '';

  if (subsetsChkbTimeoutP) {
    $timeout.cancel(subsetsChkbTimeoutP);
    $interval.cancel(subsetsChkbReload);
  }

  $scope.fontID = $stateParams.id;
  $scope.$parent.selectedItemID = $scope.fontID;

  if (previousFontItem && previousFontItem.id === $stateParams.id) {
    // former item is a candiate for instant population until load is complete.
    $scope.fontItem = previousFontItem;
    $scope.loadingMessage = 'Customizing ' + $stateParams.id + '...';

    // reuse current variantMap
    $scope.variantsMap = variantsMap;

  } else {
    // clear it
    previousFontItem = false;
    $scope.loadingMessage = 'Loading ' + $stateParams.id + '...';
  }

  $scope.error = false;
  $scope.fontFormats = 'woff2';

  $scope.downloadSubSetID = '';
  $scope.subSetsSelected = 0;

  $scope.loadingPromise = $http.get('/api/fonts/' + $stateParams.id + '?subsets=' + subSetString)
    .success(function(fontItem) {
      $scope.fontItem = fontItem;

      $scope.downloadSubSetID = fontItem.storeID.replace(/_/g, ',');

      $.each($scope.fontItem.subsetMap, function(item) {
        if ($scope.fontItem.subsetMap[item] === true) {
          $scope.subSetsSelected += 1;
        }
      });

      if (!previousFontItem) {
        // first load of fontItem - reload variants Map and set the default font style
        variantsMap = {};
        $.each(fontItem.variants, function(index, variantItem) {
          // console.log(variantItem);
          variantsMap[variantItem.id] = variantItem.id === fontItem.defVariant;
        });

        // console.log(variantsMap);

        $scope.variantsMap = variantsMap;
        $scope.variantDownloadQueryString = $scope.fontItem.defVariant;

      } else {
        // trigger variant select so variant query string matches again
        $scope.variantSelect();
      }

      $scope.busy = false;
    })
    .error(function(data, status, headers, config) {
      apiError($scope, status, headers, config);
    });

  if (previousFontItem === false) {
    $scope.busy = true;
  }

  $scope.checkSubsetMinimalSelection = function(key) {
    if ($scope.subSetsSelected === 1 && $scope.fontItem.subsetMap[key] === true) {
      return true;
    } else {
      return false;
    }
  };

  $scope.variantSelect = function() {
    var variantDownloadQueryString = '';

    $.each(variantsMap, function(checkKey) {
      if (variantsMap[checkKey] === true) {
        variantDownloadQueryString += checkKey + ',';
      }
    });

    if (variantDownloadQueryString.length === 0) {
      // you will only get the defaultvariant!
      variantDownloadQueryString = $scope.fontItem.defVariant;
    } else {
      // remove last comma from string
      variantDownloadQueryString = variantDownloadQueryString.substring(0, variantDownloadQueryString.length - 1);
    }

    $scope.variantDownloadQueryString = variantDownloadQueryString;

  };

  $scope.subsetSelect = function() {

    if (subsetsChkbTimeoutP) {
      $timeout.cancel(subsetsChkbTimeoutP);
      $interval.cancel(subsetsChkbReload);
    }

    subsetsChkbTimeoutP = $timeout(function() {
      var queryParams = '';
      var lenChecked = 0;
      var map = $scope.fontItem.subsetMap;
      var defaultSet = $scope.fontItem.defSubset;

      $.each(map, function(item) {
        if (map[item] === true) {
          queryParams += item + ',';
          lenChecked += 1;
        }
      });

      $scope.subSetsSelected = lenChecked;

      if (lenChecked === 0) {
        // you will get the defaultset
        map[defaultSet] = true;
        queryParams = defaultSet;
      } else {
        // remove last comma from string
        queryParams = queryParams.substring(0, queryParams.length - 1);
      }

      previousFontItem = $scope.fontItem;

      // wait until doing the request (overrides previous promise!)...
      subsetsChkbTimeoutP = $timeout(function() {
        $state.go('fonts.item', {
          id: $scope.fontID,
          subsets: queryParams
        });
      }, 3000);

      var timeUntil = 3;

      function setCustomizationReloadMessage(time) {
        $scope.customizationReloadMessage = 'Customization will be requested in ' + time + ' sec...';
      }

      setCustomizationReloadMessage(timeUntil);

      subsetsChkbReload = $interval(function() {
        timeUntil -= 1;
        setCustomizationReloadMessage(timeUntil);
      }, 1000, 3);



      // make available for cgBusy
      $scope.subsetsChkbTimeoutP = subsetsChkbTimeoutP;

    });

    // make available for cgBusy
    $scope.subsetsChkbTimeoutP = subsetsChkbTimeoutP;

  };

  // selected variants filter
  $scope.variantFilter = function(variant) {
    if ($scope.variantsMap[variant.id] === false) {
      return;
    }

    return variant;
  };

  $scope.checkVariantMinimalSelection = function(key) {

    var countSelected = 0;

    $.each(variantsMap, function(checkKey) {
      if (variantsMap[checkKey] === true) {
        countSelected += 1;
      }
    });

    if (countSelected === 1 && variantsMap[key] === true) {
      return true;
    } else {
      return false;
    }
  };

  $scope.selectText = function(evt) {

    var element = evt.currentTarget;

    // console.log(element);

    var doc = document,
      text = element,
      range, selection;
    if (doc.body.createTextRange) {
      range = document.body.createTextRange();
      range.moveToElementText(text);
      range.select();
    } else if (window.getSelection) {
      selection = window.getSelection();
      range = document.createRange();
      range.selectNodeContents(text);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  };
  
  $scope.modernSupportActive = function() {
    $scope.fontFormats =  'woff2';
  };
  $scope.legacySupportActive = function() {
    $scope.fontFormats =  'woff2,ttf';
  };
  $scope.historicSupportActive = function() {
    $scope.fontFormats =  'woff2,woff,ttf,svg,eot';
  };

});