define(
[ 
  "require",
  "../../core/declare",
  "dojo/_base/lang",
  "dojo/_base/connect",
  "dojo/_base/event",
  "dojo/_base/kernel",
  "dojo/has",
  "dojo/dom-construct",
  "dojo/dom-class",
  "dojo/dom-attr",
  "dojo/dom-style",
  "dojo/string",
  "dojo/number",
  
   "dijit/_WidgetBase",
  "dijit/_TemplatedMixin",
  "dijit/_OnDijitClickMixin",
  "dijit/_FocusMixin",
  
  "../../kernel",
  "../../core/lang",
  "dojo/i18n!../../nls/jsapi",
  "dojo/text!./templates/CreditEstimator.html"
],

function(require, declare, lang, connection, event, kernel, has, domConstruct, domClass, domAttr, domStyle, string,  number, _WidgetBase, _TemplatedMixin, _OnDijitClickMixin, _FocusMixin, esriKernel, esriLang, jsapiBundle , template) {
 
  var CreditEstimator = declare([_WidgetBase, _TemplatedMixin, _OnDijitClickMixin, _FocusMixin], {
    declaredClass: "esri.widgets.analysis.CreditEstimator",
    i18n: null,
    basePath: require.toUrl("."),
    templateString: template,
    
    postMixInProperties: function() {
      this.inherited(arguments);
      this.i18n = {};
      lang.mixin(this.i18n, jsapiBundle.common);
      lang.mixin(this.i18n, jsapiBundle.analysisMsgCodes);
      lang.mixin(this.i18n, jsapiBundle.creditEstimator);
    },
    
    postCreate: function() {
      this.inherited(arguments);
    },
    
    _setContentAttr: function(obj) {
      ////cost: 2.12, Total records: 2120
      var str= "";
      //{"error":{"code":"GP_012","message":"Invalid External Operation","params":{}}}
      //obj.messageCode  = obj.code;
      if(obj.code && !obj.messageCode) {
        obj.messageCode = obj.code;
      }
      if(obj.messageCode){
         str = esriLang.isDefined(this.i18n[obj.messageCode]) ? this.i18n[obj.messageCode] : obj.message;
         str =  esriLang.isDefined(obj.params) ? string.substitute(str, obj.params) : str;
         domAttr.set(this._messageDiv, "display", "block");
         domAttr.set(this._messageDiv, "innerHTML", str);
         domStyle.set(this._table, "display", "none");
      }
      else {
        domStyle.set(this._table, "display", "table");
        domAttr.set(this._messageDiv, "display", "none");
        domAttr.set(this._messageDiv, "innerHTML", "");
        //console.log(obj.totalRecords);
        //console.log(number.format(obj.totalRecords,{locale: dojo.locale}));
        //console.log(obj.cost);
        //console.log(number.format(obj.cost,{locale: dojo.locale}));
        domAttr.set(this._totalRecordsNode, "innerHTML", number.format(obj.totalRecords,{locale: kernel.locale}));
        domAttr.set(this._creditsReqNode, "innerHTML", number.format(obj.cost,{locale: kernel.locale}));
      }
    }

  });

  
  return CreditEstimator;  
});
    