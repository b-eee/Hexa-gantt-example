import { Utils } from "../../services/utils";

export default class EditItem {
    
    constructor($scope, dataService) {
        this.$scope = $scope;
        this.dataService = dataService;
        this.room = '';
        this.client = '';
        this.mainMenuSelected = '';
        this.optionMenuSelected = '';
        this.originalRowId = '';
        this.openTaskInfo = $scope.$on('openTaskInfo', (e, task, x, y) => { 
            this.getTaskInfo(task, x, y);
        });

        this.task = {}
        this.row;
    }

    resetData(){
        this.originalRowId = "";
        this.task = null;
    }

    getRow(){
        for(let row of this.dataService.data){
            if(row.data.name === this.task.roomName){
                this.row = row;
            }
        }
    }

    getTaskInfo(task,x,y){
        this.resetData();
        this.originalRowId = task.rowId
        this.room = this.getRoom(task.data.roomName)
        this.client = this.getClient(task.data.personInCharge)
        this.mainMenuSelected = this.getMainMenu(task.data.mainMenu)
        this.optionMenuSelected = this.getOptionMenu(task.data.optionMenu)
        this.task = task.data;
        this.task["insertDate"] = task.data.insertDate ? new Date(task.data.insertDate) : null
        this.task["reservationStartDate"] = task.data.reservationStartDate ? new Date(task.data.reservationStartDate) : null
        this.task["reservationEndDate"] = task.data.reservationEndDate ? new Date(task.data.reservationEndDate) : null

        this.calInterval()
        this.getRow()
        this.updateMainMenu(false)
        this.updateOptionMenu(false)
    }

    getRoom(target){
        if (this.dataService.tasks.length <= 0) {return null}
        for (var task of this.dataService.tasks){
            if (task.name == target){
                return task
            }
        }
        return this.dataService.tasks[0]
    }

    getClient(target){
        if (this.dataService.clients.length <= 0) {return null}
        for (var client of this.dataService.clients){
            if (client.name == target){
                return client
            }
        }
        return this.dataService.clients[0]
    }

    getMainMenu(target) {
        if (this.dataService.mainMenus.length <= 0) {return null}
        for (var menu of this.dataService.mainMenus){
            if (menu.menuName == target){
                return menu
            }
        }
        return this.dataService.mainMenus[0]
    }

    getOptionMenu(target) {
        if (this.dataService.optionMenus.length <= 0) {return null}
        for (var menu of this.dataService.optionMenus){
            if (menu.menuName == target){
                return menu
            }
        }
        return this.dataService.optionMenus[0]
    }

    async submitEditItem(){
        let editTask = this.task;
        let originalRowId = this.originalRowId;
        await this.dataService.editTask(editTask, originalRowId).then((data)=>{
            this.$scope.$emit('closeTaskInfo')
        })
    }

    getColor() {
        return {"background-color": this.task.COLOR}
    }

    updateRoom() {
        this.task.roomId = this.room.i_id
        this.task.roomName = this.room.name
    }

    updateClient() {
        this.task.personInCharge = this.client.name
        this.task.shopEmailAddress = this.client.email
    }

    updateMainMenu(reset=true) {
        let div = document.getElementById("div_edit_main_menu");
        if (this.mainMenuSelected.menuName == "手動入力") {
            div.style.display = "flex";
            if (reset) {
                this.task.mainMenu = "";
            }
        }else {
            div.style.display = "none";
            this.task.mainMenu = this.mainMenuSelected.menuName;
        }
    }

    updateOptionMenu(reset=true) {
        let div = document.getElementById("div_edit_option_menu");
        if (this.optionMenuSelected.menuName == "手動入力") {
            div.style.display = "flex";
            if (reset) {
                this.task.optionMenu = "";
            }
        }else {
            div.style.display = "none";
            this.task.optionMenu = this.optionMenuSelected.menuName;
        }
    }

    calTime() {
        let startDate = this.task.reservationStartDate
        let endDate = this.task.reservationEndDate
        let startTime = this.task.reservationStartTime
        let endTime = this.task.reservationEndTime
        let totalTime = this.task.reservationTotalTime
        let totalDays = 0
        let totalTimeArr = [0, 0]
        let hour = 0
        let minute = 0

        if (totalTime) {
            if (totalTime.indexOf("日") != -1) {
                let tempArr = totalTime.split("日")
                totalDays = +tempArr[0].trim()
                totalTimeArr = tempArr[1].trim().split(":")
            }else {
                totalTimeArr = totalTime.split(":")
            }
            if(totalTimeArr.length == 2){
                hour = +totalTimeArr[0]
                minute = +totalTimeArr[1]
            }
        }

        if(startDate && startTime && totalTime){
            let tempDate = Utils.generateDateTimeByDate(startDate, startTime)
            tempDate = moment(tempDate).add(hour, "hours").add(minute, "minutes")
            if (totalDays > 0) {
                tempDate.add(totalDays, "days")
            }
            this.task.reservationEndTime = moment(tempDate).format('HH:mm')
            this.task.reservationEndDate = tempDate.toDate()

        }else if(endDate && endTime && totalTime){
            let tempDate = Utils.generateDateTimeByDate(endDate, endTime)
            tempDate = moment(tempDate).add(-hour, "hours").add(-minute, "minutes")
            if (totalDays > 0) {
                tempDate.add(-totalDays, "days")
            }
            this.task.reservationStartTime = moment(tempDate).format('HH:mm')
            this.task.reservationStartDate = tempDate.toDate()
        }

    }

    calInterval() {
        let startDate = this.task.reservationStartDate
        let endDate = this.task.reservationEndDate
        let startTime = this.task.reservationStartTime
        let endTime = this.task.reservationEndTime
        
        if (startDate && endDate && startTime && endTime) {
            let realStartDate = moment(Utils.generateDateTimeByDate(startDate, startTime))
            let realEndDate = moment(Utils.generateDateTimeByDate(endDate, endTime))
  
            let diff = realEndDate.diff(realStartDate);
            let diffDays = realEndDate.diff(realStartDate, "days");
            let diffTime = moment.utc(diff).format("HH:mm");
            if (diffDays > 0) {
                this.task.reservationTotalTime = diffDays + "日 " + diffTime
            } else {
                this.task.reservationTotalTime = diffTime
            }
        }
    }
}
