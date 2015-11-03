// jshint bitwise:false, forin:false
define([
  "./GLVBO",
  "./GLSLProgram",
  "./VertexBufferLayout",
  "./GLUtil",
  "./Camera",
  "./Util",
  "./gl-matrix"
  ], function (GLVBO, GLSLProgram, VertexBufferLayout, GLUtil, Camera, Util, glMatrix){

  var vec2d = glMatrix.vec2d;
  var vec3d = glMatrix.vec3d;
  var vec4d = glMatrix.vec4d;
  var mat3d = glMatrix.mat3d;
  var mat4d = glMatrix.mat4d;
  var mat4 = glMatrix.mat4;

//todo:
//possible optimizations: cull objects per cascade (dont render everything)
//fix incorrect culling of objects between light and frustum

  var ShadowMap = function ShadowMap(programRep, gl) {
    var doShadowMapMipmapsWork = false;

    var depthTex;
    var textureRes = 4096;
    var renderbuffer;
    var fbo;

    var numCascades = 1;
    var maxNumCascades = 2;

    var cascadeDistances = [ 0.0, 0.0, 0.0, 0.0, 0.0 ];

    var Cascade = function() {
      this.camera = new Camera();
      this.lightMat = mat4d.create();
    };

    var cascades = [];
    var i, j, k;

    for (i = 0; i < 4; ++i) {
      cascades[i] = new Cascade();
    }

    this.getIsSupported = function() {
      return gl.getExtension("OES_standard_derivatives");
    };

    this.setTextureResolution = function(res) {
      textureRes = res;
    };
    this.getTextureResolution = function() {
      return textureRes;
    };

    this.setMaxNumCascades = function(num) {
      maxNumCascades = Util.clamp(Math.floor(num), 1, 4);
    };
    this.getMaxNumCascades = function() {
      return maxNumCascades;
    };


    this.setEnableState = function(state) {
      Util.assert(state !== this.getEnableState());

      if (state) {
        this.enable();
      }
      else {
        this.disable();
      }
    };

    this.getEnableState = function() {
      return depthTex !== undefined;
    };

    this.enable = function() {
      Util.assert(!this.getEnableState());

      Util.assert(this.getIsSupported(), "Shadow maps not supported");

      depthTex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, depthTex);

      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

      //gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MAX_ANISOTROPY_EXT, maxDegreeOfAnisotropy);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, textureRes, textureRes, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

      renderbuffer = gl.createRenderbuffer();
      gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, textureRes, textureRes);

      fbo = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, depthTex, 0);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);

      GLUtil.checkFramebufferStatus(gl.FRAMEBUFFER, gl);

      gl.bindRenderbuffer(gl.RENDERBUFFER, null);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    };

    this.disable = function() {
      Util.assert(this.getEnableState());

      gl.deleteFramebuffer(fbo);
      gl.deleteRenderbuffer(renderbuffer);
      gl.deleteTexture(depthTex);

      fbo = undefined;
      renderbuffer = undefined;
      depthTex = undefined;
    };

    var tmpProjViewMat = mat4d.create();
    var tmpProjViewMatInv = mat4d.create();

    var tmpP = vec4d.create();

    var tmpFrustum = new Array(8);

    for (i = 0; i < 8; ++i) {
      tmpFrustum[i] = vec4d.create();
    }

    var tmpMin = vec3d.create();
    var tmpMax = vec3d.create();

    var tmpQ = vec2d.create();
    var tmpT0 = vec2d.create();
    var tmpT1 = vec2d.create();
    var tmpT2 = vec2d.create();
    var tmpT3 = vec2d.create();

    var tmpMvMatLight = mat4d.create();
    var tmpTransl = vec3d.create();

    this.prepare = function(camera, lightDir, content, visibleContent, sceneNearFar) {
      Util.assert(this.getEnableState());

      mat4d.multiply(camera.projectionMatrix, camera.viewMatrix, tmpProjViewMat);

      var near = sceneNearFar[0];
      var far = sceneNearFar[1];

      if (near < 2.0) {
        near = 2.0;
      }

      if (far < 2.0) {
        far = 2.0;
      }

      if (near >= far) {
        near = 2.0;
        far = 4.0;
      }

      //calc cascade distances
      numCascades = Math.min(1 + Math.floor(Util.logWithBase(far / near, 4.0)), maxNumCascades);

      var factor = Math.pow(far / near, 1.0 / numCascades);

      for (var i = 0; i < numCascades + 1; ++i) {
        cascadeDistances[i] = near * Math.pow(factor, i);
      }

      //build shadowmap matrix for every cascade
      mat4d.inverse(tmpProjViewMat, tmpProjViewMatInv);
      mat4d.lookAt([ 0.0, 0.0, 0.0 ], [ -lightDir[0], -lightDir[1], -lightDir[2] ], [ 0.0, 1.0, 0.0 ], tmpMvMatLight);

      var view = camera.viewMatrix;
      var proj = camera.projectionMatrix;

      for (i = 0; i < numCascades; ++i) {
        var cascade = cascades[i];

        var nearNeg = -cascadeDistances[i];
        var farNeg = -cascadeDistances[i + 1];


        //transform from eye space to unit cube [-1,1] (assumes proj[2,6,3 and 7] are 0)
        var minZ = (proj[10] * nearNeg + proj[14]) / Math.abs(proj[11] * nearNeg + proj[15]);
        var maxZ = (proj[10] * farNeg + proj[14]) / Math.abs(proj[11] * farNeg + proj[15]);

        Util.assert(minZ < maxZ);

        //for every unit cube vertex
        for (j = 0; j < 8; ++j) {
          //calc unit cube position
          var x = (j % 4) === 0 || (j % 4) == 3 ? -1.0 : 1.0;
          var y = (j % 4) === 0 || (j % 4) == 1 ? -1.0 : 1.0;
          var z = j < 4 ? minZ : maxZ;
          vec4d.set4(x, y, z, 1.0, tmpP);
          //project camera frustum of cascade to worldspace
          mat4d.multiplyVec4(tmpProjViewMatInv, tmpP, tmpFrustum[j]);

          for (k = 0; k < 3; ++k) {
            tmpFrustum[j][k] /= tmpFrustum[j][3];
          }
        }

        //transform to light view space
        vec3d.negate(tmpFrustum[0], tmpTransl);
        mat4d.translate(tmpMvMatLight, tmpTransl, cascade.camera.viewMatrix);

        for (j = 0; j < 8; ++j) {
          mat4d.multiplyVec3(cascade.camera.viewMatrix, tmpFrustum[j]);
        }

        // tmpFrustum[n][0..2] is in light space now (tmpFrustum[n][3] is not modified!)

        //calc bounding box of frustum in light space
        vec3d.set(tmpFrustum[0], tmpMin);
        vec3d.set(tmpFrustum[0], tmpMax);

        for (j = 1; j < 8; ++j) {
          for (k = 0; k < 3; ++k) {
            tmpMin[k] = Math.min(tmpMin[k], tmpFrustum[j][k]);
            tmpMax[k] = Math.max(tmpMax[k], tmpFrustum[j][k]);
          }
        }

        //heuristic: make bigger to include most of the objects between light and frustum
        //can miss objects! TODO: use convex hull?
        tmpMin[2] -= 200.0;
        tmpMax[2] += 200.0;

        cascade.camera.near = -tmpMax[2];
        cascade.camera.far = -tmpMin[2];

        var warp = true;

        //perspective warping
        if (warp) {
          //adapted from http://www.comp.nus.edu.sg/~tants/tsm/TSM_recipe.html
          //paper "Anti-aliasing and Continuity with Trapezoidal Shadow Maps"

          near = 1.0 / tmpFrustum[0][3];
          far = 1.0 / tmpFrustum[4][3];

          Util.assert(near < far);

          //basil"s heuristic for the distortion coefficient
          var eta = near + Math.sqrt(near * far);

          //sinGamma == 0 when light behind camera
          var sinGamma = Math.sin(Math.acos(view[2] * lightDir[0] + view[6] * lightDir[1] + view[10] * lightDir[2]));
          //reduce distortion when light behind camera
          eta /= sinGamma;

          //tmp* are parameters of trapez
          calcTrapezoid(tmpFrustum, eta, sinGamma, tmpQ, tmpT0, tmpT1, tmpT2, tmpT3);

          // this maps the trapezoid to [-1, 1] but leaves z as is
          mapTrapezoidToSquare(tmpQ, tmpT0, tmpT2, tmpT3, cascade.camera.projectionMatrix);

          // map z range to [-1, 1]
          cascade.camera.projectionMatrix[10] = 2.0 / (tmpMin[2] - tmpMax[2]);
          cascade.camera.projectionMatrix[14] = -(tmpMin[2] + tmpMax[2]) / (tmpMin[2] - tmpMax[2]);

        } else {
          mat4d.ortho(tmpMin[0], tmpMax[0], tmpMin[1], tmpMax[1], cascade.camera.near, cascade.camera.far, cascade.camera.projectionMatrix);
        }

        mat4d.multiply(cascade.camera.projectionMatrix, cascade.camera.viewMatrix, cascade.lightMat);

        var res2 = textureRes / 2;

        cascade.camera.viewport[0] = i % 2 === 0 ? 0 : res2;
        cascade.camera.viewport[1] = Math.floor(i / 2) === 0 ? 0 : res2;
        cascade.camera.viewport[2] = res2;
        cascade.camera.viewport[3] = res2;
      }

      //hack: set last distance really far away to force usage of last cascade even when fit is too tight
      //TODO: make sure fit ("far") is never too tight
      cascadeDistances[numCascades] = far*100;

      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

      gl.clearColor(1,1,1,1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    };

    var tmpResult = [];

    this.getCascades = function() {
      for (var i = 0; i < numCascades; ++i) {
        tmpResult[i] = cascades[i];
      }

      tmpResult.length = numCascades;

      return tmpResult;
    };

    this.finish = function(fbo) {
      Util.assert(this.getEnableState());

      GLSLProgram.unuse(gl);

      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

      if (doShadowMapMipmapsWork) {
        gl.bindTexture(gl.TEXTURE_2D, depthTex);
        gl.generateMipmap(gl.TEXTURE_2D);
      }
    };

    this.bind = function(program) {
      var state = this.getEnableState();

      // TODO HACK texture unit 7?
      gl.activeTexture(gl.TEXTURE7);
      gl.bindTexture(gl.TEXTURE_2D, state ? depthTex : null);
      gl.activeTexture(gl.TEXTURE0);

      program.use();  // !

      program.uniform1i("depthTex", 7);

      program.uniform1f("depthHalfPixelSz", state ? 0.5 / textureRes : -1.0); // use -1.0 as disabled-marker

      program.uniform1i("shadowMapNum", numCascades);
      program.uniform4f("shadowMapDistance", cascadeDistances[0], cascadeDistances[1], cascadeDistances[2], cascadeDistances[3]);
    };

    this.bindAll = function(programRep) {
      var programsUsingShadowMap = programRep.getProgramsUsingUniform("shadowMapDistance");

      for (var i = 0; i < programsUsingShadowMap.length; i++) {
        this.bind(programsUsingShadowMap[i]);
      }
    };

    var tmpLightMat = mat4.create();

    var tmpLightMats = new Float32Array(16 * 4);

    this.bindView = function(program, origin) {
      if (!this.getEnableState()) {
        return;
      }

      var i;

      mat4.translate(cascades[0].lightMat, origin, tmpLightMat);
      
      for (i = 0; i < 16; ++i) {
        tmpLightMats[i] = tmpLightMat[i];
      }
      
      mat4.translate(cascades[1].lightMat, origin, tmpLightMat);
      
      for (i = 0; i < 16; ++i) {
        tmpLightMats[16 + i] = tmpLightMat[i];
      }
      
      mat4.translate(cascades[2].lightMat, origin, tmpLightMat);
      
      for (i = 0; i < 16; ++i) {
        tmpLightMats[32 + i] = tmpLightMat[i];
      }
      
      mat4.translate(cascades[3].lightMat, origin, tmpLightMat);
      
      for (i = 0; i < 16; ++i) {
        tmpLightMats[48 + i] = tmpLightMat[i];
      }

      program.uniformMatrix4fv("shadowMapMatrix", tmpLightMats);
    };

    var x = 0;
    var y = 0;
    var width = 256;
    var height = 256;

    var data = new Float32Array(4 * 2 * 2);
    data[0]  = x;         data[1]  = y;
    data[2]  = 0.0;       data[3]  = 0.0;
    data[4]  = x + width; data[5]  = y;
    data[6]  = 1.0;       data[7]  = 0.0;
    data[8]  = x;         data[9]  = y + height;
    data[10] = 0.0;       data[11] = 1.0;
    data[12] = x + width; data[13] = y + height;
    data[14] = 1.0;       data[15] = 1.0;

    var quadVBOLayout = VertexBufferLayout.Defaults.Pos2Tex;
    var quadVBO = new GLVBO(data, quadVBOLayout, gl);

    this.drawDebugQuad = function(proj) {
      Util.assert(this.getEnableState());

      var program = programRep.get("showDepth");

      gl.disable(gl.DEPTH_TEST);

      program.use();
      program.uniformMatrix4fv("proj", proj);
      program.uniform1i("depthTex", 0);

      gl.bindTexture(gl.TEXTURE_2D, depthTex);

      quadVBOLayout.enableVertexAttribArrays(gl, program);

      quadVBO.bind();
      quadVBO.setPointers(program);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, quadVBO.getNum());

      gl.bindBuffer(gl.ARRAY_BUFFER, null);

      quadVBOLayout.disableVertexAttribArrays(gl, program);

      GLSLProgram.unuse(gl);

      gl.enable(gl.DEPTH_TEST);
    };

    var tmpCn = vec2d.create();
    var tmpCf = vec2d.create();

    var tmpM = [ vec2d.create(), vec2d.create(), vec2d.create(), vec2d.create() ];

    var tmpDir = vec2d.create();
    var tmpNf = vec2d.create();

    var tmpVec = vec2d.create();

    var tmpQv = vec2d.create();

    var tmpMn = vec2d.create();
    var tmpMf = vec2d.create();
    var tmpNdir = vec2d.create();

    function calcTrapezoid(frustum, eta, sinGamma, q, t0, t1, t2, t3) {
      // calc. centers of near and far plane
      vec2d.set2(0.0, 0.0, tmpCn);

      var i;

      for (i = 0; i < 4; ++i) {
        vec2d.add(tmpCn, frustum[i], tmpCn);
      }

      vec2d.scale(tmpCn, 0.25);

      vec2d.set2(0.0, 0.0, tmpCf);

      for (i = 4; i < 8; ++i) {
        vec2d.add(tmpCf, frustum[i], tmpCf);
      }

      vec2d.scale(tmpCf, 0.25);

      // The "center line" is the line that passes through the centers of the near
      // and far plane. However, when those points coincide, the center line is
      // not defined. In this case, the procedure is as follows:
      //  * decide which edge of the far plane is nearest to the near plane"s center
      //  * direction of center line = perpendicular to nearest edge

      // TODO use real distance to line, not to midpoint (?)

      // calc. edge midpoints of far plane
      vec2d.lerp(frustum[4], frustum[5], 0.5, tmpM[0]);
      vec2d.lerp(frustum[5], frustum[6], 0.5, tmpM[1]);
      vec2d.lerp(frustum[6], frustum[7], 0.5, tmpM[2]);
      vec2d.lerp(frustum[7], frustum[4], 0.5, tmpM[3]);

      var mmMin = 0;
      var dMin = vec2d.dist2(tmpM[0], tmpCn);
      
      for (i = 1; i < 4; ++i) {
        var d = vec2d.dist2(tmpM[i], tmpCn);
        
        if (d < dMin) {
          dMin = d;
          mmMin = i;
        }
      }

      vec2d.subtract(tmpM[mmMin], frustum[mmMin + 4], tmpDir);
      var tmpSwap = tmpDir[0];
      tmpDir[0] = -tmpDir[1];
      tmpDir[1] = tmpSwap;

      vec2d.subtract(tmpCf, tmpCn, tmpNf);

      // blend between the real center line and the "backup" center line
      vec2d.lerp(tmpDir, tmpNf, sinGamma);
      vec2d.normalize(tmpDir);

      var projNear, projFar;
      projNear = projFar = vec2d.dot(vec2d.subtract(frustum[0], tmpCn, tmpVec), tmpDir);

      for (i = 1; i < 8; ++i) {
        var p = vec2d.dot(vec2d.subtract(frustum[i], tmpCn, tmpVec), tmpDir);
        
        if (p < projNear) {
          projNear = p;
        }
        else if (p > projFar) {
          projFar = p;
        }
      }

      vec2d.set(tmpCn, q);
      vec2d.scale(tmpDir, projNear - eta, tmpVec);
      vec2d.add(q, tmpVec, q);

      // find line from q to outermost points of frustum
      var leftArea = -1.0;
      var rightArea = 1.0;
      var leftIdx = 0;
      var rightIdx = 0;

      for (i = 0; i < 8; ++i) {
        vec2d.subtract(frustum[i], q, tmpQv);
        vec2d.normalize(tmpQv);

        var area = tmpDir[0] * tmpQv[1] - tmpDir[1] * tmpQv[0];

        if (area > 0.0) {    // left (viewed from q)
          if (area > leftArea) {
            leftArea = area;
            leftIdx = i;
          }
        } else {
          if (area < rightArea) {
            rightArea = area;
            rightIdx = i;
          }
        }
      }

      Util.verify(leftArea > 0.0, "leftArea");
      Util.verify(rightArea < 0.0, "rightArea");

      vec2d.scale(tmpDir, projNear, tmpMn);
      vec2d.add(tmpMn, tmpCn, tmpMn);

      vec2d.scale(tmpDir, projFar, tmpMf);
      vec2d.add(tmpMf, tmpCn, tmpMf);

      tmpNdir[0] = -tmpDir[1];
      tmpNdir[1] = tmpDir[0];  // is normalized, but does not have to be

      var is0 = Util.rayRay2D(q, frustum[rightIdx], tmpMf, vec2d.add(tmpMf, tmpNdir, tmpVec), 1, t0);
      var is1 = Util.rayRay2D(q, frustum[leftIdx], tmpMf, tmpVec, 1, t1);
      var is2 = Util.rayRay2D(q, frustum[leftIdx], tmpMn, vec2d.add(tmpMn, tmpNdir, tmpVec), 1, t2);
      var is3 = Util.rayRay2D(q, frustum[rightIdx], tmpMn, tmpVec, 1, t3);

      Util.verify(is0, "rayRay");
      Util.verify(is1, "rayRay");
      Util.verify(is2, "rayRay");
      Util.verify(is3, "rayRay");
    }

    function elem(row, col) {
      return 3 * col + row;
    }

    var tmpRow = vec3d.create();

    function row(mat, i) {
      vec3d.set3(mat[i], mat[i + 3], mat[i + 6], tmpRow);
      return tmpRow;
    }

    var tmpD23 = vec2d.create();
    var tmpMat = mat3d.create();

    function mapTrapezoidToSquare(q, t0, t2, t3, result) {
      // M1 = R * T1
      vec2d.scale(vec2d.subtract(t2, t3, tmpD23), 0.5);

      tmpMat[0] = tmpD23[0]; tmpMat[1] = tmpD23[1]; tmpMat[2] = 0.0;
      tmpMat[3] = tmpD23[1]; tmpMat[4] = -tmpD23[0]; tmpMat[5] = 0.0;
      tmpMat[6] = tmpD23[0] * tmpD23[0] + tmpD23[1] * tmpD23[1]; tmpMat[7] = tmpD23[0] * tmpD23[1] - tmpD23[1] * tmpD23[0]; tmpMat[8] = 1.0;

      tmpMat[elem(0, 2)] = -vec2d.dot(row(tmpMat, 0), q);
      tmpMat[elem(1, 2)] = -vec2d.dot(row(tmpMat, 1), q);

      // M1 = H * M2 = H * T2 * R * T1
      var a = vec2d.dot(row(tmpMat, 0), t2) + tmpMat[elem(0, 2)];
      var b = vec2d.dot(row(tmpMat, 1), t2) + tmpMat[elem(1, 2)];
      var c = vec2d.dot(row(tmpMat, 0), t3) + tmpMat[elem(0, 2)];
      var d = vec2d.dot(row(tmpMat, 1), t3) + tmpMat[elem(1, 2)];

      a = -(a + c) / (b + d);

      tmpMat[elem(0, 0)] += tmpMat[elem(1, 0)] * a;
      tmpMat[elem(0, 1)] += tmpMat[elem(1, 1)] * a;
      tmpMat[elem(0, 2)] += tmpMat[elem(1, 2)] * a;

      // M2 = S1 * M1 = S1 * H * T2 * R * T1
      a = 1.0 / (vec2d.dot(row(tmpMat, 0), t2) + tmpMat[elem(0, 2)]);
      b = 1.0 / (vec2d.dot(row(tmpMat, 1), t2) + tmpMat[elem(1, 2)]);

      tmpMat[elem(0, 0)] *= a; tmpMat[elem(0, 1)] *= a; tmpMat[elem(0, 2)] *= a;
      tmpMat[elem(1, 0)] *= b; tmpMat[elem(1, 1)] *= b; tmpMat[elem(1, 2)] *= b;

      // M1 = N * M2 = N * S1 * H * T2 * R * T1
      tmpMat[elem(2, 0)] = tmpMat[elem(1, 0)]; tmpMat[elem(2, 1)] = tmpMat[elem(1, 1)]; tmpMat[elem(2, 2)] = tmpMat[elem(1, 2)];
      tmpMat[elem(1, 2)] += 1.0;

      // M2 = T3 * M1 = T3 * N * S1 * H * T2 * R * T1
      a = vec2d.dot(row(tmpMat, 1), t0) + tmpMat[elem(1, 2)];
      b = vec2d.dot(row(tmpMat, 2), t0) + tmpMat[elem(2, 2)];
      c = vec2d.dot(row(tmpMat, 1), t2) + tmpMat[elem(1, 2)];
      d = vec2d.dot(row(tmpMat, 2), t2) + tmpMat[elem(2, 2)];

      a = -0.5 * (a / b + c / d);

      tmpMat[elem(1, 0)] += tmpMat[elem(2, 0)] * a;
      tmpMat[elem(1, 1)] += tmpMat[elem(2, 1)] * a;
      tmpMat[elem(1, 2)] += tmpMat[elem(2, 2)] * a;

      // M1 = S2 * M2 = S2 * T3 * N * S1 * H * T2 * R * T1
      a = vec2d.dot(row(tmpMat, 1), t0) + tmpMat[elem(1, 2)];
      b = vec2d.dot(row(tmpMat, 2), t0) + tmpMat[elem(2, 2)];

      c = -b / a;

      tmpMat[elem(1, 0)] *= c; tmpMat[elem(1, 1)] *= c; tmpMat[elem(1, 2)] *= c;

      result[0] = tmpMat[0];  result[1] = tmpMat[1];  result[2] = 0.0;   result[3] = tmpMat[2];
      result[4] = tmpMat[3];  result[5] = tmpMat[4];  result[6] = 0.0;   result[7] = tmpMat[5];
      result[8] = 0.0;     result[9] = 0.0;     result[10] = 1.0; result[11] = 0.0;
      result[12] = tmpMat[6]; result[13] = tmpMat[7]; result[14] = 0.0;  result[15] = tmpMat[8];
    }
  };

  return ShadowMap;
});