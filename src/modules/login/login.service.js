export default class LoginService{ 
 
    constructor($q, $http, $location, dataService) {
        this.$http = $http;
        this.$location = $location;
        this.$q = $q;
        this.dataService = dataService;
        this.error = false;
        this.loading = false;
    }

    logout() {
        window.localStorage.clear()
        sessionStorage.clear()
        this.$location.url('/login');
    }

    login(loginData) {
        return this.$q(async (resolve, reject) => {
            const response = await this.$http.post("/api/login", loginData).catch(e => reject(e));
            if(response.data == null || response.data == undefined) {
                
               
                this.error = true;
                this.loading = false;
                // this.$location.reload()
                resolve()
            }
            if(response.data != null){
                localStorage.setItem('token', response.data.token);
            }
            
            resolve();
        });
    }

    async isLoggedIn() {
        return localStorage.getItem('token');
    }

    getWorkspaces() {
        return this.$http.get("/api/workspaces");
    }

    getProjects(wsId) {
        return this.$http.get(`/api/workspaces/${wsId}/applications`);
    }
}
   
    