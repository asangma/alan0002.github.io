define([
  "dojo/_base/declare",

  "./accessorSupport/introspect"
],
function(
  dojoDeclare,
  introspect
) {

  var ACCESSOR = "esri.core.Accessor";
  var afterIntrospectionMixins = [];

  var enrich = function enrich(ctor) {
    if (hasMixin(ctor, ACCESSOR)) {
      introspect(ctor);
      for (var i = 0, n = afterIntrospectionMixins.length; i < n; i++) {
        afterIntrospectionMixins[i](ctor);
      }
    }
    return ctor;
  };
  
  var hasMixin = function hasMixin(ctor, mixin) {
    var meta = ctor._meta;
    var bases = meta.bases;
    // Go through a the mixins besides the class itself at index 0 to find the mixin
    for (var i = bases.length - 1; i > 0; i--) {
      if (bases[i].prototype.declaredClass === mixin) {
        return true;
      }
    }
    return false;
  };

  var createSubclass = function createSubclass(mixins, props) {
    if(!(Array.isArray(mixins) || typeof mixins == "function")){
      props = mixins;
      mixins = undefined;
    }
    props = props || {};
    mixins = mixins || [];
    return declare([this].concat(mixins), props);
  };

  var declare = function declare(className, superclass, props) {
    var ctor = dojoDeclare(className, superclass, props);
    ctor.createSubclass = createSubclass;
    return enrich(ctor);
  };

  declare.hasMixin = hasMixin;
  declare.after = function(fn) {
    afterIntrospectionMixins.push(fn);
  };

  declare.safeMixin = dojoDeclare.safeMixin;

  return declare;
});