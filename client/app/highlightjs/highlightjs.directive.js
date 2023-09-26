'use strict';

// via http://stackoverflow.com/questions/25581560/dynamic-syntax-highlighting-with-angularjs-and-highlight-js

angular.module('googleWebfontsHelperApp')
  .directive('highlightjs', ['$interpolate', '$timeout', function($interpolate, $timeout) {
    return {
      restrict: 'EA',
      scope: true, // must inherit parent scope all expressions are allowed inside content!
      compile: function(tElem, tAttrs) {
        var interpolateFn = $interpolate(tElem.html(), true);
        tElem.html(''); // disable automatic intepolation bindings

        return function(scope, elem, attrs) {
          scope.$watch(interpolateFn, function(value) {
            $timeout(function() {
              var highlighter = elem.attr('data-hljs'); // use data-hljs to define the highlighter to use

              if (typeof highlighter !== 'undefined') {
                elem.html(hljs.highlight(highlighter, value).value);
              } else {
                elem.html(hljs.highlightAuto(value).value);
              }

            }, 0);

          });
        }
      },
      link: function(scope, element) {}
    };
  }]);