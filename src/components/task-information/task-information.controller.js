import { Utils } from "../../services/utils";

export default class TaskInformation {
    constructor($scope, dataService, toaster) {
        this.$scope = $scope;
        this.dataService = dataService;
        this.toaster = toaster
        this.positionType = 'TL'; // 'NR', 'TR', 'BL', 'TL'
        this.openTaskInfo = $scope.$on('openTaskInfo', (e, task) => {
            const x = window.top.outerWidth / 2.5;
            const y = window.top.outerHeight / 5;
            this.openTooltip(task, x, y);
        });
        this.closeTaskInfo = $scope.$on('closeTaskInfo', (e) => {
            this.closeTooltip();
        });
        this.isEditing = false;
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

    deleteTask() {
        if(this.dataService.dataHasBeenChanged === true){
            this.dataService.toasterPop('error', '','予約の追加や削除を実施する前に、現時点での保存をお願いします。')
            this.closeTooltip();
            return
        }
        this.dataService.deleteTask(this.task.data.i_id);
        this.closeTooltip();
        this.dataService.addSavePoint()
    }

    openTooltip(task, x, y) {
        this.isEditing = false;
        this.task = task;
        this.position(x, y);
        setTimeout(() => {
            this.$scope.$apply(() => {
                this.positionInBounds();
            });
        }, 0)
    }

    closeTooltip() {
        this.task = false;
    }

    position(x, y) {
        this.$scope.$divContainer.style.left = x - 45 + 'px';
        this.$scope.$divContainer.style.top = y + 15 + 'px';
    }

    $onDestroy() {
        this.openTaskInfo();
        this.closeTaskInfo();
    }

    switchEditMode() {
        this.isEditing = !this.isEditing;
    }
}