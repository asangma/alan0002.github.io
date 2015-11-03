define(
[
    "../../../core/declare",
    "dojo/_base/lang", 
    "dojo/has", 
    "dijit/form/Button", 
    "./ToolBase",
    "../../../kernel"
], function(
    declare, lang, has, Button, ToolBase, esriKernel
) {
    var BTB = declare([ Button, ToolBase ] ,{
        declaredClass: "esri.widgets.editing.tools.ButtonToolBase",

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
            Button.prototype.destroy.apply(this, arguments);  
            ToolBase.prototype.destroy.apply(this, arguments);
        }

    });

    

    return BTB;
});
