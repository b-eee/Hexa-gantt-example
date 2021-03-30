import ganttTmpl from './gantt.src.tmpl.html'
import moment from 'moment';
import { Utils } from "../../../services/utils";

export default class GanttController {

    constructor($log, $scope, ganttService, dataService, $timeout, toaster, $window) {
		'ngInject';
		this.$log = $log;
        this.$scope = $scope;
        this.service = ganttService;
        this.dataService = dataService;
        this.$timeout = $timeout;
        this.toaster = toaster;
        this.$window = $window;
        this.headerName = ' '
        this.ganttTemplateURL = ganttTmpl;
        this.maxHeight = this.setMaxHeight();
        this.isDragging = false;
        this.isResizing = false;
        this.newTaskId = null;
        this.recursionDataArray = [];
        this.recursionTaskIDS = []
        this.dataBackup;
        this.endRecursion = false;
        this.checkedRows;
        this.RecursionTracking;
        this.howManyStartingRecurions = 0;
        this.howManySubRecurions;
        this.originalTaskPosition;
        this.originalRowID;
        this.originalTaskRowID;
        this.canMakeNewTask = true;
        this.calledFromButton = false;
        this.calledFromButtonI_ID = null;
        this.originalButtonTask = null;
        this.isMobile = this.mobileCheck();
        //
        this.setNewTaskID = $scope.$on('setNewTaskID', (e, obj) => {
            this.newTaskId = obj.id;
        });

        // this.getDriver = $scope.$on('getDriver', driver => {
        //     console.log(driver)
        // });
//      [[[ AUTO-MOVE CALL FROM BUTTON ]]]
        this.autoMoveCall = $scope.$on('autoMoveCall', (e, task) => {
            this.originalButtonTask = task;
            this.recursionDataArray = [];
            this.recursionTaskIDS = [];
            this.checkedRows = [];
            this.calledFromButton = true;
            // let rowData = {
            //     model: this.getRowFromName(task.DRIVER)
            // }

            //CONVERT TO GANTT TASK
            // let ganttTask = {
            //     model: {
            //         color: undefined,
            //         id: 987654321,
            //         from: task.FROM,
            //         to: task.TO,
            //         name: '新しい予約',
            //         data: {
            //             i_id: 987654321,
            //             // customer_id: task.customerId,				                	    //得意先ID
            //             // customer: task.customer,       				            		//得意先名
            //             receipt: task.RECEIPT,                                               //伝票番号
            //             customer: task.customer,         				                    //依頼元
            //             car_num: task.CAR_NUM,		    						            //車番
            //             car_type: task.CAR_TYPE,               				                //車種
            //             start_customer_value: task.START_CUSTOMER_VALUE,                    //引取先
            //             end_customer_value: task.END_CUSTOMER_VALUE,                        //納車先 
            //             start_prefecture_address1: task.START_PREFECTURE_ADDRESS1,          //引取先住所
            //             end_prefecture_address1: task.END_PREFECTURE_ADDRESS1,              //納車先住所 
            //             start_address2: task.START_ADDRESS2,                                //引取先建物
            //             end_address2: task.END_ADDRESS2,                                    //納車先建物
            //             start_person_title_person_name: task.START_PERSON_TITLE_PERSON_NAME,//引取先担当
            //             end_person_title_person_name: task.END_PERSON_TITLE_PERSON_NAME,    //納車先担当
            //             start_tell: task.START_TELL,                                        //引取先電話
            //             end_tell: task.END_TELL,                                            //納車先電話
            //             start_memo: task.START_MEMO,                                        //引取先備考
            //             end_memo: task.END_MEMO,                                            //納車先備考
            //             forwarding_price: task.FORWARDING_PRICE,                            //回送料金
            //             highway_cost: task.HIGHWAY_COST,                                    //高速
            //             fuel_cost: task.FUEL_COST,                                          //燃料代
            //             transportation_expenses: task.TRANSPORTATION_EXPENSES,              //交通費
            //             qc_highway_fee: task.QC_HIGHWAY_FEE,                                //QC高速
            //             commission_fee: task.COMMISSION_FEE,                                //委託料
            //             subsidy: task.SUBSIDY,                                              //補助費
            //             insurance: task.INSURANCE,                                          //保険負担
            //             driver: task.DRIVER,                                                //ドライバー
            //             other: task.OTHER,                                                  //その他
            //             startDate: task.START_DATE,                                         //注文情報引取日
            //             endDate: task.END_DATE,                                             //注文情報納車日
            //             ordering_start_time: task.ORDERING_START_TIME,                      //注文情報引取時
            //             ordering_end_time: task.ORDERING_END_TIME,                          //注文情報納車時
            //             ordering_total_time: task.ORDERING_TOTAL_TIME,                      //所要時間
            //             instructional_from: task.INSTRUCTIONAL_FROM,                        //指示情報引取日
            //             instructional_to: task.INSTRUCTIONAL_TO,                            //指示情報納車日
            //             instructional_start_time: task.INSTRUCTIONAL_START_TIME,            //指示情報引取時
            //             instructional_end_time: task.INSTRUCTIONAL_END_TIME,                //指示情報納車時
            //         }
            //     },
            //     row: rowData
            // }

            //CHECK OVERLAPS
            // let overlappedAnything = this.service.doesNewTaskOverlapAnything(ganttTask);

            // let gottenRow = this.getRowFromName(task.DRIVER)
            // gottenRow.tasks.push(ganttTask.model)
            // Put driver information
            // if(overlappedAnything){
            //     //SETTING ORIGINAL POSITION AND ID
            //     this.originalTaskPosition = {
            //         data:  ganttTask.model.data,
            //         from: ganttTask.model.data.from,
            //         name: ganttTask.model.data.name,
            //         to: ganttTask.model.data.to
            //     }
            //     this.originalTaskMovedID = ganttTask.model.data.i_id
            //     this.dataService.originalTaskMovedID = ganttTask.model.data.i_id;
            //     this.autoMoveTask(ganttTask)
            // } else {
                // for(let i = 0; i < this.dataService.data.length; i++){
                //     for(let k = 0; k < this.dataService.data[i].tasks.length; k++){
                //         if(this.dataService.data[i].tasks[k].data.i_id === 987654321){
                //             this.dataService.data[i].tasks.splice(k, 1)
                //         }
                //     }
                // }

                this.dataService.createNewItem(task);
                console.log(task)
            // }
            this.calledFromButton = false;
        });

        var self = this;

//      [[[ THIS SHOULD FIX VISUAL COLLAPSE PROBELMS WHEN RESIZING THE WINDOW ON SOME MACHINES ]]]
        angular.element($window).bind('resize', function(){
            var scrollableHeader = document.getElementsByClassName("gantt-scrollable-header")[0];
            scrollableHeader.style.removeProperty('width')
            setTimeout(()=>{
                scrollableHeader.style.removeProperty('width')
                self.$scope.$digest()
            }, 100)
        });

        this.$scope.registerApi = (api) => {
            api.core.on.ready(self.$scope, function() {

//              [[[ CLICK OR TOUCH TO OPEN TASK INFO ]]]
                api.directives.on.new(self.$scope, function (dName, dScope, dElement) {
                if (dName !== 'ganttTask') { return; }
                    dElement.on('mouseup', (event) => {
                        self.$scope.$apply(() => {
                            if(self.isResizing == false && self.isDragging == false && self.newTaskId != dScope.task.model.id){
                                self.$scope.$broadcast('openTaskInfo', {
                                        name : dScope.task.model.name,
                                        from: dScope.task.model.from,
                                        to: dScope.task.model.to,
                                        data: dScope.task.model.data,
                                        rowId: dScope.task.row.model.data.i_id
                                    },
                                    event.clientX,
                                    event.clientY
                                );
                            }
                        });
                    });
                    dElement.on('touchstart', (event) => {
                        self.$scope.$apply(() => {
                            let x = (self.$window.screen.width / 2) - 150;
                            let y = (self.$window.screen.height);
                            if(self.isResizing == false && self.isDragging == false && !self.newTaskId){
                                self.$scope.$broadcast('openTaskInfo', {
                                        name : dScope.task.model.name,
                                        from: dScope.task.model.from,
                                        to: dScope.task.model.to,
                                        data: dScope.task.model.data,
                                        rowId: dScope.task.row.model.data.i_id
                                    },
                                    x,y
                                );
                            }
                        });
                    });
                });

//              [[[ SET TASK ORIGINAL POSITION ON TOUCH OR CLICK ]]]
                api.directives.on.new(self.$scope, function (dName, dScope, dElement) {
                    if (dName !== 'ganttTask') { return; }
                    dElement.on('mousedown', () => {
                        self.$scope.$apply(() => {
                            self.originalTaskPosition = {
                                // color: dScope.task.model.color,
                                // data: dScope.task.model.data,
                                from: dScope.task.model.from,
                                id: dScope.task.model.id,
                                // movable: dScope.task.model.movable,
                                // name: dScope.task.model.name,
                                to: dScope.task.model.to
                            }
                        });
                    });
                    dElement.on('touchstart', () => {
                        self.$scope.$apply(() => {
                            self.originalTaskPosition = {
                                // color: dScope.task.model.color,
                                // data: dScope.task.model.data,
                                from: dScope.task.model.from,
                                id: dScope.task.model.id,
                                // movable: dScope.task.model.movable,
                                // name: dScope.task.model.name,
                                to: dScope.task.model.to
                            }
                        });
                    });
                });

//              [[[ SET LEFT COLUMN BACKGROUND COLOR ]]]
                api.directives.on.new(self.$scope, function (dName, dScope, dElement) {
                    if (dName !== 'ganttRowLabel') { return; }
                    for(let i = 0; i < self.dataService.data.length; i++){
                        if(dElement[0].innerText === self.dataService.data[i].name){
                            var div = document.createElement('div');
                            div.appendChild(document.createTextNode(self.dataService.data[i].data.PLATE ? self.dataService.data[i].data.PLATE : ''));
                            div.classList.add("plate-label");
                            dElement[0].children[0].children[0].appendChild(div);


                            let today = moment();
                            let ExpireDate = moment(self.dataService.data[i].data.INSURANCE)
                            let color = self.dataService.data[i].data.COLOR ? self.dataService.data[i].data.COLOR : self.dataService.rowColors.light
                            dElement[0].setAttribute("style", `background-color: ${color}`)

                            let daysUntilExpire = ExpireDate.diff(today, 'days')
                            if(self.dataService.data[i].data.INSURANCE != undefined && self.dataService.data[i].data.INSURANCE != null){
                                if(daysUntilExpire < 7){
                                    color = '#ff0000'
                                    dElement[0].children[0].children[0].children[0].setAttribute("style", `background-color:  ${color}`)
                                } else if (daysUntilExpire < 30) {
                                    color = '#fff700'
                                    dElement[0].children[0].children[0].children[0].setAttribute("style", `background-color: ${color}`)
                                }
                            }
                        }
                    }
                });

//              [[[ ON BEGIN OF MOVING A TASK ]]]
                api.tasks.on.moveBegin(self.$scope, function(task) {
                    if(self.dataService.taskAreMovable === false){
                        return
                    }
                    if((self.dataService.currentSavedPoint +1) != self.dataService.backupData.length){
                        self.dataService.showToaster('error', '','予約の追加や削除を実施する前に、現時点での保存をお願いします。')
                        return
                    }
                    self.originalRowID = task.row.model.id;
                    self.recursionDataArray = [];
                    self.recursionTaskIDS = [];
                    self.checkedRows = [];
                    self.$scope.$digest()
                    self.updateDraggingTaskMovable(task);
                    // let dataTask = self.aConvertGanttTaskToDataTask(task);
                    // self.aCheckAndAddTaskData(dataTask);

                })

//              [[[ WHILE MOVING ]]]
                api.tasks.on.move(self.$scope, function(task) {
                    self.isDragging = true;
                    if(self.dataService.countingDown){
                        console.log('counting down, add fucntion to delete task here')
                    }
                })

//              [[[ ON END OF MOVING A TASK ]]]
                api.tasks.on.moveEnd(self.$scope, function(task) {
                    if(!self.isDragging || self.dataService.countingDown){ return; }

                    self.dataService.originalTaskMovedID = task.model.data.i_id;
                    self.loading = true;
                    // self.floorDate(task);
                    self.updateAndAutoMove(task);
                    self.isDragging = false;
                    self.positionTasksNames()

                    self.service.drawDisabled = false;
                })

//              [[ ON BEGIN OF RESIZING A TASK ]]
                api.tasks.on.resizeBegin(self.$scope, function(task){
                    if((self.dataService.currentSavedPoint +1) != self.dataService.backupData.length){
                        this.dataService.showToaster('error', '','予約の追加や削除を実施する前に、現時点での保存をお願いします。')
                        return
                    }
                    self.originalRowID = task.row.model.id;
                    self.isResizing = true;
                    self.recursionDataArray = [];
                    self.recursionTaskIDS = [];
                    self.checkedRows = [];
                    // let dataTask = self.aConvertGanttTaskToDataTask(task)
                    // self.aCheckAndAddTaskData(dataTask)
                })

//              [[[ ON END OF RESIZING A TASK ]]]
                api.tasks.on.resizeEnd(self.$scope, function(task){
                    if(self.dataService.countingDown){return}
                    if(self.newTaskId){ return }
                    // self.floorDate(task);
                    self.updateAndAutoMove(task);
                    self.isResizing = false;
                    self.service.drawDisabled = false;
                })

//              [[[ OPEN ROW LABEL INFO ]]]
                // api.directives.on.new(self.$scope, function (dName, dScope, dElement) {
                //     if (dName !== 'ganttRowLabel') { return; }
                //     //WILL USE THIS FUNCTION LATER DONT DELETE
                //     //WILL USE THIS FUNCTION LATER DONT DELETE
                //     //WILL USE THIS FUNCTION LATER DONT DELETE
                //     dElement.on('mouseup', (event) => {
                //             let name = dElement[0].innerText
                //             self.service.isCarInfoOpen = true;
                //             let carInfoEle = document.getElementById("car-info-container")
                //             carInfoEle.style.left = event.clientX + 'px'
                //             carInfoEle.style.top = event.clientY + "px"
                //             self.$scope.$apply()
                //             self.$scope.$broadcast('carInfo', name, dElement[0])

                //     })
                // })

//              [[[ MAKING DAY ON CELL AS NUMBER ]]]
                api.directives.on.new(self.$scope, function (dName, dScope, dElement) {
                    if (dName !== 'ganttColumnHeader') { return; }
                        let columnDate = dScope.column.date
                        let columnDateStr = columnDate.date()
                        let columnLabel = dScope.column.label
                       
                        if(columnDateStr && columnLabel == '00:00'){
                            let month = (columnDateStr) + '日'
                            var div = document.createElement('div');
                            div.appendChild(document.createTextNode(month));
                            div.classList.add("monthNoteExtra");
                            dElement[0].appendChild(div);
                        }
                });

//              [[[ SETS TEXT FOR TASKS WHEN OUT OF BOUNDS ]]]
                api.directives.on.new(self.$scope, function (dName, dScope, dElement) {
                    if (dName !== 'ganttTask') { return; }
                    if  (dScope.task.model === undefined) {return}
                    let childElement;
                    for (var i = 0; i < dElement[0].childNodes.length; i++) {
                        if (dElement[0].childNodes[i].className == "gantt-task-content") {
                            childElement = dElement[0].childNodes[i];
                            let taskElemObj = {
                                task: dScope.task.model,
                                childElement: childElement
                            }
                            self.service.ganttTasksArr.push(taskElemObj)
                            break;
                        }
                    }
                    self.addOutOfBoundsText(dScope.task.model, childElement)
                });

//              [[[ SETS TEXT TO SMALL IF TASK IS 3 DAYS OR LESS ]]]
                api.directives.on.new(self.$scope, function (dName, dScope, dElement) {
                    if (dName !== 'ganttTaskContent') { return; }
                        let from = dScope.task.model.from
                        let to = dScope.task.model.to
                        if(to.diff(from, 'days') < 3){
                            dElement[0].childNodes[0].classList.add("small-text-wrap")
                        }
                })

//              [[[ ON DRAW BEGIN ]]]
                api.tasks.on.drawBegin(self.$scope, function(task){
                    self.newTaskId = task.model.id;
                    self.isDragging = true;
                    self.recursionDataArray = [];
                    self.recursionTaskIDS = [];
                    self.checkedRows = [];
                    self.canMakeNewTask = true;
                })

//              [[[ WHILE DRAWING ]]]
                api.tasks.on.draw(self.$scope, function(task){

                })

//              [[[ ON DRAW END ]]]
                api.tasks.on.drawEnd(self.$scope, function(task){
                    if(!self.newTaskId || self.dataService.countingDown){ return; }

                    self.originalTaskPosition = {
                        from: task.model.from,
                        to: task.model.to,
                        name: task.row.model.name
                    }
                    self.newTaskEndDrag(task)
                    self.isDragging = false;
                })
            })
        }
    };


