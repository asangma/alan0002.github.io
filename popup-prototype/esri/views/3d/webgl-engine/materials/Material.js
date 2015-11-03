/* jshint forin:false */
define([
  "dojo/_base/lang",
  "dojo/text!./Material.xml",
  "./internal/MaterialUtil",
  "../lib/GLSLProgram",
  "../lib/GLSLShader",
  "../lib/ShaderVariations",
  "../lib/Util",
  "../lib/gl-matrix"
],
  function(lang, shadersXMLString, MaterialUtil, GLSLProgram, GLSLShader, ShaderVariations, Util, glMatrix) {
    var assert = Util.assert;
    var mat4d = glMatrix.mat4d;
    var vec3 = glMatrix.vec3;
    var angleInstancedArrays;

    var tmpVec3 = vec3.create();

// possible params: textureId, transparent, ambient, diffuse, specular, shininess,
//   opacity, polygonOffset, initTexture, reflTextureId, reflectivity, atlasRegions, vertexColors
    var Material = function(params, idHint) {
      MaterialUtil.basicMaterialConstructor(this, idHint);

      params = params || {};
      params.ambient = params.ambient || [0.2, 0.2, 0.2];
      params.diffuse = params.diffuse || [0.8, 0.8, 0.8];
      params.specular = params.specular || [0, 0, 0];
      params.shininess = params.shininess || 10;
      params.opacity = (params.opacity !== undefined) ? params.opacity : 1.0;
      
      params.blendModeOneOne = params.blendModeOneOne || false;
      params.inverseWindingOrder = params.inverseWindingOrder || false;
      params.vertexColors = params.vertexColors || false;

      params.flipV = params.flipV || false;
      params.doubleSided = params.doubleSided || false;
      params.cullFace = params.cullFace || "back";
      params.instanced = params.instanced || false;
      this.instanced = !!params.instanced;

      if (!params.textureId) {
        params.reflTextureId = undefined;
      }

      var vertexBufferLayoutName;
      if (params.textureId) {
        if (params.atlasRegions) {
          vertexBufferLayoutName = "PosNormTexRegion";
        } else {
          vertexBufferLayoutName = "PosNormTex";
        }
      } else {
        vertexBufferLayoutName = "PosNorm";
      }
      if (params.vertexColors) {
        vertexBufferLayoutName += "Col";
      }
      var vertexBufferLayout = MaterialUtil.Layouts[vertexBufferLayoutName];
      var instanceBufferLayout = params.instanced ? MaterialUtil.Layouts.ModelCol : null;
      if (params.instanced) {
        instanceBufferLayout = (params.instanced.indexOf("color") > -1) ? MaterialUtil.Layouts.ModelCol :
          MaterialUtil.Layouts.Model;
      }

      this.dispose = function() {

      };

      this.getParams = function() {
        return params;
      };

      this.getParameterValues = function() {
        var result = {
          ambient: params.ambient,
          diffuse: params.diffuse,
          specular: params.specular,
          shininess: params.shininess,
          opacity: params.opacity,
          transparent: params.transparent,
          polygonOffset: params.polygonOffset,
          reflectivity: params.reflectivity,
          atlasRegions: params.atlasRegions,
          flipV: params.flipV,
          doubleSided: params.doubleSided,
          cullFace: params.cullFace
        };
        if (params.textureId) {
          result.textureId = params.textureId;
          result.initTexture =  params.initTexture;
        }
        return result;
      };

      this.setParameterValues = function(newParams) {
        for (var key in newParams) {
          if (key === "textureId") {
            assert(params.textureId, "Can only change texture of material that already has a texture");
          }
          params[key] = newParams[key];
        }
        this.notifyDirty("matChanged");
      };

      this.getOutputAmount = function(inputAmount) {
        return inputAmount*vertexBufferLayout.getStride();
      };

      this.getVertexBufferLayout = function() {
        return vertexBufferLayout;
      };

      this.getInstanceBufferLayout = function() {
        return instanceBufferLayout;
      };

      this.fillInterleaved = function(geomData, transformation, invTranspTransformation, instanceParams, dst, offset, filter) {
        MaterialUtil.fillInterleaved(geomData, transformation, invTranspTransformation, instanceParams,
          vertexBufferLayout, dst, offset, filter);
      };

      this.intersect = MaterialUtil.intersectTriangleGeometry;

      this.getGLMaterials = function() {
        return [DefaultGLMaterial, DefaultGLMaterialDepthShadowMap, DefaultGLMaterialNormal, DefaultGLMaterialDepth];
      };

      this.getAllTextureIds = function() {
        var result = [];
        if (params.textureId) {
          result.push(params.textureId);
        }
        if (params.reflTextureId) {
          result.push(params.reflTextureId);
        }
        return result;
      };
    };
    Material.paramsFromOldConstructor = function(textureId, transparent, ambient, diffuse, specular, shininess, opacity, polygonOffset, initTexture, reflTextureId, reflectivity,flipV,doubleSided) {
      return {
        textureId: textureId,
        transparent: transparent,
        ambient: ambient,
        diffuse: diffuse,
        specular: specular,
        shininess: shininess,
        opacity: opacity,
        polygonOffset: polygonOffset,
        initTexture: initTexture,
        reflTextureId: reflTextureId,
        reflectivity: reflectivity,
        flipV: flipV,
        doubleSided: doubleSided,
        cullFace: doubleSided ? "none" : "back"
      };
    };

    var bindSetCulling=function(gl, params) {
      var cullEnabled = (params.cullFace !== "none") && !params.transparent;
      if (gl.web3DDefaultState.cullEnabled !== cullEnabled) {
        if (cullEnabled) {
          gl.enable(gl.CULL_FACE);
          if (params.cullFace === "front") {
            gl.cullFace(gl.FRONT);
          }
        } else {
          gl.disable(gl.CULL_FACE);
        }
      }
    };

    var releaseSetCulling=function(gl, params) {
      var cullEnabled = (params.cullFace !== "none") && !params.transparent;
      if (gl.web3DDefaultState.cullEnabled !== cullEnabled) {
        if (cullEnabled) {
          gl.disable(gl.CULL_FACE);
          if (params.cullFace === "front") {
            gl.cullFace(gl.BACK);
          }
        } else {
          gl.enable(gl.CULL_FACE);
        }
      }
    };

    var DefaultGLMaterial = function(material, programRep, textureRep) {
      MaterialUtil.basicGLMaterialConstructor(this, material);

      var params = lang.clone(material.getParams());

      function whichSlot(transparent) { return transparent ? 2 : 1; }
      var slot = whichSlot(params.transparent);

      MaterialUtil.singleTextureGLMaterialConstructor(this, textureRep, params);
      var reflTexGLName = MaterialUtil.aquireIfNotUndefined(params.reflTextureId, params.reflInitTexture, textureRep);


      assert(!(params.atlasRegions && params.reflTextureId), "Atlas texture with reflection is not yet supported");
      var texturing = !params.textureId ? "none" : (params.atlasRegions ? "AtlasTextured" : "Textured");
      this.instanced = angleInstancedArrays && params.instanced;
      var instancedColor = (!!this.instanced) && (this.instanced.indexOf("color") > -1);
      var program = programRep.shaderVariators.Material.getProgram([texturing, !!params.reflTextureId,
        params.vertexColors, params.flipV, params.doubleSided, !!this.instanced, instancedColor]);

      // this.dispose has already been defined by MaterialUtil.singleTextureGLMaterialConstructor(), but we need
      // to additionaly take care of reflTextureId. Perhaps we should use the multi texture constructor instead.
      var disposeTexture = this.dispose;
      this.dispose = function() {
        disposeTexture();
        MaterialUtil.releaseIfNotUndefined(params.reflTextureId, textureRep);
      };

      this.beginSlot = function(slot_) {
        return slot === slot_;
      };

      this.getProgram = function() {
        return program;
      };

      this.updateParameters = function() {
        var newParams = material.getParams();
        params.ambient = newParams.ambient;
        params.diffuse = newParams.diffuse;
        params.specular = newParams.specular;
        params.shininess = newParams.shininess;
        params.opacity = newParams.opacity;
        params.polygonOffset = newParams.polygonOffset;
        params.reflectivity = newParams.reflectivity;
        params.flipV = newParams.flipV;
        params.doubleSided = newParams.doubleSided;
        params.cullFace = newParams.cullFace;

        if (params.transparent != newParams.transparent) {
          slot = whichSlot(newParams.transparent);
          params.transparent = newParams.transparent;
        }


        params.initTexture = newParams.initTexture;
        this.updateTexture(newParams.textureId);

        if (newParams.atlasRegions) {
          params.atlasRegions = newParams.atlasRegions;
        }

        params.blendModeOneOne = newParams.blendModeOneOne;
        params.inverseWindingOrder = newParams.inverseWindingOrder;
      };

      this.bind = function(gl, bindParams) {
        program.use();

        program.uniform3fv("ambient", params.ambient);
        program.uniform3fv("diffuse", params.diffuse);
        program.uniform3fv("specular", params.specular);

        program.uniform1f("shininess", params.shininess);
        program.uniform1f("opacity", params.opacity);

        this.bindTexture(gl, program);

        if (reflTexGLName !== undefined) {
          program.uniform1i("reflTex", 1);
          gl.activeTexture(gl.TEXTURE1);
          gl.bindTexture(gl.TEXTURE_2D, reflTexGLName);
          gl.activeTexture(gl.TEXTURE0);
          program.uniform1f("reflectivity", params.reflectivity);
        }

        material.getVertexBufferLayout().enableVertexAttribArrays(gl, program, false);
        if (this.instanced) {
          material.getInstanceBufferLayout().enableVertexAttribArrays(gl, program,
            bindParams.extensions.angleInstancedArrays);
        }

        if (params.inverseWindingOrder) {
          gl.frontFace(gl.CW);
        }

        if (params.transparent) {
          gl.enable(gl.BLEND);

          if (params.blendModeOneOne) {
            gl.blendFunc(gl.ONE,gl.ONE);
            gl.depthMask(false);
          }

        }

        if (params.polygonOffset) {
          gl.enable(gl.POLYGON_OFFSET_FILL);
          gl.polygonOffset(2.0, 2.0);
        }

        bindSetCulling(gl, params);

      };

      this.release = function(gl, bindParams) {
        if (params.polygonOffset) {
          gl.disable(gl.POLYGON_OFFSET_FILL);
        }

        releaseSetCulling(gl, params);

        if (params.transparent) {
          gl.disable(gl.BLEND);

          if (params.blendModeOneOne) {
            gl.blendFunc(gl.web3DDefaultState.blendFuncSrc, gl.web3DDefaultState.blendFuncDst);
            gl.depthMask(true);
          }
        }

        if (params.inverseWindingOrder) {
          gl.frontFace(gl.CCW);
        }

        material.getVertexBufferLayout().disableVertexAttribArrays(gl, program, false);
        if (this.instanced) {
          material.getInstanceBufferLayout().disableVertexAttribArrays(gl, program,
            bindParams.extensions.angleInstancedArrays);
        }
      };

      this.bindView = function(gl, bindParams) {
        var origin = bindParams.origin;
        MaterialUtil.bindView(origin, bindParams.view, program);
        MaterialUtil.bindCamPos(origin, bindParams.viewInvTransp, program);
        bindParams.shadowMap.bindView(program, origin);
      };

      this.bindInstance = function(gl, instance) {
        program.uniformMatrix4fv("model", instance.transformation);
        program.uniformMatrix4fv("modelNormal", instance.transformationNormal);
        if (instancedColor && instance.instanceParameters) {
          var color = instance.instanceParameters.color;
          if (color) {
            vec3.multiply(params.ambient, color, tmpVec3);
            program.uniform3fv("ambient", tmpVec3);
            vec3.multiply(params.diffuse, color, tmpVec3);
            program.uniform3fv("diffuse", tmpVec3);
            program.uniform1f("opacity", params.opacity * color[3]);
          }
        }
      };

      this.getDrawMode = function(gl) {
        return gl.TRIANGLES;
      };
    };

    var DefaultGLMaterialDepth = function(material, programRep, textureRep, biased) {
      MaterialUtil.basicGLMaterialConstructor(this, material);

      var params = lang.clone(material.getParams());

      var program = biased!=null?programRep.get(material.getVertexBufferLayout().hasAttribute("uv0") ? "depthTexturedShadowMap" : "depthShadowMap"):
         programRep.get(material.getVertexBufferLayout().hasAttribute("uv0") ? "depthTextured" : "depth");
      var slot = params.transparent ? 2 : 1;

      MaterialUtil.singleTextureGLMaterialConstructor(this, textureRep, params);

      this.beginSlot = function(slot_) {
        return slot === slot_;
      };

      this.getProgram = function() {
        return program;
      };

      this.updateParameters = function() {
        var newParams = material.getParams();
        params.initTexture = newParams.initTexture;
        this.updateTexture(newParams.textureId);
      };

      this.bind = function(gl, bindParams) {
        program.use();

        program.uniform2fv("nearFar", bindParams.nearFar);
        if (params.inverseWindingOrder) {
          gl.frontFace(gl.CW);
        }

        this.bindTexture(gl, program);

        material.getVertexBufferLayout().enableVertexAttribArrays(gl, program);

        bindSetCulling(gl, params);
      };

      this.release = function(gl) {
        releaseSetCulling(gl, params);

        if (params.inverseWindingOrder) {
          gl.frontFace(gl.CCW);
        }

        material.getVertexBufferLayout().disableVertexAttribArrays(gl, program);
      };

      this.bindView = function(gl, bindParams) {
        MaterialUtil.bindView(bindParams.origin, bindParams.view, program);
      };

      this.bindInstance = function(gl, instance) {
        program.uniformMatrix4fv("model", instance.transformation);
      };

      this.getDrawMode = function(gl) {
        return gl.TRIANGLES;
      };
    };

    var DefaultGLMaterialDepthShadowMap = function(material, programRep, textureRep)
    {
      DefaultGLMaterialDepth.call(this, material, programRep, textureRep, true );
    };


    var DefaultGLMaterialNormal = function(material, programRep, textureRep) {
      MaterialUtil.basicGLMaterialConstructor(this, material);

      var params = lang.clone(material.getParams());
      var program = programRep.get(material.getVertexBufferLayout().hasAttribute("uv0") ? "normalTextured" : "normal");
      var slot = params.transparent ? 2 : 1;

      MaterialUtil.singleTextureGLMaterialConstructor(this, textureRep, params);

      this.beginSlot = function(slot_) {
        return slot === slot_;
      };

      this.getProgram = function() {
        return program;
      };

      this.updateParameters = function() {
        var newParams = material.getParams();
        params.initTexture = newParams.initTexture;
        this.updateTexture(newParams.textureId);
      };

      this.bind = function(gl, bindParams) {
        program.use();

        this.bindTexture(gl, program);
        program.uniformMatrix4fv("viewNormal", bindParams.viewInvTransp);

        material.getVertexBufferLayout().enableVertexAttribArrays(gl, program);

        bindSetCulling(gl, params);
        if (params.inverseWindingOrder) {
          gl.frontFace(gl.CW);
        }

      };

      this.release = function(gl) {
        releaseSetCulling(gl, params);
        if (params.inverseWindingOrder) {
          gl.frontFace(gl.CCW);
        }

        material.getVertexBufferLayout().disableVertexAttribArrays(gl, program);
      };

      this.bindView = function(gl, bindParams) {
        MaterialUtil.bindView(bindParams.origin, bindParams.view, program);
      };

      this.bindInstance = function(gl, instance) {
        program.uniformMatrix4fv("model", instance.transformation);
        program.uniformMatrix4fv("modelNormal", instance.transformationNormal);
      };

      this.getDrawMode = function(gl) {
        return gl.TRIANGLES;
      };
    };

    Material.loadShaders = function(snippets, shaderRep, programRep, gl) {
      snippets._parse(shadersXMLString);

      gl.getExtension("OES_standard_derivatives");
      angleInstancedArrays = gl.getExtension("ANGLE_instanced_arrays");

      var programs = new ShaderVariations("phong", ["vsPhong", "fsPhong"], null, programRep, shaderRep, snippets, gl);
      programs.addNaryShaderSnippetSuffix([
        {value: "none", programNameSuffix: "", shaderSnippetSuffix: ""},
        {value: "Textured"},
        {value: "AtlasTextured"}
      ]);
      programs.addBinaryShaderSnippetSuffix("Refl", "Refl", [false, true]);
      programs.addDefine("Color", "VERTEXCOLORS");
      programs.addDefine("FlipV", "FLIPV");
      programs.addDefine("DoubleSided", "DOUBLESIDED");
      programs.addDefine("Instanced", "INSTANCED");
      programs.addDefine("InstColor", "INSTANCEDCOLOR");

      programRep.shaderVariators.Material = programs;

      /* jshint sub:true */

      var vsDepth = new GLSLShader(gl.VERTEX_SHADER, snippets["vsDepth"], gl);
      var vsDepthTextured = new GLSLShader(gl.VERTEX_SHADER, snippets["vsDepthTextured"], gl);
      var vsNormal = new GLSLShader(gl.VERTEX_SHADER, snippets["vsNormal"], gl);
      var vsNormalTextured = new GLSLShader(gl.VERTEX_SHADER, snippets["vsNormalTextured"], gl);
      var fsDepthShadowMap = new GLSLShader(gl.FRAGMENT_SHADER, snippets["fsDepth"], gl, ["BIAS_SHADOWMAP 1"]);
      var fsDepthTexturedShadowMap = new GLSLShader(gl.FRAGMENT_SHADER, snippets["fsDepthTextured"], gl, ["BIAS_SHADOWMAP 1"]);
      var fsDepth = new GLSLShader(gl.FRAGMENT_SHADER, snippets["fsDepth"], gl);
      var fsDepthTextured = new GLSLShader(gl.FRAGMENT_SHADER, snippets["fsDepthTextured"], gl);
      var fsNormal = new GLSLShader(gl.FRAGMENT_SHADER, snippets["fsNormal"], gl);
      var fsNormalTextured = new GLSLShader(gl.FRAGMENT_SHADER, snippets["fsNormalTextured"], gl);

      var programDepthShadowMap = new GLSLProgram([vsDepth, fsDepthShadowMap], gl);
      var programDepthTexturedShadowMap = new GLSLProgram([vsDepthTextured, fsDepthTexturedShadowMap], gl);

      var programDepth = new GLSLProgram([vsDepth, fsDepth], gl);
      var programDepthTextured = new GLSLProgram([vsDepthTextured, fsDepthTextured], gl);

      var programNormal = new GLSLProgram([vsNormal, fsNormal], gl);
      var programNormalTextured = new GLSLProgram([vsNormalTextured, fsNormalTextured], gl);

      programRep.add("depthShadowMap", programDepthShadowMap);
      programRep.add("depthTexturedShadowMap", programDepthTexturedShadowMap);
      programRep.add("depth", programDepth);
      programRep.add("depthTextured", programDepthTextured);
      programRep.add("normal", programNormal);
      programRep.add("normalTextured", programNormalTextured);

      shaderRep.add("fsDepth", fsDepth);
      shaderRep.add("fsDepthTextured", fsDepthTextured);
      shaderRep.add("fsDepthShadowMap", fsDepthShadowMap);
      shaderRep.add("fsDepthTexturedShadowMap", fsDepthTexturedShadowMap);
      shaderRep.add("vsDepth", vsDepth);
      shaderRep.add("fsNormal", fsNormal);
    };

    return Material;
  }
);