define(
[
  "../../../core/declare",
  "dojo/_base/lang",

  "dojo/Deferred",

  "../../../core/Accessor",
  "../../../core/Promise",

  "../../../tasks/support/FeatureSet"
],
function(
  declare, lang,
  Deferred,
  Accessor, Promise,
  FeatureSet
) {

  var MemorySource = declare([Accessor, Promise], {

    getDefaults: function(properties) {
      var defaults = this.inherited(arguments),
          layer = properties.layer,
          collectionLayer = layer && layer.collectionLayer;
      
      if (collectionLayer) {
        defaults = lang.mixin(
          defaults, {
            layerDefinition: collectionLayer.layerDefinition,
            featureSet: FeatureSet.fromJSON(collectionLayer.featureSet)
          }
        );
      }
      
      return defaults;
    },

    queryFeatures: function(query) {
      // TODO
      // Honor query parameters.
      
      var dfd = new Deferred();
      dfd.resolve(this.featureSet);
      return dfd.promise;
    }

  });

  return MemorySource;
});