    $onInit() {
        this.loadGantt()
    }

/////// [[[ AUTO-MOVE FUNCTIONALITY EXPLAINATION]]]
/////// write explaination here later
/////// 1) autoMoveTask()
/////// 2) checkIfOverlap() This will check overlaps. If there's an overlap, calls bCheckingForEmptyRows()
/////// 3-a) if bCheckingForEmptyRows() finds an empty row, it will move there and end functions.
/////// 3-b) if bCheckingForEmptyRows() DOESN'T find an empty row, it will return false
/////// 4) recursion process started with aRecursionStart() when bCheckingForEmptyRows() returns false;


// [[[AUTO-MOVE FUNCTIONALITY - 1: INITIAL MOVEMENT AND OVERLAP CHECKS ]]]

    autoMoveTask(task) {
        console.log('AUTOMOVE TASK', task)
        this.endRecursion = false;
        let taskTo = task.model.to;
        let taskFrom = task.model.from;
        taskFrom.startOf('day')
        let taskId = this.getTaskId(task);
        this.aCheckAndAddTaskID(taskId);
        this.checkIfOverlap(this.findRowIndexbyTaskID(taskId), taskId, taskTo, taskFrom, task);//THIS IS THE TASK THAT WAS MOVED
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
            if(taskId != checkingTask.data.i_id && this.rangeChecks(taskTo, taskFrom, checkingTask)){
                singleOverlappedTask = checkingTask;
                overlappedTaskAmount++
            }
        }
        //nemo-memo possible make this if chain into a function
        if(overlappedTaskAmount === 0) {
            this.loading = false;
            this.service.drawDisabled = false;
            this.dataService.addSavePoint();
        } else if (overlappedTaskAmount === 1) {
            if(this.endRecursion) {return}
            if(singleOverlappedTask.data.fixed === "限定あり"){
                this.bEndRecursionAndRevert('error', "エラー" , "この日程で予約を入れることはできません")
                return
            }
            if(this.bCheckingForEmptyRows(singleOverlappedTask) === false){
                this.howManyStartingRecurions = 0
                this.dataService.showToaster('info', "注意!" , "予約を更新中です。ページを更新しないでください。")
                this.aRecursionStart(singleOverlappedTask, task)
            }
        } else if (overlappedTaskAmount > 1) {
            this.bEndRecursionAndRevert('error', "エラー" , "この日程で予約を入れることはできません")
            return;
        }
    }

    bCheckingForEmptyRows(checkingTask){
        let foundEmptyRow = false;
        for(let i = 0 ; i < this.dataService.data.length; i ++){
            let dataRowOptions = this.service.getDataRowOptions(this.dataService.data[i].data.OPTION)
            let containsOptions =  this.service.getContainsOptions(checkingTask, dataRowOptions)
            let containsCategory = this.service.getContainsCategory(checkingTask, this.dataService.data[i].data.CATEGORY)
            if(containsCategory && containsOptions){
                let thisRowHasFreeSpace = true;
                thisRowHasFreeSpace = this.service.doesTaskHaveFreeSpace(checkingTask, i)
                if(thisRowHasFreeSpace == true){
                    //nemo-memo Should this be a seperate function>
                    this.aDeleteMoveTask(checkingTask, this.dataService.data[i])
                    this.endRecursion = true;
                    this.aCheckAndAddTaskID(checkingTask.data.i_id)
                    this.apiUpdateForAllMovedTasks();
                    foundEmptyRow = true;
                    break;
                }
            } else { continue }
        }
        return foundEmptyRow
    }

