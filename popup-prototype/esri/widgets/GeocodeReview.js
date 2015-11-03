define([
  "require",
  "dojo/on",
  "dojo/Evented",
  "../core/declare",
  "dojo/_base/lang",
  "dojo/_base/Deferred",
  "dojo/_base/array",
  "dojo/text!./GeocodeReview/templates/Review.html",
  "dojo/i18n!../nls/jsapi",
  "dojo/store/Memory",
  "dojo/string",
  "dojo/dom",
  "dojo/dom-style",
  
  "dijit/_WidgetBase",
  "dijit/_OnDijitClickMixin",
  "dijit/_TemplatedMixin",
  "dijit/_WidgetsInTemplateMixin",

  "dgrid/OnDemandGrid",
  "dgrid/Selection",
  "dgrid/Keyboard",
  "dgrid/Editor",
  "dgrid/extensions/DijitRegistry",
  "dgrid/extensions/ColumnHider",

  "../Graphic",
  "../geometry/Extent", 
  "../geometry/Point",
  "../geometry/support/webMercatorUtils",
  "../symbols/PictureMarkerSymbol",
 
  "../tasks/support/Query",
  "../layers/FeatureLayer",
  "../layers/GraphicsLayer",
  
  "../request",
  "../portal/utils"
], function (
  require, on, Evented, declare, lang, Deferred, array, template, i18n, Memory, string, dom, domStyle,
  _WidgetBase, _OnDijitClickMixin, _TemplatedMixin,  _WidgetsInTemplateMixin, 
  OnDemandGrid, Selection, Keyboard, Editor, DijitRegistry, ColumnHider,
  Graphic, Extent, Point, webMercatorUtils, PictureMarkerSymbol,
  Query, FeatureLayer, GraphicsLayer, 
  esriRequest, arcgisUtils
) {
  var Widget = declare([_WidgetBase, _OnDijitClickMixin, _TemplatedMixin, _WidgetsInTemplateMixin, Evented], {
    
    // Default Properties
    baseClass:'esriReviewContainer',
    basePath: require.toUrl("./GeocodeReview/"),
    loaded:false,
    templateString: template,
    widgetsInTemplate:true,
    i18n: i18n,

    constructor: function (options, srcRefNode) {
      declare.safeMixin(this, options);
      // Grid, Stores & Columns Setup
      this.StandardGrid = declare([DijitRegistry, OnDemandGrid, Selection, Keyboard, Editor, ColumnHider]);
      this._defineGridStores();
      this._defineColumns();
      // Required for StackController
      //this.containerNode = srcRefNode;
      this.stackContainerID = srcRefNode + "_StackContainerNode";
      this.headerID = srcRefNode + "_HeaderNode";
      this.unmatchedUC = i18n.widgets.geocodeReview.unmatchedUC;
      this.matchedUC = i18n.widgets.geocodeReview.matchedUC;
      this.reviewedUC = i18n.widgets.geocodeReview.reviewedUC;
      
      if(!this.suggestionGraphic){
        this.suggestionGraphic = new PictureMarkerSymbol(this.basePath.toString() + "images/EsriBluePinCircle26.png", 26, 26);
        this.suggestionGraphic.setOffset(0, 12);
      }
      
      if(!this.matchGraphic){
        this.matchGraphic =  new PictureMarkerSymbol(this.basePath.toString() + "images/EsriGreenPinCircle26.png", 26, 26);
        this.matchGraphic.setOffset(0, 12);
      }
      
      if(!this.highlightGraphic){  
        this.highlightGraphic =  new PictureMarkerSymbol(this.basePath.toString() + "images/EsriYellowPinCircle26.png", 26, 26);
        this.highlightGraphic.setOffset(0, 12);
      }

      this._keywordMap = {};
      this._keywordArray = [];
      //this._arcgisUrl = "http://devext.arcgis.com/sharing/content/items";
      this._arcgisUrl = lang.getObject("esri.arcgis.utils.arcgisUrl");
      this._singleLineInput = true;
    }, // End constructor
    
    postCreate: function () {
      this.inherited(arguments);  
      // Grid & Map Setup
      this._generateGrids();
      this.graphicsLayer = new GraphicsLayer();
      this.map.addLayer(this.graphicsLayer); 
      
      // Events
      this._listenerHandles = [
        // On Tab Change
       this.StackControllerNode.on("selectChild", lang.hitch(this, function(){
          this.clearGridSelection();
          if(this.StackContainerNode.selectedChildWidget){
            this.currentTab = this.StackContainerNode.selectedChildWidget;
            this.currentTabId = this.StackContainerNode.selectedChildWidget.id;
          }
          this.resize();
          this.graphicsLayer.clear();
          this.emit("tab-change", {});
          
          if(this.geocodeMatch){
            this.geocodeMatch.reset();
          }
          
       })),
        on(this.map, "resize", lang.hitch(this, function(){	
            this.resize();
        })),
        on(window, "resize", lang.hitch(this, function(){	
            this.resize();
        })),
        // On Unmatched Grid Row Select
        on(this._gridUnmatchedRef, "dgrid-select", lang.hitch(this, function(event){	
          if(event.rows[0].data.oid){
            this.currentSelectedRow = this._unmatchedStore.get(event.rows[0].data.oid);    
            this._selectGridRowEvent(event.rows[0].data.oid, this.currentSelectedRow);
          }else{
            this.currentSelectedRow = this._unmatchedStore.get(event.rows[0].data[this._tableLayer.objectIdField]);         
            this._selectGridRowEvent(event.rows[0].data[this._tableLayer.objectIdField], this._unmatchedStore.get(event.rows[0].data[this._tableLayer.objectIdField]));
          }
        })),
        // On Matched Grid Row Select
        on(this._gridMatchedRef, "dgrid-select", lang.hitch(this, function(event){	
          this.currentSelectedRow = this._matchedStore.get(event.rows[0].data[this._featureLayer.objectIdField]);
          this._selectGridRowEvent(event.rows[0].data[this._featureLayer.objectIdField], this._matchedStore.get(event.rows[0].data[this._featureLayer.objectIdField]));
          //console.log('this.currentSelectedRow',this.currentSelectedRow);
        })),
        // On Reviewed Grid Row Select
         on(this._gridReviewedRef, "dgrid-select", lang.hitch(this, function(event){	
          this.currentSelectedRow = this._reviewedStore.get(event.rows[0].data.id);
          this._drawReviewedRow(event.rows[0].data);
          //console.log('this.currentSelectedRow',this.currentSelectedRow);
           
        })),
        // On Matched Grid Row Data Change...
        on(this._gridMatchedRef, "dgrid-datachange", lang.hitch(this, function(evt){
          var location = null, returnData, rowData = evt.cell.row.data;
          this._matchedStore.get(evt.cell.row.id).updated = true;
          this._matchedStore.get(evt.cell.row.id)[evt.cell.column.field] = evt.value;
          if(this._matchedStore.get(evt.cell.row.id).location){
            location = this._matchedStore.get(evt.cell.row.id).location;
          }

          if(this._singleLineInput){
           returnData = {
              "id": rowData[this._featureLayer.objectIdField],
              "address": rowData[this._keywordMap.Address],
              "location": location,
              "featureType": rowData.featureType,
              "reviewed": rowData.reviewed,
              "updated": true,
              "sourceCountry": this._sourceCountry 
            };
          }else{
            returnData = {
              "id":  rowData[this._featureLayer.objectIdField],
              "address": this._formatLocatorOptions(rowData),
              "location": location,
              "featureType": rowData.featureType,
              "reviewed": rowData.reviewed,
              "updated": true,
              "sourceCountry": this._sourceCountry 
            };
          }
          
          // datachange Event
          this.emit("row-datachange", {
            "newAddress": evt.value,
            "oldAddress": evt.oldValue,
            "location": location,
            "rowData": rowData,
            "returnData": returnData
          });
          
          if(this.geocodeMatch){
            this.geocodeMatch.geocodeAddress(returnData);
          }
          
          // Apply Edits
          this._applyAddressEdits(this._matchedStore.get(evt.cell.row.id)); 
				})),
        // On Unmatched Grid Row Data Change...
        on(this._gridUnmatchedRef, "dgrid-datachange", lang.hitch(this, function(evt){
          var location = null, returnData, rowData = evt.cell.row.data;
          this._unmatchedStore.get(evt.cell.row.id).updated = true;
          this._unmatchedStore.get(evt.cell.row.id)[evt.cell.column.field] = evt.value;
          if(this._unmatchedStore.get(evt.cell.row.id).location){
            location = this._unmatchedStore.get(evt.cell.row.id).location;
          }
         
          if(this._singleLineInput){
           returnData = {
              "id":  rowData[this._tableLayer.objectIdField],
              "address": rowData[this._keywordMap.Address],
              "location": location,
              "featureType": rowData.featureType,
              "reviewed": rowData.reviewed,
              "updated": true,
              "sourceCountry": this._sourceCountry
            };
          }else{
            returnData = {
              "id": rowData[this._tableLayer.objectIdField],
              "address": this._formatLocatorOptions(rowData),
              "location": location,
              "featureType": rowData.featureType,
              "reviewed": rowData.reviewed,
              "updated": true,
              "sourceCountry": this._sourceCountry 

            };
          }
          
           // datachange Event
          this.emit("row-datachange", {
            "newAddress": evt.value,
            "oldAddress": evt.oldValue,
            "location": location,
            "rowData": rowData,
            "returnData": returnData
          });
          
          if(this.geocodeMatch){
            this.geocodeMatch.geocodeAddress(returnData);
          }
          // Apply Edits
          this._applyAddressEdits(this._unmatchedStore.get(evt.cell.row.id)); 
				}))
      ];
      
      if(this.geocodeMatch){
        this._listenerHandles.push(this._geocodeMatchHandler());
      }

    }, // End postCreate
    
    startup: function (){
      this.inherited(arguments);
      if (!this.domNode) {
        return;
      }
      if (this.map) {
        // once map is loaded
        if (this.map.loaded) {
          this._init();
        } else {
          on(this.map, "load", lang.hitch(this, function () {
            this._init();
          }));
        }
      }
    }, // End startup

    matchFeature: function(matchData){
      // Update FS
      var row, csr = this.currentSelectedRow;
      csr.updated = true;
      csr.reviewed = true;
      csr.oid = csr[this._unmatchedStore.idProperty];
      csr.location = matchData.newLocation; 
      this._applyEdits(csr);
      
      // If Reviewed Exists, Update the Row
      if(this._reviewedStore.query({"featureID" : matchData.featureID, "featureType" : matchData.featureType}).total > 0){
        // Update Reviewed Row Data
        row = this._reviewedStore.query({"featureID" : matchData.featureID, "featureType" : matchData.featureType})[0];
        row.newLocation = matchData.newLocation;
      }else{
        this._reviewedArray.push({
          "id":this._reviewedArray.length, 
          "featureID" : matchData.featureID,
          "address": matchData.address, 
          "oldLocation": matchData.oldLocation, 
          "newLocation": matchData.newLocation,
          "featureType": matchData.featureType
        });
      }
      // Update Store
      this._reviewedStore = new Memory ({data: this._reviewedArray, "idProperty" : "id"});        
      this._gridReviewedRef.set("store", this._reviewedStore);
      // Update Tab Text & Grids
      this._updateTabText();
      this.refreshGrids();
      
      // match Event
      this.emit("match", {
        "id" : this._reviewedArray.length, 
        "featureID" : matchData.featureID,
        "address": matchData.address, 
        "oldLocation": matchData.oldLocation, 
        "newLocation": matchData.newLocation,
        "featureType": matchData.featureType
      });
    }, // End matchFeature
    
    clearGridSelection: function(){
      this._gridUnmatchedRef.clearSelection();
      this._gridMatchedRef.clearSelection();
      this._gridReviewedRef.clearSelection();
    }, 
    refreshGrids: function(){
      this._gridUnmatchedRef.refresh();
      this._gridMatchedRef.refresh();
      this._gridReviewedRef.refresh();
    }, // End refreshGrids
    
    resizeGrids: function(){
      this._gridUnmatchedRef.resize();
      this._gridMatchedRef.resize();
      this._gridReviewedRef.resize();
    }, // End resizeGrids
        
    destroy: function (){
      array.forEach(this._listenerHandles, function(handle){
        handle.remove();
      });
      /*
      this._listenerHandles.forEach(function(handle) {
        handle.remove();
      });
      */
      if(this.map){
        this.map.popup.clearFeatures();
        this.map.popup.hide();
        this.map.removeLayer(this.graphicsLayer);
      }
      this.graphicsLayer = null;
      this.map = null;
      this.inherited(arguments);
    },
    
    _init: function(){
      // Loaded
      this.loaded = true;
      this.emit("load", {});
      this.resize();
      
      // Get FS Data
      arcgisUtils.arcgisUrl = this._arcgisUrl;
      arcgisUtils.getItem(this.itemId).then(lang.hitch(this, function(data){
        var url = data.item.url || data.item.item; // data.item.item is the old way and should not be used anymore
        if(data.item.typeKeywords[6]){
          this._getPublishParams().then(lang.hitch(this, function(){
            this._getDataFromFeatureService(url);       
          }));
        }else{
          //console.log("Rematch is not supported.");
        }
      }),function(err){
          //console.log("error", err);
      });
    }, // End destroy
       
    _applyEdits: function (feature){
     
      var tempGraphic = new Graphic();
      tempGraphic.attributes = feature;
      
      if(feature.featureType === "unmatched" && this._featureLayer && this._tableLayer){
        this._tableLayer.applyEdits(null, null, [tempGraphic]).then(function(addResponse, updateResponse, deleteResponse){
          //console.log(addResponse, updateResponse, deleteResponse);
        });
        tempGraphic.geometry =  feature.location; 
        this._featureLayer.applyEdits([tempGraphic], null, null).then(function(addResponse, updateResponse, deleteResponse){
          //console.log(addResponse, updateResponse, deleteResponse);
        });
      }else if(feature.featureType === "matched" && this._featureLayer){
        tempGraphic.geometry = feature.location;
        this._featureLayer.applyEdits(null, [tempGraphic], null).then(function(addResponse, updateResponse, deleteResponse){
          //console.log(addResponse, updateResponse, deleteResponse);
        });
      }
    }, // End _applyEdits
    resize: function(){

      var fullHeight = domStyle.get(this.domNode, "height");
      var headerHeight = domStyle.get(dom.byId(this.headerID),"height");
      domStyle.set(this.StackContainerNode.domNode, "height", (fullHeight-headerHeight)+"px");
  
      this.StackContainerNode.resize();
      this.resizeGrids();

      this._tab1Node.resize();
      this._tab2Node.resize();
      this._tab3Node.resize();
    },
    _applyAddressEdits: function (rowData){
      // Update Parent Object
      var tempGraphic = new Graphic();
      tempGraphic.attributes = rowData;
      if(rowData.featureType === "unmatched"){
        this._tableLayer.applyEdits(null, [tempGraphic], null).then(function(addResponse, updateResponse, deleteResponse){
          //console.log(addResponse, updateResponse, deleteResponse);
        });
      }else{
        this._featureLayer.applyEdits(null, [tempGraphic], null).then(function(addResponse, updateResponse, deleteResponse){
          //console.log(addResponse, updateResponse, deleteResponse);
        });
      }
    }, // End _applyAddressEdits
    
    _selectGridRowEvent: function(id, rowData){
      var returnData;
      if(this._singleLineInput){
       returnData = {
          "id": id,
          "address": rowData[this._keywordMap.Address],
          "location": rowData.location,
          "featureType": rowData.featureType,
          "reviewed": rowData.reviewed,
          "updated": rowData.updated,
          "sourceCountry": this._sourceCountry 
        };
      }else{
        returnData = {
          "id": id,
          "address": this._formatLocatorOptions(rowData),
          "location": rowData.location,
          "featureType": rowData.featureType,
          "reviewed": rowData.reviewed,
          "updated": rowData.updated,
          "sourceCountry": this._sourceCountry 
        };
      }   
      this.emit("row-select", returnData);
      if(this.geocodeMatch){
        this.geocodeMatch.geocodeAddress(returnData);
      }
    }, // End _selectGridRowEvent
    
    _calcGraphicsExtent: function (graphics) {
      var g = graphics[0].geometry,
        fullExt = g.getExtent(),
        ext, i, il = graphics.length;
      if (fullExt === null) {
        fullExt = new Extent(g.x, g.y, g.x, g.y, g.spatialReference);
      }
      for (i = 1; i < il; i++) {
        g = graphics[i].geometry;
        ext = g.getExtent();
        if (ext === null) {
          ext = new Extent(g.x, g.y, g.x, g.y, g.spatialReference);
        }
        fullExt = fullExt.union(ext);
      }
      return fullExt;
    }, // End _calcGraphicsExtent
    
    _drawReviewedRow: function(row){
      // Remove any current graphics
      this.graphicsLayer.clear();
      var newLocation = row.newLocation,
        newLocationGraphic = new Graphic(newLocation, this.matchGraphic),
        location, 
        locationGraphic, 
        graphicsArray, 
        extent;
        
      if(row.oldLocation){
        location = row.oldLocation;
        locationGraphic = new Graphic(location, this.highlightGraphic);
        graphicsArray = [locationGraphic, newLocationGraphic];
        
        extent = this._calcGraphicsExtent(graphicsArray);
        this.map.setExtent(extent, true).then(lang.hitch(this, function () {
          var i;
          for (i = 0; i < graphicsArray.length; i++) {
              this.graphicsLayer.add(graphicsArray[i]);
          }
        }));
      }else{
        this.map.centerAt(newLocation).then(lang.hitch(this, function () {
          this.graphicsLayer.add(newLocationGraphic);
        }));
      }
    }, // End _drawReviewedRow
    
    _getPublishParams: function(){

      var def = new Deferred(), url = this._arcgisUrl + "/" + this.itemId + "/info/publishParameters.json";      
      // Request the Data
      esriRequest({
        "url" :  url, 
        "content" : { f:"json" },			
        "handleAs" : "json",
        "callbackParamName" : "callback",
        "load" : lang.hitch(this, function(response) {
          var key1, key2, obj;
          this._pubParams = response;
          // IE 8 
          if (!Object.keys){
            obj = response.addressFields;
            Object.keys = function(obj) {
              var keys = [], i;
              for (i in obj) {
                if (obj.hasOwnProperty(i)) {
                  keys.push(i);
                }
              }
              return keys;
            };
          }
          
          // Single Line Case
          if(Object.keys(response.addressFields).length === 1){
            for(key1 in response.addressFields){
              if(response.addressFields.hasOwnProperty(key1)){
                this._keywordMap.Address = response.addressFields[key1];
                this._keywordArray.push(response.addressFields[key1]);
              }
            }
            this._singleLineInput = true;
          }else{
          // Multiple Fields Case
            this._singleLineInput = false;
            for(key2 in response.addressFields){
              if(response.addressFields.hasOwnProperty(key2)){
                this._keywordMap[key2] = response.addressFields[key2];
                this._keywordArray.push(response.addressFields[key2]);
              }
            }
          }
          
          // Check for sourceCountry
          if(response.sourceCountry && !this._keywordMap.CountryCode){
            if(response.sourceCountry.toLowerCase() !== "world" && response.sourceCountry.toLowerCase() !== "wo"){
            this._sourceCountry = response.sourceCountry;
            }
          }
          
          // Check for custom Geocoder
          if(response.geocodeServiceUrl){
            this._locatorURL = response.geocodeServiceUrl;
            if(this.geocodeMatch){
              if(!this.geocodeMatch._customLocator){
                this.geocodeMatch.updateLocatorURL(this._locatorURL);
              }
            }
          }
          // Request complete; resolve the deferred
          def.resolve(true);
        })
      });
      return def.promise;
    },
    
    // Maps dgrid row data to address keywords
    _formatLocatorOptions: function(rowData){
    
      var locatorArray =  [], locatorParams = {}, key;
      for(key in this._keywordMap){
        if(this._keywordMap.hasOwnProperty(key)){
          locatorParams[key] = rowData[this._keywordMap[key]];
          locatorArray[key] = rowData[this._keywordMap[key]];
        }
      }
      return locatorArray;
    },
    
    _getDataFromFeatureService: function(url){
      var layerRef = url + "/0", 
        tableRef = url + "/1";
      esriRequest({
        "url" : url, 
        "content" : { f:"json" },			
        "handleAs" : "json",
        "callbackParamName" : "callback",
        "load" : lang.hitch(this, function(response) {
          this._fsData = response;
          //console.log('response', response);
          // Layer 0
          //console.log("response.layers", response.layers);
          if(response.layers.length !== 0){
            this._featureLayer = new FeatureLayer(layerRef, {
              mode: FeatureLayer.MODE_SELECTION,
              outFields: ["*"]
            });
            this._featureLayer.userIsAdmin = true;
            //console.log("this._featureLayer", this._featureLayer);
            this._listenerHandles.push(this._layerLoad());
          }else{
            this._featureLayer = false;
          }
          
          // Table 1
          //console.log("response.tables", response.tables);
          if(response.tables.length !== 0){
            this._tableLayer = new FeatureLayer(tableRef, {
              mode: FeatureLayer.MODE_SELECTION,
              outFields: ["*"]
            });
            this._tableLayer.userIsAdmin = true;
            //console.log("this._tableLayer", this._tableLayer);
            this._listenerHandles.push(this._tableLoad());
          }else{
            // No Table Layer
            this._tableLayer = false;
            //Hide Unmatched Tab
            this.StackContainerNode.removeChild(this.StackContainerNode.getChildren()[0]);
          }
          
        })
      });
      this.resize();
    }, // End _getDataFromFeatureService
    _geocodeMatchHandler: function(){

      var event = this.geocodeMatch.on("match", lang.hitch(this, function(data){
          this.matchFeature(data);
        }));
      return event;
    },
    
    _layerLoad: function(){
      var listener = on(this._featureLayer, "load", lang.hitch(this, function(){
        this._queryFeatureLayer();
        //this._queryShort();
      }));
      return listener;
    }, // End _layerLoad
    
    _tableLoad: function(){
      var listener = on(this._tableLayer, "load", lang.hitch(this, function(){
        this._queryTableLayer();
      }));
      return listener;
    }, // End _tableLoad
    
    _queryFeatureLayer: function(){
      
      var i, point, feature, featureArray = [], query = new Query();
      query.where = "1 = 1";
      
      this._featureLayer.queryFeatures(query).then(lang.hitch(this, function(featureSet) {
        //console.log("query succeeded..", featureSet);
        //var fa = this._convertToCSV(featureSet);
        
        for(i=0; i<featureSet.features.length; i++){
          // Update Feature Attributes
          featureSet.features[i].attributes.updated = false;
          featureSet.features[i].attributes.reviewed = false;
          featureSet.features[i].attributes.featureType = "matched";
          feature = featureSet.features[i].attributes;
          // Generate a point from geometry
          point = new Point(featureSet.features[i].geometry.getLongitude(), featureSet.features[i].geometry.getLatitude());
          feature.location = point;
          // Store updated feature
          featureArray.push(feature);
        }
        
        // Columns & Store
        this._test_idKeyword = this._featureLayer.objectIdField;
        this._gridMatchedRef.set("columns", this._updateColumns(featureSet));
        this._matchedStore = new Memory ({data: featureArray, "idProperty" : this._featureLayer.objectIdField});
        this._gridMatchedRef.set("store", this._matchedStore);
        this._updateTabText();
      }));
    }, // End _queryFeatureLayer
    
    _queryTableLayer: function(){
    
      var i, feature, featureArray = [], query = new Query();
      query.where = "1 = 1";
      
      this._tableLayer.queryFeatures(query).then(lang.hitch(this, function(featureSet) {
        //console.log("query succeeded..", featureSet);
        if(featureSet.features.length !== 0){
          // Update Feature Attributes
          for(i=0; i<featureSet.features.length; i++){
            featureSet.features[i].attributes.updated = false;
            featureSet.features[i].attributes.reviewed = false;
            featureSet.features[i].attributes.featureType = "unmatched";
            feature = featureSet.features[i].attributes;
            // Store updated feature
            featureArray.push(feature);
          }
          //Columns & Store
          this._gridUnmatchedRef.set("columns", this._updateColumns(featureSet));
          this._unmatchedStore = new Memory ({data: featureArray, "idProperty" : this._tableLayer.objectIdField});
          this._gridUnmatchedRef.set("store", this._unmatchedStore);
          this._updateTabText();
        }else{
          //console.log('Table exists, but is empty; delete table');
          this._tableLayer = false;
          delete this._fsData.tables[0];
          //Hide Unmatched Tab
          this.StackContainerNode.removeChild(this.StackContainerNode.getChildren()[0]);
        }     
      }));
    }, // End _queryTableLayer
    
    _updateTabText: function(){
      if(this._unmatchedStore.query({reviewed:false}).total === this._unmatchedStore.data.length){
        this._tab1Node.set("title", string.substitute(i18n.widgets.geocodeReview.unmatchedTotal, { count: this._unmatchedStore.data.length}));
      }else{
       this._tab1Node.set("title", string.substitute(i18n.widgets.geocodeReview.unmatchedRemaining, { count1: this._unmatchedStore.query({reviewed:false}).total, count2: this._unmatchedStore.data.length}));
      }
      this._tab2Node.set("title", string.substitute(i18n.widgets.geocodeReview.matchedTotal, { count: this._matchedStore.data.length}));
      this._tab3Node.set("title", string.substitute(i18n.widgets.geocodeReview.reviewedTotal, { count: this._reviewedStore.data.length}));
    }, // End _updateTabText
    
    _generateGrids: function(){
      this._generateUnmatchedGrid();
      this._generateMatchedGrid();
      this._generateReviewedGrid();
    }, // End _generateGrids
    
    _generateUnmatchedGrid: function(){
      this._gridUnmatchedRef = new this.StandardGrid({
        store: this._unmatchedStore,
        columns: this._unmatchedColumns,
        noDataMessage: i18n.widgets.geocodeReview.review.noDataMsg1,
        selectionMode: "extended",
        allowSelectAll: false,
        cellNavigation: false
      }, this._grid1Node);
      this._gridUnmatchedRef.startup();
      this._gridUnmatchedRef.resize();
    }, // End _generateUnmatchedGrid
    
    _generateMatchedGrid: function(){
      this._gridMatchedRef = new this.StandardGrid({
        store: this._matchedStore,
        columns: this._matchedColumns,
        noDataMessage:  i18n.widgets.geocodeReview.review.noDataMsg2,
        selectionMode: "extended",
        allowSelectAll: false,
        cellNavigation: false
      }, this._grid2Node);
      this._gridMatchedRef.startup();
      this._gridMatchedRef.resize();
    }, // End _generateMatchedGrid
    
    _generateReviewedGrid: function(){
      this._gridReviewedRef = new this.StandardGrid({
        store: this._reviewedStore,
        columns: this._reviewedColumns,
        noDataMessage:  i18n.widgets.geocodeReview.review.noDataMsg3,
        selectionMode: "extended",
        allowSelectAll: false,
        cellNavigation: false
      }, this._grid3Node);
      this._gridReviewedRef.startup();
      this._gridReviewedRef.resize();
    }, // End _generateReviewedGrid
    
    _defineColumns: function(){
      this._unmatchedColumns = [];
      this._matchedColumns = [];
      this._reviewedColumns = [{
          "label" :  i18n.widgets.geocodeReview.idProperty,
          "field" : "id",
          "hidden" : true
        }, {
          "label" : i18n.widgets.geocodeReview.review.columnSelectedAddress,
          "field" : "address",
          "formatter" : lang.hitch(this, function (value) {
            return "<img src='" + this.basePath.toString() + "images/EsriGreenPinCircle26.png' />" + value;
          }),
          "get": lang.hitch(this, function(obj){
            var returnAddress = "", addressString ="", key;
            if(typeof obj.address === "object"){
              for(key in obj.address){
                if(obj.address.hasOwnProperty(key)){
                  if(obj.address[key] !== null && key !== "Loc_name"){
                    addressString += obj.address[key] + " ";
                  }
                }
              }
              returnAddress = addressString;
            }else{
              returnAddress = obj.address;
            }
            return returnAddress;
          })
        },
        {
          "label" : i18n.widgets.geocodeReview.review.columnOriginalLocation,
          "field" : "oldLocation",
          "formatter" : function (value) {
            return value;
          },
          "get" : lang.hitch(this, function (object) {
            var geographicGeometry;
            if(object.oldLocation){
              geographicGeometry = webMercatorUtils.webMercatorToGeographic(object.oldLocation);
            }
            return object.oldLocation ? "X: " + geographicGeometry.x + "<br />Y: " + geographicGeometry.y : "None";
          })
        },{
          "label" : i18n.widgets.geocodeReview.review.columnSelectedLocation,
          "field" : "newLocation",
          "formatter" : function (value) {
            return value;
          },
          "get" : lang.hitch(this, function (object) {
              var geographicGeometry = webMercatorUtils.webMercatorToGeographic(object.newLocation);
              return "X: " + geographicGeometry.x + "<br />Y: " + geographicGeometry.y;
          })
        },{
          "label" : "Type",
          "field" : "featureType",
          "hidden" : true
        }
      ];
    }, // End _defineColumns
    
     _updateColumns: function(featureSet){

        var i, 
          columnObj, 
          columnsTemplate = [];
          
        if(featureSet && featureSet.fields){
          // Generate Dynamic Columns based on Feature Layer data
          for(i=0; i<featureSet.fields.length; i++){
            
            if(featureSet.fields[i].name === this._keywordMap.Address || featureSet.fields[i].name === this._keywordMap[featureSet.fields[i].name]){
              columnObj = new Editor({
                label: featureSet.fields[i].alias || featureSet.fields[i].name, 
                field: featureSet.fields[i].name, 
                editor: "text", 
                editOn:"dblclick", 
                autoSave:true
              });
            }else if(array.indexOf(this._keywordArray, featureSet.fields[i].name) !== -1){
              columnObj = new Editor({
                label: featureSet.fields[i].alias || featureSet.fields[i].name, 
                field: featureSet.fields[i].name, 
                editor: "text", 
                editOn:"dblclick", 
                autoSave:true
              });
            }else{
              columnObj = {
                label: featureSet.fields[i].alias || featureSet.fields[i].name, 
                field: featureSet.fields[i].name, 
                hidden:true
              };
            }
            
            if(featureSet.fields[i].name === this._featureLayer.objectIdField){
              columnsTemplate.splice(0,0, {label: featureSet.fields[i].name, field: featureSet.fields[i].alias, hidden:true});
            }else{
              columnsTemplate.push(columnObj);
            }
          }
          
          columnsTemplate.push({
            "label" : i18n.widgets.geocodeReview.reviewedUC,
            "field": "reviewed",
            "formatter" : function (value) {
              return value;
            },
            "get" : lang.hitch(this, function (obj) {
              return obj.reviewed ? "<img src='" + this.basePath.toString() + "images/save.png' />" : "";
            })
          });
        }
        return columnsTemplate;
    }, // End _updateColumns
    
    _defineGridStores: function(){
    
      this._unmatchedStore = new Memory({
        data: "",
        idProperty: this._idProperty
      });

      this._matchedStore = new Memory({
        data: "",
        idProperty: this._idProperty
      });
      
      this._reviewedArray = [];
      this._reviewedStore = new Memory({
        data: this._reviewedArray,
        idProperty: this._idProperty
      });
    }// End _defineGridStores
    
  });
  
  return Widget;
});
