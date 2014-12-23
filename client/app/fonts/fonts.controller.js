'use strict';

angular.module('googleWebfontsHelperApp')
  .controller('FontsCtrl', function($scope, $http) {

    $scope.fonts = [];
    $scope.busy = true;

    $scope.fontsPromise = $http.get('/api/fonts').success(function(fonts) {
      $scope.fonts = fonts;
      $scope.busy = false;
    });

  })

.controller('FontsItemCtrl', function($scope, $stateParams, $http) {
  $scope.fontID = $stateParams.id;
  $scope.fontItem = {};

  $scope.busy = true;

  $scope.fontItemPromise = $http.get('/api/fonts/' + $stateParams.id).success(function(fontItem) {
    $scope.fontItem = fontItem;

    $scope.busy = false;


    // $timeout(function() {
    //   // activate tabs after timeout
    //   // http://stackoverflow.com/questions/16935766/run-jquery-code-after-angularjs-completes-rendering-html
    //   $('#cssTabMenu a').click(function(e) {
    //     e.preventDefault();
    //     $(this).tab('show');
    //   });
    // });

  });

});