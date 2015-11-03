define([
  "../../../core/Accessor",
  "../../../core/Evented",
    "../../../core/watchUtils",
  "./Picker",
  "./mixins/CamerasMixin"
], function(
  Accessor, Evented, watchUtils,
  Picker,
  CamerasMixin
) {

  var Navigation = Accessor.createSubclass([CamerasMixin, Evented], {
    classMetadata: {
      properties: {
        interacting: {
          getter: function() {
            return this._interacting;
          },

          readOnly: true
        },

        mapUnitInMeters: {
          dependsOn: ["mapCoordsHelper"],
          getter: function() {
            return this.mapCoordsHelper ? this.mapCoordsHelper.mapUnitInMeters : 1;
          }
        }
      }
    },

    initialize: function() {
      this._renderCoordsHelperHandle = watchUtils.init(this.view, "renderCoordsHelper", function(helper) {
        this.renderCoordsHelper = helper;
      }.bind(this));

      this._mapCoordsHelperHandle = watchUtils.init(this.view, "mapCoordsHelper", this.updateMapCoordsHelper.bind(this));

      this.picker = new Picker(this, this.view);
      this._interacting = false;
    },

    destroy: function() {
      this._renderCoordsHelperHandle.remove();
      this._mapCoordsHelperHandle.remove();
    },

    updateMapCoordsHelper: function(mapCoordsHelper) {
      this.mapCoordsHelper = mapCoordsHelper;
      this.inherited(arguments);
    },

    begin: function(action) {
      if (this.pan && this.pan.continuous) {
        this.pan.continuous.stop();
      }

      this._interacting = true;
      this.notifyChange("interacting");
    },

    end: function(action) {
      this._interacting = false;
      this.notifyChange("interacting");
    }
  });

  return Navigation;
});
