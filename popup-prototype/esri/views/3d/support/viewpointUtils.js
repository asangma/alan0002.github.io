define([
  "../../../geometry/SpatialReference",
  "../../../geometry/Geometry",
  "../../../geometry/Point",
  "../../../geometry/Extent",
  "../../../geometry/support/webMercatorUtils",

  "../../../Camera",
  "../../../Viewpoint",
  "../../../Graphic",

  "../lib/glMatrix",
  "./mathUtils",
  "./projectionUtils",
  "./cameraUtils"
], function(SpatialReference, Geometry, Point, Extent, webMercatorUtils,
            Camera, Viewpoint, Graphic,
            glMatrix, mathUtils, projectionUtils, cameraUtils) {
  var vec3d = glMatrix.vec3d;

  var tmpEye = vec3d.create();
  var tmpCenter = vec3d.create();
  var tmpDirection = vec3d.create();
  var tmpHeadingTilt = {
    heading: 0,
    tilt: 0
  };

  function rotationToHeading(rotation) {
    return 360 - mathUtils.cyclicalDeg.normalize(rotation);
  }

  function headingToRotation(heading) {
    return mathUtils.cyclicalDeg.normalize(360 - heading);
  }

  function toCamera(view, viewpoint, tilt) {
    var ret;

    if (!viewpoint) {
      return null;
    }

    var mapSR = view.map.spatialReference || SpatialReference.WGS84;
    var viewpointSR = viewpoint.get("targetGeometry.spatialReference") || viewpoint.get("camera.position.spatialReference");

    if (!webMercatorUtils.canProject(viewpointSR, mapSR)) {
      return null;
    }

    if (viewpoint.camera) {
      ret = viewpoint.camera.clone();

      if (tilt != null) {
        ret.tilt = tilt;
      }

      return viewpoint.camera;
    }


    var curcam = view.navigation.currentCamera;
    camera = cameraUtils.internalToExternal(view, curcam);

    var noReset = false;

    if (viewpoint.rotation != null) {
      camera.heading = rotationToHeading(viewpoint.rotation);
      noReset = true;
    }

    if (tilt != null) {
      camera.tilt = tilt;
    }

    if (viewpoint.targetGeometry instanceof Point) {
      var point = viewpoint.targetGeometry;

      // Center at point, with given rotation + scale
      var distance;
      var camera;

      var center = viewpoint.targetGeometry.clone();

      if (viewpoint.scale != null) {
        distance = cameraUtils.scaleToDistance(view, viewpoint.scale, point.latitude);
      } else {
        distance = curcam.distance;
      }

      ret = cameraUtils.eyeHeadingTiltForCenterPointAtDistance(view,
                                                               camera.heading,
                                                               camera.tilt,
                                                               center,
                                                               distance,
                                                               { noReset: noReset });

      var position = projectionUtils.vectorToPoint(ret.eye, view.renderSpatialReference, mapSR);
      return new Camera(position, ret.heading, ret.tilt, camera.fov);
    } else {
      var extent = viewpoint.targetGeometry.extent;
      return cameraUtils.fromExtent(view, extent, camera, { noReset: noReset });
    }
  }

  function propFromOptions(options, prop, def) {
    if (options[prop] != null) {
      return options[prop];
    }
    else if (def != null) {
      if (typeof def === "function") {
        return def();
      }
      else {
        return def;
      }
    }
  }

  function scaleFromOptions(view, options, def) {
    return propFromOptions(options, "scale", function() {
      var retval = propFromOptions(options, "zoom", function() {
        if (def == null) {
          return;
        }

        if (typeof def === "function") {
          def = def();
        }

        return { scale: def };
      });

      if (retval != null) {
        if (retval.scale != null) {
          return retval.scale;
        }

        return cameraUtils.zoomToScale(view, retval);
      }
    });
  }

  function headingFromOptions(view, options, def) {
    return propFromOptions(options, "heading", function() {
      var retval = propFromOptions(options, "rotation", function() {
        if (def == null) {
          return;
        }

        if (typeof def === "function") {
          def = def();
        }

        return { heading: def };
      });

      if (retval != null) {
        if (retval.heading != null) {
          return retval.heading;
        }

        return rotationToHeading(retval);
      }
    });
  }

  function withOptions(view, target, targetOptions) {
    target = target.clone();

    if (targetOptions.heading != null) {
      target.rotation = headingToRotation(targetOptions.heading);
    } else if (targetOptions.rotation != null) {
      target.rotation = targetOptions.rotation;
    }

    var scale = scaleFromOptions(view, targetOptions);

    if (scale != null) {
      target.scale = scale;
    }

    target.camera = toCamera(view, target, targetOptions.tilt);
    return target;
  }

  function fromCameraProperties(view, target, targetOptions, curcam, ret) {
    if (!((target && targetOptions.position) ||
          (target && targetOptions.direction) ||
          (targetOptions.position && targetOptions.direction))) {
      return false;
    }

    var mapSR = view.map.spatialReference || SpatialReference.WGS84,
      renderSR = view.renderSpatialReference;

    var direction = targetOptions.direction;

    if (target && targetOptions.position) {
      direction = null;
    }

    if (targetOptions.position) {
      projectionUtils.pointToVector(targetOptions.position, tmpEye, renderSR);
    }

    if (target) {
      projectionUtils.pointToVector(target, tmpCenter, renderSR);
    }

    if (direction) {
      var pt = targetOptions.position || target;

      var dirpt = new Point(pt);
      dirpt.x += direction[0];
      dirpt.y += direction[1];

      if (direction.length > 2) {
        dirpt.z += direction[2];
      }

      projectionUtils.pointToVector(dirpt, tmpDirection, renderSR);
      vec3d.subtract(tmpDirection, targetOptions.position ? tmpEye : tmpCenter);
    }

    if (targetOptions.position && direction) {
      // Camera position, heading and tilt
      ret.camera.position = new Point(targetOptions.position);
      cameraUtils.directionToHeadingTilt(view, tmpEye, tmpDirection, curcam.up, ret.camera);

      /// Viewpoint targetGeometry
      vec3d.add(tmpEye, tmpDirection, tmpCenter);
      view.navigation.getCenterIntersectTerrain(tmpEye, tmpCenter, tmpCenter);
      ret.targetGeometry = projectionUtils.vectorToPoint(tmpCenter, renderSR, mapSR);

      // Viewpoint scale
      ret.scale = cameraUtils.distanceToScale(view,
                                              vec3d.dist(tmpEye, tmpCenter),
                                              ret.targetGeometry.latitude);
    }
    else if (target && direction) {
      // Viewpoint targetGeometry
      ret.targetGeometry = new Point(target);

      // Allow overriding scale/zoom by targetOptions, hence compute distance
      // according to view scale, and fallback on current scale
      ret.scale = scaleFromOptions(view, targetOptions, function() {
        return cameraUtils.computeScale(view, curcam);
      });

      var distance = cameraUtils.scaleToDistance(view, ret.scale, target.latitude);

      vec3d.scale(tmpDirection, distance / vec3d.length(tmpDirection), tmpEye);
      vec3d.add(tmpEye, tmpCenter);

      // Camera position, heading and tilt
      ret.camera.position = projectionUtils.vectorToPoint(tmpEye, renderSR, mapSR);
      cameraUtils.directionToHeadingTilt(view, tmpEye, tmpDirection, curcam.up, ret.camera);
    }
    else {
      // target && target.position
      ret.targetGeometry = new Point(target);
      ret.camera.position = new Point(targetOptions.position);

      // camera heading/tilt
      vec3d.subtract(tmpCenter, tmpEye, tmpDirection);
      cameraUtils.directionToHeadingTilt(view, tmpEye, tmpDirection, curcam.up, ret.camera);

      // Viewpoint scale
      ret.scale = cameraUtils.distanceToScale(view,
                                              vec3d.dist(tmpEye, tmpCenter),
                                              ret.targetGeometry.latitude);
    }

    // Rotation from camera heading
    ret.rotation = headingToRotation(ret.camera.heading);
    return true;
  }

  function applyCameraViewpointOptions(camera, options) {
    var ret = false;

    if (options.heading != null) {
      camera.heading = options.heading;
      ret = true;
    } else if (options.rotation != null) {
      camera.heading = rotationToHeading(options.rotation);
      ret = true;
    }

    if (options.tilt != null) {
      camera.tilt = options.tilt;
      ret = true;
    }

    if (options.fov != null) {
      camera.fov = options.fov;
    }

    return ret;
  }

  function completeFromCamera(view, ret) {
    var mapSR = view.map.spatialReference || SpatialReference.WGS84;

    var icamera = cameraUtils.externalToInternal(view, ret.camera);

    ret.targetGeometry = projectionUtils.vectorToPoint(icamera.center, view.renderSpatialReference, mapSR);
    ret.scale = cameraUtils.computeScale(view, icamera);

    ret.rotation = headingToRotation(ret.camera.heading);
    return ret;
  }

  function computeViewpointExtent(view, target, sr, ret) {
    var geom;

    if (Array.isArray(target) && target.length === 2 && typeof target[0] === "number" && typeof target[1] === "number") {
      geom = new Point(target[0], target[1], SpatialReference.WGS84);
    } else if (target.forEach) {
      var breakout = false;

      target.forEach(function(t) {
        if (breakout) {
          return;
        }

        ret = computeViewpointExtent(view, t, sr, ret);

        if (!ret) {
          ret = null;
          breakout = true;
        }
      });

      return ret;
    } else if (Array.isArray(target)) {
      for (var i = 0; i < target.length; i++) {
        ret = computeViewpointExtent(view, target[i], sr, ret);

        if (!ret) {
          return null;
        }
      }

      return ret;
    } else if (target instanceof Geometry) {
      geom = target;
    } else if (target instanceof Graphic) {
      if (target.geometry) {
        geom = target.geometry;
      }
    }

    if (!geom) {
      return null;
    }

    var geomext;

    if (geom instanceof Point) {
      geomext = new Extent({
        xmin: geom.x,
        ymin: geom.y,
        zmin: geom.z,
        xmax: geom.x,
        ymax: geom.y,
        zmax: geom.z,
        spatialReference: geom.spatialReference
      });
    } else {
      geomext = geom.extent;
    }

    if (!geomext || !webMercatorUtils.canProject(geomext.spatialReference, sr)) {
      return null;
    }

    var projext = webMercatorUtils.project(geomext, sr);

    if (!ret) {
      ret = projext.clone();
    } else {
      ret = ret.union(projext);
    }

    return ret;
  }

  function create(view, target, options) {
    options = options || {};

    var targetOptions = target;

    if (!target) {
      return null;
    }

    if (target.declaredClass == null) {
      if (target.target) {
        target = target.target;
      }
      else if (target.center) {
        target = target.center;
      }
    }

    // Fastpath for creating a viewpoint from another viewpoint, possibly
    // overriding some of its properties
    if (target instanceof Viewpoint) {
      return withOptions(view, target, targetOptions);
    }

    var ret = new Viewpoint({
      targetGeometry: undefined,
      scale: undefined,
      rotation: undefined,
      camera: new Camera({
        position: undefined,
        heading: undefined,
        tilt: undefined,
        fov: mathUtils.rad2deg(view.navigation.currentCamera.fov)
      })
    });

    var mapSR = view.map.spatialReference || SpatialReference.WGS84;

    var curcam;
    var extent = computeViewpointExtent(view, target, mapSR);

    if (!extent) {
      if (target instanceof Camera) {
        ret.camera = target.clone();
        return completeFromCamera(view, ret);
      }
      else {
        curcam = view.navigation.getCameraIntersectTerrain();

        // Takes care of position+direction
        if (fromCameraProperties(view, null, targetOptions, curcam, ret)) {
          return ret;
        }

        if (targetOptions.position) {
          // Camera position with optional heading/tilt

          curcam.computeDirection(tmpDirection);
          cameraUtils.directionToHeadingTilt(view, curcam.eye, tmpDirection, curcam.up, tmpHeadingTilt);

          ret.camera.position = new Point(targetOptions.position);
          ret.camera.heading = headingFromOptions(view, targetOptions, tmpHeadingTilt.heading);
          ret.camera.tilt = propFromOptions(targetOptions, "tilt", tmpHeadingTilt.tilt);
          ret.camera.fov = propFromOptions(targetOptions, "fov", ret.camera.fov);

          return completeFromCamera(view, ret);
        }
        else {
          // Default to current center, can still override things like scale,
          // heading and tilt, etc.
          ret.targetGeometry = projectionUtils.vectorToPoint(curcam.center, view.renderSpatialReference, mapSR);
        }
      }
    } else {
      // Here we have an extent computed for the passed in target. The extent
      // can still be a single point, in which case we convert it to a single
      // point target.
      if (extent.xmin === extent.xmax && extent.ymin === extent.ymax && extent.zmin === extent.zmax) {
        // Single point representing the center, store in geometry. Same behavior
        // as having specified center
        ret.targetGeometry = new Point(extent.xmin, extent.ymin, extent.zmin, extent.spatialReference);
        extent = null;

        curcam = view.navigation.getCameraIntersectTerrain();

        // Takes care of center+position, center+direction
        if (fromCameraProperties(view, ret.targetGeometry, targetOptions, curcam, ret)) {
          return ret;
        }
      } else {
        // The extent _is_ the geometry to center
        ret.targetGeometry = extent;
      }
    }

    if (!ret.targetGeometry) {
      // This can happen when geometry is in the wrong SR, nothing to do then
      return null;
    }

    var noReset = false;

    if (!curcam) {
      curcam = view.navigation.getCameraIntersectTerrain();
    }

    // Initialize camera from current
    cameraUtils.internalToExternal(view, curcam, ret.camera);

    // Apply camera settings from targetOptions
    if (applyCameraViewpointOptions(ret.camera, targetOptions)) {
      noReset = true;
    }

    ret.scale = scaleFromOptions(view, targetOptions);

    if (extent) {
      var center = extent.center;

      if (ret.scale != null) {
        // Just use the extent center with the overriden scale
        cameraUtils.fromCenterScale(view, center, ret.scale, ret.camera, { noReset: noReset }, ret.camera);
      } else {
        // Convert extent to camera
        if (!cameraUtils.fromExtent(view, extent, ret.camera, { noReset: noReset }, ret.camera)) {
          return null;
        }

        // Compute resulting scale
        ret.scale = cameraUtils.computeScale(view, ret.camera, center);
      }
    } else {
      if (ret.scale == null) {
        ret.scale = cameraUtils.computeScale(view, curcam);
      }

      if (!cameraUtils.fromCenterScale(view, ret.targetGeometry, ret.scale, ret.camera, { noReset: noReset }, ret.camera)) {
        return null;
      }
    }

    ret.rotation = headingToRotation(ret.camera.heading);
    return ret;
  }

  return {
    create: create,
    rotationToHeading: rotationToHeading,
    headingToRotation: headingToRotation,
    toCamera: toCamera
  };
});
