'use strict';

angular.module('googleWebfontsHelperApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('fonts', {
        url: '/fonts',
        templateUrl: 'app/fonts/fonts.html',
        controller: 'FontsCtrl'
      })
      .state('fonts.item', {
        url: '/:id',
        templateUrl: 'app/fonts/fontsItem.html',
        controller: 'FontsItemCtrl'
      });
  });