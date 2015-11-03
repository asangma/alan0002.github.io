/**
 * A Filter that modifies the output collection so that only the most current observation
 * of a track exists.
 */
define([
  "../../core/declare",
  "dojo/_base/array",
  "dojo/_base/lang",

  "esri/processors/filters/TrackFilter"
], function(declare, array, lang,
            TrackFilter){
  /**
   * extends module:esri/processors/filters/TrackFilter
   * constructor
   * param {Object} properties Options are:
   * * trackIdField - Required - The field used to group items into tracks.
   * * observationType - Optional - The observationType to output. Default is current
   * It can be in an object or a string.
   */
  var ObservationFilter = declare([TrackFilter], {

    //------------------------------
    //
    // Lifecycle
    //
    //------------------------------

    declaredClass: "esri.processors.ObservationFilter",

    getDefaults: function(){
      return lang.mixin(this.inherited(arguments), {
        observationType: ObservationFilter.CURRENT
      });
    },

    //------------------------------
    //
    // Properties
    //
    //------------------------------

    /**
     * The type of observation to output. Either current or other. See static members.
     * @type {string}
     */
    observationType: null,

    //------------------------------
    //
    // Public Methods
    //
    //------------------------------

    /**
     * Modifies output collection so that only the most recent observation exists
     * or so that all observations exist except the most recent one.
     * @param {Object} changes Has an `added` and `removed` property.
     */
    run: function(changes){
      if(!this.trackIdField || !changes){
        return;
      }

      if(this.observationType === ObservationFilter.CURRENT){
        this._outputCurrentObservations(changes);
      }
      else{
        this._outputOtherObservations(changes);
      }
    },

    //------------------------------
    //
    // Private Methods
    //
    //------------------------------

    /**
     * Modifies output collection so that only one observation per track exists. The most recent.
     * @param {Object} changes Has an `added` and `removed` property.
     * @private
     */
    _outputCurrentObservations: function(changes){
      var item,
        i, n,
        affectedTracks;

      //get a list of tracks affected by changes
      affectedTracks = this._getTracksAffectedByChanges(changes);

      //for each affected track get the features and set the last as the
      //current observation in the output collection
      //TODO Add logic to see if need sorting
      var children;
      for(i = 0, n = affectedTracks.length; i < n; i++){
        //remove old observation(s)
        children = this._getItemsByParent(affectedTracks[i], this.output);
        //console.log("removing out observations: ", children);
        for(var j = 0, m = children.length; j < m; j++){
          item = children.getItemAt(j);
          this.output.removeItem(item);
        }

        //add latest to output collection
        children = this._getItemsByParent(affectedTracks[i], this.input);
        if(children && children.length){
          this.output.addItem(children.getItemAt(children.length - 1));
        }
      }
    },

    /**
     * Modifies output collection so all observations per track exist
     * except the most recent.
     * @param {Object} changes Has an `added` and `removed` property.
     * @private
     */
    _outputOtherObservations: function(changes){
      var removed = changes.removed || [],
        added = changes.added || [],
        item,
        i, n;

      //keep a list of tracks affected by changes
      var affectedTracks = [];

      //concatenate adds and deletes so can loop once to see what tracks affected
      added = added.concat(removed);

      //loop and get tracks affected.
      if(added.length){
        //console.log("added: ", added);
        for(i = 0, n = added.length; i < n; i++){
          item = added[i];
          if(array.indexOf(affectedTracks, item[this.parentField]) === -1){
            affectedTracks.push(item[this.parentField]);
          }
        }
      }
      //console.log("affected tracks: ", affectedTracks);

      //for each affected track get the features and set the first ones as the
      //other observations in the output collection
      //TODO Add logic to see if need sorting
      var children;
      for(i = 0, n = affectedTracks.length; i < n; i++){
        //remove old observation(s)
        children = this._getItemsByParent(affectedTracks[i], this.output);
        //console.log("removing out observations: ", children);
        for(var j = 0, m = children.length; j < m; j++){
          item = children.getItemAt(j);
          this.output.removeItem(item);
        }

        //add all except latest to output collection
        children = this._getItemsByParent(affectedTracks[i], this.input);
        if(children && children.length > 1){
          for(var k = 0, l = children.length; k < l - 1; k++){
            this.output.addItem(children.getItemAt(k));
          }
        }
      }
    }

  });

  //------------------------------
  //
  // Static Members
  //
  //------------------------------

  lang.mixin(ObservationFilter, {
    CURRENT:  "current",
    OTHER:  "other"
  });
  return ObservationFilter;
});
