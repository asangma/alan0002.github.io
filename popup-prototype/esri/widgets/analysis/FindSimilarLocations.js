/******************************************
 * esri/widgets/analysis/FindSimilarLocations
 * 
 * inputLayer
 * targetQuery (string, optional)
 * candidateLayer
 * fields (multivalue of string)
 * numberOfResults (long, optional, if empty rank all the candidates)
 * outputName
 * context
 * 
 * Find Simliar Locations Tool
 * ******************************************/

define(
[ 
  "require",
  "../../core/declare",
  "dojo/_base/lang",
  "dojo/_base/array",
  "dojo/_base/Color",
  "dojo/_base/connect",
  "dojo/_base/fx",
  "dojo/has",
  "dojo/string",
  "dojo/dom-style",
  "dojo/dom-attr",
  "dojo/dom-construct",
  "dojo/query",
  "dojo/fx/easing",
  "dojo/dom-class",
  
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
  "dijit/form/ToggleButton",
  "dijit/form/ValidationTextBox",
  "dijit/layout/ContentPane",
  "dijit/form/ComboBox",
  "dijit/form/NumberSpinner",
  "dijit/Dialog",
  
  "dojox/form/CheckedMultiSelect",
  
  "../../kernel",
  "../../core/lang",
  "../../layers/FeatureLayer",
  "./AnalysisBase",
  "./_AnalysisOptions",
  "./utils",
  "./CreditEstimator",
  "./ExpressionForm",
  "../../geometry/Extent",
  "../../geometry/ScreenPoint",
  "../../symbols/CartographicLineSymbol",
  "../../symbols/SimpleMarkerSymbol",
  "../../symbols/SimpleLineSymbol",
  "../../symbols/SimpleFillSymbol",
  "../../tasks/support/Query",
  "../../renderers/support/jsonUtils",
  "dojo/i18n!../../nls/jsapi",
  "dojo/text!./templates/FindSimilarLocations.html"
], function(require, declare, lang, array, Color, connection, fx, has, string, domStyle, domAttr, domConstruct, query, easing, domClass, _WidgetBase,
  _TemplatedMixin, _WidgetsInTemplateMixin,  _OnDijitClickMixin, _FocusMixin, registry, Button, CheckBox, Form, Select, TextBox, ToggleButton, ValidationTextBox, ContentPane, 
  ComboBox, NumberSpinner, Dialog, CheckedMultiSelect, esriKernel, esriLang, FeatureLayer, AnalysisBase, _AnalysisOptions, AnalysisUtils, CreditEstimator, ExpressionForm, Extent,
  ScreenPoint, CartographicLineSymbol, SimpleMarkerSymbol, SimpleLineSymbol, SimpleFillSymbol, Query, rndJsonUtils, jsapiBundle, template) {
  var FindSimilarLocations = declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin,  _OnDijitClickMixin, _FocusMixin, _AnalysisOptions, AnalysisBase], {

    declaredClass: "esri.widgets.analysis.FindSimilarLocations",

    templateString: template,
    basePath: require.toUrl("."),
    widgetsInTemplate: true,
    
    i18n: null,
    returnProcessInfo: true,// make process Info to get analysis report
    
    toolName: "FindSimilarLocations",
    helpFileName: "FindSimilarLocations",
    resultParameter:"similarResultLayer",
    
    primaryActionButttonClass: "esriAnalysisSubmitButton",
    
    inputLayer: null,
    searchLayer: null,
    inputQuery: null,
    searchLayers: [],
    analysisFields: [],
    numberOfResults: 0,
    enableInputSelection: true,
    selectionLayer: null,
    _isAttrFlag: false,
   
    /************
     * Overrides
     ************/
    constructor: function(params){
      this._pbConnects = [];
      if (params.containerNode) {
        this.container = params.containerNode;
      }
      this._expression = null;
    },
    
    destroy: function(){
      this.inherited(arguments);
      array.forEach(this._pbConnects, connection.disconnect);
      delete this._pbConnects;
      delete this._mapClickHandle;
    },
    
    postMixInProperties: function(){
      this.inherited(arguments);
      lang.mixin(this.i18n, jsapiBundle.findSimilarLocations);
      lang.mixin(this.i18n, jsapiBundle.expressionGrid);
    },
    
    postCreate: function(){
      this.inherited(arguments);
      domClass.add(this._form.domNode, "esriSimpleForm");
      domStyle.set(this._attrSelect.selectNode, "width", "80%");
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
        this.emit("save", {"save": true});
      }
      this.emit("close", {"save": save}); //event
      if(this.selectionLayer) {
        this.selectionLayer.clearSelection();
        this.map.removeLayer(this.selectionLayer);
        this.selectionLayer = null;
      }
      if(this._mapClickHandle) {
        delete this._mapClickHandle;
      }
    },
    
    clear: function() {
      if(this.selectionLayer) {
        this.selectionLayer.clearSelection();
        this.map.removeLayer(this.selectionLayer);
        this.selectionLayer = null;
      }
      if(this._mapClickHandle) {
        delete this._mapClickHandle;
      }
    },
    
    _handleSaveBtnClick: function() {
      if(!this._form.validate()) {
        return;
      }
      this._saveBtn.set("disabled", true);
      var jobParams = {}, executeObj = {}, contextObj, descriptionStr;
      jobParams.inputLayer = JSON.stringify(AnalysisUtils.constructAnalysisInputLyrObj(this.inputLayer));
      if(this.get("InputQuery")) {
        jobParams.inputQuery = this.inputQuery;
      }
      jobParams.searchLayer = JSON.stringify(AnalysisUtils.constructAnalysisInputLyrObj(this.get("searchLayer")));
      jobParams.analysisFields = this.get("analysisFields");
      jobParams.numberOfResults = this.get("numberOfResults");
      //outputLayer
      if(!this.returnFeatureCollection) {
        jobParams.OutputName = JSON.stringify({
          serviceProperties : {
            name: this._outputLayerInput.get("value")
          }
        });
      }      
      if(this.showChooseExtent) {
        if(this._useExtentCheck.get("checked")) {
          jobParams.context = JSON.stringify({
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
        "description" : descriptionStr,
        "tags": string.substitute(this.i18n.itemTags, {analysisLayerName: this.inputLayer.name}),
        "snippet": this.i18n.itemSnippet
      };
      if(this.showSelectFolder) {
        executeObj.itemParams.folder = this.get("folderId");
      }
      jobParams.returnProcessInfo = this.returnProcessInfo;
      //console.log(executeObj);
      this.execute(executeObj);
  
    },
   
    
    _handleShowCreditsClick: function(e) {
      e.preventDefault();
      var jobParams = {}, contextObj;
      if(!this._form.validate()) {
        //domStyle.set(this._showCreditsLink, "color", "grey");
        //domStyle.set(this._showCreditsLink, "cursor", "default");
        return;
      }
      //domStyle.set(this._showCreditsLink, "color", "");
      //domStyle.set(this._showCreditsLink, "cursor", "");
      jobParams.inputLayer = JSON.stringify(AnalysisUtils.constructAnalysisInputLyrObj(this.inputLayer));
      if(this.get("InputQuery")) {
        jobParams.inputQuery = this.inputQuery;
      }
      jobParams.searchLayer = JSON.stringify(AnalysisUtils.constructAnalysisInputLyrObj(this.get("searchLayer")));
      jobParams.analysisFields = this.get("analysisFields");
      jobParams.numberOfResults = this.get("numberOfResults");

      if(!this.returnFeatureCollection) {
        jobParams.OutputName = JSON.stringify({
          serviceProperties : {
            name: this._outputLayerInput.get("value")
          }
        });
      }      
      if(this.showChooseExtent) {
        if(this._useExtentCheck.get("checked")) {
          jobParams.context = JSON.stringify({
            extent: this.map.extent._normalize(true)
          });
        }
      }
      if(this.returnFeatureCollection) {
         contextObj = {
           outSR: this.map.spatialReference
         };
         if(this.showChooseExtent) {
           contextObj.extent = this.map.extent._normalize(true);
         }
         jobParams.context = JSON.stringify(contextObj);
      }
      //console.log(jobParams);
      this.getCreditsEstimate(this.toolName, jobParams).then(lang.hitch(this, function(result){
        this._usageForm.set("content", result);
        this._usageDialog.show();
      }));
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
      this.signInPromise.then(lang.hitch(this, AnalysisUtils.initHelpLinks, this.domNode, this.showHelp, {analysisGpServer: this.analysisGpServer}));
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
      domStyle.set(this._showCreditsLink, "display", this.showCredits === true? "block" : "none");
      if(this.searchLayers) {
        array.forEach(this.searchLayers, function(layer, index) {
          this._candidateSelect.addOption({
            value:index + 1,
            label:layer.name
          });
        }, this);  
      }
      AnalysisUtils.addReadyToUseLayerOption(this, [this._analysisSelect, this._candidateSelect]);          
      this._selectBtn.set("disabled", !this.enableInputSelection);
      this._queryBtn.set("disabled", !this.enableInputSelection);
      if(this.inputLayer) {
        this._updateAnalysisLayerUI(override);
      }
      this._expressionForm.on("add-expression", lang.hitch(this, this._handleExpressionFormAdd));
      this._expressionForm.on("cancel-expression", lang.hitch(this, this._handleExpressionFormCancel));
    },
    
    _updateAnalysisLayerUI: function(override) {
      domAttr.set(this._toolDescription, "innerHTML", string.substitute(this.i18n.toolDefine, {layername: this.inputLayer.name}));
      this.set("selectionLayer");
      this.set("analysisFields");
      if(override) {
        this.outputLayerName = string.substitute(this.i18n.outputLayerName, {analysisLayerName: this.inputLayer.name});
      }
      this._outputLayerInput.set("value", this.outputLayerName);
      this._expressionForm.set("showFirstRow", false);
      this._expressionForm.set("firstOperands", [this.inputLayer]);
      this._expressionForm.set("inputOperands", [this.inputLayer]);
      this._expressionForm.set("selectedFirstOperand", this.inputLayer);
      this._expressionForm.init();
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
        if(this.inputLayer.analysisReady) {
          this.inputLayer.id = this.inputLayer.id + "";
        }
        if(this.selectionLayer) {
          this.clear();
          this.set("inputQuery", null);
          this._expression = null;
          domAttr.set(this._filterLabel, "innerHTML", "");
        }
        this._updateAnalysisLayerUI(true);
      }
    },
    
    _handleBrowseItemsSelect: function(value) {
      if(value && value.selection) {
        AnalysisUtils.addAnalysisReadyLayer({
          item: value.selection,
          layers:  this._isAnalysisSelect? this.inputLayers : this.searchLayers,
          layersSelect: this._isAnalysisSelect? this._analysisSelect : this._candidateSelect,
          browseDialog: this._browsedlg
        }).always(lang.hitch(this, function() {
          this._handleAnalysisLayerChange(this._analysisSelect.get(value));
        }));
      }
    },    
    
    _loadConnections: function(){
      this.on("start", lang.hitch(this, "_onClose", true));
      this._connect(this._closeBtn, "onclick", lang.hitch(this, "_onClose", false));
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
    
    _setDisableRunAnalysisAttr: function(value){
      this._saveBtn.set("disabled", value);
    },

    _setSearchLayersAttr: function(lyrArray) {
      /*lyrArray = array.filter(lyrArray, function(lyr){
        //AnalysisUtils.getLayerFeatureCount(lyr)
        return (lyr.graphics && lyr.graphics.length > 1) ;
      }, this);*/
      this.searchLayers = lyrArray;
    },
    
    _getSearchLayersAttr: function() {
      return this.searchLayers;
    },    
    
    _setSearchLayerAttr: function(lyr) {
      this.searchLayers = lyr;
    },
    
    _getSearchLayerAttr: function() {
      if(this._candidateSelect && this._candidateSelect.get("value") !== "-1") {
        this.searchLayer = this.searchLayers[this._candidateSelect.get("value") - 1];
      }
      else if(this._candidateSelect.get("value") === "-1"){
        this.searchLayer = null;
      }
      return this.searchLayer;
    },    
    
    _setInputLayerAttr: function(layer) {
      this.inputLayer = layer;
      //this.set("enableInputSelection", layer.graphics && layer.graphics.length > 1);
    },

    _getInputLayerAttr: function() {
      return this.inputLayer;
    },
    
    _setInputLayersAttr: function(layers) {
      this.inputLayers = layers;
    },

    _setEnableInputSelectionAttr: function(val) {
      this.enableInputSelection = val;
    },
    
    _getEnableInputSelectionAttr: function() {
      return this.enableInputSelection;
    },
    
    _setAnalysisFieldsAttr: function() {
      var srchFldNames, fields;
      if (!this.get("inputLayer") || !this.get("searchLayer")) {
        return;
      }
      if (this.inputLayer.fields.length === 0 || this.searchLayer.fields.length === 0) {
        return;
      }
      fields = this.inputLayer.fields;
      srchFldNames = array.map(this.searchLayer.fields, function(sField){
        return sField.name;
      });
      fields = array.filter(fields, function(field) {
        if(array.indexOf(srchFldNames, field.name) !== -1 && array.indexOf(["esriFieldTypeSmallInteger", "esriFieldTypeInteger", "esriFieldTypeSingle", "esriFieldTypeDouble"], field.type) !== -1 ) {
          if(field.name !== this.inputLayer.objectIdField || field.name !== this.searchLayer.objectIdField) {
            return true;
          }
        }
      }, this);
      fields = array.map(fields, function(field){
        return {value:field.name, label:esriLang.isDefined(field.alias) && field.alias !== ""? field.alias : field.name};
      });
      if(this._attrSelect) {
        this._attrSelect.removeOption(this._attrSelect.get("options"));
        this._attrSelect.addOption(fields);
      }
      this.analysisFields = fields;
    },
    
    _getAnalysisFieldsAttr: function() {
      if(this._attrSelect) {
        this.analysisFields = this._attrSelect.get("value");
      }
      return this.analysisFields;
    },
    
    _setInputQueryAttr: function(query) {
      this.inputQuery = query;
    }, 
    
    _getInputQueryAttr: function() {
      return this.inputQuery;
    },
    
    _setNumberOfResultsAttr: function(value) {
      this.numberOfResults = value;
    },
    
    _getNumberOfResultsAttr: function() {
      return this.numberOfResults;
    },
    
    _getInputQueryObjAttr: function() {
      var exp = null;
      if(this.get("InputQuery")) {
        exp = {};
        exp.operator = "";
        exp.layer = 0;
        exp.where = this.inputQuery;
      }
      this.inputQueryObj = exp;
      return this.inputQueryObj;
    },
    
    _setSelectionLayerAttr: function() {
      // create selection only FL; so that we don't loose the original symbol when selecting features
      this.selectionLayer = new FeatureLayer((this.inputLayer.url && !this.inputLayer._collection? this.inputLayer.url : this.inputLayer.toJSON()), {
        outFields: ["*"],
        mode: this.inputLayer.url && !this.inputLayer._collection? FeatureLayer.MODE_SELECTION : FeatureLayer.MODE_SNAPSHOT//,
        //resourceInfo: mapLayer.serviceInfo
      });
      // Always set the selection Layer renderer to null  
      // The case when the mode is snapshot like KML feature collection will show the renderer, same inputlayer grpahics is shown
      this.selectionLayer.setRenderer(null); 
      this.selectionLayer.on("selection-complete", lang.hitch(this, this._handleInputLayerSelectionComplete));
      if (this.selectionLayer.loaded) {
        this._onSelectionLayerLoad(this.inputLayer, this.selectionLayer);
      }
      else {
        this.selectionLayer.on("load", lang.hitch(this, this._onSelectionLayerLoad, this.inputLayer, this.selectionLayer));
      }      
    },
    
    _onSelectionLayerLoad: function(mapLayer, newLayer){
      // maybe we have renderer updates
      // there is no onRendererChange event; the renderer only gets updated when the table opens new
      var symbol;
      if (mapLayer.renderer) {
        // not IS
        newLayer.setRenderer(rndJsonUtils.fromJSON(mapLayer.renderer.toJSON()));
        if (esriLang.isDefined(mapLayer.renderer.isMaxInclusive)) {
          newLayer.renderer.isMaxInclusive = mapLayer.renderer.isMaxInclusive;
        }
      }
      newLayer.setScaleRange(mapLayer.minScale, mapLayer.maxScale);
      
      this._connect(mapLayer, "onScaleRangeChange", lang.hitch(this, function(newLayer, inputLayer){
        newLayer.setScaleRange(inputLayer.minScale, inputLayer.maxScale);
      }, newLayer, mapLayer));
      this.map.addLayer(newLayer);
      
      if(newLayer.geometryType === "esriGeometryPoint" || newLayer.geometryType === "esriGeometryMultPoint") {
        symbol = new SimpleMarkerSymbol(); 
        symbol.setStyle(SimpleMarkerSymbol.STYLE_TARGET);
        symbol._setDim(16, 16, 0);
        symbol.setOutline(new CartographicLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([0, 255, 255]), 2, CartographicLineSymbol.CAP_ROUND, CartographicLineSymbol.JOIN_ROUND));
        symbol.setColor(new Color([0, 0, 0, 0]));
        newLayer.setSelectionSymbol(symbol);
      }
      else if (newLayer.geometryType === "esriGeometryPolyline") {
        newLayer.setSelectionSymbol(new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([0, 255, 255]), 2));
      }
      else if (newLayer.geometryType === "esriGeometryPolygon") {
        newLayer.setSelectionSymbol(new SimpleFillSymbol(SimpleFillSymbol.STYLE_NULL, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([0, 255, 255]), 2), new Color([0, 0, 0, 0])));
      }
    },
            
        
    validateServiceName: function(value) {
      return AnalysisUtils.validateServiceName(value, {textInput: this._outputLayerInput});
    },
    
    _setPrimaryActionButttonClassAttr: function(str) {
      this.primaryActionButttonClass = str;
    },
    
    _getPrimaryActionButttonClassAttr: function() {
      return this.primaryActionButttonClass;
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
    
    ////////////////////////////
    // Helpers
    ////////////////////////////
    _connect: function(node, evt, func){
      this._pbConnects.push(connection.connect(node, evt, func));
    },
    
    validate: function() {
      if(this.get("searchLayer") && (this.get("inputLayer").id === this.get("searchLayer").id) && !this.get("inputQuery")) {
        this._showMessages(this.i18n.reqSelectionMsg);
        this.set("disableRunAnalysis",true);
      }
      else if(this.get("searchLayer") && this._attrSelect.getOptions().length === 0) {
        this._showMessages(this.i18n.noFieldMatchMsg);
        this.set("disableRunAnalysis",true);
      }
      else {
        this._handleCloseMsg();
        this.set("disableRunAnalysis",false);
      }      
    },
    
    _handleCandidateChange: function(value) {
      if(value === "browse") {
        if(!this._analysisquery) {
          this._analysisquery = this._browsedlg.browseItems.get("query");
        }
        this._browsedlg.browseItems.set("query", this._analysisquery);
        this._isAnalysisSelect = false;
        this._browsedlg.show();
      }
      else {
        this.set("analysisFields");
        this.validate();
      }
    },
    
    _handleQueryButtonClick: function() {
      this._expDialog.set("title", this.i18n.query);
      this._selectBtn.set("checked", false);
      this._isAttrFlag = true;
      if(!this._expression) {
        this._expressionForm.set("action", "add");
        //this._expressionForm.clear();
      }
      else {
        //edit experience only attribute inputQuery 
        this._expressionForm.set("action", "edit");
        //this._expressionForm.clear();
        this._expressionForm.set("expression", this._expression.expression);
      }   
      this._expDialog.show();
    },

    _handleExpressionFormAdd: function(expObj) {
      //console.log("Success", expObj);
      if(this.selectionLayer) {
        this.selectionLayer.clearSelection();
      }
      if(expObj.action === "add" || expObj.action === "edit"){
        domAttr.set(this._filterLabel, "innerHTML", string.trim(expObj.expression._attributeText));
        this._expression = expObj;
        var qry;
        // highlight features in map
        qry = new Query();
        qry.returnGeometry = true;
        qry.where = expObj.expression.where;
        this.selectionLayer.selectFeatures(qry, FeatureLayer.SELECTION_ADD);
      }
      this._expDialog.hide();
      this.set("inputQuery", expObj.expression.where);
      this.validate();
      
    },
    
    _handleExpressionFormCancel: function() {
      this._expDialog.hide();
    },
    
    _handleTopRankRadioChange: function(value) {
      this._ranksInput.set("disabled", !value);
      if(value) {
        this.set("numberOfResults", this._ranksInput.get("value"));
      }
    },
    
    _handleAllRankRadioChange: function(value) {
      if(value) {
        this.set("numberOfResults", 0);
      }
    },
    
    _handleTopRankInputChange: function(value) {
      this.set("numberOfResults", value);
    },
    
    _handleSelectionButtonClick: function(value) {
      //console.log("selection clicked");
      if(value && !this._mapClickHandle) {
        this._mapClickHandle = this.map.on("click", lang.hitch(this, this._handleMapClick));
        this.emit("selecttool-activate", {});
        this._isAttrFlag = false;
      }
      else {
        this._mapClickHandle.remove();
        this._mapClickHandle = null;
        this.emit("selecttool-deactivate", {});
      }
    },
    
    _handleMapClick: function(evt) {
      // selection feature size
      var screenPoint, tolerance, bottomLeft, topRight, extent, query, renderer, symbol;
      //clear the selection added by attribute query 
      if(!this._isAttrFlag && this._expression) {
        this.selectionLayer.clearSelection();
      }

      /*// there are issue with changing the size depending on the graphic size, like the popup.
      // 1. user can select many features of different sizes via the table. 
      // 2. a popup might still be open and then the user selects another record in the table of a feature with a much bigger graphic
      // after a map click one feature gets selected. In this case we can make the target symbol as big as the selection symbol set by the popup. 
      if (info.fLayer.geometryType === 'esriGeometryPoint' && info.fLayer.getSelectionSymbol()) {
        if (clickedGraphic) {
          var symbol = info.fLayer._getSymbol(clickedGraphic);
          if (symbol) {
            switch(symbol.type) {
              case "simplemarkersymbol":
                info.fLayer.getSelectionSymbol()._setDim((symbol.size||0)+1, (symbol.size||0)+1, 7);
                break;
              case "picturemarkersymbol":
                info.fLayer.getSelectionSymbol()._setDim((symbol.width||0)+1, (symbol.height||0)+1, 7);
                break;
            }
          }
        } else {
          info.fLayer.getSelectionSymbol()._setDim(16, 16, 7);
        }
      }*/
      tolerance = 6;
      renderer = this.inputLayer.renderer;
      if (renderer && renderer.declaredClass === "esri.renderer.SimpleRenderer") {
        symbol = renderer.symbol;
        if (symbol.xoffset) {
          tolerance = Math.max(tolerance, Math.abs(symbol.xoffset));
        }
        if (symbol.yoffset) {
          tolerance = Math.max(tolerance, Math.abs(symbol.yoffset));
        }
      } else if (renderer && (renderer.declaredClass === "esri.renderer.UniqueValueRenderer" || renderer.declaredClass === "esri.renderer.ClassBreaksRenderer")) {
        array.forEach(renderer.infos, function(info){
          symbol = info.symbol;
          if (symbol.xoffset) {
            tolerance = Math.max(tolerance, Math.abs(symbol.xoffset));
          }
          if (symbol.yoffset) {
            tolerance = Math.max(tolerance, Math.abs(symbol.yoffset));
          }
        });
      }
      // Calculate the query extent
      screenPoint = evt.screenPoint;
      bottomLeft = this.map.toMap(new ScreenPoint(screenPoint.x - tolerance, screenPoint.y + tolerance)); 
      topRight = this.map.toMap(new ScreenPoint(screenPoint.x + tolerance, screenPoint.y - tolerance)); 
      extent = new Extent(bottomLeft.x, bottomLeft.y, topRight.x, topRight.y, this.map.spatialReference);
      query = new Query();
      query.returnGeometry = true;
      query.geometry = extent;
      query.where = this.inputLayer.getDefinitionExpression();
      //query.timeExtent = esri.arcgisonline.map.main.map.timeExtent;
      
      this.inputLayer.queryFeatures(query).then(lang.hitch(this, function(result) {
        //console.log(result);
        if(!result) {
          return;
        }
        // select features in the FL
        var selectIds, qry, selectedIds, unselectIds;
        unselectIds = [];
        selectIds = []; 
        if(this.selectionLayer.getSelectedFeatures().length > 0) {
          selectedIds = array.map(this.selectionLayer.getSelectedFeatures(), function(gr) {
            return gr.attributes[this.selectionLayer.objectIdField];
          }, this);
        }
        array.forEach(result.features, function(feature){
          if(!selectedIds) {
            selectIds.push(feature.attributes[this.selectionLayer.objectIdField]);
          }
          else if(selectedIds && (array.indexOf(selectedIds, feature.attributes[this.selectionLayer.objectIdField]) === -1)){
            selectIds.push(feature.attributes[this.selectionLayer.objectIdField]);
          }
          else {
            unselectIds.push(feature.attributes[this.selectionLayer.objectIdField]);
          }
        }, this);
        //console.log(selectIds);
        //console.log(unselectIds);
        if (selectIds.length > 0) {
          // highlight features in map
          qry = new Query();
          qry.returnGeometry = true;
          qry.objectIds = selectIds;
          //console.log(selectIds);
          this.selectionLayer.selectFeatures(qry, FeatureLayer.SELECTION_ADD);
        }
        if (unselectIds.length > 0 ) {
          // unhighlight features in map
          qry = new Query();
          qry.returnGeometry = true;
          qry.objectIds = unselectIds;
          //console.log(unselectIds);
          this.selectionLayer.selectFeatures(qry, FeatureLayer.SELECTION_SUBTRACT);
        }
         
      }));
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
    },
    
    _handleInputLayerSelectionComplete: function(features) {
      //console.log(features);
      var selected = this.selectionLayer.getSelectedFeatures(), ids, str;
      if(!this._isAttrFlag && selected.length > 0 ) {
        str = "";  
        ids = array.map(selected, function(feature){
          str += this.selectionLayer.objectIdField + " = " + feature.attributes[this.selectionLayer.objectIdField] + " OR ";
          return feature.attributes[this.selectionLayer.objectIdField];
         }, this);
         //console.log(str);
         str = str.substring(0, str.lastIndexOf(" OR "));
         //console.log(str);
         //console.log(ids);
         domAttr.set(this._filterLabel, "innerHTML", string.substitute(this.i18n.selectedFeaturesLabel, {total: selected.length}));
         this.set("inputQuery", str);
         this._expression = null;
         this.validate();
      }
      if(!this._isAttrFlag && selected.length === 0 ) {
         domAttr.set(this._filterLabel, "innerHTML", "");
         this.set("inputQuery", null);
         this._expression = null;
         this.validate();
      }
    }
  });
  
  return FindSimilarLocations;  
  
});

  


