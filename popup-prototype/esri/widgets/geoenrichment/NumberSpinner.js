define([
    "../../core/declare",
    "dijit/form/NumberSpinner",
    "dojo/text!./templates/NumberSpinner.html"
], function (declare, NumberSpinner, template) {

    return declare([NumberSpinner], {
        templateString: template,
        cssStateNodes: {},
        required: true
    });
});