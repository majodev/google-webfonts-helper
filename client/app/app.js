'use strict';

angular.module('googleWebfontsHelperApp', [
    'ngCookies',
    'ngResource',
    'ngSanitize',
    'ui.router',
    'ui.bootstrap',
    'cgBusy'
  ])
  .config(function($stateProvider, $urlRouterProvider, $locationProvider) {

    $urlRouterProvider
      .otherwise('/fonts'); // default urls is /fonts

    $locationProvider.html5Mode(true);

  })
  .run(function($rootScope) {
    $rootScope.APP_TITLE = 'Google Webfonts Helper'
  });
