import moment from "moment";
import { Utils } from "../../services/utils";

export default class GanttService {

    constructor(dataService, $rootScope) {
        this.dataService = dataService;
        this.$rootScope = $rootScope
        this.toDate = this.getDateFromToday(this.dataService.ganttShowDays);
        this.fromDate = this.setTimeToToday(0);
        this.confirmMove = false;
        this.ganttTasksArr = [];
        this.drawDisabled = false;
        this.isCarInfoOpen = false;
        this.columnWidth = 60
        this.headersScales = {
            firstLetter: 'day',
            secondLetter: 'hour'
        }
        this.headersFormat = {
            firstLetter: function(column) {
                let day = column.date
                return day.local('ja').format('DD (dd)')
            },
            secondLetter: function(column) {
                let day = column.date
                return day.local('ja').format('HH:mm')
            }
        };
        this.scales = "1 hour"

        this.timeScale = $rootScope.$on('timeScale', (e, scale) => {
            switch (scale) {
                case '１日':
                    this.updateGanttScalesByDay();
                    break;
                case '１時間':
                    this.updateGanttScalesByHour();
                    break;
                case '３０分':
                    this.updateGanttScalesByThirty();
                    break;
                case '１５分':
                    this.updateGanttScalesByFifteen();
                    break;
            }
        });
    }

    setDateToToday() {
        let target = new Date()
        target.setHours(0,0,0,0)
        let from = Utils.oneDayBefore(target);
        let to = Utils.targetDateNoon(target, this.dataService.ganttShowDays)
        this.dataService.loadItems(from, to).then(() => {
            this.fromDate = target;
            this.toDate = to;
        }).catch((e) => {
            this.dataService.showToaster('error', "エラー" , e)
            this.loading = false;
        });
    }

    moveDateRange(days) {
        let target = this.fromDate;
        target.setDate(this.fromDate.getDate() + days);
        target.setHours(0,0,0,0)
        let from = Utils.oneDayBefore(target);
        let to = Utils.targetDateNoon(target, this.dataService.ganttShowDays)

        this.dataService.loadItems(from, to).then(() => {
            this.fromDate = target;
            this.toDate = to;
        }).catch((e) => {
            this.dataService.showToaster('error', "エラー" , e)
            this.loading = false;
        });
    }

    getDateFromToday(daysFromToday) {
        let today = new Date();
        let date = new Date();
        if (daysFromToday != 0) {
            date.setDate(today.getDate() + daysFromToday);
            date.setHours(12,30,0,0);
        }
        return date;
    }

    //set time column from today 00:00
    setTimeToToday(timeToToday) {  
        let today = new Date();
        if (timeToToday == 0) {
            today.setHours(0,0,0,0);
        }
        return today;
    }

    updateDates(from, to) {
        this.fromDate = from;
        this.toDate = to;
    }

    updateDatesFromCalendar() {
        let target = new Date();
        if (this.fromDate != null) {
            target = this.fromDate;
        }
        target.setHours(0,0,0,0)
        let from = Utils.oneDayBefore(target);
        let to = Utils.targetDateNoon(target, this.dataService.ganttShowDays)
        this.toDate = to;

        this.dataService.loadItems(from, to).then(() => {
            this.fromDate = target;
            this.toDate = to;
        }).catch((e) => {
            this.dataService.showToaster('error', "エラー" , e)
            this.loading = false;
        });
    }

    getContainsOptions(checkingTask, dataRowOptions) {
        let TrueOrFalse = true;
        if (!checkingTask.data.option[0] == '') {
            for (let j = 0; j < checkingTask.data.option.length; j++) {
                if (!dataRowOptions.includes(checkingTask.data.option[j])) {
                    TrueOrFalse = false;
                }
            }
        }
        return TrueOrFalse
    }

    getContainsCategory(checkingTask, thisdataServicedataidataCATEGORY) {
        if(thisdataServicedataidataCATEGORY != checkingTask.data.category){
            return false;
        } else {return true}
    }

    getDataRowOptions(thisdataServicedataidataOPTION) {
        let dataRowOptions = [];
        if(thisdataServicedataidataOPTION != null){
            return thisdataServicedataidataOPTION.split(',')
        } else {
            return dataRowOptions
        }
    }

    getOriginalTaskRowName(originalTask){
        if(originalTask.model != undefined) {
            return originalTask.model.data.car_name
        } else if (originalTask.data != undefined ) {
            return originalTask.data.car_name
        }
    }

