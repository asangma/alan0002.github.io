define([
  "../../../core/declare",

  "dojo/Deferred",
  
  "../../../core/Accessor",
  "../../../core/Promise"
],
function(
  declare,
  Deferred,
  Accessor, Promise
) {

  var OnDemandController = declare([Accessor, Promise], {
    
    //--------------------------------------------------------------------------
    //
    //  Lifecycle
    //
    //--------------------------------------------------------------------------

    initialize: function() {
      var dfd = new Deferred();
      this.addResolvingPromise(dfd.promise);
      dfd.reject(new Error("OnDemandController: Not implemented yet."));
    }
    
  });

  return OnDemandController;
});
