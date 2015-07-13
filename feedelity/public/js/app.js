'use strict';

// Declare app level module which depends on filters, and services
angular.module('feedelity', ['feedelity.filters', 'feedelity.services', 'feedelity.directives', 'ngRoute', 'ngSanitize', 'ngFileUpload', 'ui.bootstrap','ui.bootstrap.datetimepicker','ui.select']).
config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
    $routeProvider.
    when('/articles/pending', {
        templateUrl: 'partial/articles',
        controller: ArticlesCtrl,
        type: 'Pending'
    }).
    when('/articles/approved', {
        templateUrl: 'partial/articles',
        controller: ArticlesCtrl,
        type: 'Approved'
    }).
    when('/articles/starred', {
        templateUrl: 'partial/articles',
        controller: ArticlesCtrl,
        type: 'starred'
    }).
    when('/feeds', {
        templateUrl: 'partial/feeds',
        controller: FeedsCtrl
    }).
    when('/cats', {
        templateUrl: 'partial/cats',
        controller: CategorysCtrl
    }).
    when('/tags', {
        templateUrl: 'partial/tags',
        controller: TagsCtrl
    }).
    when('/locations', {
        templateUrl: 'partial/locations',
        controller: LocationsCtrl
    }).
    when('/users', {
        templateUrl: 'partial/users',
        controller: FeedsCtrl
    }).
    otherwise({
        redirectTo: '/articles/pending'
    });
    $locationProvider.html5Mode(true).hashPrefix('!');
}]);