// [[[ AUTO-MOVE FUNCTIONALITY - 2: RECURSION PROCESS STARTS HERE IF AN OVERLAPPED TASK COULD NOT FIND AN EMPTY ROW ]]]

    aRecursionStart(checkingTask, originalTask) {

        this.howManyStartingRecurions++
        if(this.endRecursion){return}
        let foundEmptyRowForTask = this.bCheckingForEmptyRows(checkingTask); //MOVES TO EMPTY ROW IF THERE IS ONE
        if(foundEmptyRowForTask != true){
            let rowIDSThatMatchConditions = this.bCheckingRowWithCondition(checkingTask, originalTask); //RETURNS ARRAY OF ROW IDS
            if(rowIDSThatMatchConditions.length === 0) {
                this.bEndRecursionAndRevert('error', "エラー" , "この日程で予約を入れることはできません")
                return
            } else {
                this.bLoopThroughMatchedConditionRows(rowIDSThatMatchConditions, checkingTask)
            }
        }
    }

    bCheckingRowWithCondition(task, originalTask){
        let rowIDSThatMatchConditions = [];
        let originalTaskRowName = this.service.getOriginalTaskRowName(originalTask)

        for(let i = 0; i < this.dataService.data.length; i++){
            if( originalTaskRowName == this.dataService.data[i].name ){
                continue; //SKIPS ITSELF IN THE CHECK
            } else {
                let dataRowOptions = this.service.getDataRowOptions(this.dataService.data[i].data.OPTION)
                let containsOptions = this.service.getContainsOptions(task, dataRowOptions)
                let containsCategory = this.service.getContainsCategory(task, this.dataService.data[i].data.CATEGORY)
                if(containsCategory && containsOptions){
                    rowIDSThatMatchConditions.push(this.dataService.data[i].id)
                }
            }
        }
        return rowIDSThatMatchConditions
    }

    bLoopThroughMatchedConditionRows(rowIDSThatMatchConditions, checkingTask) {
        if(this.endRecursion) { return; }
        this.checkedRows = [];
        for(let i = 0; i < this.dataService.data.length; i++){
            if(!rowIDSThatMatchConditions.includes(this.dataService.data[i].id)){
                continue
            }
            //ADD TO A ROW IT"S CHECKING
            this.checkedRows.push(this.dataService.data[i].id)
            //CHECKING FOR OVERLAPS IN THE MATCHED ROW
            if(this.endRecursion) { return; }
            this.aDeleteMoveTask(checkingTask, this.dataService.data[i])
            let overlappedAmount = this.service.checkOverlapAmount(i, checkingTask)
            if(overlappedAmount === 1){
                let overlappedTaskData = this.service.getOverlappedTaskData(i, checkingTask)
                //THIS PREVENTS INFINITE RECURSION
                if(overlappedTaskData.data.i_id == this.dataService.originalTaskMovedID){
                    this.bEndRecursionAndRevert('error', "エラー" , "この日程で予約を入れることはできません")
                    return
                }
                if(overlappedTaskData.data.fixed != '限定あり' && overlappedTaskData.data.i_id != 987654321){
                    this.aRecursionStart(overlappedTaskData, checkingTask)
                } else {
                    if(this.checkedRows.length === rowIDSThatMatchConditions.length){
                        this.bEndRecursionAndRevert('error', "エラー" , "この日程で予約を入れることはできません")
                        return
                    }
                    else {
                    //   NEED TO CHECK THIS PART AGAIN FOR ALL PERMUTATIONS
                    // continue
                    this.bEndRecursionAndRevert('error', "エラー" , "この日程で予約を入れることはできません")
                        return
                    }

                }
            } else if ( overlappedAmount > 1 ) {
                //THIS JUST RETURNS IF 2 ARE OVERAPPED BECAUSE IT"S DIFFICULT, CAN UPDATE THIS BETTER LATER...
                this.bEndRecursionAndRevert('error', "エラー" , "この日程で予約を入れることはできません")
                return
            }
        }
    }

