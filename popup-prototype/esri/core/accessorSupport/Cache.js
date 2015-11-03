define([
  "./dictionary"
],
function(dictionary) {

  //--------------------------------------------------------------------------
  //
  //  Cache
  //
  //--------------------------------------------------------------------------

  var hasOwnProp = Object.prototype.hasOwnProperty;

  var Cache = function() {
    this.dirty = dictionary();
    this.values = dictionary();
  };
  Cache.prototype = {
    destroy: function() {
      this.dirty = null;
      this.values = null;
    },
    has: function(name) {
      return hasOwnProp.call(this.values, name);
    },
    get: function(name) {
      return this.values[name];
    },
    keys: function() {
      return Object.keys(this.values);
    },
    set: function(name, value) {
      this.dirty[name] = false;
      this.values[name] = value;
    },
    setDirty: function(name) {
      this.dirty[name] = true;
    },
    isDirty: function(name) {
      return this.dirty[name] === true;
    }
  };

  return Cache;
});