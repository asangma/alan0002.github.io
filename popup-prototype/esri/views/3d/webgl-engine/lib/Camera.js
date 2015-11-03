/* jshint bitwise:false */
define([
  "./Util",
  "./gl-matrix"
  ], function (Util, glMatrix) {

  var vec3d = glMatrix.vec3d;
  var vec4d = glMatrix.vec4d;
  var mat4d = glMatrix.mat4d;

  var arraysEqual = Util.arraysEqual;
  var clamp = Util.clamp;

  var tmpV3 = vec3d.create();
  var tmpV4 = vec4d.create();
  var tmpM = mat4d.create();

  function vec4ddist2(v1, v2) {
    var x = v2[0] - v1[0],
        y = v2[1] - v1[1],
        z = v2[2] - v1[2],
        w = v2[3] - v1[3];

    return x * x + y * y + z * z + w * w;
  }

  /* Static camera view implementation.
   *
   * This is a basic implementation of a Camera interface used in the webgl
   * engine. The Camera specifies the View position and orientation only
   * (i.e. not the projection or viewport), using an eye position, look at
   * position and up vector.
   *
   */
  var Camera = function Camera(eye, center, up) {
    this._eye = vec3d.create(eye);
    this._center = vec3d.create(center);

    this._fov = 55 / 180 * Math.PI;
    this._viewport = vec4d.create();

    this._near = 1;
    this._far = 1000;

    if (up !== undefined) {
      this._up = vec3d.create(up);
    } else {
      this._up = vec3d.create([0, 0, 1]);
    }

    this._viewDirty = true;
    this._viewMatrix = mat4d.create();

    this._projectionDirty = true;
    this._projectionMatrix = mat4d.create();

    this._viewInverseTransposeMatrixDirty = true;
    this._viewInverseTransposeMatrix = null;

    this._frustumPlanesDirty = true;
    this._frustumPlanes = new Array(6);
    for (var i = 0; i < 6; ++i) {
      this._frustumPlanes[i] = vec4d.create();
    }

    this._padding = vec4d.create();

    this._fullViewport = null;
  };

  function getter(name) {
    var vname = "_" + name;

    return function() {
      return this[vname];
    };
  }

  function viewSetterVec3(name) {
    var vname = "_" + name;

    return function(value) {
      if (!arraysEqual(this[vname], value)) {
        vec3d.set(value, this[vname]);

        this._viewDirty = true;
        this._frustumPlanesDirty = true;
      }
    };
  }

  function projectionSetter(name) {
    var vname = "_" + name;

    return function(value) {
      if (this[vname] !== value) {
        this[vname] = value;
        this._projectionDirty = true;
        this._frustumPlanesDirty = true;
      }
    };
  }

  Object.defineProperties(Camera.prototype, {
    eye: {
      get: getter("eye"),
      set: viewSetterVec3("eye")
    },

    center: {
      get: getter("center"),
      set: viewSetterVec3("center")
    },

    up: {
      get: getter("up"),
      set: viewSetterVec3("up")
    },

    viewMatrix: {
      get: function() {
        if (this._viewDirty) {
          mat4d.lookAt(this._eye, this._center, this._up, this._viewMatrix);
          this._viewDirty = false;
          this._viewInverseTransposeMatrixDirty = true;
        }

        return this._viewMatrix;
      },

      set: function(value) {
        mat4d.set(value, this._viewMatrix);
        this._viewDirty = false;
        this._viewInverseTransposeMatrixDirty = true;
        this._frustumPlanesDirty = true;
      }
    },

    near: {
      get: getter("near"),
      set: projectionSetter("near")
    },

    far: {
      get: getter("far"),
      set: projectionSetter("far")
    },

    viewport: {
      get: getter("viewport"),

      set: function(value) {
        this.x = value[0];
        this.y = value[1];
        this.width = value[2];
        this.height = value[3];
      }
    },

    x: {
      get: function() {
        return this._viewport[0];
      },

      set: function(value) {
        value += this._padding[3];

        if (this._viewport[0] !== value) {
          this._viewport[0] = value;
          this._projectionDirty = true;
          this._frustumPlanesDirty = true;
        }
      }
    },

    y: {
      get: function() {
        return this._viewport[1];
      },

      set: function(value) {
        value += this._padding[2];

        if (this._viewport[1] !== value) {
          this._viewport[1] = value;
          this._projectionDirty = true;
          this._frustumPlanesDirty = true;
        }
      }
    },

    width: {
      get: function() {
        return this._viewport[2];
      },

      set: function(value) {
        value -= (this._padding[1] + this._padding[3]);

        if (this._viewport[2] !== value) {
          this._viewport[2] = value;
          this._projectionDirty = true;
          this._frustumPlanesDirty = true;
        }
      }
    },

    height: {
      get: function() {
        return this._viewport[3];
      },

      set: function(value) {
        value -= (this._padding[0] + this._padding[2]);

        if (this._viewport[3] !== value) {
          this._viewport[3] = value;
          this._projectionDirty = true;
          this._frustumPlanesDirty = true;
        }
      }
    },

    fullWidth: {
      get: function() {
        return this._viewport[2] + this._padding[1] + this._padding[3];
      }
    },

    fullHeight: {
      get: function() {
        return this._viewport[3] + this._padding[0] + this._padding[2];
      }
    },

    fullViewport: {
      get: function() {
        if (!this._fullViewport) {
          this._fullViewport = vec4d.create();
        }

        this._fullViewport[0] = this._viewport[0] - this._padding[3];
        this._fullViewport[1] = this._viewport[1] - this._padding[2];
        this._fullViewport[2] = this.fullWidth;
        this._fullViewport[3] = this.fullHeight;

        return this._fullViewport;
      }
    },

    aspect: {
      get: function() {
        return this.width / this.height;
      }
    },

    padding: {
      get: function() {
        return this._padding;
      },

      set: function(value) {
        if (arraysEqual(this._padding, value)) {
          return;
        }

        // Update viewport by decompensation of previous padding and compensation
        // of new padding
        this._viewport[0] += value[3] - this._padding[3];
        this._viewport[1] += value[2] - this._padding[2];
        this._viewport[2] -= (value[1] + value[3]) - (this._padding[1] + this._padding[3]);
        this._viewport[3] -= (value[0] + value[2]) - (this._padding[0] + this._padding[2]);

        vec4d.set(value, this._padding);
        this._projectionDirty = true;
        this._frustumPlanesDirty = true;
      }
    },

    projectionMatrix: {
      get: function() {
        if (this._projectionDirty) {
          var width = this.width;
          var height = this.height;

          var top = this.near * Math.tan(this.fovY / 2);
          var right = top * this.aspect;

          mat4d.frustum(-right * (1 + 2 * this._padding[3] / width),
                         right * (1 + 2 * this._padding[1] / width),
                        -top   * (1 + 2 * this._padding[2] / height),
                         top   * (1 + 2 * this._padding[0] / height),
                         this.near,
                         this.far,
                         this._projectionMatrix);

          this._projectionDirty = false;
        }

        return this._projectionMatrix;
      },

      set: function(value) {
        mat4d.set(value, this._projectionMatrix);
        this._projectionDirty = false;
        this._frustumPlanesDirty = true;
      }
    },

    fov: {
      get: function() {
        return this._fov;
      },

      set: function(value) {
        this._fov = value;
        this._projectionDirty = true;
        this._frustumPlanesDirty = true;
      }
    },

    fovX: {
      get: function() {
        return Util.fovd2fovx(this._fov, this.width, this.height);
      },

      set: function(value) {
        this._fov = Util.fovx2fovd(value, this.width, this.height);
        this._projectionDirty = true;
        this._frustumPlanesDirty = true;
      }
    },

    fovY: {
      get: function() {
        return Util.fovd2fovy(this._fov, this.width, this.height);
      },

      set: function(value) {
        this._fov = Util.fovy2fovd(value, this.width, this.height);
        this._projectionDirty = true;
        this._frustumPlanesDirty = true;
      }
    },

    distance: {
      get: function() {
        return vec3d.dist(this._center, this._eye);
      }
    },

    angleOfElevation: {
      get: function() {
        vec3d.subtract(this._center, this._eye, tmpV3);
        vec3d.normalize(tmpV3);

        var dot = vec3d.dot(this._center, tmpV3) / vec3d.length(this._center);
        return Math.acos(clamp(dot, -1, 1)) - 0.5 * Math.PI;
      }
    },

    frustumPoints: {
      get: function() {
        return this.computeFrustumPoints();
      }
    },

    frustumPlanes: {
      get: function() {
        if (this._frustumPlanesDirty) {
          this._frustumPlanes = this.computeFrustumPlanes(this._frustumPlanes);
          this._frustumPlanesDirty = false;
        }
        return this._frustumPlanes;
      }
    },

    viewInverseTransposeMatrix: {
      get: function() {
        if (this._viewInverseTransposeMatrixDirty || this._viewDirty) {
          if (!this._viewInverseTransposeMatrix) {
            this._viewInverseTransposeMatrix = mat4d.create();
          }

          mat4d.inverse(this.viewMatrix, this._viewInverseTransposeMatrix);
          mat4d.transpose(this._viewInverseTransposeMatrix);

          this._viewInverseTransposeMatrixDirty = false;
        }

        return this._viewInverseTransposeMatrix;
      }
    },

    perPixelRatio: {
      get: function() {
        return Math.tan(this.fovX / 2) / this.width;
      }
    }
  });

  Camera.prototype.copyFrom = function(other) {
    vec3d.set(other._eye, this._eye);
    vec3d.set(other._center, this._center);
    vec3d.set(other._up, this._up);

    vec4d.set(other._viewport, this._viewport);
    vec4d.set(other._padding, this._padding);

    this._near = other._near;
    this._far = other._far;
    this._fov = other._fov;

    if (!other._viewDirty) {
      mat4d.set(other._viewMatrix, this._viewMatrix);
      this._viewDirty = false;
    } else {
      this._viewDirty = true;
      this._frustumPlanesDirty = true;
    }

    if (!other._projectionDirty) {
      mat4d.set(other._projectionMatrix, this._projectionMatrix);
      this._projectionDirty = false;
    } else {
      this._projectionDirty = true;
      this._frustumPlanesDirty = true;
    }

    return this;
  };

  Camera.prototype.copy = function() {
    var cam = new Camera();

    cam.copyFrom(this);
    return cam;
  };

  Camera.prototype.equals = function(other) {
    return arraysEqual(this._eye, other._eye) &&
           arraysEqual(this._center, other._center) &&
           arraysEqual(this._up, other._up) &&
           arraysEqual(this._viewport, other._viewport) &&
           arraysEqual(this._padding, other._padding) &&
           this._near === other._near &&
           this._far === other._far &&
           this._fov === other._fov;
  };

  Camera.prototype.almostEquals = function(other, relEpsilon) {
    var epsilon = vec3d.dist(this.eye, this.center) * (relEpsilon || 0.0005);
    var epsilon2 = epsilon * epsilon;

    return vec3d.dist2(other.eye, this.eye) < epsilon2 &&
      vec3d.dist2(other.center, this.center) < epsilon2 &&
      Math.abs(other.fov - this.fov) < 0.001 &&
      vec4ddist2(other.padding, this.padding) < 0.5;
  };

  Camera.prototype.markViewDirty = function() {
    this._viewDirty = true;
    this._frustumPlanesDirty = true;
  };

  Camera.prototype.computeDirection = function(direction) {
    if (!direction) {
      direction = vec3d.create();
    }

    return vec3d.normalize(vec3d.subtract(this._center, this._eye, direction));
  };

  Camera.prototype.computePixelSizeAt = function(pos) {
    var d = vec3d.dist(pos, this._eye);
    return 2 * d * Math.tan(this.fovX / 2) / this.width;
  };

  Camera.prototype.computePixelSizeAtDist = function(d) {
    return 2 * d * Math.tan(this.fovX / 2) / this.width;
  };

  Camera.prototype.computeDistanceFromRadius = function(radius, padding) {
    padding = padding || 1.0;
    return radius/Math.tan(Math.min(this.fovX,this.fovY)/(2.0*padding));
  };

  Camera.prototype.computeFrustumPlanes = function(result) {
    if (!result) {
      result = new Array(6);

      for (var i = 0; i < 6; ++i) {
        result[i] = vec4d.create();
      }
    }

    Util.matrix2frustumPlanes(this.viewMatrix, this.projectionMatrix, result);
    return result;
  };

  Camera.prototype.computeFrustumPoints = function(result) {
    if (!result) {
      result = new Array(8);

      for (var i = 0; i < 8; ++i) {
        result[i] = vec3d.create();
      }
    }

    Util.matrix2frustum(this.viewMatrix, this.projectionMatrix, result);
    return result;
  };

  Camera.frameCenterRadiusWithPadding = function(center, distance, padding) {
    distance = Math.max(0.000001, distance);

    padding = padding || 0;
    padding = padding + 2;

    // minimum is 2 - to get the Bounding Sphere diameter
    padding = Math.max(2, padding);

    return {
      center: center,
      radius: distance * padding
    };
  };

  Camera.prototype.setGLViewport = function(gl) {
    var vp = this.viewport;
    var pad = this.padding;

    gl.viewport(vp[0] - pad[3],
                vp[1] - pad[2],
                vp[2] + pad[1] + pad[3],
                vp[3] + pad[0] + pad[2]);
  };
  
  Camera.prototype.projectPoint = function(worldPoint, outScreenPoint, linearZ) {
    vec4d.set4(worldPoint[0], worldPoint[1], worldPoint[2], 1.0, tmpV4);
    mat4d.multiplyVec4(this.viewMatrix, tmpV4);
    if (linearZ) {
      outScreenPoint[2] = -tmpV4[2];
    }
    mat4d.multiplyVec4(this.projectionMatrix, tmpV4);
    vec3d.scale(tmpV4, 1.0 / Math.abs(tmpV4[3]));
    var viewport = this.viewport;
    outScreenPoint[0] = Util.lerp(0, viewport[0] + viewport[2], 0.5 + 0.5 * tmpV4[0]);
    outScreenPoint[1] = Util.lerp(0, viewport[1] + viewport[3], 0.5 + 0.5 * tmpV4[1]);
    if (!linearZ) {
      outScreenPoint[2] = 0.5*(tmpV4[2] + 1);
    }
    return outScreenPoint;
  };
  
  Camera.prototype.unprojectPoint = function(screenPoint, outWorldPoint, linearZ) {
    if (linearZ) {
      console.error("Camera.unprojectPoint() not yet implemented for linear Z");
      return null;
    }

    mat4d.multiply(this.projectionMatrix, this.viewMatrix, tmpM);
    if (!mat4d.inverse(tmpM)) {
      return null;
    }

    var viewport = this.viewport;
    tmpV4[0] = (screenPoint[0] - viewport[0]) * 2 / viewport[2] - 1;
    tmpV4[1] = (screenPoint[1] - viewport[1]) * 2 / viewport[3] - 1;
    tmpV4[2] = 2 * screenPoint[2] - 1;
    tmpV4[3] = 1;

    mat4d.multiplyVec4(tmpM, tmpV4);
    if (tmpV4[3] === 0) {
      return null;
    }

    outWorldPoint[0] = tmpV4[0] / tmpV4[3];
    outWorldPoint[1] = tmpV4[1] / tmpV4[3];
    outWorldPoint[2] = tmpV4[2] / tmpV4[3];

    return outWorldPoint;
  };

  var tmpV = vec3d.create();

  Camera.prototype.computeUpOnSphere = function() {
    vec3d.subtract(this.center, this.eye, tmpV);

    var lookAtDist = vec3d.length(this.center);

    if (lookAtDist < 1) {
      // POI near origin
      vec3d.set3(0, 0, 1, this.up);
    // jshint noempty:false
    } else if (Math.abs(vec3d.dot(tmpV, this.center)) > 0.9999 * vec3d.length(tmpV) * lookAtDist) {
      // view direction almost perpendicular -> leave up vector untouched
    } else {
      // normal case: up = ((lookAt - eye) x (lookat - origin)) x (lookAt - eye)
      vec3d.cross(tmpV, this.center, this.up);
      vec3d.cross(this.up, tmpV, this.up);
      vec3d.normalize(this.up);
    }
  };

  return Camera;
});
