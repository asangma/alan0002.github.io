define([
  "../../../../core/declare"
], function(declare) {
  var LayerViewUpdatingPercentage = declare([], {
    classMetadata: {
      computed: {
        updatingPercentage: ["updating"]
      }
    },

    constructor: function() {
      this._updatingPercentage = 0;
    },

    _updatingPercentageGetter: function() {
      if (this.updating) {
        return this._updatingPercentage;
      } else {
        return 0;
      }
    },

    _updatingPercentageSetter: function(value) {
      this._updatingPercentage = value;
    }
  });

  return LayerViewUpdatingPercentage;
});
