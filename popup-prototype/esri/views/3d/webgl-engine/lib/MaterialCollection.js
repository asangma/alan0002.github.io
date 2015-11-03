/* jshint forin:false */
define(["./ModelContentType"], function (ModelContentType){
  var MaterialCollection = function MaterialCollection(stage) {
        var materials = {};

        this.getMaterial =  function(paramsStringified) {
          return materials[paramsStringified];
        };

        this.addMaterial = function(paramsStringified, material) {
          materials[paramsStringified] = material;

          stage.add(ModelContentType.MATERIAL, material);
        };

        this.dispose = function() {
          for (var matIdx in materials) {
            stage.remove(ModelContentType.MATERIAL, materials[matIdx].getId());
          }

          materials = {};
        };
    };

   return MaterialCollection;
});