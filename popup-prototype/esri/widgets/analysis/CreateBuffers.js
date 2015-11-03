/******************************************
 * esri/widgets/analysis/CreateBuffers
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
  "dijit/Dialog",
  
  "../../kernel",
  "../../core/lang",
  "./AnalysisBase",
  "./_AnalysisOptions",
  "./utils",
  "./CreditEstimator",
  "dojo/i18n!../../nls/jsapi",
  "dojo/text!./templates/CreateBuffers.html"
], function(require, declare, lang, array, connection, has, string, domStyle, domAttr, domConstruct, query, domClass, number, _WidgetBase,
   _TemplatedMixin, _WidgetsInTemplateMixin,  _OnDijitClickMixin, _FocusMixin, registry, Button, CheckBox, Form, Select, TextBox, ValidationTextBox, ContentPane, ComboBox, Dialog, esriKernel, esriLang, _AnalysisOptions, AnalysisBase, AnalysisUtils, CreditEstimator, jsapiBundle, template) {
    var CreateBuffers = declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin,  _OnDijitClickMixin, _FocusMixin, _AnalysisOptions, AnalysisBase], {
      declaredClass: "esri.widgets.analysis.CreateBuffers",

      templateString: template,
      basePath: require.toUrl("."),      
      widgetsInTemplate: true,
      
      inputLayer: null,
      inputType: null,
      outputLayerName: null,
      bufferDistance: null,
      units:null,  
      
      i18n: null,
      
      toolName: "CreateBuffers",
      helpFileName: "CreateBuffers",
      resultParameter:"BufferLayer",
     
      /************
       * Overrides
       ************/
      constructor: function(params, srcNodeRef){
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
        lang.mixin(this.i18n, jsapiBundle.bufferTool);
      },
      
      postCreate: function(){
        this.inherited(arguments);
        domClass.add(this._form, "esriSimpleForm");
        //domAttr.set(this._closeImg, "src" , this.basePath + "/images/close.gif");
        this.outputLayerInput.set("validator", lang.hitch(this, this.validateServiceName));
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
      
      _toUpperFirstLetter: function(str) {
        return (str.slice(0,1).toUpperCase() + str.slice(1));
      },
      
      
      _handleSaveBtnClick: function(e) {
        //construct job params object
        var jobParams = {}, executeObj = {}, contextObj;
        if(!this._form.validate()) {
          return;
        }
        this._saveBtn.set("disabled", true);
        //input point layer url or featureset 
        jobParams.InputLayer =  JSON.stringify(AnalysisUtils.constructAnalysisInputLyrObj(this.inputLayer));
        jobParams.DissolveType = (this._DissolveType && this._DissolveType === "dissolve") ? "Dissolve" : "None";
        if (this.bufferDistType === "attribute") {
          jobParams.Field = this._bufferDistAttribute.get("value");
        } else {
          //console.log(this._bufferDist.get("value"));
          jobParams.Distances = this.bufferDistance;
        }
        jobParams.Units = this._bufferUnits.get("value");
        if ( this.bufferDistance.length) {
          if (!this._RingType) {
            this._RingType = "rings";
          }
          jobParams.RingType = (this._RingType === "rings")? "Rings" : "Disks";
        }
        if(this.inputLayer.geometryType === "esriGeometryPolyline" || this.inputLayer.geometryType === "esriGeometryPolygon") {
          if(this.inputLayer.geometryType === "esriGeometryPolyline" ) {
            jobParams.SideType = (this._SideType && this._SideType ==="left")? "Left" : ((this._SideType && this._SideType ==="right")? "Right" : "Full");
          }
          else {
            jobParams.SideType = (this._SideType && this._SideType === "outside")? "Outside" : "Full";
          }
          jobParams.EndType = (this._EndType && this._EndType ==="flat") ? "Flat" : "Round";
        }
     
        //outputLayer
        if(!this.returnFeatureCollection) {
          jobParams.OutputName = JSON.stringify({
            serviceProperties : {
              name: this.outputLayerInput.get("value")
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
          "description" : string.substitute(this.i18n.itemDescription, { layername: this.inputLayer.name, distance_field: jobParams.Distances || jobParams.Field , units: jobParams.Units }),
          "tags": string.substitute(this.i18n.itemTags, {layername: this.inputLayer.name}),
          "snippet": this.i18n.itemSnippet
        };
        if(this.showSelectFolder) {
          executeObj.itemParams.folder = this.get("folderId");
        }        
        //console.log(executeObj);
        //AnalysisBase submit method
        this.execute(executeObj);
    
      },
     
      _handleLayerChange: function(index) {
        //console.log("layer change Success" , index);
        //console.log("chosen layer Success", this.polygonLayers[index]);
      },
     
      _handleRadiusTypeChange: function( type ){
        this.bufferDistType = type;
        
        domClass.remove(this._Distance, "selected");
        domClass.remove(this._Attribute, "selected");
    
        var dist_val = this._bufferDist.get("value").split(" ");
    
        if ( type === "attribute" ){
          domStyle.set(this._bufferDistAttribute.domNode, "display", "block");
          domStyle.set(this._bufferDist.domNode, "display", "none");
          domStyle.set(this._sizeHelpRow, "display", "none");
          domStyle.set( this.ringTypes, "display", "none" );
          if (this.inputType === "polygon"){
            domStyle.set(this.polygonTypes, "display", "block");
            domStyle.set(this.sideTypes, "display", "none");
            domStyle.set(this.endTypes, "display", "none");
          } else if (this.inputType === "line") {
            domStyle.set(this.sideTypes, "display", "block");
            domStyle.set(this.endTypes, "display", "block");
            domStyle.set(this.polygonTypes, "display", "none");
          }
    
          domClass.add(this._Attribute, "selected");
    
        } else if ( type === "distance" ) {
          domStyle.set(this._bufferDistAttribute.domNode, "display", "none");
          domStyle.set(this._bufferDist.domNode, "display", "block");
          domStyle.set(this._sizeHelpRow, "display", "table-row");
    
          domClass.add(this._Distance, "selected");
    
          if (dist_val.length > 1) {
            domStyle.set(this.ringTypes, "display", "block");
            domStyle.set(this.sideTypes, "display", "none");
            domStyle.set(this.endTypes, "display", "none");
            domStyle.set(this.polygonTypes, "display", "none");
          } else if (this.inputType === "polygon"){
            domStyle.set(this.ringTypes, "display", "none");
            domStyle.set(this.sideTypes, "display", "none");
            domStyle.set(this.endTypes, "display", "none");
            domStyle.set(this.polygonTypes, "display", "block");
          } else if (this.inputType === "line") {
            domStyle.set(this.ringTypes, "display", "none");
            domStyle.set(this.sideTypes, "display", "block");
            domStyle.set(this.endTypes, "display", "block");
            domStyle.set(this.polygonTypes, "display", "none");
          }
        }
      },
      _handleDissolveTypeChange: function( type ){
        this._DissolveType = type;
        domClass.remove(this._Overlap, "selected");
        domClass.remove(this._Dissolve, "selected");
        domClass.add((type === "none") ? this._Overlap : this._Dissolve, "selected");
      },
    
      _handleRingTypeChange: function( type ){
        this._RingType = type;
        domClass.remove(this._Rings, "selected");
        domClass.remove(this._Disks, "selected");
        domClass.add((type === "rings") ? this._Rings : this._Disks, "selected");
      },
    
    
      _handlePolygonTypeChange: function( type ){
        this._SideType = type;
        domClass.remove(this._Include, "selected");
        domClass.remove(this._Exclude, "selected");
        domClass.add((type === "full") ? this._Include : this._Exclude, "selected");
      },
    
      _handleSideTypeChange: function( obj, type ){
        this._SideType = type;
        domClass.remove(this._Around, "selected");
        domClass.remove(this._Left, "selected");
        domClass.remove(this._Right, "selected");
        domClass.add( obj, "selected");
      },
    
      _handleEndTypeChange: function( type ){
        this._EndType = type;
        domClass.remove(this._Round, "selected");
        domClass.remove(this._Flat, "selected");
        domClass.add( (type === "round") ? this._Round : this._Flat, "selected");
      },
    
      _handleOptionsBtnClick: function(){
        if (domClass.contains(this._optionsDiv, "disabled")) {
          return;
        }
        if (domClass.contains(this._optionsDiv, "optionsClose")) {
          domClass.remove(this._optionsDiv, "optionsClose");
          domClass.add(this._optionsDiv, "optionsOpen");
        }
        else if (domClass.contains(this._optionsDiv, "optionsOpen")) {
          domClass.remove(this._optionsDiv, "optionsOpen");
          domClass.add(this._optionsDiv, "optionsClose");
    
        }
      },
    
      _handleDistanceChange: function( ){
        var val = lang.trim(this._bufferDist.get("value")).split(" "), darray = [];
        if (val.length > 1){
          domStyle.set(this.ringTypes, "display", "block");
          domStyle.set(this.sideTypes, "display", "none");
          domStyle.set(this.endTypes, "display", "none");
          domStyle.set(this.polygonTypes, "display", "none");
        } else {
          if (this.inputType === "line") { 
            domStyle.set(this.sideTypes, "display", "block");
            domStyle.set(this.endTypes, "display", "block");
          } else if (this.inputType === "polygon"){
            domStyle.set(this.polygonTypes, "display", "block");
          }
          domStyle.set(this.ringTypes, "display", "none");
        }
        array.forEach(val, function(v){
          darray.push(number.parse(v));
        });
        this.bufferDistance = darray; 
      },
    
      _handleShowCreditsClick: function(e) {
        e.preventDefault();
        //////////////////
        var jobParams={};
        if(!this._form.validate()) {
          return;
        } 

        jobParams.InputLayer =  JSON.stringify(AnalysisUtils.constructAnalysisInputLyrObj(this.inputLayer));
        jobParams.DissolveType = (this._DissolveType && this._DissolveType === "dissolve") ? "Dissolve" : "None";
        if (this.bufferDistType === "attribute") {
          jobParams.Field = this._bufferDistAttribute.get("value");
        } else {
          
          jobParams.Distances = JSON.stringify(this.bufferDistance);
        }
        jobParams.Units = this._bufferUnits.get("value");
        if ( this.bufferDistance.length) {
          if (!this._RingType) {
            this._RingType = "rings";
          }
          jobParams.RingType = (this._RingType === "rings")? "Rings" : "Disks";
        }
        if(this.inputLayer.geometryType === "esriGeometryPolyline" || this.inputLayer.geometryType === "esriGeometryPolygon") {
          if(this.inputLayer.geometryType === "esriGeometryPolyline" ) {
            jobParams.SideType = (this._SideType && this._SideType ==="left")? "Left" : ((this._SideType && this._SideType ==="right")? "Right" : "Full");
          }
          else {
            jobParams.SideType = (this._SideType && this._SideType === "outside")? "Outside" : "Full";
          }
          jobParams.EndType = (this._EndType && this._EndType ==="flat") ? "Flat" : "Round";
        }
     
        //outputLayer
        if(!this.returnFeatureCollection) {
          jobParams.OutputName = JSON.stringify({
            serviceProperties : {
              name: this.outputLayerInput.get("value")
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
        console.log(jobParams);        
        //////////////////
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
      _buildUI: function() {
        var override = true;
        AnalysisUtils.initHelpLinks(this.domNode, this.showHelp);
        if(this.get("showSelectAnalysisLayer")) {
          if(!this.get("inputLayer") && this.get("inputLayers")) {
            this.set("inputLayer", this.inputLayers[0]);
          }
          AnalysisUtils.populateAnalysisLayers(this, "inputLayer", "inputLayers");
        }
        AnalysisUtils.addReadyToUseLayerOption(this, [this._analysisSelect]);          
        if(this.outputLayerName) {
          this.outputLayerInput.set("value", this.outputLayerName);
          override = false;
        }
        if(this.inputLayer) {
         this._updateAnalysisLayerUI(override);
        } 
        this._bufferDist.set("validator", lang.hitch(this, this.validateDistance));
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
        if(this.inputLayer) {
          domAttr.set(this._bufferToolDescription, "innerHTML", string.substitute(this.i18n.bufferDefine, {layername: this.inputLayer.name}));
          if(override) {
            this.outputLayerName = string.substitute(this.i18n.outputLayerName, {layername: this.inputLayer.name});
          }
          // build the attribute selection for attr buffers
          this._bufferDistAttribute.removeOption(this._bufferDistAttribute.getOptions());
          var options = [];
          array.forEach(this.inputLayer.fields, function(f){
            if (f.type === "esriFieldTypeDouble" || f.type === "esriFieldTypeInteger" || f.type === "esriFieldTypeSmallInteger" || f.type === "esriFieldTypeSingle") {
              options.push({
                             value: f.name , 
                             label: esriLang.isDefined(f.alias) && f.alias !== ""? f.alias : f.name
                           });
            }
          }, this); 
          this._bufferDistAttribute.addOption(options);
          domAttr.set(this._bufferOptionsHelpLink, "esriHelpTopic", (this.inputType === "polygon" ? "OptionPoly" : (this.inputType === "line"? "OptionLine" : "OptionPoint")));
          //construct the UI based on the selected layer type
          if ( this.inputType === "line" ) {
            domStyle.set(this.sideTypes, "display", "block");
            domStyle.set(this.endTypes, "display", "block");
          } else if ( this.inputType === "polygon"){
            domStyle.set(this.polygonTypes, "display", "block");
          }          
        }
        if(this.outputLayerName) {
          this.outputLayerInput.set("value", this.outputLayerName);
        }
        if(!this.bufferDistance || override) {
          this.bufferDistance = [];
          this.bufferDistance.push(this._bufferDist.get("value"));
        }
        else {
          //console.log(this.bufferDistance.toString().replace(/,/g," "));
          this._bufferDist.set("value", this.bufferDistance.toString().replace(/,/g," "));
        }        
        if(this.units) {
          this._bufferUnits.set("value", this.units);
        }
      },
      
      _handleAnalysisLayerChange: function(value) {
        if(value === "browse") {
          if(!this._analysisquery) {
            this._analysisquery = this._browsedlg.browseItems.get("query");
          }        
          this._browsedlg.browseItems.set("query", this._analysisquery);
          this._browsedlg.show();
        }
        else {
          this.inputLayer = this.inputLayers[value];
          this._updateAnalysisLayerUI(true);
        }
      },
    
      validateDistance: function() {
        var self = this, val, passes=[], vstring, match;
        this._handleDistanceChange();
        val = lang.trim(this._bufferDist.get("value")).split(" ");
        if (val.length === 0) {
          return false;
        }
        //console.log(val);
        array.forEach(val, function(v){
          v = number.parse(v);
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
        });
        //console.log(passes);
        if (array.indexOf(passes, 0) !== -1) {
          return false;
        }
        return true;
        
      },
      
      _loadConnections: function(){
        this.on("start", lang.hitch(this, "_onClose", true));
        this._connect(this._closeBtn, "onclick", lang.hitch(this, "_onClose", false));
        
        //connection.connect(this._bufferDist, "onchange", lang.hitch(this, "_handleDistanceChange", false));
    
        connection.connect(this._Distance, "onclick", lang.hitch(this, "_handleRadiusTypeChange", "distance")); 
        connection.connect(this._Attribute, "onclick", lang.hitch(this, "_handleRadiusTypeChange", "attribute")); 
        
        connection.connect(this._Overlap, "onclick", lang.hitch(this, "_handleDissolveTypeChange", "none")); 
        connection.connect(this._Dissolve, "onclick", lang.hitch(this, "_handleDissolveTypeChange", "dissolve")); 
        
        connection.connect(this._Include, "onclick", lang.hitch(this, "_handlePolygonTypeChange", "full")); 
        connection.connect(this._Exclude, "onclick", lang.hitch(this, "_handlePolygonTypeChange", "outside")); 
    
        connection.connect(this._Rings, "onclick", lang.hitch(this, "_handleRingTypeChange", "rings"));
        connection.connect(this._Disks, "onclick", lang.hitch(this, "_handleRingTypeChange", "disks")); 
    
        connection.connect(this._Around, "onclick", lang.hitch(this, "_handleSideTypeChange", this._Around, "full"));
        connection.connect(this._Left, "onclick", lang.hitch(this, "_handleSideTypeChange", this._Left, "left"));
        connection.connect(this._Right, "onclick", lang.hitch(this, "_handleSideTypeChange", this._Right, "right"));
    
        connection.connect(this._Round, "onclick", lang.hitch(this, "_handleEndTypeChange", "round"));
        connection.connect(this._Flat, "onclick", lang.hitch(this, "_handleEndTypeChange", "flat"));
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
      
      
      //sets the tool gp task url
      _setAnalysisGpServerAttr: function(url) {
        if(!url) {
          return;
        }        
        this.analysisGpServer = url;
        this.set("toolServiceUrl", this.analysisGpServer +  "/" + this.toolName);
      },
    
      _setInputLayerAttr: function( layer ) {
        if(!esriLang.isDefined(layer)) {
          return;
        }
        if ( layer.geometryType === "esriGeometryPolygon" ) {
          this.inputLayer = layer;
          this.inputType = "polygon";
        } else if (layer.geometryType === "esriGeometryPolyline"){
          this.inputLayer = layer;
          this.inputType = "line";
        } else if ( layer.geometryType === "esriGeometryPoint" ) {
          this.inputLayer = layer;
          this.inputType = "point";
        }
      },
      
      _setInputLayersAttr: function(layers) {
        this.inputLayers = layers;
      },
    
      // sets the layer and layer type 
      _setLayerAttr: function( layer ) {
        if ( layer.geometryType === "esriGeometryPolygon" ) {
          this.inputType = "polygon";
        } else if (layer.geometryType === "esriGeometryPolyline"){
          this.inputType = "line";
        } else if ( layer.geometryType === "esriGeometryPoint" ) {
          this.inputType = "point";
        }
        this.inputLayer = layer;
      },
      
    
      // sets the first layer as the input layer and type 
      _setLayersAttr: function( layer ) {
        this._setLayerAttr( layer );
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
        return AnalysisUtils.validateServiceName(value, {textInput: this.outputLayerInput});
      },
      
      _setUnitsAttr: function(value) {
        this.units = value;
      },
        
      _getUnitsAttr: function() {
        this.units = this._bufferUnits.get("value");
        return this.units;
      }, 
      
      ////////////////////////////
      // Helpers
      ////////////////////////////
      _connect: function(node, evt, func){
        this._pbConnects.push(connection.connect(node, evt, func));
      }
    });
    
    
    return CreateBuffers; 
});  
    


