define(["../processors/SpatialIndex", "dojo/Deferred"],
function(SpatialIndex, Deferred) {
  return {
    /**
     * Adds an index to a map or feature layer and connects the index to it.
     * Adds an `index` property to the target instance
     * @param {Object=} options - index options
     * @param {esri/processors/SpatialIndex} [options/spatialIndex] - A SpatialIndex processing instance to use rather than creating a new one.
     * @param {string} [indexType] - The type of index to use; rtree, kdtree, or quadtree. default is rtree
     * @see module:esri/processors/Processor for more options
     */
    add: function(target, options) {
      options = options || {};
      //looks for an existing index
      if(target.spatialIndex){
        return target.spatialIndex;
      } else if ("spatialIndex" in options){
        if(options.spatialIndex !== false){
          target.spatialIndex = options.spatialIndex;
          return target.spatialIndex;
        }
      } else {
        //adds an spatialIndex to the target
        var dfd = new Deferred();
        options.autostart = false;
        target.spatialIndex = new SpatialIndex(options);
        var spndx = target.spatialIndex;
        if (target.declaredClass.indexOf("Map") > -1) {
          spndx.setMap(target);
        } else {
          spndx.addLayer(target);
        }
        spndx.on("start", function() {
          dfd.resolve(spndx);
        });
        spndx.start();
        return dfd.promise;
      }
    },
    remove: function(target){
      var spatialIndex = target.spatialIndex;
      if(!spatialIndex){
        return;
      } else if(target.declaredClass.indexOf("Map")>-1){
        spatialIndex.unsetMap();
      } else {
        spatialIndex.removeLayer(target);
      }
      target.spatialIndex = undefined;
    }
  };
});
