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
      .otherwise('/fonts');

    $locationProvider.html5Mode(true);
  });