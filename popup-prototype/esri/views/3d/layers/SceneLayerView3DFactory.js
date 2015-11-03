/**
 * Created by ZRH-MARKUSL2 on 1/28/2015.
 */
define([
  "dojo/Deferred",
  "./SceneLayerView3D",
  "./SceneGraphicsLayerView3D",
  "../../../request"
], function (Deferred, SceneLayerView3D, SceneGraphicsLayerView3D, esriRequest){
  var SceneLayerView3DFactory = function(params) {

    var layer = params.layer;

    var dfd = new Deferred();

    var layerInfoQuery = esriRequest({
      "url": layer.url,
      "content": {
        "f": "json"
      },
      handleAs: "json",
      callbackParamName: "callback"
    });

    layerInfoQuery.then(
      function(layerInfo, response) {

        var profile = layerInfo.store && layerInfo.store.profile ? layerInfo.store.profile: "features-meshes";

        var lv;
        if (profile === "features-meshes" || profile === "meshpyramids") {
          lv = new SceneLayerView3D(params);
        }
        else {
          lv = new SceneGraphicsLayerView3D(params);
        }

        dfd.resolve({
          "layerView": lv
        });

      }.bind(this),
      function(error) {
        console.log("layerInfoQuery query on " +  params.layer.url + " failed");
        dfd.reject(error);
      });
    return dfd.promise;
  };

  return SceneLayerView3DFactory;
});
