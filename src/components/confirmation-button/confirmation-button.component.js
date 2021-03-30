import template from './confirmation-button.template.html';
import controller from './confirmation-button.controller'
import './confirmation-button.css';

export default {
    bindings: {
        confirmation: '&'
    },
    template: template,
    controller: controller
};