/******************************************
esri/widgets/analysis/SummarizeWithin
Tool name: SummarizeWithin

sumWithinLayer, feature layer
summaryLayer, feature layer
sumShape, Boolean
shapeUnits, String  if summary layer is polygons: SquareMeters, Hectares, SquareKilometers, SquareFeet, SquareYards, Acres, SquareMiles
                                if summary layer is line: Meters, Kilometers, Feet, Yards, Miles
                                if summary layer is points: do not display
summaryFields, Multivalue of string
groupByField, sring
percentShape, boolean
outputName
context
resultLayer, feature layer

 *
 */
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
  "../../core/lang",
  "./AnalysisBase",
  "./_AnalysisOptions",
  "./CreditEstimator",
  "./utils",
  "dojo/i18n!../../nls/jsapi",
  "dojo/text!./templates/SummarizeWithin.html"
], function(require, declare, lang, array, connection, fx, has, string, domStyle, domAttr, domConstruct, query, domClass, easing, _WidgetBase,
   _TemplatedMixin, _WidgetsInTemplateMixin,  _OnDijitClickMixin, _FocusMixin, registry, Button, CheckBox, Form, Select, TextBox, ValidationTextBox, ContentPane, ComboBox, esriKernel, esriLang, AnalysisBase, _AnalysisOptions, CreditEstimator, AnalysisUtils, jsapiBundle, template) {
  var SummarizeWithin = declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin,  _OnDijitClickMixin, _FocusMixin, _AnalysisOptions, AnalysisBase], {

    declaredClass: "esri.widgets.analysis.SummarizeWithin",

    templateString: template,
    basePath: require.toUrl("."),
    widgetsInTemplate: true,
    
    //attributes for constructing the Tool, the names matches the REST service property names
    // used in setting up the UI and during re run to construct the UI
    sumWithinLayer: null, // layer analyzed
    summaryLayers: null, // array of possible feature layes aggrgating to
    summaryFields: null, //possible stats atribute fields
    outputLayerName: null,
    summarizeMetric: true,
    summaryLayer: null, // the polygon layer to be shown selected in dropdown
    groupByField: null,
    minorityMajority: false,
    percentPoints:false,
    i18n: null,
    
    toolName: "SummarizeWithin",
    helpFileName: "SummarizeWithin",
    resultParameter:"resultLayer",
   
    /************
     * Overrides
     ************/
    constructor: function(params){
      this._pbConnects = [];
      this._statsRows = [];
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
      lang.mixin(this.i18n, jsapiBundle.summarizeWithinTool);
    },
    
    postCreate: function(){
      this.inherited(arguments);
      domClass.add(this._form.domNode, "esriSimpleForm");
      //domAttr.set(this._closeImg, "src" , this.basePath + "/images/close.gif");
      this._outputLayerInput.set("validator", lang.hitch(this, this.validateServiceName));
      //this._outputLayerInput.set("validator", lang.hitch(this, this.validateServiceName));
      //query(this._form.domNode).addClass("esriSimpleForm");
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
      if(!this._form.validate()) {
        return;
      }
      var jobParams = {}, summaryLayer ; 
      summaryLayer = this.summaryLayers[this._layersSelect.get("value")];
      jobParams.summaryLayer = JSON.stringify(AnalysisUtils.constructAnalysisInputLyrObj(summaryLayer));
      jobParams.sumWithinLayer  = JSON.stringify(AnalysisUtils.constructAnalysisInputLyrObj(this.sumWithinLayer));
      //AggregateFields
      jobParams.summaryFields  = JSON.stringify(this.get("summaryFields"));
      //outputLayer
      if(!this.returnFeatureCollection) {
        jobParams.OutputName = JSON.stringify({
          serviceProperties : {
            name: this._outputLayerInput.get("value")
          }
        });
      }
      jobParams.sumShape  = this._sumMetricCheck.get("checked");
      if(summaryLayer.geometryType !== "esriGeometryPoint" || summaryLayer.geometryType !== "esriGeometryMultipoint") {
        jobParams.shapeUnits = this.get("shapeUnits");
      }
      if(this._groupBySelect.get("value") !== "0") {
        jobParams.groupByField = this._groupBySelect.get("value");
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
      if(!this._form.validate()) {
        return;
      }
      if(!this._sumMetricCheck.get("checked") && (this.get("summaryFields").length) === 0) {
        this._showMessages(this.i18n.statsRequiredMsg);
        return;
      }
      
      this._saveBtn.set("disabled", true);
      var jobParams = {}, executeObj = {}, summaryLayer, contextObj; 
      summaryLayer = this.summaryLayers[this._layersSelect.get("value")];
      jobParams.summaryLayer = JSON.stringify(AnalysisUtils.constructAnalysisInputLyrObj(summaryLayer));
      jobParams.sumWithinLayer  = JSON.stringify(AnalysisUtils.constructAnalysisInputLyrObj(this.sumWithinLayer));
      //AggregateFields
      jobParams.summaryFields  = JSON.stringify(this.get("summaryFields"));
      //outputLayer
      if(!this.returnFeatureCollection) {
        jobParams.OutputName = JSON.stringify({
          serviceProperties : {
            name: this._outputLayerInput.get("value")
          }
        });
      }
      jobParams.sumShape  = this._sumMetricCheck.get("checked");
      if(summaryLayer.geometryType !== "esriGeometryPoint" || summaryLayer.geometryType !== "esriGeometryMultipoint") {
        jobParams.shapeUnits = this.get("shapeUnits");
      }
      if(this._groupBySelect.get("value") !== "0") {
        jobParams.groupByField = this._groupBySelect.get("value");
        this.resultParameter = ["resultLayer","groupBySummary"];
        jobParams.minorityMajority = this.get("minorityMajority");
        jobParams.percentPoints = this.get("percentPoints");
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
        "description" : string.substitute(this.i18n.itemDescription, {sumWithinLayerName:this.sumWithinLayer.name, summaryLayerName:  summaryLayer.name}),
        "tags": string.substitute(this.i18n.itemTags, {sumWithinLayerName: this.sumWithinLayer.name, summaryLayerName:  summaryLayer.name}),
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
    
    _initializeShapeUnits: function(geometryType) {
      if(this._prevGeometryType && this._prevGeometryType ===  geometryType) {
        return;
      }
      this._shapeUnitsSelect.removeOption(this._shapeUnitsSelect.getOptions());
      domStyle.set(this._shapeUnitsSelect.domNode, "display", (geometryType === "esriGeometryPoint" || geometryType === "esriGeometryMultipoint"? "none" : ""));
      if (geometryType === "esriGeometryPolygon") {
        domStyle.set(this._shapeUnitsSelect.domNode, "width", "49%");
        this._shapeUnitsSelect.addOption([
          {value:"SquareMiles", label: this.i18n.sqMiles},
          {value:"SquareKilometers", label: this.i18n.sqKm},
          {value:"SquareMeters", label: this.i18n.sqMeters},
          {value:"Hectares", label: this.i18n.hectares},
          {value:"Acres", label: this.i18n.acres}
        ]);
        if(this.get("shapeUnits") === "Kilometers") {
          this.set("shapeUnits", "SquareKilometers");
        }
      }
      else if (geometryType === "esriGeometryPolyline") {
        domStyle.set(this._shapeUnitsSelect.domNode, "width", "39%");
        this._shapeUnitsSelect.addOption([
          {value:"Miles", label: this.i18n.miles},
          {value:"Feet", label: this.i18n.feet},
          {value:"Kilometers", label: this.i18n.kilometers},
          {value:"Meters", label: this.i18n.meters},
          {value:"Yards", label: this.i18n.yards}
        ]);
        if(this.get("shapeUnits") === "SquareKilometers") {
          this.set("shapeUnits", "Kilometers");
        }        
      }
      this._shapeUnitsSelect.set("value", this.get("shapeUnits"));
      this._prevGeometryType = geometryType; 
    }, 
    
    _handleShapeUnitsChange: function(value) {
      this.set("shapeUnits", value);
    },
    
    _handleLayerChange: function(index) {
      //console.log("layer change Success" , index);
      //console.log("chosen layer Success", this.summaryLayers[index]);
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
        layer = this.summaryLayers[index];
        this.outputLayerName = string.substitute(this.i18n.outputLayerName, { 
          summaryLayerName: layer.name, 
          sumWithinLayerName: this.sumWithinLayer.name
        });
        this._outputLayerInput.set("value", this.outputLayerName);
        domAttr.set(this._addStatsLabel, "innerHTML", string.substitute(this.i18n.addStats, {summaryLayerName:layer.name}));
        this._initializeShapeUnits(layer.geometryType);
        if(layer.geometryType === "esriGeometryPolygon") {
        //_sumMetricLabel  
          domAttr.set(this._sumMetricLabel, "innerHTML", this.i18n.summarizeMetricPoly);
          domAttr.set(this._addStatsHelpLink, "esriHelpTopic", "StatisticsPolygon");

        }
        if(layer.geometryType === "esriGeometryPoint" || layer.geometryType === "esriGeometryMultipoint") {
          domAttr.set(this._sumMetricLabel, "innerHTML", this.i18n.summarizeMetricPoint);
          domAttr.set(this._addStatsHelpLink, "esriHelpTopic", "StatisticsPoint");
        }
        if(layer.geometryType === "esriGeometryPolyline") {
          domAttr.set(this._sumMetricLabel, "innerHTML", this.i18n.summarizeMetricLine);
          domAttr.set(this._addStatsHelpLink, "esriHelpTopic", "StatisticsLine");
        }     
        this.set("groupBySelect", this.groupByField);
        this._removeStatsRows();
        this._createStatsRow(); 
      }
    },
   
    _handleAttrSelectChange: function(value) {
      var statsSelect, removeTd, obj;
      if (value !== "0") {
        //value is set 
        statsSelect = this.get("statisticSelect"); 
        if (statsSelect.get("value") !== "0") {
          if(!statsSelect.get("isnewRowAdded")) {
            removeTd = statsSelect.get("removeTd");
            domStyle.set(removeTd, "display", "block");
            obj = statsSelect.get("referenceWidget");
            lang.hitch(obj, obj._createStatsRow());
            obj._sumMetricCheck.set("disabled", false);
            statsSelect.set("isnewRowAdded", true);
          }
        }
      }
    },
    
    _handleStatsValueUpdate: function(property , oldValue, newValue) {
      var attrSelect, removeTd, obj;
      //console.log("Stats Successful Change", property, oldValue, newValue, this);
      if (!this.get("attributeSelect")) {
        return;
      }
      //console.log("corresponding attribute selector", this.get("attributeSelect"));
      attrSelect = this.get("attributeSelect");
      if (attrSelect.get("value") !== "0" &&   newValue !== "0") {
        if(!this.get("isnewRowAdded")) {
          removeTd = this.get("removeTd");
          domStyle.set(removeTd, "display", "block");
          obj = this.get("referenceWidget");
          lang.hitch(obj, obj._createStatsRow());
          obj._sumMetricCheck.set("disabled", false);
          this.set("isnewRowAdded", true);
        }
      }
    },
    
    _handleGroupBySelectChange: function(value) {
      var isDisabled = (value === "0");
      domClass.toggle(this._minmajorityLabel, "esriAnalysisTextDisabled", isDisabled);
      domClass.toggle(this._percentPointsLabel, "esriAnalysisTextDisabled", isDisabled);
      this._percentPointsCheck.set("disabled", isDisabled);
      this._minmajorityCheck.set("disabled", isDisabled);
    },

    _save: function() {},
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
        if(!this.get("sumWithinLayer") && this.get("sumWithinLayers")) {
          this.set("sumWithinLayer", this.sumWithinLayers[0]);
        }
        AnalysisUtils.populateAnalysisLayers(this, "sumWithinLayer", "sumWithinLayers");
      }

      if(this.sumWithinLayer) {
        //console.log(this.sumWithinLayer.name);
        domAttr.set(this._aggregateToolDescription, "innerHTML", string.substitute(this.i18n.summarizeDefine, {sumWithinLayerName: this.sumWithinLayer.name}));
        
      }
      if(this.summaryLayers) {
        array.forEach(this.summaryLayers, function(layer , index) {
          if(layer !== this.sumWithinLayer) {
            this._layersSelect.addOption({value:index, label:layer.name});
            if (index === 0) {
              if(!this.outputLayerName) {
                this.outputLayerName = string.substitute(this.i18n.outputLayerName, { 
                  summaryLayerName: layer.name, 
                  sumWithinLayerName: this.sumWithinLayer.name
                });
              }
              domAttr.set(this._addStatsLabel, "innerHTML", string.substitute(this.i18n.addStats, {summaryLayerName: layer.name}));
              this._initializeShapeUnits(layer.geometryType);
              if(layer.geometryType === "esriGeometryPolygon") {
              //_sumMetricLabel  
                domAttr.set(this._sumMetricLabel, "innerHTML", this.i18n.summarizeMetricPoly);
                domAttr.set(this._addStatsHelpLink, "esriHelpTopic", "StatisticsPolygon");
              }
              if(layer.geometryType === "esriGeometryPoint" || layer.geometryType === "esriGeometryMultipoint") {
                domAttr.set(this._sumMetricLabel, "innerHTML", this.i18n.summarizeMetricPoint);
                domAttr.set(this._addStatsHelpLink, "esriHelpTopic", "StatisticsPoint");
              }
              if(layer.geometryType === "esriGeometryPolyline") {
                domAttr.set(this._sumMetricLabel, "innerHTML", this.i18n.summarizeMetricLine);
                domAttr.set(this._addStatsHelpLink, "esriHelpTopic", "StatisticsLine");
              }
            }
          }
        }, this);      
      }
      
      AnalysisUtils.addReadyToUseLayerOption(this, [this._analysisSelect, this._layersSelect]);
      
      if(this.outputLayerName) {
        this._outputLayerInput.set("value", this.outputLayerName);
        override = false;
      }
      
      this._sumMetricCheck.set("checked", this.summarizeMetric);
      if(!this.summarizeMetric) {
        this._sumMetricCheck.set("disabled", this.summarizeMetric);
      }      
      if(this.summaryLayer) {
        this._layersSelect.set();
      }
      if(this.shapeUnits) {
        this._shapeUnitsSelect.set("value", this.shapeUnits);  
      }      
      //creates the row stats and attributes in the select box
      this._createStatsRow();
      
      //if the tool has the stats and attributes already selected 
      //console.log("Selected Attributes", this._selectedAttributes);
      //console.log("Selected Stats", this._selectedStats);
      array.forEach(this.summaryFields, function(item) {
        var fields = item.split(" ");
        this._currentAttrSelect.set("value", fields[0]);
        lang.hitch(this._currentAttrSelect, this._handleAttrSelectChange, fields[0])();
         
        this._currentStatsSelect.set("value", fields[1]);
        lang.hitch(this._currentStatsSelect, this._handleStatsValueUpdat, "value", "", fields[1])();
      }, this);
      
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
      
      this.set("groupBySelect", this.groupByField );
      if(this.minorityMajority) {
        this._minmajorityCheck.set("checked", this.minorityMajority);
      }
      if(this.percentPoints) {
        this._percentPointsCheck.set("checked", this.percentPoints);
      }
      
      
      domStyle.set(this._showCreditsLink, "display", this.showCredits === true? "block" : "none");
      this._loadConnections();
      this._updateAnalysisLayerUI(override);

    },
    
    _loadConnections: function(){
      this.on("start", lang.hitch(this, "_onClose", true));
      this._connect(this._closeBtn, "onclick", lang.hitch(this, "_onClose", false));
    },
     
     // use a simpler logic of using pointer with id with the relationshipd between attr and stats select boxes
    _createStatsRow: function() {
      //console.log("Success Row");
      // add a new stats Row before the  this._afterStatsRow row    
      var statsRow, statsTd, attrTd, attrSelect, statsSelect, removeIcon, removeTd, summaryLayer;
      summaryLayer = this.summaryLayers[this._layersSelect.get("value")];
      statsRow = domConstruct.create("tr", null ,this._afterStatsRow, "before");
      attrTd = domConstruct.create("td", {style: {width:"49%", maxWidth:"100px"}} , statsRow);
      statsTd = domConstruct.create("td", {style: {width:"50%", maxWidth:"104px"}}, statsRow);
      
      attrSelect = new Select({maxHeight:200, "class": "esriLeadingMargin1 mediumInput esriTrailingMargin025 attrSelect", style:{tableLayout: "fixed", overflowX:"hidden"}}, domConstruct.create("select", null, attrTd));
      this.set("attributes", {selectWidget: attrSelect, summaryLayer: summaryLayer});
      statsSelect = new Select({"class": "mediumInput statsSelect", style:{tableLayout: "fixed", overflowX: "hidden"}}, domConstruct.create("select",  null, statsTd));
      this.set("statistics", {selectWidget: statsSelect});  
      
      attrSelect.set("statisticSelect", statsSelect);
      connection.connect(attrSelect, "onChange", this._handleAttrSelectChange);
      
      removeTd= domConstruct.create("td", {"class":"shortTextInput removeTd" , style :{"display": "none" ,maxWidth:"12px"}} , statsRow);
      removeIcon = domConstruct.create("a", {
        "title": this.i18n.removeAttrStats,
        "class": "closeIcon statsRemove",
        "innerHTML": "<img src='"+ this.basePath + "/images/close.gif"+"' border='0''/>"
      }, removeTd);
      connection.connect(removeIcon, "onclick", lang.hitch(this, this._handleRemoveStatsBtnClick, statsRow));
      
      this._statsRows.push(statsRow);
      
      //custom properties
      statsSelect.set("attributeSelect", attrSelect);
      statsSelect.set("removeTd", removeTd);
      statsSelect.set("isnewRowAdded", false);
      statsSelect.set("referenceWidget", this);
      //console.log(statsSelect.get("attributeSelect"));
      //console.log(statsSelect.get("removeTd"));
      statsSelect.watch("value", this._handleStatsValueUpdate);
      
      this._currentStatsSelect = statsSelect;
      this._currentAttrSelect = attrSelect;
      //console.log("Cuurent", this._currentStatsSelect);
      //console.log("Cuurent attr", this._currentAttrSelect);
      return true;
    },
    
    _handleRemoveStatsBtnClick: function(row) {
      this._removeStatsRow(row);
      if(this.get("summaryFields").length === 0) {
        this._sumMetricCheck.set("disabled", true);
        this._sumMetricCheck.set("checked", true);
      }  
    },
    
    _removeStatsRows: function(){
      array.forEach(this._statsRows, this._removeStatsRow, this);
      this._statsRows = [];
    },
    
    _removeStatsRow: function(row) {
      array.forEach(registry.findWidgets(row), function(w) {
        w.destroyRecursive();
      });    
      domConstruct.destroy(row);
    },
    
    _handleAnalysisLayerChange: function(value) {
      if(value === "browse") {
        if(!this._analysisquery) {
          this._analysisquery = this._browsedlg.browseItems.get("query");
        }
        this._browsedlg.browseItems.set("query", this._analysisquery + " AND tags:\"polygon\"");
        this._isAnalysisSelect = true;
        this._browsedlg.show();
      }
      else {
        this.sumWithinLayer = this.sumWithinLayers[value];
        this._updateAnalysisLayerUI(true);
      }
    },
    
    _updateAnalysisLayerUI: function(override) {
      var layer = this.summaryLayers[this._layersSelect.get("value")];
      if(override && this.get("sumWithinLayer") && layer) {
        this.outputLayerName = string.substitute(this.i18n.outputLayerName, { 
          summaryLayerName: layer.name, 
          sumWithinLayerName: this.sumWithinLayer.name
        });
        this._outputLayerInput.set("value", this.outputLayerName);
      }
    },
    
    _handleBrowseItemsSelect: function(value) {
      if(value && value.selection) {
        AnalysisUtils.addAnalysisReadyLayer({
          item: value.selection,
          layers:  this._isAnalysisSelect? this.sumWithinLayers : this.summaryLayers,
          layersSelect: this._isAnalysisSelect? this._analysisSelect : this._layersSelect,
          browseDialog: this._browsedlg
        }).always(lang.hitch(this, this._updateAnalysisLayerUI, true));
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
    
    _setSumWithinLayersAttr: function(layers) {
       if(!esriLang.isDefined(layers)) {
         return;
       }
       layers = array.filter(layers, function(layer , index) {
          return layer.geometryType === "esriGeometryPolygon";
       });
       this.sumWithinLayers = layers;
    },
    
    //sets the sumWithinLayer
    _setSumWithinLayerAttr: function(layer) {
      if(!esriLang.isDefined(layer)) {
         return;
      }
      if(layer.geometryType === "esriGeometryPolygon") {
        this.sumWithinLayer = layer;
      } 
    },
    
    _setSummaryLayersAttr: function(maplayers) {
      //console.log("inside polygn", maplayers);
      this.summaryLayers = maplayers;
    },
    
    // sets the first point layer as the pointlayer
    _setLayersAttr: function(maplayers) {
      //console.log("maplayers " , maplayers);
      this.summaryLayers = [];
    },
    
    _setAttributesAttr: function(params) {
      if (!params.summaryLayer) {
        return;
      }
      var layer, selectWidget, fields;
      layer = params.summaryLayer;
      selectWidget = params.selectWidget;
      fields = layer.fields;
      selectWidget.addOption({value:"0", label: this.i18n.attribute});
      array.forEach(fields, function(field) {
        //console.log(field, index);
        if(array.indexOf(["esriFieldTypeSmallInteger", "esriFieldTypeInteger", "esriFieldTypeSingle", "esriFieldTypeDouble"], field.type) !== -1 ) {
          //console.log("possible stats attribute", field , "  ", field.type);
          selectWidget.addOption({value:field.name, label:esriLang.isDefined(field.alias) && field.alias !== ""? field.alias : field.name});
        }
      } , this);
    },
    
    _setStatisticsAttr: function(params) {
      var selectWidget = params.selectWidget;
      selectWidget.addOption({value:"0", label: this.i18n.statistic});
      //selectWidget.addOption({value:"COUNT", label:"Count"});
      selectWidget.addOption({value:"SUM", label: this.i18n.sum});
      selectWidget.addOption({value:"MIN", label: this.i18n.minimum});
      selectWidget.addOption({value:"MAX", label: this.i18n.maximum});
      selectWidget.addOption({value:"MEAN", label: this.i18n.average});
      selectWidget.addOption({value:"STDDEV", label: this.i18n.standardDev});
    },
    
    _setSummaryFieldsAttr: function(aggFieldsArr) {
      //["AREA MAX", "POP2000 MAX"]
      //console.log("aggregate fields setter", aggFieldsArr);
      this.summaryFields = aggFieldsArr;
    },
    
    _getSummaryFieldsAttr: function() {
      var aggregateFieldStr = "", aggregateFieldArr = [];
      query(".statsSelect", this.domNode).forEach(function(node) {
        //console.log(node, index);
        var statsSelect, attrSelect;
        statsSelect = registry.byNode(node);
        //console.log(statsSelect);
        attrSelect = statsSelect.get("attributeSelect");
        //console.log("attribute" , attrSelect.get("value"));
        //console.log("stat" , statsSelect.get("value"));
        if (attrSelect.get("value") !== "0" && statsSelect.get("value") !== "0") {
          aggregateFieldStr +=  attrSelect.get("value") + " " +  statsSelect.get("value") + ";";
          aggregateFieldArr.push(attrSelect.get("value") + " " +  statsSelect.get("value"));
        }
      });
      //console.log(aggregateFieldStr);
      //console.log(aggregateFieldArr);
      return aggregateFieldArr;
    },
  /*
         *  "esriFieldTypeSmallInteger", "esriFieldTypeInteger", 
         *  "esriFieldTypeSingle", "esriFieldTypeDouble", 
         * "esriFieldTypeString", "esriFieldTypeDate", 
         * "esriFieldTypeOID", "esriFieldTypeGeometry",
         *  "esriFieldTypeBlob", "esriFieldTypeRaster", 
         * "esriFieldTypeGUID", "esriFieldTypeGlobalID", 
         * "esriFieldTypeXML"
         */  
    // after beta
    _setGroupBySelectAttr: function(groupByField) {
      var summaryLayer = this.summaryLayers[this._layersSelect.get("value")], 
          fields = esriLang.isDefined(summaryLayer)? summaryLayer.fields: [];
      if(this._groupBySelect.getOptions().length > 0) {
         this._groupBySelect.removeOption(this._groupBySelect.getOptions());
      }
      this._groupBySelect.addOption({value:"0", label: this.i18n.attribute});
      array.forEach(fields, function(field, index) {
        //console.log(field, index);
        //"esriFieldTypeSmallInteger", "esriFieldTypeInteger", "esriFieldTypeSingle", "esriFieldTypeDouble"
        if(array.indexOf(["esriFieldTypeSmallInteger", "esriFieldTypeInteger", "esriFieldTypeString", "esriFieldTypeDate"], field.type) !== -1 ) {
          //console.log("possible group by attribute", field , "  ", field.type);
          if(field.name !== summaryLayer.objectIdField) {
            this._groupBySelect.addOption({value:field.name, label:esriLang.isDefined(field.alias) && field.alias !== ""? field.alias : field.name});
          }
        }
      } , this);
      if(groupByField){
        this._groupBySelect.set("value", groupByField);
      }
      this._handleGroupBySelectChange(this._groupBySelect.get("value"));
    },
    
    _setMinorityMajorityAttr: function(value) {
      this.minorityMajority = value;
    },

    _getMinorityMajorityAttr: function(value) {
      if(this._minmajorityCheck) {
        this.minorityMajority = this._minmajorityCheck.get("checked");
      }
      return this.minorityMajority;
    },
    
    _setPercentPointsAttr: function(value) {
      this.percentPoints = value;
    },

    _getPercentPointsAttr: function(value) {
      if(this._percentPointsCheck) {
        this.percentPoints = this._percentPointsCheck.get("checked");
      }
      return this.percentPoints;
    },    
    
    _setDisableRunAnalysisAttr: function(value){
      this._saveBtn.set("disabled", value);
    },
    
    _setShapeUnitsAttr: function(value) {
      this.shapeUnits = value;
    },
    
    _getShapeUnitsAttr: function() {
      return this.shapeUnits;
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
    }
  });
  
  return SummarizeWithin;  
  
});

  



