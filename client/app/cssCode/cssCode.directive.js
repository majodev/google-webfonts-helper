'use strict';

angular.module('googleWebfontsHelperApp')
  .directive('cssCode', [function() {
    return {
      templateUrl: 'app/cssCode/cssCode.html',
      restrict: 'EA',
      scope: {
        type: '=',
        variant: '=',
        fontItem: '=',
        folderPrefix: '='
      },
      link: function(scope, element) {
      }
    };
  }]);