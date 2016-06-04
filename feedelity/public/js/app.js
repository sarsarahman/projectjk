'use strict';

// Declare app level module which depends on filters, and services
angular.module('feedelity', ['feedelity.filters', 'feedelity.services', 'feedelity.directives', 'ngRoute', 'ngSanitize', 'ngFileUpload', 'ui.bootstrap','ui.bootstrap.datetimepicker','ui.select','ngAutocomplete']).
config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
    $routeProvider.
    when('/', {
        templateUrl: 'partial/dashboard'
    }).
    when('/articles/pending', {
        templateUrl: 'partial/articlesnew',
        controller: ArticlesCtrl,
        type: 'pending'
    }).
    when('/articles/approved', {
        templateUrl: 'partial/articlesnew',
        controller: ArticlesCtrl,
        type: 'approved'
    }).
    when('/articles/starred', {
        templateUrl: 'partial/articlesnew',
        controller: ArticlesCtrl,
        type: 'starred'
    }).
    when('/articles/deleted', {
        templateUrl: 'partial/articlesnew',
        controller: ArticlesCtrl,
        type: 'deleted'
    }).
    when('/feeds', {
        templateUrl: 'partial/feedsnew',
        controller: FeedsCtrl
    }).
    when('/cats', {
        templateUrl: 'partial/catsnew',
        controller: CategorysCtrl
    }).
    when('/tags', {
        templateUrl: 'partial/tagsnew',
        controller: TagsCtrl
    }).
    when('/locations', {
        templateUrl: 'partial/locationsnew',
        controller: LocationsCtrl
    }).
    when('/staffs', {
        templateUrl: 'partial/staffsnew',
        controller: StaffsCtrl
    }).
    when('/staffsrole', {
        templateUrl: 'partial/staffsrole',
        controller: StaffRoleCtrl
    }).
    when('/users', {
        templateUrl: 'partial/usersnew',
        controller: UsersCtrl
    }).
    otherwise({
        // redirectTo: '/articles/pending'
        redirectTo: '/'
    });
    $locationProvider.html5Mode(true).hashPrefix('!');
}]);