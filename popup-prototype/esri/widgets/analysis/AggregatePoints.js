/******************************************
  esri/widgets/analysis/AggregatePoints
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
  "dijit/InlineEditBox",
  
  "../../kernel",
  "../../core/lang",
  "./AnalysisBase",
  "./utils",
  "./CreditEstimator",
  "./_AnalysisOptions",
  "dojo/i18n!../../nls/jsapi",
  "dojo/text!./templates/AggregatePoints.html"
], function(require, declare, lang, array, connection, has, string, domStyle, domAttr, domConstruct, query, domClass, _WidgetBase,
   _TemplatedMixin, _WidgetsInTemplateMixin,  _OnDijitClickMixin, _FocusMixin, registry, Button, CheckBox, Form, Select, TextBox, ValidationTextBox, ContentPane, ComboBox, Dialog, InlineEditBox, esriKernel, esriLang, AnalysisBase, AnalysisUtils, CreditEstimator, _AnalysisOptions, jsapiBundle, template) {
  var AggregatePoints = declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin,  _OnDijitClickMixin, _FocusMixin, _AnalysisOptions, AnalysisBase], {

    declaredClass: "esri.widgets.analysis.AggregatePoints",

    templateString: template,
    basePath: require.toUrl("."),
    widgetsInTemplate: true,
    
    //attributes for constructing the Tool, the names matches the REST service property names
    // used in setting up the UI and during re run to construct the UI
    pointLayer: null, // layer analyzed
    polygonLayers: null, // array of possible feature layes aggrgating to
    summaryFields: null, //possible stats atribute fields
    outputLayerName: null,
    keepBoundariesWithNoPoints: true,
    polygonLayer: null, // the polygon layer to be shown selected in dropdown
    groupByField: null,
    minorityMajority: false,
    percentPoints:false,
    
    i18n: null,
    
    toolName: "AggregatePoints",
    helpFileName: "AggregatePoints",
    resultParameter:"AggregatedLayer",
    
    _afterAnalysisStr: "",
    _beforeAnalysisStr: "",
   
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
      //var x = val.replace(/&/gm, "&").replace(/</gm, "<").replace(/>/gm, ">").replace(/"/gm, """).replace(/\n/g, "<br>");
      //var str = str.replace(/&/gm, "&").replace(/</gm, "<").replace(/>/gm, ">").replace(/"/gm, """);
       //var str = str.replace(/&/gm, "&").replace(/</gm, "<").replace(/>/gm, ">").replace(/"/gm, "\"");
    },
    
    postMixInProperties: function(){
      this.inherited(arguments);
      lang.mixin(this.i18n, jsapiBundle.aggregatePointsTool); 
      this._beforeAnalysisStr = this.i18n.aggregateDefine.substring(0, this.i18n.aggregateDefine.indexOf("<b>${layername}</b>"));
      this._afterAnalysisStr = this.i18n.aggregateDefine.substring(this.i18n.aggregateDefine.indexOf("<b>${layername}</b>")  + "<b>${layername}</b>".length);
    
    },
    
    postCreate: function(){
      this.inherited(arguments);
      domClass.add(this._form.domNode, "esriSimpleForm");
      ////domAttr.set(this._closeImg, "src" , this.basePath + "/images/close.gif");
      this._outputLayerInput.set("validator", lang.hitch(this, this.validateServiceName));
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
        this.emit("save", {"save": true});
      }
      this.emit("close", {"save": save}); //event
    },
    
    _handleSaveBtnClick: function() {
      //console.log("Call Success Submit Job");
      //construct job params object
      if(!this._form.validate()) {
        return;
      }
      this._saveBtn.set("disabled", true);
      var jobParams = {}, executeObj = {}, polyLayer, contextObj; 
      polyLayer = this.polygonLayers[this._layersSelect.get("value")];
      //input polygon layer url or featureset
      jobParams.PolygonLayer = JSON.stringify(AnalysisUtils.constructAnalysisInputLyrObj(polyLayer));
      //input point layer url or featureset 
      jobParams.PointLayer = JSON.stringify(AnalysisUtils.constructAnalysisInputLyrObj(this.pointLayer));
      //AggregateFields
      jobParams.SummaryFields  = JSON.stringify(this.get("summaryFields"));
      //outputLayer
      if(!this.returnFeatureCollection) {
        jobParams.OutputName = JSON.stringify({
          serviceProperties : {
            name: this._outputLayerInput.get("value")
          }
        });
      }
      jobParams.KeepBoundariesWithNoPoints  = this._keepPolygonsCheck.get("checked");
      if(this._groupBySelect.get("value") !== "0") {
        jobParams.GroupByField = this._groupBySelect.get("value");
        this.resultParameter = ["aggregatedLayer","groupSummary"];
        jobParams.minorityMajority = this.get("minorityMajority");
        jobParams.percentPoints = this.get("percentPoints");
      }
     
      if(this.showChooseExtent) {
        //console.log('showextent ux', this.showChooseExtent);
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
      //jobParams.returnFeatureCollection = this.returnFeatureCollection;      
      //console.log(jobParams);
      executeObj.jobParams  = jobParams;

      //console.log(this._webMapFolderSelect.get("value"));

      //construct the item params object for the ouput fetaure service item 
      //console.log(polyLayer);
      //polyLayer.name changed here  polyLayer.layer["name"] in viewer the web map name can be passed through
      executeObj.itemParams = { 
        "description" : string.substitute(this.i18n.itemDescription, {pointlayername:this.pointLayer.name, polygonlayername:  polyLayer.name}),
        "tags": string.substitute(this.i18n.itemTags, {pointlayername: this.pointLayer.name, polygonlayername:  polyLayer.name}),
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
   
    _handleLayerChange: function(index) {
      //console.log("layer change Success" , index);
      //console.log("chosen layer Success", this.polygonLayers[index]);
      if(index === "browse") {
        if(!this._analysisquery) {
          this._analysisquery = this._browsedlg.browseItems.get("query");
        }
        this._browsedlg.browseItems.set("query", this._analysisquery + " AND tags:\"polygon\"");
        this._isAnalysisSelect = false;
        this._browsedlg.show();
      }
      else {
        this.outputLayerName = string.substitute(this.i18n.outputLayerName, {pointlayername: this.pointLayer.name, polygonlayername: this.polygonLayers[index].name});
        this._outputLayerInput.set("value", this.outputLayerName);
      }
    },
    
    _handleBrowseItemsSelect: function(value) {
      if(value && value.selection) {
        AnalysisUtils.addAnalysisReadyLayer({
          item: value.selection,
          layers:  this._isAnalysisSelect? this.pointLayers : this.polygonLayers,
          layersSelect: this._isAnalysisSelect? this._analysisSelect : this._layersSelect,
          browseDialog: this._browsedlg
        }).always(lang.hitch(this, this._updateAnalysisLayerUI, true));
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
          this.set("isnewRowAdded", true);
        }
      }
    },
    
    _handleShowCreditsClick: function(e) {
      e.preventDefault();
      var jobParams = {}, polyLayer;
      if(!this._form.validate()) {
        return;
      } 
      polyLayer = this.polygonLayers[this._layersSelect.get("value")];
      //input polygon layer url or featureset
      jobParams.PolygonLayer = JSON.stringify(AnalysisUtils.constructAnalysisInputLyrObj(polyLayer));
      //input point layer url or featureset 
      jobParams.PointLayer = JSON.stringify(AnalysisUtils.constructAnalysisInputLyrObj(this.pointLayer));
      //AggregateFields
      jobParams.SummaryFields  = JSON.stringify(this.get("summaryFields"));
      //outputLayer
      if(!this.returnFeatureCollection) {
        jobParams.OutputName = JSON.stringify({
          serviceProperties : {
            name: this._outputLayerInput.get("value")
          }
        });
      }
      jobParams.KeepBoundariesWithNoPoints  = this._keepPolygonsCheck.get("checked");
      if(this._groupBySelect.get("value") !== "0") {
        jobParams.GroupByField = this._groupBySelect.get("value");
      }
     
      if(this.showChooseExtent) {
        //console.log('showextent ux', this.showChooseExtent);
        //console.log(this._useExtentCheck.get("checked"));
        if(this._useExtentCheck.get("checked")) {
          jobParams.Context = JSON.stringify({
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
        if(!this.get("pointLayer") && this.get("pointLayers")) {
          this.set("pointLayer", this.pointLayers[0]);
        }
        AnalysisUtils.populateAnalysisLayers(this, "pointLayer", "pointLayers");
      }
      if(this.pointLayer) {
        //console.log(this.pointLayer.name);
        domAttr.set(this._aggregateToolDescription, "innerHTML", string.substitute(this.i18n.aggregateDefine, {layername: this.pointLayer.name}));
      }
   
      if(this.polygonLayers) {
        array.forEach(this.polygonLayers, function(layer , index) {
          if(layer.geometryType === "esriGeometryPolygon") {
            this._layersSelect.addOption({value:index, label:layer.name});
            /*if (index === 0 && !this.outputLayerName) {
              this.outputLayerName = string.substitute(this.i18n.outputLayerName, {pointlayername: this.pointLayer.name, polygonlayername: layer.name});
            }*/
          }
        }, this);      
      }
      AnalysisUtils.addReadyToUseLayerOption(this, [this._analysisSelect, this._layersSelect]);
      if(this.outputLayerName) {
        this._outputLayerInput.set("value", this.outputLayerName);
        override = false;
      }
      
      this._keepPolygonsCheck.set("checked", this.keepBoundariesWithNoPoints);
      
      if(this.polygonLayer) {
        this._layersSelect.set("value", this.polygonLayer);
      }
      
      //creates the row stats and attributes in the select box
      //this._createStatsRow();
       
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
      domStyle.set(this._showCreditsLink, "display", this.showCredits === true? "block" : "none");
      if(this.minorityMajority) {
        this._minmajorityCheck.set("checked", this.minorityMajority);
      }
      if(this.percentPoints) {
        this._percentPointsCheck.set("checked", this.percentPoints);
      }
      domStyle.set(this._closeBtn, "display", this.get("showCloseIcon") ? "block": "none");
      this._updateAnalysisLayerUI(override);
      this._loadConnections();
    },
    
    _loadConnections: function(){
      this.on("start", lang.hitch(this, "_onClose", true));
      this._connect(this._closeBtn, "onclick", lang.hitch(this, "_onClose", false));
    },
     
     // use a simpler logic of using pointer with id with the relationshipd between attr and stats select boxes
    _createStatsRow: function() {
      //console.log("Success Row");
      // add a new stats Row before the  this._afterStatsRow row    
      var statsRow, statsTd, attrTd, attrSelect, statsSelect, removeIcon, removeTd;
      statsRow = domConstruct.create("tr", null ,this._afterStatsRow, "before");
      attrTd = domConstruct.create("td", {style: {width:"45%", maxWidth:"100px"}} , statsRow);
      statsTd = domConstruct.create("td", {style: {width:"55%", maxWidth:"104px"}}, statsRow);
      
      attrSelect = new Select({ 
        maxHeight:200, 
        "class": "esriLeadingMargin1 mediumInput esriTrailingMargin025 attrSelect", 
        style:{
          tableLayout: "fixed", 
          overflowX:"hidden"
        }
      }, domConstruct.create("select", null, attrTd));
      this.set("attributes", {selectWidget: attrSelect, pointLayer: this.pointLayer});
      statsSelect = new Select({
        "class": "mediumInput statsSelect", 
        style:{
          tableLayout: "fixed", 
          overflowX: "hidden"
        }
      }, domConstruct.create("select",  null, statsTd));
      this.set("statistics", {selectWidget: statsSelect});  
      
      attrSelect.set("statisticSelect", statsSelect);
      connection.connect(attrSelect, "onChange", this._handleAttrSelectChange);
      
      removeTd= domConstruct.create("td", {"class":"shortTextInput removeTd" , style :{"display": "none" ,maxWidth:"12px"}} , statsRow);
      removeIcon = domConstruct.create("a", {
        "title": this.i18n.removeAttrStats,
        "class": "closeIcon statsRemove",
        "innerHTML": "<img src='"+ this.basePath + "/images/close.gif"+"' border='0''/>"
      }, removeTd);
      connection.connect(removeIcon, "onclick", lang.hitch(this, this._removeStatsRow, statsRow));
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
    
    _removeStatsRow: function(row) {
      array.forEach(registry.findWidgets(row), function(w) {
        w.destroyRecursive();
      });    
      domConstruct.destroy(row);
    },
    
    _removeStatsRows: function(){
      array.forEach(this._statsRows, this._removeStatsRow, this);
      this._statsRows = [];
    },
    
    _handleGroupBySelectChange: function(value) {
      var isDisabled = (value === "0");
      domClass.toggle(this._minmajorityLabel, "esriAnalysisTextDisabled", isDisabled);
      domClass.toggle(this._percentPointsLabel, "esriAnalysisTextDisabled", isDisabled);
      this._percentPointsCheck.set("disabled", isDisabled);
      this._minmajorityCheck.set("disabled", isDisabled);
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
        this.pointLayer = this.pointLayers[value];
        this._updateAnalysisLayerUI(true);
      }
      
    },
    
    _updateAnalysisLayerUI: function(overide) {
      if(this.pointLayer) {
        //console.log(this.pointLayer.name);
        domAttr.set(this._aggregateToolDescription, "innerHTML", string.substitute(this.i18n.aggregateDefine, {layername: this.pointLayer.name}));
        
        var polyLayer = this.polygonLayers[this._layersSelect.get("value")];
        if(overide && polyLayer) {
          this.outputLayerName = string.substitute(this.i18n.outputLayerName, {pointlayername: this.pointLayer.name, polygonlayername: polyLayer.name});
          this._outputLayerInput.set("value", this.outputLayerName);
        }
        this._removeStatsRows();
        this._createStatsRow();
        this.set("groupBySelect", this.groupByField );
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
    _setPointLayerAttr: function(layer) {
      if(esriLang.isDefined(layer) && (layer.geometryType === "esriGeometryPoint" || layer.geometryType === "esriGeometryMultipoint")) {
        //console.log(layer.name , "is a point layer");
        this.pointLayer = layer;
      } 
    },
    
    _setPolygonLayersAttr: function(maplayers) {
      //console.log("inside polygn", maplayers);
      this.polygonLayers = maplayers;
    },
    
    // sets the first point layer as the pointlayer
    _setLayersAttr: function(maplayers) {
      //console.log("maplayers " , maplayers);
      this.polygonLayers = [];
      array.forEach(maplayers, function(layer) {
        if(layer.geometryType === "esriGeometryPolygon") {
          this.polygonLayers.push(layer);
        }
        else if(layer.geometryType === "esriGeometryPoint") {
          //console.log(layer.name , "is a point layer");
          this.pointLayer = layer;
        }
      }, this);
    },
    
    _setAttributesAttr: function(params) {
      if (!params.pointLayer) {
        return;
      }
      var layer, selectWidget, fields;
      layer = params.pointLayer;
      selectWidget = params.selectWidget;
      fields = layer.fields;
      selectWidget.addOption({value:"0", label: this.i18n.attribute});
      array.forEach(fields, function(field) {
        //console.log(field, index);
        if(array.indexOf(["esriFieldTypeSmallInteger", "esriFieldTypeInteger", "esriFieldTypeSingle", "esriFieldTypeDouble"], field.type) !== -1 ) {
          //console.log("possible stats attribute", field , "  ", field.type);
          if(field.name !== layer.objectIdField) {
            selectWidget.addOption({value:field.name, label:esriLang.isDefined(field.alias) && field.alias !== ""? field.alias : field.name});
          }
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
      var aggregateFieldStr = "", aggregateFieldArr = [], statsSelect, attrSelect;
      query(".statsSelect", this.domNode).forEach(function(node) {
        //console.log(node, index);
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
      if (!this.pointLayer) {
        return;
      }
      var  fields = this.pointLayer.fields;
      this._groupBySelect.removeOption(this._groupBySelect.getOptions());
      this._groupBySelect.addOption({value:"0", label: this.i18n.attribute});
      array.forEach(fields, function(field) {
        //console.log(field, index);
        if(array.indexOf(["esriFieldTypeSmallInteger", "esriFieldTypeInteger", "esriFieldTypeString", "esriFieldTypeDate"], field.type) !== -1 ) {
          //console.log("possible group by attribute", field , "  ", field.type);
          if(field.name !== this.pointLayer.objectIdField) {
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
    
    _setPointLayersAttr: function(layers) {
      if(!esriLang.isDefined(layers)) {
         return;
      }
      layers = array.filter(layers, function(layer , index) {
        return (layer.geometryType === "esriGeometryPoint" || layer.geometryType === "esriGeometryMultipoint");
      });
      this.pointLayers = layers; 
    },
    
    
    ////////////////////////////
    // Helpers
    ////////////////////////////
    _connect: function(node, evt, func){
      this._pbConnects.push(connection.connect(node, evt, func));
    }
  });
  
  return AggregatePoints;  
  
});
