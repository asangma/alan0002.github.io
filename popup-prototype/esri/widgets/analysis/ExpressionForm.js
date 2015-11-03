/******************************************
  esri/widgets/analysis/ExpressionForm
******************************************/
define(
[ 
  "require",
  "../../core/declare",
  "dojo/_base/lang",
  "dojo/_base/array",
  "dojo/_base/connect",
  "dojo/_base/fx",
  "dojo/has",
  "dojo/string",
  "dojo/dom-style",
  "dojo/dom-attr",
  "dojo/dom-construct",
  "dojo/query",
  "dojo/dom-class",
  "dojo/_base/event",
  "dojo/Evented",
  "dojo/fx/easing",
  
  "dijit/_WidgetBase",
  "dijit/_TemplatedMixin",
  "dijit/_WidgetsInTemplateMixin",
  "dijit/_OnDijitClickMixin",
  "dijit/_FocusMixin",
  "dijit/registry",
  "dijit/form/Button",
  "dijit/form/CheckBox",
  "dijit/form/Form",
  "dijit/form/Select",
  "dijit/form/TextBox",
  "dijit/form/ValidationTextBox",
  "dijit/layout/ContentPane",
  "dijit/form/ComboBox",
  "dijit/Dialog",
  "dijit/Tooltip",
  
  
  "../../kernel",
  "../../core/lang",
  "./utils",
  "../SingleFilter",
  "dojo/i18n!../../nls/jsapi",
  "dojo/text!./templates/ExpressionForm.html"
], function(require, declare, lang, array, connection, fx, has, string, domStyle, domAttr, domConstruct, query, domClass, event, Evented, easing, _WidgetBase,
   _TemplatedMixin, _WidgetsInTemplateMixin,  _OnDijitClickMixin, _FocusMixin, registry, Button, CheckBox, Form, Select, TextBox, ValidationTextBox, ContentPane, ComboBox, Dialog, Tooltip, esriKernel, esriLang, AnalysisUtils, SingleFilter, jsapiBundle, template) {
  var ExpressionForm = declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin,  _OnDijitClickMixin, _FocusMixin, Evented], {

    declaredClass: "esri.widgets.analysis.ExpressionForm",

    templateString: template,
    basePath: require.toUrl("."),
    widgetsInTemplate: true,
    firstOperands: null,
    defaultUnits: "english",
    showFirstRow: true,
    /************
     * Overrides
     ************/
    constructor: function(params){
      if (params.containerNode) {
        this.container = params.containerNode;
      }
      this._setClasses(params);
    },
    
    _setClasses: function(params) {
      this._addBtnClass = params.primaryActionButttonClass || "esriAnalysisSubmitButton";
      //console.log("set", this._addBtnClass);
    },
    
    destroy: function(){
      this.inherited(arguments);
      array.forEach(this._pbConnects, connection.disconnect);
      delete this._pbConnects;
    },
    
    postMixInProperties: function(){
      this.inherited(arguments);
      this.i18n = {};
      lang.mixin(this.i18n, jsapiBundle.common);
      lang.mixin(this.i18n, jsapiBundle.expressionGrid);
      lang.mixin(this.i18n, jsapiBundle.expressionForm);
      
    },
    
    postCreate: function(){
      this.inherited(arguments);
      this.attributeChangeHandler = connection.subscribe("filter-expression-change", lang.hitch(this, this._handleAttributeFilterChange));
      this._distanceInput.set("validator", lang.hitch(this, this._validateDistance));
      this.set("action", "add");
      domStyle.set(this._firstRow, "display", this.showFirstRow? "" : "none");
    },
    
    init: function() {
      if(this._firstOperandSelect && this.firstOperands && this.inputOperands) {
       if(this._firstOperandSelect.getOptions()) {
          this._firstOperandSelect.removeOption(this._firstOperandSelect.getOptions());
        }
        var i, j, inputLength = this.inputOperands.length, firstOperandLength = this.firstOperands.length, firstIds = [];
        for (i = 0; i < inputLength; i+= 1) {
         for(j = 0; j < firstOperandLength; j+= 1) {
           if(esriLang.isDefined(this.inputOperands[i].id) && esriLang.isDefined(this.firstOperands[j].id) && this.inputOperands[i].id === this.firstOperands[j].id) {
             firstIds[this.firstOperands[j].id] = i.toString();
           }
           else if(esriLang.isDefined(this.inputOperands[i].name) && esriLang.isDefined(this.firstOperands[j].name) && this.inputOperands[i].name === this.firstOperands[j].name) {
             firstIds[this.firstOperands[j].name] = i.toString();
           }           
         } 
        }
        //console.log(firstIds);
                
        array.forEach(this.firstOperands, function(operand, index) {
           this._firstOperandSelect.addOption({value:firstIds[operand.id || operand.name], label:operand.name});
        }, this);
        if(this.get("showReadyToUseLayers")) {
          this._firstOperandSelect.addOption({value:"browse", label:this.i18n.browseAnalysisTitle}); 
        }
        if(this.selectedFirstOperand) {
          this._firstOperandSelect.set("value", firstIds[this.selectedFirstOperand.id]);
        }
        /*array.forEach(this._firstOperandSelect.getOptions(), function (option, i) { 
          new Tooltip({ connectId: [option], label: option.label}); 
        });*/
       if(inputLength === 1) {
         if(this._operatorSelect && this._operatorSelect.getOptions()) {
           this._operatorSelect.removeOption(this._operatorSelect.getOptions());
           this._operatorSelect.addOption({value:"where", label: this.i18n.where});
         }
       }
      }
      //oldValue = this._operatorSelect.get("value");
      if(this.get("action") === "add") {
        this._operatorSelect.set("value", "where");
        this._handleOperatorChange("where");
        /*if(this._attributeFilter && oldValue === "where") {
          this._handleOperatorChange();
        }*/
        this._distanceInput.set("value", "");
        if(this.defaultUnits === "metric") {
          this._distanceUnitsSelect.set("value", "Kilometers");
        }
        else {
          this._distanceUnitsSelect.set("value", "Miles");
        }
      }
      //this._handleOperatorChange("where");
      //reset all values;
    },
    startup: function() {},
    
    clear: function() {
      this.init(); 
    },
    
    _validateDistance: function(value) {
      var operator = this._operatorSelect.get("value");
      if(array.indexOf(["withinDistance", "notWithinDistance"], operator) === -1) {
        return true;
      }
      //console.log(value);
      //console.log((value &&  ( 0 < parseFloat(value, 10)  && parseFloat(value, 10) < Infinity) ));
      return (value &&  ( 0 < parseFloat(value, 10)  && parseFloat(value, 10) < Infinity) );
    },
    
    _handleAttributeFilterChange: function() {
      var expr, attributeExprObj;
      if(this._attributeFilter){
        attributeExprObj = this._attributeFilter.toJSON();
        expr = this._attributeFilter.builtSingleFilterString(attributeExprObj);
        //console.log(expr);
        if(expr.whereClause){
          this._addBtn.set("disabled", false);
        }
        else {
          this._addBtn.set("disabled", true);
        }
      }
    },
    
    _handleDistanceInputChange: function (value) {
      //console.log(value);
      this._addBtn.set("disabled", !this._distanceInput.validate());
    },    

    _handleOperatorChange: function(value) {
      var operator = this._operatorSelect.get("value"), selectedFirstIndex, firstOperand;
      if(array.indexOf(["where", "withinDistance", "notWithinDistance"], operator) === -1) {
        this._buildSpatialExpression(operator);
      }
      else if(operator === "where") {
        selectedFirstIndex = parseInt(this._firstOperandSelect.get("value"), 10);
        firstOperand = this.inputOperands[selectedFirstIndex];
        this._buildAttributeExpression(operator);
      }
      else if(array.indexOf(["withinDistance", "notWithinDistance"], operator) !== -1) {
        this._buildDistanceExpression(operator);
      }
    },
    
    _isValidSecondOperand: function(operator, firstGeoType, secondGeoType){
      var isValid = false;
      if(operator === "contains" || operator === "notContains") {
        if((firstGeoType === "esriGeometryPoint" || firstGeoType === "esriGeometryMultipoint") && (secondGeoType === "esriGeometryPoint" || secondGeoType === "esriGeometryMultipoint")) {
          isValid = true;
        }
        else if(firstGeoType === "esriGeometryPolyline" && (secondGeoType === "esriGeometryPoint" || secondGeoType === "esriGeometryPolyline" ||  secondGeoType === "esriGeometryMultipoint")) {
          isValid = true;
        }
        else if(firstGeoType === "esriGeometryPolygon") {
          isValid = true;
        }
      }
      else if(operator === "within" || operator === "notWithin") {
        if(firstGeoType === "esriGeometryPoint" || firstGeoType === "esriGeometryMultipoint") {
          isValid = true;
        }
        else if(firstGeoType === "esriGeometryPolyline" && (secondGeoType === "esriGeometryPolygon" || secondGeoType === "esriGeometryPolyline")) {
          isValid = true;
        }
        else if(firstGeoType === "esriGeometryPolygon" && secondGeoType === "esriGeometryPolygon") {
          isValid = true;
        }
        
      }
      else {
        isValid = true; //for other operators
      }
      return isValid;
    },
    
    
    _isValidFirstOperand: function(layer) {
      var isValid = true;
      if(!layer || !layer.fields){
        isValid = false;
      }
      else if(layer.fields && layer.fields.length === 1 && layer.fields[0].type === "esriFieldTypeOID") {
        this._showMessages(string.substitute(this.i18n.inValidAttributeFilterMessage, {layername: layer.name}));
        isValid = false;
      }
      return isValid;
    },    
   
    _buildSpatialExpression: function(operator) {
      var selectedFirstIndex, firstOperand, firstGeoType;
      selectedFirstIndex = parseInt(this._firstOperandSelect.get("value"), 10);
      firstOperand = this.inputOperands[selectedFirstIndex];
      firstGeoType = firstOperand.geometryType;
      this._addBtn.set("disabled", false);
      this._distanceInput.set("required", false);
      domStyle.set(this._attrFilterDiv,"display", "none");
      domStyle.set(this._secondOperandSelect.domNode, "display", "");
      if(this._secondOperandSelect) {
        if(this._secondOperandSelect.getOptions()){
          this._secondOperandSelect.removeOption(this._secondOperandSelect.getOptions());
        }
        array.forEach(this.inputOperands, function(operand , index) {
           if(index.toString() !== this._firstOperandSelect.get("value")) {
             if(this._isValidSecondOperand(operator, firstGeoType, operand.geometryType)) {
               this._secondOperandSelect.addOption({value:index.toString(), label:operand.name});
             }
           }
        }, this);
        domStyle.set(this._secondRow, "display", "");
        domStyle.set(this._secondExpressionDiv,"display", "none");
        domStyle.set(this._secondOperandTd, "display", "");
        domStyle.set(this._secondOperandSelect, {
          "display": "",
          "width": "75%" 
        });
      }
    },
    
    _buildAttributeExpression: function(operator) {
      var selectedFirstIndex, firstOperand;
      this._distanceInput.set("required", false);
      domStyle.set(this._secondExpressionDiv,"display", "none");
      if(this._secondOperandSelect && this._secondOperandSelect.getOptions()){
        this._secondOperandSelect.removeOption(this._secondOperandSelect.getOptions());
      }
      domStyle.set(this._secondOperandSelect.domNode, "display", "none");
      selectedFirstIndex = parseInt(this._firstOperandSelect.get("value"), 10);
      firstOperand = this.inputOperands[selectedFirstIndex];
      if(this._isValidFirstOperand(firstOperand)) {
        this._addBtn.set("disabled", true);
        domStyle.set(this._secondRow, "display", "");
        domStyle.set(this._attrFilterDiv,"display", "");
        if(this._attributeFilter) {
          //this._attributeFilter.destroy();
          //this._attributeFilter = null;
          this._attributeFilter.init({
            mapLayer: firstOperand,
            version: firstOperand.version,
            fields: firstOperand.fields,
            allowAllDateTypes: true,
            part: (this.get("action") === "edit" && this.expression && this.expression._attributeExprObj) ? this.expression._attributeExprObj : null
          });
        }
        if(!this._attributeFilter) {
          this._attributeFilter = new SingleFilter({
            "class": "filterSegment",
            mapLayer: firstOperand,
            version: firstOperand.version,
            fields: firstOperand.fields,
            part: (this.get("action") === "edit" && this.expression && this.expression._attributeExprObj) ? this.expression._attributeExprObj : null,// sets
            enableEvents: true,
            isEnableInteractiveFilter: false,
            allowAllDateTypes: true
          },  domConstruct.create("div", {}, this._attrFilterDiv));
          this._attributeFilter.fillFieldsList(this._attributeFilter.fieldsStore);
        }
      }
      else {
        domStyle.set(this._secondRow, "display", "none");
        domStyle.set(this._attrFilterDiv,"display", "none");
        this._addBtn.set("disabled", true);
      }
    },

    _buildDistanceExpression: function(operator) {
      this._addBtn.set("disabled", !this._distanceInput.validate());
      this._distanceInput.set("required", true);
      domStyle.set(this._secondRow, "display", "");
      domStyle.set(this._secondOperandTd, "display", "");
      domStyle.set(this._secondOperandSelect.domNode, "display", "");
      domStyle.set(this._secondExpressionDiv, {
       "display": "",
       "width": "75%" 
      });
      domStyle.set(this._secondOperandSelect, {
       "display": "",
       "width": "75%" 
      });
      domStyle.set(this._attrFilterDiv,"display", "none");
      if(this._secondOperandSelect && this._secondOperandSelect.getOptions()){
        this._secondOperandSelect.removeOption(this._secondOperandSelect.getOptions());
        array.forEach(this.inputOperands, function(operand , index) {
           if(index.toString() !== this._firstOperandSelect.get("value")) {
             this._secondOperandSelect.addOption({value:index.toString(), label:operand.name});
           }
        }, this);
      }
    },
    
    _handleAddButtonClick : function(e) {
      //console.log("added");
      event.stop(e);
      if(this._expressionForm && !this._expressionForm.validate() ) {
        this.emit("cancel-expression",{});
        return;
      }
      this.set("expression");
      this.emit("add-expression", {
        "expression": this.get("expression"),
        "text": this.get("text"),
        "displayText": this.get("displayText"),
        "action": this.get("action")
      });
    },
    
    _handleCloseButtonClick: function(e) {
      event.stop(e);
      //console.log("close");
      this.emit("cancel-expression",{});
    }, 
    
    _setInputOperandsAttr: function(layers) {
      this.inputOperands = layers;
    },
    
    _getInputOperandsAttr: function() {
      return this.inputOperands;
    },
    
    
    _setFirstOperandsAttr: function(layers) {
      this.firstOperands = layers;
    },
    
    _getFirstOperandsAttr: function(layers) {
      return this.firstOperands;
    },    
    
    _setSelectedFirstOperandAttr: function(layer) {
      this.selectedFirstOperand = layer;
    },
    
    _getExpressionAttr: function(expression) {
      return this.expression;
      //this._buildUI();
    },
    
    _setExpressionAttr: function(expression) {
      var attributeExprObj, filter, isEditWhere = false;
      if(!expression) {
        expression = {}; 
        if(this._operatorSelect) {
          expression.layer = parseInt(this._firstOperandSelect.get("value"), 10);
          if(this._operatorSelect.get("value") === "where") {
            attributeExprObj = this._attributeFilter.toJSON();
            //attributeExprObj.fieldObj.name = "\\\"" + attributeExprObj.fieldObj.name + "\\\"";
            filter = this._attributeFilter.builtSingleFilterString(attributeExprObj);
            expression._attributeFilter = filter; // {whereClause:a = 2}
            expression._attributeExprObj = attributeExprObj; // {a, "is", 2}
            expression._attributeText = this._attributeFilter.buildFriendlyTextExpr(attributeExprObj); // a is 2
            expression.where = filter.whereClause;// a = 2
            /*if(expression.where.indexOf(attributeExprObj.fieldObj.name) !== -1) {
              //http://resources.arcgis.com/en/help/main/10.2/index.html#/Select_Layer_By_Attribute/001700000071000000/
              expression.where = expression.where.replace(attributeExprObj.fieldObj.name, "\"" + attributeExprObj.fieldObj.name +"\"");
            }
            if(attributeExprObj.valueObj.type === "field") {
              expression.where = expression.where.replace(attributeExprObj.valueObj.name, "\"" + attributeExprObj.valueObj.name +"\"");
            }*/
            //console.log(expression);
          }
          else {
            expression.selectingLayer = parseInt(this._secondOperandSelect.get("value"), 10);
            expression.spatialRel  = this._operatorSelect.get("value");
            if(array.indexOf(["withinDistance", "notWithinDistance"], this._operatorSelect.get("value")) !== -1) {
              expression.distance = this._distanceInput.get("value");
              expression.units = this._distanceUnitsSelect.get("value");
            }
          }
        }
      }
      else {
        //console.log("editing");
        if(this._operatorSelect) {
          this._firstOperandSelect.set("value", expression.layer);
          this._operatorSelect.set("value", expression.spatialRel ? expression.spatialRel  : "where");
          if(this._operatorSelect.get("value") === "where") {
            isEditWhere = true;
          }
          else {          
            if(array.indexOf(["withinDistance", "notWithinDistance"], this._operatorSelect.get("value")) !== -1) {
                this._distanceInput.set("value",expression.distance);
                this._distanceUnitsSelect.set("value", expression.units);            
            }
            this._secondOperandSelect.set("value",  expression.selectingLayer);
          }
        }
      }
      this.expression = expression;
      if(isEditWhere) {
        this._handleOperatorChange("where");
      }
    },
    
    _showMessages: function(msg) {
      domAttr.set(this._bodyNode, "innerHTML", msg);
      fx.fadeIn({
        node: this._errorMessagePane,
        easing: easing.quadIn,
        onEnd: lang.hitch(this, function() {
          domStyle.set(this._errorMessagePane, {display: ""});
        })
      }).play();
      //window.setTimeout(lang.hitch(this, this._handleCloseMsg), 4000);
          
    },
    
    _handleCloseMsg: function(e) {
      if(e) {
        e.preventDefault();
      }
      fx.fadeOut({
        node: this._errorMessagePane,
        easing: easing.quadOut,
        onEnd: lang.hitch(this, function() {
          domStyle.set(this._errorMessagePane, {display: "none"});
        })
      }).play();
    }, 
        
    _setActionAttr: function(action) {
      this.action = action;
    },
    
    _getActionAttr: function() {
      return this.action;
    },
    
    _setTextAttr: function(text) {
      this.text = text;
    },
    
    _getTextAttr: function() {
      var text = "";
      if(this.expression) {
        text = this.inputOperands[this.expression.layer].name; 
      }
      if(this.expression.spatialRel ) {
        text += " " + this.i18n[this.expression.spatialRel];
        if(this.expression.distance) {
          text += " " + this.expression.distance + " " +this.expression.units + " "+ this.i18n.from;
        }
        text += " " +  this.inputOperands[this.expression.selectingLayer].name;
      }
      else {
        
        text += " " + this.i18n.whereLabel + " " + this.expression._attributeText;
      }
      return text;
    },
    
    _getDisplayTextAttr: function() {
      var text = "", layerName, sLayerName;
      //text += "<table style="width:100%;height:100%"><tbody><tr>";
      if(this.expression) {
        layerName = this.inputOperands[this.expression.layer].name;
        text += this.shortenString(layerName);  
      }
      if(this.expression.spatialRel ) {
        text += " " + "<label style='font-style: italic;'>" + this.i18n[this.expression.spatialRel];
        if(this.expression.distance) {
          text += " " + this.expression.distance + " " +this.expression.units + " "+ this.i18n.from;
        }
        text +="</label>";
        sLayerName = this.inputOperands[this.expression.selectingLayer].name;
        text += " " +  this.shortenString(sLayerName);
      }
      else {
        text += " " + "<label style='font-style: italic;'>" + this.i18n.whereLabel + " "+  this.expression._attributeText + "</label";
      }
      text +="</tr></tbody></table>";
      return text;
    },
    
    shortenString: function(s) {
      return "<label style='overflow: hidden;text-overflow: ellipsis'>"+ s +"</label></td>";
      //return s.substring(0,5) + "..." + s.substring(s.length-10);
    },
    
    _setPrimaryActionButttonClassAttr: function(str) {
      this.primaryActionButttonClass = str;
    },
    
    _getPrimaryActionButttonClassAttr: function() {
      return this.primaryActionButttonClass;
    },
    
    _setShowFirstRowAttr: function(value) {
      this.showFirstRow = value;
    },
    
    _getShowFirstRowAttr: function() {
      return this.showFirstRow;
    },
    
    _setShowReadyToUseLayers: function(value) {
      this._set("showReadyToUseLayers", value);
    }
    
  
  });
  
  return ExpressionForm;  
  
});

  


