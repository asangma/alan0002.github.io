define(
[
    "../../../core/declare",
    "dojo/_base/lang", 

    "dojo/has", 
    "dijit/MenuItem",

    "./ToolBase",
    "../../../kernel"
], function(
    declare, lang,
    has, MenuItem,
    ToolBase, esriKernel
) {
    var MIB = declare([MenuItem, ToolBase], {
        declaredClass: "esri.widgets.editing.tools.MenuItemBase",
        /************
        * Overrides 
        ************/
        destroy: function(){
            MenuItem.prototype.destroy.apply(this, arguments);  
            ToolBase.prototype.destroy.apply(this, arguments);
        }
    });

    

    return MIB;
});
