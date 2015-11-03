
define([
  "../declare",
  "../typescript",
  "../JSONSupport",
  "dojo/_base/lang"
], function(
  declare, coreTypescript, JSONSupport,
  lang
) {

  function deepMixinSimple(dest, source) {
    if (!dest) {
      return source;
    }

    if (!source) {
      return dest;
    }

    for (var k in source) {
      var destv = dest[k];
      var sourcev = source[k];

      if (Array.isArray(sourcev) && Array.isArray(destv)) {
        dest[k] = destv.concat(sourcev);
      } else if (typeof sourcev === "object" && typeof destv === "object") {
        dest[k] = deepMixinSimple(destv, sourcev);
      } else {
        dest[k] = sourcev;
      }
    }

    return dest;
  }

  var typescript = {
    subclass: function(mixins, classMetadata) {
      return function(target) {
        var def = coreTypescript.declareDefinition(target, mixins);

        if (classMetadata) {
          def.instanceMembers.classMetadata = deepMixinSimple(classMetadata, def.instanceMembers.classMetadata);
        }

        var meta = def.instanceMembers.classMetadata;

        if (meta && meta.properties) {
          for (var propName in meta.properties) {
            var prop = meta.properties[propName];

            if (prop && !prop.reader && prop.type) {
              if (prop.type === Date) {
                prop.reader = function (value) {
                  return value != null ? new Date(value) : null;
                };
              }
              else if (prop.type._meta.bases.indexOf(JSONSupport) !== -1) {
                prop.reader = (function (type) {
                  return function (value) {
                    return type.fromJSON(value);
                  };
                })(prop.type);
              }
            }
          }
        }

        return lang.mixin(declare(def.bases, def.instanceMembers), def.classMembers);
      };
    },

    shared: coreTypescript.shared,

    property: function(params) {
      return function(target, name) {
        target.classMetadata = target.classMetadata || {};
        target.classMetadata.properties = target.classMetadata.properties || {};
        target.classMetadata.properties[name] = params || {};
      };
    }
  };

  return typescript;
});
