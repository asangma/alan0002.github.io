define([
  "./Accessor"
],
function(
  Accessor
) {

  return Accessor.createSubclass({

    //--------------------------------------------------------------------------
    //
    //  Lifecycle
    //
    //--------------------------------------------------------------------------

    constructor: function() {
      this._groups = {};
    },

    destroy: function() {
      this.removeAll();

      this._groups = null;
    },

    //--------------------------------------------------------------------------
    //
    //  Variables
    //
    //--------------------------------------------------------------------------

    _groups: null,

    //--------------------------------------------------------------------------
    //
    //  Properties
    //
    //--------------------------------------------------------------------------

    //----------------------------------
    //  size
    //----------------------------------

    _sizeGetter: function() {
      var total  = 0,
          groups = this._groups,
          key;

      for (key in groups) {
        total += groups[key].length;
      }

      return total;
    },

    //--------------------------------------------------------------------------
    //
    //  Public Methods
    //
    //--------------------------------------------------------------------------

    add: function(handles, name) {
      if (!handles ||
          !handles.remove && !handles.length) {
        return;
      }

      var group = this._getOrCreateGroup(name);

      if (typeof handles.remove === "function") {
        group.push(handles);
      }
      else {
        for (var i = 0, n = handles.length; i < n; i++) {
          group.push(handles[i]);
        }
      }

      this.notifyChange("size");
    },

    remove: function(name) {
      var group = this._getGroup(name);
      if (!group) {
        return;
      }

      for (var i = 0, n = group.length; i < n; i++) {
        group[i].remove();
      }
      group.length = 0;

      this.notifyChange("size");
    },

    removeAll: function() {
      var groups = this._groups,
          key;

      for (key in groups) {
        this.remove(key);

        delete groups[key];
      }
    },

    //--------------------------------------------------------------------------
    //
    //  Private Methods
    //
    //--------------------------------------------------------------------------

    _getOrCreateGroup: function(name) {
      return this._getGroup(name) || (this._groups[this._ensureGroupName(name)] = []);
    },

    _getGroup: function(name) {
      return this._groups[this._ensureGroupName(name)];
    },

    _ensureGroupName: function(name) {
      return name || "_default_";
    }

  });
});
