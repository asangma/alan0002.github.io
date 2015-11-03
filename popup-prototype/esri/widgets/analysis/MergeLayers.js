/******************************************
  esri/widgets/analysis/MergeLayers
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
  "dojo/text!./templates/MergeLayers.html"
], function(require, declare, lang, array, connection, fx, has, string, domStyle, domAttr, domConstruct, query, domClass, easing, _WidgetBase,
   _TemplatedMixin, _WidgetsInTemplateMixin,  _OnDijitClickMixin, _FocusMixin, registry, Button, CheckBox, Form, RadioButton, Select, TextBox, ValidationTextBox, ContentPane, ComboBox, esriKernel, esriLang, AnalysisBase, _AnalysisOptions, CreditEstimator, AnalysisUtils, jsapiBundle, template) {
  var MergeLayers = declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin,  _OnDijitClickMixin, _FocusMixin, _AnalysisOptions, AnalysisBase], {

    declaredClass: "esri.widgets.analysis.MergeLayers",

    templateString: template,
    basePath: require.toUrl("."),
    
    widgetsInTemplate: true,    
    
    inputLayer: null,
    mergeLayers: null,
    mergingAttributes: null, //show fields from the merge layer are to be modified.
    outputLayerName: null,
  
    i18n: null,
    
    toolName: "MergeLayers",
    helpFileName: "MergeLayers",
    resultParameter:"MergedLayer",
   
    /************
     * Overrides
     ************/
    constructor: function(params){
      this._pbConnects = [];
      this._mergeFieldsRows = [];
      this._includedMergeFields = [];
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
      lang.mixin(this.i18n, jsapiBundle.mergeLayers);
    },
    
    postCreate: function(){
      this.inherited(arguments);
      domClass.add(this._form.domNode, "esriSimpleForm");
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

    
    _handleShowCreditsClick: function(e) {
      e.preventDefault();
      if(!this._form.validate()) {
        return;
      } 

           
      var jobParams = {}, mergeLayer;  
      mergeLayer = this.mergeLayers[this._mergeLayersSelect.get("value")];
      //input layer url or featureset
      jobParams.InputLayer = JSON.stringify(AnalysisUtils.constructAnalysisInputLyrObj(this.inputLayer));
      // merger layer url or featureset
      jobParams.MergeLayer = JSON.stringify(AnalysisUtils.constructAnalysisInputLyrObj(mergeLayer));
      // merging attributes
      jobParams.MergingAttributes  = JSON.stringify(this.get("mergingAttributes"));
      //outputLayer
      if(!this.returnFeatureCollection) {
        jobParams.OutputName = JSON.stringify({
          serviceProperties : {
            name: this._outputLayerInput.get("value")
          }
        });
      }
         
                     
      if(this.showChooseExtent) {
          //console.log("showextent ux", this.showChooseExtent);
          //console.log(this._useExtentCheck.get("checked"));
          if(this._useExtentCheck.get("checked")) {
            jobParams.context = JSON.stringify({
              //outSr: this.map.spatialReference,
              extent: this.map.extent._normalize(true)
            });
          }
        }      
      
      //console.log(jobParams);
      this.getCreditsEstimate(this.toolName, jobParams).then(lang.hitch(this, function(result){
        //cost: 2.12, Total records: 2120
        this._usageForm.set("content", result);
        this._usageDialog.show();
      }));      
    },

   
    _handleSaveBtnClick: function() {
      
      if(!this._form.validate()) {
        return;
      } 

      this._saveBtn.set("disabled", true);      
      var jobParams = {}, executeObj = {}, mergeLayer, contextObj;  
      mergeLayer = this.mergeLayers[this._mergeLayersSelect.get("value")];
      //input layer url or featureset
      jobParams.InputLayer = JSON.stringify(AnalysisUtils.constructAnalysisInputLyrObj(this.inputLayer));
      // merger layer url or featureset
      jobParams.MergeLayer = JSON.stringify(AnalysisUtils.constructAnalysisInputLyrObj(mergeLayer));
      // merging attributes
      jobParams.MergingAttributes  = JSON.stringify(this.get("mergingAttributes"));
      //outputLayer
      if(!this.returnFeatureCollection) {
        jobParams.OutputName = JSON.stringify({
          serviceProperties : {
            name: this._outputLayerInput.get("value")
          }
        });
      }  
                     
      if(this.showChooseExtent) {
        //console.log("showextent ux", this.showChooseExtent);
        //console.log(this._useExtentCheck.get("checked"));
        if(this._useExtentCheck.get("checked")) {
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
      if(this.showSelectFolder) {
        executeObj.itemParams.folder = this.get("folderId");
      }
      
      //console.log(executeObj.itemParams);
      //console.log(executeObj);
      //AnalysisBase submit method
      this.execute(executeObj);  
    },
    
    _handleLayerChange: function(index) {
      //console.log("layer change Success" , index);
      //console.log("chosen layer Success", this.mergeLayers[index]);
      var typeFilter = "";
      if(index === "browse") {
        if(!this._analysisquery) {
          this._analysisquery = this._browsedlg.browseItems.get("query");
        }
        if(this.inputLayer){
          if(this.inputLayer.geometryType === "Point") {
            typeFilter = " AND tags:\"point\""; 
          }
          else if(this.inputLayer.geometryType === "Polyline") {
             typeFilter = " AND tags:\"line\"";
          }
          else if(this.inputLayer.geometryType === "Polygon") {
              typeFilter = " AND tags:\"polygon\"";
          }
          
        }
        this._browsedlg.browseItems.set("query", this._analysisquery + typeFilter);
        this._isAnalysisSelect = false;
        this._browsedlg.show();
      }
      else {
        this.outputLayerName = string.substitute(this.i18n.outputLayerName, {layername: this.inputLayer.name, mergelayername: this.mergeLayers[index].name});
        this._outputLayerInput.set("value", this.outputLayerName);

        this._removeMergeFieldsRows();    
        this._createMergeFieldsRow();
      }
    },

    _handleAttrSelectChange: function(attrSelect, value) {
      var statsSelect, removeTd, obj;
      if (value !== "0") {
        //value is set 
        statsSelect = attrSelect.get("statisticSelect");        
        if (statsSelect.get("value") !== "0") {
          if(!statsSelect.get("isnewRowAdded")) {           
            if (this._includedMergeFields !== null && attrSelect.get("value") !== "0"){             
              this._includedMergeFields.push(attrSelect.get("value"));
              var totalFields = this.mergeLayers[this._mergeLayersSelect.get("value")].fields.length;   
              if (this._includedMergeFields.length !== (totalFields - 1)){
                removeTd = statsSelect.get("removeTd");
                domStyle.set(removeTd, "display", "block");
                obj = statsSelect.get("referenceWidget");  
                lang.hitch(obj, obj._createMergeFieldsRow());
                statsSelect.set("isnewRowAdded", true);
              }
            } 
          }
        }
      }
    },
    
    _handleAttrMatchSelectChange: function(attrSelect, value) {
      if (value !== "0" && attrSelect.get("value") !== "0") {
      //console.log(value, attrSelect.get("value"));      
      var mergeLayerFields = this.mergeLayers[this._mergeLayersSelect.get("value")].fields;
      var inputLayerFields = this.inputLayer.fields;
      
      var mergeLayerFieldType = "";
      array.forEach(mergeLayerFields, function(field){
        if (field.name === attrSelect.get("value")){
          mergeLayerFieldType = field.type;           
        }
      });
      
      var inputLayerFieldType = "";
      array.forEach(inputLayerFields, function(field){       
        if (field.name === value){          
          inputLayerFieldType = field.type;             
        }
      }); 
            
      if (mergeLayerFieldType !== inputLayerFieldType){
        if (array.indexOf(["esriFieldTypeSmallInteger", "esriFieldTypeInteger", "esriFieldTypeSingle", "esriFieldTypeDouble"], mergeLayerFieldType) !== -1 &&
              array.indexOf(["esriFieldTypeSmallInteger", "esriFieldTypeInteger", "esriFieldTypeSingle", "esriFieldTypeDouble"], inputLayerFieldType) !== -1) { 
              this._handleCloseMsg();
            this.set("disableRunAnalysis", false);
        }
        else {
            this._showMessages(this.i18n.fieldTypeMatchValidationMsg);
              this.set("disableRunAnalysis", true);
        }
      }
      else {
          this._handleCloseMsg();
          this.set("disableRunAnalysis", false);
        }             
      }
    },
      
    _handleStatsValueUpdate: function(attrSelect, property , oldValue, newValue) {
      var removeTd, obj, statsSelect, attrMatchSelect, attrRenameBox;      
      if (!attrSelect) {
        return;
      }
      //console.log("corresponding attribute selector", this.get("attributeSelect"));   
      statsSelect = attrSelect.get("statisticSelect");    
      attrMatchSelect = attrSelect.get("attributeMatchSelect");
      attrRenameBox = attrSelect.get("attributeRenameBox");
      if (newValue === "Rename"){
        domStyle.set(attrRenameBox.domNode.parentNode, {
          "display": "",
          "padding-left":0,
          "padding-right":0
        });
        attrRenameBox.domNode.style.display = "block";
        attrRenameBox.set("required", true);
        attrMatchSelect.domNode.style.display = "none";
        domStyle.set(statsSelect.domNode.parentNode, "width", "34%");
        domStyle.set(attrSelect.domNode.parentNode, "width", "35%");
      }
      else if (newValue === "Remove" || newValue === "0"){
        attrRenameBox.domNode.style.display = "none";
        attrRenameBox.set("required", false);
        attrMatchSelect.domNode.style.display = "none";
        domStyle.set(statsSelect.domNode.parentNode, "width", "44%");
        domStyle.set(attrSelect.domNode.parentNode, "width", "55%");
        domStyle.set(attrRenameBox.domNode.parentNode, "display", "none");       
      }
      else{
        domStyle.set(attrMatchSelect.domNode.parentNode, {
          "display": "",
          "padding-left":0,
          "padding-right":0
        });
        attrRenameBox.domNode.style.display = "none";
        attrRenameBox.set("required", false);
        attrMatchSelect.domNode.style.display = "table";
        domStyle.set(statsSelect.domNode.parentNode, "width", "34%");
        domStyle.set(attrSelect.domNode.parentNode, "width", "35%");           
      }      
      if (attrSelect.get("value") !== "0" && newValue !== "0") {
        if(!statsSelect.get("isnewRowAdded")) {                 
          if (this._includedMergeFields !== null && attrSelect.get("value") !== "0"){             
            this._includedMergeFields.push(attrSelect.get("value"));   
            var totalFields = this.mergeLayers[this._mergeLayersSelect.get("value")].fields.length;            
            if (this._includedMergeFields.length !== (totalFields - 1)){
              removeTd = statsSelect.get("removeTd");
              domStyle.set(removeTd, "display", "block");
              obj = statsSelect.get("referenceWidget");     
              lang.hitch(obj, obj._createMergeFieldsRow());
              statsSelect.set("isnewRowAdded", true);
            }
          } 
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
      if(this.outputLayerName) {
        this._outputLayerInput.set("value", this.outputLayerName);
        override = false;
      }
      if(this.inputLayer) {
        //console.log(this.inputLayer.name);
        this._updateAnalysisLayerUI(override);
      }
      AnalysisUtils.addReadyToUseLayerOption(this, [this._analysisSelect, this._mergeLayersSelect]);      
      domStyle.set(this._chooseFolderRow, "display", this.showSelectFolder === true? "block" : "none");
      if(this.showSelectFolder) {
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
    
    _updateAnalysisLayerUI: function(override) {
      var alreadyUsedFields = [], options = [], mOptions = this._mergeLayersSelect.getOptions();
      if(this.inputLayer) {      
        domAttr.set(this._mergeLayersDescription, "innerHTML", string.substitute(this.i18n.mergeLayersDefine, {layername: this.inputLayer.name})); 
      }
      if(this.mergeLayers) {
          this._mergeLayersSelect.removeOption(mOptions);
          array.forEach(this.mergeLayers, function(layer , index) {            
            if (layer !== this.inputLayer && layer.geometryType === this.inputLayer.geometryType) {   
                options.push({value:index, label:layer.name});
             }
          }, this);
          this._mergeLayersSelect.addOption(options);
      }
      if(options.length === 0) {
        this._showMessages(this.i18n.mergeValidationMsg);
        this.set("disableRunAnalysis", true);
        return;
      }
      else {
        this.set("disableRunAnalysis", false);
      }
      if(override) {
        this.outputLayerName = string.substitute(this.i18n.outputLayerName, {layername: this.inputLayer.name, mergelayername: this.mergeLayers[this._mergeLayersSelect.get("value")].name});
      }
      if (this.outputLayerName) {
        this._outputLayerInput.set("value", this.outputLayerName);
      }
      
      //creates the row stats and attributes in the select box
      this._removeMergeFieldsRows();
      this._createMergeFieldsRow();
      
      //if the tool has the stats and attributes already selected 
      //console.log("Selected Attributes", this._selectedAttributes);
      //console.log("Selected Stats", this._selectedStats);
      
      array.forEach(this.mergingAttributes, function(item) {
        var fields = item.split(" ");
        if(alreadyUsedFields.indexOf(fields[0]) === -1){          
          this._currentAttrSelect.set("value", fields[0]);
          lang.hitch(this._currentAttrSelect, this._handleAttrSelectChange, fields[0])();         
          this._currentStatsSelect.set("value", fields[1]);
          lang.hitch(this._currentStatsSelect, this._handleStatsValueUpdate, "value", "", fields[1])();         
          if (fields[1] === "Rename"){
            this._currentAttrMatchSelect.set("value", fields[2]);
          }else if (fields[1] === "Match"){
          this._currentAttrRenameBox.set("value", fields[2]);
          }
          alreadyUsedFields.push(fields[0]);          
        }
      }, this);
      if (alreadyUsedFields.length > 0){
        this._includedMergeFields = alreadyUsedFields;        
      }      
    },
    
    _handleAnalysisLayerChange: function(value) {
      if(value === "browse") {
        if(!this._analysisquery) {
          this._analysisquery = this._browsedlg.browseItems.get("query");
        }
        this._browsedlg.browseItems.set("query", this._analysisquery);
        this._isAnalysisSelect = true;
        this._browsedlg.show();
      }
      else {
        this.inputLayer = this.inputLayers[value];
        this.mergingAttributes = [];// reset merging attributes passed-in initialization
        this._updateAnalysisLayerUI(true);
      }
    },
    
    _handleBrowseItemsSelect: function(value) {
      if(value && value.selection) {
        AnalysisUtils.addAnalysisReadyLayer({
          item: value.selection,
          layers:  this._isAnalysisSelect? this.inputLayers : this.mergeLayers,
          layersSelect: this._isAnalysisSelect? this._analysisSelect : this._mergeLayersSelect,
          browseDialog: this._browsedlg
        }).always(lang.hitch(this, this._updateAnalysisLayerUI, true));
      }
    },    
    
    _loadConnections: function(){
      this.on("start", lang.hitch(this, "_onClose", true));
      this._connect(this._closeBtn, "onclick", lang.hitch(this, "_onClose", false));      
    },
    
    // use a simpler logic of using pointer with id with the relationshipd between attr and stats select boxes
    _createMergeFieldsRow: function() {
      //console.log("Success Row");
      var statsRow, rowTable, rowTableRow, rowTableBody, statsTd, attrTd, inputAttrTd, attrSelect, statsSelect, attrRenameBox, attrMatchSelect, removeIcon, removeTd;
      statsRow = domConstruct.create("tr", null, this._afterMergeFieldsRow, "before");
      rowTable = domConstruct.create("table", {"class": "esriFormTable"}, statsRow);
      rowTableBody = domConstruct.create("tbody", null, rowTable);
      rowTableRow = domConstruct.create("tr", null, rowTableBody);
      attrTd = domConstruct.create("td", {style: {width:"35%"}} , rowTableRow);
      statsTd = domConstruct.create("td", {style: {width:"34%"}}, rowTableRow);
      inputAttrTd = domConstruct.create("td", {style: {width:"30%"}}, rowTableRow);     
      
      attrSelect = new Select({ 
        maxHeight:200, 
        "class": "esriLeadingMargin1 mediumInput esriTrailingMargin025 attrSelect", 
        style:{
         overflowX:"hidden",
         tableLayout: "fixed",
         width: "100%"
        }
      }, domConstruct.create("select", null, attrTd));     
      this.set("attributes", {selectWidget: attrSelect, layer: this.mergeLayers[this._mergeLayersSelect.get("value")] });
      statsSelect = new Select({
        "class": "mediumInput statsSelect", 
        style:{
          overflowX: "hidden",
          tableLayout: "fixed",
          width: "100%"
        }
      }, domConstruct.create("select",  null, statsTd));
      this.set("statistics", {selectWidget: statsSelect});  
      
      attrRenameBox = new ValidationTextBox({
        maxHeight:200, 
      "class": "longTextInput",       
      style:{
          overflowX:"hidden",
          display:"none",
          tableLayout: "fixed",
          width: "100%"
        }
      }, domConstruct.create("validationtextbox", null, inputAttrTd));      
      
      attrMatchSelect = new Select({ 
        maxHeight:200, 
        "class": "mediumInput attrSelect",         
        style:{
          overflowX:"hidden",   
          display:"none",
          tableLayout: "fixed",
          width: "100%"          
        }
      }, domConstruct.create("select", null, inputAttrTd));           
      this.set("attributes", {selectWidget: attrMatchSelect, layer: this.inputLayer });
      connection.connect(attrMatchSelect, "onChange", lang.hitch(this, this._handleAttrMatchSelectChange, attrSelect));
      
      attrSelect.set("statisticSelect", statsSelect);
      attrSelect.set("attributeRenameBox", attrRenameBox);
      attrSelect.set("attributeMatchSelect", attrMatchSelect);
      connection.connect(attrSelect, "onChange", lang.hitch(this, this._handleAttrSelectChange, attrSelect));
      
      removeTd = domConstruct.create("td", {"class":"esriFloatTrailing removeTd" , style :{"display": "none" , width: "1%", maxWidth:"12px"}} , rowTableRow);
      removeIcon = domConstruct.create("a", {
        "title": this.i18n.removeAttrStats,
        "class": "closeIcon statsRemove",
        "innerHTML": "<img src='"+ this.basePath + "/images/close.gif"+"' border='0''/>"
      }, removeTd);
      connection.connect(removeIcon, "onclick", lang.hitch(this, this._removeMergeFieldsRow, statsRow));
      
      this._mergeFieldsRows.push(statsRow);
      
      //custom properties
      statsSelect.set("attributeSelect", attrSelect);
      statsSelect.set("removeTd", removeTd);
      statsSelect.set("isnewRowAdded", false);
      statsSelect.set("referenceWidget", this);
      //console.log(statsSelect.get("attributeSelect"));
      //console.log(statsSelect.get("removeTd"));
      statsSelect.watch("value", lang.hitch(this, this._handleStatsValueUpdate, attrSelect));
      
      this._currentStatsSelect = statsSelect;
      this._currentAttrSelect = attrSelect;
      this._currentAttrMatchSelect = attrMatchSelect;
      this._currentAttrRenameBox = attrRenameBox;
      //console.log("Cuurent", this._currentStatsSelect);
      //console.log("Cuurent attr", this._currentAttrSelect);
      return true;
    },
    
    _removeMergeFieldsRows: function(){
        array.forEach(this._mergeFieldsRows, this._removeMergeFieldsRow, this);
        this._mergeFieldsRows = [];
        this._includedMergeFields = [];
      },
    
    _removeMergeFieldsRow: function(row) {
      array.forEach(registry.findWidgets(row), function(w, index) {
      if (index === 0){
        var attrSelect = w;
        var idx = this._includedMergeFields.indexOf(attrSelect.get("value"));
        if (idx !== -1){
          this._includedMergeFields.splice(idx, 1);     
        }
      }
        w.destroyRecursive();
      }, this);   
      domConstruct.destroy(row);
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
    
    //sets the input layer
    _setInputLayerAttr: function(layer) {
      this.inputLayer = layer;     
    }, 
    
    _setInputLayersAttr: function(layers) {
      this.inputLayers = layers;     
    }, 
    
    _setMergeLayersAttr: function(layers) {
      this.mergeLayers = layers;
    },
        
//    _setLayersAttr: function(maplayers) {     
//      array.forEach(maplayers, function(layer) {
//        if(layer.geometryType === "esriGeometryPolygon") {
//          this.inputLayer = layer;
//        }       
//      }, this);
//    },
    
    _setAttributesAttr: function(params) {
        if (!params.layer) {
          return;
        }
        var layer, selectWidget, fields;
        layer = params.layer;      
        selectWidget = params.selectWidget;
        fields = layer.fields;
        selectWidget.addOption({value:"0", label: this.i18n.attribute});
        array.forEach(fields, function(field) {
            //console.log(field, index);          
            //console.log("possible stats attribute", field , "  ", field.type);
          //console.log(field.name , this._includedMergeFields.indexOf(field.name));
            if(field.name !== layer.objectIdField && this._includedMergeFields.indexOf(field.name) === -1) {
              selectWidget.addOption({value:field.name, label:field.name});
            }          
         } , this);
      },
      
    _setStatisticsAttr: function(params) {
      var selectWidget = params.selectWidget;
      selectWidget.addOption({value:"0", label: this.i18n.operation});
      selectWidget.addOption({value:"Rename", label: this.i18n.rename});
      selectWidget.addOption({value:"Remove", label: this.i18n.remove});
      selectWidget.addOption({value:"Match", label: this.i18n.match});       
     },
              
    _setMergingAttributesAttr: function(mergeFieldsArr) {
      //[Temp Remove', 'RiskRate Rename RiskRateJan', 'AirQualityIndex Match AQI']
      //console.log("merge fields setter", mergeFieldsArr);
      this.mergingAttributes = mergeFieldsArr;
    },
       
    _getMergingAttributesAttr: function() {
      var mergeFieldStr = "", mergeFieldArr = [], statsSelect, attrSelect, attrMatchSelect, attrRenameBox;
      query(".statsSelect", this.domNode).forEach(function(node) {
        //console.log(node, index);
        statsSelect = registry.byNode(node);
        //console.log(statsSelect);
        attrSelect = statsSelect.get("attributeSelect");
        attrMatchSelect = attrSelect.get("attributeMatchSelect");
        attrRenameBox = attrSelect.get("attributeRenameBox");      
        if (attrSelect.get("value") !== "0" && statsSelect.get("value") !== "0") {      
        if(statsSelect.get("value") === "Remove"){         
            mergeFieldStr +=  attrSelect.get("value") + " " +  statsSelect.get("value") + ";";
          mergeFieldArr.push(attrSelect.get("value") + " " +  statsSelect.get("value"));        
        }else if (statsSelect.get("value") === "Rename"){
        mergeFieldStr += attrSelect.get("value") + " " + statsSelect.get("value") + " " + attrRenameBox.get("value") + ";";
        mergeFieldArr.push(attrSelect.get("value") + " " +  statsSelect.get("value") + " " + attrRenameBox.get("value"));
        }else{
        mergeFieldStr += attrSelect.get("value") + " " + statsSelect.get("value") + " " + attrMatchSelect.get("value") + ";";
        mergeFieldArr.push(attrSelect.get("value") + " " +  statsSelect.get("value") + " " + attrMatchSelect.get("value"));
        }             
        }
      });
      return mergeFieldArr;
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
      //window.setTimeout(lang.hitch(this, this._handleCloseMsg), 3000);
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
    }
    
  });
  
  return MergeLayers;  
  
});
