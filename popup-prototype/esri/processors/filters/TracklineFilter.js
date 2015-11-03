/**
 * A Filter that makes lines from a track's points.
 */
define([
  "../../core/declare",

  "esri/geometry/Polyline",
  "esri/processors/filters/TrackFilter"
], function(declare,
            Polyline,  TrackFilter){
  /**
   * extends module:esri/processors/filters/TrackFilter
   * constructor esri/processors/filters/TracklineFilter
   * @param {Object|string} properties The trackIdField used to group items into tracks is required.
   */
  var TracklineFilter = declare([TrackFilter], {

    //------------------------------
    //
    // Lifecycle
    //
    //------------------------------

    declaredClass: "esri.processors.TracklineFilter",

    //the only required argument is a trackIdField name. It might be passed in as a string
    normalizeCtorArgs: function(properties){
      if(typeof properties === "string"){
        properties = {
          trackIdField: properties
        };
      }
      return properties;
    },

    //------------------------------
    //
    // Properties
    //
    //------------------------------

    nextLineId: 1,

    //------------------------------
    //
    // Public Methods
    //
    //------------------------------

    /**
     * Modifies output collection with polyline connecting observation points
     * @param {Object} changes Has an `added` and `removed` property.
     */
    run: function(changes){
      if(!this.trackIdField || !changes){
        return;
      }

      var affected,
        trackid,
        children,
        child,
        item,
        path,
        linejson, line;

      //get ids of tracks affected by changes
      affected = this._getTracksAffectedByChanges(changes);

      //for each affected trackid remove the old line, get the child features and
      //make a line from the points, then add new line to output
      //TODO Add logic to see if need sorting
      for(var i = 0, n = affected.length; i < n; i++){
        var j, m;
        trackid = affected[i];

        //remove old track line
        children = this._getItemsByParent(trackid, this.output);
        if(children){
          for(j = 0, m = children.length; j < m; j++){
            item = children.getItemAt(j);
            this.output.removeItem(item);
          }
        }

        //make line from points in input collection with parent=trackid
        children = this._getItemsByParent(trackid, this.input);
        if(children.length > 1){
          linejson = {
            paths:[]
          };
          path = [];
          for(j = 0, m = children.length; j < m; j++){
            child = children.getItemAt(j);
            if(j === 0){
              linejson.spatialReference = child.geometry.spatialReference;
            }
            path.push([child.geometry.x, child.geometry.y]);
          }
          linejson.paths.push(path);
          line = Polyline.fromJSON(linejson);
          //console.log("new line: ", line);

          //add new item to output collection
          this.output.addItem({
            id: this.nextLineId,
            parent: trackid,
            geometry: line
          });
          this.nextLineId += 1;
        }
      }
    }
  });

  return TracklineFilter;
});
