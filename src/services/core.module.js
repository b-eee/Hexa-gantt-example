import routerHelperService from './router-helper/router-helper.service';

import DataService from './data.service';
import './gantt/gantt.module';
import './toaster/toaster.module';
import '../components/components.modules';

const coreModule = angular.module('app.core', [
	'ui.router',
	'gantt-custom',
	'app.components',
	'app.toaster'
])
.service('dataService', DataService)

coreModule.$inject = ['dataService']

// inject services, config, filters and re-usable code
// which can be shared via all modules
coreModule.config(routerHelperService)
coreModule.run(
	function authRouting($state, $rootScope, $urlRouter, loginService) {
		$rootScope.$on('$stateChangeStart', function(event, toState) {	
			var requireAuth;
			if (toState.data) {
				requireAuth = toState.data.requireAuth;
			}
			if (requireAuth) {
				var auth = loginService.isLoggedIn();
				if (!auth) {
					event.preventDefault();
					$state.go('login');
				} else {
					$urlRouter.sync();
				}
			}
		});
	}
);



export default coreModule;
