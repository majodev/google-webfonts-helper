'use strict';

describe('Directive: cssCode', function () {

  // load the directive's module and view
  beforeEach(module('googleWebfontsHelperApp'));
  beforeEach(module('app/cssCode/cssCode.html'));

  var element, scope;

  beforeEach(inject(function ($rootScope) {
    scope = $rootScope.$new();
  }));

  it('should make hidden element visible', inject(function ($compile) {
    element = angular.element('<css-code></css-code>');
    element = $compile(element)(scope);
    scope.$apply();
    expect(element.text()).toBe('this is the cssCode directive');
  }));
});