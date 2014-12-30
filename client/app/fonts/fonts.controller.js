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

.controller('FontsItemCtrl', function($scope, $stateParams, $http) {
  $scope.fontID = $stateParams.id;
  $scope.fontItem = {};
  $scope.busy = true;
  $scope.error = false;

  $scope.subsetRadio = {
    model: undefined
  };

  $scope.fontItemPromise = $http.get('/api/fonts/' + $stateParams.id)
    .success(function(fontItem) {
      $scope.fontItem = fontItem;

      $scope.subsetRadioModelButtons = fontItem.subsets;

      $scope.busy = false;
    })
    .error(function(data, status, headers, config) {
      apiError($scope, status, headers, config);
    });

});