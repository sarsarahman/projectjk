'use strict';

/* Directives */

angular.module('feedelity.directives', []).
  directive('appVersion', ['version', function(version) {
    return function(scope, elm, attrs) {
      elm.text(version);
    };
  }]);


 // angular.module('feedelity.directives', []).
 // directive('errSrc', function() {
 //  return {
 //    link: function(scope, element, attrs) {

 //      scope.$watch(function() {
 //          return attrs['ngSrc'];
 //        }, function (value) {
 //          if (!value) {
 //            element.attr('src', attrs.errSrc);  
 //          }
 //      });

 //      element.bind('error', function() {
 //        element.attr('src', attrs.errSrc);
 //      });
 //    }
 //  }});
