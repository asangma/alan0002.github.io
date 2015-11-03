/******************************************
esri/widgets/analysis/EnrichLayer
inputLayer, feature layer (Can be point or polygon)
country, String  [US, Canada, Global]
dataCollections, Multivalue String 
bufferType, String choicelist ( StraightLine, DrivingTime)
 if inputLayer is polygon, bufferType will be disabled.
distance,  Double 
units, String:
 if bufferType is StraightLine or Driving Distance: Meters, Kilometers, Feet, Yards, Miles
 if bufferType is DrivingTime: Seconds, Minutes, Hours
outputName, String
context, String
enrichedLayer, feature layer
*/
define(
[ 
  "require",
  "dojo/aspect",
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
  "dojo/number",
  "dojo/on",
  "dojo/Evented",
  "dojo/store/Observable",
  "dojo/dom-geometry",
  "dojo/store/Memory",
  "dojo/window", // winUtils.scrollIntoView
    
  "dijit/_WidgetBase",
  "dijit/_TemplatedMixin",
  "dijit/_WidgetsInTemplateMixin",
  "dijit/_OnDijitClickMixin",
  "dijit/_FocusMixin",
  "dijit/registry",
  "dijit/form/Button",
  "dijit/form/CheckBox",
  "dijit/form/Form",
  "dijit/form/FilteringSelect",
  "dijit/form/Select",
  "dijit/form/TextBox",
  "dijit/form/ValidationTextBox",
  "dijit/layout/ContentPane",
  "dijit/form/ComboBox",
  "dijit/Dialog",

  "dgrid/List",
    
  "../../kernel",
  "../../core/lang",
  "./AnalysisBase",
  "./_AnalysisOptions",
  "./CreditEstimator",
  "./utils",
  "./TrafficTime",
  "../geoenrichment/config",
  "../geoenrichment/DataBrowser",
  "../../tasks/geoenrichment/GeoenrichmentTask",
  "dojo/i18n!../../nls/jsapi",
  "dojo/text!./templates/EnrichLayer.html"
], function(require, aspect, declare, lang, array, connection, fx, has, string, domStyle, domAttr, domConstruct, query, domClass, easing, number, on, Evented, Observable, domGeom, Memory, winUtils, _WidgetBase,
   _TemplatedMixin, _WidgetsInTemplateMixin,  _OnDijitClickMixin, _FocusMixin, registry, Button, CheckBox, Form, FilteringSelect, Select, TextBox, ValidationTextBox, ContentPane,  ComboBox, Dialog,
   List, esriKernel, esriLang, AnalysisBase, _AnalysisOptions, CreditEstimator, AnalysisUtils, TrafficTime, geoenrichConfig, DataBrowser, GeoenrichmentTask, jsapiBundle, template) {
  var EnrichLayer;
  
  EnrichLayer = declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin,  _OnDijitClickMixin, _FocusMixin, AnalysisBase, _AnalysisOptions], {

    declaredClass: "esri.widgets.analysis.EnrichLayer",

    templateString: template,
    basePath: require.toUrl("."),
    widgetsInTemplate: true,
    
    //attributes for constructing the Tool, the names matches the REST service property names
    // used in setting up the UI and during re run to construct the UI
    inputLayer: null, // layer analyzed
    outputLayerName: null,
    distance: null,
    enableTravelModes: true,
    showTrafficWidget: false,
    _isBufferSelectionEnabled: true,
    analysisVariables: null,

    i18n: null,
    
    toolName: "EnrichLayer",
    helpFileName: "EnrichLayer",
    resultParameter:"enrichedLayer",

    /************
     * Overrides
     ************/
    constructor: function(params){
      this._pbConnects = [];
      this._statsRows = [];
      this._isLineEnabled =  false;
      if (params.containerNode) {
        this.container = params.containerNode;
      }
    },
    
    destroy: function(){
      this.inherited(arguments);
      array.forEach(this._pbConnects, connection.disconnect);
      delete this._pbConnects;
      if(this._driveTimeClickHandle) {
        connection.disconnect(this._driveTimeClickHandle);
        this._driveTimeClickHandle = null;
      }
    },
    
    postMixInProperties: function(){
      this.inherited(arguments);
      lang.mixin(this.i18n, jsapiBundle.bufferTool);
      lang.mixin(this.i18n, jsapiBundle.driveTimes);
      lang.mixin(this.i18n, jsapiBundle.enrichLayerTool);
    },
    
    postCreate: function(){
      this.inherited(arguments);
      domClass.add(this._form.domNode, "esriSimpleForm");
      this._distanceInput.set("validator", lang.hitch(this, this.validateDistance));
      this._outputLayerInput.set("validator", lang.hitch(this, this.validateServiceName));
      this._buildUI();
      this.watch("analysisVariables", lang.hitch(this, this._refreshGrid));
    },
    

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
      if(!this._form.validate() || !this.validateSelectedGrid()) {
        return;
      }
      var jobParams = {}, allAnalysisVariables, dataCollections, analysisVariables;
      allAnalysisVariables = this.get("analysisVariables");
      analysisVariables = [];
      dataCollections = [];
      array.forEach(allAnalysisVariables, function(variable){
        if(variable.indexOf(".*") !== -1) {
          dataCollections.push(variable.split(".*")[0]);
        }
        else {
          analysisVariables.push(variable);
        }
      });
      //console.log(dataCollections);
      //console.log(analysisVariables);
      jobParams.inputLayer = JSON.stringify(AnalysisUtils.constructAnalysisInputLyrObj(this.inputLayer));
      if(this._isBufferSelectionEnabled || this._isLineEnabled) {
        jobParams.bufferType = this.get("bufferType");
        jobParams.distance = this.get("distance");
        jobParams.units = this._distanceUnitsSelect.get("value");
      }
      if(this.get("country")) {
        jobParams.country = this.get("country");  
      }
      if(dataCollections && dataCollections.length > 0) {
        jobParams.dataCollections =  JSON.stringify(dataCollections);
      } 
      if(analysisVariables && analysisVariables.length > 0) {
        jobParams.analysisVariables =  JSON.stringify(analysisVariables);
      }       
      if(this.get("showTrafficWidget") && this._trafficTimeWidget.get("checked")) {
        jobParams.TimeOfDay = this._trafficTimeWidget.get("timeOfDay");
        //console.log(jobParams.TimeOfDay);
      } 
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
      //console.log(jobParams);
      this.getCreditsEstimate(this.toolName, jobParams).then(lang.hitch(this, function(result){
        //cost: 2.12, Total records: 2120
        this._usageForm.set("content", result);
        this._usageDialog.show();
      }));      
    },

    
    _handleSaveBtnClick: function() {
      //console.log("Call Success Submit Job");
      //construct job params object
      if(!this._form.validate() || !this.validateSelectedGrid()) {
        return;
      }
      var jobParams = {}, executeObj = {}, contextObj, allAnalysisVariables, dataCollections, analysisVariables;
      this._saveBtn.set("disabled", true);
      allAnalysisVariables = this.get("analysisVariables");
      analysisVariables = [];
      dataCollections = [];
      array.forEach(allAnalysisVariables, function(variable){
        if(variable.indexOf(".*") !== -1) {
          dataCollections.push(variable.split(".*")[0]);
        }
        else {
          analysisVariables.push(variable);
        }
      });
      //console.log(dataCollections);
      //console.log(analysisVariables);
      jobParams.inputLayer = JSON.stringify(AnalysisUtils.constructAnalysisInputLyrObj(this.inputLayer));
      
      if(this._isBufferSelectionEnabled || this._isLineEnabled) {
        jobParams.bufferType = this.get("bufferType");
        jobParams.distance = this.get("distance");
        jobParams.units = this._distanceUnitsSelect.get("value");
      }
      if(this.get("country")) {
        jobParams.country = this.get("country");  
      }
      if(dataCollections && dataCollections.length > 0) {
        jobParams.dataCollections = dataCollections;
      } 
      if(analysisVariables && analysisVariables.length > 0) {
        jobParams.analysisVariables = analysisVariables;
      } 
       
      
      if(this.get("showTrafficWidget") && this._trafficTimeWidget.get("checked")) {
        jobParams.TimeOfDay = this._trafficTimeWidget.get("timeOfDay");
        //console.log(jobParams.TimeOfDay);
      } 
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
      this._saveBtn.set("disabled", false);
      //construct the item params object for the ouput fetaure service item 
      //console.log(polyLayer);
      //polyLayer.name changed here  polyLayer.layer["name"] in viewer the web map name can be passed through
      executeObj.itemParams = { 
        "description" : string.substitute(this.i18n.itemDescription, {inputLayerName:this.inputLayer.name}),
        "tags": string.substitute(this.i18n.itemTags, {inputLayerName: this.inputLayer.name}),
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
    
   
    _handleDistUnitsChange: function(value) {
      this.set("outputLayerName");
    },
      
    _handleDistanceTypeChange: function(type){
      var isTimeMode = (type.indexOf("Time") !== -1),
          isDrivingTime = (type === "DrivingTime");
      this.set("bufferType", type);
      if(this.get("showTrafficWidget")) {
        domStyle.set(this._useTrafficRow, "display", isDrivingTime? "" : "none");
        this._trafficTimeWidget.set("disabled", !isDrivingTime);
        this._trafficTimeWidget.set("reset", !isDrivingTime);
      }
      // show the correct units
      if (isTimeMode) {
        this._distanceUnitsSelect.removeOption(this._distanceUnitsSelect.getOptions());
        this._distanceUnitsSelect.addOption([
          {value:"Seconds", label: this.i18n.seconds},
          {value:"Minutes", label: this.i18n.minutes, selected:"selected"},
          {value:"Hours", label: this.i18n.hours}
        ]); 
      } else {
        this._distanceUnitsSelect.removeOption(this._distanceUnitsSelect.getOptions());
        this._distanceUnitsSelect.addOption([
          {value:"Miles", label: this.i18n.miles},
          {value:"Yards", label: this.i18n.yards},
          {value:"Feet", label: this.i18n.feet},
          {type:"separator"},
          {value:"Kilometers", label: this.i18n.kilometers},
          {value:"Meters", label: this.i18n.meters}
        ]);          
      }
      this.set("outputLayerName");
    },    
   
    _save: function() {},
    /*******************
     * UI Methods
     *******************/
    _buildUI: function(){
      //console.log("buildUI");
      var env, center, override = true;
      this.signInPromise.then(lang.hitch(this, AnalysisUtils.initHelpLinks, this.domNode, this.showHelp, {analysisGpServer: this.analysisGpServer}));
      //construct the UI 
      this._addBtn.set("disabled", true);
      domStyle.set(this._dataDialog.titleNode, "display", "none");
      domStyle.set(this._dataDialog.titleBar, "display", "none");
      domStyle.set(this._dataDialog.containerNode, "padding", "0");
      this.signInPromise.then(lang.hitch(this, function(response) {
          env = (this.portalUrl && this.portalUrl.indexOf("dev") !== -1) ? "dev" : ((this.portalUrl && this.portalUrl.indexOf("qa") !== -1) ?  "qa" : "");
          geoenrichConfig.portalUrl = this.portalUrl;
          geoenrichConfig.server = location.protocol + "//geoenrich"+ env +".arcgis.com/arcgis/rest/services/World/GeoenrichmentServer";
          this._task = new GeoenrichmentTask(geoenrichConfig.server);
          this._task.token = geoenrichConfig.token;
          if(esriLang.isDefined(this.inputLayer)) {
            center = this._getPoint(this.inputLayer);
          }
          if(center) {
            this._task.getCountries(center).then(
              lang.hitch(this, function(response){
                if(response instanceof Array) {
                  if(!this.country) {
                    this._databrowser.countryID =  response[0];
                    this.set("country", response[0]);
                  }
                  else {
                     this._databrowser.countryID =  this.country;
                  }
                  this._addBtn.set("disabled", false);
                }
            }), 
            lang.hitch(this, function(error){
              console.log(error);
              this._addBtn.set("disabled", false);
            })); 
        }//if input layer
        else {
          this._addBtn.set("disabled", false);          
        }
      }));
      if(!this.get("enableTravelModes")) {
        this._updateTravelModes(this.enableTravelModes);
      }
      if(this.get("showSelectAnalysisLayer")) {
        if(!this.get("inputLayer") && this.get("inputLayers")) {
          this.set("inputLayer", this.inputLayers[0]);
        }
        AnalysisUtils.populateAnalysisLayers(this, "inputLayer", "inputLayers");
        AnalysisUtils.addReadyToUseLayerOption(this, [this._analysisSelect]);          
      }
      if(this.outputLayerName) {
        this._outputLayerInput.set("value", this.outputLayerName);
        override = false;
      }
      if(this.inputLayer) {
        this._updateAnalysisLayerUI(override);
      }      
      this._loadConnections();
      if(this._isBufferSelectionEnabled || this._isLineEnabled){
        this._handleDistanceTypeChange("StraightLine");
      }
      domStyle.set(this._useTrafficRow, "display", this.get("showTrafficWidget")? "" : "none");

      
      if(this.outputLayerName) {
        this._outputLayerInput.set("value", this.outputLayerName);
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
      this.list = new List({ 
                    renderRow: lang.hitch(this, this._renderVariableRow)
                  }, this._selectedList);
      
    },
    
    startup: function() {
      this.list.startup();      
      domStyle.set(this._selectLabelDiv, "display", "block");
      domStyle.set(this._selectedList, "display", "none");
    },
    
    _updateAnalysisLayerUI: function(override) {
      var lineOption;
      if(this.inputLayer) {
        domAttr.set(this._aggregateToolDescription, "innerHTML", string.substitute(this.i18n.enrichDefine, {inputLayerName: this.inputLayer.name}));
        if(this.inputLayer.geometryType === "esriGeometryPolygon") {
          this._isBufferSelectionEnabled = false;
          this._updateTravelModes(false, true);//overide true to disabled for all options when areas
          domClass.add(this._distanceInput, "disabled");
          this._distanceInput.set("disabled", true);
          domClass.add(this._distanceUnitsSelect, "disabled");
          this._distanceUnitsSelect.set("disabled", true);
          lineOption = this._bufferTypeSelect.getOptions("StraightLine");
          lineOption.label = lineOption.label.replace("esriStraightLineDistanceIcon", "esriStraightLineDistanceDisabledIcon");
          lineOption.label = lineOption.label.replace("esriLeadingMargin4", "esriLeadingMargin4 esriAnalysisTextDisabled");
          lineOption.disabled = true;
          this._bufferTypeSelect.updateOption(lineOption);
          domClass.add(this._bufferTypeSelect, "disabled");
          this._bufferTypeSelect.set("disabled", true);  
        }
        if(this.inputLayer.geometryType === "esriGeometryPolyline") {
          this._updateTravelModes(false);
          this._isLineEnabled = true;
          this._isBufferSelectionEnabled = false;
        }
        if(override) {
          this.outputLayerName = string.substitute(this.i18n.outputLayerName, {layername: this.inputLayer.name});
        }
        this._outputLayerInput.set("value", this.outputLayerName);
      }
   },
    
    _renderVariableRow: function (variable) {
      var divOuter = domConstruct.create("div", { "class": "ShoppingCartRowOuter" });
      var div = domConstruct.create("div", { "class": "ShoppingCartRow"}, divOuter);
      domConstruct.create("div", { "class": "TrimWithEllipses ShoppingCartRowLabel", innerHTML: variable.alias }, div);
      var closer = domConstruct.create("div", { "class": "ShoppingCartRowCloser" }, div);
      domAttr.set(closer, "idDesc", variable.idDesc);
      on(closer, "click", lang.hitch(this, this._handledRemoveVarClick));
      return divOuter;
    },
    
    _handledRemoveVarClick: function (event) {
      this._databrowser.shoppingCart.onClick(event);
      this._databrowser._onOK();
    },
    
    validateSelectedGrid: function() {
      var isValid;
      isValid = (this.get("analysisVariables") && this.get("analysisVariables").length !== 0);
      if(!isValid) {
        winUtils.scrollIntoView(this._analysisVariablesCtr);
        domStyle.set(this._analysisVariablesCtr,"borderColor","#f94");
      }
      else {
        domStyle.set(this._analysisVariablesCtr,"borderColor","#EFEEEF");
      }
      return isValid;
    },    

    
    validateDistance: function() {
      var self = this, val, passes = [], vstring, match, v;
      this.set("distance");
      val = lang.trim(this._distanceInput.get("value"));
      //val = lang.trim(this._distanceInput.get("value")).split(" ");
      if (!val) {
        return false;
      }
      //console.log(val);
      v = number.parse(val);
      //console.log(v);
      if (isNaN(v)) {
        passes.push(0);
        return false;
      }
      vstring = number.format(v,{locale:"root"});
      if(!esriLang.isDefined(vstring)) {
        vstring = number.format(v,{locale:"en"});
      }
      else if(!esriLang.isDefined(vstring)) {
        vstring = number.format(v,{locale:"en-us"});
      }       
      if(esriLang.isDefined(vstring)) {
        match = lang.trim(vstring).match(/\D/g);
      }
      if (match){
        array.forEach(match, function( m ){
          if (m === "." || m === ",") {
            passes.push(1);
          } else if (m === "-" && self.inputType === "polygon") {
            passes.push(1);
          }
          else {
            passes.push(0);
          }
        });
      }
      //console.log(passes);
      if (array.indexOf(passes, 0) !== -1) {
        return false;
      }
      return true;
    },  
      
    _loadConnections: function(){
      this.on("start", lang.hitch(this, "_onClose", true));
      this._connect(this._closeBtn, "onclick", lang.hitch(this, "_onClose", false));
      if(this._isBufferSelectionEnabled) {
        connection.connect(this._bufferTypeSelect, "onChange", lang.hitch(this, this._handleDistanceTypeChange));
      }
      this._connect(this._databrowser, "onOK", lang.hitch(this, this._handleDataBrowserOk));
      this._connect(this._databrowser, "onCancel", lang.hitch(this, this._handleDataBrowserCancel)); 
      aspect.after(this._databrowser, "loadPage", lang.hitch(this, this._setCalciteButtons));
      this.watch("enableTravelModes", lang.hitch(this, function(prop, oldValue, value) {
        this._updateTravelModes(value);
      }));
    },
    
    _handleBrowseItemsSelect: function(value) {
      if(value && value.selection) {
        AnalysisUtils.addAnalysisReadyLayer({
          item: value.selection,
          layers: this.inputLayers,
          layersSelect: this._analysisSelect,
          browseDialog: this._browsedlg
        }).always(lang.hitch(this, this._updateAnalysisLayerUI, true));
      }
    },    
    
    _handleDataBrowserOk: function() {
      //console.log(this._databrowser.selection);
      this.set("analysisVariables", this._databrowser.selection);
      this._dataDialog.hide();
    },
    
    _handleDataBrowserCancel: function() {
      this._dataDialog.hide();
    },
    
    _handleShowDataDialogClick: function(e) {
      this._dataDialog.show();
    },
    
    _setCalciteButtons: function() {
      query(".calcite .DataCollectionButton").forEach(function(node) { 
        domClass.add(node, "btn secondary");
      });      
      query(".calcite .Wizard_Button").forEach(function(node, index) { 
        if(domAttr.get(node, "innerHTML") === this._databrowser.okButton) {
          domClass.add(node, "btn secondary");  
        }
        else {  
          domClass.add(node, "btn transparent"); 
        }
      }, this);           
    },
    
    _refreshGrid: function(attr, oldVal, newVal) {
      //console.log("refresh grid called when analysis variables is updated", attr, newVal);
      var contentArray = [];
      for (var idDesc in this._databrowser.shoppingCart.content) {
        if(this._databrowser.shoppingCart.content.hasOwnProperty(idDesc)){
          contentArray.push(this._databrowser.shoppingCart.content[idDesc]);
        }
      }
      domStyle.set(this._selectLabelDiv, "display", contentArray.length === 0? "block" : "none");
      domStyle.set(this._selectedList, "display", contentArray.length === 0? "none" : "block");
      domAttr.set(this.varCounter, "innerHTML", contentArray.length.toString());
      this.list.refresh();
      this.list.renderArray(contentArray);
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
        this._updateAnalysisLayerUI(true);
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
    
    //sets the inputLayer
    _setInputLayerAttr: function(layer) {
      this.inputLayer = layer;
    },
    
    _setDisableRunAnalysisAttr: function(value){
      this._saveBtn.set("disabled", value);
    },
    
    _setInputLayersAttr: function(layers) {
      this.inputLayers = layers;
    },
    
    _setAnalysisVariablesAttr: function(val) {
      this._set("analysisVariables", val);
    },
    
    _getAnalysisVariablesAttr: function() {
      return this.analysisVariables;
    },
        
    _setShowTrafficWidgetAttr: function(value) {
      this.showTrafficWidget = value;
    },
      
    _getShowTrafficWidgetAttr: function() {
      return this.showTrafficWidget;
    },  
    _setBufferTypeAttr: function(type) {
      this.bufferType = type;
    },
    
    _getBufferTypeAttr: function() {
      return this.bufferType;
    },    
        
    _setDistanceAttr: function(value) {
      if (value) {
        this.distance = value;  
      }
    },
        
    _getDistanceAttr: function() {
      this.distance = this._distanceInput.get("value");
      return this.distance;
    },    
    
    _setCountryAttr: function(value) {
      this.country = value;
    },
    
    _getCountryAttr: function() {
      if(this._databrowser) {
        this.country = this._databrowser.get("countryID");
      }
      return this.country;
    },

    _setEnableTravelModesAttr: function(value) {
      this._set("enableTravelModes", value);
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
    
    _updateTravelModes : function(enable) {
      var allOptions = this._bufferTypeSelect.getOptions();
      array.forEach(allOptions, function(opt) {
        if(opt.value !== "StraightLine") {
          opt.disabled = !enable;
        }
      });
      this._bufferTypeSelect.updateOption(allOptions);
    },
    
        
    _getPoint: function(layer) {
      if(layer.graphics && layer.graphics.length > 0) {
        return layer.graphics[0].geometry;
      }
      else {
        return layer.initialExtent ? layer.initialExtent.getCenter() : (layer.fullExtent ? layer.fullExtent.getCenter() : null); //new Point(-98.35,39.50)
      }
    }
    
  });
  
  return EnrichLayer;  
  
});
