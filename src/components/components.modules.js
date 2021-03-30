import taskInformationComponent from './task-information/task-information.component'
import newItemComponent from './new-item/new-item.component';
import confirmMoveComponent from './confirm-move/confirm-move.component';
import navBarComponent from './nav-bar/nav-bar.component';
import ConfirmationButtonComponent from './confirmation-button/confirmation-button.component';
import LoaderComponent from './loader/loader.component';
import taskNameComponent from './task-name/task-name.component';
import editItemComponent from './edit-item/edit-item.component';
// import carInfoComponent from './car-info/car-info.component';
import countDownComponent from './count-down/count-down.component';

const componentsModule = angular.module('app.components', [])
.component('taskInformationComponent', taskInformationComponent)
.component('newItemComponent', newItemComponent)
.component('confirmMoveComponent', confirmMoveComponent)
.component('navBarComponent', navBarComponent)
.component('confirmationButtonComponent', ConfirmationButtonComponent)
.component('loaderComponent', LoaderComponent)
.component('taskNameComponent', taskNameComponent)
.component('editItemComponent', editItemComponent)
// .component('carInfoComponent', carInfoComponent)
.component('countDownComponent', countDownComponent)

componentsModule.$inject = ['$http','$q']

export default componentsModule;
