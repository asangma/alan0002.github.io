define(
[
    "../../../core/declare",
    "dojo/_base/lang", 

    "dojo/has", 

    "dijit/form/ToggleButton",
    "./ToolBase",

    "../../../kernel"
], function(
    declare, lang,
    has,
    ToggleButton, ToolBase,
    esriKernel
) {
    var TTB = declare([ ToggleButton, ToolBase], {
        declaredClass: "esri.widgets.editing.tools.ToggleToolBase",

        /************
        * Overrides 
        ************/ 
        postCreate : function() {
            this.inherited(arguments);
            if (this._setShowLabelAttr){
                this._setShowLabelAttr(false);
            }
        },

        destroy: function(){
           ToggleButton.prototype.destroy.apply(this, arguments);  
           ToolBase.prototype.destroy.apply(this, arguments);
        },

        /*****************
        * Event Listeners
        *****************/
        setChecked : function(checked) {
           ToggleButton.prototype.setChecked.apply(this, arguments);
        }
    });

    

    return TTB;
});
