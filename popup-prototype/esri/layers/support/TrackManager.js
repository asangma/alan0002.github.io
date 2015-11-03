define(
[
  "../../core/declare",
  "dojo/_base/array",
  
  "../../Graphic",
  "../../geometry/Polyline",
  "../GraphicsLayer"
],
function(
  declare, array,
  Graphic, Polyline, GraphicsLayer
) {

  /****************************
   * esri.layers._TrackManager
   ****************************/
  
  var TrackManager = declare(null, {
    declaredClass: "esri.layers.TrackManager",
    
    constructor: function(layer) {
      this.layer = layer;
      this.trackMap = {};
      this.trackLineMap = {};
    },
    
    initialize: function(map) {
      this.map = map;
      
      var layer = this.layer, 
          renderer = layer._getRenderer(),
          trackRenderer = renderer && renderer.trackRenderer;
      
      if (layer.geometryType === "esriGeometryPoint") {
        // TODO
        // Investigate the feasibility of doing this using a 
        // GroupElement or GroupGraphic that can be added to 
        // a graphics layer
        
        var container = (this.container = new GraphicsLayer._GraphicsLayer({ 
          id: layer.id + "_tracks",
          _child: true 
        }));
        
        container.loaded = true;
        container.onLoad(container);
        
        //container._onPanHandler = function() {}; // we don't want "translate" applied twice on pan
        container._setMap(map, layer._div);
        container.setRenderer(trackRenderer);
      }
    },
    
    /*
     * Add features to this.trackMap. For each trackId found in features:
     *   - sort the features by time
     */
    addFeatures: function(features) {
      var trackMap = this.trackMap,
        layer = this.layer,
        tkidField = layer._trackIdField,
        affectedTracks = [];

      // create a list of all the tracks and their corresponding features
      //add features to arrays of features in trackMap and store the trackIds
      array.forEach(features, function(feature) {
        var attributes = feature.attributes,
          tkid = attributes[tkidField],
          ary = (trackMap[tkid] = (trackMap[tkid] || []));
        ary.push(feature);

        if (array.indexOf(affectedTracks, tkid) === -1){
          affectedTracks.push(tkid);
        }
      });

      // sort features in each track from oldest to newest. Only sort the tracks that had features added to them
      var timeField = layer._startTimeField, oidField = layer.objectIdField,
          sorter = function(a, b) {
            var time1 = a.attributes[timeField], time2 = b.attributes[timeField];
            if (time1 === time2) {
              // See:
              // http://code.google.com/p/v8/issues/detail?id=324
              // http://code.google.com/p/v8/issues/detail?id=90
              return (a.attributes[oidField] < b.attributes[oidField]) ? -1 : 1;
            }
            else {
              return (time1 < time2) ? -1 : 1;
            }
          };

      //sort each track
      array.forEach(affectedTracks, function(id){
        trackMap[id].sort(sorter);
      });
    },

    /*
     * Removes the older features of a track if maximumTrackPoints exceeded (used by StreamLayer)
     *   Returns an array of features removed as a result of maximumTrackPoints exceeded.
     *   This is used by StreamLayer to remove features.
     */
    trimTracks: function(trackids){
      var trackMap = this.trackMap,
        layer = this.layer,
        maxTrackPoints = layer.maximumTrackPoints || 0,
        removedFeatures = [],
        tkid;

      /*
       * Inner function: Trims excess features and adds them to array of trimmed features
       */
      function trim(id){
        var ary = trackMap[id] || [];
        while (ary.length > maxTrackPoints){
          removedFeatures.push(ary.shift());
        }
      } //end inner function
      
      if (! maxTrackPoints){
        return removedFeatures;
      }
      
      //process all trackIds or just ones passed in
      if (trackids){
        array.forEach(trackids, function(id){
          trim(id);
        });
      }
      else{
        for (tkid in trackMap){
          if (trackMap.hasOwnProperty(tkid)){
            trim(tkid);
          }
        }
      }
      return removedFeatures;
    },

    /*
     * Draw lines to connect points in track
     */
    drawTracks: function(trackids) {
      var self = this,
        container = this.container,
        trackMap,
        sr,
        tkidField,
        tkid;

      if (!container) {
        return;
      }

      trackMap = this.trackMap;
      sr = this.map.spatialReference;
      tkidField = this.layer._trackIdField;

      /*
       * Inner function: Makes polyline from points of track and adds it track line graphics layer.
       *   Also adds graphic to this.trackLineMap
       */
      function add_track(id){
        var ptarray = trackMap[id],
          i,
          path,
          point,
          attrs,
          linegraphic;

        //remove old line graphic
        linegraphic = self.trackLineMap[id];
        container.remove(linegraphic);
        delete self.trackLineMap[id];
        linegraphic = null;

        //make new line graphic
        if (! ptarray || ptarray.length < 2){
          return false;
        }

        path = [];
        for (i = ptarray.length - 1; i >=0 ; i--) {
          point = ptarray[i].geometry;

          if (point) {
            path.push([ point.x, point.y ]);
          }
        }

        attrs = {};
        attrs[tkidField] = id;

        //add graphic to layer and reference it in this.trackLineMap
        if (path.length > 1) {
          linegraphic = new Graphic(
            new Polyline({ paths: [path], spatialReference: sr }),
            null,
            attrs
          );
          container.add(linegraphic);
          self.trackLineMap[id] = linegraphic;
        }
      } //end of inner function

      // draw track lines - use trackids array or all ids
      if (trackids){
        array.forEach(trackids, function(id){
          add_track(id);
        });
      }
      else{
        for (tkid in trackMap){
          if (trackMap.hasOwnProperty(tkid)){
            add_track(tkid);
          }
        }
      }
    },
    
    /*
     * For each trackid in trackids array
     *   - refreshes line connecting track points
     *   - repaints features in track
     */
    refreshTracks: function(trackids){
      var self = this,
        trackMap = this.trackMap,
        layer = this.layer,
        renderer = layer._getRenderer(),
        tkid;

      //Inner function: does actual refresh
      function doRefresh(id){
        var ptarray,
          len,
          f;

        self.drawTracks([id]);

        //no need to redraw points if renderer does not have latestObservationRenderer
        if (renderer && renderer.latestObservationRenderer){
          ptarray = trackMap[id] || [];
          len = ptarray.length;
          for (f = 0; f < len; f++){
            layer._repaint(ptarray[f], null, true);
          }
        }
      } //end of inner function

      if (! trackids){
        for (tkid in trackMap){
          if (trackMap.hasOwnProperty(tkid)){
            doRefresh(tkid);
          }
        }
      }
      else{
        array.forEach(trackids, function(id){
          doRefresh(id);
        });
      }

      this.moveLatestToFront();
    },

    /*
     * Redraws the most recent feature for a track so it is on top of others
     */
    moveLatestToFront: function(trackids) {
      array.forEach(this.getLatestObservations(trackids), function(graphic) {
        var shape = graphic._shape;
        if (shape){
          shape._moveToFront();
        }
        this._repaint(graphic, null, true);
      }, this.layer);
    },
    
    /*
     * Gets the most recent feature for a track
     */
    getLatestObservations: function(trackids) {
      var retVal = [],
          renderer = this.layer._getRenderer(),
          trackMap = this.trackMap,
          tkid;

      if (!renderer.latestObservationRenderer) {
        return retVal;
      }

      //Inner function: get the most recent feature for a trackid
      function get_latest_trackpoint(id){
        var ary = trackMap[id];
        return ary[ary.length - 1];
      } //end of inner function

      //loop through specified trackids or all trackids
      if(trackids){
        array.forEach(trackids, function(id){
          retVal.push(get_latest_trackpoint(id));
        });
      }
      else{
        for (tkid in trackMap) {
          if (trackMap.hasOwnProperty(tkid)){
            retVal.push(get_latest_trackpoint(tkid));
          }
        }
      }

      return retVal;
    },
    
    /*
     * Removes the features associated with the trackids from the trackMap object
     *  and removes the line graphic connecting the features if they are points
     */
    clearTracks: function(trackids) {
      var latest = this.getLatestObservations(trackids),
        container = this.container,
        linegraphic;

      //clear all tracks if no trackids specified as parameter
      if (! trackids){
        this.trackMap = {};
        this.trackLineMap = {};
        if (container) {
          container.clear();
        }
      }
      else{
        /*
         * Loop through specified trackids and delete point array from this.trackMap, 
         *   line graphic from layer and from this.trackLineMap
         */
        array.forEach(trackids, function(id){
          delete this.trackMap[id];
          if (container){
            linegraphic = this.trackLineMap[id];
            container.remove(linegraphic);
            delete this.trackLineMap[id];
          }
        }, this);
      }

      array.forEach(latest, function(graphic) {
        this._repaint(graphic, null, true);
      }, this.layer);
    },
    
    isLatestObservation: function(feature) {
      var tkidField = this.layer._trackIdField,
          track = this.trackMap[feature.attributes[tkidField]];
      
      if (track) {
        return (track[track.length - 1] === feature); 
      }
      return false;
    },
    
    destroy: function() {
      var container = this.container;
      
      if (container) {
        container.clear();
        container._unsetMap(this.map, this.layer._div);
      }
      
      this.map = this.layer = this.trackMap = this.container = null;
    }
  });
  
  return TrackManager;  
});
