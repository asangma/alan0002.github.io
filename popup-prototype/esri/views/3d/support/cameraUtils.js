define([
  "../../../geometry/SpatialReference",
  "../../../config",

  "../../../geometry/Point",
  "../../../geometry/support/webMercatorUtils",

  "../../../Camera",

  "../lib/glMatrix",

  "./mathUtils",
  "./earthUtils",
  "./projectionUtils",
  "./cameraUtilsPlanar",
  "./cameraUtilsSpherical"
], function(SpatialReference, esriConfig,
            Point, webMercatorUtils,
            Camera,
            glMatrix,
            mathUtils, earthUtils, projectionUtils, cameraUtilsPlanar, cameraUtilsSpherical) {

  var vec3d = glMatrix.vec3d;

  // Constants
  var INCHES_PER_METER = 39.37;

  // A scaling which determines how the extent is fitted to a camera. 1 means
  // fit exactly into tilt = 0, heading = 0. Values larger than 1 zoom in
  // more.
  var EXTENT_TO_CAMERA_ZOOM_SCALE = 1;

  // Determines the maximum distance (in screen space) between the
  // current camera target and a new target, as a fraction of the maximum
  // viewport dimension (in pixels)
  var MAXIMUM_DISTANCE_PRESERVING_HEADING_TILT_N = 2;

  var tmpEye = vec3d.create();
  var tmpCenter = vec3d.create();
  var tmpDirection = vec3d.create();
  var tmpHeadingTilt = {
    heading: 0,
    tilt: 0
  };

  var webMercatorCyclical = new mathUtils.Cyclical(-20037508.342788905, 20037508.342788905);

  function getMapSR(view) {
    var sr;

    if (view.map) {
      sr = view.map.spatialReference;
    }

    return sr || SpatialReference.WGS84;
  }

  function viewModeDependentUtil(view, name) {
    return view.globeMode === "spherical" ? cameraUtilsSpherical[name] : cameraUtilsPlanar[name];
  }

  function externalToInternal(view, camera) {
    var renderSR = view.renderSpatialReference,
      headingTiltToDirectionUp = viewModeDependentUtil(view, "headingTiltToDirectionUp");
    var enginePosition = vec3d.create();

    if (projectionUtils.pointToVector(camera.position, enginePosition, renderSR)) {
      var dirup = headingTiltToDirectionUp(enginePosition, camera.heading, camera.tilt);

      vec3d.add(dirup.direction, enginePosition);

      var cam = view.navigation.getCameraIntersectTerrain(enginePosition,
                                                          dirup.direction,
                                                          dirup.up);

      cam.fov = mathUtils.deg2rad(camera.fov);
      return cam;
    } else {
      return null;
    }
  }

  function internalToExternal(view, camera, retcamera) {
    var renderSR = view.renderSpatialReference;

    var direction = camera.computeDirection(tmpDirection);

    var headingTilt = directionToHeadingTilt(view, camera.eye, direction, camera.up, tmpHeadingTilt);
    var sr = getMapSR(view);

    if (!projectionUtils.vectorToVector(camera.eye, renderSR, tmpEye, sr)) {
      sr = SpatialReference.WGS84;
      projectionUtils.vectorToVector(camera.eye, renderSR, tmpEye, sr);
    }

    if (!retcamera) {
      return new Camera(new Point(tmpEye, sr), headingTilt.heading, headingTilt.tilt, mathUtils.rad2deg(camera.fov));
    } else {
      retcamera.position.x = tmpEye[0];
      retcamera.position.y = tmpEye[1];
      retcamera.position.z = tmpEye[2];
      retcamera.position.spatialReference = sr;
      retcamera.heading = headingTilt.heading;
      retcamera.tilt = headingTilt.tilt;
      retcamera.fov = mathUtils.rad2deg(camera.fov);

      return retcamera;
    }
  }

  function scaleToDistance(view, scale, latitude) {
    var curCam = view.navigation.currentCamera;

    var fovX = curCam.fovX;
    var halfScreenWidthInPix = curCam.width / 2;

    if (view.globeMode === "spherical" && latitude != null) {
      scale *= Math.cos(mathUtils.deg2rad(latitude));
    }

    scale /= view.mapCoordsHelper.mapUnitInMeters;

    var screenPixPerMM = esriConfig.screenDPI * INCHES_PER_METER;
    var lookAtPixelPerMM = screenPixPerMM / scale;

    var halfScreenWidthM = halfScreenWidthInPix / lookAtPixelPerMM;
    return halfScreenWidthM / Math.tan(fovX / 2);
  }

  function distanceToScale(view, distance, latitude) {
    var curCam = view.navigation.currentCamera;

    var fovX = curCam.fovX;

    var halfSscreenWidthM = distance * Math.tan(fovX / 2);
    var halfScreenWidthInPix = curCam.width / 2;

    var lookAtPixPerMM = halfScreenWidthInPix / halfSscreenWidthM;

    // DPI from gfx: var screenPixPerMM = gfx.pt2px(1) * gfx.mm_in_pt;
    var screenPixPerMM = esriConfig.screenDPI * INCHES_PER_METER;

    var scale = screenPixPerMM / lookAtPixPerMM;

    // convert to WebMercator scale
    if (view.globeMode === "spherical") {
      scale /= Math.cos(mathUtils.deg2rad(latitude));
    }

    scale *= view.mapCoordsHelper.mapUnitInMeters;

    return scale;
  }

  function fromCenterScale(view, center, scale, baseCamera, constraintOptions, retcamera) {
    var distance = scaleToDistance(view, scale, center.latitude);
    var renderSR = view.renderSpatialReference;

    var ret = eyeHeadingTiltForCenterPointAtDistance(view,
                                                     baseCamera.heading,
                                                     baseCamera.tilt,
                                                     center,
                                                     distance,
                                                     constraintOptions);

    var sr = getMapSR(view);
    var position = projectionUtils.vectorToPoint(ret.eye, renderSR, sr);

    if (!position) {
      return null;
    }

    if (!retcamera) {
      return new Camera(position, ret.heading, ret.tilt, baseCamera.fov);
    }

    retcamera.position = position;
    retcamera.heading = ret.heading;
    retcamera.tilt = ret.tilt;
    retcamera.fov = baseCamera.fov;

    return retcamera;
  }

  function toEnginePointWithElevation(view, point, retval) {

    projectionUtils.pointToVector(point, retval, view.renderSpatialReference);

    if (point.z != null) {
      return;
    }

    var pickResult;

    if (view.globeMode === "spherical") {
      view._pickRay([0, 0, 0], retval);
    } else {
      var p0 = [retval[0], retval[1] - 1, retval[2]];
      view._pickRay(p0, retval);
    }

    if (pickResult) {
      if (pickResult.getMaxResult().getIntersectionPoint(retval)) {
        if (vec3d.length2(retval) !== 0) {
          return;
        }
      }
    }

    if (view.basemapTerrain != null) {
      // Query basemap terrain for elevation at center point
      var sampledAltitude = view.basemapTerrain.getElevation(point);

      if (sampledAltitude != null) {
        // Update center point with sampled altitude
        view.renderCoordsHelper.setAltitude(retval, sampledAltitude);
      }
    }
  }

  function directionToHeadingTilt(view, position, direction, up, ret) {
    return viewModeDependentUtil(view, "directionToHeadingTilt")(position, direction, up, ret);
  }

  function eyeHeadingTiltForCenterPointAtDistance(view, heading, tilt, centerPoint, distance, constraintOptions) {
    var lookAt = vec3d.create();
    var renderSR = view.renderSpatialReference;

    if (centerPoint && centerPoint instanceof Point) {
      // Update point with current elevation information
      toEnginePointWithElevation(view, centerPoint, lookAt);
    } else if (centerPoint) {
      vec3d.set(centerPoint, lookAt);
    } else {
      vec3d.set(view.navigation.currentCamera.center, lookAt);
    }

    if (!centerPoint || !(centerPoint instanceof Point)) {
      var sr = getMapSR(view);
      centerPoint = projectionUtils.vectorToPoint(lookAt, renderSR, sr);
    }

    // Clamp distance from target to poi dist from navigation
    distance = Math.max(distance, view.navigation.minPoiDist);

    var headingTilt = applyHeadingTiltConstraints(view,
                                                  heading,
                                                  tilt,
                                                  lookAt,
                                                  centerPoint,
                                                  distance,
                                                  constraintOptions);

    // Compute eye location to center at distance with a given heading and tilt.
    // Note that if a solution could not be found, a solution will be computed
    // where tilt = 0 (reset) instead. This function will return an object
    // {eye:, heading:, tilt:}.
    var eyeForCenterWithHeadingTilt = viewModeDependentUtil(view, "eyeForCenterWithHeadingTilt");
    var ret = eyeForCenterWithHeadingTilt(lookAt, distance, headingTilt.heading, headingTilt.tilt);
    ret.center = lookAt;

    return ret;
  }

  function fromExtent(view, extent, headingTilt, constraintOptions, retcamera) {
    if (constraintOptions instanceof Camera) {
      retcamera = constraintOptions;
      constraintOptions = {};
    }

    var isSpherical = view.globeMode === "spherical";
    var renderSR = view.renderSpatialReference;
    var mapSR = getMapSR(view);
    var wm = SpatialReference.WebMercator;
    var sr = extent.spatialReference || wm;

    var z, dz = 0;

    if (extent.zmax != null && extent.zmin != null) {
      z = (extent.zmax + extent.zmin) / 2;
      dz = extent.zmax - extent.zmin;
    }

    // Calculate center point and width/height of the extent to frame
    var centerPoint, dx, dy;
    if (isSpherical) {
      var minPoint = new Point(extent.xmin, extent.ymin, sr);
      var maxPoint = new Point(extent.xmax, extent.ymax, sr);

      // Calculate centerPoint in web mercator
      minPoint = webMercatorUtils.project(minPoint, wm);
      maxPoint = webMercatorUtils.project(maxPoint, wm);

      if (minPoint === null || maxPoint === null) {
        return;
      }

      centerPoint = new Point(webMercatorCyclical.center(minPoint.x, maxPoint.x),
        (maxPoint.y + minPoint.y) / 2,
        wm);

      if (z != null) {
        centerPoint.z = z;
      }

      var dist = earthUtils.getGreatCircleSpanAt(centerPoint, minPoint, maxPoint);
      dx = dist.lon;
      dy = dist.lat;

      // Check if the extent actually spans more than a single hemisphere and
      // adjust the longitude distance accordingly
      if (webMercatorCyclical.diff(minPoint.x, maxPoint.x) > webMercatorCyclical.range / 2) {
        dx += earthUtils.halfEarthCircumference;
      }

      // Clamp distance on half the earth circumference
      dx = Math.min(dx, earthUtils.halfEarthCircumference);
      dy = Math.min(dy, earthUtils.halfEarthCircumference);
    }
    else {
      if (!extent.spatialReference.equals(mapSR)) {
        return;
      }
      // WARNING: up-axis dependent code      
      dx = extent.xmax - extent.xmin;
      dy = extent.ymax - extent.ymin;
      centerPoint = new Point({
        x: extent.xmin + 0.5*dx,
        y: extent.ymin + 0.5*dy,
        z: z,
        spatialReference: mapSR
      });
    }

    // Calculate camera distance to center of extent at which (given fov)
    // we can see the extent
    var curCam = view.navigation.currentCamera;

    var tanHalfFovInvX = 1 / Math.tan(curCam.fovX / 2);
    var tanHalfFovInvY = 1 / Math.tan(curCam.fovY / 2);
    var tanHalfFovInvD = 1 / Math.tan(curCam.fov / 2);

    // Longest distance, keeping aspect ratio in mind
    var distance = Math.max(0.5 * dx * tanHalfFovInvX,
                            0.5 * dy * tanHalfFovInvY,
                            0.5 * dz * tanHalfFovInvD) / EXTENT_TO_CAMERA_ZOOM_SCALE;

    var ret = eyeHeadingTiltForCenterPointAtDistance(view,
                                                     headingTilt.heading,
                                                     headingTilt.tilt,
                                                     centerPoint,
                                                     distance,
                                                     constraintOptions);

    var cameraPos = projectionUtils.vectorToPoint(ret.eye, renderSR, mapSR);

    if (!cameraPos) {
      return null;
    }

    if (!retcamera) {
      retcamera = new Camera();
    }

    retcamera.position = cameraPos;
    retcamera.heading = ret.heading;
    retcamera.tilt = ret.tilt;
    retcamera.fov = view.camera.fov;

    return retcamera;
  }

  function toExtent(view, camera, internalCamera, retextent, tmpcamera) {
    var distance;
    var center;

    var renderSR = view.renderSpatialReference;

    if (!camera) {
      if (!internalCamera) {
        internalCamera = view.navigation.currentCamera;
      }

      camera = internalToExternal(view, internalCamera, tmpcamera);
    }

    if (!internalCamera) {
      center = view.toMap(view.screenCenter);

      if (!center) {
        return null;
      }

      distance = earthUtils.computeCarthesianDistance(camera.position, center);
    } else {
      center = projectionUtils.vectorToPoint(internalCamera.center, renderSR, getMapSR(view));
      distance = internalCamera.distance;
    }

    if (!internalCamera) {
      internalCamera = view.navigation.currentCamera;
    }

    var tanHalfFovX = Math.tan(internalCamera.fovX / 2);
    var tanHalfFovY = Math.tan(internalCamera.fovY / 2);

    var gcdLon = 2 * distance * tanHalfFovX * EXTENT_TO_CAMERA_ZOOM_SCALE;
    var gcdLat = 2 * distance * tanHalfFovY * EXTENT_TO_CAMERA_ZOOM_SCALE;

    if (view.globeMode === "spherical") {
      return cameraUtilsSpherical.toExtent(view, center, gcdLon, gcdLat, retextent);
    } else {
      return cameraUtilsPlanar.toExtent(view, center, gcdLon, gcdLat, retextent);
    }
  }

  function headingTiltResetThreshold(view, lookAtPoint) {
    // Reset heading and tilt when traveling large distances
    var cam = view.navigation.currentCamera;

    var screenCurCenter = view.engineToScreen(cam.center);
    var screenCenterPoint = view.toScreen(lookAtPoint);

    var screenDx = screenCurCenter.x - screenCenterPoint.x;
    var screenDy = screenCurCenter.y - screenCenterPoint.y;
    var screenDistance = Math.sqrt(screenDx * screenDx + screenDy * screenDy);

    var maxDim = Math.max(view.width, view.height);

    return screenDistance > MAXIMUM_DISTANCE_PRESERVING_HEADING_TILT_N * maxDim;
  }

  function applyHeadingTiltConstraints(view, heading, tilt, lookAt, lookAtPoint, distance, options) {
    if ((!options || !options.noReset) && headingTiltResetThreshold(view, lookAtPoint)) {
      heading = 0;
      tilt = view.navigation.constraints.tilt.min(distance);
    } else {
      // Constrain tilt to that imposed by navigation

      var lookAtTilt = eyeTiltToLookAtTilt(view, lookAt, distance, tilt);

      lookAtTilt = view.navigation.constraints.tilt.apply(lookAtTilt, distance);
      tilt = lookAtTiltToEyeTilt(view, lookAt, distance, lookAtTilt);
    }

    return {
      heading: heading,
      tilt: tilt
    };
  }

  function lookAtTiltToEyeTilt(view, lookAt, distance, tilt) {
    return viewModeDependentUtil(view, "lookAtTiltToEyeTilt")(lookAt, distance, tilt);
  }

  function eyeTiltToLookAtTilt(view, lookAt, distance, tilt) {
    return viewModeDependentUtil(view, "eyeTiltToLookAtTilt")(lookAt, distance, tilt);
  }  

  function scaleToZoom(view, scale) {
    var tilingScheme = view.get("basemapTerrain.tilingScheme");
    return tilingScheme ? tilingScheme.levelAtScale(scale) : undefined;
  }

  function zoomToScale(view, zoom) {
    var tilingScheme = view.get("basemapTerrain.tilingScheme");
    return tilingScheme ? tilingScheme.scaleAtLevel(zoom) : undefined;
  }

  function computeScale(view, camera, center) {
    // Accepts either:
    // 1: an internal Camera
    // 2: an external Camera and a center Point

    var renderSR = view.renderSpatialReference;

    if (!camera) {
      camera = view.navigation.currentCamera;
    }

    var lat;
    var dist;
    var sr = SpatialReference.WGS84;

    if (camera.center) {
      projectionUtils.vectorToVector(camera.center, renderSR, tmpCenter, sr);
      lat = tmpCenter[1];

      dist = camera.distance;
    } else {
      lat = camera.position.latitude;

      projectionUtils.pointToVector(camera.position, tmpEye, renderSR);
      projectionUtils.pointToVector(center, tmpCenter, renderSR);

      dist = vec3d.dist(tmpEye, tmpCenter);
    }

    return distanceToScale(view, dist, lat);
  }

  return {
    externalToInternal: externalToInternal,
    internalToExternal: internalToExternal,

    scaleToDistance: scaleToDistance,
    distanceToScale: distanceToScale,

    fromExtent: fromExtent,
    toExtent: toExtent,

    fromCenterScale: fromCenterScale,
    directionToHeadingTilt: directionToHeadingTilt,
    eyeHeadingTiltForCenterPointAtDistance: eyeHeadingTiltForCenterPointAtDistance,

    scaleToZoom: scaleToZoom,
    zoomToScale: zoomToScale,
    computeScale: computeScale
  };
});
