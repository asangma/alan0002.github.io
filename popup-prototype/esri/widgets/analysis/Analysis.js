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
  "dijit/layout/AccordionContainer",
  "dijit/TitlePane",
  "dojox/widget/TitleGroup",
  

  "../../kernel",
  "./AnalysisToolItem",
  "./utils",
  "dojo/i18n!../../nls/jsapi",
  "dojo/text!./templates/Analysis.html"
], function(require, declare, lang, array, connection, has, string, domStyle, domAttr, domConstruct, query, domClass, _WidgetBase,
   _TemplatedMixin, _WidgetsInTemplateMixin,  _OnDijitClickMixin, _FocusMixin, registry, Accordian, TitlePane,  TitleGroup, esriKernel, AnalysisToolItem, AnalysisUtils, jsapiBundle, template) {
    var Analysis = declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin,  _OnDijitClickMixin, _FocusMixin], {

      declaredClass: "esri.widgets.analysis.Analysis",
      templateString: template,
      basePath: require.toUrl("."),
      widgetsInTemplate : true,
       //testing
      i18n : null,
      helpFileName: "Analysis",
    
      constructor : function(params, srcNodeRef) {
        this._pbConnects = [];
      },
    
      postMixInProperties : function() {
        this.inherited(arguments);
        this.i18n = {};
        lang.mixin(this.i18n, jsapiBundle.common);
        lang.mixin(this.i18n, jsapiBundle.tocPanel);
        lang.mixin(this.i18n, jsapiBundle.analysisTools);
      },
    
      startup: function() {
       this.inherited(arguments);
        /*query(".esriAnalysis .dijitTitlePaneTitle").forEach(function(node, index, nodeList) {
           var categoryWidget = registry.byNode(node), topicName;
           topicName = has("ie")? categoryWidget.get("esriHelpTopic") : categoryWidget.get("esrihelptopic");
           //console.log(topicName);
           domAttr.set(node, "innerHTML", '<span class="esriFloatTrailing helpIcon" esriHelpTopic="'+ topicName +'" data-dojo-attach-point="_helpIconNode"></span>' + node.innerHTML);
        }, this);  */
        this._titlePanes = [
          this._summarizeTools,
          this._locationTools,
          this._geoenrichTools,
          this._analyzePatTools,
          this._proximityTools,
          this._managedataTools
        ];
        array.forEach(this._titlePanes, function(pane){
          //console.log(pane.get("data-esrihelptopic"));
          //console.log(pane.get("data-esriHelpTopic"));
          //console.log((pane.get("data-esrihelptopic") ? pane.get("data-esrihelptopic") : pane.get("data-esriHelpTopic"))); 
          domAttr.set(pane.titleNode, "innerHTML", "<span class='esriFloatTrailing helpIcon' esriHelpTopic='"+ (pane.get("data-esrihelptopic") ? pane.get("data-esrihelptopic") : pane.get("data-esriHelpTopic")) +"' data-dojo-attach-point='_helpIconNode'></span>" + pane.titleNode.innerHTML);  
        }, this);
        this.set("summarizeTools");
        this.set("locationTools");
        this.set("geoenrichTools");
        this.set("analyzePatterns");
        this.set("proximityTools");
        this.set("manageDataTools");
        this._leftAccordion.startup();
        //Hide the dummy pane
        /*query(".esriAnalysis .dijitAccordionInnerContainer.dijitAccordionInnerContainerSelected.dijitSelected").forEach(function(node, index, nodeList) {
          domStyle.set(node, "display", "none");
        });
        if(has("ie") <= 8 ) {
          domStyle.set(this._leftAccordion.domNode, "width", "95%");
        }*/ 
        array.forEach(this._titlePanes, function(pane) {
          pane.startup();
        });
        AnalysisUtils.initHelpLinks(this.domNode);
        //this._leftAccordion.startup();
        //this._leftAccordion.watch("selectedChildWidget", lang.hitch(this, this._onSelectedPaneChange));
      },
      
      
      destroy: function(){
        this.inherited(arguments);
        array.forEach(this._pbConnects, connection.disconnect);
        delete this._pbConnects;
      },
      
      //Helpers
      _connect: function(node, evt, func){
        this._pbConnects.push(connection.connect(node, evt, func));
      },
      
      //getters and setters
      _setSummarizeToolsAttr : function() {
        //_summarizeTools
        var mainDiv = domConstruct.create("div");
        var aggregateTool = new AnalysisToolItem({
          name : this.i18n.aggregatePoints,
          helpTopic: "AggregatePointsTool",
          toolIcon : "aggregateIcon"
        }, domConstruct.create("div", null, mainDiv));
        aggregateTool.set("showComingSoonLabel", false);
        this._connect(aggregateTool, "onToolSelect", lang.hitch(this, "onToolSelect"));
        
        //sumnearbyIcon
        var sumNearyByTool = new AnalysisToolItem({
          name : this.i18n.summarizeNearby,
          helpTopic: "SummarizeNearbyTool",
          toolIcon : "sumNearbyIcon"
        }, domConstruct.create("div", null, mainDiv));
        sumNearyByTool.set("showComingSoonLabel", false);
        this._connect(sumNearyByTool, "onToolSelect", lang.hitch(this, "onToolSelect"));
        
        var summarizeTool = new AnalysisToolItem({
          name : this.i18n.summarizeWithin,
          helpTopic: "SummarizeWithinTool",
          toolIcon : "sumWithinIcon"
        }, domConstruct.create("div", null, mainDiv));
        summarizeTool.set("showComingSoonLabel", false);
        this._connect(summarizeTool, "onToolSelect", lang.hitch(this, "onToolSelect"));
        
        this._summarizeTools.set("content", mainDiv);
        
      },
    
      _setLocationToolsAttr : function() {
        var mainDiv = domConstruct.create("div");
        
        var findLocationsTool = new AnalysisToolItem({
          name : this.i18n.findExistingLocations,
          helpTopic: "FindExistingLocationsTool",
          toolIcon : "findLocationsIcon"
        }, domConstruct.create("div", null, mainDiv));
        findLocationsTool.set("showComingSoonLabel", false);
        this._connect(findLocationsTool, "onToolSelect", lang.hitch(this, "onToolSelect"));
        
        var findNewLocationsTool = new AnalysisToolItem({
          name : this.i18n.deriveNewLocations,
          helpTopic: "DeriveNewLocationsTool",
          toolIcon : "findNewLocationsIcon"
        }, domConstruct.create("div", null, mainDiv));
        findNewLocationsTool.set("showComingSoonLabel", false);
        this._connect(findNewLocationsTool, "onToolSelect", lang.hitch(this, "onToolSelect"));
        
        var findSimilarLocationsTool = new AnalysisToolItem({
          name : this.i18n.findSimilarLocations,
          helpTopic: "FindSimilarLocationsTool",
          toolIcon : "findSimilarLocationsIcon"
        }, domConstruct.create("div", null, mainDiv));
        findSimilarLocationsTool.set("showComingSoonLabel", false);
        this._connect(findSimilarLocationsTool, "onToolSelect", lang.hitch(this, "onToolSelect"));
     
        var createViewshedTool = new AnalysisToolItem({
          name : this.i18n.createViewshed,
          helpTopic: "CreateViewshedTool",
          toolIcon : "createViewshedIcon"
        }, domConstruct.create("div", null, mainDiv));
        createViewshedTool.set("showComingSoonLabel", false);
        this._connect(createViewshedTool, "onToolSelect", lang.hitch(this, "onToolSelect"));
        
        var createWatershedsTool = new AnalysisToolItem({
          name : this.i18n.createWatershed,
          helpTopic: "CreateWatershedsTool",
          toolIcon : "createWatershedIcon"
        }, domConstruct.create("div", null, mainDiv));
        createWatershedsTool.set("showComingSoonLabel", false);
        this._connect(createWatershedsTool, "onToolSelect", lang.hitch(this, "onToolSelect"));
        
        
        var traceDownStreamTool = new AnalysisToolItem({
          name : this.i18n.traceDownstream,
          helpTopic: "TraceDownstreamTool",
          toolIcon : "traceDownstreamIcon"
        }, domConstruct.create("div", null, mainDiv));
        traceDownStreamTool.set("showComingSoonLabel", false);
        this._connect(traceDownStreamTool, "onToolSelect", lang.hitch(this, "onToolSelect"));
        
        this._locationTools.set("content", mainDiv);
      },
    
      _setGeoenrichToolsAttr : function() {
        var mainDiv = domConstruct.create("div");
        
        var geoenrichLayerTool = new AnalysisToolItem({
          name : this.i18n.enrichLayer,
          helpTopic: "EnrichLayerTool",
          toolIcon : "geoenrichLayerIcon"
          
        }, domConstruct.create("div", null, mainDiv));
        geoenrichLayerTool.set("showComingSoonLabel", false);
        this._connect(geoenrichLayerTool, "onToolSelect", lang.hitch(this, "onToolSelect"));
        this._geoenrichTools.set("content", mainDiv);
      },
      
      _setProximityToolsAttr : function() {
        var mainDiv = domConstruct.create("div");
        
        var buffersTool = new AnalysisToolItem({
          name : this.i18n.createBuffers,
          helpTopic: "CreateBuffersTool",
          toolIcon : "buffersIcon"
        }, domConstruct.create("div", null, mainDiv));
        this._connect(buffersTool, "onToolSelect", lang.hitch(this, "onToolSelect"));
        buffersTool.set("showComingSoonLabel", false);
    
        var driveTool = new AnalysisToolItem({
          name : this.i18n.createDriveTimeAreas,
          helpTopic: "CreateDriveTimeAreasTool",
          toolIcon : "driveIcon"
        }, domConstruct.create("div", null, mainDiv));
        domStyle.set(driveTool.optionsDiv, "margin-top", "0");
        driveTool.set("showComingSoonLabel", false);
        this._connect(driveTool, "onToolSelect", lang.hitch(this, "onToolSelect"));

        var findClosestFacilityTool = new AnalysisToolItem({
          name : this.i18n.findNearest,
          helpTopic: "FindNearestTool",
          toolIcon : "findClosestFacilityIcon"
        }, domConstruct.create("div", null, mainDiv));
        findClosestFacilityTool.set("showComingSoonLabel", false);
        this._connect(findClosestFacilityTool, "onToolSelect", lang.hitch(this, "onToolSelect"));

        var planRoutes = new AnalysisToolItem({
          name : this.i18n.planRoutes,
          helpTopic: "PlanRoutesTool",
          toolIcon : "planRoutesIcon"
        }, domConstruct.create("div", null, mainDiv));
        domStyle.set(planRoutes.optionsDiv, "margin-top", "0");
        planRoutes.set("showComingSoonLabel", false);
        this._connect(planRoutes, "onToolSelect", lang.hitch(this, "onToolSelect"));
        
        var connectOriginsToDestinations = new AnalysisToolItem({
          name : this.i18n.connectOriginsToDestinations,
          helpTopic: "ConnectOriginsToDestinationsTool",
          toolIcon : "connectODIcon"
        }, domConstruct.create("div", null, mainDiv));
        domStyle.set(connectOriginsToDestinations.optionsDiv, "margin-top", "0");
        connectOriginsToDestinations.set("showComingSoonLabel", false);
        this._connect(connectOriginsToDestinations, "onToolSelect", lang.hitch(this, "onToolSelect"));        

        this._proximityTools.set("content", mainDiv);
      },
    
      
      _setAnalyzePatternsAttr : function() {
        var mainDiv, findHotSpots, interpolatePoints, calculateDensity;
        //correlationReporter
        mainDiv = domConstruct.create("div");
        calculateDensity = new AnalysisToolItem({
          name : this.i18n.calculateDensity,
          helpTopic: "CalculateDensityTool",
          toolIcon : "createDensitySurfaceIcon"
        }, domConstruct.create("div", null, mainDiv));
        calculateDensity.set("showComingSoonLabel", false);
        this._connect(calculateDensity, "onToolSelect", lang.hitch(this, "onToolSelect"));
        
        /*correlationReporter = new AnalysisToolItem({
          name : this.i18n.exploreCorrelations,
          helpTopic: "ExploreCorrelationsTool",
          toolIcon : "correlationReporterIcon"
        }, domConstruct.create("div", null, mainDiv));*/
        
        findHotSpots = new AnalysisToolItem({
          name : this.i18n.findHotSpots,
          helpTopic: "FindHotSpotsTool",
          toolIcon : "findHotSpotsIcon"
        }, domConstruct.create("div", null, mainDiv));
        findHotSpots.set("showComingSoonLabel", false);
        this._connect(findHotSpots, "onToolSelect", lang.hitch(this, "onToolSelect"));
        
        interpolatePoints = new AnalysisToolItem({
          name : this.i18n.interpolatePoints,
          helpTopic: "InterpolatePointsTool",
          toolIcon : "createInterpolatedSurfaceIcon"
        }, domConstruct.create("div", null, mainDiv));
        interpolatePoints.set("showComingSoonLabel", false);
        this._connect(interpolatePoints, "onToolSelect", lang.hitch(this, "onToolSelect"));
        this._analyzePatTools.set("content", mainDiv);
      },
    
    
      _setInterpolateToolsAttr : function() {
        var mainDiv, createInterpolatedSurface;
        mainDiv = domConstruct.create("div");
        
        createInterpolatedSurface = new AnalysisToolItem({
          name : this.i18n.createInterpolatedSurface,
          helpTopic: "SummarizeWithinTool",
          toolIcon : "createInterpolatedSurfaceIcon"
        }, domConstruct.create("div", null, mainDiv));
        
        
        this._interpolateTools.set("content", mainDiv);
      },
    
      _setManageDataToolsAttr : function() {
        //_summarizeTools
        var mainDiv, dissolveBoundaries, extractData, mergeLayers, overlayLayers;
        mainDiv = domConstruct.create("div");
        
        dissolveBoundaries = new AnalysisToolItem({
          name : this.i18n.dissolveBoundaries,
          helpTopic: "DissolveBoundariesTool",
          toolIcon : "dissolveBoundariesIcon"
        }, domConstruct.create("div", null, mainDiv));
        dissolveBoundaries.set("showComingSoonLabel", false);
        this._connect(dissolveBoundaries, "onToolSelect", lang.hitch(this, "onToolSelect"));
                   
        
        extractData = new AnalysisToolItem({
          name : this.i18n.extractData,
          helpTopic: "ExtractDataTool",
          toolIcon : "extractDataIcon"
        }, domConstruct.create("div", null, mainDiv));     
        extractData.set("showComingSoonLabel", false);
        this._connect(extractData, "onToolSelect", lang.hitch(this, "onToolSelect"));
       
        mergeLayers = new AnalysisToolItem({
          name : this.i18n.mergeLayers,
          helpTopic: "MergeLayersTool",
          toolIcon : "mergeLayersIcon"
        }, domConstruct.create("div", null, mainDiv));
        mergeLayers.set("showComingSoonLabel", false);
        this._connect(mergeLayers, "onToolSelect", lang.hitch(this, "onToolSelect"));        
    
        overlayLayers = new AnalysisToolItem({
          name : this.i18n.overlayLayers,
          helpTopic: "OverlayLayersTool",
          toolIcon : "overlayLayersIcon"
        }, domConstruct.create("div", null, mainDiv));
        overlayLayers.set("showComingSoonLabel", false);
        this._connect(overlayLayers, "onToolSelect", lang.hitch(this, "onToolSelect"));
        
         this._managedataTools.set("content", mainDiv);
      },
      
      _getSelectedCategoryAttr: function() {
        var selWidget;
        selWidget = array.filter(this._titlePanes, function(child,index) {
          return child.open;
        })[0];
        return selWidget.get("data-esrihelptopic");
      },
      
      _getSelectedPaneAttr: function() {
        var selWidget;
        selWidget = array.filter(this._titlePanes, function(child,index) {
          return child.open;
        })[0];
        return selWidget;
      },
      
      _setSelectedCategoryAttr: function(categoryName) {
        //categoryName is esrihelptopic
        console.log("setting", categoryName);
        var topicName;
        array.forEach(this._titlePanes, function(pane) {
           topicName = pane.get("data-esrihelptopic");
           if (topicName === categoryName) {
             //this._leftAccordion.selectChild(pane);
             pane.set("open", true);
           }
        }, this);  
      },
      
      hide: function(name) {
        var nodeList = query("div[data-esrihelptopic ='"+ name +"']");
        if (nodeList.length === 0) {
          nodeList = query("a[esrihelptopic ='"+ name +"']");
        }
        if(nodeList.length > 0) {
          nodeList.forEach(function(node) {
            if(node && registry.getEnclosingWidget(node)) {
              domStyle.set(registry.getEnclosingWidget(node).domNode, "display", "none");
            }
          });
        }
      },
      
      //events
      onToolSelect: function(tool) {
        //console.log(tool);
        //console.log(tool.toolName);
      }
      
      
    });
  
    
    return Analysis;    
});
