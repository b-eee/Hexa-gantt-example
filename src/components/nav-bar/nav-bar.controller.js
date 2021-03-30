export default class NavBarComponent {
    constructor($location, loginService) {
        this.$location = $location;
        this.loginService = loginService;
    }

    
    logout() {
        this.loginService.logout();
    }
}