'use strict';

function apiError($scope, status, headers, config) {
  // called asynchronously if an error occurs
  // or server returns response with an error status.
  $scope.error = true;
  $scope.errorStatus = status;
  $scope.errorHeaders = JSON.stringify(headers, null, 2);
  $scope.errorConfig = JSON.stringify(config, null, 2);
}

angular.module('googleWebfontsHelperApp')
  .controller('FontsCtrl', function($scope, $http) {

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

.controller('FontsItemCtrl', function($scope, $stateParams, $http, $state) {

  var subSetString = $stateParams.subsets || '';
  $scope.fontID = $stateParams.id;

  $scope.loadingMessage = 'Fetching ' + $scope.fontID + '... [' + subSetString + ']';
  // $scope.loadingSubMessage = subSetString;

  $scope.fontItem = {};
  $scope.busy = true;
  $scope.error = false;

  $scope.downloadSubSetID = '';

  $scope.fontItemPromise = $http.get('/api/fonts/' + $stateParams.id + '?subsets=' + subSetString)
    .success(function(fontItem) {
      $scope.fontItem = fontItem;

      $scope.downloadSubSetID = fontItem.storeID.replace(/_/g, ',');

      $scope.busy = false;
    })
    .error(function(data, status, headers, config) {
      apiError($scope, status, headers, config);
    });

  $scope.subsetSelect = function() {

    setTimeout(function() {
      var queryParams = '';

      $.each($scope.fontItem.subsetMap, function(item) {
        if ($scope.fontItem.subsetMap[item] === true) {
          queryParams += item + ',';
        }
      });

      // remove last comma from string
      queryParams = queryParams.substring(0, queryParams.length - 1);

      $state.go('fonts.item', {
        id: $scope.fontID,
        subsets: queryParams
      });

    }, 0);

  };

});