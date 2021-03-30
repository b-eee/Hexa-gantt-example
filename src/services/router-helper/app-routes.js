export default [
	{
		name: 'login',
		url: '/login',
		component: 'loginComponent'
	},
	{
		name: 'loginSelector',
		url: '/login-selector',
		component: 'loginSelectorComponent',
		requireAuth: true // our custom property
	},
	{
		name: 'mainModule',
		url: '/',
		component: 'mainComponent',
		requireAuth: true // our custom property
	}
];
