import ganttTmpl from './gantt.src.tmpl.html'

export default class GanttController {

    constructor($log, $scope, ganttService, dataService, $timeout, $q, $state, toaster) {
		'ngInject';
		this.$log = $log;
        this.$scope = $scope;
        this.service = ganttService;
        this.dataService = dataService;
        this.$timeout = $timeout;
        this.toaster = toaster;
        this.$q = $q;
        this.$state = $state;
        this.headerName = ' '
        this.ganttTemplateURL = ganttTmpl;
        this.maxHeight = this.setMaxHeight();
        this.isDragging = false;
        this.isResizing = false;
        this.newTaskId = null;
        this.recursionDataArray;
        this.recursionTaskIDS = []
        this.dataBackup;
        this.endRecursion = false;
        this.checkedRows;
        this.RecursionTracking;
        this.howManyStartingRecurions = 0;
        this.howManySubRecurions;
        this.originalTaskPosition;
        this.originalRowID;

        var self = this;
        this.$scope.registerApi = (api) => {
            api.core.on.ready(self.$scope, function() {

                //CLICK FOR TASK, then open tooltip
                api.directives.on.new(self.$scope, function (dName, dScope, dElement) {
                if (dName !== 'ganttTask') { return; }
                    dElement.on('mouseup', (event) => {
                        self.$scope.$apply(() => {
                            if(self.isResizing == false && self.isDragging == false && !self.newTaskId){
                                self.$scope.$broadcast('openTaskInfo', {
                                        name : dScope.task.model.name,
                                        from: dScope.task.model.from,
                                        to: dScope.task.model.to,
                                        data: dScope.task.model.data,
                                    },
                                    event.clientX,
                                    event.clientY
                                );
                            }
                        });
                    });
                });

                api.directives.on.new(self.$scope, function (dName, dScope, dElement) {
                    if (dName !== 'ganttTask') { return; }
                    dElement.on('mousedown', () => {
                        self.$scope.$apply(() => {
                            self.originalTaskPosition = {
                                color: dScope.task.model.color,
                                data: dScope.task.model.data,
                                from: dScope.task.model.from,
                                id: dScope.task.model.id,
                                movable: dScope.task.model.movable,
                                name: dScope.task.model.name,
                                to: dScope.task.model.to
                            }
                        });
                    });
                });

                //ON BEGIN OF MOVING A TASK
                api.tasks.on.moveBegin(self.$scope, function(task) {
                    self.originalRowID = task.row.model.data.i_id;
                    self.recursionDataArray = [];
                    self.recursionTaskIDS = [];
                    self.checkedRows = [];
                    self.$scope.$digest()
                    self.updateDraggingTaskMovable(task);
                    let dataTask = self.aConvertGanttTaskToDataTask(task);
                    self.aCheckAndAddTaskData(dataTask);

                })

                //WHILE MOVING
                api.tasks.on.move(self.$scope, function(task) {
                    self.isDragging = true;
                })

                //ON END OF MOVING A TASK
                api.tasks.on.moveEnd(self.$scope, function(task) {
                    if(!self.isDragging){ return; }
                    self.dataService.originalTaskMovedID = task.model.data.i_id;
                    console.log("JUST MOVED L ", task, self.dataService.originalTaskMovedID)

                    self.floorDate(task);
                    self.updateAndAutoMove(task);
                    self.isDragging = false;
                })

                //ON BEGIN OF RESIZING A TASK
                api.tasks.on.resizeBegin(self.$scope, function(task){
                    self.isResizing = true;
                    self.recursionDataArray = [];
                    self.recursionTaskIDS = [];
                    self.checkedRows = [];
                    let dataTask = self.aConvertGanttTaskToDataTask(task)
                    self.aCheckAndAddTaskData(dataTask)
                })

                //ON END OF RESIZING A TASK
                api.tasks.on.resizeEnd(self.$scope, function(task){
                    if(self.newTaskId){ return }

                    self.floorDate(task);
                    self.dataService.updateTask(task);
                    self.autoMoveTask(task);
                    self.isResizing = false;
                })

                api.tasks.on.drawBegin(self.$scope, function(task){
                    self.newTaskId = task.model.id;
                })


                api.directives.on.new(self.$scope, function (dName, dScope, dElement) {
                    if (dName !== 'ganttColumnHeader') { return }  //must be ganttColumnHeader   without header it's the lower part
                    let columnDate = dScope.column.date //is moment
                    let columnDateStr = columnDate.format('YYYY/M/D')

                    let holidays = self.dataService.holidays;
                    for( let holiday of holidays){
                        if(holiday.Date == columnDateStr){
                            dScope.column.$element[0].className='gantt-column-header ng-binding ng-scope gantt-header-holiday'
                        }
                    }
                })

                //RED TINT ON HOLIDAY COLUMNS
                api.directives.on.new(self.$scope, function (dName, dScope, dElement) {
                    if (dName !== 'ganttColumn') { return; }
                    let columnDate = dScope.column.date //is moment
                    let columnDateStr = columnDate.format('YYYY/M/D')
                    let holidays = self.dataService.holidays;
                    for( let holiday of holidays){
                        if(holiday.Date == columnDateStr){
                            dScope.column.$element[0].className='gantt-column gantt-foreground-col gantt-column-holiday'
                        }
                    }
                });

                //MAKING MONTH ON CELL AS NUMBER
                api.directives.on.new(self.$scope, function (dName, dScope, dElement) {
                    if (dName !== 'ganttColumnHeader') { return; }
                    //THIS IS FROM THE COLUMN
                    setTimeout(()=>{
                        let columnDate = dScope.column.date //is moment
                        let columnDateStr = columnDate.date()
                        if(columnDateStr == 1){
                            let month = (columnDate.month()+1) + '月'
                            //add number to cornerlet test = document.getElementById('monthNote')
                            var div = document.createElement('div');
                            div.appendChild(document.createTextNode(month));
                            div.classList.add("monthNoteExtra");
                            dElement[0].appendChild(div);
                        }
                    }, 500)
                });

                api.directives.on.new(self.$scope, function (dName, dScope, dElement) {
                    if (dName !== 'ganttHeaderColumns') { return;}
                    let monthNum = angular.element(document.getElementById("monthNote"))[0];
                    dElement[0].appendChild(monthNum);
                })


                api.tasks.on.drawBegin(self.$scope, function(task){
                    self.newTaskId = task.model.id;
                })

                api.tasks.on.drawEnd(self.$scope, function(task){
                    if(!self.newTaskId){ return; }
                    self.newTaskEndDrag(task)
                })
            })
        }
    };

