/* jshint forin:false */
define([
  "dojo/_base/lang",
  "dojo/text!./HUDMaterial.xml",
  "./internal/MaterialUtil",
  "../lib/GLSLProgram",
  "../lib/GLSLShader",
  "../lib/ShaderVariations",
  "../lib/VertexBufferLayout",
  "../lib/Util",
  "../lib/gl-matrix",
  "../lib/webglConstants"
],
  function(lang, shadersXMLString, MaterialUtil, GLSLProgram, GLSLShader, ShaderVariations, VertexBufferLayout, Util, glMatrix, webglConstants) {
    var vec2d = glMatrix.vec2d;
    var vec3d = glMatrix.vec3d;
    var mat4d = glMatrix.mat4d;
    var assert = Util.assert;
    var VertexAttrConstants = Util.VertexAttrConstants;

    var __HUDMaterialAnchorString2Offset = {
      "bottomLeft": [0.0, 0.0],  "bottom": [0.5, 0.0],  "bottomRight": [1.0, 0.0],
      "left"      : [0.0, 0.5],  "center": [0.5, 0.5],  "right"      : [1.0, 0.5],
      "topLeft"   : [0.0, 1.0],  "top"   : [0.5, 1.0],  "topRight"   : [1.0, 1.0]
    };

//  possible params: textureId, size, color, autoUV, worldScale, direction, texCoordScale,
//          occlusionTest, polygonOffset, anchorPos, screenOffset, screenMinMaxSize
    var HUDMaterial = function(params, idHint) {
      MaterialUtil.basicMaterialConstructor(this, idHint);

      params = params || null;
      params.texCoordScale = params.texCoordScale || [1.0, 1.0];
      params.occlusionTest = (params.occlusionTest !== undefined) ? params.occlusionTest : true;
      params.color = params.color || [1.0, 1.0, 1.0, 1.0];
      params.screenMinMaxSize = params.screenMinMaxSize || [0, 100000];
      params.outlineColor = params.outlineColor || [1.0, 1.0, 1.0, 1.0];
      params.outlineSize = params.outlineSize || 0.0;
      params.textureIsSignedDistanceField = params.textureIsSignedDistanceField ? 1 : 0;

      if (params.screenOffset) {
        params.screenOffset.forEach(function(v, i) { params.screenOffset[i] = 2*v; } );
      } else {
        params.screenOffset = [0.0, 0.0];
      }
      if (typeof params.anchorPos === "string") {
        assert(__HUDMaterialAnchorString2Offset[params.anchorPos], "HUDMaterial: invalid anchorPos specified");
        params.anchorPos = __HUDMaterialAnchorString2Offset[params.anchorPos];
      } else if (!params.anchorPos) {
        params.anchorPos = __HUDMaterialAnchorString2Offset.center;
      }
      params.shaderPolygonOffset = params.shaderPolygonOffset || 1.e-5;

      var vertexBufferLayout = new VertexBufferLayout(
          [VertexAttrConstants.POSITION, VertexAttrConstants.NORMAL, VertexAttrConstants.UV0, VertexAttrConstants.COLOR,
            VertexAttrConstants.SIZE, VertexAttrConstants.AUXPOS1],
          [3, 3, 2, 4, 2, 4],
          [webglConstants.FLOAT, webglConstants.FLOAT, webglConstants.FLOAT, webglConstants.UNSIGNED_BYTE, webglConstants.FLOAT, webglConstants.FLOAT]
        );
      var stride = vertexBufferLayout.getStride();
      var stride4 = stride*4;

      this.dispose = function() {

      };

      this.getParameterValues = function() {
        var result = {
          color: params.color,
          texCoordScale: params.texCoordScale,
          polygonOffset: params.polygonOffset,
          anchorPos: params.anchorPos,
          screenOffset: params.screenOffset,
          screenMinMaxSize: params.screenMinMaxSize,
          shaderPolygonOffset:params.shaderPolygonOffset,
          textureIsSignedDistanceField: params.textureIsSignedDistanceField,
          outlineColor: params.outlineColor,
          outlineSize: params.outlineSize
        };
        if (params.textureId) {
          result.textureId = params.textureId;
        }
        if (params.direction) {
          result.direction = params.direction;
        }
        return result;
      };

      this.setParameterValues = function(newParams) {
        for (var key in newParams) {
          if (key === "textureId") {
            assert(params.textureId, "Can only change texture of material that already has a texture");
          }
          if (key === "direction") {
            assert(params.direction, "Can only change direction of HUDMaterial which was initialized with a direction");
          }
          params[key] = newParams[key];
        }
        this.notifyDirty("matChanged");
      };

      this.getParams = function() {
        return params;
      };

      this.getOutputAmount = function(inputAmount) {
        return inputAmount*stride*6;
      };

      this.getVertexBufferLayout = function() {
        return vertexBufferLayout;
      };

      this.fillInterleaved = function(geomData, transformation, invTranspTransformation, instanceParams, dst, offset) {

        var fill = MaterialUtil.fill;

        var vboAttrs = vertexBufferLayout.getAttributes();

        var indPos = geomData.faces.indices[VertexAttrConstants.POSITION];
        var pos = geomData.vertexAttr[VertexAttrConstants.POSITION].data;
        var offs = offset + vboAttrs[VertexAttrConstants.POSITION].offset;

        for (var j = 0; j < indPos.length; ++j) {
          var j3 = 3 * indPos[j];

          fill(pos, j3, dst, offs, transformation, 3); offs += stride;
          fill(pos, j3, dst, offs, transformation, 3); offs += stride;
          fill(pos, j3, dst, offs, transformation, 3); offs += stride;
          fill(pos, j3, dst, offs, transformation, 3); offs += stride;
          fill(pos, j3, dst, offs, transformation, 3); offs += stride;
          fill(pos, j3, dst, offs, transformation, 3); offs += stride;
        }

        var indNormal = geomData.faces.indices[VertexAttrConstants.NORMAL];
        var normal = geomData.vertexAttr[VertexAttrConstants.NORMAL].data;
        offs = offset + vboAttrs[VertexAttrConstants.NORMAL].offset;

        for (j = 0; j < indNormal.length; ++j) {
          j3 = 3 * indNormal[j];

          fill(normal, j3, dst, offs, invTranspTransformation, 3); offs += stride;
          fill(normal, j3, dst, offs, invTranspTransformation, 3); offs += stride;
          fill(normal, j3, dst, offs, invTranspTransformation, 3); offs += stride;
          fill(normal, j3, dst, offs, invTranspTransformation, 3); offs += stride;
          fill(normal, j3, dst, offs, invTranspTransformation, 3); offs += stride;
          fill(normal, j3, dst, offs, invTranspTransformation, 3); offs += stride;
        }

        offs = offset + vboAttrs[VertexAttrConstants.UV0].offset;

        var uvData = geomData.vertexAttr[VertexAttrConstants.UV0].data;

        if (uvData==null || uvData.length<=3) {
          var u0 = 0;
          var v0 = 0;
          var u1 = params.texCoordScale[0];
          var v1 = params.texCoordScale[1];
        }
        else {
          u0 = geomData.vertexAttr[VertexAttrConstants.UV0].data[0];
          v0 = geomData.vertexAttr[VertexAttrConstants.UV0].data[1];
          u1 = geomData.vertexAttr[VertexAttrConstants.UV0].data[2];
          v1 = geomData.vertexAttr[VertexAttrConstants.UV0].data[3];
        }

        u1 = Math.min(1.99999, u1+1.0);
        v1 = Math.min(1.99999, v1+1.0);

        for (j = 0; j < indPos.length; ++j) {
          dst[offs] = u0; dst[offs + 1] = v0; offs += stride;
          dst[offs] = u1; dst[offs + 1] = v0; offs += stride;
          dst[offs] = u1; dst[offs + 1] = v1; offs += stride;
          dst[offs] = u1; dst[offs + 1] = v1; offs += stride;
          dst[offs] = u0; dst[offs + 1] = v1; offs += stride;
          dst[offs] = u0; dst[offs + 1] = v0; offs += stride;
        }

        var indColor = geomData.faces.indices[VertexAttrConstants.COLOR];
        var color = geomData.vertexAttr[VertexAttrConstants.COLOR].data;
        offs = (offset + vboAttrs[VertexAttrConstants.COLOR].offset)*4;

        var dstByteBuffer = new Uint8Array(dst.buffer);

        for (j = 0; j < indColor.length; ++j) {
         j3 = 4 * indColor[j];

         fill(color, j3, dstByteBuffer, offs, null, 4); offs += stride4;
         fill(color, j3, dstByteBuffer, offs, null, 4); offs += stride4;
         fill(color, j3, dstByteBuffer, offs, null, 4); offs += stride4;
         fill(color, j3, dstByteBuffer, offs, null, 4); offs += stride4;
         fill(color, j3, dstByteBuffer, offs, null, 4); offs += stride4;
         fill(color, j3, dstByteBuffer, offs, null, 4); offs += stride4;
        }

        var indSize = geomData.faces.indices[VertexAttrConstants.SIZE];
        var size = geomData.vertexAttr[VertexAttrConstants.SIZE].data;
        offs = offset + vboAttrs[VertexAttrConstants.SIZE].offset;

        for (j = 0; j < indSize.length; ++j) {
          var sx = size[2*indSize[j]];
          var sy = size[2*indSize[j]+1];

          dst[offs] = sx; dst[offs + 1] = sy; offs += stride;
          dst[offs] = sx; dst[offs + 1] = sy; offs += stride;
          dst[offs] = sx; dst[offs + 1] = sy; offs += stride;
          dst[offs] = sx; dst[offs + 1] = sy; offs += stride;
          dst[offs] = sx; dst[offs + 1] = sy; offs += stride;
          dst[offs] = sx; dst[offs + 1] = sy; offs += stride;
        }

        if (geomData.faces.indices[VertexAttrConstants.AUXPOS1]!=null &&
          geomData.vertexAttr[VertexAttrConstants.AUXPOS1]!=null) {
          var indCenterOffset = geomData.faces.indices[VertexAttrConstants.AUXPOS1];
          var centerOffset = geomData.vertexAttr[VertexAttrConstants.AUXPOS1].data;
          offs = offset + vboAttrs.auxpos1.offset;
          for (j = 0; j < centerOffset.length; ++j) {
            j3 = 4 * indCenterOffset[j];

            fill(centerOffset, j3, dst, offs, null, 4); offs += stride;
            fill(centerOffset, j3, dst, offs, null, 4); offs += stride;
            fill(centerOffset, j3, dst, offs, null, 4); offs += stride;
            fill(centerOffset, j3, dst, offs, null, 4); offs += stride;
            fill(centerOffset, j3, dst, offs, null, 4); offs += stride;
            fill(centerOffset, j3, dst, offs, null, 4); offs += stride;
          }
        }

      };

      var tmpP = vec3d.create(),
        tmpPS = vec3d.create();
      var tol = 1;
      var size = [0,0];
      var anchor = params.anchorPos;
      this.intersect = function(geometry, group, transformation, point, p0, p1, pp0, pp1, camera, tolerance, callback, isSelection) {
        if(!isSelection) {
          return;
        }

        var va = geometry.getData().getVertexAttr()[VertexAttrConstants.POSITION];
        var vs = geometry.getData().getVertexAttr()[VertexAttrConstants.SIZE];

        assert(va.size >= 3);

        for (var i = 0; i < va.data.length/va.size; i++) {
          var indPos = i*va.size;
          vec3d.set3(va.data[indPos], va.data[indPos + 1], va.data[indPos + 2], tmpP);
          mat4d.multiplyVec3(transformation, tmpP, tmpP);

          var indSize = i*vs.size;
          size[0] = vs.data[indSize];
          size[1] = vs.data[indSize+1];

          camera.projectPoint(tmpP, tmpPS);
          if (tmpPS[0] > -1) {
            var x = tmpPS[0],
              y = tmpPS[1];

            var tx = x - tol - ((anchor[0] > 0) ? (size[0] * anchor[0]) : 0);
            var ux = tx + size[0];

            var ty = y - tol - ((anchor[1] > 0) ? (size[1] * anchor[1]) : 0);
            var uy = ty + size[1];

            if (point[0] > tx && point[0] < ux && point[1] > ty && point[1] < uy) {
              var normal = vec3d.subtract(p0, tmpP, vec3d.create());
              var distance = vec3d.length(normal);
              vec3d.scale(normal, 1.0 / distance);

              var d = 0.98 * distance / vec3d.dist(p0, p1);
              callback(d , normal, -1, 1, true);
            }
          }
        }
      };

      this.getGLMaterials = function() {
        return [HUDGLMaterial, undefined, undefined];
      };

      this.getAllTextureIds = function() {
        return [ params.textureId ];
      };

      this._textureDirty = false;
      this.setTextureDirty =function() {
        this._textureDirty =true;
      };
    };

    var HUDGLMaterial = function(material, programRep, textureRep) {
      MaterialUtil.basicGLMaterialConstructor(this, material);

      var slot2 = 2;
      var slot4 = 4;

      var curSlot = 0;

      var params = lang.clone(material.getParams());

      var programOcclusionTestPixel = programRep.get("hudOcclusionTestPixel");

      function whichProgram() {
        return programRep.shaderVariators.HUDMaterial.getProgram(
          [!!params.direction, !!params.worldScale, params.occlusionTest, params.textureIsSignedDistanceField]
        );
      }

      var program = whichProgram();

      MaterialUtil.singleTextureGLMaterialConstructor(this, textureRep, params);

      var markerColor = [254.0 / 255.0, 253.0 / 255.0, 252.0 / 255.0];

      this.beginSlot = function(slot) {
        curSlot = slot;
        if (params.occlusionTest) {
          return slot === slot2 || slot == slot4;
        } else {
          return slot === slot2;
        }
      };

      this.getProgram = function() {
        return (curSlot === slot2) && params.occlusionTest ? programOcclusionTestPixel :
          program;
      };

      this.getAllPrograms = function() {
        return [programOcclusionTestPixel, program];
      };

      this.updateParameters = function() {
        var newParams = material.getParams();
        params.color = newParams.color;
        params.texCoordScale = newParams.texCoordScale;
        params.polygonOffset = newParams.polygonOffset;
        params.anchorPos = newParams.anchorPos;
        params.screenOffset = newParams.screenOffset;
        params.screenMinMaxSize = newParams.screenMinMaxSize;
        params.direction = newParams.direction;
        params.shaderPolygonOffset = newParams.shaderPolygonOffset;
        params.textureIsSignedDistanceField = newParams.textureIsSignedDistanceField;
        params.outlineColor = newParams.outlineColor;
        params.outlineSize = newParams.outlineSize;
        this.updateTexture(newParams.textureId);
        program = whichProgram();
      };

      this.bind = function(gl, bindParams) {

        if (material._textureDirty) {
          this.renderTexture(gl);
          material._textureDirty = false;
        }

        if ((curSlot === slot2) && params.occlusionTest) {
          programOcclusionTestPixel.use();

          programOcclusionTestPixel.uniform1f("polygonOffset", params.shaderPolygonOffset);

          programOcclusionTestPixel.uniform4fv("viewport", bindParams.viewport);
          programOcclusionTestPixel.uniform4f("color", markerColor[0], markerColor[1], markerColor[2], 1.0);

          material.getVertexBufferLayout().enableVertexAttribArrays(gl, programOcclusionTestPixel);

          gl.depthFunc(gl.LEQUAL);
        } else {

          program.use();

          this.bindTexture(gl, program);

          program.uniform1i("framebufferTex", 1);
          gl.activeTexture(gl.TEXTURE1);
          gl.bindTexture(gl.TEXTURE_2D, bindParams.framebufferTex);
          gl.activeTexture(gl.TEXTURE0);

          program.uniform3fv("markerColor", markerColor);
          program.uniform4fv("viewport", bindParams.viewport);
          program.uniform4fv("overrideColor", params.color);
          program.uniform1f("pixelRatio", bindParams.pixelRatio);
          program.uniform1f("polygonOffset", params.shaderPolygonOffset);

          if (params.textureIsSignedDistanceField) {
            program.uniform4fv("outlineColor", params.outlineColor);
            program.uniform1f("outlineSize", params.outlineSize);
          }

          if (params.worldScale) {
            var minMaxWorldSizeFactors = [-1, -1];
            var minMaxScreenSize = params.screenMinMaxSize;
            var proj = bindParams.proj;
            var screenWidth = bindParams.viewport[2]/bindParams.pixelRatio;
            if (minMaxScreenSize) {
              if (proj[11] !== 0) {
                // perspective projection
                var fovX = Math.atan(1/proj[0])*2; // TODO: pass fovX into bind() instead of computing it
                var f = Math.tan(fovX/2)/screenWidth*2.0;
                minMaxWorldSizeFactors[0] = minMaxScreenSize[0]*f;
                minMaxWorldSizeFactors[1] = minMaxScreenSize[1]*f;
              } else {
                // orthographic projection
                var pixelInMeters = 2.0/(proj[0]*screenWidth);
                vec2d.scale(minMaxScreenSize, pixelInMeters, minMaxWorldSizeFactors);

              }
            }
            program.uniform2fv("minMaxWorldSizeFactor", minMaxWorldSizeFactors);
          }

          if (params.direction) {
            program.uniform3fv("direction", params.direction);
          }

          program.uniform2fv("texScale", params.texCoordScale);
          program.uniform2fv("screenOffset", params.screenOffset);
          program.uniform2fv("anchorPos", params.anchorPos);

          material.getVertexBufferLayout().enableVertexAttribArrays(gl, program);

          if (params.polygonOffset) {
            gl.enable(gl.POLYGON_OFFSET_FILL);
            gl.polygonOffset(0.0, -4.0);
          }

          if (gl.web3DDefaultState.cullEnabled) {
            gl.disable(gl.CULL_FACE);
          }

          gl.enable(gl.BLEND);
        }
      };

      this.release = function(gl) {
        if ((curSlot === slot2) && params.occlusionTest) {
          gl.depthFunc(gl.LESS);

          material.getVertexBufferLayout().disableVertexAttribArrays(gl, programOcclusionTestPixel);
        } else {
          if (params.polygonOffset) {
            gl.disable(gl.POLYGON_OFFSET_FILL);
          }
          if (gl.web3DDefaultState.cullEnabled) {
            gl.enable(gl.CULL_FACE);
          }
          gl.disable(gl.BLEND);
          material.getVertexBufferLayout().disableVertexAttribArrays(gl, program);
        }
      };

      this.bindView = function(gl, bindParams) {
        var origin = bindParams.origin;
        if ((curSlot === slot2) && params.occlusionTest) {
          MaterialUtil.bindView(origin, bindParams.view, programOcclusionTestPixel);
          MaterialUtil.bindCamPos(origin, bindParams.viewInvTransp, programOcclusionTestPixel);
        } else {
          MaterialUtil.bindView(origin, bindParams.view, program);
          MaterialUtil.bindCamPos(origin, bindParams.viewInvTransp, program);
        }
      };

      this.bindInstance = function(gl, instance) {
        if ((curSlot === slot2) && params.occlusionTest) {
          programOcclusionTestPixel.uniformMatrix4fv("model", instance.transformation);
          programOcclusionTestPixel.uniformMatrix4fv("modelNormal", instance.transformationNormal);
        } else {
          program.uniformMatrix4fv("model", instance.transformation);
        }
      };

      this.getDrawMode = function(gl) {
        if ((curSlot === slot2) && params.occlusionTest) {
          return gl.POINTS;
        }

        return gl.TRIANGLES;
      };
    };

    HUDMaterial.loadShaders = function(snippets, shaderRep, programRep, gl) {
      snippets._parse(shadersXMLString);

      var hasVertexTexturing = gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS) > 0;

      var programs = new ShaderVariations("hud", ["vertexShaderHUD", "fragmentShaderHUD"], null, programRep,
        shaderRep, snippets, gl);
      programs.addBinaryShaderSnippetSuffix("Direction", "Direction", [true, false]);
      programs.addBinaryShaderSnippetSuffix("WorldScale", "WorldScale", [true, false]);
      programs.addDefine("OcclTest", hasVertexTexturing ? "OCCL_TEST" : "OCCL_PIXELSHADER");
      programs.addDefine("SDF", "SIGNED_DISTANCE_FIELD");

      programRep.shaderVariators.HUDMaterial = programs;

      /* jshint sub:true */
      var vertexShaderOcclusionTestPixel = new GLSLShader(gl.VERTEX_SHADER, snippets["vertexShaderOcclusionTestPixel"], gl);
      var fragmentShaderSimple = new GLSLShader(gl.FRAGMENT_SHADER, snippets["fragmentShaderSimple"], gl);
      var programOcclusionTestPixel = new GLSLProgram([vertexShaderOcclusionTestPixel, fragmentShaderSimple], gl);
      programRep.add("hudOcclusionTestPixel", programOcclusionTestPixel);
      /* jshint sub:false */
    };

    return HUDMaterial;
  });
