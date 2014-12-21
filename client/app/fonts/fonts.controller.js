'use strict';

angular.module('googleWebfontsHelperApp')
  .controller('FontsCtrl', function($scope, $http) {
    // $scope.message = 'Hello';

    console.log('request all fonts!');

    $scope.fonts = [];

    $http.get('/api/fonts').success(function(fonts) {
      $scope.fonts = fonts;
    });

  })

  .controller('FontsItemCtrl', function($scope, $stateParams, $http) {
    console.log('fonts item ctrl!');

    // console.log($scope);
    // console.log($stateParams);

    $scope.fontItem = {};

    $http.get('/api/fonts/' + $stateParams.id).success(function(fontItem) {
      $scope.fontItem = fontItem;
    });

  });