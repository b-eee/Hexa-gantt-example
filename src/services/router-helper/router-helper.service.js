import appRoutes from './app-routes';

export default function routerHelper($stateProvider, $urlRouterProvider, $locationProvider) {
	'ngInject';

	$locationProvider.html5Mode({enabled: false}); // setting html5 mode to remove !# from url //I can't get routing to work when enabled // if false, this causes page to load twice after login, 
	
	$urlRouterProvider.otherwise('/'); // setting default route

	appRoutes.forEach((route) => {
		$stateProvider.state(route);
	});
}