// [[[ AUTO-MOVE FUNCTIONALITY - 3: END RECURSION ]]]

    bEndRecursionAndRevert(toasterType, toasterTitle, toasterMessage){
        this.endRecursion = true;
        this.aRevertTasksToOriginalPositions();
        this.dataService.showToaster(toasterType, toasterTitle, toasterMessage)
    }

// [[[ AUTO-MOVE FUNCTIONALITY - 4: FUNCTIONALITIES ]]]

    rangeChecks(taskTo, taskFrom, checkingTask){//PART OF checkIfOverlap()
    taskFrom.startOf('day');
    let range = moment().range(checkingTask.from, checkingTask.to)
    let startOverlaps = range.contains(taskTo)
    let endOverlaps = range.contains(taskFrom) // this doesn't consider exact end points
    let overlaps = range.contains(taskFrom || taskTo)

    let secondRange = moment().range(taskFrom, taskTo)
    let secondOverlaps = secondRange.contains(checkingTask.from || checkingTask.to)
    let endpointsMatch = taskFrom === checkingTask.to
    return (endOverlaps || startOverlaps || secondOverlaps || overlaps)
    }

    async apiUpdateForAllMovedTasks() {
        this.service.drawDisabled = false;
        this.loading = false;

        //nemo-memo should these be seperate functions?
        if(this.calledFromButton === true){
            for(let x = 0; x < this.dataService.data.length; x ++){
                for( let y = 0; y < this.dataService.data[x].tasks.length; y++){
                    if(this.dataService.data[x].tasks[y].data.i_id === 987654321){
                        this.dataService.data[x].tasks.splice(y, 1)
                        this.dataService.createNewItemButton(this.originalButtonTask)
                        break;
                    }
                }
            }
        }

        for(let k = 0; k < this.dataService.data.length; k++){
            for(let p = 0; p < this.dataService.data[k].tasks.length; p++){
                if(this.recursionTaskIDS.includes(this.dataService.data[k].tasks[p].data.i_id)){
                    this.dataService.updateTaskRowAPI(this.dataService.data[k].tasks[p].data.i_id, this.dataService.data[k].name, this.recursionDataArray)

                }

            }
        }

        this.dataService.addSavePoint()

        for(let k = 0; k < this.dataService.data.length; k++){
            for(let p = 0; p < this.dataService.data[k].tasks.length; p++){
                if(this.recursionTaskIDS.includes(this.dataService.data[k].tasks[p].data.i_id)){
                    this.flashColor(this.dataService.data[k].tasks[p])
                }
            }
        }
    }

    aCheckAndAddTaskID(taskID) {
        if(!this.recursionTaskIDS.includes(taskID)){
            this.recursionTaskIDS.push(taskID)
        }
    }

    aRevertTasksToOriginalPositions(){
        this.canMakeNewTask = false;
        this.service.drawDisabled = false;
        this.loading = false;
        for(let i = 0; i < this.dataService.data.length; i++){
            for(let k = 0; k < this.dataService.data[i].tasks.length; k++){
                for(let j = 0; j < this.recursionTaskIDS.length; j++){
                    if(this.dataService.data[i].tasks[k] != undefined){
                        if(this.recursionTaskIDS[j] == this.dataService.data[i].tasks[k].data.i_id){
                            this.deleteTaskFromRow(this.recursionTaskIDS[j],  i) //(taskID, rowIndex, rowID)
                            k--; //THIS IS NEEDED BECAUSE AN ITEM FROM ARRAY WAS DELETED
                            continue
                        }
                        if(this.dataService.data[i].tasks[k].data.i_id === 987654321){
                            this.deleteTaskFromRow(987654321, i)
                        }
                    }
                }
            }
        }
        for(let q = 0; q < this.dataService.data.length; q++){
            for(let w = 0; w < this.recursionDataArray.length; w++){
                if(this.dataService.data[q].name ==this.recursionDataArray[w].data.name){
                    //CHECK IF THE VERY FIRST TASK
                    if(this.recursionDataArray[w].data.i_id == this.originalTaskPosition.data.i_id){
                        this.dataService.updateOriginalTask(this.originalTaskPosition, this.originalTaskRowID)
                        this.dataService.data[q].tasks.push(this.originalTaskPosition)
                    } else {
                        this.dataService.data[q].tasks.push(this.recursionDataArray[w])
                    }
                }
            }
        }
    }

