define([
  "../lib/glMatrix"
], function(glMatrix) {
  var vec3d = glMatrix.vec3d;
  var vec2d = glMatrix.vec2d;

  var pre = {
    dir: vec3d.create(),
    len: 0,
    clip: vec2d.create()
  };

  function planeClipLine(plane, p0, pre) {
    var d = vec3d.dot(plane, pre.dir);
    var dist = -vec3d.dot(p0, plane) - plane[3];
    // d    : positive when dir is in the same half space as the plane normal
    // dist : positive when intersection is after p0, negative when before p0

    // First check for p0 being on the outside of the plane and the direction
    // of the line being outward. Never intersects.
    if (dist < 0 && d >= 0) {
      return false;
    }

    if (d > -1e-6 && d < 1e-6) {
      // co-planar, fine if inside and doesn't clip
      return true;
    }

    if ((dist < 0 || d < 0) && !(dist < 0 && d < 0)) {
      return true;
    }

    // Now we are either inside pointing in/out, or outside pointing in
    var t = dist / d;

    if (d > 0) {
      // Inside pointing out, clip p1 on plane if needed
      if (t < pre.clip[1]) {
        pre.clip[1] = t;
      }
    } else {
      // Pointing in, clip p0 on plane if needed
      if (t > pre.clip[0]) {
        pre.clip[0] = t;
      }
    }

    return pre.clip[0] <= pre.clip[1];
  }

  function frustumLine(planes, p0, p1, pre) {
    pre.clip[0] = 0;
    pre.clip[1] = p1 ? pre.len : Number.MAX_VALUE;

    for (var i = 0; i < planes.length; i++) {
      if (!planeClipLine(planes[i], p0, pre)) {
        return false;
      }
    }

    return true;
  }

  function makePre(dir, p0, p1, needsLen) {
    if (dir) {
      if (p1 && needsLen) {
        pre.len = vec3d.dist(p0, p1);
      }

      vec3d.set(dir, pre.dir);
    } else if (needsLen) {
      pre.len = vec3d.dist(p0, p1);
      vec3d.scale(vec3d.subtract(p1, p0, pre.dir), 1 / pre.len);
    } else {
      vec3d.normalize(vec3d.subtract(p1, p0, pre.dir));
    }

    return pre;
  }

  var Intersection = {
    /**
     * Determine if a sphere intersects a plane.
     * @param {vec4d} plane The plane ([nx, ny, nz, d]).
     * @param {vec3d} center The center of the sphere.
     * @param {number} radius The radius of the sphere.
     *
     * Determines whether a sphere intersects a plane.
     *
     * @returns {boolean} true if the sphere intersects the plane, false otherwise.
     */
    planeSphere: function(plane, center, radius) {
      return plane[0] * center[0] + plane[1] * center[1] + plane[2] * center[2] + plane[3] < radius;
    },

    /**
     * Determine if a sphere intersects a frustum.
     * @param {vec4d[6]} planes The planes ([nx, ny, nz, d]) of the frustum.
     * @param {vec3d} center The center of the sphere.
     * @param {number} radius The radius of the sphere.
     *
     * Determines whether a sphere intersects a frustum.
     *
     * @returns {boolean} true if the sphere intersects the frustum, false otherwise.
     */
    frustumSphere: function(planes, center, radius) {
      for (var i = 0; i < 6; i++) {
        if (!Intersection.planeSphere(planes[i], center, radius)) {
          return false;
        }
      }

      return true;
    },

    /**
     * Determine if a ray intersects a frustum.
     * @param {vec4d[6]} planes The planes ([nx, ny, nz, d]) of the frustum.
     * @param {vec3d} p0 The origin of the ray.
     * @param {vec3d|null} [p1] Second point on the ray. The ray
     * direction will be determined from this point if no direction is provided.
     * @param {vec3d} [dir] The direction of the ray.
     *
     * Determines whether a ray intersects a frustum. To specify the ray, either
     * provide a second point on the ray (in the direction of the ray) for p1,
     * or provide the ray direction directly.
     *
     * @returns {boolean} true if the ray intersects the frustum, false otherwise.
     */
    frustumRay: function(planes, p0, p1, dir) {
      var pre = makePre(dir, p0, p1, false);
      return frustumLine(planes, p0, null, pre);
    },

    /**
     * Determine if a line segment intersects a frustum.
     * @param {vec4d[6]} planes The planes ([nx, ny, nz, d]) of the frustum.
     * @param {vec3d} p0 The start of the line segment.
     * @param {vec3d} p1 The end of the line segment.
     * @param {vec3d} [dir] The precomputed direction of the line segment.
     *
     * Determines whether a line segment intersects a frustum. The direction
     * of the line sement (from p0 to p1) will be automatically computed if
     * not provided.
     *
     * @returns {boolean} true if the line segement intersects the frustum,
     * false otherwise.
     */
    frustumLineSegment: function(planes, p0, p1, dir) {
      var pre = makePre(dir, p0, p1, true);
      return frustumLine(planes, p0, p1, pre);
    }

  };

  return Intersection;
});