    $onInit() {
        this.loadGantt();
    }

    loadGantt() {
        this.loading = true;
        this.dataService.load().then(() => {
            this.loading = false;
        }).catch((e) => {
            this.dataService.showToaster('error', "エラー" , e)
            // this.toaster.pop('error', "エラー" , e);
            this.loading = false;
        });
    }

    updateDraggingTaskMovable(task){
        let self = this;
        task.model.movable = {
            'enabled': true,
            'allowRowSwitching': function(task, targetRow){
                return self.dataService.checkIfCanMoveTo(task, targetRow)
            }
        }
    }

    async updateAndAutoMove(task){
        await this.dataService.updateTask(task, this.originalRowID);
        this.autoMoveTask(task);
    }

    newTaskEndDrag(task) {
        var boundings = task.$element[0].getBoundingClientRect();

        this.dataService.newRowItem = {
            name: task.row.model.data.CAR_NAME,
            category: task.row.model.data.CATEGORY,
            options: this.optionStrToArray(task.row.model.data.OPTION),
            rowID: task.row.model.id,
            task: task
        }

        //MAKES THE FORM VISIBLE
        this.$scope.$broadcast('openNewItem',
            this.newTaskId,
            boundings.left + (boundings.width * 0.5),
            boundings.top + (boundings.height * 0.5)
        );
    }

