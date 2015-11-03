define([
  "../../core/Accessor",

  "./constraints/ZoomConstraint"
], function(
  Accessor,
  ZoomConstraints
) {

  /*
  var Zoom = Accessor.createSubclass({
    classMetadata: {
      computed: {
        min: ["constraint.minZoom"],
        max: ["constraint.maxZoom"]
      }
    },
   
    //----------------------------------
    //  min
    //----------------------------------

    _minGetter: function() {
      return this.constraint.minZoom;
    },

    _minSetter: function(value) {
      this.constraint.minZoom = value;
    },

    //----------------------------------
    //  max
    //----------------------------------

    _maxGetter: function() {
      return this.constraint.maxZoom;
    },

    _maxSetter: function(value) {
      this.constraint.maxZoom = value;
    }
    
  });


  var Scale = Accessor.createSubclass({

    classMetadata: {
      computed: {
        min: ["constraint.minScale"],
        max: ["constraint.maxScale"]
      }
    },
   
    //----------------------------------
    //  min
    //----------------------------------

    _minGetter: function() {
      return this.constraint.minScale;
    },

    _minSetter: function(value) {
      this.constraint.minScale = value;
    },

    //----------------------------------
    //  max
    //----------------------------------

    _maxGetter: function() {
      return this.constraint.maxScale;
    },

    _maxSetter: function(value) {
      this.constraint.maxScale = value;
    }
    
  });
  */

  

  return Accessor.createSubclass({

    classMetadata: {
      computed: {
        snapToZoom: ["zoom.snapToZoom"],
        minScale: ["zoom.minScale"],
        maxScale: ["zoom.maxScale"],
        minZoom: ["zoom.minZoom"],
        maxZoom: ["zoom.maxZoom"]
      }
    },

    //--------------------------------------------------------------------------
    //
    //  Lifecycle
    //
    //--------------------------------------------------------------------------

    normalizeCtorArgs: function(kwArgs) {
      return {
        zoom: new ZoomConstraints({
          tileInfo: kwArgs.tileInfo,
          minScale: kwArgs.minScale,
          maxScale: kwArgs.maxScale,
          minZoom: kwArgs.minZoom,
          maxZoom: kwArgs.maxZoom,
          snapToZoom: kwArgs.snapToZoom
        })
      };
    },

    destroy: function() {
      this.zoom = null;
    },
    
    //--------------------------------------------------------------------------
    //
    //  Properties
    //
    //--------------------------------------------------------------------------

    //----------------------------------
    //  enabled
    //----------------------------------

    enabled: true,

    //----------------------------------
    //  minScale
    //----------------------------------

    _minScaleGetter: function() {
      return this.zoom.minScale;
    },

    _minScaleSetter: function(value) {
      this.zoom.minScale = value;
    },

    //----------------------------------
    //  maxScale
    //----------------------------------

    _maxScaleGetter: function() {
      return this.zoom.maxScale;
    },

    _maxScaleSetter: function(value) {
      this.zoom.maxScale = value;
    },
   
    //----------------------------------
    //  minZoom
    //----------------------------------

    _minZoomGetter: function() {
      return this.zoom.minZoom;
    },

    _minZoomSetter: function(value) {
      this.zoom.minZoom = value;
    },

    //----------------------------------
    //  maxZoom
    //----------------------------------

    _maxZoomGetter: function() {
      return this.zoom.maxZoom;
    },

    _maxZoomSetter: function(value) {
      this.zoom.maxZoom = value;
    },

    //----------------------------------
    //  snapToZoom
    //----------------------------------

    _snapToZoomGetter: function() {
      return this.zoom.snapToZoom;
    },

    _snapToZoomSetter: function(value) {
      this.zoom.snapToZoom = value;
    },

    //--------------------------------------------------------------------------
    //
    //  Public Methods
    //
    //--------------------------------------------------------------------------

    constrain: function(target, current, view) {
      if (!this.enabled) {
        return target;
      }
      this.zoom.constrain(target, current, view);
      return target;
    }

  });

});