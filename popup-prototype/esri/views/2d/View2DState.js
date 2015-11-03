/*jslint browser: true, continue: true, eqeq: true, nomen: true, plusplus: true, regexp: true, unparam: true, sloppy: true, todo: true, vars: true, white: true, bitwise: true */
/*global define */

define(
[
  "../../core/declare",
  "dojo/_base/lang",
  
  "../../geometry/Point",
  "../../geometry/ScreenPoint",
  "../../geometry/Extent",
  "../../geometry/support/scaleUtils"
],
function(
  declare, lang,
  Point, ScreenPoint, Extent, scaleUtils
) {

  var Matrix2D, bitFlagUtil, Accessor;

var INCH_PER_METER = 39.37,
    DECDEG_PER_METER = 20015077.0 / 180.0,
    EARTH_RADIUS = 6378137,
    RAD_PER_DEG =  Math.PI / 180,
    DEG_PER_RAD =  180 / Math.PI,

    degToRad = function(deg) {
      return deg * RAD_PER_DEG;
    },
    radToDeg = function(rad) {
      return rad * DEG_PER_RAD;
    },
    normalize = function(pt, outSR) {
      if (!pt || !outSR) {
        return pt;
      }
      var inSR = pt.spatialReference;
      if (outSR && inSR && !outSR.equals(inSR) && outSR._canProject(inSR)) {
        return outSR.isWebMercator() ?
                Point.lngLatToXY(pt.x, pt.y) :
                Point.xyToLngLat(pt.x, pt.y, true);
      }
      return [pt.x, pt.y];
    };


//   function _getScale(extent, mapWd, unitValue) {
//     return (extent && mapWd) ? 
//            ((extent.getWidth() / mapWd) * (unitValue || DECDEG_PER_METER) * INCH_PER_METER * ecd.screenDPI) :
//            0;
//   }

//   function _getExtentForScale(extent, mapWd, wkid, scale, /*internal*/ wkidIsUnitValue) {
//     var unitValue;
//     if (wkidIsUnitValue) {
//       unitValue = wkid;
//     }
//     else {
//       unitValue = lookup.values[lookup[wkid]];
//     }
    
//     return extent.expand(
//       ((scale * mapWd) / ((unitValue || DECDEG_PER_METER) * INCH_PER_METER * ecd.screenDPI)) / extent.getWidth()
//     );
//   }

//--------------------------------------------------------------------------
//
//  Internals
//
//--------------------------------------------------------------------------

var PROP_TRANSFORM_FLAG    = 1 << 0,
    PROP_INVERSE_FLAG      = 1 << 1,
    PROP_SIZE_FLAG         = 1 << 2,
    PROP_EXTENT_FLAG       = 1 << 3,
    PROP_INNER_EXTENT_FLAG = 1 << 4,
    ALL_TRANSFORM = PROP_TRANSFORM_FLAG | PROP_INVERSE_FLAG | PROP_EXTENT_FLAG | PROP_INNER_EXTENT_FLAG;
function invalidateSize(state) {
  state._flags = state._flags | PROP_SIZE_FLAG;
}
function invalidateTransform(state) {
  state._flags = state._flags | ALL_TRANSFORM;
}
var utilityMatrix = new Matrix2D();
var utilityPoint  = {};

//--------------------------------------------------------------------------
//
//  View
//
//--------------------------------------------------------------------------

var View2DState = declare(Accessor, {
  declaredClass: "esri.views.2d.View2DState",

  //--------------------------------------------------------------------------
  //
  //  Lifecyle
  //
  //--------------------------------------------------------------------------

  normalizeCtorArgs: function(p) {
    if (!p) {
      return null;
    } 
    if (p.declaredClass === this.declaredClass) {
      return {
        screenDPI: p.screenDPI,
        spatialReference: p.spatialReference,
        x: p.x,
        y: p.y,
        scale: p.scale,
        rotation: p.rotation,
        width: p.width,
        height: p.height,
        viewPadding: p.viewPadding
      };
    }
    if (p.extent) {
      // Extent is a special case.
      // Set the other state properties first to computed the inner rectangle.
      // Then fit the extent in the inner rectangle.
      return {
        spatialReference: p.extent.spatialReference,
        screenDPI:   p.screenDPI || 96.0,
        width:       p.width,
        height:      p.height,
        rotation:    p.rotation,
        viewPadding: p.viewPadding,
        extent:      p.extent
      };
    }
    return p;
  },


  //--------------------------------------------------------------------------
  //
  //  Variables
  //
  //--------------------------------------------------------------------------
  
  _flags: ALL_TRANSFORM,


  //--------------------------------------------------------------------------
  //
  //  Properties: Read-Write
  //
  //--------------------------------------------------------------------------

  //----------------------------------
  //  scaleToResolution
  //----------------------------------

  scaleToResolution: NaN,

  //----------------------------------
  //  resolutionToScale
  //----------------------------------

  resolutionToScale: NaN,

  //----------------------------------
  //  screenDPI
  //----------------------------------

  screenDPI: 96.0,

  _screenDPISetter: function(value) {
    if (this.screenDPI === value) { return; }
    this.screenDPI = value;
    this.scaleToResolution = this.unitToMeter / INCH_PER_METER / this.screenDPI;
    this.resolutionToScale = this.unitToMeter * INCH_PER_METER * this.screenDPI;
  },
  
  //----------------------------------
  //  spatialReference
  //----------------------------------
  
  _spatialReferenceSetter: function(value) {
    if (this.spatialReference === value) { return; }
    this.spatialReference = value;
    this.unitToMeter = scaleUtils.getUnitValue(value);
    this.scaleToResolution = this.unitToMeter / INCH_PER_METER / this.screenDPI;
    this.resolutionToScale = this.unitToMeter * INCH_PER_METER * this.screenDPI;
    // TODO YCA: should we project...
    this._flags = bitFlagUtil.set(this._flags, PROP_EXTENT_FLAG, true);
    this._flags = bitFlagUtil.set(this._flags, PROP_INNER_EXTENT_FLAG, true);
  },
  
  //----------------------------------
  //  x
  //----------------------------------
  
  x: 0,
  _xSetter: function(value) {
    if (this.x === value) { return; }
    this.x = value;
    invalidateTransform(this);
  },
  
  //----------------------------------
  //  y
  //----------------------------------
  
  y: 0,
  _ySetter: function(value) {
    if (this.y === value) { return; }
    this.y = value;
    invalidateTransform(this);
  },

  //----------------------------------
  //  scale
  //----------------------------------
  
  _scaleSetter: function(value) {
    if (this.scale === value) { return; }
    this.scale = value;
    this.resolution = value * this.scaleToResolution;
    invalidateTransform(this);
  },
  
  //----------------------------------
  //  rotation
  //----------------------------------
  
  _rotationSetter: function(value) {
    value = this._clampRotation(value);
    if (this.rotation === value) { return; }
    this.rotation = value;
    invalidateTransform(this);
    invalidateSize(this);
  },
  
  //----------------------------------
  //  width
  //----------------------------------
  
  _widthSetter: function(value) {
    if (this.width === value) { return; }
    this.width = value;
    invalidateTransform(this);
    invalidateSize(this);
  },
  
  //----------------------------------
  //  height
  //----------------------------------

  _heightSetter: function(value) {
    if (this.height === value) { return; }
    this.height = value;
    invalidateTransform(this);
    invalidateSize(this);
  },
  
  //----------------------------------
  //  innerWidth
  //----------------------------------
  
  _innerWidthGetter: function() {
    this._commitSize();
    return this.innerWidth;
  },
  
  //----------------------------------
  //  innerHeight
  //----------------------------------
  
  _innerHeightGetter: function() {
    this._commitSize();
    return this.innerHeight;
  },
  
  //----------------------------------
  //  innerExtent
  //----------------------------------
  
  _innerExtentGetter: function() {
    if (bitFlagUtil.isSet(this._flags, PROP_INNER_EXTENT_FLAG)) {
      var resolution = this.get("resolution");
      this._flags = bitFlagUtil.set(this._flags, PROP_INNER_EXTENT_FLAG, false);
      // validate the computed size of the state 
      this._commitSize();
      var hExtWidth  = resolution * this.innerWidth * 0.5,
          hExtHeight = resolution * this.innerHeight * 0.5,
          x = this.x,
          y = this.y;
      this.innerExtent = new Extent(x - hExtWidth, y - hExtHeight,
                                    x + hExtWidth, y + hExtHeight,
                                    this.spatialReference);
    }
    return this.innerExtent;
  },
  
  //----------------------------------
  //  center
  //----------------------------------
  
  _centerGetter: function() {
    return this.toMap(this.get("viewAnchor"));
  },
  
  _centerSetter: function(value) {
    this.centerAt(value);
  },
  
  //----------------------------------
  //  extent
  //----------------------------------
  
  _extentGetter: function() {
    if (bitFlagUtil.isSet(this._flags, PROP_EXTENT_FLAG)) {
      var resolution = this.get("resolution");
      this._flags = bitFlagUtil.set(this._flags, PROP_EXTENT_FLAG, false);
      // validate the computed size of the state 
      var paddedCenter = this.toMap(this.get("viewAnchor")),
          hExtWidth    = resolution * this._fittingWidth * 0.5,
          hExtHeight   = resolution * this._fittingHeight * 0.5,
          x = paddedCenter.x,
          y = paddedCenter.y;
      this.extent = new Extent(x - hExtWidth, y - hExtHeight,
                               x + hExtWidth, y + hExtHeight,
                               this.spatialReference);
    }
    return this.extent;
  },
  
  _extentSetter: function(value) {
    if (!value) { return; }
    this._commitSize();
    
    var fitWidth   = this._fittingWidth,
        fitHeight  = this._fittingHeight,
        extWidth   = value.get("width"),
        extHeight  = value.get("height"),
        extCenter  = value.get("center");

    if (!(extWidth > 0 && extHeight > 0) || fitWidth === 0 || fitHeight === 0) {
      // TBD: Throw an error or return an invalid scale?
      return;
    }

    this.set({
      x: extCenter.x,
      y: extCenter.y,
      scale: Math.max(extWidth/fitWidth, extHeight/fitHeight) * this.resolutionToScale,
      spatialReference: value.spatialReference
    });
    this.centerAt(extCenter.x, extCenter.y);
  },
  
  //----------------------------------
  //  transform
  //----------------------------------
  
  _transformGetter: function() {
    if (bitFlagUtil.isSet(this._flags, PROP_TRANSFORM_FLAG)) {
      this._flags = bitFlagUtil.set(this._flags, PROP_TRANSFORM_FLAG, false);
      if (!this.transform) {
        this.transform = new Matrix2D();
      }
      this.transform.identity()
                    .translate(-this.x, -this.y)
                    .rotateg(-this.rotation)
                    .scale(1 / this.resolution, -1 / this.resolution)
                    .translate(this.width * 0.5, this.height * 0.5);
    }
    return this.transform;
  },
  
  //----------------------------------
  //  inverse
  //----------------------------------
  
  _inverseGetter: function() {
    if (bitFlagUtil.isSet(this._flags, PROP_INVERSE_FLAG)) {
      this._flags = bitFlagUtil.set(this._flags, PROP_INVERSE_FLAG, false);
      if (!this.inverse) {
        this.inverse = new Matrix2D();
      }
      var transform = this.get("transform");
      this.inverse.copy(transform).invert();
    }
    return this.inverse;
  },
  
  //----------------------------------
  //  viewAnchor
  //----------------------------------
  
  _viewAnchorGetter: function() {
    this._commitSize();
    return this.viewAnchor;
  },
  
  //----------------------------------
  //  padding
  //----------------------------------
  
  _viewPaddingSetter: function(value) {
    this.viewPadding = lang.mixin({
      left: 0,
      top: 0,
      right: 0,
      bottom: 0
    }, value || {});
    // TODO Yann: View padding in %. either percentLeft or left to be a String
    invalidateTransform(this);
    invalidateSize(this);
  },
  
  //----------------------------------
  //  longitude
  //----------------------------------
  
  _longitudeGetter: function(value) {
    var lngDeg = radToDeg(this.x / EARTH_RADIUS);
    return lngDeg - (Math.floor((lngDeg + 180) / 360) * 360);
  },
  
  //----------------------------------
  //  latitude
  //----------------------------------
  
  _latitudeGetter: function(value) {
    return radToDeg((Math.PI / 2) - (2 * Math.atan(Math.exp(-1.0 * this.y / EARTH_RADIUS))));
  },
  
  //--------------------------------------------------------------------------
  //
  //  Public Methods
  //
  //--------------------------------------------------------------------------
  
  //----------------------------------
  //  Coordinate projection
  //----------------------------------
  
  // Converts the given screen point to map coordinates.
  // return a Point
  toMap: function(x, y, point) {
    var _x = x, _y = y;
    if (x && x.x != null) {
      _x = x.x;
      _y = x.y;
      point = y;
    }
    if (!point) {
      point = new Point(0, 0, this.spatialReference);
    }
    else {
      point.spatialReference = this.spatialReference;
    }
    return this.get("inverse").transform(_x, _y, point);
  },
  
  // Converts the given map point to screen coordinates.
  // return a ScreenPoint
  toScreen: function(x, y, point) {
    var _x = x, _y = y,
        outSR = this.spatialReference,
        inSR, projected;
    if (x && x.x != null) {
      _x = x.x;
      _y = x.y;
      inSR = x.spatialReference;
      point = y;
    }
    
    if (outSR && inSR && !outSR.equals(inSR) && outSR._canProject(inSR)) {
      projected = outSR.isWebMercator() ?
                    Point.lngLatToXY(_x, _y) :
                    Point.xyToLngLat(_x, _y, true);
      _x = projected[0];
      _y = projected[1];
    }
    
    if (!point) {
      point = new ScreenPoint();
    }
    point = this.get("transform").transform(_x, _y, point);
    // TODO YCA: implement doNotRound?
    //if (!doNotRound) {
    //  point.x = Math.round(point.x);
    //  point.y = Math.round(point.y);
    //}
    return point;
  },
  
  //----------------------------------
  //  View helpers
  //----------------------------------
  
  // Translate by x/y delta.
  // In screen coordinate space
  //   dX  the delta x in pixels
  //   dY  the delta y in pixels
  translate: function(dX, dY) {
    utilityPoint = utilityMatrix.identity()
                                .rotateg(this.rotation)
                                .scale(this.resolution)
                                .transform(dX, dY, utilityPoint);
    this.x = this.x + utilityPoint.x;
    this.y = this.y + utilityPoint.y;
    invalidateTransform(this);
    return this;
  },

  // Zoom by a factor
  //   factor  the zoom factor
  //   anchor  the anchor point in pixels
  scaleBy: function(factor, anchor) {
    anchor = anchor || this.get("viewAnchor");
    if (factor !== 0) {
      utilityPoint = this.toMap(anchor, utilityPoint);
      this.set("scale", this.scale / factor);
      utilityPoint = this.toScreen(utilityPoint, utilityPoint);
      this.translate(utilityPoint.x - anchor.x, anchor.y - utilityPoint.y);
    }
    return this;
  },

  // Zoom by a factor
  //   factor  the zoom factor
  //   anchor  the anchor point in pixels
  scaleTo: function(scale, anchor) {
    if (this.scale === scale || scale === 0) { return this; }
    anchor = anchor || this.get("viewAnchor");
    utilityPoint = this.toMap(anchor, utilityPoint);
    this.set("scale", scale);
    utilityPoint = this.toScreen(utilityPoint, utilityPoint);
    this.translate(utilityPoint.x - anchor.x, anchor.y - utilityPoint.y);
    return this;
  },
  
  // Rotate to an angle around a pivot point
  rotateTo: function(angle, anchor) {
    anchor = anchor || this.get("viewAnchor");
    if (this.rotation !== angle) {
      utilityPoint = this.toMap(anchor, utilityPoint);
      this.set("rotation", angle);
      utilityPoint = this.toScreen(utilityPoint, utilityPoint);
      this.translate(utilityPoint.x - anchor.x, anchor.y - utilityPoint.y);
    }
    return this;
  },
  
  // Rotate by an angle around a pivot point
  rotateBy: function(dAngle, anchor) {
    anchor = anchor || this.get("viewAnchor");
    if (dAngle) {
      utilityPoint = this.toMap(anchor, utilityPoint);
      this.set("rotation", this.rotation + dAngle);
      utilityPoint = this.toScreen(utilityPoint, utilityPoint);
      this.translate(utilityPoint.x - anchor.x, anchor.y - utilityPoint.y);
    }
    return this;
  },
  
  resize: function(width, height, align) {
    if (this.width === width && this.height === height) { return; }
    if (!align) {
      align = "center";
    }
    var anchor = this.get("viewAnchor"), dX, dY;
    utilityPoint = this.toMap(anchor, utilityPoint);
    this.set({
      width: width,
      height: height
    });
    utilityPoint = this.toScreen(utilityPoint, utilityPoint);
    dX = utilityPoint.x - anchor.x;
    dY = anchor.y - utilityPoint.y;
    switch (align) {
      case "left":
        this.translate(dX, 0);
        break;
      case "top":
        this.translate(0, dY);
        break;
      case "right":
        this.translate(-dX, 0);
        break;
      case "bottom":
        this.translate(0, -dY);
        break;
      case "top-left":
        this.translate(dX, dY);
        break;
      case "bottom-left":
        this.translate(dX, -dY);
        break;
      case "top-right":
        this.translate(-dX, dY);
        break;
      case "bottom-right":
        this.translate(-dX, -dY);
        break;
    }
    return this;
  },
  
  centerAt: function(x, y) {
    var normalized = null;
    
    this._commitSize();
    if (x && x.x != null) {
      normalized = normalize(x, this.spatialReference);
      x = normalized[0];
      y = normalized[1];
    }
    else if (x && lang.isArray(x)) {
      normalized = normalize(new Point(x[0], x[1]), this.spatialReference);
      x = normalized[0];
      y = normalized[1];
    }
    utilityPoint = this.toMap(this.get("viewAnchor"), utilityPoint);
    this.set({
      x: this.x - (utilityPoint.x - x),
      y: this.y - (utilityPoint.y - y)
    });
  },
  
  copy: function(state) {
    return this.set({
      x: state.x,
      y: state.y,
      spatialReference: state.spatialReference,
      scale: state.scale,
      rotation: state.rotation,
      width: state.width,
      height: state.height,
      viewPadding: state.viewPadding
    });
  },
  
  clone: function() {
    return new View2DState(this);
  },
  

  //--------------------------------------------------------------------------
  //
  //  Private Functions
  //
  //--------------------------------------------------------------------------
  
  _clampRotation: function(value) {
    if (!value) {
      return 0;
    }
    if (value > 180 || value < -180) {
      value = value % 360;
      if (value > 180) {
        value = value - 360;
      } else if (value < -180) {
        value = value + 360;
      }
    }
    return value;
  },
  
  _commitSize: function() {
    if (bitFlagUtil.isSet(this._flags, PROP_SIZE_FLAG)) {
      this._flags = bitFlagUtil.set(this._flags, PROP_SIZE_FLAG, false);
      
      var r = degToRad(this.rotation),
          cos = Math.abs(Math.cos(r)),
          sin = Math.abs(Math.sin(r)),
          w = this.width,
          h = this.height,
          padding = this.viewPadding,
          anchor  = this.viewAnchor;
          
      if (!anchor) {
        this.viewAnchor = anchor = new ScreenPoint();
      }
      if (padding) {
        this._paddedWidth  = w - padding.left - padding.right;
        this._paddedHeight = h - padding.top - padding.bottom;
        anchor.x = padding.left + this._paddedWidth * 0.5;
        anchor.y = padding.top + this._paddedHeight * 0.5;
      }
      else {
        this._paddedWidth = w;
        this._paddedHeight = h;
        anchor.x = this.width * 0.5;
        anchor.y = this.height * 0.5;
      }
      
      // 2. Calculate the bounds in which the extent will fit in.
      w = this._paddedWidth;
      h = this._paddedHeight;
      // http://stackoverflow.com/questions/941873/about-rectangle-rotation-and-fitting
      this._fittingHeight = Math.round(Math.min(( h * h / ( w * sin + h * cos ) ), ( h * w / ( w * cos + h * sin ) )));
      this._fittingWidth  = Math.round(this._fittingHeight * w / h);
      // console.log("fitting size: (" + this._fittingWidth + ", " + this._fittingHeight + ")");
      
      // 3. Calculate the real bounds of the map.
      w = this.width;
      h = this.height;
      this.innerWidth  = Math.round(h*sin + w*cos);
      this.innerHeight = Math.round(h*cos + w*sin);
      // console.log("inner size: (" + this.innerWidth + ", " + this.innerHeight + ")");
    }
  }
  
});

return View2DState;

});
