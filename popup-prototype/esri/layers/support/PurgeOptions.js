define([
  "../../core/declare",
  "dojo/Stateful"
], function(declare, Stateful) {
  
  var PurgeOptions = declare([ Stateful ], {
    declaredClass: "esri.layers.support.PurgeOptions",
    
    constructor: function( parent, options ) {
      this.parent = parent;
      
      var p;
      for ( p in options ) {
        this[p] = options[p];
      }
    },

    _displayCountSetter: function( count ) {
      this.displayCount = count;
      this.parent.refresh();
    }
  });
  
  return PurgeOptions;
});
