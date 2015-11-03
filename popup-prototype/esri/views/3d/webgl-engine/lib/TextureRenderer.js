/* jshint forin:false, bitwise:false */
define(["./Renderer",
  "./ShadowMap",
  "./GLFBO",
  "./GLVBO",
  "./VertexBufferLayout",
  "./Camera",
  "./Util",
  "./gl-matrix",
  "../materials/internal/TexOnlyGLMaterial"],
  function(Renderer, ShadowMap, GLFBO, GLVBO, VertexBufferLayout, Camera, Util, glMatrix, TexOnlyGLMaterial) {

  var vec3 = glMatrix.vec3;
  var mat4d = glMatrix.mat4d;

  var DEBUG_DRAW_TEST_TEXTURE = false;

  return function TextureRenderer(gl, canvas, programRep, materialRep, textureRep, modelDirtySet) {
    var acquiredTextures = {};
    var clearColor = [0, 0, 0, 0];

    if (DEBUG_DRAW_TEST_TEXTURE) {
      var testPatternCols = [[1,0.5,0.5],[0.5,0.5,1],[0.5,1,0.5]];
    }

    var renderer = new Renderer(programRep, undefined /*vboRep*/, materialRep, textureRep, gl, true /* orderedRendering*/);
    var shadowMap = new ShadowMap(programRep, gl); // only required as a placeholder by Renderer
    renderer.setLightingData({ambient: [1,1,1,1], diffuse: [0,0,0,0], specular: [0,0,0,0], direction: [0,-1,0]});

    var visibleContentAllVisible = { get: function() { return true; }}; // Fakes a BitSet where every bit is on

    this.dispose = function() {
      for (var texId in acquiredTextures) {
        acquiredTextures[texId].fbo.dispose();
        textureRep.release(texId);
      }
      acquiredTextures = null;

      renderer.dispose();
      renderer = null;
    };

    this.addRenderGeometries = function(renderGeometries) {
      renderGeometries.forEach(function(rg) {
        if (rg.origin == null) {
          rg.origin = getOrigin(rg.center, rg.bsRadius);
        }
      });
      renderer.modify(renderGeometries, []);
    };

    this.removeRenderGeometries = function(renderGeometries) {
      renderer.modify([], renderGeometries);
    };

    this.updateRenderGeometries = function(renderGeometries, updateType) {
      var updates = renderGeometries.map(function(rg) { return { renderGeometry: rg, updateType: updateType }; });
      renderer.modify([], [], updates, []);
    };

    this.updateRenderOrder = function(dirtyMaterials) {
      if (Object.keys(dirtyMaterials).length > 0) {
        renderer.modifyRenderOrder(dirtyMaterials);
      }
    };

    this.setBackgroundColor = function(color) {
      clearColor = color;
    };

    this.isEmpty = function() {
      return renderer.isEmpty();
    };

    function processDirtyMaterials() {
      var dirtyMaterials = modelDirtySet.getDirtyMaterials();

      if (dirtyMaterials) {
        renderer.modify([], [], [], dirtyMaterials);
      }

      modelDirtySet.clearDirtyMaterials();
    }

    var tmpCamera = new Camera();

    this.draw = function(texture, canvasGeometries) {
      processDirtyMaterials();

      var texId = texture.getId();
      var glName, fbo;
      if (!acquiredTextures[texId]) {
        glName =  textureRep.aquire(texId);
        fbo = new GLFBO(gl.RGBA, gl.UNSIGNED_BYTE, false, gl.NEAREST, gl, glName);
        var idx = Object.keys(acquiredTextures).length;
        acquiredTextures[texId] = {  glName: glName, fbo: fbo, idx: idx };
      } else {
        fbo = acquiredTextures[texId].fbo;
      }

      var width = canvasGeometries.width;
      var height = canvasGeometries.height;

      if ((fbo.getWidth() !== width) || (fbo.getHeight() !== height)) {
        fbo.setSize(width, height);
        //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      }

      tmpCamera.near = 1;
      tmpCamera.far = 10000;

      fbo.bind();

      gl.disable(gl.DEPTH_TEST);
      gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

      gl.clearColor.apply(gl, clearColor);
      gl.clear(gl.COLOR_BUFFER_BIT);

      shadowMap.bindAll(programRep);
      renderer.setPixelRatio(canvasGeometries.pixelRatio || 1);

      for (var i = 0; i < canvasGeometries.views.length; i++) {
        var canvasGeometry = canvasGeometries.views[i];

        tmpCamera.viewport = canvasGeometry.viewport;

        mat4d.ortho(0, canvasGeometry.extent[2] - canvasGeometry.extent[0],
                    0, canvasGeometry.extent[3] - canvasGeometry.extent[1],
                    tmpCamera.near, tmpCamera.far, tmpCamera.projectionMatrix);

        // We could prevent clipping by the following approach:
        // First, scale z coordinate by 0 (to set it to 0)
        // Then, offset z coordinate by -tmpCamera.near (to put it behind the near plane)
        // However, RibbonLineMaterial performs non-trivial operations in world space,
        // so we need to set the z coordinate of the geometry manually anyway.
        mat4d.identity(tmpCamera.viewMatrix);
        mat4d.translate(tmpCamera.viewMatrix, [-canvasGeometry.extent[0],
                                               -canvasGeometry.extent[1],
                                               0]);
        // mat4d.scale(tmpCamera.viewMatrix, [1,1,0]);

        tmpCamera.setGLViewport(gl);

        if (DEBUG_DRAW_TEST_TEXTURE) {
          drawTestTexture(width, height, testPatternCols[acquiredTextures[texId].idx%testPatternCols.length]);
        }

        renderer.render(tmpCamera, visibleContentAllVisible, shadowMap, fbo);
      }

      gl.enable(gl.DEPTH_TEST);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
      //gl.generateMipmap(gl.TEXTURE_2D);
    };

    function drawTestTexture(width, height, col) {
      if (!this.testPatternMat) {
        var buffer = new Uint8Array(width*height*4);
        var o = 0;
        for (var y = 0; y < height; y++) {
          for (var x = 0; x < width; x ++) {
            var xbl = Math.floor(x/10);
            var ybl = Math.floor(y/10);
            if ((xbl<2)||(ybl<2)||(xbl*10>width-20)||(ybl*10>height-20)) {
              buffer[o++] = 255;
              buffer[o++] = 255;
              buffer[o++] = 255;
              buffer[o++] = 255;
            } else {
              buffer[o++] = 255;
              buffer[o++] = 255;
              buffer[o++] = 255;

              if ((xbl & 1) && (ybl & 1)) {
                buffer[o++] = ((x&1)^(y&1)) ? 0 : 255;
              }
              else {
                buffer[o++] = ((xbl&1)^(ybl&1)) ? 0 : 128;
              }
            }
          }
        }
        var glTex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, glTex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, buffer);
        this.testPatternMat = new TexOnlyGLMaterial(programRep, glTex, [1,1,1,1], true, gl.ALWAYS);
        this.testPatternBindParams = { proj: mat4d.identity(), view: mat4d.identity(), nearFar: [-1.0, 1.0], origin: [0,0,0]};

        var vert = new Float32Array(20);
        vert[0] = -1.0; vert[1] = -1.0; vert[2] = 0.0; vert[3] = 0.0; vert[4] = 0.0;
        vert[5] = 1.0; vert[6] = -1.0; vert[7] = 0.0; vert[8] = 1.0; vert[9] = 0.0;
        vert[10] = -1.0; vert[11] = 1.0; vert[12] = 0.0; vert[13] = 0.0; vert[14] = 1.0;
        vert[15] = 1.0; vert[16] = 1.0; vert[17] = 0.0; vert[18] = 1.0; vert[19] = 1.0;
        this.quadVBO = new GLVBO(vert, VertexBufferLayout.Defaults.PosTex, gl);
      }

      this.testPatternMat.setColor([col[0],col[1],col[2],1]);
      this.testPatternMat.bind(gl, this.testPatternBindParams);
      this.testPatternMat.bindView(gl, this.testPatternBindParams);

      this.quadVBO.bind();
      this.quadVBO.setPointers(this.testPatternMat.getProgram());

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.quadVBO.getNum());

      this.testPatternMat.release(gl);
    }

    var id2origin = {};

    //anti wobble: get origin using implicit octree
    var getOrigin = function(center, radius) {
      var MIN_GRID_SIZE = 10000.0;
      var SCALE = 10.0;

      var level = 0; //level 0 == MIN_GRID_SIZE km grid
      var numMinGrid = radius * SCALE / MIN_GRID_SIZE;

      if (numMinGrid > 1.0) {
        level = Math.ceil(Util.logWithBase(numMinGrid, 2.0));
      }

      var gridSize = Math.pow(2.0, level) * MIN_GRID_SIZE;

      var i = Math.round(center[0] / gridSize);
      var j = Math.round(center[1] / gridSize);
      var k = Math.round(center[2] / gridSize);

      var id = level + "_" + i + "_" + j + "_" + k;

      var originAndId = id2origin[id];
      if (originAndId === undefined) {
        originAndId = { "vec3" : vec3.createFrom(i * gridSize, j * gridSize, k * gridSize), "id" : id };
        id2origin[id] = originAndId;
      }
      return originAndId;
    };
  };
});
