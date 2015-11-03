define([
  "./math/common",
  "./math/mat2d",
  "./math/vec2",

  "../../Viewpoint",

  "../../geometry/SpatialReference",
  "../../geometry/Geometry",
  "../../geometry/Point",
  "../../geometry/Extent",
  
  "../../geometry/support/webMercatorUtils",
  "../../geometry/support/scaleUtils"
], function(
  common, mat2d, vec2,
  Viewpoint,
  SpatialReference, Geometry, Point, Extent,
  webMercatorUtils, scaleUtils
) {

  /**
   * viewStateUtils
   *
   * Low-level module for fast viewpoint operations.
   */

  //--------------------------------------------------------------------------
  //
  //  Constrants
  //
  //--------------------------------------------------------------------------

  // yann6817: arcgis uses 39.37, 39.37003 works better for to screen/map back an forth conversion.
  var INCH_PER_METER = 39.37;

  var DECDEG_PER_METER = 6370997 * Math.PI / 180;
  var EARTH_RADIUS = 6378137;
  //var RAD_PER_DEG =  PI / 180;
  var DEG_PER_RAD =  180 / Math.PI;

  //--------------------------------------------------------------------------
  //
  //  Private Functions
  //
  //--------------------------------------------------------------------------

  var toLngLat = function toLngLat(out, a, isLinear) {
    var lng_deg = common.toDegree(a[0] / EARTH_RADIUS);
    return vec2.set(
      out,
      isLinear ? 
        lng_deg : 
        lng_deg - (Math.floor((lng_deg + 180) / 360) * 360),
      common.toDegree((PI * 0.5) - (2 * Math.atan(Math.exp(-1.0 * a[1] / EARTH_RADIUS))))
    );
  };
  
  var toXY = function toXY(out, a) {
    var sinLatRad = a[1];
    if (sinLatRad > 89.99999) {
      sinLatRad = 89.99999;
    }
    else if (sinLatRad < -89.99999) {
      sinLatRad = -89.99999;
    }
    sinLatRad = Math.sin(common.toRadian(sinLatRad));
    return vec2.set(
      out,
      common.toRadian(a[0]) * EARTH_RADIUS, 
      EARTH_RADIUS * 0.5 * Math.log( 
        (1.0 + sinLatRad) / 
        (1.0 - sinLatRad) 
      )
    );
  };

  var normalizeSR = function normalizeSR(out, a, inSR, outSR) {
    if (outSR && inSR && !outSR.equals(inSR) && outSR._canProject(inSR)) {
      if (outSR.isWebMercator()) {
        return outSR.isWebMercator() ?
          toXY(out, a) :
          toLngLat(out, a);
      }
    }
    return vec2.copy(out, a);
  };

  var getSR = function getSR(obj) {
    return obj.wkid ? obj : obj.spatialReference || SpatialReference.WGS84;
  };

  var pointToVec2 = function pointToVec2(out, c) {
    return c.type ? vec2.set(out, c.x, c.y) : vec2.copy(out, c);
  };
  
  var getUnitToMeter = function getUnitToMeter(spatialReference) {
    return scaleUtils.getUnitValueForSR(spatialReference) || DECDEG_PER_METER;
  };

  var extentToScale = function extentToScale(extent, size) {
    var extWidth   = extent.width,
        extHeight  = extent.height;
    return Math.max(extWidth/size[0], extHeight/size[1]) * getResolutionToScaleFactor(extent.spatialReference);
  };
  
  var computeViewpointTarget = function(target, outSR, outExtent) {
    var geom;

    if (!target) {
      return null;
    }

    if (Array.isArray(target) && target.length === 2 && typeof target[0] === "number" && typeof target[1] === "number") {
      return new Point(target);
    }
    else if (target.forEach) {
      target.reduce(function(outExtent, current) {
        return computeViewpointTarget(current, outSR, outExtent);
      });
      return outExtent;
    }
    else if (Array.isArray(target)) {
      for (var i = 0; i < target.length; i++) {
        outExtent = computeViewpointTarget(target[i], outSR, outExtent);
        if (!outExtent) {
          return null;
        }
      }
      return outExtent;
    }
    else if (target instanceof Geometry) {
      geom = target;
    }
    else if (target.geometry) {
      geom = target.geometry;
    }

    if (!geom) {
      return null;
    }

    var geomext;

    if (geom.type === "point") {
      geomext = new Extent({
        xmin: geom.x,
        ymin: geom.y,
        xmax: geom.x,
        ymax: geom.y,
        spatialReference: geom.spatialReference
      });
    } else {
      geomext = geom.extent;
    }

    if (!geomext || !webMercatorUtils.canProject(geomext.spatialReference, outSR)) {
      return null;
    }

    var projext = webMercatorUtils.project(geomext, outSR);

    if (!outExtent) {
      outExtent = projext.clone();
    } else {
      outExtent = outExtent.union(projext);
    }

    return outExtent;
  };  


  //--------------------------------------------------------------------------
  //
  //  Constructors
  //
  //--------------------------------------------------------------------------

  /**
   * @param props
   *          extent
   *          scale
   *          zoom
   *          center
   *          rotation
   *          size
   * @param viewSR
   * @param size
   */
  var create = function(target, options) {
    if (!target) {
      return new Viewpoint({
        targetGeometry: new Point(),
        scale: 0,
        rotation: 0
      });
    }

    var outSR = options.spatialReference;
    var size = options.size;
    var currentViewpoint = options.currentViewpoint;
    var tileInfo = options.tileInfo;
    var snapToZoom = options.snapToZoom != null ? options.snapToZoom : true;

    if (target.declaredClass === "esri.Viewpoint") {
      return target;
    }

    var center = null;

    // use scale from viewpoint only if exist and targetGeometry is a point 
    var scale = (target.viewpoint && target.viewpoint.targetGeometry && target.viewpoint.targetGeometry.type === "point") ? 
      target.viewpoint.scale : target.scale != null ? 
        target.scale : (tileInfo && target.zoom != null) ?
         tileInfo.zoomToScale(target.zoom) : null;

    var rotation = target.viewpoint ?
      target.viewpoint.rotation : 
        target.rotation != null ? target.rotation : 
          currentViewpoint ? currentViewpoint.rotation :
            0;

    target = (target.viewpoint && target.viewpoint.targetGeometry)
           || (target instanceof Geometry && target)
           || computeViewpointTarget(target.center, outSR)
           || computeViewpointTarget(target.extent, outSR)
           || computeViewpointTarget(target.target, outSR)
           || computeViewpointTarget(target, outSR)
           || (currentViewpoint && currentViewpoint.targetGeometry)
           || options.extent;
    var inSR = getSR(target);

    if (!outSR) {
      outSR = getSR(options.spatialReference || options.extent || target);
    }

    center = target.center ? target.center : target;
    center = pointToVec2(vec2.create(), center);
    center = new Point(normalizeSR(center, center, inSR, outSR), outSR);

    if (scale === null) {
      if (Array.isArray(target) || target.type === "point") {
        scale = options.extent ? extentToScale(options.extent, size) : currentViewpoint.scale;
      }
      else {
        scale = extentToScale(target.extent, size);
      }
    }

    // snap to closest
    if (options.extent && options.tileInfo && snapToZoom) {
      scale = options.tileInfo.snapScale(scale);
    }

    return new Viewpoint({
      targetGeometry: center,
      scale: scale,
      rotation: rotation
    });
  };
  
  
  /**
   * Shallow copy the properties of an input viewpoint
   */
  var copy = function copy(out, viewpoint) {
    var destGeom = out.targetGeometry;
    var srcGeom = viewpoint.targetGeometry;
    destGeom.x = srcGeom.x;
    destGeom.y = srcGeom.y;
    destGeom.spatialReference = srcGeom.spatialReference;
    out.scale = viewpoint.scale;
    out.rotation = viewpoint.rotation;
    return out;
  };
  
  //--------------------------------------------------------------------------
  //
  //  Properties
  //
  //--------------------------------------------------------------------------

  //----------------------------------
  //  anchor
  //----------------------------------

  var getAnchor = (function() {
    var tmp = vec2.create();

    return function getAnchor(out, size, padding) {
      if (!padding) {
        return vec2.scale(out, size, 0.5);
      }
      vec2.set(tmp, padding.left + padding.right, padding.top + padding.bottom);
      vec2.sub(out, size, tmp);
      vec2.set(tmp, padding.left, padding.top);
      return vec2.scaleAndAdd(out, tmp, out, 0.5);
    };
  })();

  //----------------------------------
  //  extent
  //----------------------------------

  /**
   * Calculate the extent.
   * 
   * @param out the recipent Extent
   * @param viewpoint
   * @param view - should have width/height
   * 
   * @returns out
   */
  var getExtent = (function() {
    var center = vec2.create();

    return function getExtent(out, viewpoint, size) {
      var geom = viewpoint.targetGeometry;
      pointToVec2(center, geom);

      var halfRes = getResolution(viewpoint) * 0.5;
      out.xmin = center[0] - halfRes * size[0];
      out.ymin = center[1] - halfRes * size[1];
      out.xmax = center[0] + halfRes * size[0];
      out.ymax = center[1] + halfRes * size[1];
      out.spatialReference = geom.spatialReference;
      return out;
    };
  })();

  var setExtent = function setExtent(out, viewpoint, extent, size, options) {
    centerAt(out, viewpoint, extent.center);
    out.scale = extentToScale(extent, size);
    
    if (options && options.tileInfo) {
      var tileInfo = options.tileInfo;
      var snapToZoom = options.snapToZoom == null ? true : options.snapToZoom;
      if (tileInfo && snapToZoom) {
        out.scale = tileInfo.snapScale(out.scale);
      }
    }
    return out;
  };

  //----------------------------------
  //  inverseTransform
  //----------------------------------

  /**
   * calculate the matrix to tranform screen coords to map coords
   */
  var getInverseTransform = function(out, viewpoint, size) {
    out = getTransform(out, viewpoint, size);
    return mat2d.invert(out, out);
  };
  
  //----------------------------------
  //  outerExtent
  //----------------------------------

  /**
   * Calculate the extent covering the screen.
   *
   * @param out the recipent Extent
   * @param viewpoint
   * @param view - should have width/height
   * 
   * @returns out
   */
  var getOuterExtent = (function() {
    var ctr = vec2.create();
    var outerSize = vec2.create();

    return function(out, viewpoint, size) {
      pointToVec2(ctr, viewpoint.targetGeometry);
      getOuterSize(outerSize, viewpoint, size);
      
      var halfRes = getResolution(viewpoint) * 0.5,
          xmin = ctr[0] - halfRes * outerSize[0],
          ymin = ctr[1] - halfRes * outerSize[1],
          xmax = ctr[0] + halfRes * outerSize[0],
          ymax = ctr[1] + halfRes * outerSize[1],
          spatialReference = viewpoint.targetGeometry.spatialReference;

      out.set({
        xmin: xmin,
        ymin: ymin,
        xmax: xmax,
        ymax: ymax,
        spatialReference: spatialReference
      });
      return out;
    };
  })();

  //----------------------------------
  //  outerSize
  //----------------------------------

  /**
   * view should have width/height
   * returns [ width, height ]
   */
  var getOuterSize = function getOuterSize(out, viewpoint, size) {
    var rad = getRotation(viewpoint),
        cos = Math.abs(Math.cos(rad)),
        sin = Math.abs(Math.sin(rad));
    return vec2.set(
      out,
      Math.round(size[1]*sin + size[0]*cos),
      Math.round(size[1]*cos + size[0]*sin)
    );
  };
  
  //----------------------------------
  //  paddingTranslation
  //----------------------------------

  /**
   * calculate the translation vector in pixels to apply to the screen center to obtain the padded center.
   */
  var getPaddingScreenTranslation = (function() {
    var tmp = vec2.create();

    return function getPaddingTranslation(out, size, padding) {
      return vec2.sub(
        out,
        getScreenCenter(out, size),
        getAnchor(tmp, size, padding)
      );
    };
  })();
  
  //----------------------------------
  //  paddingTransform
  //----------------------------------

  /**
   * calculate the tranformation to apply to a mappoint to the screen center to obtain the padded center.
   */
  var getPaddingMapTranslation = (function() {
    var m = mat2d.create();
    var tmp = vec2.create();

    return function getPaddingTransform(out, viewpoint, size, padding) {
      var scale = getResolution(viewpoint);
      var rad = getRotation(viewpoint);

      // scale the matrix
      vec2.set(tmp, scale, scale);
      mat2d.fromScaling(m, tmp);

      // rotate
      mat2d.rotate(m, m, rad);

      // translate
      mat2d.translate(m, m, getPaddingScreenTranslation(tmp, size, padding));

      vec2.set(out, m[4], m[5]);
      return out;
    };
  })();

  //----------------------------------
  //  resolution
  //----------------------------------

  var getResolution = function getResolution(viewpoint) {
    return viewpoint.scale * getScaleToResolutionFactor(viewpoint.targetGeometry.spatialReference);
  };

  //----------------------------------
  //  resolutionToScaleFactor
  //----------------------------------

  var getScaleToResolutionFactor = function getScaleToResolutionFactor(spatialReference) {
    return 1 / (getUnitToMeter(spatialReference) * INCH_PER_METER * getScreenDPI());
  };

  //----------------------------------
  //  rotation
  //----------------------------------

  /**
   * returns rotation in radians
   */
  var getRotation = function(viewpoint) {
    return common.toRadian(viewpoint.rotation) || 0;
  };

  //----------------------------------
  //  scaleToResolutionFactor
  //----------------------------------

  var getResolutionToScaleFactor = function getResolutionToScaleFactor(spatialReference) {
    return getUnitToMeter(spatialReference) * INCH_PER_METER * getScreenDPI();
  };

  //----------------------------------
  //  screenCenter
  //----------------------------------

  var getScreenCenter = function(out, size) {
    return vec2.scale(out, size, 0.5);
  };
  
  //----------------------------------
  //  screenDPI
  //----------------------------------

  var getScreenDPI = function() {
    // TODO should be dynamic
    return 96;
  };

  //----------------------------------
  //  getMatrix
  //----------------------------------

  var getMatrix = (function() {
    var ctr = vec2.create();
    var tx = vec2.create();
    var scale = vec2.create();

    /**
     * @param {number} rotation - The rotation in radians
     */
    return function(out, center, size, resolution, rad) {
      // map center translation
      vec2.negate(ctr, center);
      
      // screen center translation
      vec2.scale(tx, size, 0.5);

      vec2.set(scale, 1 / resolution, -1 / resolution);

      mat2d.identity(out);
      mat2d.translate(out, out, tx);
      if (rad) {
        mat2d.rotate(out, out, rad);
      }
      mat2d.scale(out, out, scale);
      mat2d.translate(out, out, ctr);

      return out;
    };
  })();
  
  //----------------------------------
  //  transform
  //----------------------------------
  
  /**
   * calculate the matrix to tranform map coords to screen coords
   */
  var getTransform = (function() {
    var ctr = vec2.create();

    return function(out, viewpoint, size) {
      var res = getResolution(viewpoint);
      var rad = getRotation(viewpoint);

      pointToVec2(ctr, viewpoint.targetGeometry);
      return getMatrix(out, ctr, size, res, rad);
    };
  })();
  
  //----------------------------------
  //  TransformNoRotation
  //----------------------------------
  
  /**
   * calculate the matrix to tranform map coords to screen coords
   */
  var getTransformNoRotation = (function() {
    var ctr = vec2.create();

    return function(out, viewpoint, size) {
      var res = getResolution(viewpoint);

      pointToVec2(ctr, viewpoint.targetGeometry);
      return getMatrix(out, ctr, size, res, 0);
    };
  })();

  //--------------------------------------------------------------------------
  //
  //  Public Methods
  //
  //--------------------------------------------------------------------------

  /**
   * compute the angle between vectors anchor->a anchor-b 
   */
  var angleBetween = (function() {
    var u = vec2.create();
    var v = vec2.create();
    var c = vec2.create();

    return function(anchor, a, b) {
      vec2.subtract(u, anchor, a);
      vec2.normalize(u, u);
      vec2.subtract(v, anchor, b);
      vec2.normalize(v, v);

      vec2.cross(c, u, v);
      
      // calculate the abs angle
      var angle = Math.acos(vec2.dot(u, v) / (vec2.length(u) * vec2.length(v))) * DEG_PER_RAD;

      // change the direction
      if (c[2] < 0) {
        angle = -angle;
      }

      if (isNaN(angle)) {
        angle = 0;
      }

      return angle;
    };
  })();
  
  /**
   * Compute a viewpoint after padding is applied
   */
  var addPadding = (function() {
    var v = vec2.create();

    return function addPadding(out, viewpoint, size, padding, preserveExtent) {
      var geom = out.targetGeometry;
      
      copy(out, viewpoint);
      getPaddingMapTranslation(v, viewpoint, size, padding);
      geom.x += v[0];
      geom.y += v[1];
      return out;
    };
  })();
  
  var centerAt = (function(){ 
    var tmp = vec2.create();

    return function centerAt(out, viewpoint, center) {
      copy(out, viewpoint);
      var geom = out.targetGeometry;
      var inSR = getSR(center);
      var outSR = getSR(geom);

      pointToVec2(tmp, center);
      normalizeSR(tmp, tmp, inSR, outSR);
      geom.x = tmp[0];
      geom.y = tmp[1];
      return out;
    };
  })();

  var pixelSizeAt = function pixelSizeAt(coords, viewpoint, size) {
    // TODO should be dependent of the coords if not projected.
    return getResolution(viewpoint);
  };

  var removePadding = function removePadding(out, viewpoint, size, padding) {
    copy(out, viewpoint);
    return out;
  };

  var resize = (function() {
    var t = vec2.create();

    return function resize(out, viewpoint, oldSize, size, align) {
      if (!align) {
        align = "center";
      }

      // project the position of the center after the size is applied
      vec2.sub(t, oldSize, size);
      vec2.scale(t, t, 0.5);

      // get the delta in screen coords between the center of the screen and the center on screen.
      var dX = t[0];
      var dY = t[1];

      switch (align) {
        case "center":
          vec2.set(t, 0, 0);
          break;
        case "left":
          vec2.set(t, -dX, 0);
          break;
        case "top":
          vec2.set(t, 0, dY);
          break;
        case "right":
          vec2.set(t, dX, 0);
          break;
        case "bottom":
          vec2.set(t, 0, -dY);
          break;
        case "top-left":
          vec2.set(t, -dX, dY);
          break;
        case "bottom-left":
          vec2.set(t, -dX, -dY);
          break;
        case "top-right":
          vec2.set(t, dX, dY);
          break;
        case "bottom-right":
          vec2.set(t, dX, -dY);
          break;
      }

      translateBy(out, viewpoint, t);
      return out;
    };
  })();
  
  var rotateBy = function rotateBy(out, viewpoint, dRotation) {
    copy(out, viewpoint);
    out.rotation += dRotation;
    return out;
  };
  
  var rotateTo = function rotateTo(out, viewpoint, rotation) {
    copy(out, viewpoint);
    out.rotation = rotation;
    return out;
  };

  /**
   * 
   * @param out the recipent viewpoint
   * @param viewpoint
   * @param factor
   * @param anchor
   */
  var scaleBy = (function() {
    var tmp = vec2.create();

    return function scaleAndRotateBy(out, viewpoint, scaleFactor, anchor, size) {
      copy(out, viewpoint);
      if (scaleFactor !== 0) {
        // project the anchor point to map
        toMap(tmp, anchor, viewpoint, size);
        // apply the scale to the out viewpoint
        out.scale = viewpoint.scale / scaleFactor;
        // reproject the anchor to screen
        toScreen(tmp, tmp, out, size);
        // apply the translation
        translateBy(
          out,
          out,
          vec2.set(tmp, tmp[0] - anchor[0], anchor[1] - tmp[1])
        );
      }
      return out;
    };
  })();

  
  var scaleTo = function scaleTo(out, viewpoint, scale) {
    copy(out, viewpoint);
    out.scale = scale;
    return out;
  };

  /**
   * 
   * @param out the recipent viewpoint
   * @param viewpoint
   * @param scaleFactor
   * @param rotationDelta
   * @param anchor
   * @param size
   */
  var scaleAndRotateBy = (function() {
    var tmp = vec2.create();

    return function scaleAndRotateBy(out, viewpoint, scaleFactor, rotationDelta, anchor, size) {
      copy(out, viewpoint);
      if (scaleFactor !== 0) {
        // project the anchor point to map
        toMap(tmp, anchor, viewpoint, size);
        // apply the scale to the out viewpoint
        out.scale = viewpoint.scale / scaleFactor;
        out.rotation += rotationDelta;
        // reproject the anchor to screen
        toScreen(tmp, tmp, out, size);
        // apply the translation
        translateBy(
          out,
          out,
          vec2.set(tmp, tmp[0] - anchor[0], anchor[1] - tmp[1])
        );
      }
      return out;
    };
  })();

  /**
   * Converts the given screen point to map coordinates.
   *
   * @param out the recipent vec2 [x, y]
   * @param a this input vec2 [x, y]
   * @param viewpoint
   * @param size
   *
   * @returns out
   */
  var toMap = (function() {
    var mat = mat2d.create();

    return function toMap(out, a, viewpoint, size) {
      return vec2.transformMat2d(
        out,
        a,
        getInverseTransform(mat, viewpoint, size)
      );
    };
  })();
  
  /**
   * Converts the given map point to screen coordinates.
   *
   * @param out the recipent vec2 [x, y]
   * @param a the input vec2 [x, y]
   * @param viewpoint
   * @param view
   *
   * @returns out
   */
  var toScreen = (function() {
    var mat = mat2d.create();

    return function toScreen(out, a, viewpoint, size) {
      return vec2.transformMat2d(
        out,
        a,
        getTransform(mat, viewpoint, size)
      );
    };
  })();

  var translateBy = (function() {
    var tmp = vec2.create();
    var mat = mat2d.create();

    return function translateBy(out, viewpoint, t) {
      copy(out, viewpoint);
      var res = getResolution(viewpoint);
      var geom = out.targetGeometry;

      mat2d.fromRotation(mat, getRotation(viewpoint));
      mat2d.scale(mat, mat, vec2.fromValues(res, res));
      vec2.transformMat2d(tmp, t, mat);
      geom.x += tmp[0];
      geom.y += tmp[1];
      return out;
    };
  })();
  
  return {
    create: create,
    copy: copy,

    getAnchor: getAnchor,
    getExtent: getExtent,
    setExtent: setExtent,
    getPaddingMapTranslation: getPaddingMapTranslation,
    getPaddingScreenTranslation: getPaddingScreenTranslation,
    getResolution: getResolution,
    getScreenCenter: getScreenCenter,
    getTransform: getTransform,
    getTransformNoRotation: getTransformNoRotation,
    getInverseTransform: getInverseTransform,
    getOuterExtent: getOuterExtent,
    getOuterSize: getOuterSize,
    getResolutionToScaleFactor: getResolutionToScaleFactor,
    getScaleToResolutionFactor: getScaleToResolutionFactor,

    angleBetween: angleBetween,
    addPadding: addPadding,
    centerAt: centerAt,
    pixelSizeAt: pixelSizeAt,
    removePadding: removePadding,
    resize: resize,
    rotateBy: rotateBy,
    rotateTo: rotateTo,
    scaleBy: scaleBy,
    scaleTo: scaleTo,
    scaleAndRotateBy: scaleAndRotateBy,
    toMap: toMap,
    toScreen: toScreen,
    translateBy: translateBy
  };

});
