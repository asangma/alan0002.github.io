/******************************************
esri/widgets/analysis/FindNearest
Parameter: analysisLayer 

Parameter: nearLayer
 
Parameter: measurementType 
Default Value: StraightLine 
Choice List: [ StraightLine, DrivingDistance, DrivingTime ]

Parameter: maxCount 
Display Name maxCount 
Default Value: 1 

Parameter: searchCutoff 
Default Value: 100 

Parameter: searchCutoffUnits 
Default Value: Miles 
Choice List: [ Miles, Yards, Feet, Meters, Kilometers, Nautical Miles ]

Parameter: timeOfDay 
Display Name timeOfDay
 
Parameter: outputName 
Parameter: nearestLayer 
Data Type: GPString 
Display Name nearestLayer 
*/
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
  "dojo/number",
  
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
  "dijit/form/NumberSpinner",
  "dijit/form/NumberTextBox",
   
  "../../kernel",
  "../../core/lang",
  "./AnalysisBase",
  "./_AnalysisOptions",
  "./CreditEstimator",
  "./utils",
  "./TrafficTime",
  "dojo/i18n!../../nls/jsapi",
  "dojo/text!./templates/FindNearest.html"
], function(require, declare, lang, array, connection, has, string, domStyle, domAttr, domConstruct, query, domClass, number, _WidgetBase,
   _TemplatedMixin, _WidgetsInTemplateMixin,  _OnDijitClickMixin, _FocusMixin, registry, Button, CheckBox, Form, Select, TextBox, ValidationTextBox, ContentPane,  ComboBox, NumberSpinner, NumberTextBox, esriKernel, esriLang, AnalysisBase, _AnalysisOptions, CreditEstimator, AnalysisUtils, TrafficTime, jsapiBundle, template) {
  var FindNearest = declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin,  _OnDijitClickMixin, _FocusMixin, _AnalysisOptions, AnalysisBase], {

    declaredClass: "esri.widgets.analysis.FindNearest",

    templateString: template,
    basePath: require.toUrl("."),
    widgetsInTemplate: true,
    
    //attributes for constructing the Tool, the names matches the REST service property names
    // used in setting up the UI and during re run to construct the UI
    analysisLayer: null, // layer analyzed
    nearLayers: null, // array of possible feature layes aggrgating to
    summaryFields: null, //possible stats atribute fields
    outputLayerName: null,
    nearLayer: null, // the polygon layer to be shown selected in dropdown
    searchCutoff: 100,
    searchCutoffUnits: "Miles",
    measurementType:"StraightLine",
    maxCount: 1,
    returnFeatureCollection: false,// returns the result of analysis as feature collection than creating a fetaure service
    
    enableTravelModes: true,

    i18n: null,
    
    toolName: "FindNearest",
    helpFileName: "FindNearest",
    resultParameter:["nearestLayer","connectingLinesLayer"],
    
    _timeObj: null,

    /************
     * Overrides
     ************/
    constructor: function(params){
      this._pbConnects = [];
      this._statsRows = [];
      this._timeObj = {
        hours: 1,
        minutes: 0,
        seconds: 0
      };
      if (params.containerNode) {
        this.container = params.containerNode;
      }
    },
    
    destroy: function(){
      this.inherited(arguments);
      array.forEach(this._pbConnects, connection.disconnect);
      delete this._pbConnects;
      if (this._driveTimeClickHandles && this._driveTimeClickHandles.length > 0) {
        array.forEach(this._driveTimeClickHandles, connection.disconnect);
        this._driveTimeClickHandles = null;
      }       
    },
    
    postMixInProperties: function(){
      this.inherited(arguments);
      lang.mixin(this.i18n, jsapiBundle.bufferTool);
      lang.mixin(this.i18n, jsapiBundle.driveTimes);
      lang.mixin(this.i18n, jsapiBundle.FindNearestTool);
    },
    
    postCreate: function(){
      this.inherited(arguments);
      domClass.add(this._form.domNode, "esriSimpleForm");
      //domAttr.set(this._closeImg, "src" , this.basePath + "/images/close.gif");
      this._outputLayerInput.set("validator", lang.hitch(this, this.validateServiceName, this._outputLayerInput));
      this._hoursInput.set("validator", lang.hitch(this, this.validateTime, "hours"));
      this._minutesInput.set("validator", lang.hitch(this, this.validateTime, "minutes"));
      this._secondsInput.set("validator", lang.hitch(this, this.validateTime,  "seconds"));
      //this._outputLayerInput2.set("validator", lang.hitch(this, this.validateServiceName, this._outputLayerInput2));
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
      //console.log(jobParams);
      if(!this._form.validate()) {
        return;
      }
      var jobParams = {}, nearLayer ; 
      nearLayer = this.nearLayers[this._layersSelect.get("value")];
      jobParams.nearLayer = JSON.stringify(AnalysisUtils.constructAnalysisInputLyrObj(nearLayer));
      jobParams.measurementType = this.get("measurementType");
      jobParams.analysisLayer = JSON.stringify(AnalysisUtils.constructAnalysisInputLyrObj(this.analysisLayer));
      if (this._searchCutoffInput.get("value") === true) {
        jobParams.searchCutoff = this.get("searchCutoff");
        if (this.get("measurementType").indexOf("Time") !== -1){
          jobParams.searchCutoffUnits = "Minutes";
        }
        else {
          jobParams.searchCutoffUnits = this.get("searchCutoffUnits");  
        }
        
      }
      else {
        jobParams.searchCutoff = null;
      }
      if (this._limitSearchRangeCheck.get("value") === true) {
        jobParams.maxCount = this.get("maxCount");  
      }
      else {
        jobParams.maxCount= null;
      }
      
      if(this._trafficTimeWidget.get("checked")) {
        jobParams.timeOfDay = this._trafficTimeWidget.get("timeOfDay");
        //console.log(jobParams.timeOfDay);
        if(this._trafficTimeWidget.get("timeZoneForTimeOfDay") === "UTC") {
          jobParams.timeZoneForTimeOfDay = this._trafficTimeWidget.get("timeZoneForTimeOfDay");
        }
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
        //console.log("showextent ux", this.showChooseExtent);
        //console.log(this._useExtentCheck.get("checked"));
        if(this._useExtentCheck.get("checked")) {
          jobParams.context = JSON.stringify({
            //outSr: this.map.spatialReference,
            extent: this.map.extent._normalize(true)
          });
        }
      }      
      
      
      this.getCreditsEstimate(this.toolName, jobParams).then(lang.hitch(this, function(result){
        //cost: 2.12, Total records: 2120
        this._usageForm.set("content", result);
        this._usageDialog.show();
      }));      
    },

    
    _handleSaveBtnClick: function() {
      //console.log("Call Success Submit Job");
      //construct job params object
      if(!this._form.validate()) {
        return;
      }
      this._saveBtn.set("disabled", true);
      var jobParams = {}, executeObj = {}, nearLayer, contextObj; 
      nearLayer = this.nearLayers[this._layersSelect.get("value")];
      jobParams.nearLayer = JSON.stringify(AnalysisUtils.constructAnalysisInputLyrObj(nearLayer));
      jobParams.measurementType = this.get("measurementType");
      jobParams.analysisLayer = JSON.stringify(AnalysisUtils.constructAnalysisInputLyrObj(this.analysisLayer));
      if (this._limitSearchRangeCheck.get("checked")) {
        jobParams.searchCutoff = this.get("searchCutoff");
        if (this.get("measurementType").indexOf("Time") === -1){
          jobParams.searchCutoffUnits = this.get("searchCutoffUnits");  
        }
      }
      else {
        jobParams.searchCutoff = null;
      }
      if (this._findNearestCheck.get("checked")) {
        jobParams.maxCount = this.get("maxCount");  
      }
      else {
        jobParams.maxCount = null;
      }
      
      if(this._trafficTimeWidget.get("checked")) {
        jobParams.timeOfDay = this._trafficTimeWidget.get("timeOfDay");
        //console.log(jobParams.timeOfDay);
        if(this._trafficTimeWidget.get("timeZoneForTimeOfDay") === "UTC") {
          jobParams.timeZoneForTimeOfDay = this._trafficTimeWidget.get("timeZoneForTimeOfDay");
        }
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
      this._saveBtn.set("disabled", false);
      //construct the item params object for the ouput fetaure service item 
      //console.log(polyLayer);
      //polyLayer.name changed here  polyLayer.layer["name"] in viewer the web map name can be passed through
      executeObj.itemParams = { 
        "description" : string.substitute(this.i18n.itemDescription, {sumNearbyLayerName:this.analysisLayer.name, summaryLayerName:  nearLayer.name}),
        "tags": string.substitute(this.i18n.itemTags, {sumNearbyLayerName: this.analysisLayer.name, summaryLayerName:  nearLayer.name}),
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
    
    _handleLayerChange: function(index) {
      //console.log("layer change Success" , index);
      //console.log("chosen layer Success", this.nearLayers[index]);
      var layer;
      if(index === "browse") {
        if(!this._analysisquery) {
          this._analysisquery = this._browsedlg.browseItems.get("query");
        }
        this._browsedlg.browseItems.set("query", this._analysisquery);
        this._isAnalysisSelect = false;
        this._browsedlg.show();
      }
      else {
        layer = this.nearLayers[index];
        if(esriLang.isDefined(layer)) {
          this.outputLayerName = string.substitute(this.i18n.outputLayerName, { 
            layer: layer.name,
            sumNearbyLayerName: this.analysisLayer.name
          });
        }
        /*this.outputLinesLayerName = string.substitute(this.i18n.outputConnectingLayerName, {
          layer: layer.name, 
          sumNearbyLayerName: this.analysisLayer.name
        });*/      
        this._outputLayerInput.set("value", this.outputLayerName);
        //this._outputLayerInput2.set("value", this.outputLinesLayerName);
        /*if(this._maxNumberSpinner) {
          this._maxNumberSpinner.destroy();
        }
        this._maxNumberSpinner = new NumberSpinner({
          value: 1,
          smallDelta: 1,
          constraints: { min:1, max:100, places:0 },
          style: "width:100px"
        }, this._maxCountInput).startup();*/
      }
    },
    
    _handleLimitSearchCheckChange: function(value) {
      //console.log(value);
      if(this.get("measurementType").indexOf("Time") !== -1) {
        this._hoursInput.set("disabled", !value);
        this._minutesInput.set("disabled", !value);
        this._secondsInput.set("disabled", !value);
        
      }
      else {
        this._distanceUnitsSelect.set("disabled", !value);
        this._searchCutoffInput.set("disabled", !value);
      }
      
    },
    
    _handleFindNearestCheckChange: function(value) {
      //console.log(value);
      this._maxCountInput.set("disabled", !value);
    },
   
    _handleTimeUnitsChange: function(value) {
      //console.log(value);
    },
    
    _handleDistValueChange: function(value) {
        this.set("outputLayerName");
    },
      
    _handleDistUnitsChange: function(value) {
        this.set("outputLayerName");
        console.log("setting", value);
        this.set("searchCutoffUnits", value);
    },
      
    _handleDistanceTypeChange: function(type){
      var isTimeMode = (type.indexOf("Time") !== -1),
          isDrivingTime = (type === "DrivingTime");      
      this.set("measurementType", type);
      domStyle.set(this._useTrafficRow, "display", isDrivingTime? "" : "none");
      domStyle.set(this._distanceLimitRow, "display", isDrivingTime? "none" : "");
      domStyle.set(this._timeLimitRow, "display", isDrivingTime? "" : "none");
      //_distanceLimitRow
      //domStyle.set(this._useTrafficLabelRow, "display", type === "DrivingTime"? "" : "none");
      this._trafficTimeWidget.set("disabled", type !== "DrivingTime");
      this._trafficTimeWidget.set("reset", type !== "DrivingTime");
      //_outputNumberLabel
      //domAttr.set(this._outputNumberLabel, "innerHTML", type === "DrivingTime"? this.i18n.fiveLabel : this.i18n.fourLabel);
      
      // show the correct units
      if (isTimeMode) {
        this._distanceUnitsSelect.removeOption(this._distanceUnitsSelect.getOptions());
        this._distanceUnitsSelect.addOption([
          {value:"Seconds", label: this.i18n.seconds},
          {value:"Minutes", label: this.i18n.minutes, selected:"selected"},
          {value:"Hours", label: this.i18n.hours}
        ]); 
      } 
      else {
        //get the current units
        if(this.get("searchCutoffUnits")) {
          this.set("searchCutoffUnits", this.get("searchCutoffUnits"));
        }
        
        this._distanceUnitsSelect.removeOption(this._distanceUnitsSelect.getOptions());
        this._distanceUnitsSelect.addOption([
          {value:"Miles", label: this.i18n.miles},
          {value:"Yards", label: this.i18n.yards},
          {value:"Feet", label: this.i18n.feet},
          {type:"separator"},
          {value:"Kilometers", label: this.i18n.kilometers},
          {value:"Meters", label: this.i18n.meters}
        ]);
        if(type === "StraightLine") {
          this._distanceUnitsSelect.addOption([
             {type:"separator"},
             {value:"NauticalMiles", label: this.i18n.nautMiles}
           ]);
        }
        //set the current units
        this._distanceUnitsSelect.set("value", this.searchCutoffUnits);
      }
      this.set("outputLayerName");
    },    
   
    _save: function() {},
    /*******************
     * UI Methods
     *******************/
    _buildUI: function(){
      //console.log("buildUI");
      //console.log(this.outputLayerName);
      var override;
      AnalysisUtils.initHelpLinks(this.domNode, this.showHelp);
      //construct the UI 
      
      if(!this.get("enableTravelModes")) {
        this._updateTravelModes(this.enableTravelModes);
      }
      AnalysisUtils.initHelpLinks(this.domNode, this.showHelp);
      if(this.get("showSelectAnalysisLayer")) {
        if(!this.get("analysisLayer") && this.get("analysisLayers")) {
          this.set("analysisLayer", this.analysisLayers[0]);
        }
        AnalysisUtils.populateAnalysisLayers(this, "analysisLayer", "analysisLayers");
      }
      if(this.outputLayerName) {
        this.outputLayerInput.set("value", this.outputLayerName);
        override = false;
      }
      if(this.analysisLayer) {
       this._updateAnalysisLayerUI(override);
      } 
      AnalysisUtils.addReadyToUseLayerOption(this, [this._analysisSelect]); 
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
      if(this.measurementType && this.measurementType.indexOf("Time") === -1) {
        if(this.searchCutoffUnits) {
          this._distanceUnitsSelect.set("value", this.searchCutoffUnits);
        }
        if(this.searchCutoff) {
          this._searchCutoffInput.set("value", this.searchCutoff);
        }
      }
      else if(this.measurementType && this.measurementType.indexOf("Time") !== -1) {
        if(this._timeObj !== this.searchCutoff) {
          this._hoursInput.set("value", parseInt(this.searchCutoff.hours, 10));
          this._minutesInput.set("value", parseInt(this.searchCutoff.minutes,10));
          this._secondsInput.set("value", parseInt(this.searchCutoff.seconds,10));
          this._timeObj.hours = parseInt(this.searchCutoff.hours, 10);
          this._timeObj.minutes = parseInt(this.searchCutoff.minutes,10);
          this._timeObj.seconds = parseInt(this.searchCutoff.seconds,10);
        }
      }
      this._handleDistanceTypeChange(this.measurementType);//default
      if(this.maxCount) {
        this._maxCountInput.set("value", this.maxCount);  
      }
      //var nearLayer  = this.nearLayers[this._layersSelect.get("value")];
      //console.log(this._maxCountInput.get("value"));
      this._loadConnections();
    },
    
    _updateAnalysisLayerUI: function(override) {
      if(this.analysisLayer) {
        //console.log(this.analysisLayer.name);
        domAttr.set(this._aggregateToolDescription, "innerHTML", string.substitute(this.i18n.summarizeDefine, {sumNearbyLayerName: this.analysisLayer.name}));
        domAttr.set(this._forLocationLabel, "innerHTML", string.substitute(this.i18n.forEachLocationLabel, {sumNearbyLayerName: this.analysisLayer.name}));
        if(this.analysisLayer.geometryType !== "esriGeometryPoint") {
          this.set("enableTravelModes", false);
          this._updateTravelModes(false);
        }
      }
      if(this.nearLayers) {
        this._layersSelect.removeOption(this._layersSelect.getOptions());
        array.forEach(this.nearLayers, function(layer , index) {
          if(layer !== this.analysisLayer) {
            this._layersSelect.addOption({value:index, label:layer.name});
            if(layer.analysisReady && this.analysisLayer.analysisReady && layer.url === this.analysisLayer.url) {
             this._layersSelect.removeOption({value:index, label:layer.name});
            }
            if (!this.outputLayerName || override) {
              this.outputLayerName = string.substitute(this.i18n.outputLayerName, { 
                layer: layer.name, 
                sumNearbyLayerName: this.analysisLayer.name
              });
            }
          }
        }, this);
        this._layersSelect.addOption({type:"separator", value:""});
        this._layersSelect.addOption({value:"browse", label: this.i18n.browseAnalysisTitle});     
      }
      if(!this._nearSelectAddCheck) {
        AnalysisUtils.addReadyToUseLayerOption(this, [this._layersSelect]);
        this._nearSelectAddCheck  = true;
      }
      this._outputLayerInput.set("value", this.outputLayerName);
      if(this.nearLayer) {
        this._layersSelect.set("value", this.nearLayer);
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
          layers:  this._isAnalysisSelect? this.analysisLayers : this.nearLayers,
          layersSelect: this._isAnalysisSelect? this._analysisSelect : this._layersSelect,
          browseDialog: this._browsedlg
        }).always(lang.hitch(this, this._updateAnalysisLayerUI, true));
      }
    },    

    _loadConnections: function(){
      this.on("start", lang.hitch(this, "_onClose", true));
      this._connect(this._closeBtn, "onclick", lang.hitch(this, "_onClose", false));
      this._connect(this._measureMethodSelect, "onChange", lang.hitch(this, "_handleDistanceTypeChange"));       
      this.watch("enableTravelModes", lang.hitch(this, function(prop, oldValue, value) {
        this._updateTravelModes(value);
      }));
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
    
    //sets the analysisLayer
    _setAnalysisLayerAttr: function(layer) {
      this.analysisLayer = layer;
    },
    
    _getAnalysisLayerAttr: function(layer) {
      return this.analysisLayer;
    },
    
    _setAnalysisLayersAttr: function(layers) {
      this.analysisLayers = layers;
    },
    
    _setNearLayersAttr: function(maplayers) {
      //console.log("inside polygn", maplayers);
      this.nearLayers = maplayers;
    },
    
    // sets the first point layer as the pointlayer
    _setLayersAttr: function(maplayers) {
      //console.log("maplayers " , maplayers);
      this.nearLayers = [];
    },
    
    _setDisableRunAnalysisAttr: function(value){
      this._saveBtn.set("disabled", value);
    },
    
    _setSearchCutoffUnitsAttr: function(value) {
      this.searchCutoffUnits = value;
    },
    
    _getSearchCutoffUnitsAttr: function() {
      return this.searchCutoffUnits;
    },  
    
    _setMeasurementTypeAttr: function(type) {
      this.measurementType = type;
    },
    
    _getMeasurementTypeAttr: function() {
      return this.measurementType;
    },    
    
    _getSearchCutoffAttr: function() {
      if(this.measurementType && this.measurementType === "DrivingTime") {
        if(this._timeObj) {
          //console.log("time cutoff");
          this.searchCutoff = this._timeObj.hours * 60 + this._timeObj.minutes + (this._timeObj.seconds/60);
          //console.log(this.searchCutoff);
        }
      }
      else {
        //console.log("distance cutoff");
        this.searchCutoff = this._searchCutoffInput.get("value");
      }
      return this.searchCutoff;
    }, 
        
    _setSearchCutoffAttr: function(value) {
      if (value) {
        this.searchCutoff = value;  
      }
    },
    
    _getMaxCountAttr: function() {
      this.maxCount = this._maxCountInput.get("value");
      return this.maxCount;
    }, 
    
    _setMaxCountAttr: function(value) {
      this.maxCount = value;
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
    
    validateServiceName: function(inputwidget, value) {
      return AnalysisUtils.validateServiceName(value, {textInput: this._outputLayerInput});
    },
    
    validateTime: function(tcomponent, value) {
      //console.log(tcomponent, value);
      var isValid = true, v;
      v = parseInt(value, 10);
      if (tcomponent=== "hours") {
        this._timeObj.hours = v;
    
      }
      else if (tcomponent=== "minutes") {
        this._timeObj.minutes = v;
        
      }
      else if (tcomponent=== "seconds") {
        this._timeObj.seconds = v;
      }
      if(this._timeObj.hours === 0 && this._timeObj.minutes === 0 && this._timeObj.seconds === 0) {
        isValid = false;
      }
      return isValid;
    },
    ////////////////////////////
    // Helpers
    ////////////////////////////
    _connect: function(node, evt, func){
      this._pbConnects.push(connection.connect(node, evt, func));
    },
    
    _updateTravelModes: function(enable) {
      var allOptions = this._measureMethodSelect.getOptions();
      array.forEach(allOptions, function(opt) {
        if(opt.value !== "StraightLine") {
          opt.disabled = !enable;
        }
      });
      this._measureMethodSelect.updateOption(allOptions);      
    }

  });
  
  return FindNearest;  
  
});

  


