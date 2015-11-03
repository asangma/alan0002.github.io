/* jshint forin:false, bitwise:false */
define([
  "./IntervalUtilities",
  "./ModelDirtyTypes",
  "./Float32ArrayList",
  "./InstanceBufferData",
  "./VertexBufferLayout",

  "../materials/internal/SimpleGLMaterial",
  "../materials/internal/TexOnlyGLMaterial",

  "./GLFBO",
  "./GLVBO",
  "./GLSLProgram",

  "./LinearDepthTextureHelper",
  "./NormalTextureHelper",

  "./bitset",
  "./Util",
  "./gl-matrix"
], function (
  IntervalUtilities, ModelDirtyTypes, Float32ArrayList, InstanceBufferData, VertexBufferLayout,
  SimpleGLMaterial, TexOnlyGLMaterial,
  GLFBO, GLVBO, GLSLProgram,
  LinearDepthTextureHelper,NormalTextureHelper,
  BitSet, Util, glMatrix
){

var assert = Util.assert;
var subtractObjects = Util.subtractObjects;
var array2object = Util.array2object;
var objectEmpty = Util.objectEmpty;
var getFirstObjectValue = Util.getFirstObjectValue;
var setMatrixTranslation3 = Util.setMatrixTranslation3;
var vec2d = glMatrix.vec2d;
var mat4d = glMatrix.mat4d;
var vec3d = glMatrix.vec3d;
var vec4d = glMatrix.vec4d;
var VertexAttrConstants = Util.VertexAttrConstants;

function RenderContext(props) {
  this.camera = null;
  this.slot = 0;
  this.pass = "";
  this.lightingData = null;
  this.shadowMap = null;
  this.ssaoHelper = null;
  this.visibleContent = null;
  this.filterContent = null;
  this.filterFaceRange = null;
  this.getMaterial = null;

  this.set(props);
}

RenderContext.prototype.set = function(props) {
  if (!props) {
    return;
  }

  for (var p in props) {
    this[p] = props[p];
  }
};

var NUM_SLOTS = 6;

var Instance = function(name, from, to, displayedIndexRange, transformation, instanceParams, idx, dataId) {
  this.name = name;
  this.from = from;
  this.to = to;
  this.displayedIndexRange = displayedIndexRange;
  this.transformation = transformation;
  this.instanceParameters = instanceParams;
  this.idx = idx;
  this.dataId = dataId;

  if (transformation != null) {
    this.transformationNormal = mat4d.create();
    mat4d.set(transformation, this.transformationNormal);
    mat4d.inverse(this.transformationNormal, this.transformationNormal);
    mat4d.transpose(this.transformationNormal, this.transformationNormal);
  }
};

var LightingData = function(initLightAmbient, initlightDiffuse, initlightSpecular, initlightDirection) {
  var lightAmbient = vec4d.create(initLightAmbient);
  var lightDiffuse = vec4d.create(initlightDiffuse);
  var lightSpecular = vec4d.create(initlightSpecular);
  var lightDirection = vec3d.create(initlightDirection);

  this.setUniforms = function (program) {
    program.uniform4fv("lightAmbient", lightAmbient);
    program.uniform4fv("lightDiffuse", lightDiffuse);
    program.uniform4fv("lightSpecular", lightSpecular);
    program.uniform3fv("lightDirection", lightDirection);
  };

  this.set = function(data) {
    if (data.ambient) {
      vec4d.set(data.ambient, lightAmbient);
    }
    if (data.diffuse) {
      vec4d.set(data.diffuse, lightDiffuse);
    }
    if (data.specular) {
      vec4d.set(data.specular, lightSpecular);
    }
    if (data.direction) {
      vec3d.set(data.direction, lightDirection);
    }
  };

  this.get = function() {
    return {
      ambient: lightAmbient,
      diffuse: lightDiffuse,
      specular: lightSpecular,
      direction: lightDirection
    };
  };

  this.getLightDirection = function() {
    return lightDirection;
  };
  this.getLightAmbient = function() {
    return lightAmbient;
};
  this.getLightDiffuse = function() {
    return lightDiffuse;
  };
  this.getLightSpecular = function() {
    return lightSpecular;
  };
};

var Renderer = function(programRep, vboRep, materialRep, textureRep, gl, orderedRendering) {
  var lightingData = new LightingData([1,1,1,1], [1,1,1,1], [1,1,1,1], [0,1,0]);

  var mat2dataMerged = {};
  var mat2dataInstanced = {};
  var renderOrder = [];

  var externalRenderers = [[], [], [], [], [], [], []];

  var framesRendered = 0;
  var isRendering = false;

  var selectionIndices;
  var selectionFaceIndexRange;
  var highlightIndices;
  var highlightParams = {
    fadeInTime : 0,
    fadeOutTime : 0,
    duration : 0
  };
  var highlightStartTime;
  var selectionHighlightIndices;

  var pixelRatio = 1;

  this.ssaoEnabled = false;
  var extRenderContext = new RenderContext({
    lightingData: lightingData
  });

  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);

  gl.disable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  var contextAttributes = gl.getContextAttributes();
  var framebufferFormat = contextAttributes.alpha ? gl.RGBA : gl.RGB;

  var extensions = {
    angleInstancedArrays: gl.getExtension("ANGLE_instanced_arrays")
  };
  var needsRender = true;

  var bindParameters = {
    view: null,
    proj: null,
    viewInvTransp: null,
    nearFar: null,
    lightingData: null,
    viewport: null,
    framebufferTex: null,
    shadowMap: null,
    origin: undefined,
    pixelRatio: null,
    instanceParameters: undefined,
    depthFBO: null,
    extensions: extensions
  };

  var linearDepthTextureHelper = new LinearDepthTextureHelper(gl);
  var normalTextureHelper = new NormalTextureHelper(gl);


  this.dispose = function() {
    var matId, originId, data;
    for (matId in mat2dataMerged) {
      releaseMaterials(matId);
      data = mat2dataMerged[matId];
      for (originId in data.origin2data) {
        releaseVBO(data.origin2data[originId].vbo);
      }
    }
    mat2dataMerged = null;

    for (matId in mat2dataInstanced) {
      releaseMaterials(matId);
      data = mat2dataInstanced[matId];
      for (originId in data.origin2data) {
        releaseVBO(data.origin2data[originId].vbo);
      }
    }
    mat2dataInstanced = null;

    highlightFBO.dispose();
    quadVBO.dispose();

    if (ieFixTexture) {
      gl.deleteTexture(ieFixTexture);
    }
    ieFixTexture = null;

    gl.deleteTexture(framebufferTex);
    framebufferTex = null;

    if (linearDepthTextureHelper.getEnableState()) {
      linearDepthTextureHelper.disable();
    }
    if (normalTextureHelper.getEnableState()) {
      normalTextureHelper.disable();
    }
  };

  this.setLightingData = function(data) {
    lightingData.set(data);
    needsRender = true;
  };

  this.getLightingData = function() {
    return lightingData.get();
  };

  this.setPixelRatio = function(ratio) {
    pixelRatio = ratio;
    needsRender = true;
  };

  this.getPixelRatio = function() {
    return pixelRatio;
  };

  this.addExternalRenderer = function(slots, renderer) {
    if (!Array.isArray(slots)) {
      slots = [slots];
    }

    slots.forEach(function(slot) {
      assert(slot < externalRenderers.length, "invalid slot for external renderer");
      externalRenderers[slot].push(renderer);
    });

    needsRender = true;
    return true;
  };

  this.removeExternalRenderer = function(slots, renderer) {
    if (!Array.isArray(slots)) {
      slots = [slots];
    }

    var removed = 0;
    slots.forEach(function(slot) {
      assert(slot < externalRenderers.length, "invalid slot for external renderer");
      var slotExternalRenderers = externalRenderers[slot];
      for (var i = 0; i < slotExternalRenderers.length; i++) {
        if (slotExternalRenderers[i] === renderer) {
          slotExternalRenderers[i] = slotExternalRenderers[slotExternalRenderers.length-1];
          slotExternalRenderers.pop();

          needsRender = true;
          removed++;
          break;
        }
      }
    });

    return removed === slots.length;
  };

  this.getExternalRenderers = function() {
    return externalRenderers;
  };

  this.resetNeedsRender = function() {
    needsRender = false;

    for (var i = 0; i < externalRenderers.length; i++) {
      var slot = externalRenderers[i];

      for (var j = 0; j < slot.length; j++) {
        var ext = slot[j];

        if (ext.resetNeedsRender) {
          ext.resetNeedsRender();
        } else if (ext.didRender) {
          ext.needsRender = false;
          ext.didRender = false;
        }
      }
    }
  };

  this.needsRender = function() {
    if (needsRender) {
      return true;
    }

    for (var i = 0; i < externalRenderers.length; i++) {
      var slot = externalRenderers[i];

      for (var j = 0; j < slot.length; j++) {
        if (slot[j].needsRender) {
          return true;
        }
      }
    }

    return false;
  };

  var lastContent;

  var DBG = false;

  var trianglesRendered = 0;
  var drawCallsInstanced = 0,
   drawCallsAngleInstanced = 0,
   drawCallsMerged = 0,
   drawCallsFragmented = 0,
   instancesDrawnAngle = 0;
  var resetStats = function() {
    drawCallsInstanced = drawCallsMerged = trianglesRendered = drawCallsFragmented = drawCallsAngleInstanced = 0;
    instancesDrawnAngle = 0;
  };
  this.getCombinedStats = function() {
    var result = { trianglesRendered: trianglesRendered,
      drawCallsInstanced: drawCallsInstanced,
      drawCallsAngleInstanced: drawCallsAngleInstanced,
      drawCallsMerged: drawCallsMerged,
      drawCallsFragmented: drawCallsFragmented,
      instancesDrawnAngle: instancesDrawnAngle
    };
    computeVBOBuffersSize(result);

    return result;
  };

  this.setContent = function(content) {
    var newContent = {};
    for (var i = 0, length = content.length; i < length; ++i) {
      newContent[content[i].uniqueName] = content[i];
    }

    var toAdd = lastContent === undefined ? content : subtractObjects(newContent, lastContent);
    var toRemove = lastContent === undefined ? [] : subtractObjects(lastContent, newContent);

    lastContent = newContent;

    this.modify(toAdd, toRemove);
  };

  this.setSelectionObject = function(objectName, faceRange) {
    if (objectName) {
      selectionIndices = name2indices(array2object([objectName]));
      selectionFaceIndexRange = undefined;
      if (faceRange!=null && faceRange.length==1) {
        selectionFaceIndexRange = [[faceRange[0][0]*3, faceRange[0][1]*3]];
      }
      if (highlightIndices) {
        selectionHighlightIndices = computeHighlightSelectionIntersection();
      }
    } else {
      selectionIndices = undefined;
      selectionHighlightIndices = undefined;
      selectionFaceIndexRange = undefined;
    }

    needsRender = true;
  };

  // params = {[fadeInTime:0.2,] [fadeOutTime:0.5,] holdTime:1}
  this.setHighlightObjects = function(objectNames, params) {
    if ( typeof params !== "object" ) {
      params = {};
    }

    var stillPlaying = highlightParams.duration > 0 && ((Date.now() - highlightStartTime)/1000) < highlightParams.duration;

    highlightParams.fadeInTime = typeof params.fadeInTime === "number" ? params.fadeInTime : 0.2;
    highlightParams.fadeOutTime = typeof params.fadeOutTime === "number" ? params.fadeOutTime : 0.5;
    highlightParams.holdTime = typeof params.holdTime === "number" ? params.holdTime : 1;
    if (highlightParams.holdTime >= 0) {
      highlightParams.duration = highlightParams.holdTime + highlightParams.fadeInTime + highlightParams.fadeOutTime;
    } else {
      highlightParams.duration = 0;
    }

    if ( !objectNames || objectNames.length === 0 ){
      if ( !stillPlaying ) { // avoid replaying fadeout
        highlightStartTime = Date.now();
      }
      highlightParams.fadeInTime = 0;
      highlightParams.duration = highlightParams.fadeOutTime;
    }
    else{
      highlightStartTime = Date.now();
      highlightIndices = name2indices(array2object(objectNames));
      if (selectionIndices) {
        selectionHighlightIndices = computeHighlightSelectionIntersection();
      }
    }

    needsRender = true;
  };

  function computeHighlightSelectionIntersection() {
    var newSet = highlightIndices.clone();
    newSet.and(selectionIndices);
    return newSet;
  }

  var selectionMaterial = new SimpleGLMaterial(programRep, [0.1, 0.2, 0.9, 0.4], gl.EQUAL);
  var selectionMaterialLines = new SimpleGLMaterial(programRep, [0.1, 0.2, 0.9, 0.4], gl.EQUAL, gl.LINES);

  function getSelectionMaterial(matData) {
    return matData.material.getDrawMode(gl) === gl.LINES ? selectionMaterialLines : selectionMaterial;
  }

  function getMaterial(matData) {
    return matData.material;
  }

  var framebufferTex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, framebufferTex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 4, 4, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  var framebufferCopied = false;

  if (framebufferFormat === gl.RGBA) {
    var ieFixTextureBuffer = new Uint8Array(4 * 4 * 4);
    for (var i = 0; i < 4*4*4; i++) {
      ieFixTextureBuffer[i] = 255;
    }
    var ieFixTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, ieFixTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 4, 4, 0, gl.RGBA, gl.UNSIGNED_BYTE, ieFixTextureBuffer);
    var ieFixMaterial = new TexOnlyGLMaterial(programRep, ieFixTexture, [1,1,1,1], true, gl.ALWAYS);
  }


  var renderUnordered = function(camera, visibleContent, shadowMap, ssaoHelper, fbo) {
    isRendering = true;

    resetStats();
    framebufferCopied = false;

    updateGlobalUniforms(camera.projectionMatrix);

    for (var slot = 0; slot < 3; slot++) {
      callExternalRenderers("material", slot, camera, shadowMap, ssaoHelper);
      renderInternalSlot(slot, camera, visibleContent, undefined, undefined, getMaterial, shadowMap);
    }

    callExternalRenderers("material", 3, camera, shadowMap, ssaoHelper); //currently: transparent terrain
    renderInternalSlot(3, camera, visibleContent, undefined, undefined, getMaterial, shadowMap);


    copyFramebufferToTexture(camera.viewport);

    callExternalRenderers("material", 4, camera, shadowMap, ssaoHelper); //currently: Ribbon AtmosphereGLMaterial Transparency && realistic haze
    gl.clear(gl.DEPTH_BUFFER_BIT);    //HUD needs depth cleared
    renderInternalSlot(4, camera, visibleContent, undefined, undefined, getMaterial, shadowMap); //currently: HUDGLMaterial 2nd pass

    if (selectionIndices) {
      renderSelection(camera, visibleContent, selectionIndices, selectionFaceIndexRange, shadowMap);
    }

    if (highlightIndices) {
      renderHighlight(camera, visibleContent, undefined, shadowMap, fbo);
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    GLSLProgram.unuse(gl);

    if (DBG) {
      window.FPSCounterDebugString = "dc: " + (drawCallsInstanced + drawCallsMerged) + " instanced: " + drawCallsInstanced + " merged: " + drawCallsMerged;
    }

    if (ieFixMaterial && !fbo) {
      gl.blendFuncSeparate(gl.ZERO, gl.ONE, gl.ONE, gl.ZERO);
      ieFixMaterial.bind(gl, highlightQuadBindParams);
      ieFixMaterial.bindView(gl, highlightQuadBindParams);

      quadVBO.bind();
      quadVBO.setPointers(ieFixMaterial.getProgram());

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, quadVBO.getNum());

      ieFixMaterial.release(gl);

      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    }

    framesRendered++;
    isRendering = false;
  };

  var renderOrdered = function(camera, visibleContent, shadowMap, ssaoHelper, fbo) {
    isRendering = true;

    resetStats();
    framebufferCopied = false;

    updateGlobalUniforms(camera.projectionMatrix);

    bindParameters.view = camera.viewMatrix;
    bindParameters.proj = camera.projectionMatrix;
    bindParameters.viewInvTransp = camera.viewInverseTransposeMatrix;

    tmpNearFar[0] = camera.near;
    tmpNearFar[1] = camera.far;

    bindParameters.nearFar = tmpNearFar;
    bindParameters.lightingData = lightingData;
    bindParameters.viewport = camera.fullViewport;
    bindParameters.framebufferTex = framebufferTex;
    bindParameters.shadowMap = shadowMap;
    bindParameters.pixelRatio = pixelRatio;
    bindParameters.instanceParameters = undefined;
    bindParameters.depthFBO = linearDepthTextureHelper.getDepthFBO();
    bindParameters.normalFBO = normalTextureHelper.getNormalFBO();

    var matData, material;
    var N = renderOrder.length;
    var lastWasInstanced = true;
    for (var renderOrderIdx = 0; renderOrderIdx < N; renderOrderIdx++) {
      var rec = renderOrder[renderOrderIdx][1];
      if (rec.instanced) {
        matData = rec.instanced;
        material = getMaterial(matData);
        if (material && (!material.isVisible || material.isVisible())) {
          renderInternalInstanced(matData, material, bindParameters, Infinity /* slot */, visibleContent, null, null, false);
          lastWasInstanced = true;
        }
      }
      if (rec.merged) {
        matData = rec.merged;
        material = getMaterial(matData);
        if (material && (!material.isVisible || material.isVisible())) {
          // otherwise render merged VBOs. model matrix is identity in this case.
          if (lastWasInstanced) {
            var p = material.getProgram();
            p.use();
            p.uniformMatrix4fv("model", IDENTITY);
            if (p.hasUniform("modelNormal")) {
              p.uniformMatrix4fv("modelNormal", IDENTITY);
            }
            lastWasInstanced = false;
          }
          renderInternalMerged(matData, material, bindParameters, Infinity /* slot */);
        }
      }
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    GLSLProgram.unuse(gl);

    framesRendered++;
    isRendering = false;
  };

  this.render = orderedRendering? renderOrdered: renderUnordered;

  this.renderAuxiliaryBuffers = function(camera, visibleContent, shadowMap, ssaoHelper, sceneNearFar, fbo) {

    var needDepthMap = this.ssaoEnabled;
    for (var j = 0; j < externalRenderers.length && !needDepthMap; j++) {
      var slotExternalRenderers = externalRenderers[j];
      for (var i = 0; i < slotExternalRenderers.length && !needDepthMap; i++) {
        needDepthMap = needDepthMap || !!slotExternalRenderers[i].needsDepthMap;
      }
    }

    linearDepthTextureHelper.setEnableState(needDepthMap);
    if (needDepthMap){
      linearDepthTextureHelper.setupFBOs(camera);
      linearDepthTextureHelper.prepareDepthPass();
      this.renderSimple(camera, visibleContent, "materialDepth");
      linearDepthTextureHelper.finish(fbo);
    }

    normalTextureHelper.setEnableState(this.ssaoEnabled);
    if(this.ssaoEnabled){
      normalTextureHelper.setupFBOs(camera);
      normalTextureHelper.prepareNormalPass();
      this.renderSimple(camera, visibleContent, "materialNormal");
      normalTextureHelper.finish(fbo);
      }

    if (this.ssaoEnabled) {
      ssaoHelper.computeSSAO(camera, fbo, sceneNearFar, linearDepthTextureHelper.getDepthFBO(), normalTextureHelper.getNormalFBO());
    }
    ssaoHelper.bindAll(programRep);
  };

  var callExternalRenderers = function(pass, slot, camera, shadowMap, ssaoHelper) {
    var slotExternalRenderers = externalRenderers[slot];
    //note that the framebufferTex gets set in the function copyFramebufferToTexture()
    extRenderContext.set({
      slot:slot,
      camera: camera,
      shadowMap: shadowMap,
      ssaoHelper: ssaoHelper,
      pass: pass,
      depth: linearDepthTextureHelper.getDepthFBO(),
      normals: normalTextureHelper.getNormalFBO()
    });

    for (var i = 0; i < slotExternalRenderers.length; i++) {
      var ext = slotExternalRenderers[i];

      if (ext.render(extRenderContext)) {
        ext.didRender = true;
      }
    }
  };

  this.renderSimple = function(camera, visibleContent, materialVarName, shadowMap, ssaoHelper) {
    isRendering = true;

    updateGlobalUniforms(camera.projectionMatrix);

    var getMaterial = function(matData) { return matData[materialVarName]; };

    for (var slot = 0; slot < NUM_SLOTS; ++slot) {
      callExternalRenderers(materialVarName, slot, camera, shadowMap);
      renderInternalSlot(slot, camera, visibleContent, undefined, undefined, getMaterial, shadowMap);
    }

    isRendering = false;
  };

  var renderSelection = function(camera, visibleContent, filterContent, selectionFaceRange, shadowMap) {
    isRendering = true;

    for (var slot = 0; slot < NUM_SLOTS; ++slot) {
      renderInternalSlot(slot, camera, visibleContent, filterContent, selectionFaceRange, getSelectionMaterial, shadowMap);
    }

    isRendering = false;
  };

  var copyFramebufferToTexture = function(viewport){
    gl.bindTexture(gl.TEXTURE_2D, framebufferTex);
    gl.copyTexImage2D(gl.TEXTURE_2D, 0, framebufferFormat, viewport[0], viewport[1], viewport[2], viewport[3], 0);
    extRenderContext.set({
      framebufferTex: framebufferTex
    });
    framebufferCopied = true;
  };

  var tmpNearFar = vec2d.create();

  var renderInternalSlot = function(slot, camera, visibleContent, filterContent, filterFaceRange, getMaterial, shadowMap) {
    bindParameters.view = camera.viewMatrix;
    bindParameters.proj = camera.projectionMatrix;
    bindParameters.viewInvTransp = camera.viewInverseTransposeMatrix;

    tmpNearFar[0] = camera.near;
    tmpNearFar[1] = camera.far;

    bindParameters.nearFar = tmpNearFar;
    bindParameters.lightingData = lightingData;
    bindParameters.viewport = camera.fullViewport;
    bindParameters.framebufferTex = framebufferTex;
    bindParameters.shadowMap = shadowMap;
    bindParameters.pixelRatio = pixelRatio;
    bindParameters.instanceParameters = undefined;
    bindParameters.depthFBO = linearDepthTextureHelper.getDepthFBO();

    var matId, matData, material;

    for (matId in mat2dataInstanced) {
      matData = mat2dataInstanced[matId];
      material = getMaterial(matData);
      if (material && material.beginSlot(slot) && (!material.isVisible || material.isVisible())) {
        renderInternalInstanced(matData, material, bindParameters, slot, visibleContent, filterContent, filterFaceRange, false);
      }
    }

    if (filterContent) {
      // if we need to filter by RenderGeometry, we have to render each RenderGeometry separately (-> renderInternalInstanced)
      for (matId in mat2dataMerged) {
        matData = mat2dataMerged[matId];
        material = getMaterial(matData);
        if (material && material.beginSlot(slot) && (!material.isVisible || material.isVisible())) {
          renderInternalInstanced(matData, material, bindParameters, slot, null, filterContent, filterFaceRange, true);
        }
      }
    } else {
      // otherwise render merged VBOs. model matrix is identity in this case.
      var programsModel = programRep.getProgramsUsingUniform("model");
      var programsModelNormal = programRep.getProgramsUsingUniform("modelNormal");
      for (var i = 0; i < programsModel.length; i++) {
        var p = programsModel[i];
        p.use();
        p.uniformMatrix4fv("model", IDENTITY);
        if (programsModelNormal.indexOf(p) > -1) {
          p.uniformMatrix4fv("modelNormal", IDENTITY);
        }
      }

      for (matId in mat2dataMerged) {
        matData = mat2dataMerged[matId];
        material = getMaterial(matData);
        if (material && material.beginSlot(slot) && (!material.isVisible || material.isVisible())) {
          renderInternalMerged(matData, material, bindParameters, slot);
        }
      }
    }
  };

  var renderInternalInstanced = function(matData, material, bindParameters, slot, visibleContent, filterContent, filterFaceRange, isMerged) {
    var materialBound = false;
    var drawMode = material.getDrawMode(gl);
    var angleInstancedArrays = extensions.angleInstancedArrays;

    for (var originId in matData.origin2data) {
      var data = matData.origin2data[originId];
      bindParameters.origin = data.origin;

      var vboBound = false;

      if (material.instanced) {
        for (var geomDataId in data.perGeometryDataInfo) {
          var perGeometryDataInfo = data.perGeometryDataInfo[geomDataId];
          if (!materialBound) {
            material.bind(gl, bindParameters);
            materialBound = true;
          }
          if (!vboBound) {
            data.vbo.bind();
            data.vbo.setPointers(material.getProgram());
            material.bindView(gl, bindParameters);
            vboBound = true;
          }

          perGeometryDataInfo.instanceBuffer.bind();
          perGeometryDataInfo.instanceBuffer.setPointers(material.getProgram());

          var vertsPerInstance = perGeometryDataInfo.to - perGeometryDataInfo.from;
          var numInstances = perGeometryDataInfo.refCount;

          if (drawMode === gl.TRIANGLES) {
            trianglesRendered += numInstances*vertsPerInstance/3;
          }
          angleInstancedArrays.drawArraysInstancedANGLE(drawMode, perGeometryDataInfo.from, vertsPerInstance, numInstances);

          drawCallsAngleInstanced++;
          instancesDrawnAngle += numInstances;
        }
      }
      else {
        var instances = data.instances;

        for (var name in instances) {
          var instance = instances[name];
          var idx = instance.idx;

          var fr = instance.displayedIndexRange;
          if (filterFaceRange) {
            fr = filterFaceRange;
          }
          if (fr && fr.length===0) {
            continue;
          }

          if ((visibleContent && !visibleContent.get(idx)) || (filterContent && !filterContent.get(idx))) {
            continue;
          }

          if (!materialBound) {
            material.bind(gl, bindParameters);
            materialBound = true;
          }

          if (!vboBound) {
            data.vbo.bind();
            data.vbo.setPointers(material.getProgram());
            material.bindView(gl, bindParameters);
            vboBound = true;
          }

          if (!isMerged) {
            material.bindInstance(gl, instance);
          }

          drawCallsInstanced++;
          if (drawMode === gl.TRIANGLES) {
            trianglesRendered += (instance.to - instance.from) / 3;
          }

          if (fr) {
            drawArraysFaceRange(fr, instance.from, drawMode);
          } else {
            gl.drawArrays(drawMode, instance.from, instance.to - instance.from);
          }
        }
      }
    }

    if (materialBound) {
      material.release(gl, bindParameters);
    }
  };

  var drawArraysFaceRange = function(displayedFaceRange, offset, drawMode) {
    for (var i=0; i<displayedFaceRange.length; i++) {
      var faceRange = displayedFaceRange[i];
      gl.drawArrays(drawMode, faceRange[0] + offset, faceRange[1] - faceRange[0] + 1);
    }
    drawCallsFragmented+=displayedFaceRange.length-1;
  };

  var renderInternalMerged = function(matData, material, bindParameters, slot) {
    var materialBound = false;

    for (var originId in matData.origin2data) {
      var data = matData.origin2data[originId];
      bindParameters.origin = data.origin;

      if (data.displayedIndexRange && (data.displayedIndexRange.length === 0)) {
        continue;
      }

      if (!materialBound) {
        material.bind(gl, bindParameters);
        materialBound = true;
      }

      data.vbo.bind();
      data.vbo.setPointers(material.getProgram());
      material.bindView(gl, bindParameters);

      drawCallsMerged++;
      var drawMode = material.getDrawMode(gl);
      if (drawMode === gl.TRIANGLES) {
        trianglesRendered += data.vbo.getNum() / 3;
      }

      if (data.displayedIndexRange) {
        drawArraysFaceRange(data.displayedIndexRange, 0, drawMode);
      } else {
        gl.drawArrays(drawMode, 0, data.vbo.getNum());
      }
    }

    if (materialBound) {
      material.release(gl, bindParameters);
    }
  };

  var updateGlobalUniforms = function updateGlobalUniforms(proj) {
    var programs = programRep.getProgramsUsingUniform("proj");
    for (var i = 0; i < programs.length; i++) {
      programs[i].uniformMatrix4fv("proj", proj);
    }

    if (lightingData) {
      programs = programRep.getProgramsUsingUniform("lightDirection");
      for (i = 0; i < programs.length; i++) {
        lightingData.setUniforms(programs[i]);
      }
    }
  };

  this.print = function() {
    console.log("number of materials (merged/instanced): " +
        Object.keys(mat2dataMerged).length + "/" +
        Object.keys(mat2dataInstanced).length);

    var numM = 0;
    var matId, matData, originId;
    for (matId in mat2dataMerged) {
      matData = mat2dataMerged[matId];
      for (originId in matData.origin2data) {
        numM += Object.keys(matData.origin2data[originId].instances).length;
      }
    }
    var numI = 0;
    for (matId in mat2dataInstanced) {
      matData = mat2dataInstanced[matId];
      for (originId in matData.origin2data) {
        numI += Object.keys(matData.origin2data[originId].instances).length;
      }
    }

    console.log("number of instances (merged/instanced):" + numM + "/" + numI);
  };

  this.isEmpty = function() {
    for (var matId in mat2dataInstanced) {
      var matData = mat2dataInstanced[matId];
      for (var originId in matData.origin2data) {
        if (!objectEmpty(matData.origin2data[originId].instances)) {
          return false;
        }
      }
    }
    for (matId in mat2dataMerged) {
       matData = mat2dataMerged[matId];
      for (originId in matData.origin2data) {
        if (!objectEmpty(matData.origin2data[originId].instances)) {
          return false;
        }
      }
    }
    return true;
  };

  this.modify = function(toAdd, toRemove, toUpdate, dirtyMaterials) {
    if (isRendering) {
      console.warn("Renderer.modify called while rendering");
    }

    var mergedAdd = [];
    var instancedAdd = [];
    mergedOrInstanced(toAdd, mergedAdd, instancedAdd);

    var mergedRemove = [];
    var instancedRemove = [];
    mergedOrInstanced(toRemove, mergedRemove, instancedRemove);

    var modifiedMergedFaceranges = [];

    if (toUpdate) {
      performUpdates(toUpdate, modifiedMergedFaceranges);
    }

    var materialsToRelease = [];
    modifyMerged(mergedAdd, mergedRemove, materialsToRelease, modifiedMergedFaceranges);
    modifyInstanced(instancedAdd, instancedRemove, materialsToRelease);

    updateMergedFaceranges(modifiedMergedFaceranges);

    // materials are "released" (de-referenced would be a better term) in a deferred fashion, after all
    // modifications have been done. the reason is that within modifyMerged/modifyInstanced, deletions are
    // performed before additions. if we de-referenced the materials immediately, it may happen that all
    // materials using a certain program (e.g. TerrainMaterial) are released, but immediately after that,
    // due to the additions, the program is used again.
    releaseMaterials(materialsToRelease);

    modifyMaterials(dirtyMaterials);
    needsRender = true;
  };

  var THRESHOLD = 1535;

  this.setThreshold = function(t) {
    THRESHOLD = t;
    this.dispose();

    var content = new Array(Object.keys(lastContent).length);
    var i = 0;
    for (var name in lastContent) {
      content[i++] = lastContent[name];
    }

    lastContent = undefined;
    this.setContent(content);
  };

  var isInstanced = function(renderGeometry) {
    var isInstanced = false;
    var numIndices = getFirstObjectValue(renderGeometry.data.faces.indices).length;
    isInstanced |= renderGeometry.material.canBeMerged === false;
    isInstanced |= renderGeometry.material.instanced;
    isInstanced |= renderGeometry.material.isBackdrop;

    if (renderGeometry.singleUse) {
      return isInstanced;
    }

    isInstanced |= numIndices > THRESHOLD;
    return isInstanced;
  };

  var mergedOrInstanced = function(content, merged, instanced) {
    for (var i = 0; i < content.length; ++i) {
      var numIndices = getFirstObjectValue(content[i].data.faces.indices).length;
      if (numIndices < 1) { // skip empty geometries
        continue;
      }
      var inst =  isInstanced(content[i]);
      if (inst) {
        instanced.push(content[i]);
      } else {
        merged.push(content[i]);
      }
    }
  };

  var performUpdates = function(updates, modifiedMergedFaceranges) {
    var UpdTypes = ModelDirtyTypes.UpdateTypes;
    for (var i=0; i<updates.length; i++)
    {
      var update = updates[i];
      var renderGeometry = update.renderGeometry;
      var instanced = isInstanced(renderGeometry);
      var updateType = update.updateType;
      if (updateType & UpdTypes.FACERANGE) {
        updateFaceranges(renderGeometry, instanced, modifiedMergedFaceranges);
      }
      if ((updateType & UpdTypes.VERTEXATTRS) || (!instanced && (updateType & UpdTypes.TRANSFORMATION))) {
        updateVertexAttributes(renderGeometry, instanced);
      }
      else if (instanced && (updateType & UpdTypes.TRANSFORMATION)) {
        updateInstanceTransformation(renderGeometry, instanced);
      }
      else if (updateType & UpdTypes.COLORATTRS) {
        updateColorAttributes(renderGeometry, instanced);
      }
    }
  };

  var updateFaceranges = function(renderGeometry, instanced, modifiedMergedFaceranges) {
    var material = renderGeometry.material;
    var matId = material.getId();
    var originId = renderGeometry.origin.id;
    var targetMat2data = instanced ? mat2dataInstanced : mat2dataMerged;
    var matData = targetMat2data[matId];
    var originData = matData.origin2data[originId];
    var instance = originData.instances[renderGeometry.uniqueName];

    if (instance) {
      instance.displayedIndexRange = renderGeometry.displayedIndexRange;
      if (!instanced) {
        modifiedMergedFaceranges.push(originData);
      }
    }


  };

  var updateMergedFaceranges = function(modifiedMergedFaceranges, instanced) {
    for (var i=0; i<modifiedMergedFaceranges.length; i++) {
      var data = modifiedMergedFaceranges[i];
      data.displayedIndexRange = [];
      var instances = data.instances;
      var allVisible = true;
      for (var instanceIdx in  instances) {
        var instance = instances[instanceIdx];
        if (instance.displayedIndexRange) {
          data.displayedIndexRange.push.apply(data.displayedIndexRange,
            IntervalUtilities.offsetIntervals(instance.displayedIndexRange, instance.from));
          allVisible = false;
        } else {
          data.displayedIndexRange.push([instance.from, instance.to-1]);
        }
      }
      if (allVisible) {
        data.displayedIndexRange = null;
      }
      else {
        data.displayedIndexRange = IntervalUtilities.mergeIntervals(data.displayedIndexRange);
      }
    }
  };

  var updateVertexAttributes = function(renderGeometry, instanced) {
    var material = renderGeometry.material;
    var matId = material.getId();
    var originId = renderGeometry.origin.id;
    var targetMat2data = instanced ? mat2dataInstanced : mat2dataMerged;
    var matData = targetMat2data[matId];
    var originData = matData.origin2data[originId];
    var instance = originData.instances[renderGeometry.uniqueName];

    var trafo, invTrafo;
    if (!instanced) {
      var origin = renderGeometry.origin.vec3;
      setMatrixTranslation3(translationMat, -origin[0], -origin[1], -origin[2]);
      mat4d.multiply(translationMat, renderGeometry.transformation, transformationRelToOrigin);
      mat4d.inverse(transformationRelToOrigin, invTranspTransformation);
      mat4d.transpose(invTranspTransformation);
      trafo = transformationRelToOrigin;
      invTrafo = invTranspTransformation;
    }


    var stride = material.getVertexBufferLayout().getStride();
    assert(instance.from +
      material.getOutputAmount(getFirstObjectValue(renderGeometry.data.faces.indices).length) / stride === instance.to,
      "material VBO layout has changed");
    material.fillInterleaved(renderGeometry.data, trafo, invTrafo, renderGeometry.instanceParameters,
      originData.buffer.getArray(), instance.from * stride);
    originData.vbo.updateSubData(originData.buffer.getArray(), instance.from * stride, instance.to * stride);
  };

  var updateInstanceTransformation = function(renderGeometry, instanced) {
    var origin = renderGeometry.origin.vec3,
      targetMat2data = instanced ? mat2dataInstanced : mat2dataMerged,
      matData = targetMat2data[renderGeometry.material.getId()],
      originData = matData.origin2data[renderGeometry.origin.id],
      instance = originData.instances[renderGeometry.uniqueName];
    setMatrixTranslation3(translationMat, -origin[0], -origin[1], -origin[2]);
    mat4d.multiply(translationMat, renderGeometry.transformation, instance.transformation);
    mat4d.inverse(instance.transformation, instance.transformationNormal);
    mat4d.transpose(instance.transformationNormal, instance.transformationNormal);
    var perGeometryDataInfo = originData.perGeometryDataInfo[renderGeometry.data.id],
      instanceBufferData = perGeometryDataInfo.instanceBufferData;
    if (instanceBufferData) {
      var slot = instanceBufferData.getSlot(renderGeometry.idx);
      instanceBufferData.fill(slot, 0, instance.transformation);
      instanceBufferData.fill(slot, 16, instance.transformationNormal);
      var offset = instanceBufferData.getOffset(slot);
      perGeometryDataInfo.instanceBuffer.updateSubData(instanceBufferData.getArray(), offset, offset + 32);
    }
  };

  var updateColorAttributes = function(renderGeometry) {
    var material = renderGeometry.material;
    var matId = material.getId();
    var originId = renderGeometry.origin.id;
    var instanced = isInstanced(renderGeometry);
    var targetMat2data = instanced ? mat2dataInstanced : mat2dataMerged;
    var matData = targetMat2data[matId];
    var originData = matData.origin2data[originId];
    var instance = originData.instances[renderGeometry.uniqueName];

    var upd = {};
    upd[VertexAttrConstants.COLOR] = true;

    var stride = material.getVertexBufferLayout().getStride();
    assert(instance.from +
        material.getOutputAmount(getFirstObjectValue(renderGeometry.data.faces.indices).length) / stride === instance.to,
      "material VBO layout has changed");
    material.fillInterleaved(renderGeometry.data, undefined, undefined, renderGeometry.instanceParameters,
      originData.buffer.getArray(), instance.from * stride, upd);
    originData.vbo.updateSubData(originData.buffer.getArray(), instance.from * stride, instance.to * stride);
  };

  var translationMat = mat4d.identity();
  var transformationRelToOrigin = mat4d.create();
  var invTranspTransformation = mat4d.create();

  var modifyMerged = function(toAdd, toRemove, materialsToRelease, modifiedMergedFaceranges) {
    var mat2delta = compMat2delta(toAdd, toRemove, false);

    for (var matId in mat2delta) {
      var m2d = mat2delta[matId];
      for (var originId in m2d) {
        var delta = m2d[originId];

        var optimalCount = delta.optimalCount;
        var material = delta.material;
        var vertexBufferLayout = material.getVertexBufferLayout();
        var stride = vertexBufferLayout.getStride();

        var matData = mat2dataMerged[matId];
        if (matData === undefined) {
          assert(optimalCount > 0);
          var renderPriority = material.getRenderPriority();

          matData = {
            material : materialRep.aquire(material),
            materialDepthShadowMap : materialRep.aquireDepthShadowMap(material),
            materialNormal : materialRep.aquireNormal(material),
            materialDepth : materialRep.aquireDepth(material),
            origin2data : {}
          };

          mat2dataMerged[matId] = matData;
          if (orderedRendering) {
            insertIntoRenderOrder(matData, renderPriority, "merged");
          }
        }

        var data = matData.origin2data[originId];
        if (data === undefined) {
          assert(optimalCount > 0);

          data = {
            instances : {},
            vbo : new GLVBO(undefined, vertexBufferLayout, gl),
            buffer : new Float32ArrayList(optimalCount),
            optimalCount : 0,
            origin : delta.origin
          };

          matData.origin2data[originId] = data;
        }

        var i, length, from, to; // variables used multiple times

        if (optimalCount > 0) {
          var beginAppend = data.buffer.getSize();

          var oldArray = data.buffer.getArray();

          var rebuild = optimalCount < delta.sparseCount / 2;
          rebuild |= data.buffer.resize(rebuild ? optimalCount : delta.sparseCount);

          var remove = delta.toRemove;
          if (rebuild) {
            beginAppend = 0;
            var arr = data.buffer.getArray();

            var updateIndexRanges = false;

            var instance, name;
            for (i = 0, length = remove.length; i < length; ++i) {
              instance = data.instances[remove[i].uniqueName];
              data.optimalCount -= (instance.to - instance.from) * stride;
              delete data.instances[remove[i].uniqueName];
            }

            var from2instance = {};
            for (name in data.instances) {
              instance = data.instances[name];
              assert(from2instance[instance.from] === undefined);
              from2instance[instance.from] = instance;
            }

            for (name in from2instance) {
              instance = from2instance[name];

              from = instance.from * stride;
              to = instance.to * stride;
              arr.set(oldArray.subarray(from, to), beginAppend);

              instance.from = beginAppend / stride;
              beginAppend += to - from;
              instance.to = beginAppend / stride;

              if (instance.displayedIndexRange) {
                updateIndexRanges = true;
              }
            }

            assert(beginAppend == data.optimalCount);
          } else {
            for (i = 0, length = remove.length; i < length; ++i) {
              var uname = remove[i].uniqueName;

              assert(data.instances[uname] !== undefined);

              from = data.instances[uname].from * stride;
              to = data.instances[uname].to * stride;

              data.buffer.erase(from, to);

              delete data.instances[uname];

              data.optimalCount -= to - from;
            }
          }

          setMatrixTranslation3(translationMat, -delta.origin[0], -delta.origin[1], -delta.origin[2]);

          var ta = delta.toAdd;
          for (i = 0, length = ta.length; i < length; ++i) {
            var renderGeo = ta[i];

            var geomData = renderGeo.data;

            mat4d.multiply(translationMat, renderGeo.transformation, transformationRelToOrigin);

            mat4d.inverse(transformationRelToOrigin, invTranspTransformation);
            mat4d.transpose(invTranspTransformation);

            var oldSize = beginAppend;

            material.fillInterleaved(geomData, transformationRelToOrigin, invTranspTransformation,
              renderGeo.instanceParameters, data.buffer.getArray(), beginAppend);

            var numAdded = material.getOutputAmount(getFirstObjectValue(geomData.faces.indices).length);

            var newSize = oldSize + numAdded;

            assert(data.instances[renderGeo.uniqueName] === undefined);

            instance = new Instance(renderGeo.name, oldSize / stride, newSize / stride,
              renderGeo.displayedIndexRange, undefined, undefined, renderGeo.idx);

            if (renderGeo.displayedIndexRange) {
              updateIndexRanges = true;
            }

            data.instances[renderGeo.uniqueName] = instance;

            data.optimalCount += numAdded;
            beginAppend += numAdded;
          }
          assert(data.optimalCount === optimalCount);

          data.vbo.setData(data.buffer.getArray(), data.buffer.getSize());

          if (updateIndexRanges || data.displayedIndexRange) {
            modifiedMergedFaceranges.push(data);
          }
        } else {
          assert(optimalCount === 0);
          releaseVBO(data.vbo);
          delete matData.origin2data[originId];

          if (Object.keys(matData.origin2data).length === 0) {
            materialsToRelease.push(matId);
            delete mat2dataMerged[matId];
            if (orderedRendering) {
              removeFromRenderOrder(matData, "merged");
            }
          }
        }
      }
    }
  };

  var modifyInstanced = function(toAdd, toRemove, materialsToRelease) {
    var mat2delta = compMat2delta(toAdd, toRemove, true);
    var matData;
    for (var matId in mat2delta) {
      var m2d = mat2delta[matId];
      for (var originId in m2d) {
        var delta = m2d[originId];

        if (delta.optimalCount === 0) {
          matData = mat2dataInstanced[matId];
          releaseVBO(matData.origin2data[originId].vbo);
          delete matData.origin2data[originId];

          if (Object.keys(matData.origin2data).length === 0) {
            materialsToRelease.push(matId);
            delete mat2dataInstanced[matId];
            if (orderedRendering) {
              removeFromRenderOrder(matData, "instanced");
            }
          }

          continue;
        }

        var material = delta.material;

        matData = mat2dataInstanced[matId];
        if (matData === undefined) {
          var renderPriority = material.getRenderPriority();
          matData = {
            material : materialRep.aquire(material),
            materialDepthShadowMap : materialRep.aquireDepthShadowMap(material),
            materialNormal : materialRep.aquireNormal(material),
            materialDepth : materialRep.aquireDepth(material),
            origin2data : {}
          };
          mat2dataInstanced[matId] = matData;
          if (orderedRendering) {
            insertIntoRenderOrder(matData, renderPriority, "instanced");
          }
        }

        var vertexBufferLayout = material.getVertexBufferLayout();
        var instanceBufferLayout = matData.material.instanced ? material.getInstanceBufferLayout() : null;
        var colorInstanced = instanceBufferLayout && instanceBufferLayout.hasAttribute("instanceColor");
        var stride = vertexBufferLayout.getStride();

        var data = matData.origin2data[originId];
        if (data === undefined) {
          data = {
            instances : {},
            vbo : new GLVBO(undefined, vertexBufferLayout, gl),
            buffer : new Float32ArrayList(delta.optimalCount),
            optimalCount : 0,
            perGeometryDataInfo : {},
            origin : delta.origin
          };
          matData.origin2data[originId] = data;
        }

        var beginAppend = data.buffer.getSize();

        var oldArray = data.buffer.getArray();

        var rebuild = delta.optimalCount < delta.sparseCount / 2;
        rebuild |= data.buffer.resize(rebuild ? delta.optimalCount : delta.sparseCount);

        var i, length, from, to, id, fromTo, name, renderGeo, perGeometryDataInfo;

        // prepare instance buffer data containers for additions
        for (id in delta.perGeometryDelta) {
          perGeometryDataInfo = data.perGeometryDataInfo[id];
          if (perGeometryDataInfo && perGeometryDataInfo.instanceBufferData) {
            var removeCount = delta.perGeometryDelta[id].removeCount;
            if (removeCount > 0) {
              perGeometryDataInfo.instanceBufferData.prepareFree(removeCount);
            }
          }
        }

        var remove = delta.toRemove;
        if (rebuild) {
          // rebuild VBO (taking removals into account)
          for (i = 0, length = remove.length; i < length; ++i) {
            renderGeo = remove[i];
            delete data.instances[renderGeo.uniqueName];
            id = renderGeo.data.id;
            perGeometryDataInfo = data.perGeometryDataInfo[id];
            fromTo = perGeometryDataInfo;
            if (--fromTo.refCount === 0 && delta.dataId2refCount[id] === undefined) {
              data.optimalCount -= (fromTo.to - fromTo.from) * stride;
              delete data.perGeometryDataInfo[id];
            }
            else if (perGeometryDataInfo.instanceBufferData) {
              perGeometryDataInfo.instanceBufferData.free(renderGeo.idx);
            }
          }

          beginAppend = 0;
          var arr = data.buffer.getArray();

          var from2fromTo = {};
          for (var dataId in data.perGeometryDataInfo) {
            fromTo = data.perGeometryDataInfo[dataId];
            assert(from2fromTo[fromTo.from] === undefined);
            from2fromTo[fromTo.from] = fromTo;
          }

          for (name in from2fromTo) {      // iteration order ??
            fromTo = from2fromTo[name];
            from = fromTo.from * stride;
            to = fromTo.to * stride;
            arr.set(oldArray.subarray(from, to), beginAppend);
            fromTo.from = beginAppend / stride;
            beginAppend += to - from;
            fromTo.to = beginAppend / stride;
          }

          for (name in data.instances) {
            var instance = data.instances[name];
            instance.from = data.perGeometryDataInfo[instance.dataId].from;
            instance.to = data.perGeometryDataInfo[instance.dataId].to;
          }
        }
        else {
          // remove render geometries from VBO and instance buffer
          for (i = 0, length = remove.length; i < length; ++i) {
            renderGeo = remove[i];
            delete data.instances[renderGeo.uniqueName];
            id = renderGeo.data.id;
            perGeometryDataInfo = data.perGeometryDataInfo[id];
            if (--perGeometryDataInfo.refCount === 0 && delta.dataId2refCount[id] === undefined) {
              from = perGeometryDataInfo.from * stride;
              to = perGeometryDataInfo.to * stride;
              data.buffer.erase(from, to);
              data.optimalCount -= to - from;
              delete data.perGeometryDataInfo[id];
            }
            else if (perGeometryDataInfo.instanceBufferData) {
              perGeometryDataInfo.instanceBufferData.free(renderGeo.idx);
            }
          }
        }

        // create transformation matrix for origin
        setMatrixTranslation3(translationMat, -delta.origin[0], -delta.origin[1], -delta.origin[2]);

        // prepare instance buffer data containers for additions
        for (id in delta.perGeometryDelta) {
          perGeometryDataInfo = data.perGeometryDataInfo[id];
          if (perGeometryDataInfo && perGeometryDataInfo.instanceBufferData) {
            var addCount = delta.perGeometryDelta[id].addCount;
            if (addCount > 0) {
              perGeometryDataInfo.instanceBufferData.prepareAllocate(addCount);
            }
          }
        }

        // add render geometries to VBO and instance buffer
        var ta = delta.toAdd;
        for (i = 0, length = ta.length; i < length; ++i) {
          renderGeo = ta[i];

          var geomData = renderGeo.data;
          id = geomData.id;

          perGeometryDataInfo = data.perGeometryDataInfo[id];
          if (perGeometryDataInfo === undefined) {

            material.fillInterleaved(geomData, undefined, undefined, undefined, data.buffer.getArray(), beginAppend);

            var added = material.getOutputAmount(getFirstObjectValue(geomData.faces.indices).length);
            from = beginAppend / stride;
            beginAppend += added;
            to = beginAppend / stride;

            data.optimalCount += added;

            perGeometryDataInfo = {
              refCount: 1,
              from: from,
              to: to,
              instanceBuffer: null,
              instanceBufferData: null
            };

            if (instanceBufferLayout) {
              perGeometryDataInfo.instanceBuffer = new GLVBO(undefined, instanceBufferLayout, gl);
              perGeometryDataInfo.instanceBufferData =
                new InstanceBufferData(instanceBufferLayout.getStride(), delta.perGeometryDelta[id].addCount);
            }

            data.perGeometryDataInfo[id] = perGeometryDataInfo;
          } else {
            ++perGeometryDataInfo.refCount;
          }

          assert(perGeometryDataInfo.from * stride <= data.buffer.getSize() && perGeometryDataInfo.to * stride <= data.buffer.getSize());

          var transformationRelToOrigin = mat4d.create();
          mat4d.multiply(translationMat, renderGeo.transformation, transformationRelToOrigin);

          instance = new Instance(renderGeo.name, perGeometryDataInfo.from, perGeometryDataInfo.to,
              renderGeo.displayedIndexRange, transformationRelToOrigin, renderGeo.instanceParameters, renderGeo.idx, id);

          var instanceBufferData = perGeometryDataInfo.instanceBufferData;
          if (instanceBufferData) {
            var bufferSlot = instanceBufferData.allocate(renderGeo.idx);
            instanceBufferData.fill(bufferSlot, 0, instance.transformation);
            instanceBufferData.fill(bufferSlot, 16, instance.transformationNormal);
            if (colorInstanced) {
              instanceBufferData.fill(bufferSlot, 32, renderGeo.instanceParameters.color);
            }
          }
          data.instances[renderGeo.uniqueName] = instance;
        }

        assert(data.optimalCount === delta.optimalCount);

        data.vbo.setData(data.buffer.getArray(), data.buffer.getSize());

        for (id in data.perGeometryDataInfo) {
          var pgdi = data.perGeometryDataInfo[id];
          if (pgdi.instanceBuffer) {
            var pgdd = delta.perGeometryDelta[id];
            if (pgdd.addCount + pgdd.removeCount > 0) {
              var array = pgdi.instanceBufferData.compact();
              pgdi.instanceBuffer.setData(array, array.length);
            }
          }
        }
      }
    }
  };

  var compMat2delta = function(toAdd, toRemove, instanced) {
    var mat2delta = {};

    updateMat2delta(toAdd, true, instanced, mat2delta);
    updateMat2delta(toRemove, false, instanced, mat2delta);

    return mat2delta;
  };

  var updateMat2delta = function(content, add, instanced, mat2delta) {
    for (var i = 0, length = content.length; i < length; ++i) {
      var renderGeo = content[i];
      var origin = renderGeo.origin;
      var material = renderGeo.material;
      var matId = material.getId();

      var data = instanced ? mat2dataInstanced[matId] : mat2dataMerged[matId];
      if (data !== undefined) {
        data = data.origin2data[origin.id];
      }

      var delta0 = mat2delta[matId];
      if (delta0 === undefined) {
        delta0 = {};
        mat2delta[matId] = delta0;
      }

      var delta = delta0[origin.id];
      if (delta === undefined) {
        delta = {
          optimalCount : data === undefined ? 0 : data.optimalCount,
          sparseCount : data === undefined ? 0 : data.buffer
              .getSize(),
          material : material,
          toAdd : [],
          toRemove : [],
          perGeometryDelta: null,
          origin : origin.vec3
        };

        if (instanced) {
          var dataId2refCount = {};
          if (data !== undefined) {
            for (var dataId in data.perGeometryDataInfo) {
              dataId2refCount[dataId] = data.perGeometryDataInfo[dataId].refCount;
            }
          }
          delta.dataId2refCount = dataId2refCount;
          delta.perGeometryDelta = {};
        }

        delta0[origin.id] = delta;
      }

      var count = material.getOutputAmount(getFirstObjectValue(renderGeo.data.faces.indices).length);

      if (!instanced) {
        if (add) {
          delta.optimalCount += count;
          delta.sparseCount += count;
          delta.toAdd.push(renderGeo);
        } else {
          delta.optimalCount -= count;
          delta.toRemove.push(renderGeo);
        }
      } else {
        var geometryDataId = renderGeo.data.id;
        var perGeometryDelta = delta.perGeometryDelta[geometryDataId];
        if (!perGeometryDelta) {
          perGeometryDelta = {addCount: 0, removeCount: 0};
          delta.perGeometryDelta[geometryDataId] = perGeometryDelta;
        }
        if (add) {
          perGeometryDelta.addCount++;
          if (delta.dataId2refCount[geometryDataId] === undefined) {
            delta.dataId2refCount[geometryDataId] = 0;
          }
          if (++delta.dataId2refCount[geometryDataId] === 1) {
            delta.optimalCount += count;
            delta.sparseCount += count;
          }

          delta.toAdd.push(renderGeo);
        } else {
          perGeometryDelta.removeCount++;
          if (--delta.dataId2refCount[geometryDataId] === 0) {
            delete delta.dataId2refCount[geometryDataId];
            delta.optimalCount -= count;
          }

          delta.toRemove.push(renderGeo);
        }
      }
    }
  };

  var insertIntoRenderOrder = function(matData, priority, type) {
    var rec, matId = matData.material.getMaterialId();
    // TODO: use binary search
    var N = renderOrder.length, i = 0;
    while ((i < N) && (renderOrder[i][0] >= priority)) {
      rec = renderOrder[i][1];
      if (rec.id === matId) {
        assert(!rec[type], "matData for type already exists");
        rec[type] = matData;
        return;
      }
      i++;
    }
    rec = { id: matId, instanced: null, merged: null};
    rec[type] = matData;
    renderOrder.splice(i, 0, [priority, rec]);
  };

  var removeFromRenderOrder = function(matData, type) {
    var matId = matData.material.getMaterialId();
    var i = 0;
    while (renderOrder[i][1].id !== matId) {
      i++;
    }
    var rec = renderOrder[i][1];
    rec[type] = null;
    if (!(rec.instanced || rec.merged)) {
      renderOrder.splice(i, 1);
    }
  };

  var updateRenderOrder = function(matId, renderOrderArray) {
    // TODO: use binary search
    var N = renderOrderArray.length, i = 0, tmp;
    while ((i < N) && (renderOrderArray[i][1].id !== matId)) {
      i++;
    }
    if (i < N) {
      var rec = renderOrderArray[i][1];
      var matData = rec.merged || rec.instanced;
      var newRenderPriority = matData.material.getRenderPriority();
      var oldRenderPriority = renderOrderArray[i][0];
      if (newRenderPriority !== renderOrderArray[i][0]) {
        renderOrderArray[i][0] = newRenderPriority;
        var dir = newRenderPriority > oldRenderPriority ? -1 : 1;
        i += dir;
        while ((i > -1) && (i < N) && (dir*renderOrderArray[i][0] > dir*newRenderPriority)) {
          // swap
          tmp = renderOrderArray[i];
          renderOrderArray[i] = renderOrderArray[i - dir];
          renderOrderArray[i - dir] = tmp;
          i += dir;
        }
      }
    }
  };
  this.updateRenderOrder = updateRenderOrder; // for unit testing

  var modifyMaterials = function(dirtyMaterials) {
    for (var matId in dirtyMaterials) {
      materialRep.updateMaterialParameters(matId);
    }
  };

  this.modifyRenderOrder = function(dirtyMaterials) {
    if (orderedRendering) {
      for (var matId in dirtyMaterials) {
        updateRenderOrder(matId, renderOrder);
      }

      needsRender = true;
    }
  };

  var releaseMaterials = function(idOrArray) {
    if (Array.isArray(idOrArray)) {
      for (var i = 0; i < idOrArray.length; i++) {
        materialRep.release(idOrArray[i]);
        materialRep.releaseDepth(idOrArray[i]);
        materialRep.releaseNormal(idOrArray[i]);
      }
    } else {
      materialRep.release(idOrArray);
      materialRep.releaseDepth(idOrArray);
      materialRep.releaseNormal(idOrArray);
    }
  };

  var releaseVBO = function(vbo) {
    vbo.dispose();
  };

  var name2indices = function(names) {
    var result = new BitSet();

    for (var i = 0; i < 2; ++i) {
      var mat2data = i === 0 ? mat2dataMerged : mat2dataInstanced;
      for (var matId in mat2data) {
        var origin2data = mat2data[matId].origin2data;
        for (var originId in origin2data) {
          var instances = origin2data[originId].instances;
          for (var name in instances) {
            var instance = instances[name];
            if (names[instance.name] !== undefined) {
              result.set(instance.idx);
            }
          }
        }
      }
    }

    return result;
  };

  var highlightFBO = new GLFBO(gl.RGB, gl.UNSIGNED_BYTE, true, gl.NEAREST, gl);

  var texOnlyColor = [1.0, 1.0, 1.0, 0.5];
  var texOnlyMaterial = new TexOnlyGLMaterial(programRep, highlightFBO.getTexture(), texOnlyColor, true, gl.ALWAYS);

  var IDENTITY = mat4d.identity();
  var NULL_VEC = vec3d.create();
  var highlightQuadBindParams = { proj: IDENTITY, view: IDENTITY, nearFar: [-1.0, 1.0], origin: NULL_VEC};

  var vert = new Float32Array(20);
  vert[0] = -1.0; vert[1] = -1.0; vert[2] = 0; vert[3] = 0; vert[4] = 0;
  vert[5] = 1.0; vert[6] = -1.0; vert[7] = 0; vert[8] = 1.0; vert[9] = 0;
  vert[10] = -1.0; vert[11] = 1.0; vert[12] = 0; vert[13] = 0; vert[14] = 1.0;
  vert[15] = 1.0; vert[16] = 1.0; vert[17] = 0; vert[18] = 1.0; vert[19] = 1.0;

  var quadVBO = new GLVBO(vert, VertexBufferLayout.Defaults.PosTex, gl);

  var renderHighlight = function(camera, visibleContent, filterFaceRange, shadowMap, fbo) {
    var curTime = Date.now();

    var time = (curTime - highlightStartTime) / 1000.0;

    if ((highlightParams.holdTime >= 0) && (time >= highlightParams.duration)) {
      highlightIndices = undefined;
      selectionHighlightIndices = undefined;
      return;
    }

    var max_alpha = 0.7; //1.0 is fully transparent
    if (time < highlightParams.fadeInTime) {
      texOnlyColor[3] = time * (max_alpha / highlightParams.fadeInTime);
    } else if ((highlightParams.holdTime >= 0) && (time > highlightParams.duration - highlightParams.fadeOutTime)) {
      texOnlyColor[3] = max_alpha * (1 - (time - (highlightParams.duration - highlightParams.fadeOutTime)) / highlightParams.fadeOutTime);
    } else {
      texOnlyColor[3] = max_alpha;
    }

    highlightFBO.setSize(camera.width, camera.height);
    highlightFBO.bind();

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.viewport(0, 0, camera.width, camera.height);

    for (var slot = 0; slot < NUM_SLOTS; ++slot) {
      renderInternalSlot(slot, camera, visibleContent, highlightIndices, filterFaceRange, getMaterial, shadowMap);
    }

    if (selectionHighlightIndices) {
      renderSelection(camera, visibleContent, selectionHighlightIndices, filterFaceRange, shadowMap);
    }

    var viewport = camera.viewport;
    gl.viewport(viewport[0], viewport[1], viewport[2], viewport[3]);

    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

    texOnlyMaterial.bind(gl, highlightQuadBindParams);
    texOnlyMaterial.bindView(gl, highlightQuadBindParams);

    quadVBO.bind();
    quadVBO.setPointers(texOnlyMaterial.getProgram());

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, quadVBO.getNum());

    texOnlyMaterial.release(gl, highlightQuadBindParams);
  };

  var computeVBOBuffersSize = function(result) {
    var allocatedSize = 0;
    var usedSize = 0;
    var optimalSize = 0;
    var matId, matData, originId, data;
    for (matId in mat2dataInstanced) {
      matData = mat2dataInstanced[matId];
      for (originId in matData.origin2data) {
        data = matData.origin2data[originId];
        allocatedSize += data.buffer.getArray().length;
        usedSize += data.buffer.getSize();
        optimalSize += data.optimalCount;
      }
    }

    for (matId in mat2dataMerged) {
      matData = mat2dataMerged[matId];
      for (originId in matData.origin2data) {
        data = matData.origin2data[originId];
        allocatedSize += data.buffer.getArray().length;
        usedSize += data.buffer.getSize();
        optimalSize += data.optimalCount;
      }
    }
    result.VBOallocatedSize = allocatedSize*4/1024;
    result.VBOusedSize = usedSize*4/1024;
    result.VBOoptimalSize = optimalSize*4/1024;
  };
};

return Renderer;
});