// [[[ VISUAL UPDATES ]]]

    flashColor(task){
        if(task.data.i_id === 123456789){
            return
        }
        task.color = this.dataService.taskColors.moving
        this.$timeout(()=>{
            task.color = task.data.color ? task.data.color : 'rgb(0,132,211)'
            this.dataService.taskAreMovable = true;

        },1500)
    }

    updateAllNonFixedToMovable(){
        for(let i = 0; i < this.dataService.data.length; i++){
            for ( let k = 0; k < this.dataService.data[i].tasks.length; k++){
                if(this.dataService.data[i].tasks[k].data.fixed === '限定なし'){
                    if(this.dataService.data[i].tasks[k].movable.enabled != undefined){
                        this.dataService.data[i].tasks[k].movable.enabled = true;
                    }

                }
            }
        }
    }

    positionTasksNames(){
        for(let taskObj of this.service.ganttTasksArr){
            this.service.resetTaskNamesToCenter(taskObj.childElement)
            this.service.addOutOfBoundsText(taskObj.task, taskObj.childElement)
        }
    }

    addOutOfBoundsText(task, childElement){
        let isOutOfRange = this.taskEndpointOutOfRange(task)
        if(isOutOfRange){
            let taskDaysLength = this.getDaysBetweenTaskFromAndTo(task)
            let midpoint = Math.ceil(taskDaysLength / 2)
            let calendarStart =  moment(this.service.fromDate)
            let calendarEnd = moment(this.service.toDate)
            if(taskDaysLength === 2){
            }
            let taskFrom = task.from
            let taskMidpoint = moment(taskFrom)
            taskMidpoint.add((midpoint - 1 ), 'days' )
            if(calendarStart.isAfter(taskMidpoint)){
                childElement.setAttribute("style", "text-align: right")
            }
            if(calendarEnd.isBefore(taskMidpoint)){
                childElement.setAttribute("style", "text-align: left")
            }
        }
    }

    collapseFix(){
        var scrollableHeader = document.getElementsByClassName("gantt-scrollable-header")[0];
        scrollableHeader.style.removeProperty('width')
    }

    setMaxHeight() {
        var h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
        h -= 122;
        return h;
    }

    taskEndpointOutOfRange(task){//This returns true or false based on if the task is off-screen?
        let taskTo = task.to.format('YYYY-MM-DD')
        let taskFrom = task.from.format('YYYY-MM-DD')
        let calendarStart = moment(this.service.fromDate).format('YYYY-MM-DD')
        let calendarEnd = moment(this.service.toDate).format('YYYY-MM-DD');
        let calendarRange = moment().range( calendarStart, calendarEnd)
        if((calendarStart === taskFrom)&&(calendarEnd === taskTo)){
            return false
        }
        if ((calendarRange.contains(moment(taskFrom)) && !calendarRange.contains(moment(taskTo))) ||  (!calendarRange.contains(moment(taskFrom)) && calendarRange.contains(moment(taskTo)))){
            return true
        }
        return false
    }

