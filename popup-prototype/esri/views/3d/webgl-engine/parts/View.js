// jshint bitwise:false

define([
  "dojo/text!../materials/internal/util.xml",
  "../lib/GLTextureRep", "../lib/GLSLProgramRep", "../lib/GLMaterialRep", "../lib/ShaderSnippets",
  "../lib/GLVBO", "../lib/GLFBO", "../lib/TextureRenderer", "../lib/Util", "../lib/gl-matrix", "../lib/webgl-utils", "../lib/GLDefaultState",
  "../materials/BillboardMaterial", "../materials/HUDMaterial",
  "../materials/LeafCardMaterial", "../materials/Material", "../materials/RibbonLineMaterial",
  "../materials/WaterMaterial",
  "../materials/internal/SimpleGLMaterial", "../materials/internal/TexOnlyGLMaterial", "../materials/internal/BlendLayers",
  "../materials/ColorMaterial",
  "../lib/SSAOHelperObscurance",
  "./Model", "./Viewport"
  ],

  function (shaderUtilXml,
        GLTextureRep, GLSLProgramRep, GLMaterialRep, ShaderSnippets,
        GLVBO, GLFBO, TextureRenderer, Util, glMatrix, WebGLUtils, GLDefaultState,
        BillboardMaterial, HUDMaterial,
        LeafCardMaterial, Material, RibbonLineMaterial,
        WaterMaterial,
        SimpleGLMaterial, TexOnlyGLMaterial, BlendLayers, ColorMaterial,
        SSAOHelper,
        Model, Viewport) {

// "../lib/GLUtil";
// "../lib/webgl-debug";
// "../lib/webgl-tracingContext";

var vec3d = glMatrix.vec3d;
var vec4d = glMatrix.vec4d;
var mat4d = glMatrix.mat4d;

var View = function(container, stage, modelDirtySet, options) {
  var canvas = document.createElement("canvas");
  canvas.setAttribute("style", "width: 100%; height:100%; display:block;");

  var backgroundColor = [1.0, 1.0, 1.0, 1.0];

  //touchGesture.init(canvas);

  var opts = {
    alpha: options.alpha || false
  };

  if (options.antialias != null) {
    opts.antialias = options.antialias;
  }

  var glSetup = WebGLUtils.setupWebGL(canvas, opts);
  var gl = glSetup[0];
  glSetup = undefined;
  
  Util.assert(gl);
  
  //gl = WebGLDebugUtils.makeDebugContext(gl, glHandleError, glValidateNoneOfTheArgsAreUndefined);
  //gl = WebGLTracingContext.makeTracingContext(gl);
  
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.web3DDefaultState = new GLDefaultState(gl);
  
  var fpsCounter = new Util.FPSCounter();

  var shaderSnippets;
  var programRep, shaderRep;
  createProgramAndShaderRep();
  var vboRep = new GLVBO.GLVBORep();
  var textureRep = new GLTextureRep(stage.getAll(Model.ContentType.TEXTURE),
      programRep, function() { return viewport.getCamera().viewport; }, gl);
  var materialRep = new GLMaterialRep(textureRep, programRep);

  var lightDirection = vec3d.createFrom(0, 1, 0);
  
  var viewport = new Viewport(programRep, vboRep, materialRep, textureRep, gl);
  var containerBoundingRect = container.getBoundingClientRect();

  var camera = viewport.getCamera();
  camera.viewport[2] = containerBoundingRect.width;
  camera.viewport[3] = containerBoundingRect.height;

  viewport.setCamera(camera);

  var textureRenderer = new TextureRenderer(gl, canvas, programRep, materialRep, textureRep, modelDirtySet);
  var screenCaptureQueue = [];

  var needsRender = true;
  var idleSuspend = true;

  container.appendChild(canvas);

  this.dispose = function() {
    viewport.dispose();
    viewport = null;

    textureRenderer.dispose();
    textureRenderer = null;

    programRep.dispose();
    programRep = null;

    if (container.contains(canvas)) {
      container.removeChild(canvas);
    }

    canvas = null;
    gl = null;
  };

  this.getCombinedStats = function () {
    var stats = viewport.getCombinedStats();
    return stats;
  };
 
  var resetNeedsRender = function() {
    needsRender = false;

    stage.resetNeedsRender();
    viewport.resetNeedsRender();
    textureRep.resetNeedsRender();
  };

  this.resetNeedsRender = resetNeedsRender;

  var checkNeedsRender = function() {
    return stage.needsRender() || needsRender || !idleSuspend || viewport.needsRender() || textureRep.needsRender();
  };

  this.needsRender = function() {
    return checkNeedsRender();
  };

  var shouldRender = false;

  var frameTask = {
    preRender: function() {
      stage.processDirty();

      if (checkNeedsRender()) {
        shouldRender = true;

        var camera = viewport.getCamera();
        camera.setGLViewport(gl);

        gl.clearColor.apply(gl, backgroundColor);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      } else {
        shouldRender = false;
      }
    },

    render: function() {
      if (!shouldRender) {
        return;
      }

      gl.web3DDefaultState.apply();
      viewport.render(lightDirection, null);
    },

    postRender: function() {
      if (!shouldRender) {
        return;
      }
    },

    update: function() {
      performScreenCaptures();
      resetNeedsRender();

      var time = Util.performance.now();
      fpsCounter.step(time);
    }
  };

  this.getFrameTask = function() {
    return frameTask;
  };

  var tmpLightingData = {
    ambient: vec4d.create(),
    diffuse: vec4d.create(),
    specular: vec4d.create(),
    direction: vec3d.create()
  };

  this.setLights = function(ambientLight, directionalLight) {
    var al = ambientLight;
    var dl = directionalLight;

    vec3d.set(dl.direction, lightDirection);

    vec4d.set4(al.color[0], al.color[1], al.color[2], al.intensity, tmpLightingData.ambient);
    vec4d.set4(dl.color[0], dl.color[1], dl.color[2], dl.intensity, tmpLightingData.diffuse);
    vec4d.set4(dl.color[0], dl.color[1], dl.color[2], Math.min(dl.intensity+al.intensity, 1.0), tmpLightingData.specular);
    vec3d.set(dl.direction, tmpLightingData.direction);

    viewport.setLightingData(tmpLightingData);
    needsRender = true;
  };

  this.getViewParams = function(req) {
    var result = viewport.getViewParams(req);

    if (!req || req.backgroundColor) {
      result.backgroundColor = backgroundColor;
    }

    return result;
  };

  this.setViewParams = function(params) {
    needsRender = true;

    if (params.backgroundColor) {
      backgroundColor = params.backgroundColor;
    }

    viewport.setViewParams(params);
  };

  this.setRenderParams = function(params) {
    needsRender = true;

    if ("anisotropicFiltering" in params) {
      textureRep.setMaxAnisotropy(params.anisotropicFiltering);
    }
    if ("backfaceCulling" in params) {
      gl.web3DDefaultState.cullEnabled = params.backfaceCulling;
    }
    if (params.idleSuspend !== undefined) {
      idleSuspend = !!params.idleSuspend;
    }
    viewport.setRenderParams(params);
  };
  
  this.getRenderParams = function() {
    var params = viewport.getRenderParams();
    params.anisotropicFiltering = textureRep.getMaxAnisotropy();
    params.backfaceCulling = gl.web3DDefaultState.cullEnabled;
    params.idleSuspend = idleSuspend;
    return params;
  };

  this.has = function(parameter) {
    if (parameter === "s3tc") {
      return !!gl.getExtension("WEBGL_compressed_texture_s3tc");
    }
    return false;
  };

  this.getFrustumObjects = function() {
    return viewport.getFrustumObjects();
  };

  this.modify = function(toAdd, toRemove, toUpdate, dirtyMaterials, idx) {
    viewport.modify(toAdd, toRemove, toUpdate, dirtyMaterials, idx);
  };

  this.setSelectionObject = function(objectName, faceRange) {
    viewport.setSelectionObject(objectName, faceRange);
  };
  
  this.setHighlightObjects = function(objectNames, params) {
    viewport.setHighlightObjects(objectNames, params);    
  };

  this.frame = function(center, distance) {
    viewport.frame(center, distance);
  };

  this.setCamera = function(camera) {
    viewport.setCamera(camera);
  };
  
  this.getCamera = function() {
    return viewport.getCamera();
  };
  
  this.addFPSListener = function(listener) {
    fpsCounter.addListener(listener);
  };

  this.removeFPSListener = function(listener) {
    fpsCounter.removeListener(listener);    
  };
  
  this.getPickRay = function(point, result0, result1) {
    viewport.getPickRay(point, result0, result1);
  };

  this.pickRayWithBeginPoint = function(point, pointBegin, viewMatrix, result0, result1) { 
    viewport.pickRayWithBeginPoint(point, pointBegin, viewMatrix, result0, result1);
  };

  this.getSideIndexForPoint = function(point) {
    return viewport.getSideIndexForPoint(point);
  };

  this.getCanvas = function() {
    return canvas;
  };

  this.getTextureGraphicsRenderer = function() {
    return textureRenderer;
  };

  this.renderScreenshots = function(views) {
    var vp = new Viewport(programRep, vboRep, materialRep, textureRep, gl);

    var viewParams = viewport.getViewParams({
      frustumCullingEnabled: true,
      maxFarNearRatio: true
    });

    vp.setLightingData(viewport.getLightingData());
    vp.setRenderParams(viewport.getRenderParams());
    vp.modify(Util.object2array(viewport.getContent()), []);

    var externalRenderers = viewport.getExternalRenderers();
    for (var slot = 0; slot < externalRenderers.length; slot++) {
      for (var ri = 0; ri < externalRenderers[slot].length; ri++) {
        vp.addExternalRenderer(slot, externalRenderers[slot][ri]);
      }
    }

    var result = new Array(views.length);
    var view;

    for (var i = 0, length = views.length; i < length; ++i) {
      view = views[i];

      var camera = view.camera;

      viewParams.pixelRatio = 0.5*(camera.width/canvas.width + camera.height/canvas.height);

      vp.setViewParams(viewParams);

      var fbo = new GLFBO(gl.RGBA, gl.UNSIGNED_BYTE, true, gl.NEAREST, gl);
      fbo.setSize(camera.width, camera.height);
      fbo.bind();

      var wh4 = camera.width * camera.height * 4;

      vp.setCamera(camera);

      gl.clearColor.apply(gl, backgroundColor);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      vp.step(0.0);
      vp.render(lightDirection, fbo.getGLName());
      
      var pixels = new Uint8Array(wh4); 
      gl.readPixels(0, 0, camera.width, camera.height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
      
      for (var j = 3; j < wh4; j += 4) {
        pixels[j] = 255;
      }
      
      result[i] = pixels;
    }
    
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    fbo.dispose();
    
    gl.viewport(0, 0, canvas.width, canvas.height);
    
    vp.dispose();
    
    return result;
  };

  this.requestScreenCapture = function(settings, callback) {
    screenCaptureQueue.push({
      settings: settings || {},
      callback: callback
    });

    needsRender = true;
  };
  
  this.getAllTexturesLoaded = function() {
    return textureRep.getLoadingCount() === 0;
  };
  
  this.getTextureLoaded = function(name) {
    return textureRep.getIsLoaded(name);
  };
  
  this.addTextureListener = function(listener) {
    textureRep.addTextureListener(listener);
  };
  
  this.removeTextureListener = function(listener) {
    textureRep.removeTextureListener(listener);
  };

  this.addExternalRenderer = function(slot, renderer) {
    if (viewport.addExternalRenderer(slot, renderer)) {
      renderer.initializeRenderContext({
        gl: gl,
        shaderSnippets: shaderSnippets,
        shaderRep: shaderRep,
        programRep: programRep,
        textureRep: textureRep
      });

      return true;
    }

    return false;
  };

  this.removeExternalRenderer = function(slot, renderer) {
    return viewport.removeExternalRenderer(slot, renderer);
  };

  // debug helpers: these functions are meant for debug and testing use only. don"t use in production code!

  this._getModule = function(moduleName) {
    if (moduleName === "viewport") {
      return viewport;
    } else {
      return viewport._getModule(moduleName);
    }
  };

  this.registerMaterial = function(materialClass){
    materialClass.loadShaders(shaderSnippets, shaderRep, programRep, gl);
  };

  var resizeCanvas = document.createElement("canvas");

  function performScreenCaptures() {
    if (screenCaptureQueue.length === 0) {
      return;
    }

    for (var i = 0; i < screenCaptureQueue.length; i++) {
      var capture = screenCaptureQueue[i];

      var sourceRect = {
        x: 0,
        y: 0,
        width: canvas.width,
        height: canvas.height
      };

      var destRect = {
        x: 0,
        y: 0,
        width: canvas.width,
        height: canvas.height
      };

      var area = capture.settings.area;

      if (area) {
        sourceRect.x = area.x;
        sourceRect.y = area.y;
        sourceRect.width = area.width;
        sourceRect.height = area.height;
      }

      if (capture.settings.width !== undefined && capture.settings.height !== undefined) {
        // Crop source further according to width/height ratio, then scale up
        var ratio = capture.settings.width / capture.settings.height;

        if (sourceRect.height * ratio < sourceRect.width) {
          // Crop further on x
          var width = sourceRect.height * ratio;

          sourceRect.x += Math.floor((sourceRect.width - width) / 2);
          sourceRect.width = Math.floor(width);
        } else {
          // Crop further on y
          var height = sourceRect.width / ratio;

          sourceRect.y += Math.floor((sourceRect.height - height) / 2);
          sourceRect.height = Math.floor(height);
        }

        destRect.width = capture.settings.width;
        destRect.height = capture.settings.height;
      } else {
        destRect.width = sourceRect.width;
        destRect.height = sourceRect.height;
      }

      var dest = canvas;

      if (sourceRect.x !== 0 || sourceRect.y !== 0 || sourceRect.width !== canvas.width || sourceRect.height !== canvas.height ||
          destRect.x !== 0 || destRect.y !== 0 || destRect.width !== canvas.width || destRect.height !== canvas.height) {
        resizeCanvas.width = destRect.width;
        resizeCanvas.height = destRect.height;

        var dstCtx = resizeCanvas.getContext("2d");

        var srcData = new Uint8Array(sourceRect.width * sourceRect.height * 4);
        gl.readPixels(sourceRect.x, canvas.height - (sourceRect.y + sourceRect.height), sourceRect.width, sourceRect.height, gl.RGBA, gl.UNSIGNED_BYTE, srcData);

        var dstData = dstCtx.getImageData(destRect.x, destRect.y, destRect.width, destRect.height);

        Util.resampleHermite(srcData, sourceRect.width, sourceRect.height, dstData.data, destRect.width, destRect.height, true);
        dstCtx.putImageData(dstData, destRect.x, destRect.y);

        dest = resizeCanvas;
        dstCtx = null;
      }

      var type = {
        "png": "image/png",
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg"
      }[capture.settings.format ? capture.settings.format.toLowerCase() : "png"];

      var quality = 1;

      if (capture.settings.quality !== undefined) {
        quality = capture.settings.quality / 100;
      }

      var dataURL = dest.toDataURL(type, quality);

      capture.callback({
        dataURL: dataURL,
        x: destRect.x,
        y: destRect.y,
        width: destRect.width,
        height: destRect.height
      });
    }

    screenCaptureQueue = [];
  }

  function createProgramAndShaderRep() {
    var snippets = new ShaderSnippets();
    snippets._parse(shaderUtilXml);

    programRep = new GLSLProgramRep();
    shaderRep = {
      shaders: {},
      add: function(name, shader) {
        Util.assert(this.shaders[name] === undefined);
        this.shaders[name] = shader;
      },
      get: function(name) {
        Util.assert(this.shaders[name] !== undefined);
        return this.shaders[name];
      }
    };

    SimpleGLMaterial.loadShaders(snippets, shaderRep, programRep, gl);
    TexOnlyGLMaterial.loadShaders(snippets, shaderRep, programRep, gl);
    Material.loadShaders(snippets, shaderRep, programRep, gl);
    SSAOHelper.loadShaders(snippets, shaderRep, programRep, gl);
    BillboardMaterial.loadShaders(snippets, shaderRep, programRep, gl);
    HUDMaterial.loadShaders(snippets, shaderRep, programRep, gl);
    LeafCardMaterial.loadShaders(snippets, shaderRep, programRep, gl);
    RibbonLineMaterial.loadShaders(snippets, shaderRep, programRep, gl);
    WaterMaterial.loadShaders(snippets, shaderRep, programRep, gl);
    BlendLayers.loadShaders(snippets, shaderRep, programRep, gl);
    ColorMaterial.loadShaders(snippets, shaderRep, programRep, gl);

    shaderSnippets = snippets;
    return programRep;
  }
};

return View;

});
