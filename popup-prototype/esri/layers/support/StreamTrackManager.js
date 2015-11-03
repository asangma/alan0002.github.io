define(
[
  "../../core/declare",
  "dojo/_base/array",
  
  "../../Graphic",
  "../../geometry/Polyline",
  
  "./TrackManager"
],
function(
  declare, array,
  Graphic, Polyline,
  TrackManager
) {

  /****************************
   * esri.layers._StreamTrackManager
   ****************************/

  var StreamTrackManager = declare([TrackManager], {
  
    declaredClass: "esri.layers.StreamTrackManager",

    constructor: function(layer){
      /*
       * Inherited method sets:
       *    - this.layer: Feature Layer associated with this
       *    - this.trackMap: key/value object. Arrays of graphics keyed by trackId
       *    - this.trackLineMap: key value object. Line graphic keyed by trackId
       */
      //console.log("Constructor");
      //this.layer = layer;
      //this.trackMap = {};
      //this.trackLineMap = {};
      this.inherited(arguments);
    },

    initialize: function(map){
      /*
       * Inherited method sets:
       *    - this.map
       *    - this.container: Graphics layer that holds track lines
       */
      //console.log("Initializing");
      this.inherited(arguments);
    },

    /*****************************************
     *
     * Overrides
     *
     *****************************************/

    /*
     * Add the features to this.trackMap. By default, the features are not sorted by time.
     *
     * Returns an object with trackId as key and array of removed features as the value.
     *   Features are removed if the length of the track exceeds layer.maximumTrackPoints.
     *   The ids can be used when calling refreshTracks method.
     */
    addFeatures: function(features, doSort){
      var trackmap,
        layer,
        trackidfield,
        maxtrackpoints,
        affectedtracks = {},
        addmap = {},
        affectedfeatures,
        affectedid;

      //if doSort is true, call inherited method since it sorts
      if (doSort){
        this.inherited(arguments);
        return affectedtracks;
      }

      trackmap = this.trackMap;
      layer = this.layer;
      trackidfield = layer._trackIdField;
      maxtrackpoints = layer.maximumTrackPoints || 0;

      /*
       * Add each feature to a key value object. Key is trackId. Value is array of features in the track
       */
      array.forEach(features, function(feature) {
        var attributes = feature.attributes,
          tkid = attributes[trackidfield];

        if (feature.visible){
          if (! addmap[tkid]){
            addmap[tkid] = [];
          }
          addmap[tkid].push(feature);
        }
      });

      /*
       * Inner function: trim tracks if needed and add features to master track dictionary.
       *   - tid: trackId
       *   - featurearray: features to add
       *   - returns: array of features trimmed from track
       */
      function addAndTrim(tid, featurearray){
        var arycurr,
          delfeats,
          addfeats,
          total,
          i;

        if (! trackmap[tid]){
          trackmap[tid] = [];
        }
        arycurr = trackmap[tid];

        //Don't bother checking and trimming if maxtrackpoints is 0. Just add them all.
        if (maxtrackpoints > 0){
          if (featurearray.length > maxtrackpoints){
            //console.log("Had to trim before adding");
            featurearray.splice(0, featurearray.length - maxtrackpoints);
          }

          total = featurearray.length + arycurr.length;
          if (total > maxtrackpoints){
            delfeats = arycurr.splice(0, total - maxtrackpoints);
          }
        }

        addfeats = featurearray;
        total = featurearray.length;
        for (i = 0; i < total; i += 1){
          arycurr.push(featurearray[i]);
        }
        //console.log("Returning affected features");
        return {deletes: delfeats, adds: addfeats};
      } //End of inner function for adding and trimming

      //Loop through trackids that had features added and add to master track dictionary
      for (affectedid in addmap){
        if (addmap.hasOwnProperty(affectedid)){
          affectedfeatures = addAndTrim(affectedid, addmap[affectedid]);
          //console.log("affectedfeatures: ", affectedfeatures);
          affectedtracks[affectedid] = affectedfeatures;
        }
      }
      return affectedtracks;
    },

    /**
     * Remove features from tracks
     * @param [Graphic] deleted   The array of graphics to remove
     */
    removeFeatures: function(deleted){
      var affected = [],
        oidfield = this.layer.objectIdField,
        trackidfield = this.layer._trackIdField,
        num;

      if (deleted){
        num = deleted.length;
        array.forEach(deleted, function(graphic){
          var i,
            oid,
            trackid,
            trackfeats,
            feat;

          trackid = graphic.attributes[trackidfield];
          oid = graphic.attributes[oidfield];
          trackfeats = this.trackMap[trackid];
          if (trackfeats){
            for (i = 0; i < trackfeats.length; i += 1){
              feat = trackfeats[i];
              if (feat.attributes[oidfield] === oid){
                this.trackMap[trackid].splice(i, 1);
                if (array.indexOf(trackid) === -1){
                  affected.push(trackid);
                }
                break;
              }
            }
          }
        }, this);

        if (deleted.length > 0){
          this.refreshTracks(affected);
        }
      }
    },

    /*
     * Draw lines to connect points in track. If trackid already drawn once,
     *   just update geometry of track line.
     */
    drawTracks: function(trackids) {
      var self = this,
        container = this.container,
        trackmap,
        sr,
        trackidfield,
        tkid;

      if (!container) {
        return;
      }

      trackmap = this.trackMap;
      sr = this.map.spatialReference;
      trackidfield = this.layer._trackIdField;

      /*
       * Inner function: Makes polyline from points of track and adds it track line graphics layer.
       *   Also adds graphic to this.trackLineMap
       */
      function add_track(id){
        var ptarray = trackmap[id],
          needline = ptarray && ptarray.length > 1,
          i,
          path,
          point,
          attrs,
          linegraphic,
          linegeom;


        //remove old line graphic if necessary
        linegraphic = self.trackLineMap[id];
        if (linegraphic && ! needline){
          container.remove(linegraphic);
          delete self.trackLineMap[id];
          linegraphic = null;
        }

        if (! needline){
          return false;
        }


        /*//make new line graphic
        if (! ptarray || ptarray.length < 2){
          return false;
        }*/

        //make path
        path = [];
        for (i = ptarray.length - 1; i >=0 ; i -= 1) {
          point = ptarray[i].geometry;

          if (point) {
            path.push([ point.x, point.y ]);
          }
        }

        //make attributes object
        attrs = {};
        attrs[trackidfield] = id;

        //add graphic to layer and reference it in this.trackLineMap
        if (path.length > 1) {
          if (! linegraphic){
            linegraphic = new Graphic(
              new Polyline({ paths: [path], spatialReference: sr }),
              null,
              attrs
            );
            container.add(linegraphic);
            self.trackLineMap[id] = linegraphic;
          }
          else{
            linegeom = linegraphic.geometry;
            linegeom.removePath(0);
            linegeom.addPath(path);
            linegraphic.setGeometry(linegeom);
          }
        }
      } //end of inner function

      // draw track lines - use trackids array or all ids
      if (trackids){
        array.forEach(trackids, function(id){
          add_track(id);
        });
      }
      else{
        for (tkid in trackmap){
          if (trackmap.hasOwnProperty(tkid)){
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
        trackmap = this.trackMap,
        layer = this.layer,
        renderer = layer._getRenderer(),
        tkid;

      //Inner function: does actual refresh
      function doRefresh(id){
        var ptarray,
          len,
          f;

        /*//self.drawTracks([id]);
        //no need to redraw points if renderer does not have latestObservationRenderer
        if (renderer && renderer.latestObservationRenderer){
          ptarray = trackmap[id] || [];
          len = ptarray.length;
          for (f = 0; f < len; f++){
            layer._repaint(ptarray[f], null, true);
          }
        }*/

        ptarray = trackmap[id] || [];
        len = ptarray.length;
        for (f = 0; f < len; f++){
          layer._repaint(ptarray[f], null, true);
        }

      } //end of inner function

      self.drawTracks(trackids);
      if (!trackids){
        for (tkid in trackmap){
          if (trackmap.hasOwnProperty(tkid)){
            doRefresh(tkid);
          }
        }
      }
      else{
        array.forEach(trackids, function(id){
          doRefresh(id);
        });
      }

      //this.moveLatestToFront();
    },

    destroy: function(){
      this.inherited(arguments);
      this.trackLineMap = null;
    }
  });

  return StreamTrackManager;
});
