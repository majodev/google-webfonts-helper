'use strict';

describe('Controller: FontsCtrl', function () {

  // load the controller's module
  beforeEach(module('googleWebfontsHelperApp'));

  var FontsCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    FontsCtrl = $controller('FontsCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});
