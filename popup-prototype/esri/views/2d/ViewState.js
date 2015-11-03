define(
[
  "../../core/declare",

  "./viewpointUtils",

  "./math/vec2",
  "./math/mat2d",

  "../../geometry/Extent",

  "../../core/Accessor"
],
function(
  declare,
  vpUtils,
  vec2, mat2d,
  Extent,
  Accessor
) {

//--------------------------------------------------------------------------
//
//  View
//
//--------------------------------------------------------------------------

var ViewState = declare(Accessor, {
  declaredClass: "esri.views.2d.ViewState",

  classMetadata: {
    properties: {
      center: {
        copy: vec2.copy
      },
      extent: {
        copy: function(a, b) {
          a.xmin = b.xmin;
          a.ymin = b.ymin;
          a.xmax = b.xmax;
          a.ymax = b.ymax;
          a.spatialReference = b.spatialReference;
        }
      },
      inverseTransform: {
        readOnly: true,
        copy: mat2d.copy
      },
      screenCenter: {
        readOnly: true,
        copy: vec2.copy
      },
      transform: {
        readOnly: true,
        copy: mat2d.copy
      },
      transformNoRotation: {
        readOnly: true,
        copy: mat2d.copy
      },
      version: {
        readOnly: true
      },
      viewpoint: {
        copy: vpUtils.copy
      },
      worldScreenWidth: {
        readOnly: true
      },
      worldWidth: {
        readOnly: true
      },
      wrappable: {
        readOnly: true
      }
    },
    computed: {
      center:               ["viewpoint"],
      spatialReference:     ["viewpoint"],
      rotation:             ["viewpoint"],
      scale:                ["viewpoint"],
      resolution:           ["viewpoint"],
      x:                    ["center"],
      y:                    ["center"],
      inverseTransform:     ["transform"],
      latitude:             ["viewpoint"],
      longitude:            ["viewpoint"],
      screenCenter:         ["size"],
      width:                ["size"],
      height:               ["size"],
      extent:               ["viewpoint", "size"],
      transform:            ["viewpoint", "size"],
      transformNoRotation:  ["viewpoint", "size"],
      version:              ["transform"],
      worldScreenWidth:     ["worldWidth", "resolution"],
      worldWidth:           ["spatialReference"],
      wrappable:            ["spatialReference"]
    }
  },

  //--------------------------------------------------------------------------
  //
  //  Lifecyle
  //
  //--------------------------------------------------------------------------

  //--------------------------------------------------------------------------
  //
  //  Properties
  //
  //--------------------------------------------------------------------------

  //----------------------------------
  //  center
  //----------------------------------

  _centerGetter: function(cached) {
    var center = this.viewpoint.targetGeometry;
    if (!cached) {
      return vec2.fromValues(center.x, center.y);
    }
    return vec2.set(cached, center.x, center.y);
  },

  //----------------------------------
  //  extent
  //----------------------------------

  _extentGetter: function(cached) {
    if (!cached) {
      cached = new Extent();
    }
    return vpUtils.getExtent(cached, this.viewpoint, this.size);
  },

  //----------------------------------
  //  height
  //----------------------------------

  _heightGetter: function() {
    return this.size ? this.size[1] : 0;
  },

  //----------------------------------
  //  transform
  //----------------------------------

  _inverseTransformGetter: function(cached) {
    if (!cached) {
      cached = mat2d.create();
    }
    return mat2d.invert(cached, this.transform);
  },

  //----------------------------------
  //  latitude
  //----------------------------------

  _latitudeGetter: function() {
    return this.viewpoint.targetGeometry.latitude;
  },
  
  //----------------------------------
  //  longitude
  //----------------------------------

  _longitudeGetter: function() {
    return this.viewpoint.targetGeometry.longitude;
  },

  //----------------------------------
  //  resolution
  //----------------------------------

  _resolutionGetter: function() {
    return vpUtils.getResolution(this.viewpoint);
  },

  //----------------------------------
  //  rotation
  //----------------------------------

  _rotationGetter: function() {
    return this.viewpoint.rotation;
  },

  //----------------------------------
  //  scale
  //----------------------------------

  _scaleGetter: function() {
    return this.viewpoint.scale;
  },

  //----------------------------------
  //  screenCenter
  //----------------------------------

  _screenCenterGetter: function(cached) {
    var size = this.size;
    if (!cached) {
      cached = vec2.create();
    }
    return vec2.scale(cached, size, 0.5);
  },

  //----------------------------------
  //  spatialReference
  //----------------------------------

  _spatialReferenceGetter: function() {
    return this.viewpoint.targetGeometry.spatialReference;
  },

  //----------------------------------
  //  transform
  //----------------------------------

  _transformGetter: function(cached) {
    if (!cached) {
      cached =  mat2d.create();
    }
    return vpUtils.getTransform(cached, this.viewpoint, this.size);
  },

  //----------------------------------
  //  transformNoRotation
  //----------------------------------

  _transformNoRotationGetter: function(cached) {
    if (!cached) {
      cached =  mat2d.create();
    }
    return vpUtils.getTransformNoRotation(cached, this.viewpoint, this.size);
  },
  
  //----------------------------------
  //  size
  //----------------------------------

  /**
   * Array<Number>
   */
  size: null,

  //----------------------------------
  //  version
  //----------------------------------

  version: 0,
  
  _versionGetter: function(oldValue) {
    return oldValue + 1;
  },

  //----------------------------------
  //  viewpoint
  //----------------------------------

  /**
   * esri/Viewpoint
   */
  viewpoint: null,

  _viewpointSetter: function(value, cached) {
    if (!cached) {
      return value.clone();
    }
    return vpUtils.copy(cached, value);
  },

  //----------------------------------
  //  width
  //----------------------------------

  _widthGetter: function() {
    return this.size ? this.size[0] : 0;
  },

  //----------------------------------
  //  worldScreenWidth
  //----------------------------------

  _worldScreenWidthGetter: function() {
    return this.worldWidth / this.resolution;
  },

  //----------------------------------
  //  worldWidth
  //----------------------------------

  _worldWidthGetter: function() {
    if (this.wrappable) {
      var sr = this.spatialReference;
      var info = sr._getInfo();

      return info.valid[1] - info.valid[0];
    }
    return 0;
  },

  //----------------------------------
  //  wrappable
  //----------------------------------

  _wrappableGetter: function() {
    return !!this.spatialReference && this.spatialReference.isWrappable();
  },

  //----------------------------------
  //  x
  //----------------------------------

  _xGetter: function() {
    return this.center[0];
  },
  
  //----------------------------------
  //  y
  //----------------------------------

  _yGetter: function() {
    return this.center[1];
  },

  //--------------------------------------------------------------------------
  //
  //  Public Methods
  //
  //--------------------------------------------------------------------------

  copy: function(state) {
    return this.set({
      viewpoint: state.viewpoint,
      size: state.size
    });
  },

  clone: function() {
    return new ViewState({
      viewpoint: this.viewpoint.clone(),
      size: vec2.clone(this.size)
    });
  },

  /**
   * 
   */
  toMap: function(out, coords) {
    return vec2.transformMat2d(
      out,
      coords,
      this.inverseTransform
    );
  },
  
  /**
   */
  toScreen: function(out, coords) {
    return vec2.transformMat2d(
      out,
      coords,
      this.transform
    );
  },

  pixelSizeAt: function(coords) {
    var vp = this.viewpoint;
    return vpUtils.pixelSizeAt(coords, vp, this.size);
  }


});

return ViewState;

});
