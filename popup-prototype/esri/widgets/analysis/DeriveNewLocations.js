/******************************************
  esri/widgets/analysis/DeriveNewLocations
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
  
  "../../kernel",
  "../../core/lang",
  "./AnalysisBase",
  "./utils",
  "./CreditEstimator",
  "./ExpressionGrid",
  "dojo/i18n!../../nls/jsapi",
  "dojo/text!./templates/DeriveNewLocations.html"
], function(require, declare, lang, array, connection, has, string, domStyle, domAttr, domConstruct, query, domClass, _WidgetBase,
   _TemplatedMixin, _WidgetsInTemplateMixin,  _OnDijitClickMixin, _FocusMixin, registry, Button, CheckBox, Form, Select, TextBox, ValidationTextBox, ContentPane, ComboBox, Dialog, esriKernel, esriLang, AnalysisBase, AnalysisUtils, CreditEstimator, ExpressionGrid, jsapiBundle, template) {
  var DeriveNewLocations = declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin,  _OnDijitClickMixin, _FocusMixin, AnalysisBase], {

    declaredClass: "esri.widgets.analysis.DeriveNewLocations",

    templateString: template,
    basePath: require.toUrl("."),
    widgetsInTemplate: true,
    
    i18n: null,
    
    toolName: "DeriveNewLocations",
    helpFileName: "DeriveNewLocations",
    resultParameter:"resultLayer",
    primaryActionButttonClass: "esriAnalysisSubmitButton",
   
    analysisLayer: null,
    inputLayers: [],
   
    /************
     * Overrides
     ************/
    constructor: function(params){
      this._pbConnects = [];
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
      lang.mixin(this.i18n, jsapiBundle.deriveNewLocations);
      lang.mixin(this.i18n, jsapiBundle.expressionGrid);
    },
    
    postCreate: function(){
      this.inherited(arguments);
      domClass.add(this._form.domNode, "esriSimpleForm");
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
    },
    
    _handleSaveBtnClick: function() {
      //console.log("Call Success Submit Job");
      //construct job params object
      if(!this._form.validate() || !this.expressionGrid.validate()) {
        return;
      }
      this._saveBtn.set("disabled", true);
      //this._saveBtn.set("label", "In Dev Press F12 for LOG");
      var jobParams = {}, executeObj = {}, contextObj, expMap, inputLayers, descriptionStr;
      expMap =  this.expressionGrid.get("expressionMap");
      jobParams.expressions = JSON.stringify(expMap.expressions);
      //console.log(JSON.stringify(expMap.expressions));
      inputLayers = [];
      inputLayers = array.map(expMap.inputLayers, function(layer) {
        return JSON.stringify(AnalysisUtils.constructAnalysisInputLyrObj(layer));
      }, this);
      jobParams.inputLayers = inputLayers;
      //console.log(array.map(expMap.inputLayers, function(item){return item.name;}));
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
      //jobParams.returnFeatureCollection = this.returnFeatureCollection;      
      console.log(jobParams);
      executeObj.jobParams  = jobParams;
      //console.log(this._webMapFolderSelect.get("value"));
      //construct the item params object for the ouput fetaure service item 
      //console.log(polyLayer);
      //polyLayer.name changed here  polyLayer.layer["name"] in viewer the web map name can be passed through
      descriptionStr = this.i18n.itemDescription;
      descriptionStr += "<div><i><u>" + this.i18n.expression + "</u> "+ expMap.expressionString + "</i></div>";
      executeObj.itemParams = { 
        "description" : descriptionStr,
        "tags": string.substitute(this.i18n.itemTags, {analysisLayerName: this.analysisLayer.name}),
        "snippet": this.i18n.itemSnippet
      };
      if(this.showSelectFolder) {
        executeObj.itemParams.folder = this.get("folderId");
      }
      
      //console.log(executeObj.itemParams);
      console.log(executeObj);
      //AnalysisBase submit method
      this.execute(executeObj);
  
    },
   
    
    _handleShowCreditsClick: function(e) {
      e.preventDefault();
      var jobParams = {}, expMap, inputLayers;
      if(!this._form.validate() || !this.expressionGrid.validate()) {
        //cursor: default;color:grey
        //domClass.add(this._showCreditsLink, "esriAnalysisLinkDisabled");
        domStyle.set(this._showCreditsLink, "color", "grey");
        domStyle.set(this._showCreditsLink, "cursor", "default");
        return;
      }
      /*if(domClass.contains("esriAnalysisLinkDisabled")) {
        domClass.remove(this._showCreditsLink, "esriAnalysisLinkDisabled");
      }*/
      domStyle.set(this._showCreditsLink, "color", "");
      domStyle.set(this._showCreditsLink, "cursor", "");
      expMap =  this.expressionGrid.get("expressionMap");
      jobParams.expressions = JSON.stringify(expMap.expressions);
      //console.log(JSON.stringify(expMap.expressions));
      inputLayers = [];
      inputLayers = array.map(expMap.inputLayers, function(layer) {
        return AnalysisUtils.constructAnalysisInputLyrObj(layer);
      }, this);
      jobParams.inputLayers = JSON.stringify(inputLayers);
      
      if(this.showChooseExtent) {
        //console.log("showextent ux", this.showChooseExtent);
        //console.log(this._useExtentCheck.get("checked"));
        if(this._useExtentCheck.get("checked")) {
          jobParams.Context = JSON.stringify({
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
    
    _save: function() {},
    /*******************
     * UI Methods
     *******************/
    _buildUI: function(){
      //console.log("buildUI");
      //console.log(this.outputLayerName);
      var override = true;
      this.signInPromise.then(lang.hitch(this, AnalysisUtils.initHelpLinks, this.domNode, this.showHelp, {analysisGpServer: this.analysisGpServer}));
      //AnalysisUtils.initHelpLinks(this.domNode, this.showHelp);
      
      //construct the UI 
      if(this.get("showSelectAnalysisLayer")) {
        if(!this.get("analysisLayer") && this.get("analysisLayers")) {
          this.set("analysisLayer", this.analysisLayers[0]);
        }
        AnalysisUtils.populateAnalysisLayers(this, "analysisLayer", "analysisLayers");
      }        
      if(this.outputLayerName) {
        this._outputLayerInput.set("value", this.outputLayerName);
        override = false;
      }
      this._updateAnalysisLayerUI(override);     
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
      this._loadConnections();
    },
    
    _updateAnalysisLayerUI: function(override) {
      if(this.analysisLayer) {
        if(override) {
          this.outputLayerName = string.substitute(this.i18n.outputLayerName, {analysisLayerName: this.analysisLayer.name});
        }
        this._outputLayerInput.set("value", this.outputLayerName);       
        if(this.expressionGrid) {
          this.expressionGrid.destroy();
          this.expressionGrid = null;
        }
        this.expressionGrid = new ExpressionGrid({
          analysisLayer: this.analysisLayer,
          inputLayers: this.inputLayers,
          allowAllInputOperands: true,
          primaryActionButttonClass: this.get("primaryActionButttonClass"),
          showReadyToUseLayers: this.get("showReadyToUseLayers")
        }, domConstruct.create("div",{style:"width:100%;"},this._expressionGridTd));
        this.expressionGrid.on("update-expressions", lang.hitch(this, this._handleUpdateExpressions));// to notify to the tool using it
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
        this.analysisLayer = this.analysisLayers[value];
        this._updateAnalysisLayerUI(true);
      }
    },
    
    _handleBrowseItemsSelect: function(value) {
      if(value && value.selection) {
        AnalysisUtils.addAnalysisReadyLayer({
          item: value.selection,
          layers:  this._isAnalysisSelect? this.analysisLayers : this.inputLayers,
          layersSelect: this._isAnalysisSelect? this._analysisSelect : this._layersSelect,
          browseDialog: this._browsedlg
        }).always(lang.hitch(this, this._updateAnalysisLayerUI, true));
      }
    },    
    
    _loadConnections: function(){
      this.on("start", lang.hitch(this, "_onClose", true));
      this._connect(this._closeBtn, "onclick", lang.hitch(this, "_onClose", false));
      if(this.showReadyToUseLayers && this._browsedlg) {
          this.own(this._browsedlg.browseItems.on("select-change", lang.hitch(this, this._handleBrowseItemsSelect)));
      }      
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

    _setInputLayersAttr: function(lyrArray) {
      //console.log(this.inputLayers);
      this.inputLayers = lyrArray;
    },
    
    _getInputLayersAttr: function() {
      /*this.inputLayers = array.map(this._inputLayersSelect.get("value"), function(value){
        return this.featureLayers[parseInt(value, 10)];
      }, this);*/
      return this.inputLayers;
    },    
    
    
    _setAnalysisLayerAttr: function(layer) {
      this.analysisLayer = layer;
    },

    _getAnalysisLayerAttr: function() {
      return this.analysisLayer;
    },
    
    _setAnalysisLayersAttr: function(layers) {
      this.analysisLayers = layers;
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
    }
    
  });
  
  return DeriveNewLocations;  
  
});

  


