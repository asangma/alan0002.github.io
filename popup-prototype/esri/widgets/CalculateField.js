/******************************************
  esri/widgets/CalculateField
******************************************/
define(
[ 
  "require",
  "../core/declare",
  "dojo/_base/lang",
  "dojo/_base/array",
  "dojo/_base/kernel",
  "dojo/_base/fx",
  "dojo/string",
  "dojo/dom-style",
  "dojo/dom-attr",
  "dojo/dom-construct",
  "dojo/_base/event",
  "dojo/Evented",
  "dojo/fx/easing",
  "dojo/store/Memory",
  "dojo/mouse",
  "dojo/on",

  "dijit/_WidgetBase",
  "dijit/_TemplatedMixin",
  "dijit/_WidgetsInTemplateMixin",
  "dijit/_OnDijitClickMixin",
  "dijit/_FocusMixin",
  "dijit/Tooltip",
  "dgrid/OnDemandList",
  "dgrid/Selection",
  "dgrid/Keyboard",
  "dgrid/extensions/DijitRegistry",

  "../kernel",
  "../core/lang",
  "../request",

  "dojo/i18n!../nls/jsapi",

  "dojo/text!./templates/CalculateField.html",

  "dijit/form/Button",
  "dijit/form/Form",
  "dijit/form/RadioButton",
  "dijit/form/Select",
  "dijit/form/SimpleTextarea",

  "dijit/layout/ContentPane"
], function(require, declare, lang, array, kernel, fx, string, domStyle, domAttr, domConstruct, event, Evented, easing, Memory, mouse, on, _WidgetBase,
   _TemplatedMixin, _WidgetsInTemplateMixin,  _OnDijitClickMixin, _FocusMixin, Tooltip, List, Selection, Keyboard, DijitRegistry, esriKernel, esriLang, esriRequest, jsapiBundle, template) {
  var StandardList = declare([List, Keyboard, Selection, DijitRegistry]);
  var CalculateField = declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin,  _OnDijitClickMixin, _FocusMixin, Evented], {

    declaredClass: "esri.widgets.CalculateField",

    templateString: template,
    basePath: require.toUrl("."),
    widgetsInTemplate: true,
    showSelectField: false,
    showHeader: true,
    closeOnAdd: true,
    addButtonClass: "",
    closeButtonClass:"",
    _showMsgTimerInterval: 3000,
    
    constructor: function(params){
      if(params.containerNode) {
        this.container = params.containerNode;
      }
    },
    
    destroy: function(){
      this.inherited(arguments);
    },
    
    postMixInProperties: function(){
      this.inherited(arguments);
      this.i18n = {};
      lang.mixin(this.i18n, jsapiBundle.common);
      lang.mixin(this.i18n, jsapiBundle.calculateFields);
    },
    
    postCreate: function(){
      this.inherited(arguments);
      this._buildUI();
      this._loadEvents();
      var rtlLocales = ["ar", "he"], i, rLocale;
      this.onlineHelpMap = {};
      for(i = 0; i<rtlLocales.length; i=i+1) {
        rLocale = rtlLocales[i];
        if (kernel.locale && kernel.locale.indexOf(rLocale) !== -1) {
          if(kernel.locale.indexOf("-")!== -1) {
            if(kernel.locale.indexOf(rLocale + "-") !== -1) {
              this._isRightToLeft = true; 
            }
          }
          else {
          this._isRightToLeft = true; 
          }
        }
      }      
      this.validate();
    },
    
    _buildUI: function() {
      var fields = [], helpersData, selFieldArr, selField;
      domStyle.set(this._header, "display", this.showHeader? "block" : "none");
      domStyle.set(this._selCalcFieldDiv, "display", this.showSelectField? "block" : "none");
      if(this.field) {
        selFieldArr = array.filter(this.layer.fields, function(field) {
          return (field.name === this.field);
        }, this);      
        selField = selFieldArr[0];
        this._calcField = selField;
        domAttr.set(this._calcFieldLabel, "innerHTML", string.substitute(this.i18n.exprLabel, {fieldName: selField.name}));
      }
      if(!this.helperMethods || (this.helperMethods && this.helperMethods.length === 0)) {
       var defArr =  [
          {
            type: "NumType",
            label: string.substitute(this.i18n.absFunc, {functionName: "ABS(<i>number</i>)", num: "<i>number</i>"}),
            name: "ABS()"
          },
          {
            type: "NumType",
            label: string.substitute(this.i18n.castFunc, {functionName: "CAST(<i>number</i>", num:"<i>number</i>"}), 
            name: "CAST()"
          },
          {
            type: "NumType",
            label: string.substitute(this.i18n.ceilingFunc, {functionName:"CEILING(<i>number</i>)", num:"<i>number</i>"}),
            name: "CEILING()"
          },
          {
            type: "NumType",
            label: string.substitute(this.i18n.cosFunc, {functionName:"COS(<i>number</i>)", num:"<i>number</i>"}),
            name: "COS()"
          }, 
          {
            type: "NumType",
            label: string.substitute(this.i18n.floorFunc, {functionName:"FLOOR(<i>number</i>)", num:"<i>number</i>"}),
            name: "FLOOR()"
          },
          {
            type: "NumType",
            label: string.substitute(this.i18n.logFunc, {functionName:"LOG(<i>number</i>)", num:"<i>number</i>"}),
            name: "LOG()"
          },         
          {
            type: "NumType",
            label: string.substitute(this.i18n.log10Func, {functionName:"LOG10(<i>number</i>)", num:"<i>number</i>"}),
            name: "LOG10()"
          },         
          {
            type: "NumType",
            label: string.substitute(this.i18n.modFunc, {
                                      functionName: "MOD(<i>number</i>, <i>n</i>)", 
                                      num: "<i>number</i>", 
                                      n: "<i>n</i>"
                                    }),
            name: "MOD(,)"
          },       
          {
            type: "NumType",
            label: string.substitute(this.i18n.powerFunc, {
                                      functionName: "POWER(<i>number</i>, <i>y</i>)", 
                                      num: "<i>number</i>", 
                                      y: "<i>y</i>"
                                    }),
            name: "POWER(,)"
          },
          {
            type: "NumType",
            label: string.substitute(this.i18n.roundFunc, {
                                      functionName:"ROUND(<i>number</i>, <i>length</i>)", 
                                      num:"<i>number</i>", 
                                      length:"<i>length</i>"
                                    }), 
            name: "ROUND(,)"
          },
          {
            type: "NumType",
            label: string.substitute(this.i18n.sinFunc, {functionName:"SIN(<i>number</i>)", num:"<i>number</i>"}),
            name: "SIN()"
          },   
          {
            type: "NumType",
            label: string.substitute(this.i18n.tanFunc, {functionName:"TAN(<i>number</i>)", num:"<i>number</i>"}),
            name: "TAN()"
          },         
          {
            type: "NumType",
            label: string.substitute(this.i18n.truncateFunc, {
                                      functionName: "TRUNCATE(<i>number</i>, <i>decimal_place</i>)", 
                                      num: "<i>number</i>", 
                                      decimal_place: "<i>decimal_place</i>"
                                    }),
            name: "TRUNCATE(,)"
          },
          {
            type: "NumType",
            label: string.substitute(this.i18n.nullifFunc, {functionName:"NULLIF(<i>number</i>,<i>value</i>)", num:"<i>number</i>", value:"<i>value</i>"}),
            name: "NULLIF(,)"
          },
          {
            type: "StrType",
            label: string.substitute(this.i18n.char_lengthFunc, {functionName:"CHAR_LENGTH(<i>string</i>)", str:"<i>string</i>"}),
            name: "CHAR_LENGTH()"
          },
          {
            type: "StrType",
            label: string.substitute(this.i18n.concatFunc, {functionName:"CONCAT(<i>string1</i>, <i>string2</i>)"}),
            name: "CONCAT(,)"
          },
          {
            type: "StrType",
            label: string.substitute(this.i18n.positionFunc, {functionName:"POSITION(<i>substring</i>, <i>string</i>)", str:"<i>string</i>"}),
            name: "POSITION(,)"
          },
          {
            type: "StrType",
            label: string.substitute(this.i18n.lowerFunc, {functionName:"LOWER(<i>string</i>)", str:"<i>string</i>"}),
            name: "LOWER()"
          },
          {
            type: "StrType",
            label: string.substitute(this.i18n.substringFunc, {
                                    functionName: "SUBSTRING(<i>string</i>, <i>start</i>, <i>length</i>)", 
                                    start: "<i>start</i>", 
                                    length: "<i>length</i>", 
                                    str: "<i>string</i>"
                                  }), 
            name: "SUBSTRING(,,)"
          },         
          {
            type: "StrType",
            label: string.substitute(this.i18n.trimFunc, { functionName:"TRIM(BOTH|LEADING|TRAILING] ‘ ‘ FROM expression)", str:"<i>string</i>"}), 
            name: "TRIM()"
          },
          {
            type: "StrType",
            label: string.substitute(this.i18n.upperFunc,{functionName:"UPPER(<i>string</i>)", str:"<i>string</i>"}), 
            name: "UPPER()"
          },
          {
            type: "DateType",
            label: string.substitute(this.i18n.current_dateFunc,{functionName: "CURRENT_DATE()"}),
            name: "CURRENT_DATE()"
          },
          {
            type: "DateType",
            label: string.substitute(this.i18n.current_timeFunc,{functionName: "CURRENT_TIME()"}),
            name: "CURRENT_TIME()"
          },
          {
            type: "DateType",
            label: string.substitute(this.i18n.current_timestampFunc,{functionName: "CURRENT_TIMESTAMP()"}),
            name: "CURRENT_TIMESTAMP()"
          }         
        ];
        array.forEach(defArr, function(item) {
          item.label = "<b>" + item.label.substring(0, item.label.lastIndexOf(":") + 1) + "</b><br/> " + item.label.substring(item.label.lastIndexOf(":") + 1);
          //console.log(item.label);
        }, this);
        this.set("helperMethods", defArr);        
      }
      //build operators
      if(!this.operators || (this.operators && this.operators.length === 0)) {
        this.set("operators", ["+", "-", "/", "*", "(", ")"]);
      }
      this._operatorBtns = [];
      array.forEach(this.operators, function(operator) {
        this._operatorBtns.push(new Button({
                     value: operator,
                     label: operator,
                     style: {"width":"4em"},
                     onClick: lang.hitch(this, this._updateExpression, {value: operator, type: "operator"})
                   }, domConstruct.create("div", null, this._operatorCtr)));
      }, this);
      //stores and grid  
      if(this.layer && this.layer.fields && this.layer.fields.length > 0) {
        fields = this._createIds(this.layer.fields);
        var fnames = array.map(this.layer.fields, function(field) {
          return {
                   label : field.name, 
                   value:  field.name
          }; 
        });
        this._selCalcField.addOption(fnames);
        this._selCalcField.set("value", this.field);
      }
      this.fieldsStore = new Memory({data: fields});
      //consolelog(fields);
      //consolelog(this.fieldsStore);
      this.attributeList = new StandardList({ 
                                renderRow: lang.hitch(this, this._renderAttributesRow),
                                selectionMode: "single",
                                store: this.fieldsStore
                              }, this._attributeListCtr);
      helpersData = this._createIds(this.get("helperMethods"));
      this.operatorStore = new Memory({data: helpersData});
      //consolelog(helpersData);
      //consolelog(this.operatorStore);
      this.helpersList = new StandardList({ 
                           renderRow: lang.hitch(this, this._renderOperatorRow),
                           selectionMode: "single",
                           store: this.operatorStore
                         }, this._helpersListCtr);      
    },
    
    _loadEvents: function() {
      this.watch("fields", lang.hitch(this, this._handleFieldsChange));
      this.watch("field", lang.hitch(this, this._handleFieldChange));
      if(this.showSelectField) {
        this._selCalcField.on("change", lang.hitch(this, this._handleSelcCalFieldChange)); 
      }
      this._expressionForm.watch("value", lang.hitch(this, this._handleHelperTypeChange));
      this._expressionForm.on("focus", lang.hitch(this, this._setfocus));
      this._exprBox.watch("value", lang.hitch(this, this._handleExpChange));
      this.attributeList.on("dgrid-select", lang.hitch(this, function(e) {
          var rows = e.rows;
          this._updateExpression({value: rows[0].data, type: "field"});
      }));
      this.helpersList.on("dgrid-select", lang.hitch(this, function(e) {
          var rows = e.rows;
          this._updateExpression({value: rows[0].data, type: "helper"});
      }));
      this.attributeList.on(mouseUtil.enterRow, lang.hitch(this, function(e) {
        var row = this.attributeList.row(e), labelSnippet, lbl, type;
        lbl = row.data.alias||row.data.name;
        type = "";
        type = this._getTypeLabel(row.data.type);
        labelSnippet = "<b>" + lbl + "</b>: " + type;
        this._showTooltip(row.element, labelSnippet);
      }));
      this.attributeList.on(mouseUtil.leaveRow, lang.hitch(this, function(e) {
        var row = this.attributeList.row(e);
        this._hideTooltip(row.element);
      }));
      
      this.helpersList.on(mouseUtil.enterRow, lang.hitch(this, function(e) {
        var row = this.helpersList.row(e);
        this._showTooltip(row.element, row.data.label);
      }));
      this.helpersList.on(mouseUtil.leaveRow, lang.hitch(this, function(e) {
        var row = this.helpersList.row(e);
        this._hideTooltip(row.element);
      }));      
      
      this.attributeList.on("dgrid-refresh-complete", lang.hitch(this, this._setfocus));
      this.helpersList.on("dgrid-refresh-complete", lang.hitch(this, this._setfocus));
      //for caret position
      this._exprBox.on("blur", lang.hitch(this, function() {
        if(this._exprBox.textbox.setSelectionRange && typeof this._exprBox.textbox.selectionStart == "number") {
          this._exprBox.set("cursorPosition", [this._exprBox.textbox.selectionStart, this._exprBox.textbox.selectionEnd]);
        }
		else {
          this._exprBox.set("cursorPosition", this._getCursorRange(this._exprBox.textbox));
        }
      }));
      this._exprBox.on("focus", lang.hitch(this, function() {
        //console.log("focus handler");
        var cursorPosition = this._exprBox.get("cursorPosition");
        if(cursorPosition) {
          if(this._exprBox.textbox.setSelectionRange && typeof this._exprBox.textbox.selectionStart == "number") {
            this._exprBox.textbox.setSelectionRange(cursorPosition[1], cursorPosition[1]);
          }
          else {
            this._setCaretPosition(this._exprBox.textbox, cursorPosition[1], cursorPosition[1]);  
          }
        }
      }));
      on(this._calcFieldLabel, mouse.enter, lang.hitch(this, function(evt) {
        var type = "";
        type = this._getTypeLabel(this._calcField.type);
        this._showTooltip(this._calcFieldLabel, "<b>"+this._calcField.alias+"</b>: "+ type);
      }));
      on(this._calcFieldLabel, mouse.leave, lang.hitch(this, function(evt) {
        this._hideTooltip(this._calcFieldLabel);
      }));
      
    },
    
    startup: function() {
      this.inherited(arguments);
      this.attributeList.startup();
      this.helpersList.startup();
      this._setHelperType();
    },
    
    reset: function() {
      esriKernel.show(this.domNode);
      this._expressionForm.reset();
      this._handleCloseMsg();
      this._setHelperType();
    },
    
    _close: function() {
      this.emit("close",{});
      esriKernel.hide(this.domNode);      
    },
    
    //store and grid methods
    _createIds: function(arr) {
      var fields = [];
      if(arr && arr.length > 0) {
         fields = array.map(arr, function (field, idx) {
          return lang.mixin(field, {id: idx});
        });
      }
      return fields;
    },      
    
    _renderAttributesRow: function (variable) {
      var divOuter = domConstruct.create("div", { "class": "esriCalExpRowOuter" });
      var div = domConstruct.create("div", { "class": "esriCalcExpLabelRow" }, divOuter);
      domConstruct.create("div", { "class": "esriCalcFieldTextTrimWithEllipses", innerHTML: variable.name }, div);
      return divOuter;
    },
    
    _renderOperatorRow: function (variable) {
      var divOuter = domConstruct.create("div", { "class": "esriCalExpRowOuter" });
      var div = domConstruct.create("div", { "class": "esriCalcExpLabelRow" }, divOuter);
      domConstruct.create("div", { "class": "esriCalcFieldTextTrimWithEllipses", innerHTML: variable.name }, div);
      return divOuter;
    },
    
    _handleFieldsChange: function(attr, oldvalue, newValue) {
      //console.log(newValue, this.layer);
      var fields =[];
      if(this.layer && this.layer.fields && this.layer.fields.length > 0) {
        if(this._selCalcField.getOptions().length > 0) {
          this._selCalcField.removeOption(this._selCalcField.getOptions());  
        }
      
        fields = this._createIds(this.layer.fields);
        var fnames = array.map(this.layer.fields, function(field) {
          return {
                   label : field.name, 
                   value:  field.name
          }; 
        });
        this._selCalcField.addOption(fnames);
        this._selCalcField.set("value", this.field);
      }
      this.fieldsStore = new Memory({data: fields});
      this.attributeList.set("store", this.fieldsStore); 
    },

    _handleFieldChange: function(attr, oldvalue, newValue) {
      //console.log(this.field, newValue, oldvalue);
      domAttr.set(this._calcFieldLabel, "innerHTML", string.substitute(this.i18n.exprLabel, {fieldName: newValue}));
      this._setHelperType();
      this._setfocus();
    },
    
    _setHelperType: function() {
      //console.log("_setHelperType");
      var selFieldArr, selField;
      if(this.field) {
        selFieldArr = array.filter(this.layer.fields, function(field) {
          return (field.name === this.field);
        }, this);      
        selField = selFieldArr[0];
        if(!esriLang.isDefined(selField)) {
          this._strRadioBtn.set("checked", true);
          return;
        }
        this._calcField = selField;  
        if(selField.type === "esriFieldTypeDate") {
          this._dateRadioBtn.set("checked", true);
        }
        else if(selField.type === "esriFieldTypeString") {
          this._strRadioBtn.set("checked", true);
        }
        else if (array.indexOf(["esriFieldTypeSmallInteger", "esriFieldTypeInteger", "esriFieldTypeSingle", "esriFieldTypeDouble"], selField.type) !== -1) {
          this._numRadioBtn.set("checked", true);
        }        
      }
      else {
        this._strRadioBtn.set("checked", true);
      }
    },    

    _handleHelperTypeChange: function(attr, oldvalue, newValue) {
      this.helpersList.set("query", {type:newValue.functionType});
      if(newValue.functionType === "DateType") {
        this.attributeList.set("query", {type:"esriFieldTypeDate"});
      }
      else if(newValue.functionType === "StrType") {
        this.attributeList.set("query", {type:"esriFieldTypeString"});
      }
      else if(newValue.functionType === "NumType") {
        this.attributeList.set("query", function(object){
          return (array.indexOf(["esriFieldTypeSmallInteger", "esriFieldTypeInteger", "esriFieldTypeSingle", "esriFieldTypeDouble"], object.type) !== -1);
        });
      }
      this.helpersList.refresh();
      this.attributeList.refresh();
    },
    
    _handleSelcCalFieldChange: function(value) {
      this.set("field", value);
    },
    
    _handleRemoveBtnClick: function() {
      this._exprBox.set("value", "");
      this._setfocus();
    },
    
    _handleAddButtonClick : function(e) {
      event.stop(e);
      //format :calcExpression”: ”[{“field” : <fieldname>, (“value” | “sqlExpression”) 
      var expr = this._exprBox.get("value"),
        request = {f: "json" },
        def;
      if(!expr) {
        this._addBtn.set("disabled", true);
        return;
      }
      this._handleCloseMsg();
      request.calcExpression = JSON.stringify(this.get("expression"));
      request.sqlFormat = "standard";
      if(this.layer.getDefinitionExpression && this.layer.getDefinitionExpression()) {
        request.where = this.layer.getDefinitionExpression(); 
      }
      else if(esriLang.isDefined(this.layer.definitionExpression) && this.layer.definitionExpression !== "") {
        request.where = this.layer.definitionExpression; 
      }
      //console.log(esriKernel.id.findCredential(this.layer.url));
      esriKernel.id.getCredential(this.layer.url + "/calculate").then(lang.hitch(this, function(credObj) {
        request.token = credObj.token;
        def = esriRequest({"url":this.layer.url + "/calculate", "content": request}, {"usePost":true});
        this.emit("calculate-start", {calcPromise: def.promise});
        this._addBtn.set("disabled", true);
        this._showLoading();
        def.then(lang.hitch(this, function(response){
          this._addBtn.set("disabled", false);
          this._hideLoading();
          var resObj = {};
          lang.mixin(resObj, {
            calcExpression: (JSON.parse(request.calcExpression))[0].sqlExpression,
            where: request.where,
            sqlFormat: request.sqlFormat
          }, response);
          this.emit("calculate-success", resObj);
          //CalculateField widget has to refresh the layer as layer is not aware of the calculate
          this.layer.refresh();
          this._showMessages(string.substitute(this.i18n.successMsg, {count: response.updatedFeatureCount}), true);
          if(this.closeOnAdd) {
            this._close();
          }
        }), 
        lang.hitch(this, this._handleErrorResponse));
      }), 
      lang.hitch(this, this._handleErrorResponse));
    },
    
    _handleErrorResponse: function(errorResp) {
      this._addBtn.set("disabled", false);
      this._hideLoading();
      this.emit("calculate-error", errorResp);
      this._showMessages(string.substitute(this.i18n.exprFailedMsg,  {expr: this._exprBox.get("value")})  + "<br/>" + errorResp.details.toString());      
    },
    
    _handleCloseButtonClick: function(e) {
      event.stop(e);
      this._close();
    }, 
    
    _showTooltip: function(element, str)  {
      var toolTipNode = domConstruct.create("label", {innerHTML: str, className: "esriSmallFont"});
      if(this._isRightToLeft) {
        Tooltip.show(toolTipNode.outerHTML, element, ["after"], true);  
      }
      else {
        Tooltip.show(toolTipNode.outerHTML, element, ["after"]);  
      }
      
    },
    
    _hideTooltip: function(element, item) {
      Tooltip.hide(element);
    },
  
    _setfocus: function() {
     this._exprBox.focus(); 
    },    
    
    _showMessages: function(msg, isTimer) {
      domAttr.set(this._bodyNode, "innerHTML", msg);
      fx.fadeIn({
        node: this._errorMessagePane,
        easing: easing.quadIn,
        onEnd: lang.hitch(this, function() {
          domStyle.set(this._errorMessagePane, {display: ""});
        })
      }).play();
      if(isTimer) {
        window.setTimeout(lang.hitch(this, this._handleCloseMsg), this._showMsgTimerInterval);
      }
    },
    
    _handleCloseMsg: function(e) {
      if(e) {
        e.preventDefault();
      }
      if(domStyle.get(this._errorMessagePane, "display") === "none") {
        return;
      }
      fx.fadeOut({
        node: this._errorMessagePane,
        easing: easing.quadOut,
        onEnd: lang.hitch(this, function() {
          domStyle.set(this._errorMessagePane, {display: "none"});
        })
      }).play();
    },
    
    validate: function() {
      var isValid = true, msg = "";
      if(!this.layer) {
        msg = this.i18n.layerReqMsg;
        isValid = false;
      }
      else if(!this.field) {
        msg = this.i18n.fieldReqMsg;
        isValid = false;
      }
      else if(!this.layer.supportsCalculate) {
        msg = string.substitute(this.i18n.lyrSupportCalMsg, {layername: this.layer.name});
        isValid = false;
      }
      else if(!this.layer.userIsAdmin && !(this.layer.getEditCapabilities()).canUpdate) {
        msg = string.substitute(this.i18n.lyrUpdateCapMsg, {layername: this.layer.name});
        isValid = false;
      }
      this._addBtn.set("disabled", !isValid);
      return isValid;
    },
    
    _validateExpObj: function(cur) {
      var isValid = true, msg;//,  cpos = this._exprBox.get("cursorPosition"), pos = 0;
      if(!cur) {
        isValid = false; 
      }
      if(isValid){
        this._handleCloseMsg();
      }
      else {
        this._showMessages(msg);
      }
      return isValid;
    },
    
    _updateExpression: function(expObj) {
      var cur = this._exprBox.get("cursorPosition"),
          val = this._exprBox.get("value"),
          str = "",
          pos = 0,
          value, prev;
      if(!this._validateExpObj(expObj)) {
        return;  
      }
      if(!this._exprStack) {
        this._exprStack = [];  
      }
      if(this._exprStack.length > 0) {
        prev = this._exprStack[this._exprStack.length - 1];
      }
      //when value is cleared or initial load, set cursor position to [0,0]
      //IE10/edge has issues to set cursor to [0,0], otherwise.
      if(!cur || !val) {
        cur = [0,0]; 
      }
      if(expObj.type === "operator") {
        value = " "+ expObj.value + " ";
        pos = value.length;
      }
      else if(expObj.type === "helper") {
        value = expObj.value.name;
        if(expObj.value.name.indexOf(",") !== -1) {
          pos = expObj.value.name.indexOf(",");
        }
        else {
          pos = expObj.value.name.length - 1;
        }
      }
      else if(expObj.type === "field") {
        ///////////Auto Cast when the calculate field is double///////////////
        var isModIntTest = (esriLang.isDefined(prev) && prev.type === "helper" && prev.value.name.indexOf("MOD") !== -1 && array.indexOf(["esriFieldTypeSmallInteger", "esriFieldTypeInteger", "esriFieldTypeSingle"], expObj.value.type) !== -1), 
            isModFloatTest = (esriLang.isDefined(prev) && prev.type === "helper" && prev.value.name.indexOf("MOD") !== -1 && expObj.value.type === "esriFieldTypeDouble");
        if(this._calcField.type === "esriFieldTypeDouble" && !isModIntTest && array.indexOf(["esriFieldTypeSmallInteger", "esriFieldTypeInteger", "esriFieldTypeSingle"], expObj.value.type) !== -1) {
          value = "CAST(" + expObj.value.name + " AS FLOAT)";
        }
        else if(array.indexOf(["esriFieldTypeSmallInteger", "esriFieldTypeInteger", "esriFieldTypeSingle"],this._calcField.type) !== -1 && isModFloatTest) {
          value = "CAST(" + expObj.value.name + " AS INT)";
        }
        else {
          value = expObj.value.name;
        }
        pos = value.length + 1;
      }
      str = val.substring(0,cur[0])+ value + val.substring(cur[1]);
      this._exprBox.set("value", str);
      /////////update caret pos/////////////////////
      this._exprBox.focus();
      if(this._exprBox.textbox.setSelectionRange && typeof this._exprBox.textbox.selectionStart == "number") {
        this._exprBox.textbox.setSelectionRange(cur[0]+ pos, cur[0]+ pos);
        this._exprBox.set("cursorPosition", [cur[0]+ pos, cur[0]+ pos]);
      }
      else  {
        this._setCaretPosition(this._exprBox.textbox, cur[0]+ pos, cur[0]+ pos);  
        this._exprBox.set("cursorPosition", this._getCursorRange(this._exprBox.textbox));
      }
      ///////////////////////////////////////////////
      this._setfocus();
      this._exprStack.push(expObj);
    },

    _setCaretPosition: function(txtNode, start, end) {
      if(txtNode.setSelectionRange && typeof txtNode.selectionStart == "number") {
        txtNode.setSelectionRange(start, end);
      }
      else if (typeof txtNode.createTextRange != "undefined") {
        var range = txtNode.createTextRange();
        range.collapse(true);
        range.moveEnd("character", end);
        range.moveStart("character", start);
        range.select();
      }
    },
    
    _getCaretPosition: function(ctrl) {
      var caretPos = 0;	// IE Support
      if (document.selection) {
        ctrl.focus ();
        var sel = document.selection.createRange ();
        sel.moveStart ("character", -ctrl.value.length);
        caretPos = sel.text.length;
      }
      else if (ctrl.selectionStart || typeof ctrl.selectionStart == "number") {
        caretPos = ctrl.selectionStart;
      }
      //console.log(caretPos);
      return caretPos;      
    },
    
    _getCursorRange: function(txtNode) {
      var start, end;
      if(txtNode.setSelectionRange && typeof txtNode.selectionStart == "number") {
        start = txtNode.selectionStart;
        end = txtNode.selectionEnd;
      }
      else if (typeof txtNode.createTextRange != "undefined") {
        start = this._getCaretPosition(txtNode);
        end = this._getCaretPosition(txtNode);
      }
      return [start,end];
    },

    _handleExpChange: function(attr, oldVal, newVal) {
      //SQL validation
      this._addBtn.set("disabled", !newVal);
      this._validateBtn.set("disabled", !newVal);
      this._removeBtn.set("disabled", !newVal);
    },
    //{"isValidSQL":false,"validationErrors":[{"errorCode":3008,"description":"Invalid field name [fbvdfdsfds].","params":{"fieldName":"fbvdfdsfds"}}]}
    _handleValidationBtnClick: function() {
      var request = {
            sql: this.field + " = " + this._exprBox.get("value"),
            sqlType: "where",
            f: "json"
          }, def; 
      def = esriRequest({"url":this.layer.url + "/validateSQL", "content": request}, {"usePost":true});
      this._addBtn.set("disabled", true);
      this._validateBtn.set("disabled", true);
      this._showLoading();
      def.then(lang.hitch(this, function(response){ 
        //console.log(response);
        var errorMsg;
        this._hideLoading();
        this._validateBtn.set("disabled", false);
        this._addBtn.set("disabled", !response.isValidSQL);
        if(!response.isValidSQL) {
          if(response.validationErrors && response.validationErrors.length > 0) {
            errorMsg = "";
            array.forEach(response.validationErrors, function(errorObj){
              
              if(errorObj.params && jsapiBundle.calculateFields.errorCodes[errorObj.errorCode]) {
                var templateObj = {};
                for(var key in errorObj.params) {
                  if( errorObj.params.hasOwnProperty(key)) {
                    templateObj[key] = errorObj.params[key];
                  }
                }
                errorMsg += string.substitute( jsapiBundle.calculateFields.errorCodes[errorObj.errorCode], templateObj) + "<br/>";
              }
              else {
                errorMsg += (jsapiBundle.calculateFields.errorCodes[errorObj.errorCode] || errorObj.description) + "<br/>";
              }
            }, this);
            this._showMessages(errorMsg, false);  
          }
          else {
            this._showMessages(jsapiBundle.calculateFields.invalidExpression);
          }
          domClass.toggle(this._errorMessagePane, "esriFormSuccess", false);
        }
        else {
          domClass.toggle(this._errorMessagePane, "esriFormSuccess", true);
          this._handleCloseMsg();
          this._showMessages(jsapiBundle.calculateFields.validExpression);
        }
      }),
      lang.hitch(this, function(error){
        this._hideLoading();
        this._validateBtn.set("disabled", false);
        this._addBtn.set("disabled", false);
      }));
    },
    
    // show loading spinner
    _showLoading: function() {
      domStyle.set(this._underlay, "display", "block");
    },
    // hide loading spinner
    _hideLoading: function() {
      domStyle.set(this._underlay, "display", "none");
    },    
    
    _getTypeLabel: function(esriFieldType) { 
      var type;
      if(array.indexOf(["esriFieldTypeSmallInteger", "esriFieldTypeInteger", "esriFieldTypeSingle"], esriFieldType) !== -1) {
        type = this.i18n.integerLabel;
      }
      else if(esriFieldType === "esriFieldTypeDouble") {
        type = this.i18n.doubleLabel;
      }
      else if(esriFieldType === "esriFieldTypeDate") {
        type = this.i18n.dateLabel;
      }
      else if(esriFieldType === "esriFieldTypeString") {
        type = this.i18n.stringLabel;
      }
      return type;
    },
    
    //setters/getters for widget properties
    _setLayerAttr: function(layer) {
      this._set("layer", layer);  
      this._set("fields", layer.fields);  
    },
    
    _setFieldsAttr: function(fields) {
      this._set("fields", fields);
    },
    
    _setFieldAttr: function(field) {
      this._set("field", field);
    },
    
    _setHelperMethodsAttr: function(arr) {
      this._set("helperMethods", arr);
    },
    
    _setOperatorsAttr: function(arr) {
      this._set("operators", arr);
    },
    
    _setShowSelectFieldAttr: function(val) {
      this._set("showSelectField", val); 
    },
    
    _setShowHeaderAttr: function(val) {
      this._set("showHeader", val);
    },
    
    _setCloseOnAddAttr: function(val) {
      this._set("closeOnAdd", val);
    },
    
    _getExpressionAttr: function() {
      //calcExpression”: ”[{“field” : <fieldname>, (“value” | “sqlExpression”) 
      var expr = this._exprBox.get("value"),
          expArr,
          calObj, calcExpression;
      if(!expr) {
        this._addBtn.set("disabled", true);
        return;
      }
      expArr = expr.split(" "); 
      calcExpression = [];
      calObj = {
        field: this.field
      };
      calObj.sqlExpression = expr; 
      calcExpression.push(calObj);
      return calcExpression;
    },
    
    //css class properties
    _setAddButtonClassAttr: function(val) {
      this._set("addButtonClass", val);
    },
    
    _setCloseButtonClassAttr: function(val) {
      this._set("closeButtonClass", val);
    }


  });


  return CalculateField;  
  
});
