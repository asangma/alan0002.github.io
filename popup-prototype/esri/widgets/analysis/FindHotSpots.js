/******************************************
 * esri/widgets/analysis/FindHotSpots
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
  "dojo/i18n!../../nls/jsapi",
  "dojo/text!./templates/FindHotSpots.html"
], function(require, declare, lang, array, connection, Color, has, string, domStyle, domAttr, domConstruct, query, domClass, _WidgetBase,
   _TemplatedMixin, _WidgetsInTemplateMixin,  _OnDijitClickMixin, _FocusMixin, registry, Button, CheckBox, Dialog, Form, Select, TextBox, ToggleButton, ValidationTextBox, ContentPane, ComboBox, esriKernel, 
   esriLang, AnalysisBase, _AnalysisOptions, SimpleFillSymbol, SimpleLineSymbol, Draw, PopupTemplate, FeatureLayer, Graphic, AnalysisUtils, CreditEstimator, jsapiBundle, template) {
    var FindHotSpots = declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin,  _OnDijitClickMixin, _FocusMixin, _AnalysisOptions, AnalysisBase], {
      
      declaredClass: "esri.widgets.analysis.FindHotSpots",
      templateString: template,
      basePath: require.toUrl("."),
      widgetsInTemplate: true,
      
      //attributes for constructing the Tool, the names matches the REST service property names
      // used in setting up the UI and during re run to construct the UI
      //layer analyzed can be a polygon or a point
      analysisLayer: null,
       
      //The numeric field in the AnalysisLayer that will be analyzed. When the AnalysisLayer is a point FeatureLayer, 
      //rather than a field name the AnalysisField may be “NO ANALYSIS FIELD”
      analysisField: null, 
      
      //A json object of type FeatureLayer that describes the aggregation polygons to be used for aggregation.  
      //It contains either the url to a feature service layer or a feature collection.
      aggregationPolygonLayer: null,
      
      //A json object of type FeatureLayer that describes the bounding polygons to use for aggregation. 
      // It contains either the url to a feature service layer or a feature collection
      boundingPolygonLayer: null,
      
      //output feature layer
      outputLayerName: null,
      returnProcessInfo: true,// make process Info to get analysis report
      
      i18n: null,
      
      //reference to the map to draw the bounding polygon
      map:null,
      
      toolName: "FindHotSpots",
      helpFileName: "FindHotSpots",
      resultParameter:"HotSpotsResultLayer",
      
       
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
        this.set("drawLayerName", this.i18n.blayerName);
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
        }
        this._handleBoundingBtnClick(false);
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
          this._featureLayer = null;
        }
        this._boundingDrawBtn.reset();
        this._handleBoundingBtnClick(false);
      },
      
      _handleShowCreditsClick: function(e) {
        e.preventDefault();
        ////////////////////////////
        var jobParams = {}, boundingPolygonLayer, aggregationPolygonLayer;
        if(!this._form.validate()) {
          return;
        } 

        jobParams.analysisLayer = JSON.stringify(AnalysisUtils.constructAnalysisInputLyrObj(this.analysisLayer));
        if(this._analysFieldSelect.get("value") !== "0") {
          jobParams.analysisField = this._analysFieldSelect.get("value");
        }
        
        if(this._isPoint && this._analysFieldSelect.get("value") === "0") {
          if(this._boundingAreaSelect.get("value") !== "-1") {
            boundingPolygonLayer = this.boundingPolygonLayers[this._boundingAreaSelect.get("value") - 1];
            jobParams.boundingPolygonLayer = JSON.stringify(AnalysisUtils.constructAnalysisInputLyrObj(boundingPolygonLayer));
          }
          if(this._aggAreaSelect.get("value") !== "-1") {
            aggregationPolygonLayer = this.aggregationPolygonLayers[this._aggAreaSelect.get("value") - 1];
            jobParams.aggregationPolygonLayer = JSON.stringify(AnalysisUtils.constructAnalysisInputLyrObj(aggregationPolygonLayer));
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
        
        if(this.showChooseExtent && !this.get("DisableExtent")) {
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
        var jobParams = {}, executeObj = {}, boundingPolygonLayer, aggregationPolygonLayer, contextObj;
        jobParams.analysisLayer = JSON.stringify(AnalysisUtils.constructAnalysisInputLyrObj(this.analysisLayer));
        if(this.get("analysisField") !== "0") {
          jobParams.analysisField = this.get("analysisField");
        }
        
        if(this._isPoint && this._analysFieldSelect.get("value") === "0") {
          if(this._boundingAreaSelect.get("value") !== "-1") {
            boundingPolygonLayer = this.boundingPolygonLayers[this._boundingAreaSelect.get("value") - 1];
            jobParams.boundingPolygonLayer = JSON.stringify(AnalysisUtils.constructAnalysisInputLyrObj(boundingPolygonLayer));
          }
          if(this._aggAreaSelect.get("value") !== "-1") {
            aggregationPolygonLayer = this.aggregationPolygonLayers[this._aggAreaSelect.get("value") - 1];
            jobParams.aggregationPolygonLayer = JSON.stringify(AnalysisUtils.constructAnalysisInputLyrObj(aggregationPolygonLayer));
          }
        }
        if(this.get("dividedByField") !== "0") {
          jobParams.dividedByField = this.get("dividedByField");
        }
        //outputLayer
        if(!this.returnFeatureCollection) {
          jobParams.OutputName = JSON.stringify({
            serviceProperties : {
              name: this._outputLayerInput.get("value")
            }
          });
        }
        
        if(this.showChooseExtent && !this.get("DisableExtent")) {
          //console.log("showextent ux", this.showChooseExtent);
          //console.log(this._useExtentCheck.get("checked"));
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
        //jobParams.returnFeatureCollection = this.returnFeatureCollection;
        jobParams.returnProcessInfo = this.returnProcessInfo;
        //console.log(jobParams);
        executeObj.jobParams  = jobParams;
        executeObj.itemParams = { 
          "description" :this.i18n.itemDescription,
          "tags": string.substitute(this.i18n.itemTags, {layername: this.analysisLayer.name, fieldname:(!jobParams.analysisField)? "" : jobParams.analysisField}),
          "snippet": this.i18n.itemSnippet
        };
        if(this.showSelectFolder) {
          executeObj.itemParams.folder = this.get("folderId");
        }
        //console.log(executeObj);
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
        var override = true;
        this._loadConnections();
        this.signInPromise.then(lang.hitch(this, AnalysisUtils.initHelpLinks, this.domNode, this.showHelp, {analysisGpServer: this.analysisGpServer}));
        //construct the UI 
        if(this.get("showSelectAnalysisLayer")) {
          if(!this.get("allowChooseLabel") && !this.get("analysisLayer") && this.get("analysisLayers")) {
            this.set("analysisLayer", this.analysisLayers[0]);
          }
          AnalysisUtils.populateAnalysisLayers(this, "analysisLayer", "analysisLayers", {chooseLabel: this.get("allowChooseLabel")});
        }
        if(this.outputLayerName) {
          this._outputLayerInput.set("value", this.outputLayerName);
          override = false;
        }
        this._boundingAreaSelect.addOption({value:"-1", label: this.i18n.defaultBoundingOption, selected: true});
        if(this.boundingPolygonLayers) {
         array.forEach(this.boundingPolygonLayers, function(layer , index) {
           if(layer.geometryType === "esriGeometryPolygon") {
             this._boundingAreaSelect.addOption({value:index+1, label:layer.name, selected: false});
            }
         }, this);
         
         //console.log("during build" ,this._boundingAreaSelect.getOptions());          
       }
       this._aggAreaSelect.addOption({value:"-1", label: this.i18n.defaultAggregationOption, selected: true});
       if(this.aggregationPolygonLayers) {
         array.forEach(this.aggregationPolygonLayers, function(layer , index) {
           if(layer.geometryType === "esriGeometryPolygon") {
             this._aggAreaSelect.addOption({value:index+1, label:layer.name, selected: false});
            }
         }, this);      
       }
       AnalysisUtils.addReadyToUseLayerOption(this, [this._analysisSelect, this._aggAreaSelect, this._boundingAreaSelect]);         
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
        //showCredits
                
      },
      
      _updateAnalysisLayerUI: function(override) {
        if(this.analysisLayer) {
          if (this.analysisLayer.geometryType === "esriGeometryPolygon") {
            this._isPoint = false; 
            domAttr.set(this._hotspotsToolDescription, "innerHTML", string.substitute(this.i18n.hotspotsPolyDefine, {layername: this.analysisLayer.name}));
            domStyle.set(this._optionsRow, "display", "none");
            domAttr.set(this._analysisFieldHelpLink, "esriHelpTopic", "AnalysisFieldPoly");
          }
          else if (this.analysisLayer.geometryType === "esriGeometryPoint" ||this.analysisLayer.geometryType === "esriGeometryMultipoint"){
            this._isPoint = true;
            domAttr.set(this._hotspotsToolDescription, "innerHTML", string.substitute(this.i18n.hotspotsPointDefine, {layername: this.analysisLayer.name}));
            domClass.add(this._analysFieldSelect.domNode, "esriLeadingMargin1");
            domStyle.set(this._optionsRow, "display", "");
            domAttr.set(this._analysisFieldHelpLink, "esriHelpTopic", "AnalysisFieldPoint");
            if(override) {
              this.outputLayerName = string.substitute(this.i18n.outputLayerName, {layername: this.analysisLayer.name});
            }
          }
        }
        else {
          //default UI
          domStyle.set(this._optionsRow, "display", "none");
          domStyle.set(this._optionsRow, "display", "none");
          if(override) {
            this.outputLayerName = string.substitute(this.i18n.outputLayerName, {layername: ""});
          }
          this._isPoint = false;
        }
        this.set("analysisFields", this.analysisLayer);
        if(!this._isPoint) {
         this.set("dividedByFields", this.analysisLayer);  
        }
        else {
          this._handleAggAreaSelectChange();
        }
        if (this.analysisLayer && this.analysisLayer.geometryType === "esriGeometryPolygon" && override) {
          this.outputLayerName = string.substitute(this.i18n.outputLayerName, {layername: esriLang.isDefined(this._analysFieldSelect.getOptions(0)) ? this._analysFieldSelect.getOptions(0).label : ""});
        }
        this._outputLayerInput.set("value", this.outputLayerName);

      },
      
      _handleAnalysisLayerChange: function(value) {
        if(value === "browse") {
          if(!this._analysisquery) {
            this._analysisquery = this._browsedlg.browseItems.get("query");
          }
          this._browsedlg.browseItems.set("query", this._analysisquery + " AND (tags:\"point\" OR tags:\"polygon\") ");
          this._selectedwidget = 0;
          this._browsedlg.show();
        }
        else {
          if(value !== -1) {
            if(this.get("allowChooseLabel")) {
              value = value - 1;
            }
            this.analysisLayer = this.analysisLayers[value];
          }
          else {
            this.analysisLayer = null;
          }
          this._updateAnalysisLayerUI(true);
        }
      },
      
      _handleFieldChange: function(index) {
        //console.log("attribute change Success" , index);
        //console.log(this._analysFieldSelect.get("value"));
         //console.log(this._analysFieldSelect.getOptions(index).label);
        if(this._analysFieldSelect.get("value") === "0") {
          this._outputLayerInput.set("value", string.substitute(this.i18n.outputLayerName, {layername: this.analysisLayer.name}));
          if(this._isPoint) {
            domStyle.set(this._optionsRow, "display", "");
            domClass.remove(this._optionsDiv, "disabled");
            domClass.remove(this._optionsDiv, "optionsClose");
            domClass.add(this._optionsDiv, "optionsOpen");              
          }
        }
        else {
           this._outputLayerInput.set("value", string.substitute(this.i18n.outputLayerName, {layername: this._analysFieldSelect.getOptions(index).label}));
           if(this._isPoint) {
             domClass.add(this._optionsDiv, "disabled");
             domStyle.set(this._optionsRow, "display", "none");
             this._boundingAreaSelect.set("value", "-1");
             this.clear(); // clear the bounding polygon
             if (domClass.contains(this._optionsDiv, "optionsOpen")) {
               domClass.remove(this._optionsDiv, "optionsOpen");
               domClass.add(this._optionsDiv, "optionsClose");
             }
           }
        }
        this.set("analysisField", this._analysFieldSelect.get("value"));
        this.set("dividedByFields", this.analysisLayer);
      },
      
      _handleDividedByFieldChange: function(index) {},
      
      _handleBoundingSelectChange: function(value) {
        var boundingPolygonLayer;
        if(value === "browse") {
          if(!this._analysisquery) {
            this._analysisquery = this._browsedlg.browseItems.get("query");
          }
          this._browsedlg.browseItems.set("query", this._analysisquery + " AND tags:\"polygon\"");
          this._selectedwidget = 2;
          this._browsedlg.show();
        }
        else {
          if(value !== "-1") {
            boundingPolygonLayer = this.boundingPolygonLayers[this._boundingAreaSelect.get("value") - 1];
            if(boundingPolygonLayer.id !== this.drawLayerName) {
              this.clear(); 
            }
          }
          else {
            this.clear(); 
          }
        }
        this._boundingDrawBtn.reset();
      },
      
      _handleAggAreaSelectChange: function(value) {
        var isAggrSelected;
        if(value === "browse") {
          if(!this._analysisquery) {
            this._analysisquery = this._browsedlg.browseItems.get("query");
          }
          this._browsedlg.browseItems.set("query", this._analysisquery + " AND tags:\"polygon\"");
          this._selectedwidget = 1;
          this._browsedlg.show();
        }
        else {
          isAggrSelected = this._aggAreaSelect.get("value") !== "-1";
          this._boundingAreaSelect.set("disabled", isAggrSelected);
          domClass.toggle(this._boundingAreaSelect.domNode, "esriAnalysisTextDisabled", isAggrSelected);
          this._boundingDrawBtn.set("disabled", isAggrSelected);
          if(isAggrSelected) {
            this.clear(); // clear the bounding polygon
            domStyle.set(this._boundingAreaLabelRow, "display", "none");
            domStyle.set(this._boundingAreaSelectRow, "display", "none");
            this._boundingAreaSelect.set("value", "-1");
          }
          else {
            domStyle.set(this._boundingAreaLabelRow, "display", "");
            domStyle.set(this._boundingAreaSelectRow, "display", "");
            //fishnet
          }
          domClass.toggle(this._boundingDrawBtn.domNode, "esriAnalysisTextDisabled", isAggrSelected);
          this.set("dividedByFields", isAggrSelected? this.aggregationPolygonLayers[this._aggAreaSelect.get("value") - 1] : null);
        }
      },
      
      _handleBoundingBtnClick : function(value) {
        if(value) {
          this.emit("drawtool-activate", {});
          if(!this._featureLayer) {
            this._createBoundingPolyFeatColl();
          }
          this._toolbar.activate(Draw.POLYGON);
        }
        else {
          this._toolbar.deactivate();
          this.emit("drawtool-deactivate", {});
        }
      },
      
      _handleBrowseItemsSelect: function(value) {
        var params = {};

        if(value && value.selection) {
          if(esriLang.isDefined(this._selectedwidget)) {
            if(this._selectedwidget === 0) {
              params.layers = this.analysisLayers;
              params.layersSelect = this._analysisSelect;
            }
            else if(this._selectedwidget === 1) {
              params.layers = this.aggregationPolygonLayers;
              params.layersSelect = this._aggAreaSelect;
              params.posIncrement = 1;
            }
            else if(this._selectedwidget === 2) {
              params.layers = this.boundingPolygonLayers;
              params.layersSelect = this._boundingAreaSelect;
            }
            params.item = value.selection;
            params.browseDialog = this._browsedlg;
            AnalysisUtils.addAnalysisReadyLayer(params).always(lang.hitch(this, this._updateAnalysisLayerUI, true));            
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
            //console.log(option);
            return option;
          });
          //console.log(cOptions);
          cOptions.push({value:index, label:this._featureLayer.name, selected: true});
          this._boundingAreaSelect.addOption(cOptions);
          this._handleBoundingSelectChange(index);
          //console.log("during draw" ,this._boundingAreaSelect.getOptions());
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
      
      //sets the point layer
      _setAnalysisLayerAttr: function(layer) {
        this.analysisLayer = layer;
      },
      
      _getAnalysisLayerAttr: function(layer) {
        return this.analysisLayer;
      },
      
      _getAnalysisFieldAttr: function() {
        if(this._analysFieldSelect) {
          this.analysisField = this._analysFieldSelect.get("value");
        }
        return this.analysisField;
      },
      
      _setAnalysisFieldAttr: function(value) {
        this.analysisField = value;
      },
      
      _setDividedByFieldAttr: function(value) {
        this.dividedByField = value;
      },
      
      _getDividedByFieldAttr: function() {
        if(this._divideFieldSelect) {
          this.dividedByField = this._divideFieldSelect.get("value");
        }
        return this.dividedByField;
      },
      
      _setAnalysisFieldsAttr: function(layer) {
        var fields = esriLang.isDefined(layer) && esriLang.isDefined(layer.fields) ? layer.fields : [], 
            opt, selectedValue;
        if(!this._analysFieldSelect) {
          return;
        }
        this._analysFieldSelect.removeOption(this._analysFieldSelect.getOptions());
        if(this._isPoint) {
          this._analysFieldSelect.addOption({value:"0", label: this.i18n.pointCounts});  
        }
        else if(!this._isPoint && this.get("allowChooseLabel")) {
          this._analysFieldSelect.addOption({value:"0", label: this.i18n.chooseLabel});
        }
        array.forEach(fields, function(field, index) {
          if((array.indexOf(["GiZScore", "GiPValue", "Gi_Bin", layer.objectIdField], field.name) === -1) && array.indexOf(["esriFieldTypeSmallInteger", "esriFieldTypeInteger", "esriFieldTypeSingle", "esriFieldTypeDouble"], field.type) !== -1 ) {
            //console.log(field);
            opt = {
                    value:field.name, 
                    label:esriLang.isDefined(field.alias) && field.alias !== ""? field.alias : field.name
            };
            if(this.analysisField && opt.label === this.analysisField) {
              opt.selected = "selected";
              selectedValue = field.name;
            }
            //console.log(opt);
            this._analysFieldSelect.addOption(opt);
            
          }
        } , this);
        if(selectedValue) {
          this._analysFieldSelect.set("value", selectedValue);
        }
        else {
          this.set("analysisField", this._analysFieldSelect.get("value"));
        }
      },
      
      _setAnalysisLayersAttr: function(layers) {
        this.analysisLayers = layers;
      },
      
      _setDividedByFieldsAttr: function(layer) {
        var fields = esriLang.isDefined(layer) && esriLang.isDefined(layer.fields) ? layer.fields : [], 
            opt, selectedValue;
        if(!this._divideFieldSelect) {
          return;
        }
        this._divideFieldSelect.removeOption(this._divideFieldSelect.getOptions());
        this._divideFieldSelect.addOption({value:"0", label: this.i18n.noneLabel});
        if(!this._isPoint || (this._isPoint && (!esriLang.isDefined(this.analysisField) || this.analysisField === "0"))) {
          this._divideFieldSelect.addOption({
            value:"esriPopulation", 
            label: this.i18n.enrichLabel, 
            disabled: !this.get("enableEnrichmentFields")
          });
        }
        
        array.forEach(fields, function(field, index) {
          if((array.indexOf(["GiZScore", "GiPValue", "Gi_Bin", layer.objectIdField, (esriLang.isDefined(this.analysisField) && this.analysisField)], field.name) === -1) && array.indexOf(["esriFieldTypeSmallInteger", "esriFieldTypeInteger", "esriFieldTypeSingle", "esriFieldTypeDouble"], field.type) !== -1 ) {
            //console.log(field);
            opt = {
                    value:field.name, 
                    label:esriLang.isDefined(field.alias) && field.alias !== ""? field.alias : field.name
            };
            if(this.dividedByField && opt.label === this.dividedByField) {
              opt.selected = "selected";
              selectedValue = field.name;
            }
            //console.log(opt);
            this._divideFieldSelect.addOption(opt);
          }
        } , this);
        if(selectedValue) {
          this._divideFieldSelect.set("value", selectedValue);
        }        
      },
      
      _setEnableEnrichmentFieldsAttr: function(value) {
        this.enableEnrichmentFields = value;
      },
      
      _getEnableEnrichmentFieldsAttr: function() {
        return this.enableEnrichmentFields;
      },
      
      _setMapAttr: function(map) {
        this.map = map;  
        this._toolbar = new Draw(this.map);
        connection.connect(this._toolbar, "onDrawEnd", lang.hitch(this, this._addFeatures));
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
      
      _getDrawLayerAttr: function() {
        return this._featureLayer;
      },
      
      _getDrawToolbarAttr: function() {
        return this._toolbar;
      },
      
      _setDisableRunAnalysisAttr: function(value){
        this._saveBtn.set("disabled", value);
      },
      
      validateServiceName: function(value) {
        return AnalysisUtils.validateServiceName(value, {textInput: this._outputLayerInput});
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
      
      ////////////////////////////
      // Helpers
      ////////////////////////////
      _connect: function(node, evt, func){
        this._pbConnects.push(connection.connect(node, evt, func));
      }
  });
  
  
  return FindHotSpots;   
});

