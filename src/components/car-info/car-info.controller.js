import { Utils } from "../../services/utils";
import moment from 'moment'
import {invalid} from 'moment'

export default class CarInfo {
    constructor(ganttService, dataService, $scope) {
        this.service = ganttService
        this.dataService = dataService;
        this.$scope = $scope
        this.isEditing = false;
        this.rowName;
        this.selectedColor;
        this.rowElement;
        this.carInsuranceDate = new Date()
        this.plate = ''
        this.color;
        this.daysUntilExpire = this.getDaysUntilExpire();
        Date.prototype.isValid = function () {
            // An invalid date object returns NaN for getTime() and NaN is the only
            // object not strictly equal to itself.
            return this.getTime() === this.getTime();
        };

        this.rowData = {
            plate: ''
        }
        this.colors = [
            {
                name: 'パープル',
                hex: '#F0DEFD'
            },
            {
                name: '青',
                hex: '#DEF3FD'
            },
            {
                name: '緑',
                hex: '#DEFDE0'
            },
            {
                name: '黄色',
                hex: '#FCF7DE'
            },
            {
                name: '赤',
                hex: '#FDDFDF'
            },
            {
                name: '元の白',
                hex: '#FFFFFF'
            },
            {
                name: '白',
                hex: '#f2f2f0'
            },

            {
                name: 'ライトグレー',
                hex: '#c9c9c9'
            },
            {
                name: 'グレー',
                hex: '#a8a8a8'
            },
            {
                name: '濃い灰色',
                hex: '#787878'
            },
        ]

        this.getCallCarInfo = $scope.$on('carInfo',(e, name, ele) => {
            let rName = ele.children[0].children[0].children[0].innerText
            this.isEditing = false;
            this.rowElement = ele;
            this.rowNameClicked(rName)
            this.setShakenModelDate()
            this.plate = this.getLicensePlate()
            this.rowData.plate = this.getLicensePlate()
            this.color = this.getColor()
            this.selectedColor = this.getSelectedColor()
        })
    }

    rowNameClicked(name){
        this.rowName = name;
        for(let i = 0; i < this.dataService.data.length; i++){
            if(this.dataService.data[i].name === this.rowName){
                let today = moment();
                let ExpireDate = moment(this.dataService.data[i].data.INSURANCE)
                if(this.dataService.data[i].data.INSURANCE == undefined || this.dataService.data[i].data.INSURANCE == null){
                    this.daysUntilExpire = '車検の有効期限が選択されていません。'
                } else {
                    this.daysUntilExpire = ExpireDate.diff(today, 'days')
                }
            }
         }
    }

    getCarDateValidity(){
        if(this.carInsuranceDate === null){return}
        return this.carInsuranceDate.isValid()
    }



    getColor() {
        return {"background-color": this.selectedColor}
    }

    updateRowVisually(){
        this.rowElement.style.backgroundColor = this.selectedColor;
        for(let i = 0; i < this.dataService.data.length; i++){
            if(this.dataService.data[i].name === this.rowName){
                this.dataService.data[i].data.INSURANCE = this.carInsuranceDate && this.carInsuranceDate != invalid ? this.carInsuranceDate.toISOString().slice(0, 10) : undefined;
                this.dataService.data[i].data.PLATE =  this.rowData.plate ? this.rowData.plate : '';
                this.dataService.data[i].data.COLOR = this.selectedColor ? this.selectedColor : ''
            }
        }
        if(this.rowElement.children[0].children[0].children[1]){
            let plateDiv = this.rowElement.children[0].children[0].children[1]
            plateDiv.innerText = this.rowData.plate
        } else {
            var div = document.createElement('div');
            div.appendChild(document.createTextNode(this.rowData.plate ? this.rowData.plate : ''));
            div.classList.add("plate-label");
            this.rowElement.children[0].children[0].appendChild(div);
        }
        let shakenColor = this.getUpdatedShakenColor()
        this.rowElement.children[0].children[0].children[0].setAttribute("style", `background-color:  ${shakenColor}`)
    }


    getUpdatedShakenColor(){
        for(let i = 0; i < this.dataService.data.length; i++){
            if(this.rowName === this.dataService.data[i].name){
                let today = moment();
                let ExpireDate = moment(this.dataService.data[i].data.INSURANCE)
                let daysUntilExpire = ExpireDate.diff(today, 'days')

                if(daysUntilExpire < 8){
                    return 'red'
                } else if( daysUntilExpire < 31) {
                    return 'yellow'
                }
                // else if ( daysUntilExpire < 91 ) {
                //     return 'yellow'}
                else  {
                    return 'transparent'
                }
            }
        }
    }

    updateRow(){
        this.updateRowVisually()
        //FORMAT THE DATE,
        this.dataService.updateCarRowAPI(this.rowName, this.selectedColor, this.rowData.plate,this.carInsuranceDate)
        this.service.isCarInfoOpen = false
    }

    getSelectedColor() {
        for(let i = 0; i < this.dataService.data.length; i++){
            if(this.dataService.data[i].name === this.rowName){
                return (this.dataService.data[i].data.COLOR || '')
            }
        }
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

    getDaysUntilExpire(){
        for(let i = 0; i < this.dataService.data.length; i++){
            if(this.dataService.data[i].data.name === this.rowName){
                let today = moment();
                console.log('today ', today)
                let ExpireDate = moment(this.dataService.data[i].data.INSURANCE)
                let daysUntilExpire = ExpireDate.diff(today, 'days')
                return daysUntilExpire
            }
        }
    }

    setShakenModelDate() {
        for(let i = 0; i < this.dataService.data.length; i++){
            if(this.dataService.data[i].name === this.rowName){
                let dat = new Date(this.dataService.data[i].data.INSURANCE)
                this.carInsuranceDate = dat
            }
        }
    }

    getShakenDate(){
        for(let i = 0; i < this.dataService.data.length; i++){
            if(this.dataService.data[i].name === this.rowName){
                return moment(this.dataService.data[i].data.INSURANCE).format('YYYY/MM/DD')
            }
        }
    }

    getLicensePlate(){
        for(let i = 0; i < this.dataService.data.length; i++){
            if(this.dataService.data[i].name === this.rowName){
                this.plate = this.dataService.data[i].data.PLATE;
                return (this.dataService.data[i].data.PLATE || '')
            }
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
        this.dataService.addSavePoint();
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

    // $onDestroy() {
    //     this.openTaskInfo();
    //     this.closeTaskInfo();
    // }

    switchEditMode() {
        this.isEditing = !this.isEditing;
    }
}