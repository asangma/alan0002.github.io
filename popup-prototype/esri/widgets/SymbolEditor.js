define(
  [
    "../core/declare",
    "dojo/_base/lang",
    "dojo/has",
    "../kernel",

    "dojo/_base/array",
    "dojo/_base/Color",
    "dojo/dom-construct",
    "dojo/query",

    "dijit/_Widget",
    "dijit/_TemplatedMixin",

    "../core/domUtils",
    "./Form",
    "dojo/text!./templates/SymbolEditor.html",

    "dojo/i18n!../nls/jsapi"
  ], function (
    declare, lang, has, esriKernel,
    array, Color, domConstruct, query,
    _Widget, _TemplatedMixin,
    domUtils, Form, widgetTemplate,
    jsapiBundle
  ) {
    var SE = declare([_Widget, _TemplatedMixin], {
      declaredClass: "esri.widgets.SymbolEditor",

      widgetsInTemplate: true,
      templateString: widgetTemplate,

      symbolConfigLabel: jsapiBundle.widgets.textSymbolEditor.symbolConfiguration,
      alignmentLabel: jsapiBundle.widgets.textSymbolEditor.alignment,
      colorLabel: jsapiBundle.widgets.textSymbolEditor.color,

      constructor: function (params, srcNodeRef) {
        //params may have {grahic: graphic}        
      },

      destroy: function () {
        this.inherited(arguments);
        this.form.destroy();
        this.form = null;
      },

      createForm: function (feature) {
        feature = feature || this.graphic;
        if (!feature) {
          return ;
        }
        var symbol = feature.symbol || (feature.getLayer().renderer && feature.getLayer().renderer.getSymbol(feature)),
            data = {}, formHolder;

        //reuse the existing form widget
        if (this.form && (!this._symbolType || this._symbolType === symbol.type)) {
          data.color = symbol.color.toHex();
          data.alignment = (symbol.verticalAlignment || "baseline") +
                           "," +
                           symbol.horizontalAlignment;
          if (this._symbolChangeHandler) {
            this._symbolChangeHandler.remove();
          }
          this.form.setValues(data);

          this._symbolChangeHandler = this.form.on("value-change", lang.hitch(this, "_valueChangeCallback", feature, symbol));
        } 
        else {
          //recreate the form widget if the symbol type is different
          if (this.form) {
            this.destroy();
          }
          this._symbolType = symbol.type;
          formHolder = domConstruct.create('div', null, this.domNode);
          switch (symbol.type) {
          case 'textsymbol':
            this.form = this._createTextEditorForm(symbol, formHolder);
            break;
            //more cases for othet types of symbols, such as simpleMarkerSymbol
            //case 'SimpleMarkerSymbol'
          }

          this.form.startup();

          this._symbolChangeHandler = this.form.on("value-change", lang.hitch(this, "_valueChangeCallback", feature, symbol));
        }
      },

      /*****************
       * Public Methods
       *****************/
       hide: function(){
         domUtils.hide(this.domNode);
       },

       show: function(){
         domUtils.show(this.domNode);
       },

      /*****************
       * Internal Methods
       *****************/
      _createTextEditorForm: function (symbol, formHolder) {
        var alignment = (symbol.verticalAlignment || "baseline") + "," + symbol.horizontalAlignment,
            color = symbol.color.toHex(),
            form = new Form({
              fields: [
              {
                'name': 'alignment',
                'label': this.alignmentLabel,
                'type': 'string',
                'value': alignment,
                'widget': "./FontAlignment"
              },
              {
                'name': 'color',
                'label': this.colorLabel,
                'type': 'string',
                'value': color,
                'widget': "dijit/ColorPalette",
                'widgetParameters': {
                  'palette': "7x10"
                }
              } 
            ]
          }, formHolder);

        return form;
      },

      _valueChangeCallback: function (feature, symbol, e) {
        if (e.fieldName === "color") {
          symbol.setColor(new Color(e.value));
        }
        else if (e.fieldName === "alignment") {
          var v = e.value.split(",")[0],
              h = e.value.split(",")[1];
          symbol.setHorizontalAlignment(h);
          symbol.setVerticalAlignment(v);
        } 
        /*else if (e.fieldName === 'family') {
          symbol.font.setFamily(e.value);
         }*/
        feature.setSymbol(symbol);
        //fire symbol change event
        this.emit('symbol-change', {'symbol':symbol});
      }
    });

    

    return SE;
  });