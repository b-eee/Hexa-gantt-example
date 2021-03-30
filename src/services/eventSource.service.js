
class EventSourceClass {

    constructor(dataService){
        this.dataService = dataService;
        this.projectSelected = this.dataService.getProjectSelected()
        this.eventTest = new EventSource("/api/applications/" + this.projectSelected +"/datastores/PROPOSITION")



        this.eventTest.onmessage = () =>{
            console.log('essage from serve?')
        }









    }


}