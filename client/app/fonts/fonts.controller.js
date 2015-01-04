'use strict';

function apiError($scope, status, headers, config) {
  // called asynchronously if an error occurs
  // or server returns response with an error status.
  $scope.error = true;
  $scope.errorStatus = status;
  $scope.errorHeaders = JSON.stringify(headers, null, 2);
  $scope.errorConfig = JSON.stringify(config, null, 2);
}

var previousFontItem = false;
var checkboxTimeoutPromise = null;
var checkboxReloadInterval = null;


angular.module('googleWebfontsHelperApp')
  .controller('FontsCtrl', function($scope, $http, $stateParams) {

    $scope.fonts = [];
    $scope.busy = true;

    $scope.predicate = 'popularity'; // default ordering predicate
    $scope.reverse = false;

    $scope.fontsPromise = $http.get('/api/fonts')
      .success(function(fonts) {
        $scope.fonts = fonts;
        $scope.busy = false;
      })
      .error(function(data, status, headers, config) {
        apiError($scope, status, headers, config);
      });

    $scope.scrollListTop = function() {
      $('.scrollerLeft').scrollTop(0);
    };

  })

.controller('FontsItemCtrl', function($scope, $stateParams, $http, $state, $timeout, $interval) {

  var subSetString = $stateParams.subsets || '';

  if (checkboxTimeoutPromise) {
    $timeout.cancel(checkboxTimeoutPromise);
    $interval.cancel(checkboxReloadInterval);
  }

  $scope.fontID = $stateParams.id;

  if (previousFontItem && previousFontItem.id === $stateParams.id) {
    // former item is a candiate for instant population until load is complete.
    $scope.fontItem = previousFontItem;
    $scope.loadingMessage = 'Customizing ' + $stateParams.id + '...';
  } else {
    // clear it
    previousFontItem = false;
    $scope.loadingMessage = 'Loading ' + $stateParams.id + '...';
  }

  $scope.error = false;

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

      $scope.busy = false;
    })
    .error(function(data, status, headers, config) {
      apiError($scope, status, headers, config);
    });



  if (previousFontItem === false) {
    // $scope.fullLoadingPromise = promise;
    $scope.busy = true;
  } else {
    // $scope.partialLoadingPromise = promise;
  }

  $scope.checkSubsetMinimalSelection = function(key) {
    if ($scope.subSetsSelected === 1 && $scope.fontItem.subsetMap[key] === true) {
      // console.log(key);
      return true;
    } else {
      return false;
    }
  };

  $scope.subsetSelect = function() {

    if (checkboxTimeoutPromise) {
      $timeout.cancel(checkboxTimeoutPromise);
      $interval.cancel(checkboxReloadInterval);
    }

    checkboxTimeoutPromise = $timeout(function() {
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
        // queryParams = $scope.fontItem.defSubset;
        map[defaultSet] = true;
        queryParams = defaultSet;
      } else {
        // remove last comma from string
        queryParams = queryParams.substring(0, queryParams.length - 1);
      }

      previousFontItem = $scope.fontItem;

      // wait until doing the request (overrides previous promise!)...
      checkboxTimeoutPromise = $timeout(function() {
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

      checkboxReloadInterval = $interval(function () {
        timeUntil -= 1;
        setCustomizationReloadMessage(timeUntil);
      }, 1000, 3);



      // make available for cgBusy
      $scope.checkboxTimeoutPromise = checkboxTimeoutPromise;

    });

    // make available for cgBusy
    $scope.checkboxTimeoutPromise = checkboxTimeoutPromise;

  };

});