/*jshint quotmark:false */
define(
[
  "../core/declare",
  "dojo/_base/lang",
  "dojo/_base/array",
  "dojo/string",
  "dojo/number",
  "dojo/dom",
  "dojo/dom-style",
  "dojo/dom-construct",
  "dojo/Evented",
  "dojo/on",
  "dojo/parser",
  "dojo/query",
  "dojo/topic",
  "dojo/data/ItemFileWriteStore",
  "dojo/date/locale",
  
  "dijit/_WidgetBase",
  "dijit/_TemplatedMixin",
  "dijit/_WidgetsInTemplateMixin",
  "dijit/_OnDijitClickMixin",
  "dijit/_FocusMixin",
  "dijit/registry",
  "dijit/form/TextBox",
  "dijit/form/FilteringSelect",
  "dijit/form/RadioButton",
  "dijit/form/DateTextBox",
  "dijit/form/NumberTextBox",
  
  "../kernel",
  "../core/lang",
  "../tasks/GenerateRendererTask",
  "../tasks/support/UniqueValueDefinition",
  "../tasks/support/GenerateRendererParameters",
  "../layers/FeatureLayer",
  "../layers/GeoRSSLayer",

  "dojo/i18n!../nls/jsapi",

  "dojo/text!./templates/SingleFilter.html"
], function(
  declare, lang, array, string, number, dom, domStyle, domConstruct, Evented, on, parser, query, topic, ItemFileWriteStore, locale,
  _WidgetBase,_TemplatedMixin, _WidgetsInTemplateMixin,  _OnDijitClickMixin, _FocusMixin, registry, TextBox, FilteringSelect, RadioButton, DateTextBox, NumberTextBox,
  esriKernel, esriLang, GenerateRendererTask, UniqueValueDefinition, GenerateRendererParameters, FeatureLayer, GeoRSSLayer,
  jsapiBundle,
  template
) {
  var SingleFilter = declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin,  _OnDijitClickMixin, _FocusMixin, Evented], {
    // summary: a single filter (one field)
    // - fieldName operator value
    // - fieldName betweenOperator valueA and valueB
    //
    // description:  
    declaredClass: "esri.widgets.SingleFilter",
    widgetsInTemplate: true,
    templateString: template,
    valueHandlers: [],
    onFieldChangeEnabled: true,
    onOperatorChangeEnabled: true,
    onPromptChangeHandler: null,
    onHintChangeHandler: null,
    fieldDomains: {},
    fieldsStore: null,
    fieldsInfo: {
      stringFieldsCount: 0,
      numberFieldsCount: 0,
      dateFieldsCount: 0
    },
    stringOperatorStore: null,
    dateOperatorStore: null,
    numberOperatorStore: null,
    uniqueValuesStore: null,  
    isEnableInteractiveFilter: true,
    uniqueValuesResults: {},
    partsObj: null,
    dayInMS: (24 * 60 * 60 * 1000) - 1000, // 1 sec less than 1 day
    allowAllDateTypes: false, 
    
    postMixInProperties: function(){
      this.inherited(arguments);
      this.i18n = {};
      //this.i18n = i18n.getLocalization("esri", "jsapi").common;
      this.i18n = lang.mixin(this.i18n, jsapiBundle.filterDlg);
    },
    
    parseExpressionTemplate: function(){
      // expressionTemplate: "${field_dropdown} ${operator_dropdown} ${values_input}",
      
      var buildPart = function(part, column){
        dom.byId(column).className = "attributeValueContainer";
        if (part === "field_dropdown") {
          dom.byId(column).innerHTML = field;
        } else if (part === "operator_dropdown") {
          dom.byId(column).innerHTML = operator;
        } else if (part === "values_input") {
          dom.byId(column).innerHTML = valueInput + valueOptions;
        } else {
          console.error("problem with expressionTemplate from localization file");
        }
      };
      
      var field = '<select id="' + this.id + '.fieldsList" class="attributeField" data-dojo-type="dijit/form/FilteringSelect" maxHeight="150" sortByLabel="true"></select>';
      var operator = '<select id="' + this.id + '.operatorList" class="operator" data-dojo-type="dijit/form/FilteringSelect" maxHeight="150" sortByLabel="false"></select>';
      var valueInput = '<div id="' + this.id + '.attributeValueContainer"></div>';
      var valueOptions = '<div class="attributeValueOptions">' +
      '<table cellpadding="0" cellspacing="0">' +
      '  <tbody>' +
      '    <tr>' +
      '      <td nowrap="nowrap">' +
      '        <input id="' +
      this.id +
      '.radioValue" class="radioValue attributeValueRadio" checked="checked" name="' +
      this.id +
      '.inputOption" data-dojo-type="dijit/form/RadioButton" title="' +
      this.i18n.valueTooltip +
      '"/>' +
      '        <label class="labels" title="' +
      this.i18n.valueTooltip +
      '">' +
      this.i18n.value +
      '        </label>' +
      '      </td>' +
      '      <td nowrap="nowrap" class="esriLeadingPadding05">' +
      '        <input id="' +
      this.id +
      '.radioFields" class="radioFields attributeValueRadio" name="' +
      this.id +
      '.inputOption" data-dojo-type="dijit/form/RadioButton" title="' +
      this.i18n.fieldTooltip +
      '"/>' +
      '        <label class="labels" title="' +
      this.i18n.fieldTooltip +
      '">' +
      this.i18n.field +
      '        </label>' +
      '      </td>' +
      '      <td id="' +
      this.id +
      '.radioUniqueColumn" nowrap="nowrap" class="esriLeadingPadding05">' +
      '        <input id="' +
      this.id +
      '.radioUnique" class="radioUnique attributeValueRadio" name="' +
      this.id +
      '.inputOption" data-dojo-type="dijit/form/RadioButton" title="' +
      this.i18n.uniqueValueTooltip +
      '"/>' +
      '        <label class="labels" title="' +
      this.i18n.uniqueValueTooltip +
      '">' +
      this.i18n.uniqueValues +
      '        </label>' +
      '      </td>' +
      '    </tr>' +
      '  </tbody>' +
      '</table>' +
      '</div>';
      
      var str = this.i18n.expressionTemplate;
      var pStart = str.indexOf('${');
      var text = str.substring(0, pStart).trim();
      dom.byId(this.id + ".column1").innerHTML = (text.length) ? ("<div class='attributeText'>" + text + "</div>") : "";
      var pEnd = str.indexOf('}', pStart + 1);
      var part = str.substring(pStart + 2, pEnd);
      buildPart(part, this.id + ".column2");
      pStart = str.indexOf('${', pStart + 1);
      text = str.substring(pEnd + 1, pStart).trim();
      dom.byId(this.id + ".column3").innerHTML = text.length ? ("<div class='attributeText'>" + text + "</div>") : "";
      pEnd = str.indexOf('}', pStart + 1);
      part = str.substring(pStart + 2, pEnd);
      buildPart(part, this.id + ".column4");
      pStart = str.indexOf('${', pStart + 1);
      text = str.substring(pEnd + 1, pStart).trim();
      dom.byId(this.id + ".column5").innerHTML = (text.length) ? ("<div class='attributeText'>" + text + "</div>") : "";
      pEnd = str.indexOf('}', pStart + 1);
      part = str.substring(pStart + 2, pEnd);
      buildPart(part, this.id + ".column6");
      text = str.substring(pEnd + 1, str.length).trim();
      dom.byId(this.id + ".column7").innerHTML = (text.length) ? ("<div class='attributeText'>" + text + "</div>") : "";
    },
    
    postCreate: function(){
      this.inherited(arguments);
      
      this.parseExpressionTemplate();
      //initialize the stores and objects;
      this.createOperatorStores();
      this.createFieldsStore(this.fields);
      this.readCodedValues();
  
      parser.parse(dom.byId(this.id + '.exprTable')).then(lang.hitch(this, function(instances){
        //console.log("parsed instances", instances);
        this.getFieldsList().on("change", this.onChangeField.bind(this));
        this.getOperatorList().on( "change", this.onChangeOperator.bind(this));
        registry.byId(this.id + '.radioValue').on("click", this.showValueInput.bind(this));
        registry.byId(this.id + '.radioFields').on( "click", this.showFields.bind(this));
        registry.byId(this.id + '.radioUnique').on( "click", this.showUniqueList.bind(this));
        
        // set combobox read only
        //this.getFieldsList().textbox.readOnly = true;
        
        // set combobox read only
        //this.getOperatorList().textbox.readOnly = true;
        if (this.version && this.version < 10.1) {
          domStyle.set(dom.byId(this.id + ".radioUniqueColumn"), "display", "none");
        }

        
        on(dom.byId(this.id + ".deleteExpression"), "click", this.onClickDeleteExpression.bind(this));
        on(this.interactiveCheck, "click", this.onInteractiveClick.bind(this));
        on(this.interactiveArrow, "click", this.onClickShowHideInteractive.bind(this));
        
        this.enableInteractiveHandlers();
        
        if(!this.isEnableInteractiveFilter) {
          domStyle.set(this._interactiveFilterRow, "display", "none");
        }
        
        
      }));
    },
    
    constructor: function(params, srcNodeRef){
    
      this.id = params.id || "";
      this.owner = params.owner;
      this.version = params.version;
      this.part = params.part;
      this.fields = params.fields;
      this.mapLayer = params.mapLayer;
      if (params.enableEvents === false) {
        this.onFieldChangeEnabled = false;
        this.onOperatorChangeEnabled = false;
      }
    },
    
    init: function(params) {
      
      if(!params.part) {
        this.clearAttributeValueDijits();
        this.mapLayer = params.mapLayer;
        this.version = params.version;
        this.fields = params.fields;
        this.createOperatorStores();
        this.createFieldsStore(this.fields);
        this.readCodedValues();
        this.fillFieldsList(this.fieldsStore);   
        this.onChangeField();
      }
      if(params.part) {
        this.part = params.part;
        //console.log("part", this.part);
        this.buildEditUIField(this.part, this);
      }
    },
    
    destroy: function(){
      this.clearAttributeValueDijits();
      array.forEach(registry.findWidgets(dom.byId(this.id)), function(w) {
        w.destroyRecursive();
      });    
      this.inherited(arguments);
    },
  /*****************************
   * formatter methods
   ******************************/
    toJson: function() {
      try {
        throw new Error("toJson is deprecated, use toJSON instead");
      }
      catch (e) {
        console.warn(e.stack);
      }

      return this.toJSON();
    },

    toJSON: function() {
    
      var interactiveObj = null;
      if (this.isInteractiveChecked()) {
        interactiveObj = {
          prompt: this.promptText.attr('value'),
          hint: this.hintText.attr('value')
        };
      }
      
      return {
        fieldObj: this.getField(),
        operator: this.getOperator(),
        valueObj: this.getValue(),
        interactiveObj: interactiveObj
      };
    },
    
    buildFriendlyTextExpr: function(part){
    
      var expressionTemplate = this.i18n.expressionTemplate;
      var build = function(fieldLabel, operator, value){
        var str = string.substitute(expressionTemplate, {
          field_dropdown: fieldLabel,
          operator_dropdown: operator,
          values_input: value
        });
        return str;
      };
      
      if (part.valueObj.isValid === false) {
        return "&lt;expression is missing value&gt;";
      }
      
      var strText = "";
      if (part.fieldObj.shortType === "string") {
      
        if (part.operator === this.i18n.stringOperatorIsBlank ||
        part.operator === this.i18n.stringOperatorIsNotBlank) {
          strText = build(part.fieldObj.label, part.operator, "");
        } else {
          if (part.valueObj.type === 'field') {
            strText = build(part.fieldObj.label, part.operator, part.valueObj.label);
          } else {
            var value = this.getDecodedValue(part.interactiveObj ? part.interactiveObj.value : part.valueObj.value, part.fieldObj.name);
            strText = build(part.fieldObj.label, part.operator, "'" + value + "'");
          }
        }
        
      } else if (part.fieldObj.shortType === "number") {
      
        if (part.operator === this.i18n.numberOperatorIsBetween ||
        part.operator === this.i18n.numberOperatorIsNotBetween) {
          var value1 = (part.interactiveObj ? part.interactiveObj.value1 : part.valueObj.value1);
          var value2 = (part.interactiveObj ? part.interactiveObj.value2 : part.valueObj.value2);
          strText = build(part.fieldObj.label, part.operator, number.format(value1, {pattern: '#####0.##########'}) + " " + this.i18n.andBetweenValues + " " + number.format(value2, {pattern: '#####0.##########'}));
        } else if (part.operator === this.i18n.numberOperatorIsBlank ||
        part.operator === this.i18n.numberOperatorIsNotBlank) {
          strText = build(part.fieldObj.label, part.operator, "");
        } else {
          if (part.valueObj.type === 'field') {
            strText = build(part.fieldObj.label, part.operator, part.valueObj.label);
          } else {
            value = part.interactiveObj ? part.interactiveObj.value : part.valueObj.value;
            var decValue = this.getDecodedValue(value, part.fieldObj.name);
            strText = build(part.fieldObj.label, part.operator, (value !== decValue) ? ("'" + decValue + "'") : number.format(value, {pattern: '#####0.##########'}));
          }
        }
        
      } else { // date
        // value is Date object when we had a DateTextBox
        // value is String when we had unique values list
        if (esriLang.isDefined(part.valueObj.value) && part.valueObj.type !== 'field' && (typeof part.valueObj.value === "string")) {
          // e.g. "7/7/2010 12:00:00 AM" returned by generateRenderer
          part.valueObj.value = new Date(part.valueObj.value);
        }
        
        if (part.operator === this.i18n.dateOperatorIsBetween ||
        part.operator === this.i18n.dateOperatorIsNotBetween) {
          strText = build(part.fieldObj.label, part.operator, (part.interactiveObj ? this.formatFriendlyDate(part.interactiveObj.value1) : this.formatFriendlyDate(part.valueObj.value1)) + " " + this.i18n.andBetweenValues + " " + (part.interactiveObj ? this.formatFriendlyDate(part.interactiveObj.value2) : this.formatFriendlyDate(this.addDay(part.valueObj.value2))));
        } else if (part.operator === this.i18n.dateOperatorIsBlank ||
        part.operator === this.i18n.dateOperatorIsNotBlank) {
          strText = build(part.fieldObj.label, part.operator, "");
        } else {
          if (part.valueObj.type === 'field') {
            strText = build(part.fieldObj.label, part.operator, part.valueObj.label);
          } else {
            strText = build(part.fieldObj.label, part.operator, (part.interactiveObj ? this.formatFriendlyDate(part.interactiveObj.value) : this.formatFriendlyDate(part.valueObj.value)));
          }
          //} else if (part.operator === this.i18n.dateOperatorInTheLast) {
          //} else if (part.operator === this.i18n.dateOperatorNotInTheLast) {
        }
      }
      return strText;
    },
    
    builtSingleFilterString: function(part, parameterizeCount){
      // TODO check that expression value has a value ...
      if (esriLang.isDefined(part.valueObj.isValid) && !part.valueObj.isValid) {
        return {
          whereClause: null
        };
      }
      
      var value = part.valueObj.value;
      var value1 = part.valueObj.value1;
      var value2 = part.valueObj.value2;
      var parameterizeValues = false;
      if (part.interactiveObj) {
        if (!part.interactiveObj.prompt || !part.interactiveObj.hint) {
          return {
            whereClause: null
          };
        }
        if (esriLang.isDefined(parameterizeCount)) {
          parameterizeValues = true;
          if (esriLang.isDefined(part.valueObj.value)) {
            value = "{" + parameterizeCount + "}";
          }
          if (esriLang.isDefined(part.valueObj.value1)) {
            value1 = "{" + parameterizeCount + "}";
          }
          if (esriLang.isDefined(part.valueObj.value2)) {
            value2 = "{" + (parameterizeCount + 1) + "}";
          }
        }
      }
      
      var whereClause = "";
      
      if (part.fieldObj.shortType === "string") {
  
        var prefix = "";
        if (value && part.valueObj.type !== 'field' && this.isHostedService(this.mapLayer.url)) {
          if (this.containsNonLatinCharacter(value)) {
            prefix = 'N';
          }
        }
        switch (part.operator) {
          case this.i18n.stringOperatorIs:
            if (part.valueObj.type === 'field') {
              whereClause = part.fieldObj.name + " = " + value;
            } else {
              whereClause = part.fieldObj.name + " = "+prefix+"'" + value.replace(/\'/g, "''") + "'";
            }
            break;
          case this.i18n.stringOperatorIsNot:
            if (part.valueObj.type === 'field') {
              whereClause = part.fieldObj.name + " <> " + value;
            } else {
              whereClause = part.fieldObj.name + " <> "+prefix+"'" + value.replace(/\'/g, "''") + "'";
            }
            break;
          case this.i18n.stringOperatorStartsWith:
            whereClause = part.fieldObj.name + " LIKE "+prefix+"'" + value.replace(/\'/g, "''") + "%'";
            break;
          case this.i18n.stringOperatorEndsWith:
            whereClause = part.fieldObj.name + " LIKE "+prefix+"'%" + value.replace(/\'/g, "''") + "'";
            break;
          case this.i18n.stringOperatorContains:
            whereClause = part.fieldObj.name + " LIKE "+prefix+"'%" + value.replace(/\'/g, "''") + "%'";
            break;
          case this.i18n.stringOperatorDoesNotContain:
            whereClause = part.fieldObj.name + " NOT LIKE "+prefix+"'%" + value.replace(/\'/g, "''") + "%'";
            break;
          case this.i18n.stringOperatorIsBlank:
            whereClause = part.fieldObj.name + " IS NULL";
            break;
          case this.i18n.stringOperatorIsNotBlank:
            whereClause = part.fieldObj.name + " IS NOT NULL";
            break;
        }
        
      } else if (part.fieldObj.shortType === "number") {
      
        switch (part.operator) {
          case this.i18n.numberOperatorIs:
            whereClause = part.fieldObj.name + " = " + value;
            break;
          case this.i18n.numberOperatorIsNot:
            whereClause = part.fieldObj.name + " <> " + value;
            break;
          case this.i18n.numberOperatorIsAtLeast:
            whereClause = part.fieldObj.name + " >= " + value;
            break;
          case this.i18n.numberOperatorIsLessThan:
            whereClause = part.fieldObj.name + " < " + value;
            break;
          case this.i18n.numberOperatorIsAtMost:
            whereClause = part.fieldObj.name + " <= " + value;
            break;
          case this.i18n.numberOperatorIsGreaterThan:
            whereClause = part.fieldObj.name + " > " + value;
            break;
          case this.i18n.numberOperatorIsBetween:
            whereClause = part.fieldObj.name + " BETWEEN " + value1 + " AND " + value2;
            break;
          case this.i18n.numberOperatorIsNotBetween:
            whereClause = part.fieldObj.name + " NOT BETWEEN " + value1 + " AND " + value2;
            break;
          case this.i18n.numberOperatorIsBlank:
            whereClause = part.fieldObj.name + " IS NULL";
            break;
          case this.i18n.numberOperatorIsNotBlank:
            whereClause = part.fieldObj.name + " IS NOT NULL";
            break;
        }
        
      } else { // date
        // value is Date object when we had a DateTextBox
        // value is String when we had unique values list
        if (esriLang.isDefined(value) && part.valueObj.type !== 'field' && (typeof value === "string")) {
          // e.g. "7/7/2010 12:00:00 AM" returned by generateRenderer
          value = new Date(value);
        }
        
        switch (part.operator) {
          case this.i18n.dateOperatorIsOn:
            if (part.valueObj.type === 'field') {
              whereClause = part.fieldObj.name + " = " + value;
            } else {
              if (parameterizeValues) {
                whereClause = part.fieldObj.name + " BETWEEN '{" + parameterizeCount + "}' AND '{" + (parameterizeCount + 1) + "}'";
              } else {
                whereClause = part.fieldObj.name + " BETWEEN '" + this.formatDate(value) + "' AND '" + this.formatDate(this.addDay(value)) + "'";
              }
            }
            break;
          case this.i18n.dateOperatorIsNotOn:
            if (part.valueObj.type === 'field') {
              whereClause = part.fieldObj.name + " <> " + value;
            } else {
              if (parameterizeValues) {
                whereClause = part.fieldObj.name + " NOT BETWEEN '{" + parameterizeCount + "}' AND '{" + (parameterizeCount + 1) + "}'";
              } else {
                whereClause = part.fieldObj.name + " NOT BETWEEN '" + this.formatDate(value) + "' AND '" + this.formatDate(this.addDay(value)) + "'";
              }
            }
            break;
          case this.i18n.dateOperatorIsBefore:
            if (part.valueObj.type === 'field') {
              whereClause = part.fieldObj.name + " < " + value;
            } else {
              whereClause = part.fieldObj.name + " < '" + this.formatDate(value) + "'";
            }
            break;
          case this.i18n.dateOperatorIsAfter:
            if (part.valueObj.type === 'field') {
              whereClause = part.fieldObj.name + " > " + value;
            } else {
              whereClause = part.fieldObj.name + " > '" + this.formatDate(this.addDay(value)) + "'";
            }
            break;
          //case this.i18n.dateOperatorInTheLast:
          //case this.i18n.dateOperatorNotInTheLast:
          case this.i18n.dateOperatorIsBetween:
            if (parameterizeValues) {
              whereClause = part.fieldObj.name + " BETWEEN '" + value1 + "' AND '" + value2 + "'";
            } else {
              whereClause = part.fieldObj.name + " BETWEEN '" + this.formatDate(value1) + "' AND '" + this.formatDate(this.addDay(value2)) + "'";
            }
            break;
          case this.i18n.dateOperatorIsNotBetween:
            if (parameterizeValues) {
              whereClause = part.fieldObj.name + " NOT BETWEEN '" + value1 + "' AND '" + value2 + "'";
            } else {
              whereClause = part.fieldObj.name + " NOT BETWEEN '" + this.formatDate(value1) + "' AND '" + this.formatDate(this.addDay(value2)) + "'";
            }
            break;
          case this.i18n.dateOperatorIsBlank:
            whereClause = part.fieldObj.name + " IS NULL";
            break;
          case this.i18n.dateOperatorIsNotBlank:
            whereClause = part.fieldObj.name + " IS NOT NULL";
            break;
        }
      }
      return {
        whereClause: whereClause
      };
    },  
  
    showDeleteIcon: function(){
      domStyle.set(dom.byId(this.id + ".deleteExpression"), "display", "block");
    },
    
    hideDeleteIcon: function(){
      domStyle.set(dom.byId(this.id + ".deleteExpression"), "display", "none");
    },
  
  /******************************************
   * Stores Creation for fields and operators
   *******************************************/
    createFieldsStore: function(fields){
      if (!fields || !fields.length) {
        return;
      }
  
      var layerInfoFields = lang.clone(fields); // don't mess with the original
  
      layerInfoFields = layerInfoFields.sort(function(a, b){
        a.label = (a.alias || a.name);
        b.label = (b.alias || b.name);
        return a.label < b.label ? -1 : a.label > b.label ? 1 : 0;
      });
      
      var isHosted = this.isHostedService(this.mapLayer.url);
      var isRecentVersion = (this.version >= 10.2);
      
      var newFields = array.filter(layerInfoFields, function(field, idx){
        if (field.type === "esriFieldTypeString" ||
        field.type === "esriFieldTypeDouble" ||
        field.type === "esriFieldTypeSingle" ||
        field.type === "esriFieldTypeInteger" ||
        field.type === "esriFieldTypeSmallInteger" ||
        (field.type === "esriFieldTypeDate" && (this.allowAllDateTypes || isHosted || isRecentVersion))) {
          return true;
        }
        return false;
      }, this);
      var items = array.map(newFields, function(field, idx){
        var shortType;
        switch (field.type) {
          case "esriFieldTypeString":
            shortType = "string";
            this.fieldsInfo.stringFieldsCount++;
            break;
          case "esriFieldTypeDate":
            shortType = "date";
            this.fieldsInfo.dateFieldsCount++;
            break;
          default: // numbers
            shortType = "number";
            this.fieldsInfo.numberFieldsCount++;
            break;
        }
        //if (field.domain) {
        //  console.log(field.alias + " has domains");
        //}
        return {
          id: idx,
          label: field.label, //(field.alias || field.name),
          shortType: shortType,
          alias: field.alias,
          editable: field.editable,
          name: field.name,
          nullable: field.nullable,
          type: field.type
        };
      }, this);
      
      if (!items.length) {
        return;
      }
      
      this.fieldsStore = new ItemFileWriteStore({
        data: {
          identifier: 'id',
          label: 'label',
          items: items
        }
      });
    },
    
    createOperatorStores: function(){
      var items = [];
      items.push({
        name: this.i18n.stringOperatorIs,
        name_: this.i18n.stringOperatorIs,
        id: 0
      });
      items.push({
        name: this.i18n.stringOperatorIsNot,
        name_: this.i18n.stringOperatorIsNot,
        id: 1
      });
      items.push({
        name: this.i18n.stringOperatorStartsWith,
        name_: this.i18n.stringOperatorStartsWith,
        id: 2
      });
      items.push({
        name: this.i18n.stringOperatorEndsWith,
        name_: this.i18n.stringOperatorEndsWith,
        id: 3
      });
      items.push({
        name: this.i18n.stringOperatorContains,
        name_: this.i18n.stringOperatorContains,
        id: 4
      });
      items.push({
        name: this.i18n.stringOperatorDoesNotContain,
        name_: this.i18n.stringOperatorDoesNotContain,
        id: 5
      });
      items.push({
        name: this.i18n.stringOperatorIsBlank,
        name_: this.i18n.stringOperatorIsBlank,
        id: 6
      });
      items.push({
        name: this.i18n.stringOperatorIsNotBlank,
        name_: this.i18n.stringOperatorIsNotBlank,
        id: 7
      });
      this.stringOperatorStore = new ItemFileWriteStore({
        data: {
          label: 'name',
          identifier: 'id',
          items: items
        }
      });
      
      items = [];
      items.push({
        name: this.i18n.dateOperatorIsOn,
        id: 0
      });
      items.push({
        name: this.i18n.dateOperatorIsNotOn,
        id: 1
      });
      items.push({
        name: this.i18n.dateOperatorIsBefore,
        id: 2
      });
      items.push({
        name: this.i18n.dateOperatorIsAfter,
        id: 3
      });
      /*
       items.push({
       name: this.i18n.dateOperatorInTheLast,
       id: 4
       });
       items.push({
       name: this.i18n.dateOperatorNotInTheLast,
       id: 5
       });
       */
      items.push({
        name: this.i18n.dateOperatorIsBetween,
        id: 6
      });
      items.push({
        name: this.i18n.dateOperatorIsNotBetween,
        id: 7
      });
      items.push({
        name: this.i18n.dateOperatorIsBlank,
        id: 8
      });
      items.push({
        name: this.i18n.dateOperatorIsNotBlank,
        id: 9
      });
      this.dateOperatorStore = new ItemFileWriteStore({
        data: {
          label: 'name',
          identifier: 'id',
          items: items
        }
      });
      
      items = [];
      items.push({
        name: this.i18n.numberOperatorIs,
        name_: this.i18n.numberOperatorIs,
        id: 0
      });
      items.push({
        name: this.i18n.numberOperatorIsNot,
        name_: this.i18n.numberOperatorIsNot,
        id: 1
      });
      items.push({
        name: this.i18n.numberOperatorIsAtLeast,
        name_: this.i18n.numberOperatorIsAtLeast,
        id: 2
      });
      items.push({
        name: this.i18n.numberOperatorIsLessThan,
        name_: this.i18n.numberOperatorIsLessThan,
        id: 3
      });
      items.push({
        name: this.i18n.numberOperatorIsAtMost,
        name_: this.i18n.numberOperatorIsAtMost,
        id: 4
      });
      items.push({
        name: this.i18n.numberOperatorIsGreaterThan,
        name_: this.i18n.numberOperatorIsGreaterThan,
        id: 5
      });
      items.push({
        name: this.i18n.numberOperatorIsBetween,
        name_: this.i18n.numberOperatorIsBetween,
        id: 6
      });
      items.push({
        name: this.i18n.numberOperatorIsNotBetween,
        name_: this.i18n.numberOperatorIsNotBetween,
        id: 7
      });
      items.push({
        name: this.i18n.numberOperatorIsBlank,
        name_: this.i18n.numberOperatorIsBlank,
        id: 8
      });
      items.push({
        name: this.i18n.numberOperatorIsNotBlank,
        name_: this.i18n.numberOperatorIsNotBlank,
        id: 9
      });
      this.numberOperatorStore = new ItemFileWriteStore({
        data: {
          label: 'name',
          identifier: 'id',
          items: items
        }
      });
    },
      
    
    /*******************************/
    /*** get                     ***/
    /*******************************/
    
    readCodedValues: function(){
      //var domain = null;
      array.forEach(this.mapLayer.fields, function(field){
        if (field.domain && field.domain.codedValues) {
          //console.log("field with coded values: " + field.name + " " + field.type);
          this.fieldDomains[field.name] = field.domain.codedValues;
        }
      }, this);
    },
     
    getDecodedValue: function(value, fieldName){
      var codedValues = this.getCodedValues(fieldName), i , codedValue;
      if (codedValues) {
        for (i = 0; i < codedValues.length; i+=1) {
          codedValue = codedValues[i];
          if (codedValue.code === value) {
            return codedValue.name;
          }
        }
      }
      return value;
    },
    
    getCodedValues: function(fieldName){
      return this.fieldDomains[fieldName];
    },
    
    getFieldsList: function(){
      return registry.byId(this.id + ".fieldsList");
    },
    
    getOperatorList: function(){
      return registry.byId(this.id + ".operatorList");
    },
    
    getValueFieldsList: function(){
      return registry.byId(this.id + ".valueFields");
    },
    
    getAttrValContNode: function(){
      return dom.byId(this.id + ".attributeValueContainer");
    },
    
    getField: function(){
      var select = this.getFieldsList();
      return {
        name: select.store.getValue(select.item, "name"),
        label: select.store.getValue(select.item, "label"),
        shortType: select.store.getValue(select.item, "shortType"),
        type: select.store.getValue(select.item, "type")
      };
    },
    
    getOperator: function(){
      var select = this.getOperatorList();
      if (!select.item) {
        return "";
      }
      return select.store.getValue(select.item, "name");
    },
    
    getValue: function(){
      // to be overwritten
      return {};
    },
    
    isInteractiveChecked: function(){
      return this.interactiveCheck.checked;
    },
    
    setInteractiveSection: function(checked, prompt, hint){
    
      this.disableInteractiveHandlers();
      this.interactiveCheck.checked = checked;
      this.promptText.attr('value', prompt);
      this.hintText.attr('value', hint);
      domStyle.set(this.interactiveSpace, "display", "block");
      this.interactiveArrow.innerHTML = "&nbsp;&#9650;";
      this.enableInteractiveHandlers();
    },
    
    enableInteractiveHandlers: function(){
      this.onPromptChangeHandler = this.promptText.on("change", this.onChangeInteractive.bind(this));
      this.onHintchangeHandler = this.hintText.on("change", this.onChangeInteractive.bind(this));
    },
    
    disableInteractiveHandlers: function(){
      this.onPromptChangeHandler.remove();
      this.onHintChangeHandler.remove();
    },
    
    /*******************************/
    /*** components              ***/
    /*******************************/
    
    fillFieldsList: function(store) {
      var fieldsList = this.getFieldsList();
      fieldsList.set('labelAttr', 'label');
      fieldsList.set('searchAttr', 'label');
      fieldsList.set('store', store);
      fieldsList.set('value', 0);
    },
    
    fillOperatorList: function(store, value, query){
      var opList = this.getOperatorList();
      opList.set('labelAttr', 'name');
      opList.set('searchAttr', 'name');
      opList.set('query', query ? query : {});
      opList.set('store', store);
      if (value) {
        var found = false;
        for (var id = 0; id < 20; id++) {
          store.fetchItemByIdentity({
            identity: id,
            onItem: lang.hitch(this, function(item){
              if (item && item.name[0] === value) {
                opList.set('value', item.id[0]);
                found = true;
              }
            })
          });
          if (found) {
            break;
          }
        }
      } else {
        opList.set('value', 0);
      }
    },
    
    createValueString: function(codedValues){
      var attrValCont = this.getAttrValContNode();
      this.clearAttributeValueDijits();
      domConstruct.empty(attrValCont);
      if (codedValues) {
        var codedValuesList = new FilteringSelect({
          id: this.id + '.value',
          'class': 'attributeValue',
          maxHeight: 150,
          sortByLabel: true
        }, domConstruct.create("div", {}, attrValCont));
        var store = this.buildCodedValuesStore(codedValues);
        codedValuesList.set('store', store);
        codedValuesList.set('value', 0);
        
        this.valueHandlers.push(codedValuesList.on("change", this.onValueChange.bind(this)));
      } else {
        var textBox = new TextBox({
          id: this.id + '.value',
          'class': 'attributeValue',
          required: true,
          placeHolder: "",
          intermediateChanges: true
        }, domConstruct.create("div", {}, attrValCont));
        
        this.valueHandlers.push(textBox.on("change", this.onValueChange.bind(this)));
      }
      this.checkDefaultOption();
      
      this.getValue = function(){
        var valueDijit = registry.byId(this.id + ".value");
        var value;
        var valid = true;
        if (codedValues) {
          if (valueDijit.item) {
            value = valueDijit.item.code[0];
          } else {
            value = "";
            valid = false;
          }
        } else {
          value = valueDijit.get('value');
          valid = value; // empty string is not valid
        }
        return {
          value: value,
          isValid: valid
        };
      };
    },
    
    createValueDate: function(){
      var attrValCont = this.getAttrValContNode();
      this.clearAttributeValueDijits();
      domConstruct.empty(attrValCont);
      var dateTextBox = new DateTextBox({
        id: this.id + '.value',
        'class': 'attributeValue',
        'trim': true,
        required: true,
        placeHolder: "",
        constraints: {
          datePattern: this.i18n.friendlyDatePattern
        }
      }, domConstruct.create("div", {}, attrValCont));
      this.checkDefaultOption();
      
      this.valueHandlers.push(dateTextBox.on("change", this.onValueChange.bind(this)));
      
      this.getValue = function(){
        var value = registry.byId(this.id + ".value").get('value');
        return {
          value: value, // Date object
          isValid: esriLang.isDefined(value)
        };
      };
    },
    
    createValueNumber: function(codedValues){
      var attrValCont = this.getAttrValContNode();
      this.clearAttributeValueDijits();
      domConstruct.empty(attrValCont);
      if (codedValues) {
        var codedValuesList = new FilteringSelect({
          id: this.id + '.value',
          'class': 'attributeValue',
          maxHeight: 150,
          sortByLabel: true
        }, domConstruct.create("div", {}, attrValCont));
        var store = this.buildCodedValuesStore(codedValues);
        codedValuesList.set('store', store);
        codedValuesList.set('value', 0);
        
        this.valueHandlers.push(codedValuesList.on("change", this.onValueChange.bind(this)));
      } else {
        var numberTextBox = new NumberTextBox({
          id: this.id + '.value',
          'class': 'attributeValue',
          required: true,
          placeHolder: "",
          intermediateChanges: true,
          constraints: {pattern: '#####0.##########'}
          // constraints:{min:-20000,max:20000,places:0}
        }, domConstruct.create("div", {}, attrValCont));
        
        this.valueHandlers.push(numberTextBox.on("change", this.onValueChange.bind(this)));
      }
      this.checkDefaultOption();
      
      this.getValue = function(){
        var valueDijit = registry.byId(this.id + ".value");
        var value;
        var valid = true;
        if (codedValues) {
          if (valueDijit.item) {
            value = valueDijit.item.code[0];
          } else {
            value = "";
            valid = false;
          }
        } else {
          value = valueDijit.get('value');
          valid = esriLang.isDefined(value) && !isNaN(value);
        }
        return {
          value: value,
          isValid: valid
        };
      };
    },
    
    createValueBetweenDate: function(){
      var attrValCont = this.getAttrValContNode();
      this.clearAttributeValueDijits();
      domConstruct.empty(attrValCont);
      var dateTextBox1 = new DateTextBox({
        id: this.id + '.value1',
        'class': 'attributeValue1',
        'trim': true,
        required: true,
        placeHolder: "",
        constraints: {
          datePattern: this.i18n.friendlyDatePattern
        }
      }, domConstruct.create("div", {}, attrValCont));
      domConstruct.create("span", {
        innerHTML: this.i18n.andBetweenValues,
        'class': "attributeBetweenValues"
      }, attrValCont);
      var dateTextBox2 = new DateTextBox({
        id: this.id + '.value2',
        'class': 'attributeValue2',
        'trim': true,
        required: true,
        placeHolder: "",
        constraints: {
          datePattern: this.i18n.friendlyDatePattern
        }
      }, domConstruct.create("div", {}, attrValCont));
      this.checkDefaultOption();
      
      this.valueHandlers.push(dateTextBox1.on("change", this.onValueChange.bind(this)));
      this.valueHandlers.push(dateTextBox2.on("change", this.onValueChange.bind(this)));
      
      this.getValue = function(){
        var value1 = registry.byId(this.id + ".value1").get('value');
        var value2 = registry.byId(this.id + ".value2").get('value');
        return {
          value1: value1, // Date object
          value2: value2, // Date object
          isValid: esriLang.isDefined(value1) && esriLang.isDefined(value2)
        };
      };
    },
    
    createValueBetweenNumber: function(){
      var attrValCont = this.getAttrValContNode();
      this.clearAttributeValueDijits();
      domConstruct.empty(attrValCont);
      var numberTextBox1 = new NumberTextBox({
        id: this.id + '.value1',
        'class': 'attributeValue1',
        required: true,
        placeHolder: "",
        intermediateChanges: true,
        constraints: {pattern: '#####0.##########'}
        // constraints:{min:-20000,max:20000,places:0}
      }, domConstruct.create("div", {}, attrValCont));
      domConstruct.create("span", {
        innerHTML: this.i18n.andBetweenValues,
        'class': "attributeBetweenValues"
      }, attrValCont);
      var numberTextBox2 = new NumberTextBox({
        id: this.id + '.value2',
        'class': 'attributeValue2',
        required: true,
        placeHolder: "",
        intermediateChanges: true,
        constraints: {pattern: '#####0.##########'}
        // constraints:{min:-20000,max:20000,places:0}
      }, domConstruct.create("div", {}, attrValCont));
      this.checkDefaultOption();
      
      this.valueHandlers.push(numberTextBox1.on("change", this.onValueChange.bind(this)));
      this.valueHandlers.push(numberTextBox2.on("change", this.onValueChange.bind(this)));
      
      this.getValue = function(){
        var value1 = registry.byId(this.id + ".value1").get('value');
        var value2 = registry.byId(this.id + ".value2").get('value');
        return {
          value1: value1,
          value2: value2,
          isValid: esriLang.isDefined(value1) && esriLang.isDefined(value2) && !isNaN(value1) && !isNaN(value2) && (value1 <= value2)
        };
      };
    },
    
    createValueInTheLastDate: function(){
      // not yet done ...
    },
    
    createValueIsBlank: function(){
      var attrValCont = this.getAttrValContNode();
      this.clearAttributeValueDijits();
      domConstruct.empty(attrValCont);
      attrValCont.innerHTML = "<input id='" + this.id + ".value' class='attributeValue' type='text' disabled='true'/>";
      this.checkDefaultOption();
      
      this.getValue = function(){
        return {
          value: null,
          isValid: true
        };
      };
    },
    
    createValueFields: function(store, query, fieldName){
    
      var attrValCont = this.getAttrValContNode();
      this.clearAttributeValueDijits();
      domConstruct.empty(attrValCont);
      var valueFieldSelect = new FilteringSelect({
        id: this.id + ".valueFields",
        "class": "attributeValue",
        maxHeight: 150,
        labelAttr: 'label',
        searchAttr: 'label',
        store: store,
        query: query
      }, domConstruct.create("div", {}, attrValCont));
      
      if (fieldName) {
        // make sure field type fits ... (let's assume 100 fields max)
        var found = false;
        for (var id = 0; id < 100; id++) {
          store.fetchItemByIdentity({
            identity: id,
            onItem: lang.hitch(this, function(item){
              if (item && item.shortType[0] === query.shortType && item.name[0] !== fieldName) {
                valueFieldSelect.set('value', item.id);
                found = true;
              }
            })
          });
          if (found) {
            break;
          }
        }
      }
      
      // set combobox read only
      //valueFieldSelect.textbox.readOnly = true;
      
      this.valueHandlers.push(valueFieldSelect.on("change", this.onValueChange.bind(this)));
      
      this.getValue = function(){
        var select = registry.byId(this.id + ".valueFields");
        return {
          value: select.store.getValue(select.item, "name"),
          label: select.store.getValue(select.item, "label"),
          type: 'field',
          isValid: true
        };
      };
    },
    
    createValueUnique: function(store){
    
      var attrValCont = this.getAttrValContNode();
      this.clearAttributeValueDijits();
      domConstruct.empty(attrValCont);
      var valueUniqueSelect = new FilteringSelect({
        id: this.id + ".valueUnique",
        "class": "attributeValue",
        maxHeight: 150,
        store: store
      }, domConstruct.create("div", {}, attrValCont));
      
      valueUniqueSelect.set('value', 0);
      // set combobox read only
      //valueUniqueSelect.textbox.readOnly = true;
      
      this.valueHandlers.push(valueUniqueSelect.on("change", this.onValueChange.bind(this)));
      
      this.getValue = function(){
        var select = registry.byId(this.id + ".valueUnique");
        return {
          value: select.store.getValue(select.item, "value"),
          isValid: true
        };
      };
    },
    
    setValue: function(value, codedValues){
      if (codedValues) {
        for (var i = 0; i < codedValues.length; i++) {
          if (value === codedValues[i].code) {
            registry.byId(this.id + '.value').set('value', i);
            break;
          }
        }
      } else if (this.part.fieldObj.shortType === "date") {
        registry.byId(this.id + ".value").set('value', new Date(value));
      } else {
        if (this.part.fieldObj.shortType === "number") {
          value = Number(value); 
        }
        registry.byId(this.id + ".value").set('value', value);
      }
    },
    
    setValue1: function(value){
      if (this.part.fieldObj.shortType === "date") {
        value = new Date(value);
      } else if (this.part.fieldObj.shortType === "number") {
        value = Number(value); 
      }
      registry.byId(this.id + ".value1").set('value', value);
    },
    
    setValue2: function(value){
      if (this.part.fieldObj.shortType === "date") {
        value = new Date(value);
      } else if (this.part.fieldObj.shortType === "number") {
        value = Number(value); 
      }
      registry.byId(this.id + ".value2").set('value', value);
    },
    
    setValueFieldById: function(id){
      this.getValueFieldsList().set('value', id);
    },
    
    /*******************************/
    /*** events                  ***/
    /*******************************/
    
    enableOnFieldChange: function(){
      this.onFieldChangeEnabled = true;
    },
    
    enableOnOperatorChange: function(){
      this.onOperatorChangeEnabled = true;
    },
    
    onChangeField: function(value){
      if (this.onFieldChangeEnabled) {
        this._onChangeField(this.getFieldsList(), this);/////////////no owner
      }
    },
    
    onChangeOperator: function(value){
      if (this.onOperatorChangeEnabled) {
        this._onChangeOperator(this.getOperatorList(), this);/////////////no owner
      }
    },
    
    onClickDeleteExpression: function(e){
      this._deleteExpression(this); ////////////////no owner
    },
    
    _onChangeField: function(selectNode, expr, set){
    
      var opList = expr.getOperatorList();
      switch (this.fieldsStore.getValue(selectNode.item, "type")) {
      
        case "esriFieldTypeString":
          
          var query = null;
          var fieldName = this.fieldsStore.getValue(selectNode.item, "name");
          if (this.getCodedValues(fieldName)) {
            var str = this.i18n.stringOperatorStartsWith;
            str += "|" + this.i18n.stringOperatorEndsWith;
            str += "|" + this.i18n.stringOperatorContains;
            str += "|" + this.i18n.stringOperatorDoesNotContain;
            query = {
              name_: new RegExp("^(?!(" + str + ")$)")
            };
          }
          
          if (opList.attr("value") === this.i18n.stringOperatorIs) {
            // maybe same operator name between different types
            expr.fillOperatorList(this.stringOperatorStore, this.i18n.stringOperatorIs, query);
            this.onChangeOperator(opList, expr, set);
          } else {
            expr.fillOperatorList(this.stringOperatorStore, this.i18n.stringOperatorIs, query);
          }
          expr.createValueString(this.getCodedValues(fieldName));
          break;
          
        case "esriFieldTypeDate":
          
          expr.fillOperatorList(this.dateOperatorStore, this.i18n.dateOperatorIsOn);
          expr.createValueDate();
          break;
          
        default: // numbers
          query = null;
          fieldName = this.fieldsStore.getValue(selectNode.item, "name");
          if (this.getCodedValues(fieldName)) {
            str = this.i18n.numberOperatorIsBetween;
            str += "|" + this.i18n.numberOperatorIsNotBetween;
            str += "|" + this.i18n.numberOperatorIsAtLeast;
            str += "|" + this.i18n.numberOperatorIsLessThan;
            str += "|" + this.i18n.numberOperatorIsAtMost;
            str += "|" + this.i18n.numberOperatorIsGreaterThan;
            query = {
              name_: new RegExp("^(?!(" + str + ")$)")
            };
          }
          
          if (opList.attr("value") === this.i18n.numberOperatorIs) {
            // maybe same operator name between different types
            expr.fillOperatorList(this.numberOperatorStore, this.i18n.numberOperatorIs, query);
            this.onChangeOperator(opList, expr, set);
          } else {
            expr.fillOperatorList(this.numberOperatorStore, this.i18n.numberOperatorIs, query);
          }
          expr.createValueNumber(this.getCodedValues(fieldName));
          break;
      }
      
      var shortFieldType = this.fieldsStore.getValue(expr.getFieldsList().item, "shortType");
      if (shortFieldType === "date") {
        expr.disableInteractiveCheck();
      } else {
        expr.enableInteractiveCheck();
      }
      /*if(this.part) {
        this.buildEditUIField(this.part, this);
      }*/
      topic.publish('filter-expression-change', this);
      //this.updateUIOptions(expr, expr.toJSON());
      //this.disableOK();
    },
    
    _onChangeOperator: function(selectNode, expr, set){
    
      var operator = selectNode.item ? selectNode.item.name[0] : selectNode.value;
      var shortFieldType = this.fieldsStore.getValue(expr.getFieldsList().item, "shortType");
      var fieldName = this.fieldsStore.getValue(expr.getFieldsList().item, "name");
      expr.enableOptions();
      
      if ((shortFieldType === "date" || shortFieldType === "number") &&
      (operator === this.i18n.dateOperatorIsBetween ||
      operator === this.i18n.numberOperatorIsBetween ||
      operator === this.i18n.dateOperatorIsNotBetween ||
      operator === this.i18n.numberOperatorIsNotBetween)) {
      
        if (shortFieldType === "date") {
          expr.createValueBetweenDate();
        } else { //is number field
          expr.createValueBetweenNumber();
        }
  
      } else if (shortFieldType === "date" && 
      (operator === this.i18n.dateOperatorInTheLast || operator === this.i18n.dateOperatorNotInTheLast)) {
      
        expr.createValueInTheLastDate();
        
      } else if (operator === this.i18n.stringOperatorIsBlank ||
      operator === this.i18n.dateOperatorIsBlank ||
      operator === this.i18n.numberOperatorIsBlank ||
      operator === this.i18n.stringOperatorIsNotBlank ||
      operator === this.i18n.dateOperatorIsNotBlank ||
      operator === this.i18n.numberOperatorIsNotBlank) {
      
        expr.createValueIsBlank();
        expr.disableOptions(); 
      
        
      } else {
      
        switch (shortFieldType) {
          case "string":
            expr.createValueString(this.getCodedValues(fieldName));
            break;
          case "date":
            expr.createValueDate();
            break;
          default:
            expr.createValueNumber(this.getCodedValues(fieldName));
        }
      }
      topic.publish('filter-expression-change', this);
      //this.updateUIOptions(expr, expr.toJSON());
      //this.checkOK();
    },
    
    onInteractiveClick: function(e){
      var checked = this.isInteractiveChecked();
      if (checked) {
        domStyle.set(this.interactiveSpace, "display", "block");
        this.interactiveArrow.innerHTML = "&nbsp;&#9650;";
      } else {
        domStyle.set(this.interactiveSpace, "display", "none");
        this.interactiveArrow.innerHTML = "&nbsp;&#9660;";
      }
      topic.publish('filter-expression-change', this);
    },
    
    onClickShowHideInteractive: function(e){
      if (this.interactiveCheck.disabled) {
        // do nothing
        return;
      }
      
      if (domStyle.set(this.interactiveSpace, "display") === "none") {
        domStyle.set(this.interactiveSpace, "display", "block");
        this.interactiveArrow.innerHTML = "&nbsp;&#9650;";
      } else {
        domStyle.set(this.interactiveSpace, "display", "none");
        this.interactiveArrow.innerHTML = "&nbsp;&#9660;";
      }
    },
    
    onChangeInteractive: function(){
      topic.publish('filter-expression-change', this);
    },
    
    showValueInput: function(e){
      this._showValueInput(registry.byNode(e.target), this); ////////////////no owner
    },
    
    showFields: function(e){
      this._showFields(registry.byNode(e.target), this);/////////////no owner
    },
    
    showUniqueList: function(e){
      this._showUniqueList(registry.byNode(e.target), this);/////////////no owner
    },
    
    onValueChange: function(){
  
      // wait a little to send of the publish, in case the user is in the middle of typing
      if (this.onValueChangeHandler) {
        // restart
        clearTimeout(this.onValueChangeHandler);
      }
      this.onValueChangeHandler = setTimeout(lang.hitch(this, function(){
        this.onValueChangeHandler = null;
        topic.publish('filter-expression-change', this);
      }), 800);
    },
    /**************************************************/
    /****  options                                 ****/
    /**************************************************/
    
    _showValueInput: function(node, expr, set){
      //var operatorNode = query(".operator",el.target.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement)[0];
      //var index = parseInt(operatorNode.id.substring(operatorNode.id.lastIndexOf("_")+1));
      // go back to default
      expr.onChangeOperator(node, expr, set);
      expr.enableInteractiveCheck();
      //this.checkOK();
    },
    
    _showFields: function(node, expr, set){
    
      var selectedFieldItem = expr.getFieldsList().item;
      var fieldShortType = this.fieldsStore.getValue(selectedFieldItem, "shortType");
      var fieldName = this.fieldsStore.getValue(selectedFieldItem, "name");
      expr.createValueFields(this.fieldsStore, {
        shortType: fieldShortType,
        name: new RegExp("^(?!" + fieldName + "$)")
      }, fieldName);
      expr.disableInteractiveCheck();
      //this.checkOK();
    },
    
    _showUniqueList: function(node, expr, set){
    
      //var selectedFieldItem = expr.getFieldsList().item;
      
      if (this.uniqueValuesStore) {
        delete this.uniqueValuesStore;
      }
      
      var fieldName = this.fieldsStore.getValue(expr.getFieldsList().item, "name");
      //var fieldShortType = this.fieldsStore.getValue(expr.getFieldsList().item, "shortType");
      
      if (this.version >= 10.1) {
        var layerUrl = null;
        if (this.mapLayer.queryServiceUrl) {
          // querying the tile services
          layerUrl = this.mapLayer.queryServiceUrl;
        }else if (this.mapLayer.itemLayers) {
          // JSAPI dynamic map service layers.
          // loop over all info saved on item /data
          array.forEach(this.mapLayer.itemLayers, function(info){
            if (info.id === this.layerInfo.id && info.layerUrl) {
              layerUrl = info.layerUrl;
            }
          }, this);
        }
        if (!layerUrl) {
          /*if (this.mapLayer instanceof esri.layers.ArcGISDynamicMapServiceLayer) {
            layerUrl = this.mapLayer.url + "/" + this.layerInfo.id;
          }*///else {
            //for the filter layer
            // for feature layers...
            layerUrl = this.mapLayer.url;
          //}
        }
        if (this.uniqueValuesResults[this.mapLayer.id+"_"+fieldName]) {
          // caching the unique values using uniqueValuesResults
          this.onGenerateRendererResults(expr, node, this.uniqueValuesResults[this.mapLayer.id+"_"+fieldName]);
        } else {
          this.generateRendererUniqueValues(fieldName, layerUrl, lang.hitch(this, 'onGenerateRendererResults', expr, node), lang.hitch(this, function(){
            // error from generateRenderer
            /*var dlg = esri.arcgisonline.sharing.dijit.dialog.GeneralDlg.prototype.statics.getInstance();
            dlg.show({
              title: esri.i18nBundle.generalDlg.errorDlgTitle,
              message: this.i18n.error.generateRendererFailed
            });*/
            this.showValueInput(node, expr);
            return;
          }));
        }
      } else if(node){
        this.showValueInput(node, expr);
        return;
       }
      //expr.enableInteractiveCheck();
      //this.checkOK();
    },
    
    onGenerateRendererResults: function(expr, node, uniqueValues){
      var fieldName = this.fieldsStore.getValue(expr.getFieldsList().item, "name");
      var fieldShortType = this.fieldsStore.getValue(expr.getFieldsList().item, "shortType");
      var fieldType = this.fieldsStore.getValue(expr.getFieldsList().item, "type");
      
      this.uniqueValuesResults[this.mapLayer.id+"_"+fieldName] = uniqueValues;
      
      var domain = null;
      // have to change genralizing this widget for map services layers right now only 1 layer supported.
      array.forEach(this.mapLayer.fields, function(field){
        if (field.name === fieldName && field.domain) {
          domain = field.domain;
        }
      });
      
      var notNullUniqueValues = array.filter(uniqueValues, function(value, idx){
        // value is always a string, because we read it from the renderer
        if (fieldShortType === "string") {
          return (value !== "<Null>" && value.trim() !== ""); // we don't allow empty strings
        } else if (fieldShortType === "number") {
          return (value !== "<Null>" && value !== "");
        } else { // "date"
          return (value !== "<Null>" && value !== "");
        }
      });
      
      if (!notNullUniqueValues.length) {
        /*var dlg = esri.arcgisonline.sharing.dijit.dialog.GeneralDlg.prototype.statics.getInstance();
        dlg.show({
          title: esri.i18nBundle.generalDlg.errorDlgTitle,
          message: this.i18n.error.noUniqueValues
        });*/
        this.showValueInput(node, expr);
        return;
      }
      
      if (fieldShortType === "date") {
        // generate renderer returns dates as strings
        notNullUniqueValues = array.map(notNullUniqueValues, function(value){
          return new Date(value);
        });
        // sort them as numbers (milliseconds since 1970)
        notNullUniqueValues = notNullUniqueValues.sort(function(aa, bb){
          var a = aa.getTime();
          var b = bb.getTime();
          return a < b ? -1 : (a > b ? 1 : 0);
        });
        // return to user friendly strings
        notNullUniqueValues = array.map(notNullUniqueValues, function(value){
          return this.formatFriendlyDate(value);
        }, this);
      } else if (fieldShortType === "number") {
        notNullUniqueValues = array.map(notNullUniqueValues, function(value){
          if (fieldType === "esriFieldTypeDouble" || fieldType === "esriFieldTypeSingle") {
            return parseFloat(value);
          } else { // integer, date
            return parseInt(value, 10);
          }
        });
        notNullUniqueValues = notNullUniqueValues.sort(function(a, b){
          return a < b ? -1 : (a > b ? 1 : 0);
        });
      } else {
        notNullUniqueValues = notNullUniqueValues.sort(function(a, b){
          return a < b ? -1 : (a > b ? 1 : 0);
        });
      }
      
      var items = array.map(notNullUniqueValues, function(value, idx){
        // value is always a string, because we read it from the renderer
        
        var label = value;
        // Note: for now we don't allow empty strings and filter them out above...
        // might be a future thing though
        if (fieldShortType === "string") {
          label = (value === "") ? ("<" + this.i18n.emptyString + ">") : value;
        }
        
        if (domain && domain.codedValues) {
          for (var i = 0; i < domain.codedValues.length; i++) {
            var codedValue = domain.codedValues[i];
            if (value === codedValue.code) {
              return {
                id: idx,
                name: codedValue.name || label,
                value: value
              };
            }
          }
          // if we're still here ...
          return {
            id: idx,
            name: "" + label,
            value: value
          };
        } else {
          var l = label;
          if (fieldType === "esriFieldTypeDouble" || fieldType === "esriFieldTypeSingle") {
            // it rounds to 3 decimals. Not sure how to change it without affecting the locale
            l = number.format(value,{pattern: '#####0.##########'});
          }
          return {
            id: idx,
            name: "" + l,
            value: value
          };
        }
      }, this);
      
      this.uniqueValuesStore = new ItemFileWriteStore({
        data: {
          label: 'name',
          identifier: 'id',
          items: items
        }
      });
      expr.createValueUnique(this.uniqueValuesStore);
    },
    
    generateRendererUniqueValues: function(attributeName, layerUrl, handler, errorHandler){
    
      if (attributeName instanceof Array) {
        attributeName = attributeName.toString();
      }
      var classificationDefinition = new UniqueValueDefinition();
      classificationDefinition.attributeField = attributeName;
      //    classificationDefinition.baseSymbol = this.symbol;
      var params = new GenerateRendererParameters();
      params.classificationDefinition = classificationDefinition;
      // don't use definition expression from layer; we want all unique values    
      var generateRenderer, defExpr;
      if (this.mapLayer instanceof GeoRSSLayer) {
        //console.log("filter on georss");
        generateRenderer = new GenerateRendererTask(this.mapLayer);
      } 
      else if (this.mapLayer instanceof FeatureLayer && !this.mapLayer.url) {
        //console.log("filter on feature collection");
        generateRenderer = new GenerateRendererTask(this.mapLayer);
      }
      else if (this.hasDynamicLayers(this.mapLayer)) {
        //console.log("map with dybamic");
        defExpr = (this.mapLayer.layerDefinitions && this.mapLayer.layerDefinitions[this.mapLayer.id]) ? this.mapLayer.layerDefinitions[this.mapLayer.id] : null;
        params.where = defExpr ? defExpr : null;
        generateRenderer = new GenerateRendererTask(this.mapLayer.url+"/dynamicLayer", {source: this.layerInfo.source});
      } 
      else {
        //console.log("filter on feature layer url");
        defExpr = this.mapLayer.getDefinitionExpression();
        params.where = defExpr ? defExpr : null;
        generateRenderer = new GenerateRendererTask(layerUrl);
      }
      esriKernel.config.request.timeout = 10000; // we only wait 10 sec
      generateRenderer.execute(params, function(renderer){
        // e.g. "7/7/2010 12:00:00 AM" returned by generateRenderer
        esriKernel.config.request.timeout = 60000;
        //console.log(renderer.infos)
        var values = array.map(renderer.infos, function(info){
          return info.value;
        });
        handler(values);
      }, lang.hitch(this, function(error){
        // generateRenderer request failed
        //console.log(error);
        esriKernel.config.request.timeout = 60000;
        errorHandler();
      }));
    },
    
    hasDynamicLayers: function(layer) {
      if (layer && layer.supportsDynamicLayers) {
        return true;
      }
      return false;
    },
    
    /*******************************/
    /*** util                    ***/
    /*******************************/
   
    formatDate: function(value){
      // see also parseDate() 
      // to bypass the locale dependent connector character format date and time separately
      return locale.format(value, {
        datePattern: "yyyy-MM-dd",
        selector: "date"
      }) + " " +
      locale.format(value, {
        selector: "time",
        timePattern: "HH:mm:ss"
      });
      
      /* contains comma '2013-03-01, 00:00:00' for locale 'en'
      return locale.format(value, {
        datePattern: "yyyy-MM-dd",
        timePattern: "HH:mm:ss"
      });
      */
    },
    
    formatFriendlyDate: function(value){
      return locale.format(value, {
        datePattern: this.i18n.friendlyDatePattern,
        selector: "date"
      });
    },
    
    parseDate: function(strValue){
      // we know strValue looks like this 'yyyy-MM-dd HH:mm:ss' (e.g. '2013-03-01 00:00:00')
      // some locals (e.g. en) expect a comma after the date like this '2013-03-01, 00:00:00'
      // de, e.g., does not use a comma like this '2013-03-01 00:00:00'
      // el, e.g., uses a dash like this '2013-03-01 - 00:00:00'
      // looked up in dojo/cldr/nls/<locale>/gregorian.js
      var date = locale.parse(strValue, {
        datePattern: "yyyy-MM-dd",
        timePattern: "HH:mm:ss"
      });
      if (!date) {
        date = locale.parse(strValue.replace(" ",", "), {
          datePattern: "yyyy-MM-dd",
          timePattern: "HH:mm:ss"
        });
        if (!date) {
          date = locale.parse(strValue.replace(" "," - "), {
            datePattern: "yyyy-MM-dd",
            timePattern: "HH:mm:ss"
          });
        }
      }
      return date;
      
      /* 
      return locale.parse(strValue, {
        datePattern: "yyyy-MM-dd",
        timePattern: "HH:mm:ss"
      });
      */
    },
    
    addDay: function(date){
      return new Date(date.getTime() + this.dayInMS);
    },
    
    subtractDay: function(date){
      return new Date(date.getTime() - this.dayInMS);
    },
     
    containsNonLatinCharacter: function(string) {
      /*
      console.log(string);
      for (var k = 0; k < string.length; k++) {
        console.log(string.charCodeAt(k));
      }    
      */
      for (var i = 0; i < string.length; i++) {
        if (string.charCodeAt(i) > 255) {
          return true;
        }
      }
      return false;
      
    },
      
    buildCodedValuesStore: function(codedValues){
      var items = array.map(codedValues, function(codedValue, idx){
        return {
          name: codedValue.name,
          code: codedValue.code,
          id: idx
        };
      });
      return new ItemFileWriteStore({
        data: {
          label: 'name',
          identifier: 'id',
          items: items
        }
      });
    },
    
    clearAttributeValueDijits: function(){
      if(!this.valueHandlers || this.valueHandlers.length === 0) {
        return;
      }
      array.forEach(this.valueHandlers, lang.hitch(this, function(handler){
        console.log("disconnecting", handler);
        handler.remove();
        handler = null;
      }));
      this.valueHandlers = [];
      
      if (registry.byId(this.id + ".value")) {
        registry.byId(this.id + ".value").destroy();
      } else if (dom.byId(this.id + ".value")) {
        this.getAttrValContNode().removeChild(dom.byId(this.id + ".value"));
      }
      if (registry.byId(this.id + ".value1")) {
        registry.byId(this.id + ".value1").destroy();
      } else if (dom.byId(this.id + ".value1")) {
        this.getAttrValContNode().removeChild(dom.byId(this.id + ".value1"));
      }
      if (registry.byId(this.id + ".value2")) {
        registry.byId(this.id + ".value2").destroy();
      } else if (dom.byId(this.id + ".value2")) {
        this.getAttrValContNode().removeChild(dom.byId(this.id + ".value2"));
      }
      if (registry.byId(this.id + ".valueFields")) {
        registry.byId(this.id + ".valueFields").destroy();
      }
      if (registry.byId(this.id + ".valueUnique")) {
        registry.byId(this.id + ".valueUnique").destroy();
      }
    },
    
    checkDefaultOption: function(){
      query(".attributeValueOptions .attributeValueRadio", this.domNode).forEach(function(radioNode){
        registry.byNode(radioNode).set('checked', (radioNode.className.indexOf("radioValue") > -1));
      });
    },
    
    disableOptions: function(){
      query(".attributeValueOptions .attributeValueRadio", this.domNode).forEach(function(radioNode){
        registry.byNode(radioNode).set('disabled', true);
      });
    },
    
    enableOptions: function(){
      query(".attributeValueOptions .attributeValueRadio", this.domNode).forEach(function(radioNode){
        registry.byNode(radioNode).set('disabled', false);
      });
    },
    
    checkFieldOption: function(){
      registry.byId(this.id + ".radioFields").set('checked', true);
    },
    
    disableFieldOption: function(){
      registry.byId(this.id + ".radioFields").set('disabled', true);
    },
      
    disableUniqueOption: function(){
      registry.byId(this.id + ".radioUnique").set('disabled', true);
    },
    
    enableInteractiveCheck: function(){
      this.interactiveCheck.disabled = false;
    },
    
    disableInteractiveCheck: function(){
      this.interactiveCheck.checked = false;
      this.interactiveCheck.disabled = true;
    },
    
    isHostedService: function(url){
      if (!url) {
        return false;
      }
      // hosted feature service: http://services.arcgis.com/f7ee40282cbc40998572834591021976/arcgis/rest/services/StateCapitals/FeatureServer
      // new amazon hosted feature service: http://features.arcgis.com/e2ea3c31dd80478689ce70c4fb3380c5/arcgis/rest/services/santaclara_fs/FeatureServer
      // hosted tiled service: https://tilesdevext.arcgis.com/tiles/fa019fbbfbb845d08cc9f0acde6dd8af/arcgis/rest/services/States/MapServer
      // uploaded KML service: http://www.arcgis.com/sharing/rest/content/items/ecddddaf6b174d7ca94816ac397d9b48/data
      // secure service: http://www.arcgis.com/sharing/rest/services/aee2a3d9d15f406cb21576d92ea1316e/MapServer
      var arcgis = ".arcgis.com/",
        services = "//services",
        tiles = "//tiles",
        features = "//features";
        //, sharing = (new dojo._Url(esriGeowConfig.restBaseUrl)).authority,
        //isSingleTenant = (false === esriGeowConfig.isMultiTenant);
  
      // CR #238,732 - only consider locally hosted if the restBaseUrl is on same domain as url
      // and esriGeowConfig.self.supportsHostedServices flag is enabled
      var isAGOL = url.indexOf(arcgis) !== -1,
          isHostedServer = (url.indexOf(services) !== -1 || url.indexOf(tiles) !== -1 || url.indexOf(features) !== -1);
          //,isLocallyHosted = ((esri.isDefined(esriGeowConfig.self) && esriGeowConfig.self.supportsHostedServices) && (url.indexOf(sharing) !== -1 && !isSingleTenant));
          //TBDone for portal look into item properties widget in arcgisonline to get the check for locally hosted services
          //with conversation with Blake this had trouble in portal
          //get the list of federated servers
          //isProxyService = !isHostedServer && arcgis; // if the service requires non-AGOL credentials
      return (isAGOL && isHostedServer); // || (!isAGOL && isLocallyHosted));
    },
    
    //edit ui
    buildEditUIField: function(part, expr, set){
    
      this.getFieldItemByName({
        name: part.fieldObj.name
      }, lang.hitch(this, function(item){
        expr.getFieldsList().set('value', item.id[0]);
        this.buildEditUIOperator(part, expr, set);
      }), lang.hitch(this, function(){
        expr.getFieldsList().set('value', 0);
        this.buildEditUIOperator(part, expr, set);
      }));
    },
    
    buildEditUIOperator: function(part, expr, set){
    
      switch (part.fieldObj.shortType) {
        case "string":
          expr.fillOperatorList(this.stringOperatorStore, part.operator);
          break;
        case "date":
          expr.fillOperatorList(this.dateOperatorStore, part.operator);
          break;
        default: // numbers
          expr.fillOperatorList(this.numberOperatorStore, part.operator);
          break;
      }
      
      this.getOperatorItemByName(expr.getOperatorList().store, {
        name: part.operator
      }, lang.hitch(this, function(item){
        expr.getOperatorList().set('value', item.id[0]);
        this.buildEditUIValue(part, expr, set);
      }), lang.hitch(this, function(){
        expr.getOperatorList().set('value', 0);
        this.buildEditUIValue(part, expr, set);
      }));
    },
    
    buildEditUIValue: function(part, expr, set){
    
      var operator = part.operator;
      this.onChangeOperator(expr.getOperatorList(), expr);
      expr.enableOptions(); 
      // we don't display unique value list ...
      if (operator === this.i18n.stringOperatorIsBlank ||
      operator === this.i18n.dateOperatorIsBlank ||
      operator === this.i18n.numberOperatorIsBlank ||
      operator === this.i18n.stringOperatorIsNotBlank ||
      operator === this.i18n.dateOperatorIsNotBlank ||
      operator === this.i18n.numberOperatorIsNotBlank) {
      
        expr.createValueIsBlank();
        expr.disableOptions(); 
        
      } else if (part.valueObj.type === 'field') {
      
        expr.createValueFields(this.fieldsStore, {
          shortType: part.fieldObj.shortType,
          name: new RegExp("^(?!" + part.fieldObj.name + "$)")
        });
        expr.checkFieldOption();
        
        this.getFieldItemByName({
          name: part.valueObj.value
        }, lang.hitch(this, function(item){
          expr.setValueFieldById(item.id[0]);
        }), lang.hitch(this, function(){
          expr.setValueFieldById(0);
        }));
        
      } else if (esriLang.isDefined(part.valueObj.value1)) {
      
        expr.setValue1(part.valueObj.value1);
        expr.setValue2(part.valueObj.value2);
        
      } else {
      
        expr.setValue(part.valueObj.value, this.getCodedValues(part.fieldObj.name));
      }
      
      //this.updateUIOptions(expr, part);
      /*expr.onChangeField();
      // let things cool down
      setTimeout(lang.hitch(this, function(){
        expr.enableOnFieldChange();
        expr.enableOnOperatorChange();
        if (set) {
          set.enableEvents = true;
        }
        expr.onChangeField();
        //this.checkOK();
      }), 1000);*/
    },
    
    getFieldItemByName: function(query, handler, errorHandler){
      this.fieldsStore.fetch({
        query: query,
        onComplete: lang.hitch(this, function(items){
          if (items && items.length) {
            handler(items[0]);
          } else {
            errorHandler();
          }
        })
      });
    },
    
    getOperatorItemByName: function(store, query, handler, errorHandler){
      store.fetch({
        query: query,
        onComplete: lang.hitch(this, function(items){
          if (items && items.length) {
            handler(items[0]);
          } else {
            errorHandler();
          }
        })
      });
    }        

  });
  
  return SingleFilter;  
  
});  

