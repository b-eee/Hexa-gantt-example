import loginComponent from './login/login.component'
import loginSelectorComponent from './login-selector/loginSelector.component'

const loginModule = angular.module('app.login', [])
.component('loginComponent', loginComponent)
.component('loginSelectorComponent', loginSelectorComponent)

loginModule.$inject = ['$http','$q']

// export this module
export default loginModule;