    resetNewTaskId() {
        this.newTaskId = null;
    }

    optionStrToArray(options){
        if(options != null){
            return options.split(',');
        }
    }

    drawTaskFactory() {
        return {
            id: Math.floor(10000000 + Math.random() * 90000000) + 1,
            name: '新しい予約'
        };
    }

    setMaxHeight() {
        var h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
        h -= 122;
        return h;
    }

   //floor the hours, mins, seconds so it eliminates the "caterpillar" effect
   //call this from the autoMoveTask once it's working, then can just pass the values taskTo/taskFrom
    floorDate(task) {
        const taskTo = task.model.to._d;
        const taskFrom = task.model.from._d;
        taskTo.setHours(0);
        taskTo.setMinutes(0);
        taskTo.setSeconds(0);
        taskFrom.setHours(0);
        taskFrom.setMinutes(0)
        taskFrom.setSeconds(0)
    }

   //CANT OVERLOAD IN JAVASCRIPT SO I NEED A CHECK IF .model IS UNDEFINED
    autoMoveTask(task) {
        this.endRecursion = false;
        let taskTo = task.model.to;
        let taskFrom = task.model.from;
        let taskId = this.getTaskId(task);

        ////////testing//////////
        this.aCheckAndAddTaskID(taskId);

        this.checkIfOverlap(this.findRowIDbyTaskID(taskId), taskId, taskTo, taskFrom, task);//THIS IS THE TASK THAT WAS MOVED
        this.$scope.$digest();
    }

    //THIS FUNCTION CHECKS IF A TASK OVERLAPS ANOTHER TASK AFTER BEING MOVED, BUT DOES NOTHING IF IT 'OVERLAPS' ITSELF
    checkIfOverlap(rowTaskIsInIndex, taskId, taskTo, taskFrom, task){
        if(this.endRecursion) {return}
        if(!this.dataService.data[rowTaskIsInIndex]) { return console.error(`can't find row`);}
        let overlappedTaskAmount=0;
        let singleOverlappedTask;
        for(let i = 0; i < this.dataService.data[rowTaskIsInIndex].tasks.length; i++){
            if(this.endRecursion) {break}
            let checkingTask = this.dataService.data[rowTaskIsInIndex].tasks[i]
            if(taskId == checkingTask.data.i_id){
                // console.log('MATCHED ITSELF, DONT DO ANYTHING')
            } else {
                let range = moment().range(checkingTask.from, checkingTask.to)
                let startOverlaps = range.contains(taskTo)
                let endOverlaps = range.contains(taskFrom) // this doesn't consider exact end points
                let overlaps = range.contains(taskFrom || taskTo)

                let secondRange = moment().range(taskFrom, taskTo)
                let secondOverlaps = secondRange.contains(checkingTask.from || checkingTask.to)

                //IF TRUE, NEED TO MOVE
                if(endOverlaps || startOverlaps || secondOverlaps || overlaps){ //Don't need -->? taskFrom.isSame(checkingTaskTo) ||
                    singleOverlappedTask = checkingTask;
                    overlappedTaskAmount++
                }
            }
        }

        if(overlappedTaskAmount === 1) {
            console.log('endRec', this.endRecursion)
            if(this.endRecursion) {return}
            console.log("singleOverlappedTask.data.fixed", singleOverlappedTask.data.fixed)
            if(singleOverlappedTask.data.fixed === "限定あり"){
                this.endRecursion = true;
                this.aRevertTasksToOriginalPositions();
                this.dataService.showToaster('error', "エラー" , "この日程で予約を入れることはできません")
                // this.toaster.pop('error', "エラー" , "この日程で予約を入れることはできません");
                return
            }
            if(this.aCheckingForEmptyRows(singleOverlappedTask) === false){
                this.howManyStartingRecurions++;
                this.dataService.idsAlreadyMoved = [];
                this.aRecursionStart(singleOverlappedTask, task)
            }
        } else if (overlappedTaskAmount > 1) {
            this.endRecursion = true;
            this.aRevertTasksToOriginalPositions();
            this.dataService.showToaster('error', "エラー" , "この日程で予約を入れることはできません")
            // this.toaster.pop('error', "エラー" , "この日程で予約を入れることはできません");
            return;
        }
    }


