define(
[
  "dojo/_base/kernel",
  "../../core/declare",
  "dojo/_base/array",
  
  "dojo/io/script"
],
function(
  kernel, declare, array,
  script
 )  {

  /**************************
   * esri.layers._RenderMode
   **************************/
  
  var RenderMode = declare(null, {
    declaredClass: "esri.layers.support.RenderMode",
    
    constructor: function() {
      this._prefix = "jsonp_" + (kernel._scopeName || "dojo") + "IoScript";
    },
    
    initialize: function(map) {
      this.map = map;
      this._init = true;
    },
    
    startup: function() {},
    
    propertyChangeHandler: function(type) {
      /*
       * type = 0 denotes map time extent changed
       * type = 1 denotes layer definition expression changed
       * type = 2 denotes layer time definition changed
       */
    },
    
    destroy: function() {
      this._init = false;
    },
    
    drawFeature: function(feature) {},
    suspend: function() {},
    resume: function() {},
    refresh: function() {},
    
    _incRefCount: function(oid) {
      var found = this._featureMap[oid];
      if (found) {
        found._count++;
      }
    },
    
    _decRefCount: function(oid) {
      var found = this._featureMap[oid];
      if (found) {
        found._count--;
      }
    },
    
    _getFeature: function(oid) {
      return this._featureMap[oid];
    },
    
    _addFeatureIIf: function(oid, feature) {
      var fmap = this._featureMap, found = fmap[oid], layer = this.featureLayer; //, template = layer._infoTemplate;
      if (!found) {
        fmap[oid] = feature;
        /*if (template) {
          feature.setInfoTemplate(template);
        }*/
        layer._add(feature);
        feature._count = 0;
      }
      return found || feature;
    },
    
    _removeFeatureIIf: function(oid) {
      var found = this._featureMap[oid], layer = this.featureLayer;
      if (found) {
        if (found._count) {
          return;
        }
        delete this._featureMap[oid];
        layer._remove(found); 
      }
      return found;
    },
    
    _clearIIf: function() {
      var i, layer = this.featureLayer, graphics = layer.graphics, 
          selected = layer._selectedFeatures, oidField = layer.objectIdField;
          
      for (i = graphics.length - 1; i >= 0; i--) {
        var feature = graphics[i];
        var oid = feature.attributes[oidField];
        if (oid in selected) {
          feature._count = 1;
          continue;
        }
        feature._count = 0;
        this._removeFeatureIIf(oid);
      }
    },
    
    _isPending: function(id) {
      var dfd = script[this._prefix + id]; // see dojo.io.script._makeScriptDeferred
      return dfd ? true : false;
    },
    
    // Methods to make ETags useful
    _cancelPendingRequest: function(dfd, id) {
      dfd = dfd || script[this._prefix + id]; // see dojo.io.script._makeScriptDeferred
      if (dfd) {
        try {
          dfd.cancel(); // call ends up at dojo.io.script._deferredCancel
          script._validCheck(dfd);
          //console.info(dfd.startTime, dfd.canceled, dfd);
        }
        catch(e) {}
      }
    },
    
    _purgeRequests: function() {
      // The first argument is not used in this method
      
      // _validCheck in dojo/io/script is in-effective at Dojo 1.8.
      // deadScript array in dojo/io/script is not used at all
      script._validCheck(null);
    },
  
    _toggleVisibility: function(/*Boolean*/ show) {
      var layer = this.featureLayer, graphics = layer.graphics, 
          methodName = show ? "show" : "hide", i, len = graphics.length;
      
      show = show && layer._ager; // show morphs here
      for (i = 0; i < len; i++) {
        var graphic = graphics[i];
        graphic[methodName]();
        if (show) {
          layer._repaint(graphic);
        }
      }
    },
  
    _applyTimeFilter: function(silent) {
      // Display only features that belong in the intersection of
      // snapshot time definition and map time extent
      
      var layer = this.featureLayer;
      if (!layer.timeInfo || layer.suspended) {
        // layer is not time aware
        return;
      }
      
      if (!silent) {
        layer._fireUpdateStart();
      }
      
      // clear all the track lines
      var trackManager = layer._trackManager;
      if (trackManager) {
        trackManager.clearTracks();
      }
       
      var defn = layer.getTimeDefinition(), timeExtent = layer._getOffsettedTE(layer._mapTimeExtent);
      if (timeExtent) {
        timeExtent = layer._getTimeOverlap(defn, timeExtent);
        if (timeExtent) { // there is overlap, do filter
          //console.log("Snapshot Client Filter ", "query.timeExtent: ", timeExtent.startTime, ", ", timeExtent.endTime);
          var result = layer._filterByTime(layer.graphics, timeExtent.startTime, timeExtent.endTime);
      
          if (trackManager) {
            trackManager.addFeatures(result.match);
          }
          array.forEach(result.match, function(graphic) {
            var shape = graphic._shape;
            if (!graphic.visible) {
              graphic.show();
              shape = graphic._shape;
              shape && shape._moveToFront();
            }
            if (layer._ager && shape) {
              layer._repaint(graphic);
            }
          });
          
          array.forEach(result.noMatch, function(graphic) {
            if (graphic.visible) {
              graphic.hide();
            }
          });
        }
        else { // there is no overlap, so hide everything
          this._toggleVisibility(false);
        }
      }
      else { // map time extent is set to null
        if (trackManager) {
          trackManager.addFeatures(layer.graphics);
        }
        this._toggleVisibility(true);
      }
      
      // draw track lines corresponding to the observations
      if (trackManager) {
        trackManager.moveLatestToFront();
        trackManager.drawTracks();
      }
      
      if (!silent) {
        layer._fireUpdateEnd();
      }
    }
  });
  
  return RenderMode;  
});
