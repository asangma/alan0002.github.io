define([
  "require",
  "../core/declare",
  "dojo/_base/lang",
  "dojo/_base/Deferred",
  "dojo/_base/array",

  "dojo/dom-construct",
  "dojo/dom-style",
  "dojo/Evented",
  "dojo/on",
  "dojo/uacss",

  "dijit/_WidgetBase",
  "dijit/Menu",
  "dijit/MenuItem",

  "dgrid/OnDemandGrid",
  "dgrid/Selection",
  "dgrid/Keyboard",
  "dgrid/extensions/DijitRegistry",
  "dgrid/extensions/ColumnResizer",
  "dgrid/extensions/ColumnHider",
  "dojo/store/Memory",

  "../kernel",
  "../Graphic",
  "./../PopupTemplate",
  "../geometry/SpatialReference",

  "../geometry/support/webMercatorUtils",
  "../geometry/Extent",
  "../geometry/Point",
  "../layers/GraphicsLayer",
  "../symbols/PictureMarkerSymbol",
  "../tasks/Locator",
  "../tasks/support/AddressCandidate",

  "dijit/layout/BorderContainer", 
  "dijit/layout/ContentPane",

  "dojo/i18n!../nls/jsapi",
  "./GeocodeMatch/Popup"
  
], function (
  require, declare, lang, Deferred, array,
  domConstruct, domStyle, Evented, on, has,
  _WidgetBase, Menu, MenuItem, 
  OnDemandGrid, Selection, Keyboard, DijitRegistry, ColumnResizer, ColumnHider, Memory,
  esriKernel, Graphic, PopupTemplate,SpatialReference,
  webMercatorUtils, Extent, Point, GraphicsLayer, PictureMarkerSymbol, Locator, AddressCandidate,
  BorderContainer, ContentPane,
  i18n, Popup
) {
  var Widget = declare([_WidgetBase, Evented], {

    basePath: require.toUrl("./GeocodeMatch/"),
    loaded: false,
    singleLineInput: true,
    _mapClickPause:false,
    _defaultLocatorURL: "http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer",
    _customLocator:false,
    _hasCustomPoint: false,
    _hasDefaultPoint: false,
    
    constructor: function (params, srcNodeRef) {
      declare.safeMixin(this, params);
      
      // Widget Requires Map Param
      if (!this.map) {
        return;
      }
      
      // Use geocoder Param
      if(this.geocoder){
        this._locator = new Locator(this.geocoder);
        this._customLocator = true;
      }else{
        this._locator = new Locator(this._defaultLocatorURL);
        this._customLocator = false;
      }

      // Grid Column Object Declaration
      this._columns = [
      {
        "label" : "",
        "field": "matched",
        "resizable" : false,
        "formatter" : function (value) {
          return value;
        },
        "get" : lang.hitch(this, function (obj) {
            // Return Pin for Matched row
            return obj.matched ? "<img src='"+this.basePath.toString() + "images/EsriGreenPinCircle26.png' />" : "";
        })
      },
      {
        "label" : i18n.widgets.geocodeMatch.match.columnLabelAddress,
        "field" : "address",
        "formatter" : function (value) {
          return value;
        },
        "get" : lang.hitch(this, function (obj) {
          var returnAddress = "";
          
          // String or Object
          if(typeof obj.address === "object"){
            if(obj.Match_Addr){
              returnAddress = obj.Match_Addr;
            }else{
              returnAddress = "";
            }
          }else{
            returnAddress = obj.address;
          }
          // Matched
          if (obj.Addr_type === "DefaultMatch" || obj.Addr_type === "Custom"){
            if(obj.matched){
              return i18n.widgets.geocodeMatch.popup.matchButtonLabel;
            }
            return returnAddress + " ("+i18n.widgets.geocodeMatch.popup.matchButtonLabel+")";
          }
          return returnAddress;
        })
      }, {
        "label" : i18n.widgets.geocodeMatch.match.columnLabelType,
        "field" : "Addr_type",
        "formatter" : function (value) {
          return value;
        },
        "get" : lang.hitch(this, function (obj) {
            var regex, str = obj.Addr_type;
            // Matched
            if (obj.Addr_type === "DefaultMatch" || obj.Addr_type === "Custom"){
              return ""; 
            }
            // Add spaces to Addr_type values based on Camelcase
            regex = /([A-Z])([A-Z])([a-z])|([a-z])([A-Z])/g;
            str = str.replace( regex, '$1$4 $2$3$5' );
            return  str;
        })
      }, {
        "label" : i18n.widgets.geocodeMatch.match.columnLabelScore,
        "field" : "score",
        "hidden": true,
         "formatter" : function (value) {
          return value;
        },
        "get" : lang.hitch(this, function (obj) {
            if (obj.score > 0 && obj.score <= 100){
              return obj.score;
            }
            return " ";
        })
      }];
      
      // Graphic Symbols
      // TODO: moved to class properties as soon as gfx/_base bug is fixed
      
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
    },
    
    postCreate: function () {  
      this.inherited(arguments);
      var map = this.map, 
        graphicsLayer,
        popupTemplate,
        point, 
        graphic, 
        grid,
        StandardGrid;
        
      // Create Graphics Layer & InfoTemplate widget
      graphicsLayer = this.graphicsLayer = new GraphicsLayer();
      popupTemplate = this._infoTemplate = new PopupTemplate(); // TODO - is _infoTemplate used?
      popupTemplate.setTitle(null);
      popupTemplate.setContent(lang.hitch(this, this._getInfoTemplateContent));
      graphicsLayer.popupTemplate = popupTemplate;
      map.addLayer(graphicsLayer);
      
      // Create the Container & Grid Menu
      this._createContainerNodes();
      this._createGridMenu();
      
      // Create the Grid
      StandardGrid = declare([OnDemandGrid, DijitRegistry, Selection, Keyboard, ColumnResizer, ColumnHider]);
      this.store = new Memory({
        "data": "",
        "idProperty" : i18n.widgets.geocodeMatch.idProperty
      });
      
      grid = this.grid = new StandardGrid({
        "store" : this.store,
        "sort" : "sort",
        "noDataMessage" : i18n.widgets.geocodeMatch.match.noDataMsg,
        "selectionMode" : "extended",
        "allowSelectAll" : true,
        "cellNavigation" : false,
        //"subRows": this._subRows
        "columns" : this._columns
      }, this._gridRef);
      this.resize();
      
       // Rig Events
      this._listenerHandles = [
        // Window Resize
        on(window, "resize", lang.hitch(this, function () {
          this.resize();
        })),

        // Grid Deselect
        on(grid, "dgrid-deselect", lang.hitch(this, function () {
          this.currentSelectedRowId = null;
          this.currentSelectedRow = null;
        })),
        // Grid Select Event
        on(grid, "dgrid-select", lang.hitch(this, function (event) {
        
        
          //graphicsLayer.graphics.forEach(lang.hitch(this, function (g) {
          array.forEach(graphicsLayer.graphics, lang.hitch(this, function (g){
            if (g.attributes) {
              if (g.attributes.type === i18n.widgets.geocodeMatch.customLabel && g.attributes.matched === false) {
                graphicsLayer.remove(g);
                map.popup.hide();
              }
            }
          }));
          point = event.rows[0].data.location;
          this.currentSelectedRowId = event.rows[0].data.id;
          this.currentSelectedRow = event.rows[0].data;
          // Focus on the Graphic
          map.centerAt(point).then(lang.hitch(this, function () {
            map.popup.setFeatures([graphicsLayer.graphics[this.currentSelectedRowId]]);
            map.popup.show(point);
          }));
        })),
        // Map Event
        on(map, "click", lang.hitch(this, function (evt) {
          if(!this._mapClickPause){
            //graphicsLayer.graphics.forEach(lang.hitch(this, function (g) {
            array.forEach(graphicsLayer.graphics, lang.hitch(this, function (g){
              if (g.attributes) {
                if (g.attributes.type === i18n.widgets.geocodeMatch.customLabel && g.attributes.matched === false) {
                  graphicsLayer.remove(g);
                  if(map.popup){ map.popup.hide(); }
                }
              }
            }));
            // if graphic clicked, check for type (parent or child)
            if (evt.graphic) {
              // Graphics have attributes, do selection
              if (evt.graphic.attributes) {
                // Check if Graphic has an ID
                if (evt.graphic.attributes.id) {
                  grid.clearSelection();
                  grid.select(evt.graphic.attributes.id);
                }
              }
            }else{
              // Check for Row Selection
              if(this.lastAddress){
                // Clear the Grid
                grid.clearSelection();
                // Create the Custom Point
                point = new Point(evt.mapPoint.x, evt.mapPoint.y, map.spatialReference);
                graphic = new Graphic(point, this.highlightGraphic);
                // Required Attributes
                graphic.setAttributes({
                  "type":  i18n.widgets.geocodeMatch.customLabel,
                  "matched": false,
                  "featureType" : this.featureType
                });
                // Add Custom Point to Map; show Popup
                graphicsLayer.add(graphic);
                map.popup.setFeatures([graphic]);
                map.popup.show(point);
              }
              // Do Nothing
            }
          }
        }))
      ]; 
      // Resize the Widget & Containers
      this.resize();
    },
    
    /* ---------------- */
    /* Public Functions */
    /* ---------------- */
    startup: function () {
      this.inherited(arguments);
      this.grid.startup();
      this.resize();
      if (this.map.loaded) {
        this.loaded = true;
        this.emit("load", {});
      } else {
        on(this.map, "load", lang.hitch(this, function () {
          this.loaded = true;
          this.emit("load", {});
        }));
      }
    },
    
    updateLocatorURL: function (url){
        this._locator = new Locator(url);
    },
    
    geocodeAddress: function (data) {
        //console.log("data", data);
        // App State
        this._resetMapState();
        this._resetAppState();
        
        // Local Variables
        var addressRef, 
          locatorOptions,
          defaultMatch,
          grid = this.grid, 
          def = new Deferred();
          
        switch(typeof data){
          case "string":
            addressRef = data;
            locatorOptions = { "address" : { "SingleLine": addressRef }, outFields: ["*"] };
            this.singleLineInput = true;
            break;
          case "object":
        
            // Set the id
            if( data.id ) { this.featureID = data.id; }
            // Set the featureType (unmatched, matched)
            if( data.featureType ) { this.featureType = data.featureType; }
            
            // Required
            if( data.address ){
              
              // Assumptions:
              // data is an object
              // data.address exists
              // data.address contains the relevant address information
              switch(typeof data.address){
              
                case "string":
                  addressRef = data.address;
                  locatorOptions = { "address" : { "SingleLine": addressRef }, outFields: ["*"]};
                  this.singleLineInput = true;
                  break;
                  
                case "object":
                  //IE8
                  if (!Object.keys){
                    var obj = data.address;
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

                  if(data.address.CountryCode && data.address.Address && Object.keys(data.address).length === 2){
                  
                    addressRef = data.address.Address;
                    locatorOptions = { "address" : { "SingleLine": data.address.Address, "CountryCode": data.address.CountryCode}, outFields: ["*"]};
                    this.singleLineInput = true;
                    
                  }else if(data.address.CountryCode && Object.keys(data.address).length === 2){
                    
                    addressRef = data.address;
                    locatorOptions = { "address" : { "SingleLine": data.address, "CountryCode": data.address.CountryCode}, outFields: ["*"]};
                    this.singleLineInput = true;
                    
                  }else{
                  
                    addressRef = data.address;
                    locatorOptions = { "address" : addressRef, outFields: ["*"]};
                    this.singleLineInput = false;
                    
                  }
                  break;
                  
                default:
                  //console.log("Invalid type for data.address");
                  break;
              }
            }
            break;
          default:
            //console.log("Invalid type for data");
            break;
        }

        // Persist sourceCountry
        if(data.sourceCountry){
          locatorOptions.address.CountryCode = data.sourceCountry;
        }

        // App State
        grid.noDataMessage = i18n.widgets.geocodeMatch.popup.loadingPH;
        grid.refresh();

        this._locator.outSpatialReference = this.map.spatialReference;
        //this._locator.outSpatialReference = new SpatialReference({"wkid":4326});
        
        this._locator.addressToLocations(locatorOptions).then(lang.hitch(this, function (geocodeResults) {
          //console.log("geocodeResults", geocodeResults);
          var i, matchid;
          for (i = 0; i < geocodeResults.length; i++) {
            geocodeResults[i].id = i;
            geocodeResults[i].featureID = this.featureID;
            geocodeResults[i].matched = false;
            geocodeResults[i].sort = i+2;
            geocodeResults[i].Addr_type = geocodeResults[i].attributes.Addr_type;
            geocodeResults[i].Match_addr = geocodeResults[i].attributes.Match_addr;
            geocodeResults[i].featureType = data.featureType;
          }
          
          // Feature is matched
          if(data.location){
          
            // Feature has not been Rematched/Reviewed
            if(data.reviewed === false){
            
              // Get the id
              matchid = geocodeResults.length;
              // Set the id
              this.currentMatch = matchid;
              // App State
              this._hasDefaultPoint = true;
              this.defaultGeometry = data.location;
              
               // Geometry Check
              if(this.defaultGeometry.spatialReference.wkid !== this.map.spatialReference.wkid){
                this.defaultGeometry = webMercatorUtils.geographicToWebMercator(this.defaultGeometry);
              }
              
              // Create the match
               defaultMatch = new AddressCandidate({
                "id" : matchid,
                "address" : addressRef,
                "Addr_type" : i18n.widgets.geocodeMatch.match.defaultMatchType,
                "location": this.defaultGeometry,
                "featureID" : this.featureID,
                "featureType" : data.featureType,
                "matched" : true,
                "score" : -1,
                "sort" : 0
              });
              // Update geocodeResults
              geocodeResults.push(defaultMatch);
            }
            
            // Feature has been Rematched/Reviewed
            if(data.reviewed === true){
            
              // Get the id
              matchid = geocodeResults.length;
              // Set the id
              this.currentMatch = matchid;
              // App State
              this._hasCustomPoint = true;
              this.defaultGeometry = data.location;
              // Geometry Check
              if(this.defaultGeometry.spatialReference.wkid !== this.map.spatialReference.wkid){
                this.defaultGeometry = webMercatorUtils.geographicToWebMercator(this.defaultGeometry);
              }
              
              // Create the match
              defaultMatch = new AddressCandidate({
                "id" : matchid,
                "address" : addressRef,
                "Addr_type" : i18n.widgets.geocodeMatch.customLabel,
                "location": this.defaultGeometry,
                "featureID" : this.featureID,
                "featureType" : data.featureType,
                "matched" : true,
                "score" : -1,
                "sort" : 0
              });
              // Update geocodeResults
              geocodeResults.push(defaultMatch);
            }

          }else{
            // Unmatched Feature Default
            this.defaultGeometry = null;
          }
          
          // Store Management
          this.store = new Memory({ "data": geocodeResults });
          grid.set("store", this.store);
          
          // App State
          this._updateMapGraphics();
          this.lastGeocodeResults = geocodeResults;
          this.lastAddress = addressRef;
          def.resolve(geocodeResults);
          grid.noDataMessage = "No Results.";
          grid.refresh();
          
        }), function(err){
          //console.log("Error: ", err);
      });
        return def.promise;
    },
    
    // For Measurement Widget
    pauseMapEvents: function(){ 
      this._mapClickPause = true;
    },
    // For Measurement Widget
    resumeMapEvents: function(){
      this._mapClickPause = false;
    },

    refresh: function(){
      this.grid.refresh();
      this.matchWidgetBorderContainer.refresh();
      this.matchWidgetContentPane1.refresh();
      this.matchWidgetContentPane2.refresh();
    },
        
    resize: function(){
      this.matchWidgetBorderContainer.resize();
      this.matchWidgetContentPane1.resize();
      this.matchWidgetContentPane2.resize();
      if(this.grid){   this.grid.resize(); }
    },
   
    destroy: function () {
    
      // Events
      /*
      this._listenerHandles.forEach(function(handle) {
        handle.remove();
      });
      */
      array.forEach(this._listenerHandles, function(handle){
        handle.remove();
      });
      
      // Widget
      if(this.Popup){
        this.Popup.destroy();
        this.Popup = null;
      }
      
      // Grid
      if(this.grid){
        this.grid.destroy();
      }
      this.grid = null;
      this._columns = null;     
      this.store = null;   
      
      // Grid Menu
      if(this._gridMenuRef){
        domConstruct.empty(this._gridMenuRef);
      }
      this.gridMenu = null;
      
      // Map & Locator
      if(this.map){
        this.map.popup.clearFeatures();
        this.map.popup.hide();
        this.map.removeLayer(this.graphicsLayer);
      }
      this._locator = null;
      this._infoTemplate = null;
      this.graphicsLayer = null;
      this.map = null;
      this.inherited(arguments);
    },
    // Reset Widget Back to Default State
    reset: function(){
      this._resetAppState();
      this._resetMapState();
    },
    
    /* ---------------- */
    /* Private Functions */
    /* ---------------- */
    
    // Handles Feature matching for Points from Map Click
    _matchCustomFeature: function (graphic) {
      var matchObj, matchid;
      
      // Remove Current Custom Match  
      if (this._hasCustomPoint === true) {
      
        //this.store.data.forEach(lang.hitch(this, function (matchCandidate) {
        array.forEach(this.store.data, lang.hitch(this, function (matchCandidate){
          if (matchCandidate.Addr_type === i18n.widgets.geocodeMatch.customLabel) {
            // Delete Feature
            this.store.data.splice(array.indexOf(this.store.data, matchCandidate), 1);
          }
        }));
        
        array.forEach(this.graphicsLayer.graphics, lang.hitch(this, function (g){
          if (g.attributes) {
            if (g.attributes.type === i18n.widgets.geocodeMatch.customLabel) {
              g.attributes.matched = false;
            }
          }
        }));
        this.graphicsLayer.remove(this.graphicsLayer.graphics[this.currentMatch]);
        this.currentMatch = null;
      }
      
      // Create the Match
      matchid = this.store.data.length;
      matchObj = new AddressCandidate({
        "id" : matchid,
        "Addr_type" : i18n.widgets.geocodeMatch.customLabel,
        "address": this.lastAddress,
        "matched" : false,
        "location" : graphic.geometry,
        "score" : -1,
        "sort": 1,
        "graphicSymbol": graphic.symbol
      });

      //Update the Graphic
      graphic.attributes.id = matchid;
      graphic.attributes.matched = true;
      
      // Save the Match (AppState)
      this.store.data.push(matchObj);
      this._hasCustomPoint = true;
      
      //Match the Feature
      this._matchFeature(matchid);
    },

    _matchFeature: function (matchid) {
      var storeData = this.store.data,
        graphicsRef = this.graphicsLayer.graphics,
        curMatch = this.currentMatch;
       
      // No Previous Match
      if (curMatch === null) {
        // Update Match Data
        storeData[matchid].matched = true;
        
        if (this.map !== false) {
          // Update the Graphics
          graphicsRef[matchid].attributes.matched = true;
          graphicsRef[matchid].attributes.id = matchid;
          graphicsRef[matchid].setSymbol(this.matchGraphic);
          graphicsRef[matchid].getDojoShape().moveToFront();
        }
        
      // Match Already Exists
      } else {
      
        // Update Match in Store
        storeData[matchid].matched = true;
        storeData[curMatch].matched = false;
        
        // Update Previous Match Graphic
        graphicsRef[curMatch].attributes.matched = false;
        graphicsRef[curMatch].setSymbol(this.suggestionGraphic);
        
        // Update New Match Graphic
        graphicsRef[matchid].attributes.matched = true;
        graphicsRef[matchid].attributes.id = matchid;
        graphicsRef[matchid].setSymbol(this.matchGraphic);
        graphicsRef[matchid].getDojoShape().moveToFront();
        
        // Remove Old Custom Point
        if (graphicsRef[curMatch].attributes.type === i18n.widgets.geocodeMatch.customLabel && graphicsRef[matchid].attributes.type !== i18n.widgets.geocodeMatch.customLabel) {
          //this.map.graphics.remove(graphicsRef[curMatch]);
          this.graphicsLayer.remove(graphicsRef[curMatch]);
          storeData.splice(array.indexOf(storeData, storeData[curMatch]), 1);
          this._hasCustomPoint = false;
        }
      }
      
      // Update Properties; Emit Event; Refresh Grid
      this.currentMatch = matchid;
      this.emit("match", {
        "id" : matchid,
        "featureID": this.featureID,
        "address" : this.lastAddress,
        "oldLocation" : this.defaultGeometry,
        "featureType" : this.featureType,
        "newLocation" : storeData[matchid].location,
        "graphicSymbol":this.matchGraphic
      });
      this.grid.refresh();
    },
        
    _updateMapGraphics: function () {
      var data = this.store.data,
        symbol = this.suggestionGraphic,
        graphic, extent, i, graphicsArray = [];
      // Clear all current graphics
      this.graphicsLayer.clear();
      if (data.length === 1) {
        // One Graphic for Single Match Candidate
        if (data[0].matched === true) {
          graphic = new Graphic(data[0].location, this.matchGraphic);
        } else {
          graphic = new Graphic(data[0].location, symbol);
        }
        graphic.setAttributes({
          "id": 0,
          "matched": data[0].matched,
          "type": data[0].Addr_type
        });
        graphicsArray.push(graphic);
      } else if (data.length > 1) {
        // Create Graphics for all Match Candidates
        //data.forEach(lang.hitch(this, function (d) {
        array.forEach(data, lang.hitch(this, function (d) {
          if(d.matched === true){
            graphic = new Graphic(d.location, this.matchGraphic);
          }else{
            graphic = new Graphic(d.location, symbol);
          }
          graphic.setAttributes({
            "id": d.id,
            "matched": d.matched,
            "type": d.Addr_type
          });
          graphicsArray.push(graphic);
        }));
      }
      // Get Extent of Graphics in Array
      if (data.length !== 0) {
        extent = this._calcGraphicsExtent(graphicsArray);
        this.map.setExtent(extent, true).then(lang.hitch(this, function () {
          for (i = 0; i < graphicsArray.length; i++) {
              this.graphicsLayer.add(graphicsArray[i]);
          }
        }));
      }
      
      // get matched graphic, if set, and move to front
      //this.graphicsLayer.graphics.forEach(lang.hitch(this, function (g) {
      array.forEach(this.graphicsLayer.graphics, lang.hitch(this, function (g) {
        if (g.attributes) {
          if (g.attributes.matched === true) {
            g.getDojoShape().moveToFront();
          }
        }
      }));
    },
    
    _getInfoTemplateContent: function (graphic) {
      // Create instance of Popup widget
      this.Popup = new Popup({
        "geocodeMatch" : this,
        "geocodeAddress" : this.lastAddress,
        "rowData" : this.store.data[graphic.attributes.id],
        "map" : this.map,
        "graphicsLayer" : this.graphicsLayer,
        "graphic": graphic
      }, domConstruct.create("div"));  
      return this.Popup.domNode;
    },
    
    _createContainerNodes: function () {
    
    var bc, cp1, cp2;
    
      domStyle.set(this.domNode, "position", "relative"); 
      domStyle.set(this.domNode, "height", "100%"); 
      domStyle.set(this.domNode, "width", "100%"); 
      
       bc = this.matchWidgetBorderContainer = new BorderContainer({
          "class": "esriMatchContainer",
          "style": "height: 100%; width: 100%;",
          "gutters":false
      });
      
      cp1 = this.matchWidgetContentPane1 = new ContentPane({
          "region": "top",
          "style": "width: 100%; height: 30px;",
          "class": "esriMatchHeader"
      });
      
      cp2 = this.matchWidgetContentPane2 = new ContentPane({
          "region": "center",
          "style": "width: 100%; height: 100%;"
      });
      
      // Left Menu Title Span
      this._gridMenuLeftSpanRef = domConstruct.create("span", {
        "class": "esriMatchTitle",
        "innerHTML": i18n.widgets.geocodeMatch.gridTitle
      }, cp1.domNode);      
      // Right Menu Container
      this._gridMenuRightRef = domConstruct.create("div", {
        "class": "esriMatchOptions"
      }, cp1.domNode);
      // Table Options Dropdown
      this._gridMenuRightSpanRef = domConstruct.create("span", {
        "innerHTML" : i18n.widgets.geocodeMatch.match.tableOptionsLabel
      }, this._gridMenuRightRef);
       this._gridMenuRightArrowRef = domConstruct.create("div", {
        "class": "esriSpriteArrow"
       }, this._gridMenuRightRef);
      //Grid
      
      this._gridRef = domConstruct.create("div", {}, cp2.domNode);
      bc.addChild(cp1);
      bc.addChild(cp2);
      bc.placeAt(this.domNode);
      bc.startup();
      this.resize();
    },
    
    _createGridMenu: function(){
      // Menu
      this.gridMenu = new Menu({
        "targetNodeIds" : [this._gridMenuRightRef],
        "leftClickToOpen" :"true"
      });
      // Map All Candidates
      this.gridMenu.addChild(new MenuItem({
        label: i18n.widgets.geocodeMatch.match.mapAllCandidatesLabel,
        //iconClass: "dijitEditorIcon dijitEditorIconFullScreen",
        onClick: lang.hitch(this, function () {
          this._resetMapState();
          this._updateMapGraphics();
        })
      }));
      // Default Sort Order
      this.gridMenu.addChild(new MenuItem({
        label: i18n.widgets.geocodeMatch.match.defaultSortOrderLabel,
        //iconClass: "dijitEditorIcon dijitEditorIconFullScreen",
        onClick: lang.hitch(this, function () {
          this.grid.set("sort", "sort");
        })
      }));
      // Start the Menu
      this.gridMenu.startup();
    },

    _formatGeocodeResults: function (data){
      var formatted, addressString = "", key;
      if(typeof data === "object"){
        for(key in data){
          if(data.hasOwnProperty(key)){
            addressString += data[key] + " ";
          }
        }
        formatted = addressString;
      }else if(data.address && typeof data.address === "string"){
        formatted = data.address;
      }else{
        formatted = data;
      }
      return formatted;
    },
    
    _resetMapState: function () {
    
      // Clear Map
      if(this.Popup){
        this.Popup.map.popup.hide();
        this.Popup.map.popup.clearFeatures();
      }
      // Clear Grid
      this.grid.clearSelection();
      // Clear Graphics
      this.graphicsLayer.clear();
    },
    
    _resetAppState: function(){
      this.currentMatch = null;
      this.lastAddress = null;
      this.lastGeocodeResults = null;
      this.currentSelectedRow = null;
      this.store.data = null;
      this.store = new Memory({ "data": "" });
      this.defaultGeometry = null;
      this._hasCustomPoint = false;
      this._hasDefaultPoint = false;
      this.grid.noDataMessage = "No Results.";
      this.grid.refresh();
    },
    
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
    }
  });
  
  
  return Widget;
});