    aRecursionStart(checkingTask, originalTask) {
        if(this.endRecursion){ return; }
        if(this.aCheckingForEmptyRows(checkingTask) == true){
            // this.rMoveAndDeleteSavePosition(checkingTask) //THIS NEEDS A
        } else {
            let rowIDSThatMatchConditions = this.aCheckingRowWithCondition(checkingTask, originalTask); //RETURNS ARRAY OF ROW IDS


            //loop through the rows that match and try each ... ?
            //1) Check for empty space 2) skip 3) if none available, try first?
            if(rowIDSThatMatchConditions.length == 0) {
                this.endRecursion = true;
                this.aRevertTasksToOriginalPositions();
                this.dataService.showToaster('error', "エラー" , "この日程で予約を入れることはできません")
                return
            } else {
                this.aLoopThroughMatchedConditionsRows(rowIDSThatMatchConditions, checkingTask)
            }

        }
    }


    aLoopThroughMatchedConditionsRows(rowIDSThatMatchConditions, checkingTask) {

        if(this.endRecursion) { return; }

        let taskTo = checkingTask.to;
        let taskFrom = checkingTask.from;
        let taskId = this.getTaskId(checkingTask);

        for(let i = 0; i < this.dataService.data.length; i++){
            if(this.endRecursion){ break; }
            let singleOverlappedTask = null;

            if(rowIDSThatMatchConditions.includes(this.dataService.data[i].id)){
                console.log('the row', this.dataService.data[i])
                this.aDeleteMoveTask(checkingTask, this.dataService.data[i])

                let overlappedTaskAmount=0;
                for(let k = 0; k < this.dataService.data[i].tasks.length; k++){
                    if(this.endRecursion){ break; }
                    let nextTask = this.dataService.data[i].tasks[k]

                    if(this.recursionTaskIDS.includes(nextTask.data.i_id)){

                        // this.checkedRows.push(this.dataService.data[i].id)
                        console.log('this.checedRows lenght', this.checkedRows.length, rowIDSThatMatchConditions.length)
                        if( this.checkedRows.length < rowIDSThatMatchConditions.length){
                            this.checkedRows.push(this.dataService.data[i].id)
                            console.log('continue: ', this.dataService.data[i])
                            continue
                        } else {
                            console.log('breaking here? ',this.checkedRows.length, rowIDSThatMatchConditions.length)
                            this.endRecursion = true;
                            this.aRevertTasksToOriginalPositions()
                            this.dataService.showToaster('error', "エラー" , "この日程で予約を入れることはできません")
                            // this.toaster.pop('error', "エラー" , "この日程で予約を入れることはできません");
                            return
                        }
                    }

                    if(taskId == nextTask.data.i_id){
                        // console.log('MATCHED ITSELF, DONT DO ANYTHING')
                    } else {
                        let nextTaskTaskFrom = nextTask.from
                        let nextTaskTaskTo = nextTask.to
                        let range = moment().range(nextTaskTaskFrom, nextTaskTaskTo)
                        let startOverlaps = range.contains(taskTo)
                        let endOverlaps = range.contains(taskFrom)
                        let overlaps = range.contains(taskFrom || taskTo)

                        let secondRange = moment().range(taskFrom, taskTo)
                        let subSecondOverlaps = secondRange.contains(nextTaskTaskFrom || nextTaskTaskTo)

                        if(endOverlaps || startOverlaps || subSecondOverlaps || overlaps){
                            overlappedTaskAmount++
                            singleOverlappedTask = nextTask;
                        }
                    }
                }
                if(overlappedTaskAmount == 1) {
                    if(this.endRecursion) { return; }
                    if(singleOverlappedTask.data.fixed == "限定あり"){
                        continue;
                    }
                    if(this.aCheckingForEmptyRows(singleOverlappedTask)){
                        this.apiUpdateForAllMovedTasks();
                        this.endRecursion = true;
                    } else {
                        this.aRecursionStart(singleOverlappedTask, checkingTask);
                    }
                } else if (overlappedTaskAmount > 1) {
                    continue;
                }
            }
        }
    }

