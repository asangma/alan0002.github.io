define([
  "../core/lang",

  "dojo/_base/Deferred",
  "dojo/_base/kernel",
  "dojo/_base/lang"
],
function(
  esriLang,
  Deferred, dojo, lang
) {

  var FeatureLayerQueryResult = function (result) {
    if (!result) {
      return result;
    }

    if (result.then) {
      result = lang.delegate(result);
    }
    
    if (!result.total) {
      result.total = Deferred.when(result, function (result) {
        return esriLang.isDefined(result.total) ? result.total : (result.length || 0);
      });
    }

    function addIterativeMethod(method) {
      if (!result[method]) {
        result[method] = function () {
          var args = arguments;
          return Deferred.when(result, function (result) {
            Array.prototype.unshift.call(args, (result.features || result));
            return FeatureLayerQueryResult(dojo[method].apply(dojo, args));
          });
        };
      }
    }

    addIterativeMethod("forEach");
    addIterativeMethod("filter");
    addIterativeMethod("map");
    addIterativeMethod("some");
    addIterativeMethod("every");

    return result;
  };
  lang.setObject("dijit.FeatureLayerQueryResult", FeatureLayerQueryResult);
  return FeatureLayerQueryResult;
});