    doesTaskHaveFreeSpace(checkingTask, i) {
        let hasFreeSpace = true;
        for (let k = 0; k < this.dataService.data[i].tasks.length; k++) {
            let isBlockingTask = this.dataService.data[i].tasks[k]
            let isBlockingTaskTaskFrom = isBlockingTask.from
            let isBlockingTaskTaskTo = isBlockingTask.to
            let range = moment().range(checkingTask.from, checkingTask.to)

            let startOverlaps = range.contains(isBlockingTaskTaskTo)
            let endOverlaps = range.contains(isBlockingTaskTaskFrom) // this doesn't consider exact end points
            let overlaps = range.contains(isBlockingTaskTaskFrom || isBlockingTaskTaskTo)

            let subSecondRange = moment().range(isBlockingTaskTaskFrom, isBlockingTaskTaskTo)
            let subOverlaps = subSecondRange.contains(checkingTask.from || checkingTask.to)

            if (endOverlaps || startOverlaps || subOverlaps || overlaps) {
                hasFreeSpace = false
            }
        }
        return hasFreeSpace
    }

    removeNewTask(newTask) {
        let newTaskID = newTask.model.id
        for (let i = 0; i < this.dataService.data.length; i++) {
            for (let j = 0; j < this.dataService.data[i].tasks.length; j++) {
                if (this.dataService.data[i].tasks[j].id == newTaskID) {
                    this.dataService.data[i].tasks.splice(j, 1);
                }
            }
        }
    }

    doesNewTaskOverlapAnything(newTask) {
        let overlappedTaskAmount = 0;
        let newTaskRowID = newTask.row.model.id
        let dataindex;
        for (let i = 0; i < this.dataService.data.length; i++) {
            if (this.dataService.data[i].id === newTaskRowID) {
                dataindex = i;
            }
        }

        for (let p = 0; p < this.dataService.data[dataindex].tasks.length; p++) {
            if (!this.dataService.data[dataindex].tasks[p].model === undefined) {
                continue
            }
            let taskingBEINGoverlapped = this.dataService.data[dataindex].tasks[p]
            if (taskingBEINGoverlapped.data == undefined) {
                continue
            }
            let range = moment().range(taskingBEINGoverlapped.from, taskingBEINGoverlapped.to)
            let overlaps = range.contains(newTask.model.from || newTask.model.to)
            let secondRange = moment().range(newTask.model.from, newTask.model.to)
            let secondOverlaps = secondRange.contains(taskingBEINGoverlapped.from || taskingBEINGoverlapped.to)
            //IF TRUE, NEED TO MOVE
            if (secondOverlaps || overlaps) {
                console.log(newTask, 'overlapped ', taskingBEINGoverlapped)
                overlappedTaskAmount++
            }
        }
        if (overlappedTaskAmount > 0) {
            return true
        } else {
            return false
        }
    }

    checkOverlapAmount(dataindex, checkingTask) {
        let overlappedTaskAmount = 0;

        for (let p = 0; p < this.dataService.data[dataindex].tasks.length; p++) {
            if (checkingTask.data.i_id === this.dataService.data[dataindex].tasks[p].data.i_id) {
                continue
            }
            let taskingBEINGoverlapped = this.dataService.data[dataindex].tasks[p]
            let range = moment().range(taskingBEINGoverlapped.from, taskingBEINGoverlapped.to)
            let overlaps = range.contains(checkingTask.from || checkingTask.to)
            let secondRange = moment().range(checkingTask.from, checkingTask.to)
            let secondOverlaps = secondRange.contains(taskingBEINGoverlapped.from || taskingBEINGoverlapped.to)

            if (secondOverlaps || overlaps) {
                overlappedTaskAmount++
            }
        }
        return overlappedTaskAmount
    }

    getOverlappedTaskData(dataindex, checkingTask) {
        for (let p = 0; p < this.dataService.data[dataindex].tasks.length; p++) {
            let taskingBEINGoverlapped = this.dataService.data[dataindex].tasks[p]

            let range = moment().range(checkingTask.from, checkingTask.to)
            let overlaps = range.contains(taskingBEINGoverlapped.from || taskingBEINGoverlapped.to)
            let secondRange = moment().range(taskingBEINGoverlapped.from, taskingBEINGoverlapped.to)
            let secondOverlaps = secondRange.contains(checkingTask.from || checkingTask.to)

            if (secondOverlaps || overlaps) {
                return taskingBEINGoverlapped
            }
        }
    }

    resetTaskNamesToCenter(childElement) {
        childElement.setAttribute("style", "text-align: center")
    }

