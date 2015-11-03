/******************************************
  esri/widgets/analysis/Dissolve
******************************************/
define(
[ 
  "require",
  "../../core/declare",
  "dojo/_base/lang",
  "dojo/_base/array",
  "dojo/_base/connect",
  "dojo/has",
  "dojo/string",
  "dojo/dom-style",
  "dojo/dom-attr",
  "dojo/dom-construct",
  "dojo/query",
  "dojo/dom-class",
  "dojox/form/CheckedMultiSelect",
  
  "dijit/_WidgetBase",
  "dijit/_TemplatedMixin",
  "dijit/_WidgetsInTemplateMixin",
  "dijit/_OnDijitClickMixin",
  "dijit/_FocusMixin",
  "dijit/registry",
  "dijit/form/Button",
  "dijit/form/CheckBox",
  "dijit/form/Form",
  "dijit/form/RadioButton",
  "dijit/form/Select",
  "dijit/form/TextBox",
  "dijit/form/ValidationTextBox",
  "dijit/layout/ContentPane",
  "dijit/form/ComboBox",
  
  "../../kernel",
  "../../core/lang",
  "./AnalysisBase",
  "./_AnalysisOptions",
  "./CreditEstimator",
  "./utils",
  "dojo/i18n!../../nls/jsapi",
  "dojo/text!./templates/DissolveBoundaries.html"
], function(require, declare, lang, array, connection, has, string, domStyle, domAttr, domConstruct, query, domClass, CheckedMultiSelect, _WidgetBase,
   _TemplatedMixin, _WidgetsInTemplateMixin,  _OnDijitClickMixin, _FocusMixin, registry, Button, CheckBox, Form, RadioButton, Select, TextBox, ValidationTextBox, ContentPane, ComboBox, esriKernel, esriLang, AnalysisBase, _AnalysisOptions, CreditEstimator, AnalysisUtils, jsapiBundle, template) {
  var DissolveBoundaries = declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin,  _OnDijitClickMixin, _FocusMixin, _AnalysisOptions, AnalysisBase], {

    declaredClass: "esri.widgets.analysis.DissolveBoundaries",

    templateString: template,
    basePath: require.toUrl("."),
    
    widgetsInTemplate: true,    
    
    inputLayer: null,
    dissolveFields: null, //fields on which to dissolve features.
    summaryFields: null, //possible stats attribute fields
    outputLayerName: null,
    i18n: null,
    
    toolName: "DissolveBoundaries",
    helpFileName: "DissolveBoundaries",
    resultParameter:"DissolvedLayer",
   
    /************
     * Overrides
     ************/
    constructor: function(params){
      this._pbConnects = [];
      this._statsRows = [];
      if (params.containerNode) {
        this.container = params.containerNode;
      }
    },
    
    destroy: function(){
      this.inherited(arguments);
      array.forEach(this._pbConnects, connection.disconnect);
      delete this._pbConnects;
    },
    
    postMixInProperties: function(){
      this.inherited(arguments);
      lang.mixin(this.i18n, jsapiBundle.dissolveBoundaries);
    },
    
    postCreate: function(){
      this.inherited(arguments);
      domClass.add(this._form.domNode, "esriSimpleForm");
      domStyle.set(this._dissolveFieldsSelect.selectNode, "width", "75%");
      //domAttr.set(this._closeImg, "src" , this.basePath + "/images/close.gif");
      this._outputLayerInput.set("validator", lang.hitch(this, this.validateServiceName));
      this._buildUI();
    },
    
    startup: function() {},
  
    /*****************
     * Event Listeners
     *****************/
    
    _onClose: function(save){
      if (save) {
        this._save();
        this.emit("save", {"save": true});//event
      }
      this.emit("close", {"save": save}); //event
    },
    
    _handleAreasChange: function(){
      this._dissolveFieldsSelect.set("disabled", this._sameAttributeAreasCheck.get("checked") !== true);  
    },
    
    _handleBrowseItemsSelect: function(value) {
      if(value && value.selection) {
        AnalysisUtils.addAnalysisReadyLayer({
          item: value.selection,
          layers:  this.inputLayers,
          layersSelect: this._analysisSelect,
          browseDialog: this._browsedlg
        }).always(lang.hitch(this, this._updateAnalysisLayerUI, true));
      }
    },    
    
    _handleShowCreditsClick: function(e) {
      e.preventDefault();
      if (!this._form.validate()) {
        return;
      } 
      var jobParams = {};     
      //input polygon layer url
      jobParams.InputLayer = JSON.stringify(AnalysisUtils.constructAnalysisInputLyrObj(this.inputLayer));
      //summaryFields
      jobParams.SummaryFields  = JSON.stringify(this.get("summaryFields"));
      //outputLayer
      if(!this.returnFeatureCollection) {
        jobParams.OutputName = JSON.stringify({
          serviceProperties : {
            name: this._outputLayerInput.get("value")
          }
        });
      }  
      if (this._sameAttributeAreasCheck.get("checked") === true){
        //dissolveFields
        jobParams.DissolveFields = JSON.stringify(this.get("dissolveFields"));
      }
          
      if (this.showChooseExtent) {
          //console.log("showextent ux", this.showChooseExtent);
          //console.log(this._useExtentCheck.get("checked"));
          if (this._useExtentCheck.get("checked")) {
            jobParams.context = JSON.stringify({
              //outSr: this.map.spatialReference,
              extent: this.map.extent._normalize(true)
            });
          }
        }      
      //console.log(jobParams);
      //console.log(jobParams);
      this.getCreditsEstimate(this.toolName, jobParams).then(lang.hitch(this, function(result){
        //cost: 2.12, Total records: 2120
        this._usageForm.set("content", result);
        this._usageDialog.show();
      }));      
    },

         
    _handleSaveBtnClick: function() {
      
      if (!this._form.validate()) {
        return;
      } 

      this._saveBtn.set("disabled", true);      
      var jobParams = {}, executeObj = {}, contextObj;     
      //input polygon layer url
      jobParams.InputLayer = JSON.stringify(AnalysisUtils.constructAnalysisInputLyrObj(this.inputLayer));
      //summaryFields
      jobParams.SummaryFields  = JSON.stringify(this.get("summaryFields"));
      //outputLayer
      if(!this.returnFeatureCollection) {
        jobParams.OutputName = JSON.stringify({
          serviceProperties : {
            name: this._outputLayerInput.get("value")
          }
        });
      }  
      if (this._sameAttributeAreasCheck.get("checked") === true){
        //dissolveFields
        jobParams.DissolveFields = JSON.stringify(this.get("dissolveFields"));
      }
          
      if (this.showChooseExtent) {
        //console.log("showextent ux", this.showChooseExtent);
        //console.log(this._useExtentCheck.get("checked"));
        if (this._useExtentCheck.get("checked")) {
          jobParams.context = JSON.stringify({
            //outSr: this.map.spatialReference,
            extent: this.map.extent._normalize(true)
          });
        }
      }
      if(this.returnFeatureCollection) {
         contextObj = {
           outSR: this.map.spatialReference
         };
         if(this.showChooseExtent) {
           if(this._useExtentCheck.get("checked")) {
             contextObj.extent = this.map.extent._normalize(true);
           }
         }
         jobParams.context = JSON.stringify(contextObj);
      }             
      //console.log(jobParams);
      executeObj.jobParams  = jobParams;
    
      executeObj.itemParams = { 
        "description" :this.i18n.itemDescription,
        "tags": string.substitute(this.i18n.itemTags, {layername: this.inputLayer.name}),
        "snippet": this.i18n.itemSnippet
      };
      if (this.showSelectFolder) {
        executeObj.itemParams.folder = this.get("folderId");
      }
      
      //console.log(executeObj.itemParams);
      //console.log(executeObj);
      //AnalysisBase submit method
      this.execute(executeObj);  
    },

    _handleAttrSelectChange: function(value) {
      var statsSelect, removeTd, obj;
      if (value !== "0") {
        //value is set 
        statsSelect = this.get("statisticSelect"); 
        if (statsSelect.get("value") !== "0") {
          if (!statsSelect.get("isnewRowAdded")) {
            removeTd = statsSelect.get("removeTd");
            domStyle.set(removeTd, "display", "block");
            obj = statsSelect.get("referenceWidget");
            lang.hitch(obj, obj._createStatsRow());
            statsSelect.set("isnewRowAdded", true);
          }
        }
      }
    },
      
    _handleStatsValueUpdate: function(property , oldValue, newValue) {
      var attrSelect, removeTd, obj;
      //console.log("Stats Successful Change", property, oldValue, newValue, this);
      if (!this.get("attributeSelect")) {
        return;
      }
      //console.log("corresponding attribute selector", this.get("attributeSelect"));
      attrSelect = this.get("attributeSelect");
       if (attrSelect.get("value") !== "0" && newValue !== "0") {
         if (!this.get("isnewRowAdded")) {
           removeTd = this.get("removeTd");
           domStyle.set(removeTd, "display", "block");
           obj = this.get("referenceWidget");
           lang.hitch(obj, obj._createStatsRow());
           this.set("isnewRowAdded", true);
         }
       }
     },
    
     _save: function() {},
    /*******************
     * UI Methods
     *******************/
    _buildUI: function(){
      //console.log("buildUI");
      //console.log(this.outputLayerName); 
      var override = true;
      this._loadConnections();
      AnalysisUtils.initHelpLinks(this.domNode, this.showHelp);
      
      //construct the UI 
      if(this.get("showSelectAnalysisLayer")) {
        if(!this.get("inputLayer") && this.get("inputLayers")) {
          this.set("inputLayer", this.inputLayers[0]);
        }
        AnalysisUtils.populateAnalysisLayers(this, "inputLayer", "inputLayers");
      }
      AnalysisUtils.addReadyToUseLayerOption(this, [this._analysisSelect]);                
      if(this.outputLayerName) {
        this._outputLayerInput.set("value", this.outputLayerName);
        override = false;
      }
      if(this.inputLayer) {
        this._updateAnalysisLayerUI(override);
      }      
      domStyle.set(this._chooseFolderRow, "display", this.showSelectFolder === true? "block" : "none");
      if (this.showSelectFolder) {
        this.getFolderStore().then(lang.hitch(this, function(folderStore) {
          this.folderStore = folderStore;
          AnalysisUtils.setupFoldersUI({
            folderStore: this.folderStore,
            folderId: this.folderId,
            folderName: this.folderName,
            folderSelect: this._webMapFolderSelect,
            username: this.portalUser ? this.portalUser.username: ""
          });
        }));
      }
      
      domStyle.set(this._chooseExtentDiv, "display", this.showChooseExtent === true? "inline-block" : "none");
    },
    
    _loadConnections: function(){
      this.on("start", lang.hitch(this, "_onClose", true));
      this._connect(this._closeBtn, "onclick", lang.hitch(this, "_onClose", false));
    },
    
    _updateAnalysisLayerUI: function(override) {
      if (this.inputLayer) {      
        domAttr.set(this._dissolveBoundariesDescription, "innerHTML", string.substitute(this.i18n.dissolveBoundariesDefine, {layername: this.inputLayer.name})); 
        if (!this.outputLayerName || override) {
          this.outputLayerName = string.substitute(this.i18n.outputLayerName, {layername: this.inputLayer.name});
        }  
        
        var fields = this.inputLayer.fields, dissolvefields = [], selected = false;
        this._dissolveFieldsSelect.removeOption( this._dissolveFieldsSelect.getOptions());
        array.forEach(fields, function(field, index) {
          if (array.indexOf(["esriFieldTypeSmallInteger", "esriFieldTypeInteger", "esriFieldTypeSingle", "esriFieldTypeDouble", "esriFieldTypeString"], field.type) !== -1) {
            if (this.dissolveFields !== null){
              selected = this.dissolveFields.indexOf(field.name) !== -1;
            }
            dissolvefields.push({value:field.name, label:esriLang.isDefined(field.alias) && field.alias !== ""? field.alias : field.name, selected: selected});
          }
        } , this);
        this._dissolveFieldsSelect.addOption(dissolvefields);
        this._dissolveFieldsSelect.set("disabled", this._sameAttributeAreasCheck.get("checked") !== true);
      }
      if (this.outputLayerName) {
        this._outputLayerInput.set("value", this.outputLayerName);
      }
      
      //creates the row stats and attributes in the select box
      this._createStatsRow();
      
      //if the tool has the stats and attributes already selected 
      //console.log("Selected Attributes", this._selectedAttributes);
      //console.log("Selected Stats", this._selectedStats);
      array.forEach(this.summaryFields, function(item) {
        var fields = item.split(" ");
        this._currentAttrSelect.set("value", fields[0]);
        lang.hitch(this._currentAttrSelect, this._handleAttrSelectChange, fields[0])();
         
        this._currentStatsSelect.set("value", fields[1]);
        lang.hitch(this._currentStatsSelect, this._handleStatsValueUpdate, "value", "", fields[1])();
      }, this);
    },
    
    _handleAnalysisLayerChange: function(value) {
      if(value === "browse") {
        if(!this._analysisquery) {
          this._analysisquery = this._browsedlg.browseItems.get("query");
        }
        this._browsedlg.browseItems.set("query", this._analysisquery + " AND tags:\"polygon\"");
        this._isAnalysisSelect = false;
        this._browsedlg.show();
      }
      else {
        this.inputLayer = this.inputLayers[value];
        this._dissolveFields = null;
        this._removeStatsRows();
        this._updateAnalysisLayerUI(true);
      }
    },
    
    // use a simpler logic of using pointer with id with the relationshipd between attr and stats select boxes
    _createStatsRow: function() {
      //console.log("Success Row");
      // add a new stats Row before the  this._afterStatsRow row    
      var statsRow, statsTd, attrTd, attrSelect, statsSelect, removeIcon, removeTd;
      statsRow = domConstruct.create("tr", null ,this._afterStatsRow, "before");
      attrTd = domConstruct.create("td", {style: {width:"45%", maxWidth:"100px"}} , statsRow);
      statsTd = domConstruct.create("td", {style: {width:"55%", maxWidth:"104px"}}, statsRow);
      
      attrSelect = new Select({ 
        maxHeight:200, 
        "class": "esriLeadingMargin1 mediumInput esriTrailingMargin025 attrSelect", 
        style:{
          tableLayout: "fixed", 
          overflowX:"hidden"
        }
      }, domConstruct.create("select", null, attrTd));
      this.set("attributes", {selectWidget: attrSelect, inputLayer: this.inputLayer});
      statsSelect = new Select({
        "class": "mediumInput statsSelect", 
        style:{
          tableLayout: "fixed", 
          overflowX: "hidden"
        }
      }, domConstruct.create("select",  null, statsTd));
      this.set("statistics", {selectWidget: statsSelect});  
      
      attrSelect.set("statisticSelect", statsSelect);
      connection.connect(attrSelect, "onChange", this._handleAttrSelectChange);
      
      removeTd= domConstruct.create("td", {"class":"shortTextInput removeTd" , style :{"display": "none" ,maxWidth:"12px"}} , statsRow);
      removeIcon = domConstruct.create("a", {
        "title": this.i18n.removeAttrStats,
        "class": "closeIcon statsRemove",
        "innerHTML": "<img src='"+ this.basePath + "/images/close.gif"+"' border='0''/>"
      }, removeTd);
      connection.connect(removeIcon, "onclick", lang.hitch(this, this._removeStatsRow, statsRow));
      this._statsRows.push(statsRow);
      //custom properties
      statsSelect.set("attributeSelect", attrSelect);
      statsSelect.set("removeTd", removeTd);
      statsSelect.set("isnewRowAdded", false);
      statsSelect.set("referenceWidget", this);
      //console.log(statsSelect.get("attributeSelect"));
      //console.log(statsSelect.get("removeTd"));
      statsSelect.watch("value", this._handleStatsValueUpdate);
      
      this._currentStatsSelect = statsSelect;
      this._currentAttrSelect = attrSelect;
      //console.log("Cuurent", this._currentStatsSelect);
      //console.log("Cuurent attr", this._currentAttrSelect);
      return true;
    },
    
    _removeStatsRow: function(row) {
      array.forEach(registry.findWidgets(row), function(w) {
        w.destroyRecursive();
      });    
      domConstruct.destroy(row);
    },
    
    _removeStatsRows: function(){
      array.forEach(this._statsRows, this._removeStatsRow, this);
      this._statsRows = [];
    },    
    
    /////getters/setters//////////    
    //sets the tool gp task url
    _setAnalysisGpServerAttr: function(url) {
      if(!url) {
        return;
      }        
      this.analysisGpServer = url;
      this.set("toolServiceUrl", this.analysisGpServer +  "/" + this.toolName);
    },
    
    //sets the polygon layer
    _setInputLayerAttr: function(layer) {
      if(esriLang.isDefined(layer) && layer.geometryType === "esriGeometryPolygon") {
        this.inputLayer = layer;
      } 
    },     
        
    _setInputLayersAttr: function(maplayers) {     
      this.inputLayers = array.filter(maplayers, function(layer) {
        return (layer.geometryType === "esriGeometryPolygon"); 
      });
    },
    
    _setAttributesAttr: function(params) {
        if (!params.inputLayer) {
          return;
        }
        var layer, selectWidget, fields;
        layer = params.inputLayer;
        selectWidget = params.selectWidget;
        fields = layer.fields;
        selectWidget.addOption({value:"0", label: this.i18n.attribute});
        array.forEach(fields, function(field) {
          //console.log(field, index);
          if (array.indexOf(["esriFieldTypeSmallInteger", "esriFieldTypeInteger", "esriFieldTypeSingle", "esriFieldTypeDouble"], field.type) !== -1 ) {
            //console.log("possible stats attribute", field , "  ", field.type);
            if (field.name !== layer.objectIdField) {
              selectWidget.addOption({value:field.name, label:esriLang.isDefined(field.alias) && field.alias !== ""? field.alias : field.name});
            }
          }
        } , this);
      },
      
      _setStatisticsAttr: function(params) {
        var selectWidget = params.selectWidget;
        selectWidget.addOption({value:"0", label: this.i18n.statistic});
        //selectWidget.addOption({value:"COUNT", label:"Count"});
        selectWidget.addOption({value:"SUM", label: this.i18n.sum});
        selectWidget.addOption({value:"MIN", label: this.i18n.minimum});
        selectWidget.addOption({value:"MAX", label: this.i18n.maximum});
        selectWidget.addOption({value:"MEAN", label: this.i18n.average});
        selectWidget.addOption({value:"STDDEV", label: this.i18n.standardDev});
      },
              
      _setDissolveFieldsAttr: function(dissolveFieldsArr) {
        this.dissolveFields = dissolveFieldsArr;
      },
      
      _getDissolveFieldsAttr: function() {
          var dissolveFieldStr = "", dissolveFieldArr = [];   
          this._dissolveFieldsSelect.getOptions().forEach(function(option){
            if (option.selected === true && option.value !== "0") {
                dissolveFieldStr +=  option.value + ";";
                dissolveFieldArr.push(option.value);
            } 
          });
          //console.log(dissolveFieldArr);
          return dissolveFieldArr;
      },
     
      _setSummaryFieldsAttr: function(summaryFieldsArr) {
        //["AREA MAX", "POP2000 MAX"]
        //console.log("summary fields setter", summaryFieldsArr);
        this.summaryFields = summaryFieldsArr;
      },
      
      _getSummaryFieldsAttr: function() {
        var summaryFieldStr = "", summaryFieldArr = [], statsSelect, attrSelect;
        query(".statsSelect", this.domNode).forEach(function(node) {
          //console.log(node, index);
          statsSelect = registry.byNode(node);
          //console.log(statsSelect);
          attrSelect = statsSelect.get("attributeSelect");
          //console.log("attribute" , attrSelect.get("value"));
          //console.log("stat" , statsSelect.get("value"));
          if (attrSelect.get("value") !== "0" && statsSelect.get("value") !== "0") {
            summaryFieldStr +=  attrSelect.get("value") + " " +  statsSelect.get("value") + ";";
            summaryFieldArr.push(attrSelect.get("value") + " " +  statsSelect.get("value"));
          }
        });
        //console.log(summaryFieldStr);
        //console.log(summaryFieldArr);
        return summaryFieldArr;
      },
    
    _setDisableRunAnalysisAttr: function(value){
      this._saveBtn.set("disabled", value);
    },

    _setFolderIdAttr: function(value) {
      this.folderId = value;
    },
    
    _getFolderIdAttr: function() {
      if(this._webMapFolderSelect && this.folderStore) {
        this.folderId = this._webMapFolderSelect.item ? this.folderStore.getValue(this._webMapFolderSelect.item, "id") : "";
      }
      return this.folderId;
    },
    
    _setFolderNameAttr: function(value) {
      this.folderName = value;
    },
    
    _getFolderNameAttr: function() {
      if(this._webMapFolderSelect && this.folderStore && this._webMapFolderSelect.item) {
        this.folderName = this.folderStore.getValue(this._webMapFolderSelect.item, "name");
      }
      return this.folderName;
    },
            
    validateServiceName: function(value) {
      return AnalysisUtils.validateServiceName(value, {textInput: this._outputLayerInput});
    },    
    
    ////////////////////////////
    // Helpers
    ////////////////////////////
    _connect: function(node, evt, func){
      this._pbConnects.push(connection.connect(node, evt, func));
    }
    
  });
  
  return DissolveBoundaries;  
  
});
  
