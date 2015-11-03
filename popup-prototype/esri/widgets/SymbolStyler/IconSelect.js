define([
  "../../kernel",

  "dijit/form/Select",

  "dojo/_base/array",
  "../../core/declare",
  "dojo/_base/lang",
  "dojo/dom-class",
  "dojo/has"
], function (
  esriKernel,
  Select,
  array, declare, lang, domClass, has
) {

  var IconSelect = declare("esri.widgets.SymbolStyler.IconSelect", [Select], {

    baseClass: "esriIconSelect dijitSelect dijitValidationTextBox",

    _extraIconClass: null,

    addIconOptions: function (options, extraIconClass) {
      extraIconClass = extraIconClass || "";

      var iconOptions = array.map(options, function (option) {
        return {
          value: option,
          iconClass: extraIconClass + " " + option
        };
      });

      this.addOption(iconOptions);
    },

    _getMenuItemForOption: function (option) {
      var optionItem = this.inherited(arguments);

      optionItem.set("iconClass", option.iconClass);

      return optionItem;
    },

    _setValueAttr: function (value) {
      this.inherited(arguments);

      var linePatternContainer = this.containerNode;

      domClass.remove(linePatternContainer, this._getAllIconClasses());
      domClass.add(linePatternContainer, this.get("selectedOptions").iconClass);
    },

    _getAllIconClasses: function () {
      return array.map(this.options, function (option) {
        return option.iconClass;
      });
    }

  });

  

  return IconSelect;
});
