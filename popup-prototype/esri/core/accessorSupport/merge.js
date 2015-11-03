define([
  "dojo/_base/lang"
], function(
  lang
) {

  /**
   * Deep merge two objects together.
   * 
   * @example
   * var obj = merge({ arr: ["test"] }, { arr: ["test1"] });
   * console.log(obj); // Object { arr:Array[2] }
   * 
   * @private
   */
  var merge = function(dest, source) {
    if (!source) {
      return dest;
    }
    return Object.keys(source).reduce(function(dest, name) {
      var destValue, sourceValue;
      if (name === "value") {
        dest[name] = source[name];
      } 
      else if (dest[name] === undefined) {
        dest[name] = lang.clone(source[name]);
      } 
      else {
        destValue = dest[name];
        sourceValue = source[name];
        if (destValue !== sourceValue) {
          if (Array.isArray(sourceValue) || Array.isArray(dest)) {
            if (!destValue) {
              destValue = dest[name] = [];
            }
            else if (!Array.isArray(destValue)) {
              destValue = dest[name] = [destValue];
            }
            else {
              destValue = dest[name] = destValue.concat();
            }
            if (sourceValue) {
              if (!Array.isArray(sourceValue)) {
                sourceValue = [sourceValue];
              }
              dest[name] = destValue.concat(sourceValue);
            }
          } 
          else if (sourceValue && typeof sourceValue == "object") {
            dest[name] = merge(destValue, sourceValue);
          } 
          else if (!(destValue && !sourceValue)) {
            dest[name] = sourceValue;
          }
        }
      }
      return dest;
    }, dest || {});
  };

  return merge;
  
});