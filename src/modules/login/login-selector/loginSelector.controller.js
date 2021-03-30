export default class LoginSelectorController {

	constructor($log, $scope, $location, $http, loginService, dataService) {
        'ngInject';
        this.$log = $log;
        this.$scope = $scope
        this.$location = $location;
        this.$http = $http;
        this.loginService = loginService;
        this.dataService = dataService;
        this.workspaces = [];
        this.workspaceSelected;
        this.projects = [];
        this.projectSelected;
    }

    $onInit() {
        this.loginService.getWorkspaces().then((data) => {
            
            this.workspaces = data.data.workspaces;
            if(this.workspaces == undefined){return}
            if(this.workspaces.length === 1) {
                this.workspaceSelected = this.workspaces[0].workspace_id;
                this.getProjects();
                
            }
        })
    }

    getProjects() {
        if(!this.workspaceSelected) { return; }
        this.loginService.getProjects(this.workspaceSelected).then((data) => {
            this.projects = data.data;
            this.loginInIfOneWSOneProj()
        });
    }

    loginInIfOneWSOneProj(){
        if(this.projects.length === 1){
            this.projectSelected = this.projects[0].application_id
            this.dataService.projectSelected = this.projectSelected
            this.formSubmit()
        }
    }

    formSubmit() {
        let token = localStorage.getItem('token');
        let url = `/api/workspaces/${this.workspaceSelected}/select`;
        this.$http.post(url, token).then((data) =>{
            this.dataService.projectSelected = this.projectSelected
            localStorage.setItem('projectSelected', this.projectSelected)
            this.$location.url('/');
        })
    }
}