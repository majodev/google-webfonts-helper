'use strict';

describe('Directive: highlightjs', function () {

  // load the directive's module
  beforeEach(module('googleWebfontsHelperApp'));

  var element,
    scope;

  beforeEach(inject(function ($rootScope) {
    scope = $rootScope.$new();
  }));

  it('should make hidden element visible', inject(function ($compile) {
    element = angular.element('<highlightjs></highlightjs>');
    element = $compile(element)(scope);
    expect(element.text()).toBe('this is the highlightjs directive');
  }));
});