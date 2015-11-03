define(
[
  "../../../core/declare",
  "dojo/_base/lang", 
  "dojo/has", 
  "./MenuItemBase",
  "../../../kernel"
], function(
  declare, lang, has, MenuItemBase, esriKernel
) {
  var Edit = declare([ MenuItemBase ], {
    declaredClass: "esri.widgets.editing.tools.Edit",

    enable: function(geometryType) {
      this._enabled = geometryType === this._geomType;
      this.inherited(arguments);
    }
  });

  

  return Edit;
});
