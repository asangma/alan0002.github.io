/**
 * Provides a simple button that animates the {@link module:esri/views/View} 
 * to the user's current location when clicked. By default the button looks like the following: 
 * 
 * ![locate-button](../assets/img/apiref/widgets/widgets-locate.png)
 * 
 * @module esri/widgets/Locate
 * @since 4.0
 *        
 * @example 
 * //This graphics layer will store the graphic used to display the user's location
 * var gl = new GraphicsLayer();
 * map.add(gl);
 * 
 * var locateBtn = new Locate({
 *   view: view,   //attaches the Locate button to the view
 *   graphicsLayer: gl  //the layer the locate graphic is assigned to
 * }, "locateDiv");  //references the DOM node used to place the widget
 * //startup() must be called to start the widget
 * locateBtn.startup(); 
 */

/**
 * Fires after the [locate()](#locate) method is called.
 *
 * @event module:esri/widgets/Locate#locate
 * @property {module:esri/Graphic} graphic - The graphic used to represent the found location.
 * @property {Object} position - Geoposition returned from the [Geolocation API](#geolocationOptions).
 * @property {number} scale - Scale in meters to set the view to. Based on [accuracy](#geolocationOptions).         
 * 
 * @see [locate()](#locate)
 */
define([
  "require",
  
  "dojo/_base/lang",

  "./Widget",

  "dijit/a11yclick",
  "dijit/_TemplatedMixin",

  "dojo/on",
  "dojo/Deferred",

  "dojo/text!./Locate/templates/Locate.html",

  "dojo/i18n!../nls/jsapi",

  "dojo/dom-class",
  "dojo/dom-attr",

  "../config",

  "../geometry/support/webMercatorUtils",
  "../geometry/Point",
  "../geometry/SpatialReference",

  "../Graphic",

  "../layers/GraphicsLayer",

  "../symbols/PictureMarkerSymbol",

  "../tasks/support/ProjectParameters"
], function (
  require,
  lang,
  Widget,
  a11yclick, _TemplatedMixin,
  on, Deferred,
  dijitTemplate,
  i18n,
  domClass, domAttr,
  esriConfig,
  webMercatorUtils, Point, SpatialReference,
  Graphic,
  GraphicsLayer,
  PictureMarkerSymbol,
  ProjectParameters
) {

  var css = {
    root: "esri-locate",
    container: "esri-container",
    text: "esri-icon-font-fallback-text",
    icon: "esri-icon",
    locate: "esri-locate esri-icon-locate",
    loading: "esri-rotating esri-icon-loading-indicator",
    tracking: "esriTracking esri-icon-pause"
  };

  /**
   * @extends module:esri/widgets/Widget
   * @constructor module:esri/widgets/Locate
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                              that may be passed into the constructor.
   * @param {string | Node} srcNodeRef - Reference or id of the HTML node in which this widget renders.                              
   */    
  var Locate = Widget.createSubclass([_TemplatedMixin], 
  /** @lends module:esri/widgets/Locate.prototype */                                   
  {

    declaredClass: "esri.widgets.Locate",

    templateString: dijitTemplate,

    //--------------------------------------------------------------------------
    //
    //  Lifecycle
    //
    //--------------------------------------------------------------------------

    constructor: function () {
      this._i18n = i18n.widgets.locate;
      if (!navigator.geolocation) {
        this.set("visible", false);
        console.log(this.declaredClass + "::navigator.geolocation unsupported.");
      }
    },

    postCreate: function () {
      this.inherited(arguments);
      this.own(on(this._containerNode, a11yclick, this.locate.bind(this)));
    },
   
    startup: function () {
      this.inherited(arguments);
      this.set("loaded", true);
      this.emit("load");
    },

    destroy: function () {
      if (this._viewReady) {
        this._viewReady.cancel();
      }
      if (this.graphicsLayer) {
        var view = this.get("view");
        if (view) {
          var map = this.view.map;
          if (map) {
            map.remove(this.graphicsLayer);
          }
        }
      }
      // remove watch if there
      this._stopWatchingPosition();
      // do other stuff
      this.inherited(arguments);
    },

    //--------------------------------------------------------------------------
    //
    //  Variables
    //
    //--------------------------------------------------------------------------

    css: css,

    //--------------------------------------------------------------------------
    //
    //  Properties
    //
    //--------------------------------------------------------------------------

    //----------------------------------
    //  updateLocationEnabled
    //----------------------------------

    /**
    * Indicates whether to center the {@link module:esri/views/View} at the location when a new position is returned. 
    * 
    * @type {boolean}
    * @default            
    */  
    updateLocationEnabled: true,

    //----------------------------------
    //  clearOnTrackingStopEnabled
    //----------------------------------

    /**
    * Removes the existing graphic when tracking stops.
    * 
    * @type {boolean}
    * @default false          
    */  
    clearOnTrackingStopEnabled: false,

    //----------------------------------
    //  geolocationOptions
    //----------------------------------

    /**
    * The HTML5 Geolocation Position options for locating. Refer to 
    * [Geolocation API Specification](http://www.w3.org/TR/geolocation-API/#position-options) for details.
    * 
    * @type {Object}
    * @default { maximumAge: 0, timeout: 15000, enableHighAccuracy: true }          
    */  
    geolocationOptions: {
      maximumAge: 0,
      timeout: 15000,
      enableHighAccuracy: true
    },

    //----------------------------------
    //  graphicsLayer
    //----------------------------------

    /**
    * Layer in which the highlighted graphic is set.
    * 
    * @type {module:esri/layers/GraphicsLayer}
    *            
    * @example 
    * //The graphics layer in which to place the graphic when the location is found
    * var gl = new GraphicsLayer();
    * map.add(gl);  //add the graphicsLayer to the map
    * var locateBtn = new Locate({
    *   view: view,  //The view in which to perform the locate()
    *   graphicsLayer: gl 
    * });
    */  
    graphicsLayer: null,

    //----------------------------------
    //  locationSymbolEnabled
    //----------------------------------

    /**
    * If `true`, the user's location will be highlighted with a point.
    * 
    * @type {boolean}
    * @default            
    */  
    locationSymbolEnabled: true,

    //----------------------------------
    //  popupTemplate
    //----------------------------------

    /**
    * The PopupTemplate used for the highlight graphic.
    * 
    * @type {module:esri/PopupTemplate}            
    */  
    popupTemplate: null,

    //----------------------------------
    //  updateScaleEnabled
    //----------------------------------

    /**
    * Sets the view's [scale](#scale) when a new position is returned.
    * 
    * @type {boolean}
    * @default            
    */  
    updateScaleEnabled: true,

    //----------------------------------
    //  scale
    //----------------------------------

    /**
    * The scale to zoom to when a user's location is found.
    * 
    * @type {number}
    *            
    * @example 
    * var locateBtn = new Locate({
    *   view: view,  //assigns the locate widget to a view
    *   scale: 24000  //the view will zoom to a 1:24,000 scale when the location is found
    * });
    */  
    scale: null,

    //----------------------------------
    //  locationSymbol
    //----------------------------------

    /**
    * The symbol used on the graphic to show the user's location on the map.
    * 
    * @type {number}
    * 
    * @example 
    * var locateBtn = new Locate({
    *   view: view,  //assigns the locate widget to a view
    *   locationSymbol: new SimpleMarkerSymbol()  //overwrites the default symbol used for the 
    *   //graphic placed at the location of the user when found
    * });
    */  
    locationSymbol: new PictureMarkerSymbol({
      url: require.toUrl("./images/sdk_gps_location.png"),
      width: 28,
      height: 28
    }),

    //----------------------------------
    //  timeout
    //----------------------------------

    timeout: 15000,

    //----------------------------------
    //  tracking
    //----------------------------------

    /**
    * Indicates whether the widget is watching for new positions.
    * 
    * @type {boolean}
    * @default false            
    */  
    tracking: false,

    _setTrackingAttr: function (newVal) {
      this._set("tracking", newVal);
      this._locate();
    },

    //----------------------------------
    //  trackingEnabled
    //----------------------------------

    /**
    * When `true`, the button becomes a toggle that creates an event to watch for location changes.
    * 
    * @type {boolean}
    * @default false            
    */  
    trackingEnabled: false,

    _setTrackingEnabledAttr: function (newVal) {
      this._set("trackingEnabled", newVal);
      if (this.get("tracking") && !this.get("trackingEnabled")) {
        this._stopTracking();
      }
      this._setTitle();
    },

    //----------------------------------
    //  view
    //----------------------------------

    /**
    * The view associated with the widget.
    * 
    * @type {module:esri/views/MapView | module:esri/views/SceneView}
    */  
    view: null,

    _setViewAttr: function (newVal) {
      this._set("view", newVal);
      if (this.view) {
        if (this._viewReady) {
          this._viewReady.cancel();
        }
        this._viewReady = this.view.then(function () {
          this._setTitle();
          var gl = this.get("graphicsLayer");
          if (!gl) {
            gl = new GraphicsLayer();
            this.set("graphicsLayer", gl);
            var view = this.get("view");
            if (view) {
              var map = this.view.map;
              if (map) {
                map.add(gl);
              }
            }
          }
          // start tracking if necessary
          if (this.get("tracking") && this.get("trackingEnabled")) {
            this._locate();
          }
        }.bind(this));
      }
    },

    //--------------------------------------------------------------------------
    //
    //  Public Methods
    //
    //--------------------------------------------------------------------------

    /**
     * Clears the locate graphic from the [graphicsLayer](#graphicsLayer).
     */
    clear: function () {
      var g = this.get("highlightGraphic"),
        gl = this.get("graphicsLayer");
      if (g && gl) {
        gl.remove(g);
      }
      this.set("highlightGraphic", null);
    },

    /**
     * Animates the view to the user's extent.
     * 
     * @return {Promise} Resolves to an object with the same specification as the event
     *                   object defined in the [locate event](#event:locate).
     *
     * @example 
     * var locateBtn = new Locate({
     *   view: view,
     *   graphicsLayer: gl
     * }, "locateDiv");
     * 
     * locateBtn.locate().then(function(){
     *   //Fires after the user's location has been found
     * });
     */
    locate: function () {
      if (this.trackingEnabled) {
        this.set("tracking", !this.tracking);
      }
      return this._locate();
    },

    //--------------------------------------------------------------------------
    //
    //  Private Methods
    //
    //--------------------------------------------------------------------------

    _setTitle: function () {
      if (this.trackingEnabled) {
        if (this.tracking) {
          domAttr.set(this._iconNode, "title", this._i18n.stopTracking);
          domAttr.set(this._textNode, "textContent", this._i18n.stopTracking);
        } else {
          domAttr.set(this._iconNode, "title", this._i18n.tracking);
          domAttr.set(this._textNode, "textContent", this._i18n.tracking);
        }
      } else {
        domAttr.set(this._iconNode, "title", this._i18n.title);
        domAttr.set(this._textNode, "textContent", this._i18n.title);
      }
    },

    _stopWatchingPosition: function () {
      if (this.watchId) {
        // remove watch event
        navigator.geolocation.clearWatch(this.watchId);
        // set watch event
        this.set("watchId", null);
      }
      this._clearCurrentLocationVars();
    },

    _stopTracking: function () {
      domClass.remove(this._iconNode, this.css.tracking);
      domClass.add(this._iconNode, this.css.locate);
      this._stopWatchingPosition();
      // remove point
      if (this.clearOnTrackingStopEnabled) {
        this.clear();
      }
      // remove loading class
      this._hideLoading();
    },

    _startTracking: function () {
      domClass.add(this._iconNode, this.css.tracking);
      domClass.remove(this._iconNode, this.css.locate);
      this._stopWatchingPosition();
      var WatchId = navigator.geolocation.watchPosition(function (position) {
        position = this._positionToObject(position);
        this._setPosition(position).then(function (response) {
          this._locateEvent(response);
        }.bind(this), function (error) {
          if (!error) {
            error = new Error(this.declaredClass + "::Error setting the position.");
          }
          this._locateError(error);
        }.bind(this));
      }.bind(this), function (error) {
        if (!error) {
          error = new Error(this.declaredClass + "::Could not get tracking position.");
        }
        this._locateError(error);
      }.bind(this), this.get("geolocationOptions"));
      // set watch event
      this.set("watchId", WatchId);
    },

    _clearCurrentLocationVars: function () {
      this._graphic = null;
      this._position = null;
      this._scale = null;
    },
    
    _positionToObject: function(position){
      return position ? {
        coords: lang.mixin({}, position.coords),
        timestamp: position.timestamp
      } : {};
    },

    _getCurrentPosition: function () {
      var def = new Deferred();
      this._clearCurrentLocationVars();
      // time expired
      var notNowTimeout = setTimeout(function () {
        clearTimeout(notNowTimeout);
        var error = new Error(this.declaredClass + "::time expired getting position.");
        def.reject(error);
      }.bind(this), this.get("timeout"));
      // get location
      navigator.geolocation.getCurrentPosition(function (position) {
        position = this._positionToObject(position);
        clearTimeout(notNowTimeout);
        this._setPosition(position).then(function (response) {
          def.resolve(response);
        }.bind(this), function (error) {
          if (!error) {
            error = new Error(this.declaredClass + "::Error setting position.");
          }
          def.reject(error);
        }.bind(this));
      }.bind(this), function (error) {
        if (!error) {
          error = new Error(this.declaredClass + "::Could not get current position.");
        }
        def.reject(error);
      }.bind(this), this.get("geolocationOptions"));
      return def.promise;
    },

    _locate: function () {
      var def = new Deferred();
      // add loading class
      this._showLoading();
      // geolocation support
      if (navigator.geolocation) {
        // watch position
        if (this.trackingEnabled) {
          // watch position exists
          if (this.tracking) {
            this._startTracking();
            def.resolve({
              tracking: true
            });
          } else {
            this._stopTracking();
            def.resolve({
              tracking: false
            });
          }
        } else {
          this._getCurrentPosition().then(function (response) {
            this._locateEvent(response);
            def.resolve(response);
          }.bind(this), function (error) {
            if (!error) {
              error = new Error(this.declaredClass + "::Could not get current position.");
            }
            this._locateError(error);
            def.reject(error);
          }.bind(this));
        }
      } else {
        var error = new Error(this.declaredClass + "::geolocation unsupported");
        this._locateError(error);
        def.reject(error);
      }
      this._setTitle();
      return def.promise;
    },

    _projectPoint: function (pt) {
      var def = new Deferred();
      // map spatial reference
      var sr = this.view.map.spatialReference;
      // map is web mercator projection and pt is lat/lon
      if (sr.isWebMercator()) {
        var mp = webMercatorUtils.geographicToWebMercator(pt);
        def.resolve(mp);
      }
      // geometry service is set and point needs projection (map is not lat/lon)
      else if (esriConfig.geometryService && sr.wkid !== 4326) {
        // project parameters
        var params = new ProjectParameters({
          geometries: [pt],
          outSR: sr
        });
        // project point
        esriConfig.geometryService.project(params).then(function (projectedPoints) {
          if (projectedPoints && projectedPoints.length) {
            def.resolve(projectedPoints[0]);
          } else {
            def.reject(new Error(this.declaredClass + "::Point was not projected."));
          }
        }.bind(this), function (error) {
          // projection error
          if (!error) {
            error = new Error(this.declaredClass + "::please specify a geometry service on esri/config to project.");
          }
          def.reject(error);
        });
      } else {
        // projection unnecessary. Either map and point are lat/lon or no geometry service set
        def.resolve(pt);
      }
      return def.promise;
    },

    _getScale: function (position) {
      var defaultScale = 50000;
      var accuracy = position && position.coords && position.coords.accuracy;
      var widgetScale = this.get("scale");
      return widgetScale || accuracy || defaultScale;
    },

    _createPoint: function (position) {
      var pt;
      if (position && position.coords) {
        // point info
        var latitude = position.coords.latitude;
        var longitude = position.coords.longitude;
        var z = position.coords.altitude || null;
        // set point
        pt = new Point({
          longitude: longitude,
          latitude: latitude,
          z: z
        }, new SpatialReference({
          wkid: 4326
        }));
      }
      return pt;
    },

    _animatePoint: function (projectedPoint, position, scale, g) {
      var def = new Deferred();
      // create graphic
      g = this._createGraphic(projectedPoint, position);
      // store graphic for event
      this._graphic = g;
      // set event
      var evt = {
        graphic: g,
        scale: scale,
        position: position
      };
      var animateOptions = {};
      // if updateScaleEnabled is enabled
      if (this.updateScaleEnabled) {
        animateOptions.scale = scale;
      }
      if (this.updateLocationEnabled) {
        animateOptions.center = projectedPoint;
        // center on point
        this.view.animateTo(animateOptions).then(function () {
          def.resolve(evt);
        }.bind(this), function (error) {
          if (!error) {
            error = new Error(this.declaredClass + "::Could not center.");
          }
          def.reject(error);
        }.bind(this));
      } else {
        def.resolve(evt);
      }
      return def.promise;
    },

    _setPosition: function (position) {
      var def = new Deferred();
      var error, g;
      this._clearCurrentLocationVars();
      // store position for event
      this._position = position;
      var pt = this._createPoint(position);
      if (pt) {
        // create graphic
        g = this._createGraphic(pt, position);
        // store graphic for event
        this._graphic = g;
      }
      // scale info
      var scale = this._getScale(position);
      // store scale for event
      this._scale = scale;
      if (pt) {
        // project point
        this._projectPoint(pt).then(function (projectedPoint) {
          this._animatePoint(projectedPoint, position, scale, g).then(def.resolve, def.reject);
        }.bind(this), function (error) {
          // projection error
          if (!error) {
            error = new Error(this.declaredClass + "::Error projecting point.");
          }
          def.reject(error);
        }.bind(this));
      } else {
        error = new Error(this.declaredClass + "::Invalid point");
        def.reject(error);
      }
      return def.promise;
    },

    _createGraphic: function (pt, position) {
      var g;
      if (pt) {
        // graphic attributes
        var attributes = {
          position: position
        };
        // graphic variable
        g = new Graphic({
          geometry: pt,
          symbol: this.get("locationSymbol"),
          attributes: attributes,
          popupTemplate: this.get("popupTemplate")
        });
      }
      return g;
    },

    _locateEvent: function (evt) {
      // event graphic
      if (evt.graphic) {
        var clone = Graphic.fromJSON(evt.graphic.toJSON());
        // get highlight graphic
        var g = this.get("highlightGraphic"),
          gl = this.get("graphicsLayer");
        // if graphic currently on map
        if (g && gl) {
          gl.remove(g);
        } 
        g = clone;
        // highlight enabled
        if (this.get("locationSymbolEnabled")) {
          if (gl) {
            gl.add(g);
          }
        }
        // set highlight graphic
        this.set("highlightGraphic", g);
      }
      // hide loading class
      this._hideLoading();
      // emit event
      this.emit("locate", evt);
    },

    _locateError: function (error) {
      // remove loading class
      this._hideLoading();
      // emit event error
      this.emit("locate", {
        graphic: this._graphic,
        scale: this._scale,
        position: this._position,
        error: error
      });
    },

    _showLoading: function () {
      if (!this.get("trackingEnabled")) {
        domClass.add(this._iconNode, this.css.loading);
      }
    },

    _hideLoading: function () {
      if (!this.get("trackingEnabled")) {
        domClass.remove(this._iconNode, this.css.loading);
      }
    }

  });

  return Locate;
});
