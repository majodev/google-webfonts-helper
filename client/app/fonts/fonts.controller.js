'use strict';

angular.module('googleWebfontsHelperApp')
  .controller('FontsCtrl', function($scope, $http) {

    $scope.fonts = [];

    $scope.fontsPromise = $http.get('/api/fonts').success(function(fonts) {
      $scope.fonts = fonts;
    });

  })

  .controller('FontsItemCtrl', function($scope, $stateParams, $http) {

    $scope.fontID = $stateParams.id;
    $scope.fontItem = {};

    $scope.fontItemPromise = $http.get('/api/fonts/' + $stateParams.id).success(function(fontItem) {
      $scope.fontItem = fontItem;
    });

  });