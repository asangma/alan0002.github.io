/**
 * StreamPurger purges features from the Stream Layer View's graphics collection according to rules set on the Streamlayer.
 * The purging steps are:
 * * By Time - either by the layer.timeInfo.endTimeField or the purgeOptions.age property
 * * By tracks - Each trackId cannot contain more than layer.maximumTrackPoints
 * * By displayCount - Total number of graphics cannot exceed purgeOptions.displayCount
 *
 * To enable purging, a parent field is added to the graphics; it is the trackId. Also
 * an object is maintained that holds the features grouped by one second time intervals.
 */
define(
  [
    "../../core/declare",
    "dojo/_base/lang",

    "dojo/Deferred",

    "../../core/Accessor",
    "../../core/Promise"
  ],
  function(
    declare, lang,
    Deferred,
    Accessor, Promise
  ) {

    /**
     * @extends module:esri/core/Accessor
     * @private
     * @constructor module:esri/layers/support/StreamPurger
     * @param {StreamController} properties The StreamController associated with the view and layer
   */
    var StreamPurger = declare([Accessor, Promise], {

      //---------------------------------
      //
      // Lifecycle
      //
      //---------------------------------
      constructor: function(){
        //map of feature ids binned by 1 second intervals - used for purging by time
        this._featuresByTime = {};

        //last time features were checked for purging by end time
        this._lastEndTimeCheck = null;

        //hash of trackIds currently in collection - used to trim tracks if purge called without collection changes
        //has trackId property set to number of features with that trackId
        this._trackIds = {};

        //flags for purge methods needed - time and tracks
        //the values are set according to the layer and purge options in initialize() method
        this._doTimePurge = false;
        this._doTrackPurge = false;

        //handlers for watching layer properties
        this._watchHandlers = [];
      },

      normalizeCtorArgs: function(properties){
        //argument can be object with controller property or a StreamController
        //make properties an object with a controller property

        properties = properties || {};
        if(!properties.controller){
          properties = {
            controller: properties
          };
        }
        return properties;
      },

      getDefaults: function(){
        return lang.mixin(this.inherited(arguments), {
          idField: "id",
          parentField: "parent"
        });
      },

      initialize: function(){
        var dfd,
          self = this;

        //make sure a controller was passed in
        if(!this.controller){
          dfd = new Deferred();
          this.addResolvingPromise(dfd.promise);
          dfd.reject(new Error("Controller is not optional argument for StreamPurger constructor"));
        }
        else{
          try{
            //set layer and graphicsCollection
            this.graphicsCollection = this.controller.graphicsCollection;
            this.layer = this.controller.layer;

            //get track info from layer
            if(this.layer.trackIdField){
              this.trackIdField = this.layer.trackIdField;
              this._doTrackPurge = true;
            }

            //get rules for purging and set watch for rules that can change
            //maximum features per track
            this.maximumTrackPoints = this.layer.maximumTrackPoints;
            self._watchHandlers.push(this.layer.watch("maximumTrackPoints", function(value){
              var old = self.maximumTrackPoints;
              self.maximumTrackPoints = value;

              //call to purge tracks if old value was 0 or if new value is less than old value
              if(self._doTrackPurge && (old === 0 || (value !== 0 && value < old))){
                self._purgeByTracks();
              }
            }));

            //max feature age
            this.maxFeatureAge = 0;
            if(this.get("layer.purgeOptions.age")) {
              this.maxFeatureAge = Math.ceil(this.layer.purgeOptions.age * 60 * 1000);
            }

            if((this.get("layer.timeInfo.endTimeField")) || this.maxFeatureAge){
              this._doTimePurge = true;
              this._lastEndTimeCheck = Math.ceil(Date.now() / 1000) * 1000;
            }

            //display count
            this.displayCount = this.layer.purgeOptions && this.layer.purgeOptions.displayCount;

            //watch purge options for changes. Changing displayCount property will force a purge if
            //the new value is less than the old value. Changing the age property will only affect
            //features added after the change.
            self._watchHandlers.push(this.layer.watch("purgeOptions", function(value){
              //console.log("purge options changed: ", value);
              var oldDisplayCount = self.displayCount;
              if(value.hasOwnProperty("displayCount") && value.displayCount !== oldDisplayCount){
                //console.log("purgeOptions.displayCount changed: ", value.displayCount);
                self.displayCount = value.displayCount;
                if(self.displayCount < oldDisplayCount){
                  //console.log("display count needs to be applied: ", oldDisplayCount);
                  self._purgeByDisplayCount();
                }
              }
              if(value.hasOwnProperty("age")){
                self.maxFeatureAge = value.age;
              }
            }));

            //watch the graphics collection for changes
            //only run purge if graphics were added, since purge not needed if graphics removed
            self._watchHandlers.push(this.graphicsCollection.on("change", function(changes){
              if(changes.added.length){
                //console.log("graphics collection changed: ", changes);
                self._addItems(changes.added);
              }
            }));
          }
          catch(err){
            dfd = new Deferred();
            this.addResolvingPromise(dfd.promise);
            dfd.reject(err);
          }
        }
      },

      destroy: function(){
        //remove watch handlers
        for(var i = 0, n = this._watchHandlers.length; i < n; i++){
          this._watchHandlers[i].remove();
        }
      },

      //---------------------------
      //
      // Public Methods
      //
      //---------------------------

      /**
       * Performs all purge functions. This can be called by an external module to
       * perform purging when needed, such as on a timer. It is also called internally from the
       * `_addItems` method. If the `added` argument is supplied, only the trackIds of the
       * added graphics will be inspected for purging in the _purgeByTracks method.
       * @param {string[]} trackIds Changes made to the layer view's graphicCollection. Has added and removed property.
       */
      purge: function(trackIds){
        if(this._doTimePurge){
          this._purgeByTime();
        }
        if(this._doTrackPurge){
          this._purgeByTracks(trackIds);
        }
        this._purgeByDisplayCount();
      },

      //---------------------------
      //
      // Private Methods
      //
      //---------------------------

      /**
       * Performs preprocessing functions on data added to the layer view's graphics collection ands calls purge.
       * Processing steps are:
       * * Add `parent` property to item and set to trackId attribute
       * * Calculate expiration time and add item's id to hash of expiration times
       * @param {Object[]} added Graphics added.
       * @private
       */
      _addItems: function(added){
        var i, n,
          item,
          trackId,
          expireTime,
          featuresByTime = this._featuresByTime,
          trackIds = [];

        for(i = 0, n = added.length; i < n; i++) {
          item = added[i];

          if (this._doTrackPurge) {
            //calculate parent field
            trackId = item.attributes[this.trackIdField];
            item[this.parentField] = trackId;
            if (!this._trackIds.hasOwnProperty(trackId)) {
              this._trackIds[trackId] = 1;
            }
            else {
              this._trackIds[trackId] += 1;
            }
            if (trackIds.indexOf(trackId) === -1) {
              trackIds.push(trackId);
            }
          }
          if (this._doTimePurge) {
            expireTime = this._getExpireTimeOfItem(item);
            //console.log("expireTime: ", expireTime);
            if (expireTime){
              expireTime = Math.ceil(expireTime/1000) * 1000;
              //console.log("Expire time of feature: ", expireTime);
              if (featuresByTime[expireTime]){
                featuresByTime[expireTime].push(item.id);
              }
              else{
                featuresByTime[expireTime] = [item.id];
              }
              //console.log("featuresByTime: ", featuresByTime);
            }
          }
          //console.log("added: ", item);
        }

        //perform purge
        this.purge(trackIds);
      },

      /**
       * Calculates the time when the item should be purged. Time is set in this order:
       * * endTimeField of feature
       * * startTimeField of feature +  this.maxFeatureAge
       * * current time + this.maxFeatureAge
       * @param item The item added to the graphics collection
       * @returns {number}
       * @private
       */
      _getExpireTimeOfItem: function(item){
        var timeInfo = this.layer.timeInfo || {},
          expireTime;

        expireTime = timeInfo.endTimeField && item.attributes[timeInfo.endTimeField];
        if(!expireTime && this.maxFeatureAge){
          expireTime = (timeInfo.startTimeField && item.attributes[timeInfo.startTimeField])
            ? item.attributes[timeInfo.startTimeField] + this.maxFeatureAge
            : Date.now() + this.maxFeatureAge;
        }
        return expireTime;
      },

      /**
       * Gets the index of the item in the graphics collection
       * @param {*} item Item to get index of or the id of the item to get the index for
       * @returns {number}
       * @private
       */
      _getIndexOfItem: function(item){
        var id,
          findFunction,
          idField = this.idField;

        //get id - either the id of the item or the item argument itself
        if(typeof item === "object"){
          id = item[idField];
        }
        else{
          id = item;
        }

        //function to pass to Collection
        findFunction = function(collectionItem){
          return collectionItem[idField] === id;
        };

        return this.graphicsCollection.findIndex(findFunction, this);
      },

      /**
       *Gets all the items in the graphics collection that are children of the parent
       * @param {string|number} parent parent Id
       * @returns {Collection}
       * @private
       */
      _getItemsByParent: function(parent){
        var filterFunction = function(collectionItem){
            return collectionItem[this.parentField] === parent;
          },
          items;

        items = this.graphicsCollection.filter(filterFunction, this);
        return items;
      },

      /**
       * Updates the internal _trackIds hash to reflect the current number of graphics belonging to the trackId
       * @param {string[]} trackIds Array of trackIds. One for each graphic removed.
       * @private
       */
      _processRemovedTrackFeatures: function(trackIds){
        //console.log("trackIds to be removed: ", trackIds);
        if(!this._doTrackPurge || ! trackIds || !trackIds.length){
          return;
        }
        var trackId;
        for(var i = 0, n = trackIds.length;  i < n; i++){
          trackId = trackIds[i];
          this._trackIds[trackId] -= 1;
          if(this._trackIds[trackId] === 0){
            delete this._trackIds[trackId];
          }
        }
      },

      /**
       * Remove stale features using displayCount of purgeOptions
       * @private
       */
      _purgeByDisplayCount: function(){
        var numToPurge,
          trackId,
          removedIds = [],
          displayCount = this.displayCount;
        numToPurge = this.graphicsCollection.length - displayCount;
        if (numToPurge > 0){
          //console.log("purging by displayCount: ", numToPurge);
          for (var i = 0; i < numToPurge; i++){
            if(this._doTrackPurge){
              trackId = this.graphicsCollection.getItemAt(0)[this.parentField];
              removedIds.push(trackId);
            }
            this.graphicsCollection.removeItemAt(0);
          }
          this._processRemovedTrackFeatures(removedIds);
        }
      },

      /**
       * Remove the features expired by time
       * @private
       */
      _purgeByTime: function(){
        if(!this._featuresByTime || Object.getOwnPropertyNames(this._featuresByTime).length === 0){
          return;
        }

        var layer = this.layer,
          timeInfo = layer.timeInfo || {},
          endTimeField = timeInfo.endTimeField,
          start, end, now,
          timebin,
          idarray = [];

        //quit if layer does not have an endTimeField or if no maxFeatureAge
        if (!endTimeField && !this.maxFeatureAge){
          return;
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

        //remove features
        for(var i = 0, n = idarray.length; i < n; i++){
          var id = idarray[i],
            index = this._getIndexOfItem(id);
          if (index !== -1){
            this.graphicsCollection.removeItemAt(index);
          }
        }
      },

      /**
       * Remove features from tracks that exceed maximumTrackPoints
       * @param {string[]} trackIds The trackIds that should be processed.
       * @private
       */
      _purgeByTracks: function(trackIds){
        trackIds = trackIds || [];

        //console.log("this.maximumTrackPoints: ", this.maximumTrackPoints);
        if(!this.maximumTrackPoints){
          return;
        }

        var trackId,
          maximumTrackPoints = this.maximumTrackPoints,
          self = this;

        //inner function called to trim individual track
        function trimTrack(id){
          var features,
            numToRemove;

          features = self._getItemsByParent(id);
          numToRemove = features.length - maximumTrackPoints;
          if(numToRemove > 0){
            for(var j = 0; j < numToRemove; j++){
              self._removeItemFromCollection(features.getItemAt(j));
            }
            self._trackIds[id] = maximumTrackPoints;
          }
        } //end of inner function

        //loop through all track ids or just passed in track ids and trim to maximumTrackPoints length
        if(!trackIds.length){
          //console.log("Warning slow processing ahead");
          trackIds = this._trackIds;
          for(trackId in trackIds){
            if(trackIds.hasOwnProperty(trackId)){
              trimTrack(trackId);
            }
          }
        }
        else{
          for(var i = 0, n = trackIds.length; i < n; i++){
            trimTrack(trackIds[i]);
          }
        }
      },

      /**
       * Removes an item from the graphics collection using the idField.
       * @param {Object} item The collection item to get the index for
       * @returns {Object} An object.
       * ```
       * {
       *  index: index of item in output collection,
       *  id: value of item's idField,
       *  parent: parent of the item
       * }
       * ```
       * @private
       */
      _removeItemFromCollection: function(item){
        var id = item[this.idField],
          index;

        index = this._getIndexOfItem(item);
        if(index !== -1){
          this.graphicsCollection.removeItemAt(index);
        }
        return {
          index: index,
          id: id,
          parent: item[this.parentField]
        };
      }
    });
    return StreamPurger;
  });
