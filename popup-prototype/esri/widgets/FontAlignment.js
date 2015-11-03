define(
  [
    "require",
    "../core/declare",
    "dojo/_base/lang",
    "dojo/has",
    "../kernel",

    "dojo/_base/array",
    "dojo/query",
    "dojo/dom-class",

    "dijit/_Widget",
    "dijit/_TemplatedMixin",

    "dojo/text!./templates/FontAlignment.html"
  ], function (
    require,
    declare, lang, has, esriKernel,
    array, query,domClass,
    _Widget, _TemplatedMixin,
    widgetTemplate
  ) {
    var FA = declare([_Widget, _TemplatedMixin], {
      declaredClass: "esri.widgets.FontAlignment",

      widgetsInTemplate: true,
      templateString: widgetTemplate,
      _imageUrl: require.toUrl("./images/positionSprite.png"),

      constructor: function (params, srcNodeRef) {
      },

      destroy: function () {
        this.inherited(arguments);
      },

      /*****************
       * Public Methods
       *****************/
      setValue: function (value) {
        this.value = value;
        var btns = query("button", this.domNode);
        array.forEach(btns, function(btn){
          //the initial selected alignment position
          if (btn.value === value) {
            domClass.add(btn, "selectedFontAlignment");
          }
        });
      },

      getValue: function () {
        return this.value;
      },

      changeValue: function(e){
        var btns = query("button", this.domNode);
        array.forEach(btns, function(btn){
          domClass.remove(btn, "selectedFontAlignment");
        });
        domClass.add(e.currentTarget, "selectedFontAlignment");
        this.value = e.currentTarget.value;
        this.emit("change", {"value": this.value});
      }
    });

    

    return FA;
  });