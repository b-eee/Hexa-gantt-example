import template from './edit-item.template.html';
import controller from './edit-item.controller'
import './edit-item.css';

export default {
    bindings: { 
        onClose: '&' 
    },
    template: template,
    controller: controller
};