    async apiUpdateForAllMovedTasks() {
        for(let k = 0; k < this.dataService.data.length; k++){
            for(let p = 0; p < this.dataService.data[k].tasks.length; p++){
                if(this.recursionTaskIDS.includes(this.dataService.data[k].tasks[p].data.i_id)){
                    //send api here
                    console.log('API CALL HERE FOR TASK: ', this.dataService.data[k].tasks[p])
                    this.dataService.updateTaskRowAPI(this.dataService.data[k].tasks[p].data.i_id, this.dataService.data[k].name, this.recursionDataArray)
                }
            }
        }
    }

    aCheckingForEmptyRows(checkingTask) {
        let foundEmptyRow = false;
        for(let i = 0 ; i < this.dataService.data.length; i ++){
            let containsOptions = true;
            let containsCategory = true;

            //Checking if row contains options
            let dataRowOptions = [];

            //IF OPTIONS ARRAY IS EMPTY, SHOULD DEFAULT TO TRUE THEN
            if(this.dataService.data[i].data.OPTION != null){
                dataRowOptions = this.dataService.data[i].data.OPTION.split(',')
            }

            // console.log('dataRowOptions: ',dataRowOptions)// these are the ROW options
            // console.log('TASK OPTIONS,', checkingTask.data.option )
            if(!checkingTask.data.option[0] == ''){
                for(let j = 0; j < checkingTask.data.option.length; j++){
                    if(!dataRowOptions.includes(checkingTask.data.option[j])){
                        containsOptions = false;
                    }
                }
            }

            //checking category
            // console.log("Category matches; ", (this.dataService.data[i].data.CATEGORY != checkingTask.data.category))
            if(this.dataService.data[i].data.CATEGORY != checkingTask.data.category){
                containsCategory = false;
            }

            if(containsCategory && containsOptions){
                let thisRowHasFreeSpace = true;
                for(let k = 0; k <this.dataService.data[i].tasks.length; k++){
                    let isBlockingTask = this.dataService.data[i].tasks[k]
                    let isBlockingTaskTaskFrom = isBlockingTask.from
                    let isBlockingTaskTaskTo = isBlockingTask.to
                    let range = moment().range(checkingTask.from, checkingTask.to)

                    let startOverlaps = range.contains(isBlockingTaskTaskTo)
                    let endOverlaps = range.contains(isBlockingTaskTaskFrom) // this doesn't consider exact end points
                    let overlaps = range.contains(isBlockingTaskTaskFrom || isBlockingTaskTaskTo)
                    //turtle

                    let subSecondRange =  moment().range(isBlockingTaskTaskFrom, isBlockingTaskTaskTo)
                    let subOverlaps = subSecondRange.contains(checkingTask.from || checkingTask.to)

                    if(endOverlaps || startOverlaps || subOverlaps || overlaps){   //|| (!isBlockingTaskTaskFrom.isSame(checkingTask.to))
                        thisRowHasFreeSpace = false;
                    }
                }
                if(thisRowHasFreeSpace == true){
                    this.aDeleteMoveTask(checkingTask, this.dataService.data[i])
                    this.dataService.updateTaskRowAPI(checkingTask.data.i_id, this.dataService.data[i].name, this.recursionDataArray); //api api api api needed here
                    foundEmptyRow = true;
                    break;
                }
            } else { continue }
        }
        return foundEmptyRow
    }

