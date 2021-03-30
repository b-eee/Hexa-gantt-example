import template from './new-item.template.html';
import controller from './new-item.controller'
import './new-item.css';

export default {
    bindings: { 
        onClose: '&' 
    },
    template: template,
    controller: controller
};