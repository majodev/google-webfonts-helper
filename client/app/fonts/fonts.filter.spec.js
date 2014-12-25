'use strict';

describe('Filter: fonts', function () {

  // load the filter's module
  beforeEach(module('googleWebfontsHelperApp'));

  // initialize a new instance of the filter before each test
  var fonts;
  beforeEach(inject(function ($filter) {
    fonts = $filter('fonts');
  }));

  it('should return the input prefixed with "fonts filter:"', function () {
    var text = 'angularjs';
    expect(fonts(text)).toBe('fonts filter: ' + text);
  });

});
