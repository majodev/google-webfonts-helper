'use strict';

angular.module('googleWebfontsHelperApp')
  .directive('cssCode', ['$timeout', '$interpolate', function($timeout, $interpolate) {
    return {
      templateUrl: 'app/cssCode/cssCode.html',
      restrict: 'EA',
      // replace: true,
      transclude: true,
      scope: {
        type: '=',
        variant: '=',
        fontItem: '=',
        folderPrefix: '='
      },
      link: function(scope, element) {

        // hljs is available in script

        $timeout(function() {
          var tmp = $interpolate(element.find('code').text())(scope);
          element.find('code').html(hljs.highlightAuto(tmp).value);
        }, 0);

      }
    };
  }]);