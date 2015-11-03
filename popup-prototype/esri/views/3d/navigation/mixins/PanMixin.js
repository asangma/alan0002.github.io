/* jshint bitwise:false */
define([
  "../../../../core/declare"
], function(
  declare
) {

  var PanMixin = declare([], {
    declaredClass: "esri.views.3d.navigation.mixins.PanMixin",
    type: "pan",

    begin: function(point) {
      this.navigation.begin(this);
      this.active = true;
      this.emit("begin");
    },

    update: function(point) {
      this.emit("update");
    },

    end: function(point) {
      this.active = false;
      this.emit("end");
      this.navigation.end(this);
    },

    beginContinuous: function(dir) {
      this.navigation.begin(this);
      this.active = true;
      this.emit("begin");
    },

    updateContinuous: function(dt) {
      if (this.continuous && this.continuous.active) {
        this.emit("update");
      }
    },

    endContinuous: function(dir) {
      this.active = false;
      this.emit("end");
      this.navigation.end(this);
    }
  });

  return PanMixin;
});
