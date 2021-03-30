import { Utils } from "../../services/utils";
import moment from "moment";

export default class NewItem {
    constructor($scope, ganttService, dataService) {
        this.$scope = $scope;
        this.ganttService = ganttService;
        this.dataService = dataService;
        this.openTaskInfo = $scope.$on('openNewItem', (e, taskId, x, y, calledfrombutton, defaultValue) => {
            this.resetData();
            this.openTooltip(taskId, x, y, calledfrombutton);
            if(calledfrombutton == false){
                this.dragFormInitData(defaultValue);
            }
        });
        this.closeTaskInfo = $scope.$on('closeNewItem', (e) => {
            this.closeTooltip();
        });

        this.show = false;
        this.positionType = 'TL'; // 'NR', 'TR', 'BL', 'TL'
        this.newTaskId = null;
        this.calledfrombutton = false;
        this.submitDisabled = false;
        this.room = '';
        this.client = '';
        this.mainMenuSelected = '';
        this.optionMenuSelected = '';
    }
    
    resetData() {
        this.client = this.getClient()
        this.mainMenuSelected = this.getMainMenu()
        this.optionMenuSelected = this.getOptionMenu()
        this.task = {
            personInCharge: "",
            shopEmailAddress: "",
            person: "",
            endTell: "",
            email: "",
            mainMenu: "",
            optionMenu: "",
            notes: "",
            roomId: "",
            roomName: "",
            reservationStartDate: "",
            reservationEndDate: "",
            reservationStartTime: "",
            reservationEndTime: "",
            reservationStatus: "本予約",
            COLOR: ""
        };
        this.updateClient();
    }

    dragFormInitData(defaultValue){
        // Init Date time
        this.task.reservationStartDate = defaultValue.startDate
        this.task.reservationEndDate = defaultValue.endDate
        this.task.reservationStartTime = defaultValue.startTime
        this.task.reservationEndTime = defaultValue.endTime
        this.task.row = defaultValue.rowID
        // Init time
        this.calInterval()
        // Setup Room
        this.room = this.getRoom(defaultValue.roomName)
        this.task.roomId = this.room.i_id
        this.task.roomName = this.room.name
    }

    openTooltip(taskId, x, y, calledfrombutton) {
        if(calledfrombutton === true){
            this.calledfrombutton = true;
        }else{
            this.calledfrombutton = false;
        }
        this.submitDisabled = false;
        this.newTaskId = taskId;
        this.position(x, y);
        this.updateOptionMenu()
        this.updateMainMenu()
        this.show = true;
        if(!calledfrombutton){
            setTimeout(() => {
                this.$scope.$apply(() => {
                    this.positionInBounds();
                });
            }, 0)
        }
    }

    closeTooltip() {
        this.$scope.$emit('setNewTaskID', {id: ''});
        this.show = false;
        this.onClose();
    }

    positionInBounds() {
        var isOut = Utils.isOutOfViewport(this.$scope.$divContainer);
        var boundings = this.$scope.$divContainer.getBoundingClientRect();
        this.positionType = 'TL';

        //45 15 and 30 are value got from css considering the positionning of the tooltip (30px 30px) if tooltip size change, change the value
        if (isOut.left) {
            this.positionType = isOut.top ? 'BL' : 'TL';
            this.$scope.$divContainer.style.left = (boundings.x + boundings.width - 45) + 'px';
        }
        if (isOut.right) {
            this.positionType = isOut.top ? 'BR' : 'TR';
            this.$scope.$divContainer.style.left = (boundings.x - boundings.width + 45) + 'px';
        }

        if (isOut.top) {
            this.positionType = this.positionType.includes('R') ? 'TR' : 'TL';
            this.$scope.$divContainer.style.top = (boundings.y + boundings.height) + 15 + 'px';
        }
        if (isOut.bottom) {
            this.positionType = this.positionType.includes('R') ? 'BR' : 'BL';
            this.$scope.$divContainer.style.top = (boundings.y - boundings.height) - 30 + 'px';
        }
    }

    position(x, y) {
        this.$scope.$divContainer.style.left = x + 'px';
        this.$scope.$divContainer.style.top = y + 'px';
    }

    removeNewTaskPlaceholder(rowID){
        for(let i = 0; i < this.dataService.data.length; i++){
            if(this.dataService.data[i].id == rowID){
                for(let j = 0; j < this.dataService.data[i].tasks.length; j++){
                    if(this.dataService.data[i].tasks[j].id == this.newTaskId){
                        this.dataService.data[i].tasks.splice(j, 1);
                    }
                }
            }
        }
    }

    closeNewItemForm(rowID) {
        this.removeNewTaskPlaceholder(rowID);
        this.closeTooltip();
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

    getColor() {
        return this.task ? {"background-color": this.task.COLOR} : {}
    }

    updateRoom() {
        this.task.roomId = this.room.i_id
        this.task.roomName = this.room.name
    }

    updateClient() {
        this.task.personInCharge = this.client.name
        this.task.shopEmailAddress = this.client.email
    }

    updateMainMenu() {
        let div = document.getElementById("div_main_menu");
        if (this.mainMenuSelected.menuName == "手動入力") {
            div.style.display = "flex";
            this.task.mainMenu = "";
        }else {
            div.style.display = "none";
            this.task.mainMenu = this.mainMenuSelected.menuName;
        }
    }

    updateOptionMenu() {
        let div = document.getElementById("div_option_menu");
        if (this.optionMenuSelected.menuName == "手動入力") {
            div.style.display = "flex";
            this.task.optionMenu = "";
            return; 
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

    submitNewItemForm(rowID) {
        //MADE FROM DRAG
        if(this.calledfrombutton === false){
            this.submitNewItemFormNotButton(rowID)
            return
        }
        this.submitNewItemFormButton(rowID)
    }

    async submitNewItemFormButton(rowID){
        if(this.dataService.countingDown){return}
        this.submitDisabled = true;
        let data = this.collectFormData()
        this.closeNewItemForm(rowID)
        // this.$scope.$emit('autoMoveCall', data)
        await this.dataService.createNewItem(data).catch((e) => {
            this.dataService.showToaster('error', "エラー" , e)
        });
    }

    async submitNewItemFormNotButton(rowID){
        this.submitDisabled = true;
        let data = this.collectFormData()
        await this.dataService.createNewItem(data).catch((e) => {
            this.dataService.showToaster('error', "エラー" , e)
        });
        this.closeNewItemForm(rowID)
        this.dataService.addSavePoint();
        this.$scope.$emit('setNewTaskID', { id: '' });
        this.$scope.$apply()
    }

    collectFormData() {
        let data = this.task;
        data["FROM"] = moment(Utils.generateDateTimeByDate(data.reservationStartDate, data.reservationStartTime));
        data["TO"] = moment(Utils.generateDateTimeByDate(data.reservationEndDate, data.reservationEndTime));
        return data;
    }

    isOverSize(){
        return (this.$window.screen.width > 1000)
    }

    getRowOptions() {
        for(let row of this.dataService.data){
            if(row.id === this.task.row){
                if(row.data.OPTION === undefined || row.data.OPTION === null){return null}
                let test = row.data.OPTION.split(',')
                return test
            }
        }
    }
    
}