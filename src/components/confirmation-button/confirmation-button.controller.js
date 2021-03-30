export default class ConfirmationButtonComponent {
    constructor() {
        this.$flipper;
    }

    $onInit () {
        var el = document.querySelector('.flip-it');
        this.$flipper = angular.element(el)[0];
    }

    flip () {
        this.$flipper.classList.add('fliped');
    }

    confirm() {
        this.$flipper.classList.remove('fliped');
        this.confirmation();
    }

    cancel() {
        this.$flipper.classList.remove('fliped');
    }
}