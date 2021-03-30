export default class MenuController {

	constructor($log, $scope, $timeout, ganttService, dataService, $window) {
        'ngInject';
        this.$log = $log;
        this.$scope = $scope
        this.$timeout = $timeout;
        this.service = ganttService;
        this.dataService = dataService;
        this.$window = $window
        this.fromDate;
        this.toDate;
        this.backClicked = false;
    };

    setSelectedCategory(optionval){
        let tempOptions = this.dataService.options;
        let selectedName = optionval.value
        tempOptions.forEach((options) => {
            if(option.name == 'CATEGORY'){
                options.forEach((option) => {
                    if(option.value == selectedName){
                        option.selected = true;
                    }
                    else{
                        option.selected = false;
                    }
                })
            }
        });
    }

    //Sends to service update
    updateDates() {
        const from = (this.fromDate || this.service.fromDate).toISOString().slice(0,10);
        const to = (this.toDate || this.service.toDate).toISOString().slice(0,10);
        this.service.updateDates(from, to)
    }

    moveDateRange(days) {
        this.service.moveDateRange(days);
        // for(let taskObj of this.service.ganttTasksArr){
        //     this.service.resetTaskNamesToCenter(taskObj.childElement)
        //     this.service.addOutOfBoundsText(taskObj.task, taskObj.childElement)
        // }
    }

    setDateToToday(){
        this.service.setDateToToday()

        // for(let taskObj of this.service.ganttTasksArr){
        //     this.service.resetTaskNamesToCenter(taskObj.childElement)
        //     this.service.addOutOfBoundsText(taskObj.task, taskObj.childElement)
        // }
    }

    disableBack() {
        return this.backClicked || this.dataService.apiInProgress
    }

    revertBack(){
        if(this.dataService.currentSavedPoint > 0){
            this.backClicked = true;
        }
        this.dataService.revertBack();
    }

    test(){
        this.$timeout(()=>{
            this.dataService.sendMessage()
        }, 3000)
    }

    forward(){

        this.dataService.forward();
    }

    isOverSize(){
        return (this.$window.screen.width > 1000)
    }

    addNewTaskFromButton(){
        this.service.recursionDataArray = [];
        this.service.recursionTaskIDS = [];
        this.service.checkedRows = [];

        this.dataService.newRowItem = {
            // name: null,
            // category: null,
            // options: null,
            rowID: null,
            task: null
        }
        // this.$scope.$emit('openNewItem')
        this.$scope.$broadcast( 'openTaskInfo' )
        this.service.openNewTaskFromButton()
    }

    filterByNumber(num) {
        this.dataService.filterNumber(num)
    }

    filterBySmoke(smoking) {
        this.dataService.filterSmoke(smoking)
    }

}