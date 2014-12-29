'use strict';

angular.module('googleWebfontsHelperApp')
  .controller('FontsCtrl', function($scope, $http) {

    $scope.fonts = [];
    $scope.busy = true;

    $scope.predicate = 'popularity'; // default ordering predicate
    $scope.reverse = false;

    $scope.fontsPromise = $http.get('/api/fonts').success(function(fonts) {
      $scope.fonts = fonts;
      $scope.busy = false;
    });


    $scope.scrollListTop = function () {
      $('.scrollerLeft').scrollTop(0);
    };

    $scope.status = {
    isopen: false
  };

    $scope.toggled = function(open) {
      console.log('Dropdown is now: ', open);
    };

  })

.controller('FontsItemCtrl', function($scope, $stateParams, $http) {
  $scope.fontID = $stateParams.id;
  $scope.fontItem = {};
  $scope.busy = true;

  $scope.fontItemPromise = $http.get('/api/fonts/' + $stateParams.id).success(function(fontItem) {
    $scope.fontItem = fontItem;
    $scope.busy = false;
  });

});