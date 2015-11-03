define(
[
  "../../core/declare",
  "dojo/_base/lang",
  "dojo/_base/array",
  
  "../../geometry/SpatialReference",
  "../../geometry/support/jsonUtils",
  
  "../../tasks/support/Query",
  "../../tasks/QueryTask",
  
  "./RenderMode"
],
function(
  declare, lang, array,
  SpatialReference, geometryJsonUtils,
  Query, QueryTask,
  RenderMode
) {

  /****************************
   * esri.layers._StreamMode
   ****************************/
  /*
   * This is the default rendering mode for esri.layers.StreamLayer.
   */
  var StreamMode = declare([ RenderMode ], {
  
    declaredClass: "esri.layers.support.StreamMode",

    /**********************************************************
     *
     * Overrides
     *
     *********************************************************/
    constructor: function(featureLayer, refreshRate) {
      this.featureLayer = featureLayer;

      this._featureMap = {};

      //internal properties for handling draw rate
      this._setRefreshRate();
      this._drawBuffer = {
        adds: [],
        updates: []
      };
      this._timeoutId = null;
      this._flushDrawBuffer = lang.hitch(this, this._flushDrawBuffer);

      //map of feature ids binned by 1 second intervals - used for purging by time
      this._featuresByTime = {};

      //last time features were checked for purging by end time
      this._lastEndTimeCheck = null;

      //maximum age of features as specified in Stream Layer constructor options - rounded to next second
      this._maxFeatureAge = 0;
      if(featureLayer.purgeOptions && featureLayer.purgeOptions.age && typeof featureLayer.purgeOptions.age === "number"){
        this._maxFeatureAge = Math.ceil(featureLayer.purgeOptions.age * 60) * 1000;
      }

      this._drawFeatures = lang.hitch(this, this._drawFeatures);
      this._queryErrorHandler = lang.hitch(this, this._queryErrorHandler);
    },

    startup: function() {
      if (this.featureLayer._collection) {
        //console.log("Feature layer is a collection");
        return;
      }

      //when archiving added to Stream Service, do a query to load archived data into layer on startup
      //this._fetchArchive();
    },

    /*
     * Gets called when time definition has changed for map or layer.
     * Also gets called when maximumTrackPoins property changed on Stream Layer
     * This mode only supports map time extent change and maximumTrackPointsChanged
     *   type = 0: map time extent changed.
     *   type = 1: layer definition expression changed
     *   type = 2: layer time definition changed
     *   type = 3: maximumTrackPoints changed
     */
    propertyChangeHandler: function(type) {
      if (this._init) {
        if (type === 0){
          // map time extent changed - call RenderingMode's _applyTimeFilter to draw current state of data
          this._applyTimeFilter();
        }
        else if (type === 3) {
          // layer maximumTrackPoints property changed. Redraw all tracks
          this._redrawAllTracks();
        }
        else {
          //unsupported property change
          console.debug("StreamLayer: Stream Layer only supports changing map time or maximumTrackPoints. Layer id = " + this.featureLayer.id);
        }
      }
    },

    /*
     * Assumes that the feature has an ObjectID set. StreamLayer adds
     *   an ObjectID value to the feature if it is missing.
     * Feature is not drawn right away. It is added to a drawBuffer and gets drawn on next refresh cycle
     */
    drawFeature: function(feature) {
      var layer = this.featureLayer,
        oidField = layer.objectIdField,
        existingFeature;

      if (! this._timeoutId){
        //console.log("Setting timeout");
        this._timeoutId = setTimeout(this._flushDrawBuffer, this._refreshRate);
      }

      //If feature with ObjectID already exists, update, else add
      existingFeature = layer._joinField ? this._getFeature(feature.attributes[oidField]) : null;

      //add feature to layer
      if (existingFeature){
        //console.log("Updating feature");
        this._drawBuffer.updates.push({
          oid: feature.attributes[oidField],
          updates: feature
        });
      }
      else{
        //console.log("Adding feature: ");
        this._drawBuffer.adds.push(feature);
      }
    },

    /*
     * Draw current state of data using current map time extent.
     */
    resume: function() {
      this.propertyChangeHandler(0);
    },

    /*
     * Draw current state of data on client
     */
    refresh: function() {
      var layer = this.featureLayer;

      if (layer) {
        //If not backed by feature service, just clear graphics
        if(!layer._relatedUrl && !layer._keepLatestUrl){
          layer._fireUpdateStart();
          layer.clear();
          layer._fireUpdateEnd();
        }
        else{
          //disconnect socket and reconnect so that layer is reset
          layer._fireUpdateStart();

          //set flag that layer is refreshing so on-disconnect message is not misleading
          layer._refreshing = true;

          //disconnect from socket
          layer.disconnect();

          //clear graphics and reset flags that buddied FS has been queried
          layer.clear();
          layer._relatedQueried = false;
          layer._keepLatestQueried = false;

          //start connect process - this includes querying buddied FS
          layer.connect();
        }
      }
    },

    /*
     * Called by layer after features are fetched from the Stream Service's archive.
     *   Assumes that the features have an ObjectID set
     */
    _drawFeatures: function(response){
      this._purgeRequests();
      var features = response.features || [],
        layer = this.featureLayer;

      //console.log("Query complete");
      layer._create(features);
      //console.log("Graphics created. Firing updateEnd");
      layer._fireUpdateEnd(null, null);
    },

    /*
     * Inherited method performs actual filter. Then TrackManager.trimTracks is used to honor
     *   the StreamLayer.maximumTrackPoints option
     */
    _applyTimeFilter: function(silent){
      this.inherited(arguments);
      this._redrawAllTracks();
    },

    /**********************
     *
     * Internal methods
     *
     **********************/

    /*
     * Remove features from layer.
     */
    _removeFeatures: function(removedFeatures){
      var layer = this.featureLayer,
        oidField = layer.objectIdField;

      if (! removedFeatures){
        return;
      }

      array.forEach(removedFeatures, function(feat){
        var featoid = feat.attributes[oidField];

        //unselect in case the feature has been selected to show the popup
        layer._unSelectFeatureIIf(featoid, this);

        this._decRefCount(featoid);
        this._removeFeatureIIf(featoid);
      }, this);
    },

    /**
     * Add features to the layer
     * @param [Graphic] features  Array of features to add to the layer
     * @private
     */
    _addFeatures: function(features){
      var layer = this.featureLayer,
        endTimeField = layer._endTimeField,
        startTimeField = layer._startTimeField,
        trackmanager,
        affected,
        oidfield,
        affectedid,
        idstorefresh = [],
        featstoadd = [],
        featstoremove = [];

      trackmanager = layer._trackManager;
      oidfield = layer.objectIdField;

      //add features to track manager so maximumTrackPoints honored and tracks trimmed
      if (trackmanager){
        affected = trackmanager.addFeatures(features);

        //loop through the affected track ids - each object has adds and deletes property
        for (affectedid in affected){
          if (affected.hasOwnProperty(affectedid)){
            idstorefresh.push(affectedid);

            //add features to featstoadd array and featstoremovearray
            if (affected[affectedid].adds){
              featstoadd = featstoadd.concat(affected[affectedid].adds);
            }
            if (affected[affectedid].deletes){
              featstoremove = featstoremove.concat(affected[affectedid].deletes);
            }
          }
        }
      }
      else{
        featstoadd = features;
      }

      //add features to layer
      array.forEach(featstoadd, function(feat){
        var oid = feat.attributes[oidfield],
          endval,
          purgekey;

        //add to object that bins features by time for purging
        //time for expiring feature is set in this order: endTimeField of feature, startTime field + _maxFeatureAge, current time + _maxFeatureAge
        endval = endTimeField && feat.attributes[endTimeField];
        if(!endval && this._maxFeatureAge){
          endval = (startTimeField && feat.attributes[startTimeField]) ? feat.attributes[startTimeField] + this._maxFeatureAge : Date.now() + this._maxFeatureAge;
        }
        if (endval){
          //console.log("Adding features to time bin");
          purgekey = Math.ceil(endval/1000) * 1000;
          //purgekey = new Date( Math.ceil(endval/1000) * 1000 );
          if (this._featuresByTime[purgekey]){
            this._featuresByTime[purgekey].push(oid);
          }
          else{
            this._featuresByTime[purgekey] = [oid];
          }
        }

        this._addFeatureIIf(oid, feat);
        this._incRefCount(oid);
      }, this);

      //remove features trimmed by track manager
      if (featstoremove.length){
        this._removeFeatures(featstoremove);
      }

      //refresh tracks
      if (trackmanager){
        trackmanager.refreshTracks(idstorefresh);
      }
    },

    /**
     * Update features
     * @param [Object] updates  Array of objects containing update info.
     * @param [Object] updates.updates: feature object
     * @private
     */
    _updateFeatures: function(updates){
      var layer = this.featureLayer,
        trackmanager,
        oidfield,
        trackidfield,
        idstorefresh = [];

      trackmanager = layer._trackManager;
      oidfield = layer.objectIdField;
      trackidfield = layer._trackIdField;

      array.forEach(updates, function(updateobject){
        var updates = updateobject.updates,
          oid = updateobject.oid,
          feat = this._getFeature(oid),
          attribs,
          p;

        if (feat){
          if (updates.geometry){
            feat.setGeometry(updates.geometry);
          }

          attribs = updates.attributes || {};
          for (p in attribs){
            if (attribs.hasOwnProperty(p)){
              feat.attributes[p] = attribs[p];
            }
          }

          //If feature is not in the time extent of the map, set visible=false so not drawn
          feat.visible = this._checkFeatureTimeIntersects(feat);

          //use track manager to refresh feature if feature has trackId
          if (trackmanager && feat.attributes[trackidfield]){
            idstorefresh.push(feat.attributes[trackidfield]);
          }
          else{
            layer._repaint(feat, null, true);
          }
        }

      }, this);

      if (idstorefresh.length){
        trackmanager.refreshTracks(idstorefresh);
      }
    },

    /*
     * Redraw all tracks:
     *  - Trims features using maximumTrackPoints
     *  - Redraws features and track lines
     */
    _redrawAllTracks: function(){
      var layer = this.featureLayer,
        trackManager = layer._trackManager,
        removedFeatures;

      if (trackManager){
        removedFeatures = trackManager.trimTracks();
        if (removedFeatures && removedFeatures.length > 0){
          this._removeFeatures(removedFeatures);
          trackManager.refreshTracks();
        }
      }
    },

     /*
     * Apply changes to stream layer that have happened since last time the
     *   draw buffer was flushed.
     */
    _flushDrawBuffer: function(){
      clearTimeout(this._timeoutId);

      var buffer = this._drawBuffer,
        tempaddarray = buffer.adds.splice(0, buffer.adds.length),
        tempupdatearray = buffer.updates.splice(0, buffer.updates.length),
        deletearray,
        layer = this.featureLayer;

      //check if layer exists
      if (! layer){
        return false;
      }

      //fire update-start event if not already updating
      if (!layer.updating){
        layer._fireUpdateStart();
      }

      //add and update features
      this._addFeatures(tempaddarray);
      this._updateFeatures(tempupdatearray);

      //get expired features
      deletearray = this._getExpiredFeatures();
      if (deletearray && deletearray.length){
        this._removeFeatures(deletearray);
        if (layer._trackManager){
          layer._trackManager.removeFeatures(deletearray);
        }
      }

      //purge features
      layer._purge();

      //fire update-end event to reset refresh timer if auto refresh enabled
      layer._fireUpdateEnd();
      this._timeoutId = null;
    },

    //Clear features buffered to draw
    _clearDrawBuffer: function(){
      var id = this._timeoutId,
        buffer = this._drawBuffer,
        addarray = buffer.adds,
        updatearray = buffer.updates;

      //cancel timer to draw features
      if (id){
        clearTimeout(id);
      }

      //clear features from buffer array
      addarray.splice(0, addarray.length);
      updatearray.splice(0, updatearray.length);
      this._timeoutId = null;
    },

    //Clear feature ids stored in _featuresByTime
    _clearTimeBin: function(){
      this._featuresByTime = {};
      this._lastEndTimeCheck = Math.ceil(Date.now() / 1000) * 1000;
    },

    _clearFeatureMap: function(){
      this._featureMap = {};
    },

    _setRefreshRate: function(refreshRate){
      //set refresh rate
      refreshRate = refreshRate || refreshRate === 0 ? refreshRate : 200;
      if (refreshRate < 0){
        refreshRate = 200;
      }
      this._refreshRate = refreshRate;
    },

    /*
     * Check if feature startTime is within map time extent
     */
    _checkFeatureTimeIntersects: function(feature){
      var layer = this.featureLayer,
        map = layer.getMap(),
        timeExtent = map.timeExtent,
        results;

      //if layer does not have timeInfo or if map does not have a time extent, return true
      if (! timeExtent || ! (layer.timeInfo && (layer.timeInfo.startTimeField || layer.timeInfo.endTimeField))){
        return true;
      }

      //use FeatureLayer._filterByTime method
      results = layer._filterByTime([feature], timeExtent.startTime, timeExtent.endTime);
      return results.match.length > 0;
    },

    _getRequestId: function(layer) {
      var id = "_" + layer.name + layer.layerId + layer._ulid;
      return id.replace(/[^a-zA-Z0-9\_]+/g, "_"); // cannot have hyphens in callback function names
    },

    //Fetch archived features from stream layer's buddied feature service
    _fetchArchive: function(url){
      var layer = this.featureLayer,
        task,
        query,
        map,
        filter,
        defExpr,
        extent,
        outFields,
        callbackSuffix;

      layer._fireUpdateStart();
      if (url && this.map){
        //console.log("Query for archived features");
        task = new QueryTask(url);
        query = new Query();
        map = this.map;

        //get layer's filter and use it to set query properties
        filter = layer.getFilter() || {};
        defExpr = filter.where || "1=1";
        extent = filter.geometry ? geometryJsonUtils.fromJSON(filter.geometry) : null;
        outFields = filter.outFields ? filter.outFields.split(",") : ["*"];

        query.geometry = extent;
        query.where = defExpr;
        query.outFields = outFields;
        query.returnGeometry = true;
        query.outSpatialReference = new SpatialReference(map.spatialReference.toJSON());

        if (layer._usePatch) {
          // get an id for this request
          callbackSuffix = this._getRequestId(layer);

          // cancel the previous request of the same kind
          this._cancelPendingRequest(null, callbackSuffix);
        }

        task.execute(query, this._drawFeatures, this._queryErrorHandler, callbackSuffix);
      }
      else{
        this._fireUpdateEnd({error: "Archive data cannot be fetched if no feature service url is provided or if the layer is not added to a map"});
        return false;
      }
    },

    _queryErrorHandler: function(err) {
      //console.log("query error! ", err);

      this._purgeRequests();

      var layer = this.featureLayer;
      layer._errorHandler(err);
      layer._fireUpdateEnd(err);
    },

    /*
     * Get features that have endTimeField value less than current time
     */
    _getExpiredFeatures: function(){
      var layer = this.featureLayer,
        endTimeField = layer._endTimeField,
        start, end, now,
        timebin,
        idarray = [],
        expiredFeatures = [];

      //quit if layer does not have an endTimeField
      if (! endTimeField && !this._maxFeatureAge){
        return expiredFeatures;
      }

      //figure time range to check and reset last time check flag
      start = Math.floor(this._lastEndTimeCheck / 1000) * 1000;
      end = Math.ceil(Date.now() / 1000) * 1000;
      this._lastEndTimeCheck = end;

      //only perform check if time interval is 1 second or more
      if (start && start !== end){
        //loop from start to end by 1 second intervals and get feature ids from time bin
        timebin = this._featuresByTime;
        for (now = start; now <= end; now += 1000){
          if (timebin[now]){
            idarray = idarray.concat(timebin[now]);
            delete timebin[now];
          }
        }
      }

      //get actual features
      array.forEach(idarray, function(oid){
        var feat = this._getFeature(oid);
        if (feat){
          expiredFeatures.push(feat);
        }
      }, this);
      return expiredFeatures;
    }
  });

  return StreamMode;
});