    aDeleteMoveTask(task, newRow){
        console.log('aDeleteMoveTask, TASK: ', task, "NEW ROW: ", newRow)
        let originalTaskData = task;
        this.aCheckAndAddTaskData(originalTaskData);

        let taskID = this.getTaskId(task)
        let rowIndex = this.findRowIDbyTaskID(taskID)
        let rowID = this.getRowID(rowIndex)
        this.deleteTaskFromRow(taskID, rowIndex, rowID)

        this.moveTaskToRowVisually(task, newRow)
    }

    aCheckingRowWithCondition(task, originalTask) {
        //HERE NEEDS TO BE REPLACED WITH ROW IDS, NOT NAME, LATER
        console.log("===============aCheckingRowWithCondition   TASK:", task, "originalTask: ",originalTask)
        let rowIDSThatMatchConditions = [];

        let originalTaskRowName;
        if(originalTask.model != undefined) {
            originalTaskRowName = originalTask.model.data.car_name
        } else if (originalTask.data != undefined ) {
            originalTaskRowName = originalTask.data.car_name
        }

        for(let i = 0; i < this.dataService.data.length; i++){
            if( originalTaskRowName == this.dataService.data[i].name ){
                continue;
            } else {
                let containsOptions = true;
                let containsCategory = true;

                let dataRowOptions = [];
                if(this.dataService.data[i].data.OPTION != null){
                    dataRowOptions = this.dataService.data[i].data.OPTION.split(',')
                }

                if(!task.data.option[0] == ''){
                    for(let j = 0; j < task.data.option.length; j++){
                        if(!dataRowOptions.includes(task.data.option[j])){
                            containsOptions = false;
                        }
                    }
                }

                if(this.dataService.data[i].data.CATEGORY != task.data.category){
                    containsCategory = false;
                }

                if(containsCategory && containsOptions){
                    rowIDSThatMatchConditions.push(this.dataService.data[i].id)
                }
            }
        }
        return rowIDSThatMatchConditions
    }

    aCheckAndAddTaskID(taskID) {
        if(!this.recursionTaskIDS.includes(taskID)){
            this.recursionTaskIDS.push(taskID)
        }
    }

    aCheckAndAddTaskData(originalTaskData) {
        let someObj = {
            color: originalTaskData.color,
            data: {
                car_name: originalTaskData.data.car_name,
                car_type: originalTaskData.data.car_type,
                category: originalTaskData.data.category,
                customer_name: originalTaskData.data.customer_name,
                fixed: originalTaskData.data.fixed,
                from_hours: originalTaskData.data.from_hours,
                i_id: originalTaskData.data.i_id,
                option: originalTaskData.data.option, //check here
                title: originalTaskData.data.title,
                to_hours: originalTaskData.data.to_hours
            },
            from: originalTaskData.from,
            id: originalTaskData.id,
            movable: originalTaskData.movable,
            name: originalTaskData.name,
            to: originalTaskData.to
        }
        if(!this.recursionTaskIDS.includes(originalTaskData.data.i_id)){
            this.recursionDataArray.push(someObj)
            this.recursionTaskIDS.push(originalTaskData.data.i_id)
        }
    }

    aConvertGanttTaskToDataTask(task) {
        let dataTask = task;
        if(task.model != undefined) {
            let gTask = task.model;
            dataTask = {
                color: gTask.color,
                data: {
                    car_name: task.row.model.name, //check if this is updating correctly
                    car_type: gTask.data.car_type,
                    customer_name: gTask.data.customer_name,
                    fixed: gTask.data.fixed,
                    from_hours: gTask.data.from_hours,
                    i_id: gTask.data.i_id,
                    option: gTask.data.option, //option is array
                    title: task.row.model.name,
                    to_hours: gTask.data.to_hours,
                    category: gTask.data.category
                },
                from: gTask.from,
                to: gTask.to,
                id: gTask.id,
                movable: gTask.movable,
                name: gTask.name,
            }
        } else if (task.data != undefined) {
            // dataTask.data.car_name = dataRow.name
        }
        return dataTask
    }

