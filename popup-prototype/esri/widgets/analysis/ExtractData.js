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
  "dojo/dom-class",
  "dojo/number",
  "dojo/date/locale",
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
  "dijit/form/ToggleButton",
  "dijit/form/ValidationTextBox",
  "dijit/layout/ContentPane",
  "dijit/form/ComboBox",
  "dijit/form/RadioButton",
  "dijit/Dialog",
  "dojox/form/CheckedMultiSelect",
  
  "../../kernel",
  "../../core/lang",
  "./AnalysisBase",
  "./_AnalysisOptions",
  "./CreditEstimator",
  "../../geometry/support/jsonUtils",
  "../../toolbars/draw",
  "../../Graphic",
  "../../layers/FeatureLayer",
  "./utils",
  "../../geometry/Point",
  "../../geometry/Polyline",
  "../../geometry/Polygon",
  "../../geometry/Multipoint",
  "../../geometry/Extent",
  "../../symbols/SimpleFillSymbol",
  "../../symbols/SimpleLineSymbol",
  "../../geometry/SpatialReference",
  "dojo/i18n!../../nls/jsapi",
  "dojo/text!./templates/ExtractData.html"
], function(require, declare, lang, array, Color, connection, fx, has, string, domStyle, domAttr, domConstruct, query, domClass, number, locale, easing, _WidgetBase,
  _TemplatedMixin, _WidgetsInTemplateMixin,  _OnDijitClickMixin, _FocusMixin, registry, Button, CheckBox, Form, Select, TextBox, ToggleButton, ValidationTextBox, ContentPane, ComboBox, RadioButton, Dialog,
  CheckedMultiSelect, esriKernel, esriLang, AnalysisBase, _AnalysisOptions, CreditEstimator, jsonUtils, Draw, Graphic, FeatureLayer,
  AnalysisUtils, Point, Polyline, Polygon, Multipoint, Extent, SimpleFillSymbol, SimpleLineSymbol, SpatialReference, jsapiBundle, template) {
  var ExtractData = declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin,  _OnDijitClickMixin, _FocusMixin, AnalysisBase, _AnalysisOptions], {
    declaredClass: "esri.widgets.analysis.ExtractData",

    templateString: template,
    basePath: require.toUrl("."),      
    widgetsInTemplate: true,
    clip: false,
    dataFormat: "CSV",    
    //attributes for constructing the Tool, the names matches the REST service property names
    // used in setting up the UI and during re run to construct the UI
    
    inputLayers: null,
    featureLayers: null,
    
    
    //output feature layer
    outputLayerName: null,
    
    i18n: null,
    
    toolName: "ExtractData",
    helpFileName: "ExtractData",
    resultParameter:"contentID",
  
   
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
      this.i18n = {};
      lang.mixin(this.i18n, jsapiBundle.common);
      lang.mixin(this.i18n, jsapiBundle.analysisTools);
      lang.mixin(this.i18n, jsapiBundle.extractDataTool);
    },
    
    postCreate: function(){
      this.inherited(arguments);
      domClass.add(this._form.domNode, "esriSimpleForm");
      domStyle.set(this._inputLayersSelect.selectNode, "width", "90%");
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
    
    clear: function() {
      if(this._extentArea) {
        this.map.graphics.remove(this._extentArea);
        this._extentArea = null;
      }
      if(this._featureLayer) {
        this.map.removeLayer(this._featureLayer);
        this._featureLayer = null;
      }
      this._toolbar.deactivate();
    },
    
    _buildJobParams: function() {
      var jobParams = {}, inputLayers, layers, features = [];
      //console.log(this._inputLayersSelect.get("SelectedOptions"));
      //console.log(this._inputLayersSelect.get("value"));
      
      layers = array.map(this._inputLayersSelect.get("value"), function(value){
        return this.featureLayers[parseInt(value, 10)];
      }, this);
      inputLayers = [];
      inputLayers = array.map(layers, function(layer) {
        return JSON.stringify(AnalysisUtils.constructAnalysisInputLyrObj(layer));
      }, this);
      jobParams.InputLayers = inputLayers;
      jobParams.Clip = this.get("clip");
      jobParams.DataFormat = this._dataFormatSelect.get("value");
      //extent set from the UX
      if(this._extentSelect.get("value") !== "-1" || this._extentArea) {
        //jobParams.Extent = this.get("extent");  
        if(this._extentArea) {
          if(!this._featureLayer) {
            this._featureLayer = this._createBoundingPolyFeatColl();
            this.map.addLayer(this._featureLayer);
          }
          features.push(this._extentArea);
          this._featureLayer.applyEdits(features, null, null); 
          //console.log(this._featureLayer.toJSON());
          //console.log(this._featureLayer);
          jobParams.Extent = JSON.stringify(AnalysisUtils.constructAnalysisInputLyrObj(this._featureLayer));
        }
        else {
          jobParams.Extent = JSON.stringify(AnalysisUtils.constructAnalysisInputLyrObj(this.featureLayers[parseInt(this._extentSelect.get("value"), 10) - 1]));
        }
        jobParams.context = JSON.stringify({
          extent: this.get("extent")
        });
      }
      // use map extent
      else {
        var  symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_NULL, 
        new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([0,0,0]), 4)),
          extentLayer = this._createBoundingPolyFeatColl(),
          nExt = this.map.extent._normalize(true),
          extentPoly = new Polygon(nExt.spatialReference);
          extentPoly.addRing([[nExt.xmin, nExt.ymin], [nExt.xmin, nExt.ymax], 
                              [nExt.xmax, nExt.ymax], [nExt.xmax, nExt.ymin],
                              [nExt.xmin, nExt.ymin]
                             ]);          
        extentLayer.add(new Graphic(extentPoly, symbol));
        jobParams.Extent = JSON.stringify(AnalysisUtils.constructAnalysisInputLyrObj(extentLayer));
        //jobParams.Extent = this.map.extent._normalize(true);  
        jobParams.context = JSON.stringify({
          extent: this.map.extent._normalize(true)
        });        
      }
      //outputLayer
      jobParams.OutputName = JSON.stringify({
        itemProperties : {
          title: this._outputLayerInput.get("value"),
          description :this.i18n.itemDescription,
          tags: this.i18n.itemTags,
          snippet: this.i18n.itemSnippet,
          folderId: this._webMapFolderSelect.item ? this.folderStore.getValue(this._webMapFolderSelect.item, "id") : ""
        }
      });
      //console.log(jobParams);
      return jobParams;
    },
    
    _handleShowCreditsClick: function(e) {
      var jobParams = {};
      e.preventDefault();
      if(!this._form.validate()) {
        return;
      }
      jobParams = this._buildJobParams();
      jobParams.InputLayers = JSON.stringify(jobParams.InputLayers);
      this.getCreditsEstimate(this.toolName, jobParams).then(lang.hitch(this, function(result){
        //cost: 2.12, Total records: 2120
        this._usageForm.set("content", result);
        this._usageDialog.show();
      }));
    },

    
    _handleSaveBtnClick: function(e) {
      var jobParams = {}, executeObj = {};
      if(!this._form.validate()) {
        return;
      }
      this._saveBtn.set("disabled", true);
      jobParams = this._buildJobParams();
      executeObj.jobParams  = jobParams;
      //console.log(executeObj);
      if(this._featureLayer) {
        this.map.removeLayer(this._featureLayer);
        this._featureLayer = null;
      }
      if(this._extentArea) {
        this.map.graphics.remove(this._extentArea);
        this._extentArea = null;
      }
      //AnalysisBase submit method
      //console.log(executeObj);
      this.execute(executeObj);
    },
   
     _save: function() {},
     
    /*******************
     * UI Methods
     *******************/
    _buildUI: function(){
      //console.log("buildUI");
      //console.log(this.outputLayerName);
      var dateStr;
      this._loadConnections();
      this.signInPromise.then(lang.hitch(this, AnalysisUtils.initHelpLinks, this.domNode, this.showHelp, {analysisGpServer: this.analysisGpServer}));
      //construct the UI
      dateStr = locale.format(new Date(),{
        datePattern: "MMMM d yyyy",
        timePattern:"h.m.s a"
      }); 
      this._outputLayerInput.set("value", string.substitute(this.i18n.outputfileName, {datetime: dateStr}));
      if(this.outputLayerName) {
        this._outputLayerInput.set("value", this.outputLayerName);
      }      
      if(this.featureLayers) {
        this._extentSelect.addOption({value:"-1", label:this.i18n.sameAsDisplay});
        array.forEach(this.featureLayers, function(layer , index) {
          //console.log((this.featureLayers && array.indexOf(this.inputLayers, layer)!== -1));
          this._inputLayersSelect.addOption({
            value:index, 
            label:layer.name, 
            selected: (this.featureLayers && array.indexOf(this.inputLayers, layer)!== -1) 
          });
          this._extentSelect.addOption({value:index + 1, label: string.substitute(this.i18n.sameAsLayer,  {layername: layer.name} )});
        }, this);
      }
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
      if(this.clip) {
        this._clipRadioBtn.set("value", this.clip);
      }
      if(this.dataFormat) {
        this._dataFormatSelect.set("value", this.dataFormat);
      }      
    },
    
    _loadConnections: function(){
      this.on("start", lang.hitch(this, "_onClose", true));
      this._connect(this._closeBtn, "onclick", lang.hitch(this, "_onClose", false));
    },
    
    _handleDataFormatSelectChange: function() {
      var layer, isAreaLineSelected, dataformat;
      isAreaLineSelected = false;
      dataformat = this._dataFormatSelect.get("value"); 
      if(dataformat === "CSV") {
        isAreaLineSelected = array.some(this._inputLayersSelect.get("value"), function(value){
          layer = this.featureLayers[parseInt(value, 10)];
          return (layer.geometryType === "esriGeometryPolyline" || layer.geometryType === "esriGeometryPolygon");
        }, this);
        if(isAreaLineSelected) {
          this._showMessages(this.i18n.linesCSVValidationMsg);
          this.set("disableRunAnalysis", true);
        }
        else {
          this._handleCloseMsg();
          this.set("disableRunAnalysis", false);
        }
      }
      else {
        this._handleCloseMsg();
        this.set("disableRunAnalysis", false);
      }
    },
    
    _handleExtentSelectChange: function(value) {
      var selectedExtentLayer, selectedJSFlayer;
      this._drawExtentBtn.set("disabled", this._extentSelect.get("value") !== "-1");
      if(this._extentArea) {
        this.map.graphics.remove(this._extentArea);
        this._extentArea = null;
        this._extentSelect.updateOption({
          value: "-1",
          label: this.i18n.sameAsDisplay
        });        
      }
      if (value !== "-1") {
        selectedExtentLayer = this.featureLayers[parseInt(value - 1, 10)].toJSON();
        //console.log(selectedExtentLayer); 
        selectedJSFlayer = this.featureLayers[parseInt(value - 1, 10)];
        //console.log(selectedJSFlayer);
        this.set("extent", esriLang.isDefined(selectedExtentLayer.layerDefinition.extent)? selectedExtentLayer.layerDefinition.extent : this._getLayerFullExtent(selectedJSFlayer));
      }
      else {
        this.set("extent", this.map.extent._normalize(true));
      } 
    },
    
    _getLayerFullExtent: function(layer){
      var extent = null;
      array.forEach(layer.graphics, function(graphic, i){
        var ext = this._getExtent(graphic.geometry);
        if (ext) {
          if (!extent) {
            extent = ext;
          } else {
            extent = extent.union(ext);
          }
        }
      }, this);
      return extent;
    },
    
    _getExtent: function(geometry){
      if (!geometry) {
        return null;
      }
      var extent = null;
      if (geometry.declaredClass === "esri.geometry.Extent") {
        extent = geometry;
      } else if (geometry.declaredClass === "esri.geometry.Point") {
        extent = new Extent(geometry.x - 0.0001, geometry.y - 0.0001, geometry.x + 0.0001, geometry.y + 0.0001, geometry.spatialReference);
      } else {
        extent = geometry.getExtent();
        if (extent) {
          // bug? wkid is null otherwise
          extent.spatialReference = new SpatialReference(geometry.spatialReference.toJSON());
        }
      }
      return extent;
    },    

    _handleExtentBtnClick : function(e) {
      e.preventDefault();
      this.emit("drawtool-activate", {});
      this._toolbar.activate(Draw.POLYGON);
      if(this._featureLayer) {
        this.map.removeLayer(this._featureLayer);
        this._featureLayer = null;
      }
      if(this._extentArea) {
        this.map.graphics.remove(this._extentArea);
        this._extentArea = null;
      }      
    },
    
    _addFeatures: function(geometry) {
      this.emit("drawtool-deactivate", {});
      //console.log(geometry);
      this._toolbar.deactivate();
      var features, attr, symbol;
      features = [];
      attr= {};
      symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_NULL, 
        new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([0,0,0]), 4));
      //get the extent(envelope) of the polygon
      this.set("extent", geometry.getExtent());
      this._extentArea = new Graphic(geometry, symbol);
      this.map.graphics.add(this._extentArea);
      this._extentSelect.updateOption({
        value: "-1",
        label: this.i18n.drawnBoundary
      });
    },
      
    
      /////getters/setters//////////
    //sets the tool gp task url
    _setExtentAttr: function(geometry) {
      this.extent = geometry;
    },
    
    _getExtentAttr: function() {
      return this.extent;
    },
    
    _setAnalysisGpServerAttr: function(url) {
      if(!url) {
        return;
      }  
      this.analysisGpServer = url;
      this.set("toolServiceUrl", this.analysisGpServer +  "/" + this.toolName);
    },
    
    _setFeatureLayersAttr: function(flayers) {
      //set only those layer that are extractable
      this.featureLayers = array.filter(flayers, function(layer) {
        //console.log("testing", layer);
        return (layer.capabilities.indexOf("Extract") !== -1);
      });
    },
    
    _getFeatureLayersAttr: function() {
      return this.featureLayers;
    },
    
    _setInputLayersAttr: function(lyrArray) {
      this.inputLayers = lyrArray;
    },
    
    _getInputLayersAttr: function() {
      this.inputLayers = array.map(this._inputLayersSelect.get("value"), function(value){
        return this.featureLayers[parseInt(value, 10)];
      }, this);
      return this.inputLayers;
    },
    
    _setClipAttr: function(value) {
      this.clip = value;
    },
    
    _getClipAttr: function() {
      this.clip = this._clipRadioBtn.get("checked"); 
      return this.clip;
    },
    
    _setDataFormatAttr: function(value) {
      this.dataFormat = value;
    },
    
    _getDataFormatAttr: function() {
      return this._dataFormatSelect.get("value");
    },
       
    _setDisableRunAnalysisAttr: function(value){
      this._saveBtn.set("disabled", value);
    },
    
    _setMapAttr: function(map) {
      this.map = map;  
      this._toolbar = new Draw(this.map);
      //default
      this.set("extent", this.map.extent._normalize(true));
      connection.connect(this._toolbar, "onDrawEnd", lang.hitch(this, this._addFeatures));      
    },
    
    _getMapAttr: function() {
      return this.map;
    },    

    _setFolderIdAttr: function(value) {
      this.folderId = value;
    },
    
    _getFolderIdAttr: function() {
      if(this._webMapFolderSelect && this.folderStore && this._webMapFolderSelect.item) {
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
    },    
    
    _createBoundingPolyFeatColl: function() {
      var featureCollection, featureLayer;
      featureCollection = {
        "layerDefinition": null,
        "featureSet": {
          "features": [],
          "geometryType": "esriGeometryPolygon"
        }
      };
      featureCollection.layerDefinition = {
        "currentVersion": 10.11,
        "copyrightText": "",
        "defaultVisibility": true,
        "relationships": [],
        "isDataVersioned": false,
        "supportsRollbackOnFailureParameter": true,
        "supportsStatistics": true,
        "supportsAdvancedQueries": true,
        "geometryType": "esriGeometryPolygon", 
        "minScale": 0,
        "maxScale": 0,     
        "objectIdField": "OBJECTID",
        "templates": [],
        "type": "Feature Layer",
        "displayField": "TITLE",
        "visibilityField": "VISIBLE",
        "name": "Boundary",
        "hasAttachments": false,
        "typeIdField": "TYPEID", 
        "capabilities": "Query",
        "allowGeometryUpdates": true,
        "htmlPopupType": "",
        "hasM": false,
        "hasZ": false,
        "globalIdField": "",
        "supportedQueryFormats": "JSON",
        "hasStaticData": false,
        "maxRecordCount": -1,
        "indexes": [],
        "types": [],     
        "drawingInfo": {
           "renderer": {
             "type": "simple",
              "symbol": {
                  "color": [
                    0,
                    0,
                    0,
                    255
                  ],
                  "outline": {
                    "color": [
                      0,
                      0,
                      0,
                      255
                    ],
                    "width": 3,
                    "type": "esriSLS",
                    "style": "esriSLSSolid"
                  },
                  "type": "esriSFS",
                  "style": "esriSFSNull"
            },
            "label": "",
            "description": ""
          },
          "transparency": 0,
          "labelingInfo": null,
          "fixedSymbols": true          
          },      
         "fields": [
                {
                  "alias": "OBJECTID",
                  "name": "OBJECTID",
                  "type": "esriFieldTypeOID",
                  "editable": false
                },
                {
                  "alias": "Title",
                  "name": "TITLE",
                  "length": 50,
                  "type": "esriFieldTypeString",
                  "editable": true
                },
                {
                  "alias": "Visible",
                  "name": "VISIBLE",
                  "type": "esriFieldTypeInteger",
                  "editable": true
                },
                {
                  "alias": "Description",
                  "name": "DESCRIPTION",
                  "length": 1073741822,
                  "type": "esriFieldTypeString",
                  "editable": true
                },
                {
                  "alias": "Type ID",
                  "name": "TYPEID",
                  "type": "esriFieldTypeInteger",
                  "editable": true
                }
              ]
      };
    
      //define a popup template
      /*popupTemplate = new PopupTemplate({
        title: "{title}",
        description:"{description}"
      });*/
      
      //create a feature layer based on the feature collection
      featureLayer = new FeatureLayer(featureCollection, {
        id: "boundary"
      });
      return featureLayer;
      //associate the features with the popup on click
      /*connection.connect(featureLayer,"onClick",lang.hitch(this, function(evt){
         this.map.infoWindow.setFeatures([evt.graphic]);
      }));*/    
    }   
 
  });
  
  
  return ExtractData; 
});  
    
