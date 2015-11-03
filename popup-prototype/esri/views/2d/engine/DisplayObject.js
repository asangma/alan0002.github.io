/*jslint browser: true, continue: true, eqeq: true, nomen: true, plusplus: true, regexp: true, unparam: true, sloppy: true, todo: true, vars: true, white: true */
/*global define */

define(
[
  "../../../core/declare",
  "dojo/_base/lang",
  
  "../../../core/Accessor",
  
  "../math/common",
  "../math/mat2d",
  "../math/vec2",
  "./bitFlagUtil"
],
function(
  declare, lang,
  Accessor,
  common, mat2d, vec2, bitFlagUtil
) {

  var ID = 0;
  function generateID() {
    return "esri-display-object-" + ID++;
  }

  var FLAG = 0; // with ID < 32;
  function generatePropFlags() {
    return 1 << FLAG++;
  }

  var FLAGS = {
    TRANSFORM: generatePropFlags(),
    VISIBLE:   generatePropFlags(),
    SIZE:      generatePropFlags(),
    BLENDMODE: generatePropFlags(),
    CLIP:      generatePropFlags(),
    OPACITY:   generatePropFlags()
  };

  var DisplayObject = declare(Accessor, {
    declaredClass: "esri.views.2d.engine.DisplayObject",

    classMetadata: {
      properties: {
        coords: {
          copy: vec2.copy
        },
        size: {
          copy: vec2.copy
        },
        surface: {},
        transform: {
          readOnly: true,
          dependsOn: ["rotation", "coords", "resolution", "size"]
        }
      }
    },

    //--------------------------------------------------------------------------
    //
    //  Lifecycle
    //
    //--------------------------------------------------------------------------

    constructor: function() {
      this.id = generateID();
    },

    //--------------------------------------------------------------------------
    //
    //  Variables
    //
    //--------------------------------------------------------------------------

    _flags: 0,

    _renderFlag: false,
    
    // bigger Y on top
    _flipY: true,

    //--------------------------------------------------------------------------
    //
    //  Properties
    //
    //--------------------------------------------------------------------------

    tag: null,

    className: "esri-display-object",
    
    //----------------------------------
    //  blendMode
    //----------------------------------

    blendMode: "none",
    
    _blendModeSetter: function(value, oldValue) {
      if (oldValue === value) { return oldValue; }
      this._invalidateFlag(FLAGS.BLENDMODE);
      return value;
    },

    //----------------------------------
    //  clip
    //----------------------------------

// TODO YCA
//   clip: null,
//   _clipSetter: function(value) {
//     if (this.clip === value) { return; }
//     this.clip = value;
//     this._invalidateFlag(FLAGS.CLIP);
//   },

    //----------------------------------
    //  coords
    //----------------------------------

    coords: null,
    _coordsSetter: function(value, oldValue) {
      this._invalidateFlag(FLAGS.TRANSFORM);
      return vec2.copy(oldValue || vec2.create(), value);
    },

    //----------------------------------
    //  opacity
    //----------------------------------

    opacity: 1.0,
    _opacitySetter: function(value, oldValue) {
      value = Math.min(1.0, Math.max(value, 0));
      if (oldValue === value) { return oldValue; }
      this._invalidateFlag(FLAGS.OPACITY);
      return value;
    },

    //----------------------------------
    //  parent
    //----------------------------------

    parent: null,
    _parentSetter: function(value, oldValue) {
      if (oldValue === value) { return oldValue; }
      if (value) {
        if (this._renderFlag) {
          value.requestChildRender(this);
        }
      }
      return value;
    },

    //----------------------------------
    //  resolution
    //----------------------------------

    resolution: NaN,
    _resolutionSetter: function(value, oldValue) {
      if (oldValue === value) { return oldValue; }
      this._invalidateFlag(FLAGS.TRANSFORM);
      return value;
    },

    //----------------------------------
    //  rotation
    //----------------------------------

    rotation: 0,
    _rotationSetter: function(value, oldValue) {
      if (oldValue === value) { return oldValue; }
      this._invalidateFlag(FLAGS.TRANSFORM);
      return value || 0;
    },

    //----------------------------------
    //  transform
    //----------------------------------

    _transformGetter: function(transform) {
      var coords = this.coords;
      var size = this.size;
      var res = this.resolution;
      var rotation = this.rotation;

      if (coords) {
        if (!res) {
          if (!transform || transform.length !== 2) {
            return vec2.clone(coords);
          }
          vec2.copy(transform, coords);
        }

        else {
          if (!transform || transform.length !== 6) {
            transform = mat2d.create();
          }
          size && mat2d.translate(transform, transform, size);
          mat2d.scale(transform, transform, vec2.fromValues(1/res, (this._flipY ? -1 : 1) * (1/res)));
          mat2d.rotate(transform, transform, common.toRadian(rotation));
          mat2d.translate(transform, transform, vec2.negate(vec2.create(), coords));
        }
      }
      else if (rotation) {
        if (!transform || transform.length !== 6) {
          transform = mat2d.create();
        }
        mat2d.rotate(transform, transform, common.toRadian(rotation));
      }
      return transform;
    },

    //----------------------------------
    //  size
    //----------------------------------

    size: null,
    _sizeSetter: function(value, oldValue) {
      if (oldValue === value) { return oldValue; }
      this._invalidateFlag(FLAGS.SIZE);
      return vec2.copy(oldValue || vec2.create(), value);
    },
    
    //----------------------------------
    //  visible
    //----------------------------------

    visible: true,
    _visibleSetter: function(value, oldValue) {
      if (oldValue === value) { return oldValue; }
      this._invalidateFlag(FLAGS.VISIBLE);
      return value;
    },


    //--------------------------------------------------------------------------
    //
    //  Public function
    //
    //--------------------------------------------------------------------------

    requestRender: function() {
      var parent = this.parent;
      if (!this._renderFlag) {
        this._renderFlag = true;
        if (parent) {
          parent.requestChildRender(this);
        }
      }
    },

    createSurface: function() {
      if (!this.surface) {
        var surface = document.createElement("div");
        surface.className = this.className;
        this.surface = surface;
      }
      return this.surface;
    },

    reflow: function(context) {
    },

    render: function(context) {
      var flags = this._flags;
      this._renderFlag = false;
      this._flags = 0;
      if (flags) {
        if (bitFlagUtil.isSet(flags, DisplayObject.SIZE)) {
          context.setSize(this.width, this.height);
        }
        if (bitFlagUtil.isSet(flags, DisplayObject.VISIBLE)) {
          context.setVisibility(this.visible);
        }
        if (bitFlagUtil.isSet(flags, DisplayObject.BLENDMODE)) {
          context.setBlendMode(this.blendMode);
        }
        if (bitFlagUtil.isSet(flags, DisplayObject.OPACITY)) {
          context.setOpacity(this.opacity);
        }
      }
    },

    //--------------------------------------------------------------------------
    //
    //  Private functions
    //
    //--------------------------------------------------------------------------

    _invalidateFlag: function(flag) {
      this._flags = bitFlagUtil.set(this._flags, flag, true);
      this.requestRender();
    }


  });

  lang.mixin(DisplayObject, FLAGS);

  return DisplayObject;

});
