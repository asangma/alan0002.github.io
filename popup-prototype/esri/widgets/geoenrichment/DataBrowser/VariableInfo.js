define([
    "../../../core/declare",
    "dojox/mvc/Templated",
    "dijit/_WidgetBase",
    "dojo/text!./templates/VariableInfo.html",
    "dojo/i18n!../../../nls/jsapi"
], function (
    declare,
    Templated,
    _WidgetBase,
    template,
    nls
) {
    nls = nls.geoenrichment.dijit.VariableInfo;


    var VariableInfo = declare("esri.widgets.geoenrichment.VariableInfo", [_WidgetBase, Templated], {
        nls: nls,
        templateString: template,

        constructor: function () {
            this.inherited(arguments);
        },

        buildRendering: function () {
            this.inherited(arguments);
        },

        _setVariableAttr: function (object) {

            
            this.divDescription.innerHTML = (object.description ? object.description : object.alias);
            this.divID2.innerHTML = object.id2;
            this.divSource.innerHTML = "";

            for (var tagNumber in object.filteringTags) {
                if (object.filteringTags[tagNumber].id === "Source") {
                    this.divSource.innerHTML = object.filteringTags[tagNumber].value;
                    break;
                }
            }
            this.divVintage.innerHTML = object.vintage;
        }
    });

    return VariableInfo;

});