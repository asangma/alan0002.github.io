/******************************************
 * esri/widgets/analysis/TraceDownstream
 ******************************************/
define(
[ 
  "require",
  "../../core/declare",
  "dojo/_base/lang",
  "dojo/_base/array",
  "dojo/_base/connect",
  "dojo/_base/Color",
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
  "dijit/form/NumberSpinner",
  "dijit/form/ValidationTextBox",
  "dijit/layout/ContentPane",
  "dijit/form/ComboBox",
  "dijit/Dialog",  
  
  "../../kernel",
  "../../core/lang",
  "./AnalysisBase",
  "./_AnalysisOptions",
  "../../symbols/SimpleFillSymbol",
  "../../symbols/SimpleLineSymbol",
  "../../toolbars/draw",
  "../../PopupTemplate",
  "../../layers/FeatureLayer",
  "../../Graphic",
  "./utils",
  "./CreditEstimator", 
  "../../symbols/PictureMarkerSymbol",
  "dijit/form/HorizontalSlider",
  "dijit/form/HorizontalRule",
  "dijit/form/HorizontalRuleLabels",
  "dojo/i18n!../../nls/jsapi",
  "dojo/text!./templates/TraceDownstream.html"
], function(require, declare, lang, array, connection, Color, has, string, domStyle, domAttr, domConstruct, query, domClass, number, _WidgetBase,
   _TemplatedMixin, _WidgetsInTemplateMixin,  _OnDijitClickMixin, _FocusMixin, registry, Button, CheckBox, Dialog, Form, Select, TextBox, NumberSpinner, ValidationTextBox, ContentPane, ComboBox, esriKernel, 
   esriLang, AnalysisBase, _AnalysisOptions, SimpleFillSymbol, SimpleLineSymbol, Draw, PopupTemplate, FeatureLayer, Graphic, AnalysisUtils, CreditEstimator, PictureMarkerSymbol, HorizontalSlider, HorizontalRule, HorizontalRuleLabels, jsapiBundle, template) {
    var TraceDownstream = declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin,  _OnDijitClickMixin, _FocusMixin, _AnalysisOptions, AnalysisBase], {
      
      declaredClass: "esri.widgets.analysis.TraceDownstream",
      templateString: template,
      basePath: require.toUrl("."),
      widgetsInTemplate: true,
      
      //attributes for constructing the Tool, the names matches the REST service property names
      inputLayer: null,
      boundingPolygonLayer: null,
      outputLayerName: null,
      splitDistance: null,
      splitUnits: "Kilometers",
      maxDistance: null,
      maxDistanceUnits: "Kilometers",
      
      //general parameters
      getResultLyrInfos: false,
       
      
      i18n: null,
      
      //reference to the map to draw the bounding polygon
      map:null,

      toolName: "TraceDownstream",
      helpFileName: "TraceDownstream",
      resultParameter:"traceLayer",
      
       
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
        lang.mixin(this.i18n, jsapiBundle.findHotSpotsTool);
        lang.mixin(this.i18n, jsapiBundle.traceDownstreamTool);
        this.set("drawLayerName", this.i18n.blayerName);
        this.set("drawPointLayerName", this.i18n.pointlayerName);
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
      
      _onClose: function(undo){
        if (undo) {
          //remove FCollection layer from map
          if(this._featureLayer) {
            this.map.removeLayer(this._featureLayer);
            array.forEach(this.boundingPolygonLayers, function(lyr, index) {
              if(lyr === this._featureLayer) {
                this._boundingAreaSelect.removeOption({value:index+1, label:this._featureLayer.name});
                this.boundingPolygonLayers.splice(index, 1);
                return;
              }
            }, this);
          }
          if(this._pointfeatureLayer) {
            this.map.removeLayer(this._pointfeatureLayer);
            array.forEach(this.predictAtPointLayers, function(lyr, index) {
              if(lyr === this._pointfeatureLayer) {
                this._analysisSelect.removeOption({value:index+1, label:this._pointfeatureLayer.name});
                this.inputLayers.splice(index, 1);
                return;
              }
            }, this);
          }          
        }
        this._handleBoundingBtnChange(false);
        this._handleInputDrawPointChange(false);
        this.emit("close", {"save": !undo}); //event
      },
      
      clear: function() {
        if(this._featureLayer) {
          this.map.removeLayer(this._featureLayer);
          array.forEach(this.boundingPolygonLayers, function(lyr, index) {
            if(lyr === this._featureLayer) {
              this._boundingAreaSelect.removeOption({value:index+1, label:this._featureLayer.name});
              this.boundingPolygonLayers.splice(index, 1);
              return;
            }
          }, this);
        }
        if(this._pointfeatureLayer) {
          this.map.removeLayer(this._pointfeatureLayer);
          array.forEach(this.predictAtPointLayers, function(lyr, index) {
            if(lyr === this._pointfeatureLayer) {
              this._predictPointSelect.removeOption({value:index+1, label:this._pointfeatureLayer.name});
              this.predictAtPointLayers.splice(index, 1);
              return;
            }
          }, this);
        }        
        this._handleBoundingBtnChange(false);
        this._handleInputDrawPointChange(false);
      },
      
      _handleShowCreditsClick: function(e) {
        e.preventDefault();
        var jobParams = {};
        if(!this._form.validate()) {
          return;
        } 
        jobParams.inputLayer = JSON.stringify(AnalysisUtils.constructAnalysisInputLyrObj(this.get("inputLayer")));
        //optional params
        if(this.get("boundingPolygonLayer")) {
          jobParams.boundingPolygonLayer = JSON.stringify(AnalysisUtils.constructAnalysisInputLyrObj(this.boundingPolygonLayer));
        }
        if(this.get("maxDistance")) {
          jobParams.maximumDistance = this.get("maxDistance");
          jobParams.maxDistanceUnits = this.get("maxDistanceUnits");
        }   
        if(this.get("splitDistance")) {
          jobParams.splitDistance = this.get("splitDistance");
          jobParams.splitUnits = this.get("splitUnits");
        }           
        //outputLayer
        if(!this.returnFeatureCollection) {
          jobParams.OutputName = JSON.stringify({
            serviceProperties : {
              name: this.get("outputLayerName")
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
        
        ///////////////////////////
        //jobParams.returnFeatureCollection = this.returnFeatureCollection;
        //console.log(jobParams);
        this.getCreditsEstimate(this.toolName, jobParams).then(lang.hitch(this, function(result){
          //cost: 2.12, Total records: 2120
          this._usageForm.set("content", result);
          this._usageDialog.show();
        }));
        
      },      
      
      _handleSaveBtnClick: function(e) {
        if(!this._form.validate()) {
          return;
        } 
        
        this._saveBtn.set("disabled", true);
        //construct job params object
        var jobParams = {}, executeObj = {}, contextObj;
        jobParams.inputLayer = JSON.stringify(AnalysisUtils.constructAnalysisInputLyrObj(this.get("inputLayer")));
        if(this.get("boundingPolygonLayer")) {
          jobParams.boundingPolygonLayer = JSON.stringify(AnalysisUtils.constructAnalysisInputLyrObj(this.boundingPolygonLayer));
        }
        if(this.get("maxDistance")) {
          jobParams.maxDistance = this.get("maxDistance");
          jobParams.maxDistanceUnits = this.get("maxDistanceUnits");
        }   
        if(this.get("splitDistance")) {
          jobParams.splitDistance = this.get("splitDistance");
          jobParams.splitUnits = this.get("splitUnits");            
          this.getResultLyrInfos = true;
        }        
        
        //outputLayer
        if(!this.returnFeatureCollection) {
          jobParams.OutputName = JSON.stringify({
            serviceProperties : {
              name: this.get("outputLayerName")
            }
          });
        }
        
        if(this.showChooseExtent && !this.get("DisableExtent")) {
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
        jobParams.returnFeatureCollection = this.returnFeatureCollection;
        
        //console.log(jobParams);
        executeObj.jobParams  = jobParams;
        executeObj.itemParams = { 
          "description" :this.i18n.itemDescription,
          "tags": string.substitute(this.i18n.itemTags, {layername: this.inputLayer.name, fieldname:(!jobParams.field)? "" : jobParams.field}),
          "snippet": this.i18n.itemSnippet
        };
        if(this.showSelectFolder) {
          executeObj.itemParams.folder = this.get("folderId");
        }
        console.log(executeObj);
        //AnalysisBase submit method
        this.execute(executeObj);
      },
       
      _save: function() {},
        /*******************
       * UI Methods
       *******************/
      _buildUI: function(){
        //console.log("buildUI");
        //console.log(this.outputLayerName);
        this._loadConnections();
        this.signInPromise.then(lang.hitch(this, AnalysisUtils.initHelpLinks, this.domNode, this.showHelp, {analysisGpServer: this.analysisGpServer}));
        
        //construct the UI 
        if(this.get("showSelectAnalysisLayer")) {
          if(!this.get("inputLayer") && this.get("inputLayers")) {
            this.set("inputLayer", this.inputLayers[0]);
          }
          AnalysisUtils.populateAnalysisLayers(this, "inputLayer", "inputLayers");
        }        
        var units = [
          {value:"Miles", label: this.i18n.miles},
          {value:"Yards", label: this.i18n.yards},
          {value:"Feet", label: this.i18n.feet},
          {type:"separator"},
          {value:"Kilometers", label: this.i18n.kilometers},
          {value:"Meters", label: this.i18n.meters}
        ], 
        override = true;
        this._splitTraceUnitsSelect.addOption(units);        
        this._maxTraceUnitsSelect.addOption(units);        
                
        if(this.outputLayerName) {
          this._outputLayerInput.set("value", this.outputLayerName);
          override = false;
        }
        if(this.inputLayer) {
          //console.log(this.inputLayer.name);
          this._updateAnalysisLayerUI(override);
        }

        
        if(this.maxDistanceUnits) {
          this._maxTraceUnitsSelect.set("value", this.maxDistanceUnits);
        }
        if(this.maxDistance) {
          this._maxTraceInput.set("value", this.maxDistance);
        }   
        
        if(this.splitUnits) {
          this._splitTraceUnitsSelect.set("value", this.splitUnits);
        }
        if(this.splitDistance) {
          this._splitTraceInput.set("value", this.splitDistance);
        }          
        
        if(this.boundingPolygonLayers) {
          this._boundingAreaSelect.addOption({value:"-1", label: this.i18n.defaultBoundingOption, selected: true});
          var isSelectedLayer = false;
          array.forEach(this.boundingPolygonLayers, function(layer , index) {
            if(layer.geometryType === "esriGeometryPolygon") {
              isSelectedLayer = this.get("boundingPolygonLayer") && this.get("boundingPolygonLayer").name === layer.name;
              this._boundingAreaSelect.addOption({value:index+1, label:layer.name, selected: isSelectedLayer});
            }
          }, this);
         //console.log("during build" ,this._boundingAreaSelect.getOptions());          
        }
        AnalysisUtils.addReadyToUseLayerOption(this, [this._analysisSelect, this._boundingAreaSelect]);           
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
        //showCredits
      },
      
      _handleAnalysisLayerChange: function(value) {
        if(value === "browse") {
          if(!this._analysisquery) {
            this._analysisquery = this._browsedlg.browseItems.get("query");
          }
          this._isAnalysisSelect = true;
          this._browsedlg.browseItems.set("query", this._analysisquery + " AND tags:\"point\"");
          this._browsedlg.show();
        }
        else {
          this.inputLayer = this.inputLayers[value];
          this._updateAnalysisLayerUI(true);
        }
      },
      
      _updateAnalysisLayerUI: function(override) {
        if(this.inputLayer) {
          domAttr.set(this._interpolateToolDescription, "innerHTML", string.substitute(this.i18n.toolDefine, {layername: this.inputLayer.name}));
          if(override) {
            this.outputLayerName = string.substitute(this.i18n.outputLayerName, {layername: this.inputLayer.name});
          }
          this._outputLayerInput.set("value", this.outputLayerName);
        }
      },
      
      _handleBrowseItemsSelect: function(value) {
        if(value && value.selection) {
          AnalysisUtils.addAnalysisReadyLayer({
            item: value.selection,
            layers:  this._isAnalysisSelect? this.inputLayers : this.boundingPolygonLayers,
            layersSelect: this._isAnalysisSelect? this._analysisSelect : this._boundingAreaSelect,
            posIncrement: this._isAnalysisSelect? 0 : 1, 
            browseDialog: this._browsedlg
          }).always(lang.hitch(this, this._updateAnalysisLayerUI, true));
        }
      },      
      
      _handleBoundingSelectChange: function(value) {
        if(value === "browse") {
          if(!this._analysisquery) {
            this._analysisquery = this._browsedlg.browseItems.get("query");
          }
          this._isAnalysisSelect = false;
          this._browsedlg.browseItems.set("query", this._analysisquery + " AND tags:\"polygon\"");
          this._browsedlg.show();
        }            
        else if(value === "-1" || (this._featureLayer && this.get("boundingPolygonLayer").id === this._featureLayer.id)) {
          this._bndgPolyDrawBtn.set("disabled", false);
        }
        else {
          this._bndgPolyDrawBtn.set("disabled", true);
          this._bndgPolyDrawBtn.set("checked", false);
        }
      },
      
      _handleBoundingBtnChange : function(value) {
        //console.log("bounding btn value changed", value);
        if(value) {
          this.emit("drawtool-activate", {});
          if(!this._featureLayer) {
            this._createBoundingPolyFeatColl();
          }
          this._analysisPointDrawBtn.set("checked", false); //reset
          this._toolbar.activate(Draw.POLYGON);
        }
        else {
          this._toolbar.deactivate();
          if(!this._analysisPointDrawBtn.get("checked")) {
            this.emit("drawtool-deactivate", {});
          }
        }
      },
      
      _loadConnections: function(){
        this.on("start", lang.hitch(this, "_onClose", false));
        this._connect(this._closeBtn, "onclick", lang.hitch(this, "_onClose", true));
      },
      
      _createBoundingPolyFeatColl: function() {
        var featureCollection = AnalysisUtils.createPolygonFeatureCollection(this.drawLayerName);
        //create a feature layer based on the feature collection
        this._featureLayer = new FeatureLayer(featureCollection, {
          id: this.drawLayerName
        });
        this.map.addLayer(this._featureLayer);
        //associate the features with the popup on click
        connection.connect(this._featureLayer,"onClick",lang.hitch(this, function(evt){
           this.map.popup.setFeatures([evt.graphic]);
        }));    
      },
      
      _addFeatures: function(geometry) {
        //this.emit("drawtool-deactivate", {});
        //this._toolbar.deactivate();
        var features = [];
        var attr = {};
        var symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_NULL, 
          new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([0,0,0]), 4));
        var graphic = new Graphic(geometry, symbol);
        this.map.graphics.add(graphic);
        attr.description = "blayer desc";
        attr.title = "blayer";
        graphic.setAttributes(attr);
        features.push(graphic);
        this._featureLayer.applyEdits(features, null, null);  
        //console.log(this._featureLayer.toJSON());
        if(this.boundingPolygonLayers.length === 0 || this.boundingPolygonLayers[this.boundingPolygonLayers.length - 1] !== this._featureLayer) {
          var index = this.boundingPolygonLayers.push(this._featureLayer);
          var cOptions = this._boundingAreaSelect.getOptions();
          this._boundingAreaSelect.removeOption(cOptions);
          cOptions = array.map(cOptions, function(option) {
            option.selected = false;
            return option;
          });
          //console.log(cOptions);
          cOptions.push({value:index, label:this._featureLayer.name, selected: true});
          this._boundingAreaSelect.addOption(cOptions);
          //console.log("during draw" ,this._boundingAreaSelect.getOptions());
        }
      },
      
      _handleInputDrawPointChange: function(value) {
        if(value) {
          this.emit("drawtool-activate", {});
          if(!this._pointfeatureLayer) {
            this._createPointFeatColl();
          }
          this._pointtoolbar.activate(Draw.POINT);
          this._bndgPolyDrawBtn.set("checked", false); //reset
        }
        else {
          this._pointtoolbar.deactivate();
          if(!this._bndgPolyDrawBtn.get("checked")) {
            this.emit("drawtool-deactivate", {});
          }
        }        
      },
      
      _createPointFeatColl: function() {
        var featureCollection = AnalysisUtils.createPointFeatureCollection(this.drawPointLayerName);
        //create a feature layer based on the feature collection
        this._pointfeatureLayer = new FeatureLayer(featureCollection, {
          id: this.drawPointLayerName
        });
        this.map.addLayer(this._pointfeatureLayer);
        //associate the features with the popup on click
        connection.connect(this._pointfeatureLayer,"onClick",lang.hitch(this, function(evt){
           this.map.popup.setFeatures([evt.graphic]);
        }));    
      },      
      
      _addPointFeatures: function(geometry) {
        var features = [],
            attr = {},
            symbol = new PictureMarkerSymbol({
              "height": 24,
              "width": 24,
              "contentType": "image/png",
              "type": "esriPMS",
              "url": "http://static.arcgis.com/images/Symbols/Basic/GreenStickpin.png"
            }).setOffset(0, 12),
            graphic = new Graphic(geometry, symbol);
        this.map.graphics.add(graphic);
        attr.description = "blayer desc";
        attr.title = "blayer";
        graphic.setAttributes(attr);
        features.push(graphic);
        this._pointfeatureLayer.applyEdits(features, null, null);
        if(this.inputLayers.length === 0 || this.inputLayers[this.inputLayers.length - 1] !== this._pointfeatureLayer) {
          var index = this.inputLayers.push(this._pointfeatureLayer);
          var cOptions = this._analysisSelect.getOptions();
          this._analysisSelect.removeOption(cOptions);
          cOptions = array.map(cOptions, function(option) {
            option.selected = false;
            return option;
          });
          this._analysisSelect.addOption({value:index, label:this._pointfeatureLayer.name, selected: true});
          this._analysisSelect.addOption(cOptions);
          this._handleAnalysisLayerChange(index - 1);
        }
      },        
      
      validateServiceName: function(value) {
        return AnalysisUtils.validateServiceName(value, {textInput: this._outputLayerInput});
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
      
      _getInputLayerAttr: function() {
        return this.inputLayer;
      },
      
      _setInputLayersAttr: function(layers) {
        this.inputLayers = layers;
      },
      
      _getBoundingPolygonLayerAttr: function() {
        if(this._boundingAreaSelect) {
          this.boundingPolygonLayer = null;
          if(this._boundingAreaSelect.get("value") !== "-1") {
            this.boundingPolygonLayer = this.boundingPolygonLayers[this._boundingAreaSelect.get("value") - 1];        
          }
        }
        return this.boundingPolygonLayer;
      },
      
      _setBoundingPolygonLayerAttr: function(layer) {
        this.boundingPolygonLayer = layer;
      },
      
      _setBoundingPolygonLayersAttr: function(layers) {
        this.boundingPolygonLayers = layers;
      },
      
      
      _setSplitUnitsAttr: function(value) {
        this.splitUnits = value; 
      },
      
      _getSplitUnitsAttr: function() {
        if(this._splitTraceUnitsSelect && this._splitTraceUnitsSelect.get("value")) {
          this.splitUnits = this._splitTraceUnitsSelect.get("value");
        }
        return this.splitUnits;
      },
      
      _setSplitDistanceAttr: function(value) {
        this.splitDistance = value;
      },
      
      _getSplitDistanceAttr: function() {
        if(this._splitTraceInput && this._splitTraceInput.get("value")) {
          this.splitDistance = this._splitTraceInput.get("value");
        }
        return this.splitDistance;
      },
      
      _setMaxDistanceUnitsAttr: function(value) {
        this.maxDistanceUnits = value; 
      },
      
      _getMaxDistanceUnitsAttr: function() {
        if(this._maxTraceUnitsSelect && this._maxTraceUnitsSelect.get("value")) {
          this.maxDistanceUnits = this._maxTraceUnitsSelect.get("value");
        }
        return this.maxDistanceUnits;
      },
      
      _setMaxDistanceAttr: function(value) {
        this.maxDistance = value;
      },
      
      _getMaxDistanceAttr: function() {
        if(this._maxTraceInput && this._maxTraceInput.get("value")) {
          this.maxDistance = this._maxTraceInput.get("value");
        }
        return this.maxDistance;
      },

      _getOutputLayerNameAttr: function() {
        if(this._outputLayerInput) {
          this.outputLayerName = this._outputLayerInput.get("value");
        }
        return this.outputLayerName;
      },
      
      _setOutputLayerNameAttr: function(value) {
        this.outputLayerName = value;
      },       
      
      _setMapAttr: function(map) {
        this.map = map;  
        this._toolbar = new Draw(this.map);
        connection.connect(this._toolbar, "onDrawEnd", lang.hitch(this, this._addFeatures));
        this._pointtoolbar = new Draw(this.map);
        connection.connect(this._pointtoolbar, "onDrawEnd", lang.hitch(this, this._addPointFeatures));
        
      },
      
      _getMapAttr: function() {
        return this.map;
      },
      
      _setDrawLayerNameAttr: function(name) {
        this.drawLayerName = name;
      },
      
      _getDrawLayerNameAttr: function() {
        return this._featureLayer.name;   
      },
      
      _setDisableRunAnalysisAttr: function(value){
        this._saveBtn.set("disabled", value);
      },      
      
      _getDrawLayerAttr: function() {
        var layers = [];
        if(this._featureLayer) {
          layers.push(this._featureLayer);
        }
        if(this._pointfeatureLayer) {
          layers.push(this._pointfeatureLayer);
        }
        return layers;
      },          
      
      _setDisableExtentAttr: function(value) {
        this._useExtentCheck.set("checked", !value);
        this._useExtentCheck.set("disabled", value);
      },
      
      _getDisableExtentAttr: function() {
        this._useExtentCheck.get("disabled");
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
      
      _setDrawPointLayerNameAttr: function(name) {
        this.drawPointLayerName = name;
      },
      
      _getDrawPointLayerNameAttr: function() {
        return this._pointfeatureLayer.name;   
      },       
      
      ////////////////////////////
      // Helpers
      ////////////////////////////
      _connect: function(node, evt, func){
        this._pbConnects.push(connection.connect(node, evt, func));
      }
  });
  
  
  return TraceDownstream;   
});
