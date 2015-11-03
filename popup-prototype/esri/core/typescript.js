define([
  "./declare",
  "dojo/_base/lang"
], function(
  declare,
  lang
) {

  var typescript = {
    declareDefinition: function(target, mixins) {
      var bases = [];

      var proto = Object.getPrototypeOf(target.prototype);

      if (proto !== Object.prototype) {
        bases.push(proto.constructor);
      }

      if (mixins) {
        bases = bases.concat(mixins);
      }

      var instanceMembers = {
      };

      var names = Object.getOwnPropertyNames(target.prototype);

      // Copy over all the members of the prototype to our declare definition
      for (var i = 0; i < names.length; i++) {
        var name = names[i];

        if (name === "constructor") {
          // Skip the constructor, it won't really work well with the required
          // typescript super call.
          continue;
        }

        var defName = name;

        // Rename special dojoConstructor to actual constructor
        if (name === "dojoConstructor") {
          defName = "constructor";
        }

        instanceMembers[defName] = target.prototype[name];
      }

      // Copy all the static class members
      names = Object.getOwnPropertyNames(target);
      var skip = Object.getOwnPropertyNames(proto.constructor);

      var classMembers = {};

      for (i = 0; i < names.length; i++) {
        name = names[i];

        if (skip.indexOf(name) === -1) {
          classMembers[name] = target[name];
        }
      }

      return {
        bases: bases,
        instanceMembers: instanceMembers,
        classMembers: classMembers
      };
    },

    subclass: function(mixins) {
      return function(target) {
        var def = typescript.declareDefinition(target, mixins);
        return lang.mixin(declare(def.bases, def.instanceMembers), def.classMembers);
      };
    },

    shared: function(value) {
      return function(target, name) {
        target[name] = value;
      };
    }
  };

  return typescript;
});
