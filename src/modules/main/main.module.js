import mainComponent from './main.component'
import menuComponent from './menu/menu.component'
import ganttComponent from './gantt/gantt.component'
import ganttService from './gantt.service'
import loginService from '../login/login.service'
import './main.css';

const mainModule = angular.module('app.main', ['app.core'])
.component('ganttComponent', ganttComponent)
.component('menuComponent', menuComponent)
.component('mainComponent', mainComponent)
.service('ganttService', ganttService)
.service('loginService', loginService)

mainModule.$inject = ['$http','$q', 'ganttService','loginService']

// export this module
export default mainModule;
