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
          var codeElement = element.find('code');
          var tmp;

          // only highlight if code element found
          if (codeElement.length > 0) {
            // console.log(codeElement); 
            tmp = $interpolate(codeElement.text())(scope);
            codeElement.html(hljs.highlightAuto(tmp).value);
          }

        }, 0);

      }
    };
  }]);