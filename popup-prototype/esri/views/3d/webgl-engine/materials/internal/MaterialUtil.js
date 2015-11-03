// jshint forin:false

define([
  "../../lib/IdGen",
  "../../lib/gl-matrix",
  "../../parts/Model",
  "../../lib/VertexBufferLayout",
  "../../lib/Util"
],
  function(IdGen, glMatrix, Model, VertexBufferLayout, Util) {
    var vec3d = glMatrix.vec3d;
    var mat4d = glMatrix.mat4d;
    var mat4 = glMatrix.mat4;

    var VertexAttrConstants = Util.VertexAttrConstants;

    var MaterialUtil = {};

    MaterialUtil.__Material_idGen = new IdGen();
    MaterialUtil.__GLMaterial_id = 0;

    MaterialUtil.IDENTITY = mat4d.identity();

    MaterialUtil.Layouts = VertexBufferLayout.Defaults;

    // NOTE fill and intersect helper functions are optimized, note the in-lined functions

    var transformAndFill3 = function(src, srcOffset, dst, dstOffset, transf) {
      var x = src[srcOffset];
      var y = src[srcOffset + 1];
      var z = src[srcOffset + 2];

      dst[dstOffset] = transf[0] * x + transf[4] * y + transf[8] * z + transf[12];
      dst[dstOffset + 1] = transf[1] * x + transf[5] * y + transf[9] * z + transf[13];
      dst[dstOffset + 2] = transf[2] * x + transf[6] * y + transf[10] * z + transf[14];
    };

    MaterialUtil.fill = function(src, srcOffset, dst, dstOffset, transf, size) {
      if (transf === undefined || size !== 3) {
        for (var k = 0; k < size; ++k) {
          dst[dstOffset + k] = src[srcOffset + k];
        }
      }
      else {
        transformAndFill3(src, srcOffset, dst, dstOffset, transf);
      }
      return size;
    };

    var transformAndFillInterleaved3 = function(indices, data, transf, dst, offset, stride) {
      var numIndices = indices.length;
      for (var j = 0; j < numIndices; ++j) {
        var idx0 = 3 * indices[j];

        var x = data[idx0];
        var y = data[idx0 + 1];
        var z = data[idx0 + 2];

        dst[offset] = transf[0] * x + transf[4] * y + transf[8] * z + transf[12];
        dst[offset + 1] = transf[1] * x + transf[5] * y + transf[9] * z + transf[13];
        dst[offset + 2] = transf[2] * x + transf[6] * y + transf[10] * z + transf[14];

        offset += stride;
      }
    };


    var fillInterleaved = function(indices, data, componentsPerVertex, dst, offset, stride) {
      var numIndices = indices.length;
      for (var j = 0; j < numIndices; ++j) {
        var idx0 = componentsPerVertex * indices[j];

        for (var k = 0; k < componentsPerVertex; ++k) {
          dst[offset + k] = data[idx0 + k];
        }

        offset += stride;
      }
    };

    var fillColorInterleaved = function(indices, data, componentsPerVertex, dst, offset, stride) {
      dst = new Uint8Array(dst.buffer);
      offset *= 4;
      stride *= 4;
      var numIndices = indices.length;
      for (var j = 0; j < numIndices; ++j) {
        var idx0 = componentsPerVertex * indices[j];

        var k;
        for (k = 0; k < componentsPerVertex; ++k) {
          dst[offset + k] = data[idx0 + k];
        }

        // pad alpha if necessary
        if (k < 4) {
          dst[offset + 3] = 255;
        }

        offset += stride;
      }
    };

    var multiplyAndFillColorInterleaved = function(indices, data, color, componentsPerVertex, dst, offset, stride) {
      dst = new Uint8Array(dst.buffer);
      offset *= 4;
      stride *= 4;
      var numIndices = indices.length;
      for (var j = 0; j < numIndices; ++j) {
        var idx0 = componentsPerVertex * indices[j];

        var k;
        for (k = 0; k < componentsPerVertex; ++k) {
          dst[offset + k] = data[idx0 + k] * color[k];
        }

        // pad alpha if necessary
        if (k < 4) {
          dst[offset + 3] = 255 * color[3];
        }

        offset += stride;
      }
    };

    var fillRegionInterleaved = function(indices, data, componentsPerVertex, dst, offset, stride) {
      dst = new Uint16Array(dst.buffer);
      offset *= 2;
      stride *= 2;
      var numIndices = indices.length;
      for (var j = 0; j < numIndices; ++j) {
        var idx0 = componentsPerVertex * indices[j];

        var k;
        for (k = 0; k < componentsPerVertex; ++k) {
          dst[offset + k] = data[idx0 + k];
        }

        offset += stride;
      }
    };

    MaterialUtil.fillInterleaved = function(geomData, transformation, invTranspTransformation, instanceParams,
                                            vertexBufferLayout, dst, offset, filter) {
      var attributes = vertexBufferLayout.getAttributes();
      var stride = vertexBufferLayout.getStride();
      for (var name in attributes) {
        var offset2 = offset + attributes[name].offset;

        if (filter!=null && filter[name]==null) {
          continue;
        }

        var va;

        switch(name) {
          case VertexAttrConstants.UV0:
            va = geomData.vertexAttr[name];
            
            if (va!=null) {
              fillInterleaved(geomData.faces.indices[name], va.data, va.size, dst, offset2, stride);
            }
            break;
          case VertexAttrConstants.REGION:
            va = geomData.vertexAttr[name];
            fillRegionInterleaved(geomData.faces.indices[name], va.data, va.size, dst, offset2, stride);
            break;
          case VertexAttrConstants.COLOR:
            va = geomData.vertexAttr[name];
            if (instanceParams && instanceParams.color) {
              multiplyAndFillColorInterleaved(geomData.faces.indices[name], va.data, instanceParams.color,
                va.size, dst, offset2, stride);
            }
            else {
              fillColorInterleaved(geomData.faces.indices[name], va.data, va.size, dst, offset2, stride);
            }
            break;
          default:
            // position or normal
            va = geomData.vertexAttr[name];

            var transf = name === VertexAttrConstants.POSITION ? transformation
              : (name === VertexAttrConstants.NORMAL ? invTranspTransformation : undefined);

            if (transf !== undefined && va.size === 3) {
              transformAndFillInterleaved3(geomData.faces.indices[name], va.data, transf, dst, offset2, stride);
            } else {
               fillInterleaved(geomData.faces.indices[name], va.data, va.size, dst, offset2, stride);
            }
        }
      }
    };


    var _p = vec3d.create();
    var _v0 = vec3d.create();
    var _v1 = vec3d.create();
    var _v2 = vec3d.create();

    var intersectTriangleGeometryRec = function(boundingInfo, pp0, pp1, tolerance, callback) {
      var p = _p;

      var center = boundingInfo.getCenter();
      vec3d.project(center, pp0, pp1, p);
      var dist2 = vec3d.dist2(p, center);
      var radius = boundingInfo.getBSRadius();

      if (dist2 < radius * radius) {
        var primitiveIndices = boundingInfo.getPrimitiveIndices();
        var indices = boundingInfo.getIndices();
        var position = boundingInfo.getPosition();

        var numTriangles = primitiveIndices ? primitiveIndices.length : indices.length/3;

        if (numTriangles > 10000) {
          var children = boundingInfo.getChildren();
          if (children !== undefined) {
            for (var i = 0; i < 8; ++i) {
              if (children[i] !== undefined) {
                intersectTriangleGeometryRec(children[i], pp0, pp1, tolerance, callback);
              }
            }
            return;
          }
        }

        var size = position.size;
        var data = position.data;

        var pp0x = pp0[0];
        var pp0y = pp0[1];
        var pp0z = pp0[2];

        var pp1x = pp1[0];
        var pp1y = pp1[1];
        var pp1z = pp1[2];

        var dx = pp1x - pp0x;
        var dy = pp1y - pp0y;
        var dz = pp1z - pp0z;

        for (var j = 0; j < numTriangles; ++j) {
          var triangleNr = (primitiveIndices ? primitiveIndices[j] : j);

          var i0 = size * indices[triangleNr*3];
          var i1 = size * indices[triangleNr*3 + 1];
          var i2 = size * indices[triangleNr*3 + 2];

          // rayTriangle3D(pp0, d, data, data, data, i0, i1, i2, tuv)

          // BEGIN in-lined Util.rayTriangle3D

          var d0x = data[i0];
          var d0y = data[i0 + 1];
          var d0z = data[i0 + 2];

          var d1x = data[i1];
          var d1y = data[i1 + 1];
          var d1z = data[i1 + 2];

          var d2x = data[i2];
          var d2y = data[i2 + 1];
          var d2z = data[i2 + 2];

          var e1x = d1x - d0x;
          var e1y = d1y - d0y;
          var e1z = d1z - d0z;

          var e2x = d2x - d0x;
          var e2y = d2y - d0y;
          var e2z = d2z - d0z;

          // p = d x e2
          var px = dy * e2z - e2y * dz;
          var py = dz * e2x - e2z * dx;
          var pz = dx * e2y - e2x * dy;

          var a = e1x * px + e1y * py + e1z * pz;
          if (a > -tolerance && a < tolerance) {
            continue;
          }

          var f = 1.0 / a;
          var sx = pp0x - d0x;
          var sy = pp0y - d0y;
          var sz = pp0z - d0z;

          var tuvy = f * (sx * px + sy * py + sz * pz);
          if (tuvy < 0.0 || tuvy > 1.0) {
            continue;
          }

          var qx = sy * e1z - e1y * sz;
          var qy = sz * e1x - e1z * sx;
          var qz = sx * e1y - e1x * sy;

          var tuvz = f * (dx * qx + dy * qy + dz * qz);
          if (tuvz < 0.0 || tuvy + tuvz > 1.0) {
            continue;
          }

          var tuvx = f * (e2x * qx + e2y * qy + e2z * qz);

          // END in-lined Util.rayTriangle3D

          if (tuvx >= 0.0) {
            var v0 = _v0;
            var v1 = _v1;
            var v2 = _v2;

            vec3d.set3(d0x, d0y, d0z, v0);
            vec3d.set3(d1x, d1y, d1z, v1);
            vec3d.set3(d2x, d2y, d2z, v2);

            vec3d.subtract(v1, v0, v1);
            vec3d.subtract(v2, v0, v2);
            vec3d.normalize(vec3d.cross(v1, v2, v0));

            callback(tuvx, v0, triangleNr);
          }
        }
      }
    };

    MaterialUtil.intersectTriangleGeometry = function(geometry, group, transformation, point, p0, p1, pp0, pp1, camera, tolerance, callback) {
      Util.assert(geometry.getData().getFaces()[group].type === "triangle");

      intersectTriangleGeometryRec(geometry.getBoundingInfo(group), pp0, pp1, tolerance, callback);
    };

// "Base class" constructors for Materials (in the style of Crockford "Parts")
    MaterialUtil.basicMaterialConstructor = function(that, idHint) {
      var visible = true;
      var renderPriority = 0;
      var id = MaterialUtil.__Material_idGen.gen(idHint);
      that.getId = function() { return id; };

      var parentStage;
      that.getParentStage = function() { return parentStage; };
      that.addParentStage = function(stage) {
        Util.assert(parentStage === undefined, "Material can only be added to a single Stage");
        parentStage = stage;
      };
      that.removeParentStage = function(stage) {
        parentStage = undefined;
      };

      that.setVisible = function(v) {
        if (visible !== v) {
          visible = v;
          that.notifyDirty("matChanged");
        }
      };
      that.isVisible = function() { return visible;};

      that.notifyDirty = function (dirtyType) {
        if (parentStage) {
          parentStage.notifyDirty(Model.ContentType.MATERIAL, that, dirtyType);
        }
      };

      that.setRenderPriority = function(prio) {
        renderPriority = prio;
        this.notifyDirty("matChanged");
      };

      that.getRenderPriority = function() {
        return renderPriority;
      };
    };

    var aquireIfNotUndefined = MaterialUtil.aquireIfNotUndefined = function(id, initTexture, textureRep, useTransparentInitTex) {
      if (id === undefined) {
        return undefined;
      }
      return textureRep.aquire(id, initTexture, useTransparentInitTex);
    };

    var releaseIfNotUndefined = MaterialUtil.releaseIfNotUndefined = function(id, textureRep) {
      if (id === undefined) {
        return;
      }
      textureRep.release(id);
    };

    var tmpView = mat4.create();
    MaterialUtil.bindView = function(origin, view, program) {
      mat4.translate(view, origin, tmpView);
      program.uniformMatrix4fv("view", tmpView);
    };

    MaterialUtil.bindCamPos = function(origin, viewInvTransp, program) {
      program.uniform3f("camPos", viewInvTransp[3] - origin[0], viewInvTransp[7] - origin[1], viewInvTransp[11] - origin[2]);
    };

// "Base class" constructors for Materials (in the style of Crockford "Parts")
    MaterialUtil.basicGLMaterialConstructor = function(that, material) {
      this.id = MaterialUtil.__GLMaterial_id++;

      this.getId = function() {
        return this.id;
      };

      that.getMaterialId = function() {
        return material.getId();
      };

      var visible = true;

      that.isVisible = function() {
        return visible;
      };

      that.updateVisibility = function() {
        visible = material.isVisible();
      };

      that.getRenderPriority = function() {
        return material.getRenderPriority();
      };
    };

    MaterialUtil.singleTextureGLMaterialConstructor = function(that, textureRep, params, initTransparent) {
      var texGLName = aquireIfNotUndefined(params.textureId, params.initTexture, textureRep, initTransparent);

      that.updateTexture = function(newTextureId) {
        if (params.textureId !== newTextureId) {
          releaseIfNotUndefined(params.textureId, textureRep);
          params.textureId = newTextureId;
          texGLName = aquireIfNotUndefined(params.textureId, params.initTexture, textureRep, initTransparent);
        }
      };

      that.renderTexture = function(gl) {
        var texGl = textureRep.getTexture(params.textureId);
        if (texGl&&texGl.renderGl) {
          texGl.renderGl(texGLName,gl);
        }
      };

      that.bindTexture = function(gl, program) {
        if (texGLName !== undefined) {
          program.uniform1i("tex", 0);
          gl.bindTexture(gl.TEXTURE_2D, texGLName);
        }
      };

      that.dispose = function() {
        releaseIfNotUndefined(params.textureId, textureRep);
      };
    };

// textureParamNames: [[textureId, initTextureId, shaderUniformName]]
    MaterialUtil.multiTextureGLMaterialConstructor = function(that, textureRep, params, textureParamNames) {
      var numTextures = textureParamNames.length;
      var texGLNames = new Array(numTextures);

      for (var i = 0; i < numTextures; i++) {
        texGLNames[i] = aquireIfNotUndefined(params[textureParamNames[i][0]], params[textureParamNames[i][1]], textureRep);
      }

      that.updateTextures = function(newParams) {
        for (var i = 0; i < numTextures; i++) {
          var oldTexId = params[textureParamNames[i][0]];
          var newTexId = newParams[textureParamNames[i][0]];
          if (oldTexId !== newTexId) {
            releaseIfNotUndefined(oldTexId, textureRep);
            params[textureParamNames[i][0]] = newTexId;
            texGLNames[i] = aquireIfNotUndefined(newTexId, params[textureParamNames[i][1]], textureRep);
          }}
      };

      that.bindTextures = function(gl, program) {
        for (var i = 0; i < numTextures; i++) {
          if (texGLNames[i] !== undefined) {
            program.uniform1i(textureParamNames[i][2], i);
            gl.activeTexture(gl.TEXTURE0+i);
            gl.bindTexture(gl.TEXTURE_2D, texGLNames[i]);
          }
        }
        gl.activeTexture(gl.TEXTURE0);
      };

      that.bindOneTexture = function(gl, program, texIndex) {
        program.uniform1i(textureParamNames[texIndex][2], texIndex);
        gl.activeTexture(gl.TEXTURE0+texIndex);
        gl.bindTexture(gl.TEXTURE_2D, texGLNames[texIndex]);
        gl.activeTexture(gl.TEXTURE0);
      };

      that.disposeTextures = function() {
        for (var i = 0; i < numTextures; i++) {
          releaseIfNotUndefined(params[textureParamNames[i][0]], textureRep);
        }
      };
    };

    return MaterialUtil;
  }
);
