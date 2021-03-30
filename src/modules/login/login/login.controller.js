export default class LoginController {

	constructor($scope, $location, loginService, dataService) {
        'ngInject';
        this.dataService = dataService;

        this.$scope = $scope
        this.$location = $location;
        this.loginService = loginService;
        this.username = ''
        this.password = ''
        this.loading = false;
        this.error = false;
    }
    
    $onInit() {
        this.dataService.clearEverything();
    }

    async formSubmit() {
        this.loginService.loading = true;
        this.loginService.error = false;
        let loginData = {
            "email": this.username,
            "password": this.password
        }
        await this.loginService.login(loginData).then((response) => {
            this.error = true;
            this.loginService.loading = false;
        });
        this.$location.path('/login-selector');
        this.$scope.$apply();
    }
}