    addOutOfBoundsText(task, childElement) {
        let isOutOfRange = this.taskEndpointOutOfRange(task)

        if (isOutOfRange) {
            let taskDaysLength = this.getDaysBetweenTaskFromAndTo(task)
            let midpoint = Math.ceil(taskDaysLength / 2)
            let calendarStart = moment(this.fromDate)
            let calendarEnd = moment(this.toDate)


            if (taskDaysLength === 2) {
                //display
                // continue
            }
            let taskFrom = task.from
            let taskTo = task.to
            let taskMidpoint = moment(taskFrom)
            taskMidpoint.add((midpoint - 1), 'days')

            if (calendarStart.isAfter(taskMidpoint)) {
                childElement.setAttribute("style", "text-align: right")
                //add popup
            }
            if (calendarEnd.isBefore(taskMidpoint)) {
                childElement.setAttribute("style", "text-align: left")
            }
        }
    }

    getDaysBetweenTaskFromAndTo(task) {
        return task.to.diff(task.from, 'days') + 1
    }

    floorDays(date) {
        date.setHours(0);
        date.setMinutes(0);
        date.setSeconds(0);
        return date
    }

    taskEndpointOutOfRange(task) {
        let taskTo = task.to.format('YYYY-MM-DD')
        let taskFrom = task.from.format('YYYY-MM-DD')
        let calendarStart = moment(this.fromDate).format('YYYY-MM-DD')//this.service.fromDate;
        let calendarEnd = moment(this.toDate).format('YYYY-MM-DD');//this.service.toDate;
        let calendarRange = moment().range(calendarStart, calendarEnd)

        if ((calendarStart === taskFrom) && (calendarEnd === taskTo)) {
            return false
        }
        if ((calendarRange.contains(moment(taskFrom)) && !calendarRange.contains(moment(taskTo))) || (!calendarRange.contains(moment(taskFrom)) && calendarRange.contains(moment(taskTo)))) { //
            return true
        }
        return false
    }

    openNewTaskFromButton() {
        let screenWidth = window.screen.width
        let x = (window.innerWidth / 2) - 326
        let y = 15
        if (screenWidth < 1000) {
            x = (window.innerWidth / 2) - 150
            y = 0;
        }
        this.$rootScope.$broadcast('openNewItem', 123456789, x, y, true)
    }

    updateGanttScalesByDay() {
        const viewScale = "1 day"
        const toDays = 30
        const columnWidth = 80
        this.updateScales(
            {
                firstLetter: 'month',
                secondLetter: 'day'
            },
            {
                firstLetter: function(column) {
                    let day = column.date
                    return day.local('ja').format("MM月 YYYY")
                },
                secondLetter: function(column) {
                    let day = column.date
                    return day.local('ja').format('DD (dd)')
                }
            }, viewScale, toDays, columnWidth
        )
    }

    updateGanttScalesByHour() {
        const viewScale = "1 hour"
        const toDays = 3
        const columnWidth = 60
        this.updateScales(
            {
                firstLetter: 'day',
                secondLetter: 'hour'
            },
            {
                firstLetter: function(column) {
                    let day = column.date
                    return day.local('ja').format('DD (dd)')
                },
                secondLetter: function(column) {
                    let day = column.date
                    return day.local('ja').format('HH:mm')
                }
            }, viewScale, toDays, columnWidth
        )
    }

    updateGanttScalesByThirty() {
        const viewScale = "30 minutes"
        const toDays = 2
        const columnWidth = 60
        this.updateScales(
            {
                firstLetter: 'day',
                secondLetter: 'hour'
            },
            {
                firstLetter: function(column) {
                    let day = column.date
                    return day.local('ja').format('DD (dd)')
                },
                secondLetter: function(column) {
                    let day = column.date
                    return day.local('ja').format('HH:mm')
                }
            }, viewScale, toDays, columnWidth
        )
    }

    updateGanttScalesByFifteen() {
        const viewScale = "15 minutes"
        const toDays = 1
        const columnWidth = 50
        this.updateScales(
            {
                firstLetter: 'day',
                secondLetter: 'hour'
            },
            {
                firstLetter: function(column) {
                    let day = column.date
                    return day.local('ja').format('DD (dd)')
                },
                secondLetter: function(column) {
                    let day = column.date
                    return day.local('ja').format('HH:mm')
                }
            }, viewScale, toDays, columnWidth
        )
    }

    updateScales(scales, format, viewScale, showDays, columnWidth) {
        this.dataService.ganttShowDays = showDays;
        this.toDate = Utils.targetDateNoon(this.fromDate, showDays)
        this.headersScales = scales;
        this.headersFormat = format;
        this.scales = viewScale
        this.columnWidth = columnWidth
    }

}