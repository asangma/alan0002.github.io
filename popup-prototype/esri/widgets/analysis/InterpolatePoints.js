/******************************************
 * esri/widgets/analysis/InterpolatePoints
 ******************************************/
/*
  Parameters: 
  Parameter: inputLayer 
  Data Type: GPString 
  Display Name inputLayer 
  Description: 
  Direction: esriGPParameterDirectionInput 
  Default Value: 
  Parameter Type: esriGPParameterTypeRequired 
  Category: 

  Parameter: field 
  Data Type: GPString 
  Display Name field 
  Description: 
  Direction: esriGPParameterDirectionInput 
  Default Value: 
  Parameter Type: esriGPParameterTypeRequired 
  Category: 

  Parameter: interpolateOption 
  Data Type: GPString 
  Display Name interpolateOption 
  Description: 
  Direction: esriGPParameterDirectionInput 
  Default Value: 5 
  Parameter Type: esriGPParameterTypeOptional 
  Category: 
  Choice List: [ 1, 5, 10 ]

  Parameter: classificationType 
  Data Type: GPString 
  Display Name classificationType 
  Description: 
  Direction: esriGPParameterDirectionInput 
  Default Value: GeometricalInterval 
  Parameter Type: esriGPParameterTypeOptional 
  Category: 
  Choice List: [ GeometricalInterval, Quantile, EqualInterval, Manual ]

  Parameter: numClasses 
  Data Type: GPLong 
  Display Name numClasses 
  Description: 
  Direction: esriGPParameterDirectionInput 
  Default Value: 10 
  Parameter Type: esriGPParameterTypeOptional 
  Category: 

  Parameter: classBreaks 
  Data Type: GPMultiValue:GPDouble 
  Display Name classBreaks 
  Description: 
  Direction: esriGPParameterDirectionInput 
  Default Value: 
  Parameter Type: esriGPParameterTypeOptional 
  Category: 

  Parameter: boundingPolygonLayer 
  Data Type: GPString 
  Display Name boundingPolygonLayer 
  Description: 
  Direction: esriGPParameterDirectionInput 
  Default Value: 
  Parameter Type: esriGPParameterTypeOptional 
  Category: 

  Parameter: predictAtPointLayer 
  Data Type: GPString 
  Display Name predictAtPointLayer 
  Description: 
  Direction: esriGPParameterDirectionInput 
  Default Value: 
  Parameter Type: esriGPParameterTypeOptional 
  Category: 

  Parameter: outputPredictionError 
  Data Type: GPBoolean 
  Display Name outputPredictionError 
  Description: 
  Direction: esriGPParameterDirectionInput 
  Default Value: false 
  Parameter Type: esriGPParameterTypeOptional 
  Category: 

  Parameter: outputName 
  Data Type: GPString 
  Display Name outputName 
  Description: 
  Direction: esriGPParameterDirectionInput 
  Default Value: 
  Parameter Type: esriGPParameterTypeOptional 
  Category: 

  Parameter: context 
  Data Type: GPString 
  Display Name context 
  Description: 
  Direction: esriGPParameterDirectionInput 
  Default Value: 
  Parameter Type: esriGPParameterTypeOptional 
  Category: 

  Parameter: resultLayer 
  Data Type: GPString 
  Display Name resultLayer 
  Description: 
  Direction: esriGPParameterDirectionOutput 
  Default Value: 
  Parameter Type: esriGPParameterTypeDerived 
  Category: 

  Parameter: predictionError 
  Data Type: GPString 
  Display Name predictionError 
  Description: 
  Direction: esriGPParameterDirectionOutput 
  Default Value: 
  Parameter Type: esriGPParameterTypeDerived 
  Category: 

  Parameter: predictedPointLayer 
  Data Type: GPString 
  Display Name predictedPointLayer 
  Description: 
  Direction: esriGPParameterDirectionOutput 
  Default Value: 
  Parameter Type: esriGPParameterTypeDerived 
  Category: 
 */
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
  "dojo/text!./templates/InterpolatePoints.html"
], function(require, declare, lang, array, connection, Color, has, string, domStyle, domAttr, domConstruct, query, domClass, number, _WidgetBase,
   _TemplatedMixin, _WidgetsInTemplateMixin,  _OnDijitClickMixin, _FocusMixin, registry, Button, CheckBox, Dialog, Form, Select, TextBox, NumberSpinner, ValidationTextBox, ContentPane, ComboBox, esriKernel, 
   esriLang, AnalysisBase, _AnalysisOptions, SimpleFillSymbol, SimpleLineSymbol, Draw, PopupTemplate, FeatureLayer, Graphic, AnalysisUtils, CreditEstimator, PictureMarkerSymbol, HorizontalSlider, HorizontalRule, HorizontalRuleLabels, jsapiBundle, template) {
    var InterpolatePoints = declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin,  _OnDijitClickMixin, _FocusMixin, _AnalysisOptions,AnalysisBase], {
      
      declaredClass: "esri.widgets.analysis.InterpolatePoints",
      templateString: template,
      basePath: require.toUrl("."),
      widgetsInTemplate: true,
      
      //attributes for constructing the Tool, the names matches the REST service property names
      inputLayer: null,
      field: null, 
      interpolateOption: 1,
      classificationType: "GeometricalInterval",
      numClasses: 10,
      maxClasses: 32, //max number of class breaks
      minClasses: 3, //min number of class breaks
      boundingPolygonLayer: null,
      predictAtPointLayer: null,
      outputPredictionError: false,
      outputLayerName: null,
      classBreaks: null,
      
      //general parameters
      i18n: null,
      
      //reference to the map to draw the bounding polygon
      map:null,

      toolName: "InterpolatePoints",
      helpFileName: "InterpolatePoints",
      resultParameter:"resultLayer",
      
       
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
        lang.mixin(this.i18n, jsapiBundle.interpolatePointsTool);
        this.set("drawLayerName", this.i18n.blayerName);
        this.set("drawPointLayerName", this.i18n.pointlayerName);
      },
      
      postCreate: function(){
        this.inherited(arguments);
        domClass.add(this._form.domNode, "esriSimpleForm");
        //domAttr.set(this._closeImg, "src" , this.basePath + "/images/close.gif");
        this._outputLayerInput.set("validator", lang.hitch(this, this.validateServiceName));
        this._classBreaksInput.set("validator", lang.hitch(this, this.validateClassBreaks));
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
                this._predictPointSelect.removeOption({value:index+1, label:this._pointfeatureLayer.name});
                this.predictAtPointLayers.splice(index, 1);
                return;
              }
            }, this);
          }          
        }
        this._handleBoundingBtnChange(false);
        this._handlePredictPointChange(false);
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
        this._handlePredictPointChange(false);
      },
      
      _handleShowCreditsClick: function(e) {
        e.preventDefault();
        ////////////////////////////
        var jobParams = {};
        if(!this._form.validate()) {
          return;
        } 
        jobParams.inputLayer = JSON.stringify(AnalysisUtils.constructAnalysisInputLyrObj(this.get("inputLayer")));
        jobParams.field = this.get("field");
        //optional params
        jobParams.interpolateOption = this.get("interpolateOption");
        jobParams.classificationType = this.get("classificationType");
        if(this.classificationType !== "Manual") {
          jobParams.numClasses = this.get("numClasses");
        }
        else {
          //manual
          jobParams.classBreaks = this.get("classBreaks");
        }
        if(this.get("boundingPolygonLayer")) {
          jobParams.boundingPolygonLayer = JSON.stringify(AnalysisUtils.constructAnalysisInputLyrObj(this.boundingPolygonLayer));
        }
        if(this.get("predictAtPointLayer")) {
          jobParams.predictAtPointLayer =  JSON.stringify(AnalysisUtils.constructAnalysisInputLyrObj(this.predictAtPointLayer));
        } 
        jobParams.outputPredictionError = this.get("outputPredictionError");
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
        jobParams.field = this.get("field");
        //optional params
        jobParams.interpolateOption = this.get("interpolateOption");
        jobParams.classificationType = this.get("classificationType");
        if(this.classificationType !== "Manual") {
          jobParams.numClasses = this.get("numClasses");
        }
        else {
          //manual
          jobParams.classBreaks = this.get("classBreaks");
        }
        if(this.get("boundingPolygonLayer")) {
          jobParams.boundingPolygonLayer = JSON.stringify(AnalysisUtils.constructAnalysisInputLyrObj(this.boundingPolygonLayer));
        }
        if(this.get("predictAtPointLayer")) {
          jobParams.predictAtPointLayer =  JSON.stringify(AnalysisUtils.constructAnalysisInputLyrObj(this.predictAtPointLayer));
        } 
        jobParams.outputPredictionError = this.get("outputPredictionError");
        
        if(this.predictAtPointLayer && this.get("outputPredictionError")) {
          this.resultParameter = ["predictedPointLayer","resultLayer","predictionError"];
        }
        else if(this.predictAtPointLayer && !this.get("outputPredictionError")) {
          this.resultParameter = ["predictedPointLayer","resultLayer"];
        }
        else if(!this.predictAtPointLayer && this.get("outputPredictionError")) {
          this.resultParameter = ["resultLayer", "predictionError"];
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
        var constraints, override = true;
        this._loadConnections();
        this.signInPromise.then(lang.hitch(this, AnalysisUtils.initHelpLinks, this.domNode, this.showHelp, {analysisGpServer: this.analysisGpServer}));
        
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
        
        if(this.classificationType) {
          this._classifySelect.set("value", this.classificationType);
        }
              
        if(this.outputPredictionError) {
          this._outoutPredictionsErrCheck.set("checked", this.outputPredictionError);
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
        
        if(this.predictAtPointLayers) {
          this._predictPointSelect.addOption({value:"-1", label: this.i18n.choosePointLayer, selected: true});
          array.forEach(this.predictAtPointLayers, function(layer , index) {
            if(layer.geometryType === "esriGeometryPoint" && layer !== this.inputLayer) {
              var isSelectedLayer = this.get("predictAtPointLayer") && this.get("predictAtPointLayer").name === layer.name;
              this._predictPointSelect.addOption({value:index+1, label:layer.name, selected: isSelectedLayer});
            }
          }, this);          
        }
        
        if(this.classBreaks) {
          this._classBreaksInput.set("value", (this.classBreaks.join()).replace(/,/g, " "));
        }
        if(this.maxClasses) {
          constraints = this._numClassesInput.get("constraints");
          constraints.max = this.maxClasses;
          this._numClassesInput.set("constraints", constraints);
        }
        if(this.minClasses) {
          constraints = this._numClassesInput.get("constraints");
          constraints.min = this.minClasses;
          this._numClassesInput.set("constraints", constraints);
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
        //showCredits
      },
      
      _updateAnalysisLayerUI: function(override) {
        if(this.inputLayer) {
            domAttr.set(this._interpolateToolDescription, "innerHTML", string.substitute(this.i18n.toolDefine, {layername: this.inputLayer.name}));
            if(override) {
              this.outputLayerName = string.substitute(this.i18n.outputLayerName, {layername: this.inputLayer.name});
            }
            this._outputLayerInput.set("value", this.outputLayerName);
            this.set("fields", this.inputLayer);
        }
      },
                                    
      _handleAnalysisLayerChange: function(value) {
        if(value === "browse") {
          if(!this._analysisquery) {
            this._analysisquery = this._browsedlg.browseItems.get("query");
          }
          this._browsedlg.browseItems.set("query", this._analysisquery + " AND tags:\"point\"");
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
            layers:  this._isAnalysisSelect? this.inputLayers : this.boundingPolygonLayers,
            layersSelect: this._isAnalysisSelect? this._analysisSelect : this._boundingAreaSelect,
            posIncrement: this._isAnalysisSelect? 0 : 1,
            browseDialog: this._browsedlg
          }).always(lang.hitch(this, this._updateAnalysisLayerUI, true));
        }
      },      
      
      _handleMethodChange: function(value) {
        if(value === "NN") {
          domClass.add(this._optionsDiv, "disabled");
          if (domClass.contains(this._optionsDiv, "optionsOpen")) {
            domClass.remove(this._optionsDiv, "optionsOpen");
            domClass.add(this._optionsDiv, "optionsClose");
          }
        }
        else {
          if(domClass.contains(this._optionsDiv, "disabled")) {
            domClass.remove(this._optionsDiv, "disabled");
          }
          if(value === "KG") {
            domStyle.set(this._barrierLabelRow, "display", "none");
            domStyle.set(this._barrierSelectRow, "display", "none");
            domStyle.set(this._speedLabelRow, "display", "");
            domStyle.set(this._speedSliderRow, "display", "");
            
          }
          else if(value === "LP") {
            domStyle.set(this._barrierLabelRow, "display", "");
            domStyle.set(this._barrierSelectRow, "display", "");
            domStyle.set(this._speedLabelRow, "display", "none");
            domStyle.set(this._speedSliderRow, "display", "none");
          }
        }
      },
      
      _handleOptimizeSliderChange: function(value) {
        console.log(value, this._optimizeSlider.get("value"));
        this.set("interpolateOption", this._optimizeSlider.get("value"));
      },
      
      _handleFieldChange: function(value) {},
      
      _handleOptionsBtnClick: function() {
        if (domClass.contains(this._optionsDiv, "disabled")) {
          return;
        }
        else if (domClass.contains(this._optionsDiv, "optionsClose")) {
          domClass.remove(this._optionsDiv, "optionsClose");
          domClass.add(this._optionsDiv, "optionsOpen");
        }
        else if (domClass.contains(this._optionsDiv, "optionsOpen")) {
          domClass.remove(this._optionsDiv, "optionsOpen");
          domClass.add(this._optionsDiv, "optionsClose");
          
        }
       // domClass.toggle(this._optionsDiv, "optionsOpen");
      },
      
      _handleBoundingSelectChange: function(value) {
        if(value === "browse") {
          if(!this._analysisquery) {
            this._analysisquery = this._browsedlg.browseItems.get("query");
          }
          this._browsedlg.browseItems.set("query", this._analysisquery + " AND tags:\"polygon\"");
          this._isAnalysisSelect = false;
          this._browsedlg.show();
        }        
      },
      
      _handleClick: function(value) {},
      
      _handlePredictPointSelectChange: function(value) {},
      
      _handleBoundingBtnChange : function(value) {
        if(value) {
          this.emit("drawtool-activate", {});
          if(!this._featureLayer) {
            this._createBoundingPolyFeatColl();
          }
          this._predictPointDrawBtn.set("checked", false); //reset
          this._toolbar.activate(Draw.POLYGON);
        }
        else {
          this._toolbar.deactivate();
          if(!this._predictPointDrawBtn.get("checked")) {
            this.emit("drawtool-deactivate", {});
          }
        }
      },
      
      _handlePredictPointChange: function(value) {
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
      
      _handleClassifySelectChange: function(value) {
        domStyle.set(this._classifyOtherOptionLabelRow, "display", value === "Manual" ? "none" : "block");
        domStyle.set(this._classifyOtherOptionInputRow, "display",value === "Manual" ? "none" : "block");
        domStyle.set(this._manualOptionInputRow, "display", value === "Manual" ? "block" : "none");
        domStyle.set(this._manualOptionLabelRow, "display", value === "Manual" ? "block" : "none");
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
          //console.log("during draw" ,this._boundingAreaSelect.getOptions());
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
        if(this.predictAtPointLayers.length === 0 || this.predictAtPointLayers[this.predictAtPointLayers.length - 1] !== this._pointfeatureLayer) {
          var index = this.predictAtPointLayers.push(this._pointfeatureLayer);
          var cOptions = this._predictPointSelect.getOptions();
          this._predictPointSelect.removeOption(cOptions);
          cOptions = array.map(cOptions, function(option) {
            option.selected = false;
            return option;
          });
          this._predictPointSelect.addOption({value:index, label:this._pointfeatureLayer.name, selected: true});
          this._predictPointSelect.addOption(cOptions);
        }
      },      
      
      validateServiceName: function(value) {
        return AnalysisUtils.validateServiceName(value, {textInput: this._outputLayerInput});
      },
      
      // Check if string is a whole number(digits only).
      validateClassBreaks: function() {
        var val, passes = [], temp = [], vstring, match;
        val = lang.trim(this._classBreaksInput.get("value")).split(" ");
        //if the classificationType is not manual always return true
        if (this.get("classificationType") !== "Manual") {
          return true;
        }
        //value missing when classifcation is manual
        else if (!val && this.get("classificationType") === "Manual") {
          return false;
        }
        //length should be between 2 and 32
        else if (val.length < 2 || val.length > this.maxClasses) {
          return false;
        }
        //is it valid class break input should be whole numbers
        array.some(val, function(v, index){
          v = number.parse(v);
          //console.log(v);
          if (isNaN(v)) {
            passes.push(0);
            return false;
          }
          if(!temp[val[index]]) {
            temp[val[index]] = true;
          }
          else {
            temp[val[index]] = false;
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
            //console.log(match);
          if (match && match.length > 0){
            if (match){
              array.forEach(match, function( m , idx){
                if (m === "." || m === "," || (m === "-" && idx === 0)) {
                  passes.push(1);
                } 
                else {
                  passes.push(0);
                }
              });
            }
          }
        });
        if (array.indexOf(passes, 0) !== -1) {
          return false;
        }
        return true;
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
      
      // all possible nemeric fields for interpolation
      _setFieldsAttr: function(layer) {
        var fields = layer.fields, opt, selectedValue;
        if(this._fieldSelect) {
          this._fieldSelect.removeOption(this._fieldSelect.getOptions());
        }
        array.forEach(fields, function(field, index) {
          if(field.name !== layer.objectIdField && (array.indexOf(["esriFieldTypeSmallInteger", "esriFieldTypeInteger", "esriFieldTypeSingle", "esriFieldTypeDouble"], field.type) !== -1) ) {
            //console.log(field);
            opt = {
                    value:field.name, 
                    label:esriLang.isDefined(field.alias) && field.alias !== ""? field.alias : field.name
            };
            if(this.field && opt.value === this.field) {
              opt.selected = "selected";
              selectedValue = field.name;
            }
            //console.log(opt);
            this._fieldSelect.addOption(opt);
            
          }
        } , this);
        if(selectedValue) {
          this._fieldSelect.set("value", selectedValue);
        }
      },
      
      //matches the field value
      _setFieldAttr: function(field) {
        this.field = field;
      },
      
      _getFieldAttr: function() {
        if(this._fieldSelect) {
          this.field = this._fieldSelect.get("value");
        }
        return this.field;
      },
      
      _setInterpolateOptionAttr: function(value) {
        // 1, 5, 10 possible values
        this.interpolateOption  = value;
      },
      
      _getInterpolateOptionAttr: function() {
        if(this._optimizeSlider) {
          this.interpolateOption = Math.floor(this._optimizeSlider.get("value")); // Math.floor(5.5)
        }
        return this.interpolateOption;
      },      
      
      _setClassificationTypeAttr: function(value) {
        //[ GeometricalInterval, Quantile, EqualInterval, Manual ]
        this.classificationType = value;
      },
      
      _getClassificationTypeAttr: function() {
        if(this._classifySelect) {
          this.classificationType = this._classifySelect.get("value");
        }
        return this.classificationType;
      },      

      _getNumClassesAttr: function() {
        if(this._numClassesInput) {
          this.numClasses = this._numClassesInput.get("value");
        }
        return this.numClasses;
      },
      
      _setNumClassesAttr: function(value) {
        this.numClasses = value;
      },
      
      _setMaxClassesAttr: function(value) {
        this.maxClasses = value;
      },
      
      _getMaxClassesAttr: function() {
        return this.maxClasses;
      },
      
      _setMinClassesAttr: function(value) {
        this.minClasses = value;
      },
      
      _getMinClassesAttr: function() {
        return this.minClasses;
      },      
      
      _getClassBreaksAttr: function() {
        if(this._classBreaksInput) {
          var val = lang.trim(this._classBreaksInput.get("value")).split(" "), darray = [];
          array.forEach(val, function(v){
            darray.push(number.parse(v));
          });
          this.classBreaks = darray;          
        }
        return this.classBreaks;
      },

      _setClassBreaksAttr: function(value) {
        //array
        if (value) {
          this.classBreaks = value;  
        }
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

      _getPredictAtPointLayerAttr: function() {
        if(this._predictPointSelect) {
          this.predictAtPointLayer = null;
          if(this._predictPointSelect.get("value") !== "-1") {
            this.predictAtPointLayer = this.predictAtPointLayers[this._predictPointSelect.get("value") - 1];        
          }
        }
        return this.predictAtPointLayer;
      },
      
      _setPredictAtPointLayerAttr: function(value) {
        this.predictAtPointLayer = value;
      },
      
      _setPredictAtPointLayersAttr: function(layers) {
        this.predictAtPointLayers = layers;
      },
      
      _getOutputPredictionErrorAttr: function() {
        if(this._outoutPredictionsErrCheck) {
          this.outputPredictionError = this._outoutPredictionsErrCheck.get("checked");
        }
        return this.outputPredictionError;
      },
      
      _setOutputPredictionErrorAttr: function(value) {
        this.outputPredictionError = value;
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
      
      _setDrawPointLayerNameAttr: function(name) {
        this.drawPointLayerName = name;
      },
      
      _getDrawPointLayerNameAttr: function() {
        return this._pointfeatureLayer.name;   
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
      
      ////////////////////////////
      // Helpers
      ////////////////////////////
      _connect: function(node, evt, func){
        this._pbConnects.push(connection.connect(node, evt, func));
      }
   
  });
  
  
  return InterpolatePoints;   
});


