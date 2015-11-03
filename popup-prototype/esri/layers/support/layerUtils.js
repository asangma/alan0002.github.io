define([
  "dojo/_base/array"
], function(array) {

  var layerUtils = {
    _serializeLayerDefinitions: function(/*String[] (sparse array)*/ layerDefinitions) {
      // Test cases
      /*
       var result = _serializeLayerDefinitions();
       console.log(result === null, result);

       var result = _serializeLayerDefinitions(null);
       console.log(result === null, result);

       var result = _serializeLayerDefinitions([]);
       console.log(result === null, result);

       var definitions = [];
       definitions[0] = "abc = 100";
       definitions[5] = "def LIKE '%test%'";
       var result = _serializeLayerDefinitions(definitions);
       console.log(result === "0:abc = 100;5:def LIKE '%test%'", result);

       var definitions = [];
       definitions[0] = "abc = 100";
       definitions[5] = "def LIKE '%te:st%'";
       var result = _serializeLayerDefinitions(definitions);
       console.log(result === '{"0":"abc = 100","5":"def LIKE \'%te:st%\'"}', result);

       var definitions = [];
       definitions[0] = "abc = 100";
       definitions[5] = "def LIKE '%te;st%'";
       var result = _serializeLayerDefinitions(definitions);
       console.log(result === '{"0":"abc = 100","5":"def LIKE \'%te;st%\'"}', result);

       var definitions = [];
       definitions[0] = "abc:xyz = 100";
       definitions[5] = "def LIKE '%te;st%'";
       var result = _serializeLayerDefinitions(definitions);
       console.log(result === '{"0":"abc:xyz = 100","5":"def LIKE \'%te;st%\'"}', result);
      */

      var defs = [], hasSpecialChars = false, re = /[:;]/;

      if (layerDefinitions) {
        array.forEach(layerDefinitions, function(defn, i) {
          if (defn) {
            defs.push([ i, defn ]);

            if (!hasSpecialChars && re.test(defn)) {
              hasSpecialChars = true;
            }
          } // if defn
        }); // forEach

        if (defs.length > 0) {
          var retVal;

          if (hasSpecialChars) { // 9.4 format
            retVal = {};
            array.forEach(defs, function(defn) {
              retVal[defn[0]] = defn[1];
            });
            retVal = JSON.stringify(retVal);
          }
          else { // old format
            retVal = [];
            array.forEach(defs, function(defn) {
              retVal.push(defn[0] + ":" + defn[1]);
            });
            retVal = retVal.join(";");
          }

          return retVal;
        } // if defs.length

      } // if layerDefinitions

      return null;
    },

    _serializeTimeOptions: function(layerTimeOptions, ids) {
      if (!layerTimeOptions) {
        return;
      }

      var retVal = [];

      array.forEach(layerTimeOptions, function(option, i) {
        // It's going to be a sparse array. So we got to
        // make sure the element is not empty
        if (option) {
          var json = option.toJSON();
          if (ids && array.indexOf(ids, i) !== -1) {
            json.useTime = false;
          }
          retVal.push("\"" + i + "\":" + JSON.stringify(json));
        }
      });

      if (retVal.length) {
        return "{" + retVal.join(",") + "}";
      }
    },

    _getVisibleLayers: function(infos, /* Number[]? */ layerIds) {
      var result = [];
      var layerInfo;
      var layerIdIndex;
      var i;

      if (!infos) {
        return result;
      }

      if (layerIds) {
        // replace group layers with their sub layers
        result = layerIds.concat();
        for (i = 0; i < infos.length; i++) {
          layerInfo = infos[i];
          layerIdIndex = array.indexOf(infos, layerInfo.id);
          if (layerInfo.subLayerIds && layerIdIndex > -1) {
            result.splice(layerIdIndex, 1); // remove the group layer id
            result = result.concat(layerInfo.subLayerIds);
          }
        }
      }
      else {
        result = this._getDefaultVisibleLayers(infos);
      }

      return result;
    },

    _getDefaultVisibleLayers: function(infos) {
      //tests:
      //use http://nil:6080/arcgis/rest/services/usa_sde_dynamic/MapServer as an example. The layerInfos is:
      /*[{
            "id":0,
            "name":"USA",
            "parentLayerId":-1,
            "defaultVisibility":true,
            "subLayerIds":[1,
                3,
                4,
                5,
                6,
                7
            ],
            "minScale":0,
            "maxScale":0,
            "declaredClass":"esri.layers.support.LayerInfo"
        },
        {
            "id":1,
            "name":"countiesAnno",
            "parentLayerId":0,
            "defaultVisibility":false,
            "subLayerIds":[2
            ],
            "minScale":0,
            "maxScale":0,
            "declaredClass":"esri.layers.support.LayerInfo"
        },
        {
            "id":2,
            "name":"Default",
            "parentLayerId":1,
            "defaultVisibility":true,
            "subLayerIds":null,
            "minScale":0,
            "maxScale":0,
            "declaredClass":"esri.layers.support.LayerInfo"
        },
        {
            "id":3,
            "name":"wind",
            "parentLayerId":0,
            "defaultVisibility":true,
            "subLayerIds":null,
            "minScale":0,
            "maxScale":0,
            "declaredClass":"esri.layers.support.LayerInfo"
        },
        {
            "id":4,
            "name":"ushigh",
            "parentLayerId":0,
            "defaultVisibility":true,
            "subLayerIds":null,
            "minScale":0,
            "maxScale":0,
            "declaredClass":"esri.layers.support.LayerInfo"
        },
        {
            "id":5,
            "name":"counties",
            "parentLayerId":0,
            "defaultVisibility":false,
            "subLayerIds":null,
            "minScale":0,
            "maxScale":0,
            "declaredClass":"esri.layers.support.LayerInfo"
        },
        {
            "id":6,
            "name":"states",
            "parentLayerId":0,
            "defaultVisibility":true,
            "subLayerIds":null,
            "minScale":0,
            "maxScale":0,
            "declaredClass":"esri.layers.support.LayerInfo"
        },
        {
            "id":7,
            "name":"sde.SDE.usacatalog",
            "parentLayerId":0,
            "defaultVisibility":true,
            "subLayerIds":null,
            "minScale":0,
            "maxScale":0,
            "declaredClass":"esri.layers.support.LayerInfo"
        }
      ]*/
      //esri._getDefaultVisibleLayers(layerInfos) === [0, 3, 4, 6, 7];
      var result = [], i;
      if (!infos) {
        return result;
      }
      for (i = 0; i < infos.length; i++) {
        if (infos[i].parentLayerId >= 0 && array.indexOf(result, infos[i].parentLayerId) === -1 &&
            array.some(infos, function(item) {
              return item.id === infos[i].parentLayerId;
            })) {
          // layer is not visible if it's parent is not visible
          continue;
        }
        if (infos[i].defaultVisibility) {
          result.push(infos[i].id);
        }
      }
      return result;
    },

    _getLayersForScale: function(scale, infos) {
      //tests:
      //use http://servicesbeta4.esri.com/arcgis/rest/services/Census/MapServer as test sample.
      /*  var map;
          function init() {
            map = new esri.Map("map");
            var usaLayer = new esri.layers.ArcGISDynamicMapServiceLayer("http://servicesbeta4.esri.com/arcgis/rest/services/Census/MapServer");
            map.addLayer(usaLayer);
            dojo.connect(usaLayer, "onLoad", function(layer){
              console.log(esri._getLayerForScale(esri.geometry.getScale(map), layer.layerInfos);
            });
          }
      */
      //When zooming in/out, the results should be different. For example,
      //when mapScale == 73957190.94894394, the result is [2,3,5];
      //when mapScale == 577790.5542889987, the result is [1,2,4,5];
      //when mapScale == 36111.9096430061, the result is [0,1,2,4,5];
      var result = [];
      if (scale > 0 && infos) {
        var i;
        for (i = 0; i < infos.length; i++) {
          if (infos[i].parentLayerId >= 0 && array.indexOf(result, infos[i].parentLayerId) === -1 &&
              array.some(infos, function(item) {
                return item.id === infos[i].parentLayerId;
              })) {
            // layer is not in scale range if it's parent is not in scale range
            continue;
          }
          if (infos[i].id >= 0) {
            var isInScaleRange = true,
                maxScale = infos[i].maxScale,
                minScale = infos[i].minScale;
            if (maxScale > 0 || minScale > 0) {
              if (maxScale > 0 && minScale > 0) {
                isInScaleRange = maxScale <= scale && scale <= minScale;
              }
              else if (maxScale > 0) {
                isInScaleRange = maxScale <= scale;
              }
              else if (minScale > 0) {
                isInScaleRange = scale <= minScale;
              }
            }
            if (isInScaleRange) {
              result.push(infos[i].id);
            }
          }
        }
      }
      return result;
    }
  };

  return layerUtils;
});
