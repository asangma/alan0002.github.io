/**
 * Measures Locations, Distances and Areas (PH)
 *
 * @module esri/widgets/Measurement
 * @since 4.0
 */
define([
  "require",
  "../core/declare",
  "dojo/_base/lang", 
  "dojo/_base/array",
  "dojo/_base/Color",

  "dojo/sniff", 
  "dojo/number", 
  "dojo/dom-style", 
  "dojo/dom-construct",
  "dojox/gfx",

  "dijit/_Widget",
  "dijit/registry",
  "dijit/Menu",
  "dijit/MenuItem",

  "../symbols/PictureMarkerSymbol",
  "../symbols/SimpleLineSymbol",
  "../symbols/SimpleFillSymbol",
  "../symbols/support/jsonUtils",
  
  "../geometry/support/geodesicUtils",
  "../geometry/support/webMercatorUtils",
  "../geometry/Point",
  "../geometry/Polyline",
  "../geometry/Polygon",
  "../Graphic",

  "../tasks/support/AreasAndLengthsParameters",
  "../tasks/support/LengthsParameters",
  "../tasks/GeometryService",

  "../config",
  "../core/domUtils",
  "../core/lang",
  "../geometry/support/units",
  "../geometry/support/WKIDUnitConversion",
  "../geometry/SpatialReference",
  
  "dijit/_TemplatedMixin",
  "dijit/_WidgetsInTemplateMixin",
  
  "./Widget",
  "dojo/text!./templates/Measurement.html",
  "dojo/i18n!../nls/jsapi",

  // dijits in widget template
  "dijit/form/ToggleButton",
  "dijit/form/DropDownButton",
  "dijit/layout/ContentPane"
], function(
  require, declare, lang, array, Color,
  has, numberUtil, domStyle, domConstruct, gfx,
  _Widget, registry, Menu, MenuItem,
  PictureMarkerSymbol, SimpleLineSymbol, SimpleFillSymbol, symbolJsonUtils,
  geodesicUtils, webMercatorUtils, Point, Polyline, Polygon, Graphic,
  AreasAndLengthsParameters, LengthsParameters, GeometryService,
  esriConfig, domUtils, esriLang, esriUnits, wkidConverter,SpatialReference,
  _TemplatedMixin, _WidgetsInTemplateMixin,
  Widget, widgetTemplate, jsapiBundle
) {
  /**
   * @extend module:dijit/_Widget
   * @constructor module:esri/widgets/Measurement
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                                 that may be passed into the constructor.
   * @param {string} srcNodeRef - Reference or id of the HTML element in which this widget renders. 
   */	
  var Measurement = declare([ Widget, _Widget,  _TemplatedMixin, _WidgetsInTemplateMixin],
	/** @lends module:esri/widgets/Measurement.prototype */  
  {
    //--------------------------------------------------------------------------
    //
    //  Public Properties
    //
    //--------------------------------------------------------------------------
    /**
     * declaredClass Description
     * @type {string}
     * @private
     */    
    declaredClass: "esri.widgets.Measurement",

    // Widget Props
    widgetsInTemplate: true,
    templateString: widgetTemplate, 

    // Map Props
    _map: null,
    _geometryService: null,
    _interpolatedMap: null,
    
    // External Image Resources
    _mouseImgURL : null,
    _defaultPinURL : null,
    
    //---------------
    // Graphic Related
    _measureGraphics: [],
    _measureGraphic: null,
    _locationGraphic: null,
    _tempGraphic: null,
    _polylineGraphics: null,
    _polygonGraphic: null,
    _pointSymbol: null,
    _useDefaultPointSymbol : true,
    _defaultLineSymbol: null,
    _lineSymbol: null,
    _areaLineSymbol: null,
    _defaultFillSymbol: null,
    _fillSymbol: null,
    _borderlessFillSymbol: null,

    //---------------
    // Data - Strings & Numbers
    _inputPoints: [],
    _unitDictionary: [],
		
    /**
     * String indicating the widgets number pattern
     * @type {string}
     */ 		
    numberPattern: "#,###,###,##0.0",
    
		/**
     * String indicating the widgets number pattern
     * @type {(string|number)}
     */ 		
    result: null, 

    _defaultDistanceUnit: null,
    _defaultAreaUnit: null,
    _defaultLocationUnit: null,
    
		/**
     * String indicating the current distance unit
     * @type {string}
     */ 
    currentDistanceUnit: null,
    
		/**
     * String indicating the current area unit
     * @type {string}
     */ 		
    currentAreaUnit: null,
		
    /**
     * String indicating the current location (point) unit
     * @type {string}
     */ 		
    currentLocationUnit: null,
    
    _unitStrings: {},
    _locationUnitStrings: [],
    _locationUnitStringsLong: [],
    
    _distanceUnitStrings: [],
    _distanceUnitStringsLong: [],
    
    _areaUnitStrings: [],
    _areaUnitStringsLong: [],

    _calculatingMsg: null,
    _gsErrorMsg: null,
    
    // --Template Variable Strings
    _NLS_Lat: null,
    _NLS_Lon: null,
    
    //---------------
    // Handlers
    _mouseMoveMapHandler : null,
    _mouseClickMapHandler: null,
    _doubleClickMapHandler: null,
    _mouseDragMapHandler: null,
    _clickMapHandler: null,
    _mapExtentChangeHandler: null,
    _geometryAreaHandler: null,
    _snappingCallback: null,
    
    //---------------
    // User Interface
    _calcTimer: null,
    _buttonDijits: {},
		
    /**
     * String indicating the widgets previous active tool (if applicable)
     * @type {string}
     */ 
    previousTool: null,
    /**
     * String indicating the widgets active tool
     * @type {string}
     */ 		
    activeTool: null,
		
    /**
     * Current longitude of the green marker symbol 
     * @type {number}
     */ 
    markerLongitude: null,
    
		/**
     * Current latitude of the green marker symbol 
     * @type {number}
     */ 		
    markerLatitude: null,
		
    /**
     * Current longitude of the mouse
     * @type {number}
     */ 		
    mouseLongitude: null, 

    /**
     * Current latitude of the mouse
     * @type {number}
     */ 		
    mouseLatitude: null,

    //--------------------------------------------------------------------------
    //
    //  Lifecycle
    //
    //--------------------------------------------------------------------------

    constructor: function (params, srcNodeRef) {
      params = params || {};
      
      // Measurement requires a Map
      if (!params.map) {
        console.log("dijit.MeasureTool: unable to find the 'map' property in parameters");
        return;
      }
      this._map = params.map;
      
      // Load Event
      // -- SpatialReference Check
      if(this._map.loaded){
        // Update Spatial Reference and interpolation
        this._map.cs = this._checkCS(this._map.spatialReference);
        this._interpolatedMap = !(this._map.cs === "Web Mercator" || this._map.cs === "PCS");
      } else {
        var loadHandle = this._map.on("load", function() {
          // Disconnect Temporary Handler
          loadHandle.remove();
          loadHandle = null;
          // Update Spatial Reference and interpolation
          this._map.cs = this._checkCS(this._map.spatialReference);
          this._interpolatedMap = !(this._map.cs === "Web Mercator" || this._map.cs === "PCS");
        }.bind(this));
      }
      
      // Geometry Service Default 
      this._geometryService = esriConfig.geometryService;
      
      // Location Table Mouse Image Reference
      // -- Used by the Symbols for drawing and in the Location Result Table
      this._mouseImgURL = require.toUrl("./images/cursor16x24.png");
      this._defaultPinURL = require.toUrl("./images/esriGreenPin16x26.png");

      // Symbol Declaration for Line & Fill (Point handled separately below)
      // -- These are used by default if there are no constructor options for Line and Fill
      this._defaultLineSymbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([0, 128, 255]), 3);
      this._defaultFillSymbol = new SimpleFillSymbol( SimpleLineSymbol.STYLE_SOLID,  new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([0, 128, 255]), 3), new Color([0,0,0, 0.5]));

      // If constructor object contains a Point symbol (Object), update widget to use it as default when drawing
      if (params.pointSymbol) {
        // Custom Point Symbol
        this._pointSymbol = params.pointSymbol;
        this._useDefaultPointSymbol = false;
      } else {
        this._pointSymbol = new PictureMarkerSymbol(this._defaultPinURL, 16, 26);
        this._pointSymbol.setOffset(0, 12); 
      }

      // Fill Symbol Only Applies to Area Tool
      var fillSymbol = params.fillSymbol || this._defaultFillSymbol;
      this._fillSymbol = fillSymbol;

      // Fallback to _defaultLineSymbol to ensure area line is always available
      this._areaLineSymbol = fillSymbol.outline || this._defaultLineSymbol;

      // Borderless fill symbol should be derived from this._fillSymbol
      this._borderlessFillSymbol =  symbolJsonUtils.fromJSON(fillSymbol.toJSON());
      this._borderlessFillSymbol.setOutline(null);
      
      // Line Symbol for Distance Tool
      if (params.lineSymbol) {
        this._lineSymbol = params.lineSymbol;
      } else {
        this._lineSymbol = this._defaultLineSymbol;
      }
      
      // If Applicable, Override the Default Length Unit
      if (params.defaultLengthUnit) {
        this._defaultDistanceUnit = params.defaultLengthUnit;
      } else {
        this._defaultDistanceUnit = esriUnits.MILES;
      }
      // If Applicable, Override the Default Area Unit
      if (params.defaultAreaUnit) {
        this._defaultAreaUnit = params.defaultAreaUnit;
      } else {
        this._defaultAreaUnit = esriUnits.ACRES;
      }
      // If Applicable, Override the Default Location Unit      
      if (params.defaultLocationUnit) {
        this._defaultLocationUnit = params.defaultLocationUnit;
      } else {
        this._defaultLocationUnit = esriUnits.DECIMAL_DEGREES;
      }
      
      // Snapping Manager Callback
      this._snappingCallback = lang.hitch(this, this._snappingCallback);
      
      // (Optional) Geometryfrom the Constructor
      if(params.geometry){
        this._userGeometry = params.geometry;
      }
      
      // Timer used to show 'Calculating...' message when making call to GeometryService
      this._calcTimer  =  null;
      
      // Advanced Location Units
      // -- 10.3 Server Required for Proper Functionality
      this.advancedLocationUnits = params.advancedLocationUnits || false;
      
      // Internationalization Strings
      this._NLS_Lon = jsapiBundle.widgets.measurement.NLS_longitude;
      this._NLS_Lat = jsapiBundle.widgets.measurement.NLS_latitude;
      this._gsErrorMsg = jsapiBundle.widgets.measurement.NLS_geometry_service_error;
      this._calculatingMsg = jsapiBundle.widgets.measurement.NLS_calculating;

    },
		
    //--------------------------------------------------------------------------
    //
    //  Public Methods
    //
    //--------------------------------------------------------------------------

    startup: function () {
    
      // Moved data structure creation to outside function
      this._setupDictionaries();
      
      // TODO, CLEAN UP CREATION 
      // Mouse image for Location Result Table
      domConstruct.create("img", {"src" : this._mouseImgURL, alt: "", "style" : "vertical-align:middle"}, this.mouseCell);
      // TODO, CLEAN UP CREATION 
      // Pin image for location result table
      if(this._useDefaultPointSymbol){
        domConstruct.create("img", {"src" : this._defaultPinURL , alt: "", "style" : "vertical-align:middle"}, this.pinCell);
        domConstruct.create("img", {"src" : this._defaultPinURL , alt: "", "style" : "vertical-align:middle"}, this.greenPinDiv);
      }else{
        this._drawPointGraphics(this.pinCell);
        this._drawPointGraphics(this.greenPinDiv);
      }
      
      //Hide by Default
      domStyle.set(this.greenPinDiv, "visibility", "hidden");
      
      // Custom Measurement via constructor
      if(this._userGeometry){
        if(this._map.loaded){
           this._measureCustomGeometry();
        }else{
          // Wait for the map...
          var loadHandle = this._map.on("load", function() {
            loadHandle.remove();
            loadHandle = null;
            this._measureCustomGeometry();
          }.bind(this));
        }
      }
      
    },
		
    //--------------------------------------------------------------------------
    //
    //  Private Methods
    //
    //--------------------------------------------------------------------------
    
		//--------------------------------------------------------------------------
    //
    //  Event Handlers
    //
    //--------------------------------------------------------------------------
    
		
    // Purpose:
    // -- Used internally by setTool() 
    // -- Connects event-handlers and creates unit drop-down for the Area Tool
    _setupAreaTool: function () {

      this._map.navigationManager.setImmediateClick(true);
      
      // Generate the Dropdown
      this._inputPoints = [];
      this._createAreaUnitList();
      
      // Add Graphic to the Map
      this._tempGraphic = new Graphic();
      this._tempGraphic.setSymbol(this._areaLineSymbol);
      this._tempGraphic.setGeometry(new Polyline(this._map.spatialReference));
      this._map.graphics.add(this._tempGraphic);
      
      // Calculate the result 
      if (this._map.cs === "PCS") {
        this._geometryAreaHandler = this._geometryService.on("areas-and-lengths-complete", this._outputArea.bind(this));
      }
      
      // Connect Mouse Events
      this._mouseClickMapHandler = this._map.on("click", this._measureAreaMouseClickHandler.bind(this));
      this._doubleClickMapHandler = this._map.on("dbl-click", this._measureAreaDblClickHandler.bind(this));
      
    },
    
    // Purpose:
    // -- Used internally by setTool() 
    // -- Connects event-handlers and creates unit drop-down for the Distance Tool
    _setupDistanceTool: function () {

      this._map.navigationManager.setImmediateClick(true);

      if (this._map.cs === "PCS") {
        this._projectMapExtent(this._map.extent);
        this._mapExtentChangeHandler = this._map.on("extent-change", this._projectMapExtent.bind(this));
      }

      // Generate the Drop-down
      this._inputPoints = [];
      this._createDistanceUnitList();
      
      // Connect Events
      this._mouseClickMapHandler = this._map.on("click", this._measureDistanceMouseClickHandler.bind(this));
      this._doubleClickMapHandler = this._map.on("dbl-click", this._measureDistanceDblClickHandler.bind(this));

    },

    // Purpose:
    // -- Used internally by setTool() 
    // -- Connects event-handlers and creates unit drop-down for the Location Tool
    _setupLocationTool: function () {
      
      this._map.navigationManager.setImmediateClick(true);
      
      // Manage previous graphic
      this._measureGraphics = [];
      this._map.graphics.remove(this._locationGraphic);
      
      // Generate the Drop-down
      this._createLocationUnitList();
      
      // Calculate the result
      if (this._map.cs === "PCS") {
        this._projectMapExtent(this._map.extent);
        this._mapExtentChangeHandler = this._map.on("extent-change", lang.hitch(this, this._projectMapExtent));
      }
      
      // Connect Events
      this._clickMapHandler = this._map.on("click", this._locationClickHandler.bind(this));
     
      this._mouseMoveMapHandler = this._map.on("mouse-move", this._locationMoveHandler.bind(this));
      
      this._mouseDragMapHandler = this._map.on("mouse-drag", lang.hitch(this, function () {
        registry.byNode(this.resultValue.domNode).set("disabled", true);
      }));
      
    },

    // Purpose:
    // -- Public Method for enabling, disabling or changing the active tool
    // Params:
    // -- toolName (String) (location, distance or area)
    // -- activate/checked (boolean) (activate in the documentation) TODO
    setTool: function (toolName, checked) {

      // Tool State Maintenance 
      this.previousTool = this.activeTool || null;
      this._polylineGraphics = [];
      
      // Reset App State
      this._resetToolState();
      
      // Remove graphic representing area shadow
      if(this._polygonGraphic){
        this._map.graphics.remove(this._polygonGraphic);
        this._polygonGraphic = null;
      }
      
      var toggled = registry.byNode(this._buttonDijits[toolName].domNode).checked;
      domStyle.set(this._unitDropDown.domNode, "visibility", "visible");
      
      // Hide by Default
      domStyle.set(this.greenPinDiv, "visibility", "hidden");
      
      // _buttonDijits is an Object
      registry.byNode(this._buttonDijits.area.domNode).set("checked", false);
      registry.byNode(this._buttonDijits.distance.domNode).set("checked", false);
      registry.byNode(this._buttonDijits.location.domNode).set("checked", false);
      
      // Get Update State for Tool
      if (checked === true || checked === false) {
        toggled = checked;
      }
  
      // Update Tool State
      registry.byNode(this._buttonDijits[toolName].domNode).set("checked", toggled);
      
      // Hide Location Results Table by default
      this._toggleStaticLocationTable(false, true);
      
      // If tool is being shown...
      if (toggled) {
      
        // Change the activeTool property to reflect user choice 
        this.activeTool = toolName;
        
        // Capture current map state before disabling double-click zoom.
        // We'll re-enable it in _resetToolState below -Jian
        // TODO
        this._dblClickZoom = this._map.isDoubleClickZoom;

        if(this._dblClickZoom){
          this._map.disableDoubleClickZoom();
        }
        
        // Enable tool via toolName function param
        if (toolName === "area") {
          this._setupAreaTool();
        }
        else if (toolName === "distance") {
          this._setupDistanceTool();
        }
        else if (toolName === "location") {
          this._setupLocationTool();      
          domStyle.set(this.greenPinDiv, "visibility", "visible");          
        }
        
        // Set up Snapping Manager
        if(this._map.snappingManager) {
          this._map.snappingManager._startSelectionLayerQuery();
          this._map.snappingManager._setUpSnapping();
        }
        
      }else{
      
        // Hiding tool; disable button in UI
        this.activeTool = null;
        
        // Hide the Drop-down Menu
        domStyle.set(this._unitDropDown.domNode, "visibility", "hidden");
      }
      
      // Emit tool-change event with applicable data
      if(this.activeTool !==  this.previousTool){
        this.emitToolChange(this.activeTool, this.getUnit(), this.previousTool);
      }
      
    },
    
    // Purpose:
    // -- onClick event for Area Tool Button in Template
    _areaButtonToggle: function () {
      this.clearResult();
      this.setTool("area");
    },
    
    // Purpose:
    //  -- onClick event for Distance Tool Button in Template
    _distanceButtonToggle: function () {
      this.clearResult();
      this.setTool("distance");    
    },
    
    // Purpose:
    // -- onClick event for Location Tool Button in Template
    _locationButtonToggle: function () {
      this.clearResult();
      this.setTool("location");
    },

    // Purpose:
    // -- Disconnects tool specific events 
    // -- Also handles resetting Snapping Manager connections
    _resetToolState: function () {
    
      var map = this._map;
      map.navigationManager.setImmediateClick(false);
      
      // Hook up Zoom
      if(this._dblClickZoom){
        map.enableDoubleClickZoom();
      }

      // Clear out unit drop-down
      this._inputPoints = [];
      
       // Disconnect Mouse Handlers
      this._mouseClickMapHandler.remove();
      this._mouseMoveMapHandler.remove();
      this._doubleClickMapHandler.remove();
      this._mouseDragMapHandler.remove();
      this._clickMapHandler.remove();
      this._mapExtentChangeHandler.remove();
      this._geometryAreaHandler.remove();

      // Nullify Handlers in case of full destroy()
      this._mouseClickMapHandler = this._mouseMoveMapHandler = this._doubleClickMapHandler =
      this._mouseDragMapHandler = this._clickMapHandler = this._mapExtentChangeHandler =
      this._geometryAreaHandler = null;

      // Remove Snapped Graphic 
      // -- Required before disconnecting Snapping Manager
      if (map.snappingManager && map.snappingManager._snappingGraphic) {
        map.graphics.remove(map.snappingManager._snappingGraphic);
      }

      // Disconnect the Snapping Manager
      if (this._map.snappingManager) {
        this._map.snappingManager._stopSelectionLayerQuery();
        this._map.snappingManager._killOffSnapping();
      }
      
      // IE10 Fix
      if(this._unitDropDown._opened){
        this._unitDropDown.closeDropDown();
      }
    },

    // Purpose:
    // -- Clears application state variables relating to measurement result
    clearResult: function () {
      var map = this._map;
      this.result = 0;
      // Clear distance/area value node
      registry.byNode(this.resultValue.domNode).set("content", "&nbsp");
      var i;
      for (i = 0; i < this._measureGraphics.length; i++) {
        map.graphics.remove(this._measureGraphics[i]);
      }
      this._measureGraphic = null;
      this._measureGraphics = [];
      map.graphics.remove(this._tempGraphic);
      // Disconnect Mouse Handler
      this._mouseMoveMapHandler.remove();
      this._mouseMoveMapHandler = null;
    },
    
    // Purpose:
    // -- Shows the Widget
    show: function () {
      domUtils.show(this.domNode);
    },
    
    // Purpose:    
    // -- Hides the Widget
    hide: function () {
      domUtils.hide(this.domNode);
    },
    
    // Purpose:
    // -- shows a tool's button, specified by a single parameter
    // Parameters:
    // -- toolname (String)
    showTool: function (toolName) {
      var tool = this._buttonDijits[toolName].domNode;
      tool.style.display = "inline";
    },
    
    // Purpose:
    // -- hides a tool's button, specified by a single parameter
    // Parameters:
    // -- toolname (String)
    hideTool: function (toolName) {
      var tool = this._buttonDijits[toolName].domNode;
      tool.style.display = "none";
    },
    
    // Purpose:
    // -- returns the currently active tool and unit associated with that tool
    // Returns:
    // -- Object { toolName (String), unitName (String) }
    getTool: function(){
      if(this.activeTool){
        return {"toolName": this.activeTool, "unitName" : this.getUnit()};
      }
    },
    
    // Purpose:
    // -- returns the unit associated with the current tool
    // Returns:
    // -- unitName (String) 
    getUnit: function(){
      if(this._unitDropDown.label !== "unit"){
        return this._unitDropDown.label;
      }
    },
    
    // Purpose:
    // -- kills the widget, disconnects all events and clears out children
    destroy: function () {
      this._resetToolState();
      this.clearResult();
      this.inherited(arguments);
      this._map = this._geometryService = this._measureGraphics = this._measureGraphic = this._tempGraphic = null;
    },
    
    // Widget Events

    emitToolChange: function(toolName, unitName, previousToolName) {
      this.emit("tool-change", {
        toolName: toolName,
        unitName: unitName,
        previousToolName: previousToolName
      });
    },
    emitUnitChange: function(unitName, toolName) {
      this.emit("unit-change", {
        unitName: unitName,
        toolName: toolName
      });
    },
    emitMeasureStart: function(toolName, unitName) {
      this.emit("measure-start", {
        toolName: toolName,
        unitName: unitName
      });
    },
    emitMeasure: function (toolName, geometry, values, unitName) {
      this.emit("measure", {
        toolName: toolName,
        geometry: geometry,
        values: values,
        unitName: unitName
      });
    },
    emitMeasureEnd: function (toolName, geometry, values, unitName) {
      this.emit("measure-end", {
        toolName: toolName,
        geometry: geometry,
        values: values,
        unitName: unitName
      });
    },

    // Purpose:
    // -- public entry point function for manual measurement, will trigger measure-end upon completion
    // Params:
    // -- shape.geometry(Point, Polyline or Polygon Object)
    measure: function(geometry){
      if(!geometry){ return; }
      this._userGeometry = geometry;
      this._measureCustomGeometry();
    },

    // Purpose:
    // -- Handler for manual/custom measurement workflow
    // Used when geometry is passed in via the widget constructor or public measure() function
    // Added in 3.11 
    _measureCustomGeometry: function(){
      this.clearResult();
      switch(this._userGeometry.type) {
        case "point":
          this._measureCustomPoint();
          break;
        case "polyline":
          this._measureCustomDistance();
          break;
        case "polygon":
          this._measureCustomArea();
          break;
        default:
          break;
        } 
    },
    
    // Purpose:
    // -- Handler used to trigger measurement of a Location(Point) from the widget constructor
    // -- Added in 3.11 
    _measureCustomPoint: function(){
      this.setTool("location", true);

      // Coordinate System Conversion Check
      if (this._map.cs === "Web Mercator" && this._userGeometry.spatialReference !== this._map.spatialReference) {
        this._userGeometry = webMercatorUtils.geographicToWebMercator(this._userGeometry);
      }

      // Create the Graphic
      this._measureGraphic = new Graphic();
      this._measureGraphic.setSymbol(this._pointSymbol);
      this._measureGraphic.setGeometry(this._userGeometry);
      // Save Reference to Graphic
      this._measureGraphics.push(this._measureGraphic);
      // Add Graphic to the Map
      this._map.graphics.add(this._measureGraphic);
      // Trigger Measurement
      this._measurePoint(this._userGeometry);

    },
    
    // Purpose:
    // -- Handler used to trigger measurement of an Distance(Polyline) from the widget constructor
    // -- Added in 3.11 
    _measureCustomDistance: function(){
    
      // Geometry must have more than one path
      if(this._userGeometry.paths[0].length > 1){
      
        // App State
        this.setTool("distance", true);
        this._inputPoints = [];
        
        // Loop through the Paths to get Point data
        array.forEach(this._userGeometry.paths[0], lang.hitch(this, function(p, idx){
        
          // Get Points
          this._inputPoints.push(p);
          // Create Point Graphics
          var pointGraphic = new Graphic(new Point(p[0], p[1],  this._userGeometry.spatialReference), this._pointSymbol);
          
          // Save for generic removal on tool re-use
          this._measureGraphics.push(pointGraphic);
          this._map.graphics.add(pointGraphic);
          
          // If first point, return so result isn't calculated ( 0 minus 1)
          if(idx === 0){ return; }
          this.result += this._geodesicDistance(p,  this._userGeometry.paths[0][idx-1]);
          
        }));
        
        // Create the Graphic
        this._measureGraphic = new Graphic();
        this._measureGraphic.setSymbol(this._lineSymbol);
        this._measureGraphics.push(this._measureGraphic);
       
       // Geodesic Densify, update and add to the map's graphics layer
        this._userGeometry = this._densifyGeometry(this._userGeometry);
        this._measureGraphic.setGeometry( this._userGeometry );
        this._map.graphics.add(this._measureGraphic);
       
       // Show the Result
        this._showDistance(this.result);
        
        // App State
        this._inputPoints = [];
        this.emitMeasureEnd(this.activeTool, this._userGeometry, this.result, this.getUnit());
      }
    
    },
    
    // Purpose:
    // -- Handler used to trigger measurement of an Area(Polygon) from the widget constructor
    // -- Added in 3.11 
    _measureCustomArea: function(){
    
      // App State
      this.setTool("area", true);
      this._inputPoints = [];
      
      // Geodesic Densify
      var pGeometry = this._densifyGeometry(this._userGeometry);
      
      // Create the Graphic
      this._measureGraphic = new Graphic();
      this._measureGraphic.setGeometry(pGeometry);
      this._measureGraphic.setSymbol(this._fillSymbol);
      
      // Save Reference to Graphic
      this._measureGraphics.push(this._measureGraphic); 
      
      // Add Graphic to the Map
      this._map.graphics.add(this._measureGraphic);
      
      // Start Area Measurement Logical Process
      this._getArea(pGeometry);
      
      // App State (Required TODO?)
      this._inputPoints = [];
    },
    
    // Purpose:
    // -- Used to toggle and/or clear the Location Results Table for the Location Tool
    // Params:
    // -- shape.geometry (Object)
    // Returns:
    // -- TODO
    _densifyGeometry: function (geom) {
      if (this._map.cs === "Web Mercator") {
        geom = webMercatorUtils.webMercatorToGeographic(geom);
      }
      var densifiedLine;
      if (this._map.cs === "PCS") {
        densifiedLine = geom;
      } else {
        densifiedLine = geodesicUtils.geodesicDensify(geom, 500000);
      }
      if (this._map.cs === "Web Mercator") {
        densifiedLine = webMercatorUtils.geographicToWebMercator(densifiedLine);
      }
      return densifiedLine;
    },
    
    // Purpose:
    // -- TODO
    // Params:
    // -- mouse click event
    _measureAreaMouseClickHandler: function (evt) {
      var snappingPoint, i;
      if (this._map.snappingManager) {
        snappingPoint = this._map.snappingManager._snappingPoint;
      }
      var mapPoint = snappingPoint || evt.mapPoint;
      this._inputPoints.push(mapPoint);
      this._currentStartPt = mapPoint;
      if (this._inputPoints.length === 1) {
        this._tempGraphic.setGeometry(new Polyline(this._map.spatialReference));
        for (i = 0; i < this._measureGraphics.length; i++) {
          this._map.graphics.remove(this._measureGraphics[i]);
        }
        this._measureGraphics = [];
        this.result = 0;
        this._outputResult(this.result, jsapiBundle.widgets.measurement.NLS_area_acres);
        this._mouseMoveMapHandler = this._map.on("mouse-move", this._measureAreaMouseMoveHandler.bind(this));
        
        // 3.11 Event
        this.emitMeasureStart(this.activeTool, this.getUnit());
      }
      this._measureGraphic = new Graphic();
      this._measureGraphic.setSymbol(this._areaLineSymbol);
      this._measureGraphics.push(this._measureGraphic);
      
      //
      if (this._inputPoints.length > 1) {
      
        var line = new Polyline(this._map.spatialReference);
        line.addPath([this._inputPoints[this._inputPoints.length - 2], mapPoint]);
        
        var closeLine = new Polyline(this._map.spatialReference);
        closeLine.addPath([this._inputPoints[0], mapPoint]);
        var densifiedLine = this._densifyGeometry(line);
        var densifiedCloseLine = this._densifyGeometry(closeLine);
        
        this._tempGraphic.setGeometry(densifiedCloseLine);
        this._measureGraphic.setGeometry(densifiedLine);
        this._polylineGraphics.push(this._measureGraphic);
        this._map.graphics.add(this._measureGraphic);
        
        // Generate the fill Polygon
        if(this._inputPoints.length > 2){
          var polygon = new Polygon(this._map.spatialReference);
          var ring = [];
          for (i = 0; i < this._inputPoints.length; i++) {
            ring.push([this._inputPoints[i].x, this._inputPoints[i].y]);
          }
          ring.push([this._inputPoints[0].x, this._inputPoints[0].y]);
          polygon.addRing(ring);
          
          //this._getArea(polygon);
          // Update the Polygon Fill
          if(this._polygonGraphic){
            this._map.graphics.remove(this._polygonGraphic);
            this._polylineGraphics.push(this._tempGraphic);
            this._polygonGraphic = this._generatePolygonFromPaths();
            this._map.graphics.add(this._polygonGraphic);
            this._measureGraphic = this._polygonGraphic;
            // Remove the temporary polyline geometry
            this._polylineGraphics.pop();
          }else{
            this._polygonGraphic = this._generatePolygonFromPaths();
            this._map.graphics.add(this._polygonGraphic);
          }
          this._getArea(polygon);
          
        }
      }else{
        if(this._polygonGraphic){
          this._map.graphics.remove(this._polygonGraphic);
          this._polygonGraphic = null;
        }
      }
    },
    
    // Purpose:
    // -- TODO
    // Params:
    // --mouse move/drag event  
    _measureAreaMouseMoveHandler: function (evt) {
      var mapPoint;
      if (this._inputPoints.length > 0) {
        var line = new Polyline(this._map.spatialReference);
        var snappingPoint;
        if (this._map.snappingManager) {
          snappingPoint = this._map.snappingManager._snappingPoint;
        }
        mapPoint = snappingPoint || evt.mapPoint;
        line.addPath([this._currentStartPt, mapPoint]);
        var densifiedLine = this._densifyGeometry(line);
        this._tempGraphic.setGeometry(densifiedLine);
      }
      if (this._inputPoints.length > 1) {
        var closeLine = new Polyline(this._map.spatialReference);
        closeLine.addPath([mapPoint, this._inputPoints[0]]);
        var closeDensifiedLine = this._densifyGeometry(closeLine);
        this._tempGraphic.setGeometry(this._tempGraphic.geometry.addPath(closeDensifiedLine.paths[0]));
      }
    },
    
    // Purpose:
    // -- TODO
    // Params:
    // -- mouse double click event 
    _measureAreaDblClickHandler: function (evt) {
      this._mouseMoveMapHandler.remove();
      this._mouseMoveMapHandler = null;
      
      //for iOS browser, dbl click won't trigger single click even when setImmediateClick as true
      //this is a workaround
      if (this._map.navigationManager.eventModel === "touch" && has("ios")) {
        this._measureAreaMouseClickHandler(evt);
      }
      
      var polygon = new Polygon(this._map.spatialReference);
      var ring = [];
      var i;
      for (i = 0; i < this._inputPoints.length; i++) {
        ring.push([this._inputPoints[i].x, this._inputPoints[i].y]);
      }
      ring.push([this._inputPoints[0].x, this._inputPoints[0].y]);
      polygon.addRing(ring);
      this._inputPoints = [];
      
      // Does this do anything?
      this.measureGeometry = this._densifyGeometry(polygon);
      
      // Update the Polygon
      if(this._polygonGraphic){
        this._map.graphics.remove(this._polygonGraphic);
        this._polylineGraphics.push(this._tempGraphic);
        this._polygonGraphic = this._generatePolygonFromPaths();
        this._map.graphics.add(this._polygonGraphic);
      }
      
      this._getArea(polygon);
      
      //for android devices, dbl click triggers single click after this event
      //this is a workaround
      /*if (this._map.navigationManager.eventModel === "touch" || this._map.navigationManager.eventModel === "pointer") {
        this.setTool("area", false);
      }*/
      
      this._polylineGraphics = [];

    },
    
    // Purpose:
    // -- TODO ( this._polylineGraphics )
    // Returns:
    // -- Polygon (Object)
    _generatePolygonFromPaths: function(){
      var pathsArr = [];
      // Get all paths into a flat array
      array.forEach(this._polylineGraphics, lang.hitch(this, function(g){
        array.forEach(g.geometry.paths, lang.hitch(this, function(p){
          array.forEach(p, lang.hitch(this, function(c){
            pathsArr.push(c);
          }));
        }));
      }));
      pathsArr.push(pathsArr[0]);
      // Generate the polygon from polyline paths
      var polygon = new Polygon(this._map.spatialReference);
      polygon.addRing(pathsArr);
      // Create the Graphic
      var pGeometry = this._densifyGeometry(polygon);
      var pGraphic = new Graphic();
      pGraphic.setGeometry(pGeometry);
      //pGraphic.setSymbol(this._defaultFillSymbol);
      pGraphic.setSymbol(this._borderlessFillSymbol);
      this._measureGraphic = pGraphic;
      this._measureGraphics.push(pGraphic);
      return pGraphic;
    },
    
    // Purpose:
    // -- 
    // Params:
    // -- shape.geometry (Object) 
    _getArea: function (geometry) {
      var geographicGeometries = [];
      var areasAndLengthParams = new AreasAndLengthsParameters();
      areasAndLengthParams.areaUnit = GeometryService.UNIT_ACRES;
      //"geodesic" is only available for 10.1 and above geometry service.
      //If users provide prior 10.1 service, it will use planar.    
      areasAndLengthParams.calculationType = "geodesic";
      //if self intersecting, simplify using geometry service
      if (Polygon.prototype.isSelfIntersecting(geometry)) {
        //if self intersecting, simplify using geometry service
        this._geometryService.simplify([geometry], lang.hitch(this, function (simplifiedGeometries) {
          array.forEach(simplifiedGeometries, lang.hitch(this, function (simplifiedGeometry) {
            if (this._map.cs === "PCS") {
              areasAndLengthParams.polygons = simplifiedGeometries;
              this._geometryService.areasAndLengths(areasAndLengthParams);
              return;
            } else if (this._map.cs === "Web Mercator") {
              simplifiedGeometry = webMercatorUtils.webMercatorToGeographic(simplifiedGeometry);
            }
            geographicGeometries.push(simplifiedGeometry);
          }));
          var areas = geodesicUtils.geodesicAreas(geographicGeometries, esriUnits.ACRES);
          this._showArea(areas[0]);
        }));
      } else {
        if (this._map.cs === "Web Mercator") {
          geometry = webMercatorUtils.webMercatorToGeographic(geometry);
        }
        geographicGeometries.push(geometry);
        if (this._map.cs === "PCS") {
          areasAndLengthParams.polygons = geographicGeometries;
          this._geometryService.areasAndLengths(areasAndLengthParams);
          return;
        }
        var areas = geodesicUtils.geodesicAreas(geographicGeometries, esriUnits.ACRES);
        this._showArea(Math.abs(areas[0]));
      }
    },
    
    // Purpose:
    // -- Handler for showing Measurement result for an Area
    // -- Positive (Absolute) Value of the Area is Assumed/Forced
    // Params:
    // --  _geometryService.areasAndLengths() result object
    _outputArea: function (result) {
      this._showArea(Math.abs(result.areas[0]));
    },
    
    // Purpose:
    // -- TODO
    // Params:
    // -- 
    _showArea: function (area) {
      if (area) {
        this.result = area;
        var unit = registry.byNode(this._unitDropDown.domNode).label;
        var finalResult = this._outputResult(this.result, unit);
        
        // Measurement End Check
        if(this._mouseMoveMapHandler){
          this.emitMeasure(this.activeTool, this._measureGraphic.geometry, finalResult, this.getUnit());
        }else{
          this.emitMeasureEnd(this.activeTool, this._measureGraphic.geometry, finalResult, this.getUnit());
        }
      }
    },
    
    // Purpose:
    // -- TODO
    // Params:
    // --
    _measureDistanceDblClickHandler: function (evt) {
    
      // Disconnect the mouse from the map
      this._mouseMoveMapHandler.remove();
      this._mouseMoveMapHandler = null;
      
      // iOS Workaround (Legacy, Jian)
      // -- dblClick doesn't trigger a single event when setImmediateClick is true
      if (this._map.navigationManager.eventModel === "touch" && has("ios")) {
        this._measureDistanceMouseClickHandler(evt);
      }
      
      var measurementGeometry = new Polyline(this._map.spatialReference);
      measurementGeometry.addPath(this._inputPoints);
      measurementGeometry = this._densifyGeometry(measurementGeometry);
      
      // Update App State
      this._measureGraphic.geometry = measurementGeometry;
      
      if (this._map.cs === "PCS") {

        //The final result should be calculated by geometry service in order to give the accurate measurement.
        var lengthParams = new LengthsParameters();
        lengthParams.polylines = [measurementGeometry];
        lengthParams.lengthUnit = 9093; // Miles
        lengthParams.calculationType = "geodesic";    
        
        // Get the accurate measurement
        this._geometryService.lengths(lengthParams, lang.hitch(this, function(result){
          // Update Internals and UI
          this.result = result.lengths[0]; // Miles
          this._showDistance(this.result);
          this._inputPoints = [];
          this.emitMeasureEnd(this.activeTool, measurementGeometry, this._outputResult(this.result, this.getUnit()), this.getUnit());
        }));
      }else{
        // End Measurement Operation
        this._inputPoints = [];
        this.emitMeasureEnd(this.activeTool, measurementGeometry, this._outputResult(this.result, this.getUnit()), this.getUnit());
      }
    },

    // Purpose:
    // -- TODO
    // Params:
    // --
    _measureDistanceMouseClickHandler: function (evt) {
    
      //if it's a new measurement, store the first pt, clear previous results and graphics
      //if it's in the middle of a measurement, show the static result and geodesics, reset the currentstartpt
      var snappingPoint;
      if (this._map.snappingManager) {
        snappingPoint = this._map.snappingManager._snappingPoint;
      }
      var mapPoint = snappingPoint || evt.mapPoint;
      this._inputPoints.push(mapPoint);
      this._currentStartPt = mapPoint;

      // New Measurement Operation
      if (this._inputPoints.length === 1) {
       
        var i;
        for (i = 0; i < this._measureGraphics.length; i++) {
          this._map.graphics.remove(this._measureGraphics[i]);
        }
        
        // Reset - TODO: use reset() function? 
        this._map.graphics.remove(this._tempGraphic);
        this._measureGraphics = [];
        this.result = 0;
        this._outputResult(this.result, jsapiBundle.widgets.measurement.NLS_length_miles);
        
        this._tempGraphic = new Graphic();
        this._tempGraphic.setSymbol(this._lineSymbol);
        this._map.graphics.add(this._tempGraphic);
        this._mouseMoveMapHandler = this._map.on("mouse-move", this._measureDistanceMouseMoveHandler.bind(this));
              
        //3.11 Event
        this.emitMeasureStart(this.activeTool, this.getUnit());
      }
      this._tempGraphic.setGeometry(new Polyline(this._map.spatialReference));
      
      // Create the Graphic, Add it to the Map
      var pointGraphic = new Graphic();
      pointGraphic.setSymbol(this._pointSymbol);
      pointGraphic.setGeometry(mapPoint);
      this._measureGraphics.push(pointGraphic);
      this._map.graphics.add(pointGraphic);

      // Polyline Operation
      if (this._inputPoints.length > 1) {
        
        // Current Line
        this._measureGraphic = new Graphic();
        this._measureGraphic.setSymbol(this._lineSymbol);
        
        // Add to Line Array
        this._measureGraphics.push(this._measureGraphic);
        
        // Densify
        var line = new Polyline(this._map.spatialReference);
        line.addPath([this._inputPoints[this._inputPoints.length - 2], mapPoint]);
        var densifiedLine = this._densifyGeometry(line);
        
        // Update the polyline and add it to the Map
        this._measureGraphic.setGeometry(densifiedLine);
        this._map.graphics.add(this._measureGraphic);
        
        // Projected Coordinate System - Accuracy Improvement 3.13
        if (this._map.cs === "PCS") {
          
          // Scoped Reference
          //var result = this.result;
          
          // Geometry Service Params
          var lengthParams = new LengthsParameters();
          lengthParams.polylines = [densifiedLine];
          lengthParams.lengthUnit = 9093;
          lengthParams.calculationType = "geodesic";    
          
          // Get the accurate measurement
          this._geometryService.lengths(lengthParams, lang.hitch(this, function(res){
            // Add new result to previous result and update UI
            this.result = this.result + res.lengths[0];
            this._showDistance(this.result);
            this.emitMeasure(this.activeTool, mapPoint, this._outputResult(this.result, this.getUnit()), this.getUnit());
          }));

         }else{
          // Not Projected Coordinate Systems - Geometry Service NOT required
          // Add new result to previous result and update UI
          this.result += this._geodesicDistance(this._inputPoints[this._inputPoints.length - 2], mapPoint);
          this._showDistance(this.result);
          this.emitMeasure(this.activeTool, mapPoint, this._outputResult(this.result, this.getUnit()), this.getUnit());
        }
      }else{
        // Use the _pointSymbol for the very first point in a polyline
        //pointGraphic.setSymbol(this._pointSymbol);
      }
    },
    
    // Purpose:
    // -- TODO
    // Params:
    // -- 
    _measureDistanceMouseMoveHandler: function (evt) {
      if (this._inputPoints.length > 0) {
        var line = new Polyline(this._map.spatialReference);
        var snappingPoint;
        if (this._map.snappingManager) {
          snappingPoint = this._map.snappingManager._snappingPoint;
        }
        var mapPoint = snappingPoint || evt.mapPoint;
        //var mapPoint = evt.mapPoint;
        line.addPath([this._currentStartPt, mapPoint]);
        var densifiedLine = this._densifyGeometry(line);
        this._tempGraphic.setGeometry(densifiedLine);
        var distance = this._geodesicDistance(this._currentStartPt, mapPoint);
        this._showDistance(distance + this.result);
      }
    },
    
    // Purpose:
    // -- TODO
    // Params:
    // --
    // Returns:
    // --     
    _geodesicDistance: function (pt1, pt2) {
      //if there are two input points call the geometry service and perform the distance operation
      var polyline = new Polyline(this._map.spatialReference);
      if (this._map.cs === "PCS") {
        pt1 = this._getGCSLocation(pt1);
        pt2 = this._getGCSLocation(pt2);
      }
      polyline.addPath([pt1, pt2]);
      if (this._map.cs === "Web Mercator") {
        polyline = webMercatorUtils.webMercatorToGeographic(polyline);
      }
      return geodesicUtils.geodesicLengths([polyline], esriUnits.MILES)[0];
      //this._showDistance(esri.geometry.geodesicLengths([polyline], esri.Units.MILES)[0] + baseDistance);
    },
    
    // Purpose:
    // -- TODO
    // Params:
    // --
    _showDistance: function (distance) {
      if (distance) {
        this._outputResult(distance, registry.byNode(this._unitDropDown.domNode).label);
      }
    },
    
    // Purpose:
    // -- 
    // Params:
    // --
    _locationClickHandler: function(evt){

      var snappingPoint;
      
      // Snapping Manager Logic
      if (this._map.snappingManager) {
        snappingPoint = this._map.snappingManager._snappingPoint;
      }
      var currentMapPt = snappingPoint || evt.mapPoint;
      
      // Keep the Tool Active (3.10 Enhancement)
      this._locationButtonToggle();
      
      // Create the Graphic
      this._locationGraphic = new Graphic();
      this._locationGraphic.setGeometry(currentMapPt);
      this._locationGraphic.setSymbol(this._pointSymbol);
      this._map.graphics.add(this._locationGraphic);
      this._measureGraphics.push(this._locationGraphic);

      // Start Measuring Process
      this._calculateLocation(currentMapPt, true);

    },
    
    // Purpose:
    // -- TODO
    // Params:
    // --
    _locationMoveHandler: function(evt){
      
      var snappingPoint;
      
      // Snapping Manager Logic
      if (this._map.snappingManager) {
        snappingPoint = this._map.snappingManager._snappingPoint;
      }
      var currentMapPt = snappingPoint || evt.mapPoint;
      // Start Measuring Process
      this._calculateLocation(currentMapPt, false);
    },
    
    // Purpose:
    // -- TODO
    // Params:
    // --     
    _calculateLocation:function(pt, isStatic){
      
      var mapPoint;
      
      // 3.11/3.12 Enhancement for Advanced Location Units
      var isAdvanced = (this.currentLocationUnit === "esriDegreeMinuteSeconds" || this.currentLocationUnit === "esriDecimalDegrees") ? false : true;
      
      // Last minute check to make sure the move event is disabled...
      if(isAdvanced && this._mouseMoveMapHandler){
        this._mouseMoveMapHandler.remove();
        this._mouseMoveMapHandler = null;
      }

      // Geometry Service Not Required
      mapPoint = this._getGCSLocation(pt);
      this._updateLocationUI(mapPoint, isStatic, isAdvanced);
    },
    
    // Purpose:
    // -- TODO
    // Params:
    // --        
    _updateLocationUI: function(point, isStatic, isAdvanced){

      var x, y, mapPt, outSR;
      
      // Unit Calculation
      x = point.x;
      y = point.y;
      
      // Geographic Coordinate System
      if(this._interpolatedMap){
        
        this._outOfBoundsCheck = [false, 1];
        
        if(this._map.spatialReference.isWrappable()){
          point = point.normalize();
        }else{
          if(point.x > 180){
            point.x = 180;
            this._outOfBoundsCheck = [true, 1];
          }
          else if(point.x < -180){
            point.x = -180;
            this._outOfBoundsCheck = [true, -1];
          }
        }
        point.y = this._roundY(point.y);
        
        // mouse click event requires a call to the Geometry Service for projection
        if(isStatic){
          
           // Store values for calculation in case of unit-switch
          this._updateMarkerLocation(point.x, point.y);
          
          outSR = new SpatialReference({wkid: 4326});
          this._geometryService.project([point], outSR, lang.hitch(this, function (features) {
            
            // Save the result
            mapPt = features[0];

            // Fix the returned values
            if(this._outOfBoundsCheck[0]){
              mapPt.x = 180 * this._outOfBoundsCheck[1];
            }     
            this._advancedLocationDisplayHandler(mapPt, mapPt.x, mapPt.y, isAdvanced, isStatic);
          }));
          // Break out of the current logic flow, use GeometryService callback to trigger UI update and measure-end event
          return;
        }
      }
      
      // !this._interpolatedMap
      if(isStatic){
        this._updateMarkerLocation(x, y);
      }
      
      this._advancedLocationDisplayHandler(point, x, y, isAdvanced, isStatic);
    },

    // Purpose:
    // -- TODO
    // Params:
    // --
     
    _advancedLocationDisplayHandler: function(point, x, y, isAdvanced, isStatic){
      
     var params; 
     
     if(isAdvanced){
        // MGRS, USNG, UTM, Georef, GARS require GeometryService
        params = {
          "coordinates" : [[x, y]], 
          "sr" : {wkid: 4326},
          "conversionType" : this._unitStrings[this.currentLocationUnit]
        };

        // use the GeometryService
        this._updateGeocoordinateStringLocation(params, point.geometry);

      }else{
      
        // Degree or DMS 
        // Non Advanced Conversion
        var displayValues = this._calculateXY(x, y);

        // Update UI depending on click vs move/drag
        // Mouse location will always equal static location if the event was a click
        if(isStatic){
          this._updateStaticLocation(displayValues[0], displayValues[1]);
          this.emitMeasureEnd(this.activeTool, point, [displayValues[0], displayValues[1]], this.getUnit());
        }else{
          this._updateMouseLocation(displayValues[0], displayValues[1]);
        }

      }
    },

    // Purpose:
    // -- For Application State, used internally on unit-change for re-calculation of values
    // Params:
    // -- x (String | Integer) and y (String | Integer)
    _updateMarkerLocation: function(x, y){
      this.markerLocationX = x;
      this.markerLocationY = y;
    },

    // Purpose:
    // -- Replacement Function for _outputLocationResult()   
    // Params:
    // --
    // Returns:
    // --         
    // 
    _updateMouseLocation: function(x, y){
        this.mouseLongitude.innerHTML = x;
        this.mouseLatitude.innerHTML= y;
    },

    // Purpose:
    // -- Used to toggle and/or clear the Location Results Table for the Location Tool
    // Params:
    // --
    // Returns:
    // --         
    // Replacement Function for _outputLocationResult()   
    _updateStaticLocation: function(x, y){
        // Static Location will always update/reflect the Mouse Location on click
        this._updateMouseLocation(x, y);
        this.markerLongitude.innerHTML = x;
        this.markerLatitude.innerHTML =  y;
    },
    // Purpose:
    // -- Used to toggle and/or clear the Location Results Table for the Location Tool
    // Params:
    // --
    // Returns:
    // --         
    // Replacement Function for _toGeoCoordinateString() 
    _updateGeocoordinateStringLocation: function(params, geometry){

      // Spacing
      this.resultValue.domNode.innerHTML = "&nbsp";
      
      // Server Conversion
      this._geometryService.toGeoCoordinateString(params, lang.hitch(this, function(results){
        
        // Timer for Calculating Message
        clearTimeout(this._calcTimer);
        
        // Check if results were returned
        // Update the UI with the result
        // Measurement complete
        if(results){
          this.resultValue.domNode.innerHTML = results;
          this.emitMeasureEnd(this.activeTool, geometry, results, this.getUnit());
        }else{
          this.resultValue.domNode.innerHTML = this._gsErrorMsg;
          this.emitMeasureEnd(this.activeTool, null, null, this.getUnit());
        }
      }));
      
      // Reset Timer
      clearTimeout(this._calcTimer);
      
      // Only show Calculating message if response takes longer than one second.
      this._calcTimer = setTimeout(lang.hitch(this, function() {
        this.resultValue.domNode.innerHTML = this._calculatingMsg;
      }, 1000));
      
    },
    
    // Purpose:
    // -- Used to toggle and/or clear the Location Results Table for the Location Tool
    // Params:
    // --
    // Returns:
    // --         
    // Replacement Function for calculateValueToDisplay() 
    _calculateXY: function(x, y){    
      
      // Variables, i18n Strings
      var lon, lat, localStrings = jsapiBundle.widgets.measurement;
      
      // Check if Degrees or DMS
      if (this.getUnit() === localStrings.NLS_decimal_degrees) {
        
        // Rounding
        lon = x.toFixed(6);
        lat = y.toFixed(6);

        // 3.11 Rounding
        lat = this._roundY(lat);
        
        // If map is NOT wrappable ( double negative ), round to 180/-180,
        if(!this._map.spatialReference.isWrappable()){
          lon = this._roundX(lon);
        }

      } else if (this.getUnit() === localStrings.NLS_deg_min_sec) {
        
        // Number State 
        var negativeX = false, negativeY = false;
        
        // Convert for formula below, save Number State
        if (x < 0) {
          negativeX = true;
          x = Math.abs(x);
        }
        if (y < 0) {
          negativeY = true;
          y = Math.abs(y);
        }

        // 3.11 Rounding
        y = this._roundY(y);
        
         // If map is NOT wrappable ( double negative ), round to 180/-180,
        if(!this._map.spatialReference.isWrappable()){
          x = this._roundX(x);
        }
        
        // String Conversion for Degrees
        lon = Math.floor(x) + "\u00B0" + Math.floor((x - Math.floor(x)) * 60) + "'" + Math.floor(((x - Math.floor(x)) * 60 - Math.floor((x - Math.floor(x)) * 60)) * 60) + '"';
        lat = Math.floor(y) + "\u00B0" + Math.floor((y - Math.floor(y)) * 60) + "'" + Math.floor(((y - Math.floor(y)) * 60 - Math.floor((y - Math.floor(y)) * 60)) * 60) + '"';

        // Conversion Fix
        if (negativeX){ lon = "-" + lon; }
        if (negativeY){ lat = "-" + lat; }
      }

        return [lon, lat];
    },
    
    // Purpose:
    // -- Used to toggle and/or clear the Location Results Table for the Location Tool
    // Params:
    // --
    // Returns:
    // --         
    // Rounds Latitude to remain within 90/-90 vertical boundary
    _roundY: function(latY){
      if( latY > 90 )
      { latY = 90;}
      else if( latY < -90 )
      { latY = -90; }
      return latY;
    },
    
    // Purpose:
    // -- Used to toggle and/or clear the Location Results Table for the Location Tool
    // Params:
    // --
    // Returns:
    // --         
    // Rounds Longitude to remain within 180/-180 horizontal boundary 
    _roundX: function(lonX){
      if( lonX > 180 )
      { lonX = 180; }
      else if( lonX < -180 )
      { lonX = -180; }
      return lonX;
    },

    // Purpose:
    // -- Used to toggle and/or clear the Location Results Table for the Location Tool
    // Params:
    // --
    // Returns:
    // --         
    _getGCSLocation: function (pt) {
      var mapPt = pt;
      if (this._map.cs === "Web Mercator") {
        mapPt = webMercatorUtils.webMercatorToGeographic(mapPt);
      } else if (this._map.cs === "PCS") {
        if (this._map._newExtent) {
          var ratioX = Math.abs((this._map._newExtent.xmax - this._map._newExtent.xmin) / (this._map.extent.xmax - this._map.extent.xmin));
          var ratioY = Math.abs((this._map._newExtent.ymax - this._map._newExtent.ymin) / (this._map.extent.ymax - this._map.extent.ymin));
          var newX = (mapPt.x - this._map.extent.xmin) * ratioX + this._map._newExtent.xmin;
          var newY = (mapPt.y - this._map.extent.ymin) * ratioY + this._map._newExtent.ymin;
          mapPt = new Point(newX, newY, this._map.spatialReference);
        }
      }else{
        mapPt = mapPt.normalize();
      }
      return mapPt;
    },

    // Purpose:
    // -- Used to toggle and/or clear the Location Results Table for the Location Tool
    // Params:
    // --
    // Returns:
    // --         
    // CLEAN UP
    _projectMapExtent: function (extent) {
      // the mouse move and drag events will be associated only when projection process finishes
      // - Jian from pre 3.10
      var graphic = new Graphic(extent);
      var outSR = new SpatialReference({
        wkid: 4326
      });
      
      this._geometryService.project([graphic.geometry], outSR, lang.hitch(this, function (features) {
        //after projection, reconnect mouse move/drag events
        if (!this._mouseMoveMapHandler && this.activeTool === "location") {
          
          // Only reconnect if unit supports mousemove calculation
          if(this.currentLocationUnit === "esriDegreeMinuteSeconds" || this.currentLocationUnit === "esriDecimalDegrees"){
            this._mouseMoveMapHandler = this._map.on("mouse-move", lang.hitch(this, this._locationMoveHandler));
          }
          
          // For Map Dragging
          this._mouseDragMapHandler = this._map.on("mouse-drag", lang.hitch(this, function () {
            registry.byNode(this.resultValue.domNode).set("disabled", true);
          }));
        }
        this._map._newExtent = features[0];
      }));
    },
    
    //_showCoordinates does not fire when using advanced location units
    _showCoordinates: function(evt){

      // Calculate XY from the evt, update local properties
      var x, y, snappingPoint, mapPt;
      //Check if snapped or mapPoint click
      if (this._map.snappingManager) {
        snappingPoint = this._map.snappingManager._snappingPoint;
      }
      var currentMapPt = snappingPoint || evt.mapPoint;

      mapPt = this._getGCSLocation(currentMapPt);
      
      if(!this.map.spatialReference.isWrappable()){
        if(mapPt.x > 180){
          mapPt.x = 180;
        }
        else if(mapPt.x < -180){
          mapPt.x = -180;
        }
      }
      
      this.mouseLocationX = mapPt.x;
      this.mouseLocationY = mapPt.y;
      this._outputLocationResult(this.mouseLocationX, this.mouseLocationY, registry.byNode(this.unit.domNode).label);
    },
    
    _updateStaticState: function(evt){
    
      /*
      if(!this.map.spatialReference.isWrappable()){
        if(evt.x > 180){
          evt.x = 180;
        }
        else if(evt.x < -180){
          evt.x = -180;
        }
      }
      */
      
      this.markerLocationX = this.mouseLocationX = evt.x;
      this.markerLocationY = this.mouseLocationY = evt.y;
      // Updated to use widget private properties instead of string compares -JONU
      var measurementValues = this._calculateValueToDisplay(this.markerLocationX, this.markerLocationY,  this.units[this.currentLocationUnit]);
      this.markerLongitude.innerHTML = this.mouseLongitude.innerHTML = measurementValues[0];
      this.markerLatitude.innerHTML =  this.mouseLatitude.innerHTML = measurementValues[1];
      this.emitMeasureEnd(this.activeTool, evt, measurementValues, this.getUnit());
    },

    _showStaticCoordinates: function(evt){
      this._outOfBoundsCheck = [false, 1];
      // Show the Table
      this._toggleStaticLocationTable(true, false);

      var x, y, snappingPoint, mapPt;
      //Check if snapped or mapPoint click
      if (this._map.snappingManager) {
        snappingPoint = this._map.snappingManager._snappingPoint;
      }
      var currentMapPt = snappingPoint || evt.mapPoint;
      if (!this._interpolatedMap) {
        mapPt = this._getGCSLocation(currentMapPt);
        if(!this.map.spatialReference.isWrappable()){
          if(mapPt.x > 180){
            mapPt.x = 180;
             this._outOfBoundsCheck = [true, 1];
          }
          else if(mapPt.x < -180){
            mapPt.x = -180;
            this._outOfBoundsCheck = [true, -1];
          }
        }
        this._updateStaticState(mapPt);
      } else {
        if(this.map.spatialReference.isWrappable()){
          currentMapPt = currentMapPt.normalize();
        }else{
          if(currentMapPt.x > 180){
            currentMapPt.x = 180;
            this._outOfBoundsCheck = [true, 1];
          }
          else if(currentMapPt.x < -180){
            currentMapPt.x = -180;
            this._outOfBoundsCheck = [true, -1];
          }
        }

        var outSR = new SpatialReference({wkid: 4326});
        this._geometryService.project([currentMapPt], outSR, lang.hitch(this, function (features) {
          mapPt = features[0];
          if(this._outOfBoundsCheck[0]){
            mapPt.x = 180 * this._outOfBoundsCheck[1];
          }
          this._updateStaticState(mapPt);
        }));
      }
    },
 
    // Purpose:
    // -- Used to toggle and/or clear the Location Results Table for the Location Tool
    // Params:
    // --
    // Returns:
    // --         
    // Returns coordinate system of given spatial reference, represented as a string
    _checkCS: function (spatialReference) {
      if (spatialReference.wkid) {
        if (spatialReference.wkid === 3857 || spatialReference.wkid === 102100 || spatialReference.wkid === 102113) {
          return "Web Mercator";
        }
        if (esriLang.isDefined(wkidConverter[spatialReference.wkid])) {
          return "PCS";
        }
        return "GCS";
      }

      if (spatialReference.wkt) {
        if (spatialReference.wkt.indexOf("WGS_1984_Web_Mercator") !== -1) {
          return "Web Mercator";
        }
        if (spatialReference.wkt.indexOf("PROJCS") === 0) {
          return "PCS";
        }
        return "GCS";
      }
    },

    // Purpose:
    // -- Used to toggle and/or clear the Location Results Table for the Location Tool
    // Params:
    // --
    // Returns:
    // --         
    // Used to activate a tool switch for distance and area
    // Location tool uses its own switch function _switchLocationUnit due to complexity, would like to refactor 
    _switchUnit: function (unit) {

      // Update Unit Reference
      if(this.activeTool === "distance"){
        this.currentDistanceUnit = unit;
      }else if(this.activeTool === "area"){
        this.currentAreaUnit = unit;
      }else if(this.activeTool === "location"){
        this.currentLocationUnit = unit;
      }
      
      // Output result to UI
      registry.byNode(this._unitDropDown.domNode).set("label", this._unitStrings[unit]);
      if (this.result === null) { return; }
      var finalResult = this._outputResult(this.result, this._unitStrings[unit]);
            
      // Trigger Events
      this.emitUnitChange(this._unitStrings[unit], this.activeTool);
      
      if(this._measureGraphic !== null){
        this.emitMeasureEnd(this.activeTool, this._measureGraphic.geometry, finalResult, this.getUnit());
      }
      
    },

    // Purpose:
    // -- Used to toggle and/or clear the Location Results Table for the Location Tool
    // Params:
    // --
    // Returns:
    // --     
    // Prints result for area, distance measurements to resultValue node
    // Returns value information for measure-end event 
    _outputResult: function (result, unit) {
      var finalResult = result * this._unitDictionary[unit];
      if (finalResult === 0) {
        registry.byNode(this.resultValue.domNode).set("content", "&nbsp");
      } else if (finalResult > 1000000) {
        registry.byNode(this.resultValue.domNode).set("content", numberUtil.format(finalResult.toPrecision(9), {pattern: this.numberPattern}) + ' ' + unit);
      } else if (finalResult < 10) {
        registry.byNode(this.resultValue.domNode).set("content", numberUtil.format(finalResult.toFixed(2), {pattern: this.numberPattern + "0"}) + ' ' + unit);
      } else {
        registry.byNode(this.resultValue.domNode).set("content", numberUtil.format(finalResult.toFixed(2), {pattern: this.numberPattern}) + ' ' + unit);
      }
      // Added in 3.11 for Events
      return finalResult;

    },
    
    // Purpose:
    // -- Used to toggle and/or clear the Location Results Table for the Location Tool
    // Params:
    // --
    // Returns:
    // --     
    
    // Used when unit used to measure a location is changed
    // Re-factored at 3.11
    // Cleaned up at 3.12
    _switchLocationUnit: function (unit) {

      var xS, yS, params;
      
      // Update Label
      registry.byNode(this._unitDropDown.domNode).set("label", this._unitStrings[unit]);
      
      // Update App State
      this.currentLocationUnit = unit;
      
      // Disconnect the Mouse
      this._mouseMoveMapHandler.remove();
      this._mouseMoveMapHandler = null;
      
      // 3.11 Event
      this.emitUnitChange(this._unitStrings[unit], this.activeTool);

      // Check if Geometry Service Required
      if(unit === "esriDegreeMinuteSeconds" || unit === "esriDecimalDegrees"){
      
        // Reconnect MouseMove Event
        this._mouseMoveMapHandler = this._map.on("mouse-move", this._locationMoveHandler.bind(this));
        
        // Show the Table
        this._toggleStaticLocationTable(true, false);        
        
        if( this._locationGraphic ){
          // If a location graphic exists, use it for calculation process
          this._calculateLocation(this._locationGraphic.geometry, true);
          // Since new value is calculated, fire measure-end
          //this.emitMeasureEnd(this.activeTool, this._locationGraphic.geometry, values, this.getUnit());
        }
        
      }else{  
      
        // Hide the Table
        this._toggleStaticLocationTable(false, false);
        
        if( this.resultValue === null || (this.markerLocationX === null && this.markerLocationY === null)){ return; }
        
        // Static location vars always represent the Graphic XY
        xS = this.markerLocationX;
        yS = this.markerLocationY;
        
        params = {
          "coordinates" : [[xS, yS]], 
          "sr" : {wkid: 4326},
          "conversionType" : this._unitStrings[unit]
        };
        
        if(this._locationGraphic){
          // Convert the Measurement result using Geometry Service method(s)
          this._updateGeocoordinateStringLocation(params, this._locationGraphic.geometry);
        }
      }
    },

    // Purpose:
    // -- Used to toggle and/or clear the Location Results Table for the Location Tool
    // Params:
    // --
    // Returns:
    // --     
    _toggleStaticLocationTable: function(showTable, resetValues){
      
      // Clear Result Fields
      if(resetValues){
        this.resultValue.innerHTML = "&nbsp";
        this.markerLongitude.innerHTML = "---";
        this.markerLatitude.innerHTML = "---";
        this.mouseLongitude.innerHTML = "---";
        this.mouseLatitude.innerHTML = "---";
      }
      
      // Show/Hide
      if(showTable){
        domUtils.show(this.resultTable.domNode);
        domUtils.hide(this.resultValueContainer.domNode);
      }else{
        domUtils.hide(this.resultTable.domNode);      
        domUtils.show(this.resultValueContainer.domNode);      
        this._mouseMoveMapHandler.remove();
      }
    },

    // Purpose:
    // -- 
    // Params:
    // --
    // Returns:
    // --     
    _outputLocationResult: function (x, y, unit) {
      // Convert the Coordinates and Display
      var values = this._calculateValueToDisplay(x, y, unit);
      this.mouseLongitude.innerHTML = values[0];
      this.mouseLatitude.innerHTML= values[1];
    },

    _createDistanceUnitList: function () {
      var defaultUnit;
      var menu = new Menu({
        style: "display: none;"
      });
     
      // Generate the Menu
      array.forEach(this._distanceUnitStrings, lang.hitch(this, function (lengthUnit, idx) {
        var menuItem = new MenuItem({
          label: lengthUnit,
          onClick: lang.hitch(this, function () {
            this._switchUnit(this._distanceUnitStringsLong[idx]);
          })
        });
        menuItem.set("class", "unitDropDown");
        menu.addChild(menuItem);
      }));
      registry.byNode(this._unitDropDown.domNode).set("dropDown", menu);
      
      // Check if Previous Unit was Selected
      if(this.currentDistanceUnit){
        defaultUnit = this._unitStrings[this.currentDistanceUnit];
        registry.byNode(this._unitDropDown.domNode).set("label", defaultUnit);
      }else{
        defaultUnit = this._unitStrings[this._defaultDistanceUnit];
        registry.byNode(this._unitDropDown.domNode).set("label", defaultUnit);
        this.currentDistanceUnit = this._defaultDistanceUnit;
      }
      //this.emitToolChange(this.activeTool, this.getUnit());
    },
    
    // Purpose:
    // -- 
    // Params:
    // --
    // Returns:
    // -- 
    _createAreaUnitList: function () {
      
      var defaultUnit;
      var menu = new Menu({
        style: "display: none;"
      });

      // Generate the Menu
      array.forEach(this._areaUnitStrings, lang.hitch(this, function (areaUnit, idx) {
        var menuItem = new MenuItem({
          label: areaUnit,
          onClick: lang.hitch(this, function () {
            this._switchUnit(this._areaUnitStringsLong[idx]);
          })
        });
        menuItem.set("class", "unitDropDown");
        menu.addChild(menuItem);
      }));
      registry.byNode(this._unitDropDown.domNode).set("dropDown", menu);
      
      // Check if Previous Unit was Selected
      if(this.currentAreaUnit){
        defaultUnit = this._unitStrings[this.currentAreaUnit];
        registry.byNode(this._unitDropDown.domNode).set("label", defaultUnit);
      }else{
        defaultUnit = this._unitStrings[this._defaultAreaUnit];
        registry.byNode(this._unitDropDown.domNode).set("label", defaultUnit);
        this.currentAreaUnit = this._defaultAreaUnit;
      }
      //this.emitToolChange(this.activeTool, this.getUnit());
    },
    
    // Purpose:
    // -- 
    // Params:
    // --
    // Returns:
    // -- 
    _createLocationUnitList: function () {
    
      var defaultUnit;
      var visibleUnits = this._locationUnitStrings;
      
      var menu = new Menu({
        style: "display: none;"
      });
      
      // Advanced Location Units Check
      if(this._geometryService === null || this.advancedLocationUnits === false){
        visibleUnits = visibleUnits.slice(0,2);
      }
      
      // Generate the Menu
      array.forEach(visibleUnits, lang.hitch(this, function (locationUnit, idx) {
        var menuItem = new MenuItem({
          label: locationUnit,
          onClick: lang.hitch(this, function () {
            this._switchLocationUnit(this._locationUnitStringsLong[idx]);
          })
        });
        menuItem.set("class", "unitDropDown");
        menu.addChild(menuItem);
      }));
      registry.byNode(this._unitDropDown.domNode).set("dropDown", menu);
      
      // Check if Previous Unit was Selected
      if(!this.currentLocationUnit){
        this.currentLocationUnit = this._defaultLocationUnit;
      }
      
      defaultUnit = this._unitStrings[this.currentLocationUnit];      
      registry.byNode(this._unitDropDown.domNode).set("label", defaultUnit);

      // Show the Table (Depending on Unit)
      if(this.currentLocationUnit === "esriDegreeMinuteSeconds" || this.currentLocationUnit === "esriDecimalDegrees"){
        this._toggleStaticLocationTable(true, false);   
      }

    },
    
    // Purpose:
    // -- 
    // -- TODO
    _setupDictionaries: function(){
    
      // Local
      var localStrings = jsapiBundle.widgets.measurement;
      
      //length unit conversion from mile
      this._unitDictionary[localStrings.NLS_length_miles] = 1;
      this._unitDictionary[localStrings.NLS_length_kilometers] = 1.609344;
      this._unitDictionary[localStrings.NLS_length_feet] = 5280;
      this._unitDictionary[localStrings.NLS_length_meters] = 1609.34;
      this._unitDictionary[localStrings.NLS_length_yards] = 1760;
      this._unitDictionary[localStrings.NLS_length_nautical_miles] = 0.869;
      
      //area unit conversion from acres
      this._unitDictionary[localStrings.NLS_area_acres] = 1;
      this._unitDictionary[localStrings.NLS_area_sq_kilometers] = 0.004047;
      this._unitDictionary[localStrings.NLS_area_sq_miles] = 0.0015625;
      this._unitDictionary[localStrings.NLS_area_sq_feet] = 43560;
      this._unitDictionary[localStrings.NLS_area_sq_meters] = 4046.87;
      this._unitDictionary[localStrings.NLS_area_hectares] = 0.4047;
      this._unitDictionary[localStrings.NLS_area_sq_yards] = 4840;
      this._unitDictionary[localStrings.NLS_area_sq_nautical_miles] = 0.001179874545293396;
      
      //mapping esri units with localized string
      this._unitStrings = {
        // Distance - Unit Conversion from Miles
        "esriMiles": localStrings.NLS_length_miles,
        "esriKilometers": localStrings.NLS_length_kilometers,
        "esriFeet": localStrings.NLS_length_feet,
        "esriMeters": localStrings.NLS_length_meters,
        "esriYards": localStrings.NLS_length_yards,
        "esriNauticalMiles": localStrings.NLS_length_nautical_miles,
        //Area - Unit Conversion from Acres
        "esriAcres": localStrings.NLS_area_acres,
        "esriSquareKilometers": localStrings.NLS_area_sq_kilometers,
        "esriSquareMiles": localStrings.NLS_area_sq_miles,
        "esriSquareFeet": localStrings.NLS_area_sq_feet,
        "esriSquareMeters": localStrings.NLS_area_sq_meters,
        "esriHectares": localStrings.NLS_area_hectares,
        "esriSquareYards": localStrings.NLS_area_sq_yards,
        "esriSquareNauticalMiles": localStrings.NLS_area_sq_nautical_miles,
        // Location - Unit Identification
        "esriDecimalDegrees": localStrings.NLS_decimal_degrees,
        "esriDegreeMinuteSeconds": localStrings.NLS_deg_min_sec,
        "esriMGRS": localStrings.NLS_MGRS,
        "esriUSNG": localStrings.NLS_USNG,
        "esriUTM": localStrings.NLS_UTM,
        "esriDDM": localStrings.NLS_DDM,
        "esriDD": localStrings.NLS_DD,
        "esriGARS": localStrings.NLS_GARS,
        "esriGeoRef": localStrings.NLS_GeoRef
      };
      
      // Drop-down Labels (Units) for Location Tool
      this._locationUnitStrings = [
        localStrings.NLS_decimal_degrees, 
        localStrings.NLS_deg_min_sec, 
        localStrings.NLS_MGRS, 
        localStrings.NLS_USNG, 
        localStrings.NLS_UTM, 
        localStrings.NLS_GeoRef, 
        localStrings.NLS_GARS
      ];
      
      this._locationUnitStringsLong = [
        "esriDecimalDegrees", 
        "esriDegreeMinuteSeconds", 
        "esriMGRS", 
        "esriUSNG", 
        "esriUTM", 
        "esriGeoRef", 
        "esriGARS"
      ];
      
      this._distanceUnitStrings = [
        localStrings.NLS_length_miles, 
        localStrings.NLS_length_kilometers, 
        localStrings.NLS_length_feet, 
        localStrings.NLS_length_meters, 
        localStrings.NLS_length_yards, 
        localStrings.NLS_length_nautical_miles
      ];
      
      this._distanceUnitStringsLong = [
        "esriMiles",
        "esriKilometers",
        "esriFeet",
        "esriMeters",
        "esriYards",
        "esriNauticalMiles"
      ];
      
      this._areaUnitStrings = [
        localStrings.NLS_area_acres, 
        localStrings.NLS_area_sq_miles, 
        localStrings.NLS_area_sq_kilometers, 
        localStrings.NLS_area_hectares, 
        localStrings.NLS_area_sq_yards, 
        localStrings.NLS_area_sq_feet, 
        localStrings.NLS_area_sq_meters
      ];
      
      this._areaUnitStringsLong = [
        "esriAcres", 
        "esriSquareMiles", 
        "esriSquareKilometers", 
        "esriHectares", 
        "esriSquareYards", 
        "esriSquareFeet", 
        "esriSquareMeters"
      ];
      
      this._buttonDijits = {
        "area" : this._areaButton,
        "distance" : this._distanceButton,
        "location" : this._locationButton
      };

      // Update the Button Tooltips
      registry.byNode(this._distanceButton.domNode).setLabel(localStrings.NLS_distance);
      registry.byNode(this._areaButton.domNode).setLabel(localStrings.NLS_area);
      registry.byNode(this._locationButton.domNode).setLabel(localStrings.NLS_location);    
      registry.byNode(this.resultLabel.domNode).setContent(localStrings.NLS_resultLabel);
      
    },
    
    // Purpose:
    // -- Used by the Online Viewer to generate unique SVG-based image for the Location Result Table based on this._pointSymbol;
    // -- Most of the below code is re-factored from esri/widgets/Legend.js
    _drawPointGraphics: function(node){
    
      var source, surface, shapeDesc, gfxShape, sWidth = 10, sHeight = 10, symbol =  this._pointSymbol;
      
      // Create the Image Container
      var rampDiv = domConstruct.create("div", {
        "class": "esriLocationResultSymbol"
      }, node);
      
      // Create the Surface from the default width/length (10)
      surface = gfx.createSurface(rampDiv, sWidth, sHeight);

      if ( has("ie") < 9 ) {
        // Fixes an issue in IE where the shape is partially drawn and
        // positioned to the right of the table cell
        source = surface.getEventSource();
        domStyle.set(source, "position", "relative");
        domStyle.set(source.parentNode, "position", "relative");
      }
      
      // Get Shape Parameters
      shapeDesc = symbol.getShapeDescriptors();
      
      // Create the Shape
      // -- If an error occurs, delete the surface reference and bail out completely
      try {
        gfxShape = surface.createShape(shapeDesc.defaultShape).setFill(shapeDesc.fill).setStroke(shapeDesc.stroke);
      } catch (e) {
        surface.clear();
        surface.destroy();
        return;
      }    

      // Rescaling
      var bbox = gfxShape.getBoundingBox(),
        width = bbox.width,
        height = bbox.height,
        
        // Borrowed from GraphicsLayer.js:
        // -- Aligns the center of the path with surface's origin (0,0)
        // -- This logic is specifically required for SMS symbols with STYLE_PATH style
        vectorDx = -(bbox.x + (width / 2)),
        vectorDy = -(bbox.y + (height / 2)),
        
        // Borrowed from TemplatePickerItem.js:
        // -- Aligns the center of the shape with the center of the surface
        dim = surface.getDimensions(),
        transform = {
          dx: vectorDx + dim.width / 2,
          dy: vectorDy + dim.height / 2
      };
      
      // If image is too big, shrink it with SVG Transform
      if (width > sWidth || height > sHeight) {
      
        // Resize Compatibility Test
        var test = (width/sWidth > height/sHeight);
        var actualSize = test ? width : height;
        var refSize = test ? sWidth : sHeight;
        var scaleBy = (refSize - 5) / actualSize;
        
        // Translate
        lang.mixin(transform, {
          xx: scaleBy,
          yy: scaleBy
        });
      }
      
      // Update the Image
      gfxShape.applyTransform(transform);
    }
  });

  return Measurement;
});
