/* jshint laxcomma: true */
define(
[
  "../../core/declare",
  "dojo/_base/lang",
  "dojo/_base/array",
  "dojo/_base/Color",

  "../../Graphic",

  "../../geometry/Point",
  "../../geometry/support/jsonUtils",
  "../../geometry/support/mathUtils",
  "../../geometry/support/webMercatorUtils",

  "../../symbols/SimpleMarkerSymbol",
  "../../symbols/SimpleLineSymbol",
  "../../symbols/CartographicLineSymbol",
  "../../symbols/SimpleFillSymbol",

  "../../tasks/support/Query",

  "../../core/Evented"

  //>>excludeStart("pragmaA", kwArgs.buildType == "tiny")
  ,
  "dojo/has!extend-esri?./PopupInfo"
  //>>excludeEnd("pragmaA")
],
function(
  declare, lang, array, Color,
  Graphic, Point, jsonUtils, mathUtils, webMercatorUtils,
  SimpleMarkerSymbol, SimpleLineSymbol, CartographicLineSymbol, SimpleFillSymbol,
  Query,
  esriEvented
) {

/*****************
 * esri.PopupBase
 *****************/

function sizeInfoFinder(visVariable) {
  return (visVariable.type === "sizeInfo");
}

var PopupBase = declare(esriEvented, {
  declaredClass: "esri.PopupBase",

  _featureLayers: {}, // map of FeatureLayers being watched for update-end
  _updateEndHandles: [],

  /****************************
   * Properties:
   *   Graphic[] features
   *  Promise[] promises
   *      Number count
   *      Number selectedIndex
   *      Symbol markerSymbol
   *      Symbol lineSymbol
   *      Symbol fillSymbol
   */
  
  /*********
   * Events
   *********/

  _evtMap: {
    "set-features": true,
    "clear-features": true,
    "selection-change": true,
    "dfd-complete": true
  },
  
  emitSetFeatures: function() {
    this.emit("set-features");
    //console.log("set-features");
  },

  emitSelectionChange: function() {
    this.emit("selection-change");
    //console.log("selection-change");
  },

  /*****************
   * Public Methods
   *****************/

  initialize: function() {
    //console.log("initialize");
    this.count = 0;
    this.selectedIndex = -1;

    this.on("clear-features", lang.hitch(this, this._resetUpdateEndListeners));
    this.on("dfd-complete", lang.hitch(this, this._processFeatures));
    this.on("set-features", lang.hitch(this, this._processFeatures));
  },
  
  cleanup: function() {
    this.features = this.promises = null;
    this._resetUpdateEndListeners();
  },
  
  setFeatures: function(/*Graphic[] or Deferred[]*/ arg) {
    if (!arg || !arg.length) {
      return;
    }
    
    // TODO
    // If some features in the input are already
    // being viewed in the popup, retain them. But
    // how does it work for promises?? Should we
    // retain the old features so that I can compare
    // when promises finish?
    
    this.clearFeatures();

    // classify
    var features, promises;
    if (arg[0] && typeof arg[0].then === "function") {
      promises = arg;
    }
    else {
      features = arg; 
    }

    //this.show();
    
    // process
    if (features) {
      this._updateFeatures(null, features);
    }
    else {
      this.promises = promises;
      
      // When selecting features in a feature collection, where
      // query operation is performed on the client, _updateFeatures
      // executes within the call to addCallback which ends up 
      // modifying the promises array and causing confusion in the
      // loop below by corrupting the positional index of promises
      // in the array. Let's create a new array and avoid this problem.
      promises = promises.slice(0);
      
      array.forEach(promises, function(dfd) {
        dfd.always(lang.hitch(this, this._updateFeatures, dfd));
      }, this);
    }
    
    //dojo.removeClass(this._actionList, "hidden");
  },
  
  clearFeatures: function() {
    //this.setTitle("&nbsp;");
    //this.setContent("&nbsp;");
    //this._setPagerCallbacks(this);
    //dojo.addClass(this._actionList, "hidden");

    this.features = this.promises = this._marked = null;
    this.count = 0;

    var beforePtr = this.selectedIndex;
    this.selectedIndex = -1;

    if (beforePtr > -1) {
      this.emitSelectionChange();
    }
    this.emit("clear-features");
  },
  
  /**************************************
   * Methods to manage feature selection
   **************************************/
  
  getSelectedFeature: function() {
    var features = this.features;
    if (features) {
      return features[this.selectedIndex];
    }
  },
  
  select: function(index) {
    if (index < 0 || index >= this.count) {
      return;
    }
    
    this.selectedIndex = index;
    this.emitSelectionChange();
  },
  
  /************************************************
   * Helper methods to manage feature highlighting
   ************************************************/
  
  enableHighlight: function(map) {
    this._highlighted = map.graphics.add(new Graphic(new Point(0, 0, map.spatialReference)));
    this._highlighted.hide();
    
    //var ESYM = esri.symbol;
    if (!this.markerSymbol) {
      var symbol = (this.markerSymbol = new SimpleMarkerSymbol());
      symbol.setStyle(SimpleMarkerSymbol.STYLE_TARGET);
      symbol._setDim(16, 16, 0);
      
      /*symbol.setOutline(new esri.symbol.SimpleLineSymbol(
        esri.symbol.SimpleLineSymbol.STYLE_SOLID,
        new dojo.Color([0, 255, 255]),
        2
      ));*/
     
      symbol.setOutline(new CartographicLineSymbol(
        SimpleLineSymbol.STYLE_SOLID,
        new Color([0, 255, 255]),
        2,
        CartographicLineSymbol.CAP_ROUND,
        CartographicLineSymbol.JOIN_ROUND
      ));
      
      symbol.setColor(new Color([0, 0, 0, 0]));
    }
    
    if (!this.lineSymbol) {
      this.lineSymbol = new SimpleLineSymbol(
        SimpleLineSymbol.STYLE_SOLID,
        new Color([0, 255, 255]),
        2
      );
    }
    
    if (!this.fillSymbol) {
      this.fillSymbol = new SimpleFillSymbol(
        SimpleFillSymbol.STYLE_NULL,
        new SimpleLineSymbol(
          SimpleLineSymbol.STYLE_SOLID,
          new Color([0, 255, 255]),
          2
        ),
        new Color([0, 0, 0, 0])
      );
    }
  },
  
  disableHighlight: function(map) {
    var highlighted = this._highlighted;
    if (highlighted) {
      highlighted.hide();
      map.graphics.remove(highlighted);
      delete this._highlighted;
    }
    
    this.markerSymbol = this.lineSymbol = this.fillSymbol = null;
  },
  
  showHighlight: function() {
    var feature = this.features && this.features[this.selectedIndex];
    
    if (this._highlighted && feature && feature.geometry) {
      this._highlighted.show();
    }
  },
  
  hideHighlight: function() {
    if (this._highlighted) {
      this._highlighted.hide();
    }
  },
  
  updateHighlight: function(map, feature) {
    var geometry = feature.geometry, highlighted = this._highlighted;
    
    if (!geometry || !highlighted) {
      if (highlighted) {
        highlighted.hide();
      }
      
      return;
    }

    highlighted.hide();
    
    // Re-add the graphic in case app accidentally cleared out map.graphics
    if (!highlighted._graphicsLayer && map) {
      map.graphics.add(highlighted);
    }
    
    highlighted.setGeometry(jsonUtils.fromJSON(geometry.toJSON()));
    
    var symbol;
    switch(geometry.type) {
      case "point":
      case "multipoint":
        symbol = this.markerSymbol;
        
        symbol.setOffset(0, 0);
        symbol.setAngle(0);

        var lyr = feature.getLayer();
        if (lyr) {
          var realSymbol = lyr._getSymbol(feature),
              width, height, xoff = 0, yoff = 0, angle = 0,
              renderer;
              
          if (realSymbol) {
            renderer = !feature.symbol ? lyr._getRenderer(feature) : null;
            
            // Read symbol size from renderer or from feature's own symbol
            var sizeInfo = this._getSizeInfo(renderer);
            
            if (sizeInfo) {
              width = height = renderer.getSize(feature, {
                sizeInfo: sizeInfo,
                shape: realSymbol.style,
                resolution: map && map.getResolutionInMeters && map.getResolutionInMeters()
              });
            }
            else {
              switch(realSymbol.type) {
                case "simplemarkersymbol":
                  width = height = (realSymbol.size || 0);
                  break;
                case "picturemarkersymbol":
                  width = (realSymbol.width || 0);
                  height = (realSymbol.height || 0);
                  break;
              }
            }
            
            xoff = realSymbol.xoffset || 0;
            yoff = realSymbol.yoffset || 0;
            angle = realSymbol.angle || 0;
          }
          
          if (width && height) {
            //console.log("Inferred width and height = ", (width + 1), (height + 1));
            symbol._setDim(width + 1, height + 1, 0);
          }
          
          symbol.setOffset(xoff, yoff);
          symbol.setAngle(angle);
        }
        break;
        
      case "polyline":
        symbol = this.lineSymbol;
        break;
        
      case "polygon":
        symbol = this.fillSymbol;
        break;
    }
    
    highlighted.setSymbol(symbol);
  },
  
  showClosestFirst: function(location) {
    var features = this.features;
    
    if (features && features.length) {
      if (features.length > 1) {
        //console.log("_moveClosestToFront processing...");
        
        var i, minDistance = Infinity, closestIdx = -1, geom,
            getLength = mathUtils.getLength, distance,
            locSR = location.spatialReference,
            geomSR, target;
        
        location = location.normalize();

        for (i = features.length - 1; i >= 0; i--) {
          geom = features[i].geometry;
          if (!geom) {
            continue;
          }
          
          geomSR = geom.spatialReference;
          distance = 0;
          
          try {
            target = (geom.type === "point") ? geom : geom.get("extent").get("center");
            target = target.normalize();
            
            //console.log("loc sr: ", locSR.wkid);
            //console.log("geom sr: ", geom.type, geomSR.wkid);
            
            if (locSR && geomSR && !locSR.equals(geomSR) && locSR._canProject(geomSR)) {
              target = locSR.isWebMercator() ?
                          webMercatorUtils.geographicToWebMercator(target) :
                          webMercatorUtils.webMercatorToGeographic(target);
            }

            distance = getLength(location, target);
            //console.log("distance = ", distance);
          }
          catch(ignore) {
            // We'll silently ignore this exceptions since "moveClosestToFront" 
            // is not a critical operation
          }
          
          //console.log("distance = ", distance, i);
          if (distance > 0 && distance < minDistance) {
            minDistance = distance;
            closestIdx = i;
          }
        }
        
        if (closestIdx > 0) {
          //console.log("closest = ", closestIdx);
          features.splice( 0, 0, features.splice(closestIdx, 1)[0] );
          this.select(0);
        }
      }
    }
    else if (this.promises) {
      //console.log("marking....");
      this._marked = location;
    }
  },
  
  /*******************
   * Internal Methods
   *******************/
  
  _unbind: function(dfd) {
    var index = array.indexOf(this.promises, dfd);
    if (index === -1) {
      return; // dfd not found
    }
    
    this.promises.splice(index, 1);
    if (!this.promises.length) {
      this.promises = null;
      return 2; // indicates we received results from all expected promises
    }
    
    return 1; // dfd found and removed
  },
  
  _fireComplete: function(features) {
    var location = this._marked;
    if (location) {
      //console.log("=== enter ===");
      this._marked = null;
      this.showClosestFirst(location);
      //console.log("=== exit ===");
    }

    if (features) {
      this.emit("dfd-complete", {
        features: features
      });
    }
    else{
      this.emit("dfd-complete");
    }

  },
  
  _updateFeatures: function(dfd, features) {
    //console.log("REGISTER: ", arguments);
    
    if (dfd) {
      if (this.promises) {
        var res = this._unbind(dfd);
        if (!res) {
          // dfd not in the current working set
          //console.log("Ignoring dfd...");
          return;
        }

        if (features && features instanceof Error) {
          // discard err-ed out dfd
          //console.log("Error case: ", features);
          
          this._fireComplete(features);
          if (res === 2) {
            this.emitSetFeatures();
          }
          return;
        }
        
        if (features && features.length) {
          if (!this.features) {
            this.features = features;
            this.count = features.length;
            this.selectedIndex = 0;
            
            this._fireComplete();
            if (res === 2) {
              this.emitSetFeatures();
            }
            this.select(0);
          }
          else {
            //this.features = this.features.concat(features);

            // TODO
            // TEST
            // Verify that duplicate features are ignored
            
            var filtered = array.filter(features, function(feature) {
              return array.indexOf(this.features, feature) === -1;
            }, this);
            
            this.features = this.features.concat(filtered);
            this.count = this.features.length;
            
            this._fireComplete();
            if (res === 2) {
              this.emitSetFeatures();
            }
          }
        }
        else {
          this._fireComplete();
          if (res === 2) {
            this.emitSetFeatures();
          }
        }
      }
    }
    else {
      this.features = features;
      this.count = features.length;
      this.selectedIndex = 0;
      
      this.emitSetFeatures();
      this.select(0);
    }
  },
  
  _getSizeInfo: function(renderer) {
    // Returns "sizeInfo" or a visual variable with type="sizeInfo"
    return renderer 
      ? (
        renderer.sizeInfo || 
        
        // Just use the first size variable defined in visual variables.
        array.filter(renderer.visualVariables, sizeInfoFinder)[0]
      ) 
      : null;
  },

  _resetUpdateEndListeners: function() {
    this._featureLayers = {};
    array.forEach(this._updateEndHandles, function(handle) {
      handle.remove();
    });
    this._updateEndHandles = [];
  },

  _processFeatures: function() {
    // add update-end event listeners
    array.forEach(this.features, function(feature) {
      var layer = feature.layer;
      if (layer && !this._featureLayers[layer.id] &&
          layer.currentMode === 1 /* MODE_ONDEMAND */ &&
          layer.objectIdField &&
          layer.hasXYFootprint &&
          layer.queryFeatures &&
          (layer.geometryType === "esriGeometryPolygon" ||
              layer.geometryType === "esriGeometryPolyline" ||
              layer.hasXYFootprint())) {
        this._featureLayers[layer.id] = layer;
        var handle = layer.on("update-end", lang.hitch(this, this._fLyrUpdateEndHandler));
        this._updateEndHandles.push(handle);
      }
    }, this);
  },

  _fLyrUpdateEndHandler: function(event) {
    if (event.error) {
      return;
    }

    var self = this,
        fLyr = event.target,
        graphics = {},
        objectIds = [];

    // collect graphics and objectIds for the features from this layer
    array.forEach(this.features, function(feature) {
      var layer = feature.getLayer();
      if (layer === fLyr) {
        var oid = feature.attributes[fLyr.objectIdField];
        graphics[oid] = feature;
        objectIds.push(oid);
      }
    });

    if (objectIds.length) {
      // query for the new features
      var query = new Query();
      query.objectIds = objectIds;
      fLyr.queryFeatures(query, function(fSet) {
        array.forEach(fSet.features, function(feature) {
          var oid = feature.attributes[fLyr.objectIdField];
          var graphic = graphics[oid];
          if (graphic.geometry !== feature.geometry) {
            // update with the new geometry
            graphic.setGeometry(feature.geometry);
            if (this._highlighted && graphic === this.getSelectedFeature()) {
              this._highlighted.setGeometry(feature.geometry);
            }
          }
        }, self);
      });
    }
  }
});



return PopupBase;  
});