// [[[ GETTERS ]]]

    getRowID(row) {
        return this.dataService.data[row].id;
    }

    getTaskId(task){
        return task.model ? task.model.data.i_id : task.data.i_id;
    }

    getRowFromName(rowName){
        for(let i = 0; i < this.dataService.data.length; i++){
            if(this.dataService.data[i].name === rowName){
                return this.dataService.data[i]
            }
        }
    }

    getDaysBetweenTaskFromAndTo(task){
        return  task.to.diff(task.from, 'days') +1
    }

    findRowIndexbyTaskID(taskId){
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

    optionStrToArray(options){
        if(options != null){
            return options.split(',');
        }
    }

// [[[ GANTT TEMPLATE ATTRIBUTES AND OTHER ]]]

    enabledResizeAndMove(){
        return  !((this.dataService.currentSavedPoint +1) != this.dataService.backupData.length)
    }

    drawTaskFactory() {
        return {
            id: Math.floor(10000000 + Math.random() * 90000000) + 1,
            name: '新しい予約'
        };
    }

    disabledDraw(){
        if(this.service.drawDisabled === true || this.dataService.dataHasBeenChanged === true){
            return true
        } else {
            return false
        }
    }

    newTaskEndDrag(task) {
        let roomName = task.row.$scope.row.model.data.name
        let startDateFormat = moment(new Date(task.model.from._d)).format('YYYY-MM-DD')
        let endDateFormat = moment(new Date(task.model.to._d)).format('YYYY-MM-DD')
        let startTime = moment(new Date(task.model.from._d)).format('HH:mm')
        let endTime = moment(new Date(task.model.to._d)).format('HH:mm')
        let startDate = new Date(task.model.from._d)
        let endDate = new Date(task.model.to._d)
        let defaultValue = {
            rowID: task.row.model.id,
            roomName: roomName,
            startDateFormat: startDateFormat,
            endDateFormat: endDateFormat,
            startTime: startTime,
            endTime: endTime,
            startDate: startDate,
            endDate: endDate
        }
        
        var boundings = task.$element[0].getBoundingClientRect();

        this.dataService.newRowItem = {
            rowID: task.row.model.id,
            roomName: roomName,
            task: task
        }
        //MAKES THE FORM VISIBLE
        this.$scope.$broadcast('openNewItem',
            this.newTaskId,
            // boundings.left + (boundings.width * 0.5),
            // boundings.top + (boundings.height * 0.5)
            window.top.outerWidth / 2.5,
            window.top.outerHeight / 4,
            false,
            defaultValue
        );
    }

// [[[ UTILITIES ]]]

    floorDays(date){
        date.setHours(0);
        date.setMinutes(0);
        date.setSeconds(0);
        return date
    }

    //floor the hours, mins, seconds so it eliminates the "caterpillar" effect
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

    loadGantt() {
        this.loading = true;
        this.dataService.load().then(() => {
            this.loading = false;
            this.collapseFix()
            this.$scope.$digest()
        }).catch((e) => {
            this.dataService.showToaster('error', "エラー" , e)
            this.loading = false;
        });
    }

    updateDraggingTaskMovable(task){
        let self = this;
        task.model.movable = {
            'enabled': this.dataService.taskAreMovable === true ? true : false,
            'allowRowSwitching': function(task, targetRow){
                return self.dataService.checkIfCanMoveTo(task, targetRow)
            }
        }
    }

    aCheckAndAddTaskData(originalTaskData) {
        let someObj = {
            color: originalTaskData.color,
            data: {
                name: originalTaskData.data.name,
                car_type: originalTaskData.data.car_type,
                category: originalTaskData.data.category,
                customer_name: originalTaskData.data.customer_name,
                fixed: originalTaskData.data.fixed,
                from_hours: originalTaskData.data.from_hours,
                i_id: originalTaskData.data.i_id,
                option: originalTaskData.data.option,
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
                    // car_name: task.row.model.name, //check if this is updating correctly
                    name: task.row.model.name,
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
        }
        return dataTask
    }

    convertGanttTaskToDataTask(ganttTask, dataRow){
        let dataTask;
        if(ganttTask.model != undefined){
            let gTask = ganttTask.model;
            dataTask = {
                color: gTask.color,
                data: {
                    name: dataRow.name,
                    car_type: gTask.data.car_type,
                    customer_name: gTask.data.customer_name,
                    fixed: gTask.data.fixed,
                    from_hours: gTask.data.from_hours,
                    i_id: gTask.data.i_id,
                    option: gTask.data.option,
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
            dataTask.data.name = dataRow.name
        }
        return dataTask;
    }

    moveTaskToRowVisually(overlappedTask, dataRow){
        this.dataService.taskAreMovable = false;
        let task = this.convertGanttTaskToDataTask(overlappedTask, dataRow)
        task.data.name = dataRow.name;
        let rowIndexTasks;
        for(let i = 0; i < this.dataService.data.length ; i++){
            if(this.dataService.data[i].id === dataRow.id){
                rowIndexTasks = i;
                let rowTasks = this.dataService.data[i].tasks
                rowTasks.push(task)
                this.dataService.data[i].tasks = rowTasks;
                let newData = this.dataService.data
                this.dataService.data = newData

                this.$timeout(()=>{
                    this.dataService.data[rowIndexTasks].tasks = [];
                    this.$timeout(()=>{
                        this.dataService.data[rowIndexTasks].tasks = rowTasks
                        this.updateAllNonFixedToMovable()
                    },0)
                },2000)
            }
        }
    }

    deleteTaskFromRow(oldTaskID, oldRowIndex){

        for(let i = 0; i < this.dataService.data[oldRowIndex].tasks.length; i++){
            if (this.dataService.data[oldRowIndex].tasks[i].data.i_id == oldTaskID){
                this.dataService.data[oldRowIndex].tasks.splice(i, 1);
            }
        }
    }

    aDeleteMoveTask(task, newRow){
        let originalTaskData = task;
        this.aCheckAndAddTaskData(originalTaskData);
        let taskID = this.getTaskId(task)
        this.recursionTaskIDS.push(taskID)
        let rowIndex = this.findRowIndexbyTaskID(taskID)
        let rowID = this.getRowID(rowIndex)
        this.deleteTaskFromRow(taskID, rowIndex, rowID)
        this.moveTaskToRowVisually(task, newRow)
        this.flashColor(task)
    }

    async updateAndAutoMove(task){
        this.service.drawDisabled = true;
        await this.dataService.updateTask(task, this.originalRowID)
        this.originalTaskRowID = task.row.model.data.i_id
        // this.autoMoveTask(task);
    }

    mobileCheck() {
        let check = false;
        (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
        return check;
    }
}