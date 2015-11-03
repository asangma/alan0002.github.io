/******************************************
 * esri/widgets/analysis/OverlayLayers
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
  "dijit/form/Select",
  "dijit/form/TextBox",
  "dijit/form/ValidationTextBox",
  "dijit/layout/ContentPane",
  "dijit/form/ComboBox",
  
  "../../kernel",
  "./AnalysisBase",
  "./_AnalysisOptions",
  "./CreditEstimator",
  "./AnalysisToggleButton",
  "./GroupToggleButton",
  "./utils",  
  "dojo/i18n!../../nls/jsapi",
  "dojo/text!./templates/OverlayLayers.html"
  
], function(require, declare, lang, array, connection, fx, has, string, domStyle, domAttr, domConstruct, query, domClass, easing, _WidgetBase,
   _TemplatedMixin, _WidgetsInTemplateMixin,  _OnDijitClickMixin, _FocusMixin, registry, Button, CheckBox, Form, Select, TextBox, ValidationTextBox, ContentPane, ComboBox, esriKernel, AnalysisBase, _AnalysisOptions, CreditEstimator, AnalysisToggleButton, GroupToggleButton,  AnalysisUtils, jsapiBundle, template) {

    var OverlayLayers = declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin,  _OnDijitClickMixin, _FocusMixin, _AnalysisOptions, AnalysisBase], {
      declaredClass: "esri.widgets.analysis.OverlayLayers",
  
      templateString: template,
      basePath: require.toUrl("."),
      
      widgetsInTemplate: true,
      //attributes for constructing the Tool, the names matches the REST service property names
      // used in setting up the UI and during re run to construct the UI
      
      //if input type is points or lines, Only Intersect is enabled.
      inputLayer: null,
      
      //overlay layer polygon 
      overlayLayer: null,
      
      //Union Erase
      overlayType: "intersect",
      
      tolerance: 0.0,
      
      snapToInput: false,
      
      //output feature layer
      outputLayerName: null,
      // the type of intersections
      //[ Input, Point, Line ]
      outputType: "Input", 
      
      i18n: null,
      
      toolName: "OverlayLayers",
      helpFileName: "OverlayLayers",
      resultParameter:"Outputlayer",
    
     
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
        lang.mixin(this.i18n, jsapiBundle.overlayLayersTool);
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
      
      _handleSaveBtnClick: function(e) {
        //console.log("Call Success Submit Job");
        //construct job params object
        if(!this._form.validate()) {
          return;
        }

        this._saveBtn.set("disabled", true);
        var jobParams = {}, executeObj = {}, contextObj;
        jobParams.InputLayer = JSON.stringify(AnalysisUtils.constructAnalysisInputLyrObj(this.inputLayer));
        if(this._overlayFeaturesSelect.get("value") !== "0") {
          var layer = this.overlayLayer[this._overlayFeaturesSelect.get("value") -1];
          jobParams.OverlayLayer = JSON.stringify(AnalysisUtils.constructAnalysisInputLyrObj(layer));
        }
        jobParams.OverlayType = this.get("overlayType");
        //outputLayer
        if(!this.returnFeatureCollection) {
          jobParams.OutputName = JSON.stringify({
            serviceProperties : {
              name: this._outputLayerInput.get("value")
            }
          });
        }
        jobParams.Tolerance = this.tolerance;
        jobParams.SnapToInput  = this.snapToInput;
        if(this.get("OverlayType") === "intersect"){
          jobParams.outputType = this._outputTypeSelect.get("value");
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
        console.log(jobParams);
         
        executeObj.jobParams  = jobParams;
        executeObj.itemParams = { 
          "description" :this.i18n.itemDescription,
          "tags": string.substitute(this.i18n.itemTags, {layername: this.inputLayer.name}),
          "snippet": this.i18n.itemSnippet
        };
        if(this.showSelectFolder) {
          executeObj.itemParams.folder = this.get("folderId");
        }        
        //alert(JSON.stringify(executeObj));
        //AnalysisBase submit method
       this.execute(executeObj);
    
      },
      
      _handleShowCreditsClick: function(e) {
        e.preventDefault();
        ////////////////////////////
        var jobParams = {};
        if(!this._form.validate()) {
          return;
        }

        jobParams.InputLayer = JSON.stringify(AnalysisUtils.constructAnalysisInputLyrObj(this.inputLayer));
        if(this._overlayFeaturesSelect.get("value") !== "0") {
          var layer = this.overlayLayer[this._overlayFeaturesSelect.get("value") -1];
          jobParams.OverlayLayer = JSON.stringify(AnalysisUtils.constructAnalysisInputLyrObj(layer));
        }
        jobParams.OverlayType = this.get("overlayType");
        //outputLayer
        if(!this.returnFeatureCollection) {
          jobParams.OutputName = JSON.stringify({
            serviceProperties : {
              name: this._outputLayerInput.get("value")
            }
          });
        }
        jobParams.Tolerance = this.tolerance;
        jobParams.SnapToInput  = this.snapToInput;
        if(this.get("OverlayType") === "intersect"){
          jobParams.outputType = this._outputTypeSelect.get("value");
        }
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
        
        this.getCreditsEstimate(this.toolName, jobParams).then(lang.hitch(this, function(result){
          //cost: 2.12, Total records: 2120
          this._usageForm.set("content", result);
          this._usageDialog.show();
        }));
                                
        
       },
       
       
       _save: function() {},
       
       _sortbyGeometryType: function(a, b) {
         if(a.geometryType === "esriGeometryPolygon") {
           return -1;
         }
         else if(b.geometryType === "esriGeometryPolygon") {
           return 1;
         }
         else if(a.geometryType === "esriGeometryPolyline") {
           return -1;
         }
         else if(b.geometryType === "esriGeometryPolyline") {
           return 1;
         }
         else if(a.geometryType === "esriGeometryPoint") {
           return -1;
         }
         else if(b.geometryType === "esriGeometryPoint") {
           return 1;
         }
       },
      /*******************
       * UI Methods
       *******************/
      _buildUI: function(){
        //console.log("buildUI");
        //console.log(this.outputLayerName);
        var override = true;
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
          this._updateAnalysisLayerUI(override);
        }
       AnalysisUtils.addReadyToUseLayerOption(this, [this._analysisSelect, this._overlayFeaturesSelect]);          
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
          domAttr.set(this._overlaylayersToolDescription, "innerHTML", string.substitute(this.i18n.overlayDefine, {layername: this.inputLayer.name}));
        }
        if(this.overlayLayer) {
          this.overlayLayer.sort(lang.hitch(this, this._sortbyGeometryType));
          //add them to the select box
          this._overlayFeaturesSelect.removeOption(this._overlayFeaturesSelect.getOptions());
          var options = [];
          array.forEach(this.overlayLayer, function(layer , index) {
            if(this.inputLayer !== layer  &&  (layer.geometryType === "esriGeometryPolygon" || layer.geometryType === "esriGeometryPoint" || layer.geometryType === "esriGeometryPolyline")) {
              options.push({value:index+1, label:layer.name});
            }
          }, this);
          this._overlayFeaturesSelect.addOption(options);
          this._handleLayerChange(this._overlayFeaturesSelect.get("value"));
        }
        if(this.overlayType) {
          if(this.overlayType === "intersect") {
            this._intersectBtn.set("checked", true);
            this._handleIntersectBtnClick();
          }
          else if(this.overlayType === "union") {
            this._unionBtn.set("checked", true);
            this._handleUnionBtnClick();
          }
          else if(this.overlayType === "erase") {
            this._eraseBtn.set("checked", true);
            this._handleEraseBtnClick();
          }
        }   
        if(this.outputType) {
          this._outputTypeSelect.set("value", this.outputType);
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
          this._updateAnalysisLayerUI(true);
        }
      },
      
    
      _handleBrowseItemsSelect: function(value) {
        if(value && value.selection) {
          AnalysisUtils.addAnalysisReadyLayer({
            item: value.selection,
            layers:  this._isAnalysisSelect? this.inputLayers : this.overlayLayer,
            layersSelect: this._isAnalysisSelect? this._analysisSelect : this._overlayFeaturesSelect,
            browseDialog: this._browsedlg
          }).always(lang.hitch(this, this._updateAnalysisLayerUI, true));
        }
      },
         
      
      _loadConnections: function(){
        this.on("start", lang.hitch(this, "_onClose", true));
        this._connect(this._closeBtn, "onclick", lang.hitch(this, "_onClose", false));
        if(this.showReadyToUseLayers) {
          this.own(this._browsedlg.browseItems.on("select-change", lang.hitch(this, this._handleBrowseItemsSelect)));
        }         
      },
      
      //to simplify this method
      _handleLayerChange: function(value) {
        var layer, isEraseDisabled , isUnionDisabled, overlayType;
        if(value === "browse") {
          if(!this._analysisquery) {
            this._analysisquery = this._browsedlg.browseItems.get("query");
          }
          this._browsedlg.browseItems.set("query", this._analysisquery);
          this._isAnalysisSelect = false;
          this._browsedlg.show();
        }
        else {
          layer = this.overlayLayer[value -1];
          isEraseDisabled = false;
          overlayType = this.get("overlayType");
          isUnionDisabled = (this.inputLayer.geometryType !==  "esriGeometryPolygon" || layer.geometryType !== "esriGeometryPolygon");
          if(layer) {
            //• Union:  Disable when either input layer or the overlay layer are not Polygons.
            this._unionBtn.set("disabled", isUnionDisabled);
            this._unionBtn.set("iconClass",  isUnionDisabled? "unionLayersDisabledIcon": "unionLayersIcon");
            //Erase:   Disable when the Input Layer is Polygon but the Overlay Layer is Point or Polyline.
            if(this.inputLayer.geometryType ===  "esriGeometryPolygon"){
              isEraseDisabled = (this.inputLayer.geometryType ===  "esriGeometryPolygon" && layer.geometryType !== "esriGeometryPolygon");
            }
            else if(this.inputLayer.geometryType ===  "esriGeometryPolyline"){
            //• Erase:  Disable when the Input Layer is Polyline but the Overlay Layer is Point.
              isEraseDisabled = (this.inputLayer.geometryType ===  "esriGeometryPolyline" && layer.geometryType === "esriGeometryPoint");
            }
            else if(this.inputLayer.geometryType ===  "esriGeometryPolyline") {
              isEraseDisabled = true;
            }
            this._eraseBtn.set("disabled",  isEraseDisabled);
            this._eraseBtn.set("iconClass",  isEraseDisabled? "eraseLayersDisabledIcon": "eraseLayersIcon");

            if(overlayType === "union" && (this.inputLayer.geometryType !==  "esriGeometryPolygon" || layer.geometryType !== "esriGeometryPolygon")) {
              this._showMessages(this.i18n.overlayLayerPolyMsg);
              this._intersectBtn.set("checked", true);
              this._handleIntersectBtnCtrClick();
            }
            else if(overlayType === "erase" && (this.inputLayer.geometryType ===  "esriGeometryPolyline" && layer.geometryType === "esriGeometryPoint")) {
              this._showMessages(this.i18n.notSupportedEraseOverlayMsg);
              this._intersectBtn.set("checked", true);
              this._handleIntersectBtnCtrClick();
            }
            else if(overlayType === "erase" && (this.inputLayer.geometryType ===  "esriGeometryPolygon" && layer.geometryType !== "esriGeometryPolygon")) {
              //alert("This Overlay layer is not supported for Erase overlay. Defaults to Intersect overlay.");
              this._showMessages(this.i18n.notSupportedEraseOverlayMsg);
              this._intersectBtn.set("checked", true);
              this._handleIntersectBtnCtrClick();
            }     
            else if(overlayType === "intersect") {
              this._handleIntersectBtnCtrClick();
            }
            else if(overlayType === "union"){
             this._handleUnionBtnCtrClick(); 
            }
            else if(overlayType === "erase") {
              this._handleEraseBtnClick();
            }
          }
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
        window.setTimeout(lang.hitch(this, this._handleCloseMsg), 3000);
            
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
      
      
      _updateOutputType: function() {
        var overlayLayer, isPoint;
        if(this._overlayFeaturesSelect.get("value") !== "0") {
          overlayLayer= this.overlayLayer[this._overlayFeaturesSelect.get("value") -1];
        }
        isPoint = this.inputLayer.geometryType === "esriGeometryPoint" || this.inputLayer.geometryType === "esriGeometryMultipoint" || overlayLayer.geometryType === "esriGeometryPoint" || overlayLayer.geometryType === "esriGeometryMultipoint" ;
        domStyle.set(this._outputTypeTable, "display", "table");
        this._outputTypeSelect.removeOption(this._outputTypeSelect.getOptions());
        this._outputTypeSelect.set("disabled", isPoint);
        if(isPoint) {
          domClass.add(this._outputTypeLabel, "esriAnalysisTextDisabled");
        }
        else {
          domClass.remove(this._outputTypeLabel, "esriAnalysisTextDisabled");
        }        
        
        if (isPoint) {
          this._outputTypeSelect.addOption({
            value:"Input",
            label:this.i18n.points
          });
        }
        else if(this.inputLayer.geometryType === "esriGeometryPolyline" && overlayLayer.geometryType === "esriGeometryPolyline") {
          this._outputTypeSelect.addOption([{
            value:"Point",
            label:this.i18n.points,
            selected: true
          },
          {
            value:"Input",
            label:this.i18n.lines
          }]);
        }
        else if(this.inputLayer.geometryType === "esriGeometryPolygon" && overlayLayer.geometryType === "esriGeometryPolygon") {
          this._outputTypeSelect.addOption([{
            value:"Point",
            label:this.i18n.points
          },
          {
            value:"Line",
            label:this.i18n.lines
          },
          {
            value:"Input",
            label:this.i18n.areas,
            selected: true
          }]);          
        }
        else if(this.inputLayer.geometryType === "esriGeometryPolyline" && overlayLayer.geometryType === "esriGeometryPolygon") {
          this._outputTypeSelect.addOption([{
            value:"Point",
            label:this.i18n.points,
            selected: true
          },
          {
            value:"Input",
            label:this.i18n.lines
          }]);          
        }        
        else if(this.inputLayer.geometryType === "esriGeometryPolygon" && overlayLayer.geometryType === "esriGeometryPolyline") {
          this._outputTypeSelect.addOption([{
            value:"Point",
            label:this.i18n.points,
            selected: true
          },
          {
            value:"Input",
            label:this.i18n.lines
          }]);          
        }        
      },
      
      _handleUnionBtnCtrClick: function() {
        this._unionBtnCtr.set("checked", true);
        this._unionBtn.set("checked", true);
        domStyle.set(this._outputTypeTable, "display", "none");
        this._outputTypeSelect.set("disabled", true);
        domClass.add(this._outputTypeLabel, "esriAnalysisTextDisabled");
        this._handleUnionBtnClick();
      },
      
      _handleIntersectBtnCtrClick: function() {
        var overlayLayer;
        this._intersectBtnCtr.set("checked", true);
        this._intersectBtn.set("checked", true);
        overlayLayer = this.overlayLayer[this._overlayFeaturesSelect.get("value") - 1];
        this._handleIntersectBtnClick();
        this._updateOutputType();
      },
      
      _handleEraseBtnCtrClick: function() {
        this._eraseBtnCtr.set("checked", true);
        this._eraseBtn.set("checked", true);
        domStyle.set(this._outputTypeTable, "display", "none");
        this._outputTypeSelect.set("disabled", true);
        domClass.add(this._outputTypeLabel, "esriAnalysisTextDisabled");
        this._handleEraseBtnClick();
      },
        
      _handleUnionBtnClick : function(value){
        if(this._overlayFeaturesSelect.get("value") === "browse") {
          return;
        }        
        var olayerName =  this.overlayLayer[this._overlayFeaturesSelect.get("value") - 1].name;
        this._outputLayerInput.set("value", string.substitute(this.i18n.unionOutputLyrName,  {layername: this.inputLayer.name, overlayname: olayerName}));
        this._unionBtn.focus();
        this.set("OverlayType", "union");
      },
      
      _handleEraseBtnClick : function(value){
        if(this._overlayFeaturesSelect.get("value") === "browse") {
          return;
        }
        var olayerName =  this.overlayLayer[this._overlayFeaturesSelect.get("value") - 1].name;
        this._eraseBtn.focus();
        this._outputLayerInput.set("value", string.substitute(this.i18n.eraseOutputLyrName,  {layername: this.inputLayer.name, overlayname: olayerName}));
        this.set("OverlayType", "erase");
      },
      
      _handleIntersectBtnClick : function(value){
        if(this._overlayFeaturesSelect.get("value") === "browse") {
          return;
        }        
         var olayerName = this.overlayLayer[this._overlayFeaturesSelect.get("value") - 1].name;
         this._intersectBtn.focus();
         this._outputLayerInput.set("value", string.substitute(this.i18n.intersectOutputLyrName,  {layername: this.inputLayer.name, overlayname:  olayerName}));
         this.set("OverlayType", "intersect");
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
    
      //sets the point layer
      _setInputLayerAttr: function(layer) {
        this.inputLayer = layer;
      },
      
      _setInputLayersAttr: function(layers) {
        this.inputLayers = layers;
      },
      
      _setOverlayLayerAttr: function(maplayers) {
        //console.log("inside polygn", maplayers);
        this.overlayLayer = maplayers;
      },
      
      _setOverlayTypeAttr: function(type) {
        //console.log("inside polygn", maplayers);
        this.overlayType = type;
      },
      _getOverlayTypeAttr: function() {
        return this.overlayType;
      },
      
      _setDisableRunAnalysisAttr: function(value){
        this._saveBtn.set("disabled", value);
      },
          
      _setOutputTypeAttr: function(map) {
        this.outputType = map;  
      },
      
      _getOutputTypeAttr: function() {
        return this.outputType;
      },    
                         
      validateServiceName: function(value) {
        return AnalysisUtils.validateServiceName(value, {textInput: this._outputLayerInput});
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
  
    
    
    return OverlayLayers;  
  
});  