    aRevertTasksToOriginalPositions(){
        for(let i = 0; i < this.dataService.data.length; i++){
            for(let k = 0; k < this.dataService.data[i].tasks.length; k++){
                for(let j = 0; j < this.recursionTaskIDS.length; j++){
                    if(this.dataService.data[i].tasks[k] != undefined){
                        if(this.recursionTaskIDS[j] == this.dataService.data[i].tasks[k].data.i_id){
                            this.deleteTaskFromRow(this.recursionTaskIDS[j],  i) //(taskID, rowIndex, rowID)
                            k--; //THIS IS NEEDED BECAUSE AN ITEM FROM ARRAY WAS DELETED
                        }
                    }

                }
            }
        }
        for(let q = 0; q < this.dataService.data.length; q++){
            for(let w = 0; w < this.recursionDataArray.length; w++){
                if(this.dataService.data[q].name ==this.recursionDataArray[w].data.car_name){
                    //CHECK IF THE VERY FIRST TASK
                    if(this.recursionDataArray[w].data.i_id == this.originalTaskPosition.data.i_id){
                        this.dataService.data[q].tasks.push(this.originalTaskPosition)
                        this.dataService.updateOriginalTask(this.originalTaskPosition)
                    } else {
                        this.dataService.data[q].tasks.push(this.recursionDataArray[w])
                    }
                }
            }
        }
    }

    //THIS NAME IS MISLEADING, SHOULD BE INDEX, MADE A TYPO ORIGINALLY, OOPS
    //FINDS ROW INDEX BY TASK ID (i_id)
    findRowIDbyTaskID(taskId){
        let index = -1;
        this.dataService.data.forEach((data, i) => {
            data.tasks.forEach((task) => {
                if(taskId == task.data.i_id){
                    index = i;
                }
            })
        });
        return index;
    }

    convertGanttTaskToDataTask(ganttTask, dataRow){
        let dataTask;
        if(ganttTask.model != undefined){
            let gTask = ganttTask.model;
            dataTask = {
                color: gTask.color,
                data: {
                    car_name: dataRow.name, //check if this is updating correctly
                    car_type: gTask.data.car_type,
                    customer_name: gTask.data.customer_name,
                    fixed: gTask.data.fixed,
                    from_hours: gTask.data.from_hours,
                    i_id: gTask.data.i_id,
                    option: gTask.data.option, //option is array
                    title: dataRow.name,
                    to_hours: gTask.data.to_hours,
                    category: gTask.data.category
                },
                from: gTask.from,
                to: gTask.to,
                movable: gTask.movable,
                name: gTask.name,
            }
        } else if (ganttTask.data != undefined){
            dataTask = ganttTask
            dataTask.data.car_name = dataRow.name
        }
        return dataTask;
    }

    moveTaskToRowVisually(overlappedTask, dataRow){
        let task = this.convertGanttTaskToDataTask(overlappedTask, dataRow) //test version works correctly, so somethign wrong with my code
        task.data.car_name = dataRow.name;
        let row = this.dataService.data.find(data => dataRow.id === data.id);
        row.tasks.push(task);
        console.log('MOVE TASK TO ROW VISUALLY : ', row)
        this.$scope.$digest()

    }

    deleteTaskFromRow(oldTaskID, oldRowIndex){
        this.dataService.data[oldRowIndex].tasks.forEach((task, index) => {
            if (task.data.i_id == oldTaskID){
                this.dataService.data[oldRowIndex].tasks.splice(index, 1);
            }
        });
    }

    getRowID(row) {
        return this.dataService.data[row].id;
    }

    getTaskId(task){
        return task.model ? task.model.data.i_id : task.data.i_id;
    }
}