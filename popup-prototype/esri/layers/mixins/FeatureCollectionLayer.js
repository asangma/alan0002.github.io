define(
[
  "../../core/declare",
  "dojo/_base/lang",
  "dojo/_base/array",
  "dojo/dom-construct",
  "dojo/dom-style",
  
  "../../geometry/SpatialReference",
  "../../geometry/Extent",
  "../../geometry/support/webMercatorUtils",
  
  "../../renderers/SimpleRenderer",
  
  "../../PopupTemplate",
  
  "../FeatureLayer",
  
  "../Layer"
],
function(
  declare, lang, array, domConstruct, domStyle,
  SpatialReference, Extent, webMercatorUtils, 
  SimpleRenderer,
  PopupTemplate,
  FeatureLayer,
  Layer
) {

/*dojo.require("esri.utils");
dojo.require("esri.layers.layer");
dojo.require("esri.layers.FeatureLayer");
dojo.require("esri.widgets.Popup");
dojo.require("esri.renderer");*/

var FeatureCollectionLayer = declare([Layer], {
  declaredClass: "esri.layers.mixins.FeatureCollectionLayer",

  constructor: function (url, options) {

    this.pointSymbol = options && options.pointSymbol;
    this.polylineSymbol = options && options.polylineSymbol;
    this.polygonSymbol = options && options.polygonSymbol;

    this._outSR = (options && (options.outSpatialReference || options.outSR)) || new SpatialReference({ wkid: 4326 });
    this._options = lang.mixin({}, options);
  },

  /*****************
   * Public Methods
   *****************/   
     
  //parse should always return a deferred,
  //so that _createLayer can add callback to it.
  parse: function () {/*override it when implementing specific operations*/
    console.error("parse function has not been implemented");
  },

  getFeatureLayers: function () {
    var retVal = [];

    if (this._fLayers) {
      retVal = retVal.concat(this._fLayers);
    }

    return retVal;
  },

  onRefresh: function () {},
  onOpacityChange: function () {},

  refresh: function () {
    // If the layer has not loaded yet or if it has not 
    // been added to the map yet, or if the layer is in the
    // middle of a refresh cycle
    if (!this.loaded || !this._map || this._io || !this.visible) {
      return;
    }

    // fetch the associated file
    this._createLayer();
  },

  /*******************
   * Internal Methods
   *******************/

  _createLayer: function(params){
    var self = this;
    this._fireUpdateStart();
    var deferred = this.parse(params);
    deferred.then(function (response) {
        self._io = null;

        self._initLayer(response);
      });
    deferred.then(null, function (err) {
        self._io = null;

        err = lang.mixin(new Error(), err);
        err.message = "Unable to load resource: " + self.url + " " + (err.message || "");

        //console.error("Error: ", err);
        self._fireUpdateEnd(err);
        self.onError(err);
      });
  },

  _initLayer: function (json) {

    // Are we here on layer refresh?
    if (this.loaded) {
      // clear current state of this layer
      this._removeInternalLayers();

      // go on and (re)init this layer with latest contents of the file
    }

    // It assumes all classes inherited from this class may have the following properties by default.
    this.name = json.name;
    this.description = json.description;
    this.snippet = json.snippet;
    if (json.visibility !== undefined) {
      this.defaultVisibility = this.visible = !!json.visibility;
    }
    else {
      this.defaultVisibility = this.visible = true;
    }
    this.featureInfos = json.featureInfos;
    this.fullExtent = this.initialExtent = Extent.fromJSON(json.lookAtExtent);
    this.copyright = json.author || json.copyright;

    var options;

    // Create internal feature layers.
    var collectionLayers = lang.getObject("featureCollection.layers", false, json);

    if (collectionLayers && collectionLayers.length > 0) {
      this._fLayers = [];

      array.forEach(collectionLayers, function (layerSpec, i) {
        var features = lang.getObject("featureSet.features", false, layerSpec),
          layer;

        if (features && features.length > 0) {
          options = lang.mixin({
            outFields: ["*"],
            popupTemplate: layerSpec.popupInfo ? new PopupTemplate(layerSpec.popupInfo) : null,
            editable: false
          }, this._options);

          if (options.id) {
            options.id = options.id + "_" + i;
          }

          layerSpec.layerDefinition.capabilities = "Query,Data";
          layer = new FeatureLayer(layerSpec, options);

          // For convenience. Used in getFeature method
          if (layer.geometryType) {
            this["_" + layer.geometryType] = layer;
          }

          this._fLayers.push(layer);
        }
      }, this);

      if (this._fLayers.length === 0) {
        delete this._fLayers;
      }
    }
    
    //Set the renderer and merge all graphics together.
    this.items = [];
    if (this._esriGeometryPoint) {
      this.items = this.items.concat(this._esriGeometryPoint.graphics);
      if (this.pointSymbol) {
        var pointRenderer = new SimpleRenderer(this.pointSymbol);
        this._esriGeometryPoint.setRenderer(pointRenderer);
      }
    }
    if (this._esriGeometryPolyline) {
      this.items = this.items.concat(this._esriGeometryPolyline.graphics);
      if (this.polylineSymbol) {
        var polylineRenderer = new SimpleRenderer(this.polylineSymbol);
        this._esriGeometryPolyline.setRenderer(polylineRenderer);
      }
    }
    if (this._esriGeometryPolygon) {
      this.items = this.items.concat(this._esriGeometryPolygon.graphics);
      if (this.polygonSymbol) {
        var polygonRenderer = new SimpleRenderer(this.polygonSymbol);
        this._esriGeometryPolygon.setRenderer(polygonRenderer);
      }
    }

    // Do not add the above layers to map until this layer itself
    // is added to the map. See _setMap method below.    

    this._fireUpdateEnd();

    if (this.loaded) {
      this._addInternalLayers();
      this.onRefresh();
    }
  },

  _addInternalLayers: function () {
    var map = this._map;

    this._fireUpdateStart();

    var mapSR = map.spatialReference,
      outSR = this._outSR,
      match;

    // Check if mapSR and outSR match
    if (mapSR.wkid) {
      match = (mapSR.isWebMercator() && outSR.isWebMercator()) || (mapSR.wkid === outSR.wkid);
    } else if (mapSR.wkt) {
      match = (mapSR.wkt === outSR.wkt);
    } else {
      console.log("_setMap - map has invalid spatial reference");
      return;
    }

    // if they don't match, convert them on the client if possible
    if (!match) {
      if (mapSR.isWebMercator() && outSR.wkid === 4326) {
        this._converter = webMercatorUtils.geographicToWebMercator;
      } else if (outSR.isWebMercator() && mapSR.wkid === 4326) {
        this._converter = webMercatorUtils.webMercatorToGeographic;
      } else {
        // TODO
        // How do we handle the case where map.sr is NOT 4326 and NOT 102100?
        // Make geometry service calls.
        console.log("_setMap - unsupported workflow. Spatial reference of the map and layer do not match, and the conversion cannot be done on the client.");
        return;
      }
    }

    // Add feature layers to the map
    var featureLayers = this._fLayers;
    if (featureLayers && featureLayers.length > 0) {
      array.forEach(featureLayers, function (layer) {
        if (this._converter) {
          var graphics = layer.graphics,
            i, geom,
            len = graphics ? graphics.length : 0;

          for (i = 0; i < len; i++) {
            geom = graphics[i].geometry;
            if (geom) {
              graphics[i].setGeometry(this._converter(geom));
            }
          }
        }

        map.addLayer(layer);
      }, this);
    }

    //don't call onVisibilityChange directly,
    //it will bypass legend dijit and makes the legend disappear.
    //this.onVisibilityChange(this.visible);
    this.setVisibility(this.visible);
    
    this._fireUpdateEnd();
  },

  _removeInternalLayers: function () {
    var map = this._map;

    if (map) {
      array.forEach(this.getFeatureLayers(), map.removeLayer, map);
    }
  },

  /************
   * Layer API
   ************/

  setScaleRange: function(minScale, maxScale) {
    this.inherited(arguments);

    array.forEach(this.getFeatureLayers(), function(featureLayer) {
      featureLayer.setScaleRange(minScale, maxScale);
    });

    // for refresh
    this._options.minScale = this.minScale;
    this._options.maxScale = this.maxScale;
  },

  setOpacity: function(/*double*/ op) {
    if (this.opacity != op) {
      array.forEach(this.getFeatureLayers(), function(featureLayer) {
        featureLayer.setOpacity(op);
      });
      this._options.opacity = op; // for refresh
      this.opacity = op;
      this.onOpacityChange(op);
    }
  },

  onVisibilityChange: function(isVisible) {
    this._fireUpdateStart();

    array.forEach(this.getFeatureLayers(), function(featureLayer){
      featureLayer.setVisibility(isVisible);
    });

    this._fireUpdateEnd();
  },

  _setMap: function (map, container) {
    // Map will call this method after the layer has loaded
    this.inherited(arguments);
    //console.log("_setMap");
    this._map = map;

    // TODO
    // This div is just a placeholder. Do we need it?
    // If not, map should tolerate its absence i.e, this method should
    // be able to return null value to the map
    var div = this._div = domConstruct.create("div", null, container);
    domStyle.set(div, "position", "absolute");
    
    this._addInternalLayers();
    
    this.evaluateSuspension();
    
    return div;
  },

  _unsetMap: function (map, container) {
    //console.log("_unsetMap");
    if (this._io) {
      this._io.cancel();
    }
    this._extChgHandle.remove();
    delete this._extChgHandle;

    //dojo.forEach(this.getLayers(), map.removeLayer, map);
    this._removeInternalLayers();

    // Detach and destroy the DOM structure
    var div = this._div;
    if (div) {
      container.removeChild(div);
      domConstruct.destroy(div);
    }

    // Release objects
    //this._map = this._div = null;
    //this._map has been released in the super class.
    this._div = null;
    this.inherited(arguments);
  }
});

return FeatureCollectionLayer;  
});
