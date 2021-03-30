import angular from 'angular';
import './src/services/core.module';
import './src/modules/index';
import './styles.css';

angular.module('app', [
  'app.core',
  'app.main',
  'app.login',
]).config(["$httpProvider", function ($httpProvider, $location) {
  $httpProvider.interceptors.push(function($q, $location) {
    return {
      // optional method
      request: function(config) {
        config.headers = config.headers || {};
        if (localStorage.getItem('token')) {
          // may also use sessionStorage
          config.headers.Authorization = 'Bearer ' + localStorage.getItem('token');
        }
        return config || $q.when(config);
      },
      responseError: function(response) {
        if (response.status === 401) {
          window.localStorage.clear()
          sessionStorage.clear()
          $location.url('/login');
        }
        return response || $q.when(response);
      }
    }
  });
}]).directive('scopeElement', function () {
  return {
      restrict:"A", // E-Element A-Attribute C-Class M-Comments
      replace: false,
      link: function($scope, elem, attrs) {
        $scope[attrs.scopeElement] = elem[0];
      }
  };
})