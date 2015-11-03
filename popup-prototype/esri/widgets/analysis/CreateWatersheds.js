/******************************************
 * esri/widgets/analysis/CreateWatersheds
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
  "dojo/text!./templates/CreateWatersheds.html"
], function(require, declare, lang, array, connection, Color, has, string, domStyle, domAttr, domConstruct, query, domClass, number, _WidgetBase,
   _TemplatedMixin, _WidgetsInTemplateMixin,  _OnDijitClickMixin, _FocusMixin, registry, Button, CheckBox, Dialog, Form, Select, TextBox, NumberSpinner, ValidationTextBox, ContentPane, ComboBox, esriKernel, 
   esriLang, AnalysisBase, _AnalysisOptions, SimpleFillSymbol, SimpleLineSymbol, Draw, PopupTemplate, FeatureLayer, Graphic, AnalysisUtils, CreditEstimator, PictureMarkerSymbol, HorizontalSlider, HorizontalRule, HorizontalRuleLabels, jsapiBundle, template) {
    var CreateWatersheds = declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin,  _OnDijitClickMixin, _FocusMixin, _AnalysisOptions, AnalysisBase], {
      
      declaredClass: "esri.widgets.analysis.CreateWatersheds",
      templateString: template,
      basePath: require.toUrl("."),
      widgetsInTemplate: true,
      
      //attributes for constructing the Tool, the names matches the REST service property names
      inputLayer: null,
      searchDistance: null,
      searchUnits: "Meters",
      outputLayerName: null,
      
      //general parameters
      i18n: null,
      
      //reference to the map to draw the bounding polygon
      map:null,

      toolName: "CreateWatersheds",
      helpFileName: "CreateWatersheds",
      resultParameter:["watershedLayer", "snapPourPtsLayer"],
      
       
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
        lang.mixin(this.i18n, jsapiBundle.createWatershedTool);
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
        if(undo) {
          if(this._pointfeatureLayer) {
            this.map.removeLayer(this._pointfeatureLayer);
            array.forEach(this.inputLayers, function(lyr, index) {
              if(lyr === this._pointfeatureLayer) {
                this._analysisSelect.removeOption({value:index+1, label:this._pointfeatureLayer.name});
                this.inputLayers.splice(index, 1);
                return;
              }
            }, this);
          }
        }        
        this._handleInputDrawPointChange(false);
        this.emit("close", {"save": !undo}); //event
      },
      
      clear: function() {
        if(this._pointfeatureLayer) {
          this.map.removeLayer(this._pointfeatureLayer);
          array.forEach(this.inputLayers, function(lyr, index) {
            if(lyr === this._pointfeatureLayer) {
              this._analysisSelect.removeOption({value:index+1, label:this._pointfeatureLayer.name});
              this.inputLayers.splice(index, 1);
              return;
            }
          }, this);
        }
        this._handleInputDrawPointChange(false);        
      },
      
      _handleShowCreditsClick: function(e) {
        e.preventDefault();
        var jobParams = {};
        if(!this._form.validate()) {
          return;
        } 
        jobParams.inputLayer = JSON.stringify(AnalysisUtils.constructAnalysisInputLyrObj(this.get("inputLayer")));
        jobParams.searchDistance = this.get("searchDistance");
        jobParams.searchUnits = this.get("searchUnits");
        //outputLayer
        if(!this.returnFeatureCollection) {
          jobParams.OutputName = JSON.stringify({
            serviceProperties : {
              name: this.get("outputLayerName")
            }
          });
        }
        if(this.showChooseExtent) {
          if(this._useExtentCheck.get("checked")) {
            jobParams.context = JSON.stringify({
              //outSr: this.map.spatialReference,
              extent: this.map.extent._normalize(true)
            });
          }
        }        
        this.getCreditsEstimate(this.toolName, jobParams).then(lang.hitch(this, function(result){
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
        jobParams.searchDistance = this.get("searchDistance");
        jobParams.searchUnits = this.get("searchUnits");
        //outputLayer
        if(!this.returnFeatureCollection) {
          jobParams.OutputName = JSON.stringify({
            serviceProperties : {
              name: this.get("outputLayerName")
            }
          });
        }
        if(this.showChooseExtent && !this.get("disableExtent")) {
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
        var override = true;
        this._loadConnections();
        this.signInPromise.then(lang.hitch(this, AnalysisUtils.initHelpLinks, this.domNode, this.showHelp, {analysisGpServer: this.analysisGpServer}));
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
          //console.log(this.inputLayer.name);
          this._updateAnalysisLayerUI(override);
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
        this._distanceUnitsSelect.addOption([
          {value:"Miles", label: this.i18n.miles},
          {value:"Yards", label: this.i18n.yards},
          {value:"Feet", label: this.i18n.feet},
          {type:"separator"},
          {value:"Kilometers", label: this.i18n.kilometers},
          {value:"Meters", label: this.i18n.meters}
        ]);
        if(this.searchUnits) {
          this._distanceUnitsSelect.set("value", this.searchUnits);
        }
        if(this.searchDistance) {
          this._searchDistanceInput.set("value", this.searchDistance);
        }        
      },
      
      _loadConnections: function(){
        this.on("start", lang.hitch(this, "_onClose", false));
        this._connect(this._closeBtn, "onclick", lang.hitch(this, "_onClose", true));
      },
      
      _handleAnalysisLayerChange: function(value) {
        if(value === "browse") {
          if(!this._analysisquery) {
            this._analysisquery = this._browsedlg.browseItems.get("query");
          }        
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
            layers:  this.inputLayers,
            layersSelect: this._analysisSelect,
            browseDialog: this._browsedlg
          }).always(lang.hitch(this, this._updateAnalysisLayerUI, true));
        }
      },
            
      
      _handleInputDrawPointChange: function(value) {
        if(value) {
          this.emit("drawtool-activate", {});
          if(!this._pointfeatureLayer) {
            this._createPointFeatColl();
          }
          this._pointtoolbar.activate(Draw.POINT);
        }
        else {
          this._pointtoolbar.deactivate();
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
      
      _setInputLayersAttr: function(layers) {
        this.inputLayers = layers;
      },
      
      //sets the input layer
      _setInputLayerAttr: function(layer) {
        this.inputLayer = layer;
      },
      
      _getInputLayerAttr: function() {
        return this.inputLayer;
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
        this._pointtoolbar = new Draw(this.map);
        connection.connect(this._pointtoolbar, "onDrawEnd", lang.hitch(this, this._addPointFeatures));
        
      },
      
      _getMapAttr: function() {
        return this.map;
      },

      _setDisableRunAnalysisAttr: function(value){
        this._saveBtn.set("disabled", value);
      },
      
      _setDisableExtentAttr: function(value) {
        this._useExtentCheck.set("checked", !value);
        this._useExtentCheck.set("disabled", value);
      },
      
      _getDisableExtentAttr: function() {
        this._useExtentCheck.get("disabled");
      },
      
      _setSearchUnitsAttr: function(value) {
        this.searchUnits = value; 
      },
      
      _getSearchUnitsAttr: function() {
        if(this._distanceUnitsSelect && this._distanceUnitsSelect.get("value")) {
          this.searchUnits = this._distanceUnitsSelect.get("value");
        }
        return this.searchUnits;
      },
      
      _setSearchDistanceAttr: function(value) {
        this.searchDistance = value;
      },
      
      _getSearchDistanceAttr: function() {
        if(this._searchDistanceInput && this._searchDistanceInput.get("value")) {
          this.searchDistance = this._searchDistanceInput.get("value");
        }
        return this.searchDistance;
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
      ////////////////////////////
      // Helpers
      ////////////////////////////
      _connect: function(node, evt, func){
        this._pbConnects.push(connection.connect(node, evt, func));
      }
  });
  
  
  return CreateWatersheds;   
});
