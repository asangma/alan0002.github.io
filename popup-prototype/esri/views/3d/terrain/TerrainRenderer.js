/* jshint forin: false, sub: true, bitwise: false */
define(["dojo/Deferred", "dojo/when", "./TileUtils", "./TerrainConst", "./TileGeometryFactory",
  "../support/PreallocArray", "../support/ObjectPool",
  "../webgl-engine/lib/GLVBO", "../webgl-engine/lib/GLIBO", "../webgl-engine/lib/ShaderVariations",
  "dojo/text!./TerrainMaterial.xml",
  "../webgl-engine/materials/internal/MaterialUtil",
  "../webgl-engine/lib/GLSLProgram", "../webgl-engine/lib/Util",
  "../webgl-engine/lib/GLUtil", "../lib/glMatrix"],
  function(Deferred, when, TileUtils, TerrainConst, TileGeometryFactory,
           PreallocArray, ObjectPool,
           GLVBO, GLIBO, ShaderVariations,
           TerrainMaterialXML,
           MaterialUtil, GLSLProgram, Util, GLUtil, glMatrix)
  {
    var assert = Util.assert;
    var vec2d = glMatrix.vec2d;
    var vec3d = glMatrix.vec3d;
    var vec4d = glMatrix.vec4d;

    var IDENTITY = glMatrix.mat4d.identity();
    var FIRST_TEX_UNIT = 4;
    var OVL_TEX_OFFSET_DISABLE = [2, 2];
    var OPAQUE_SLOT = 1,
      TRANSPARENT_SLOT = 3;
    var ZEROZERO = [0, 0];
    var ZERO_VEC3 = vec3d.create();

    var TEXTURE_MAX_ANISOTROPY_EXT; // to be assigned when the texture_filter_anisotropic extension is loaded

    var LOCAL_ORIGIN_SRC_LEVEL  = 7;
    var LOCAL_ORIGIN_ADOPTION_LEVEL  = 10;

    var vertexBufferLayout = MaterialUtil.Layouts.PosTex;

    var tmpNearFar = vec2d.create();

    var bufferSize = 256;

    var TileRenderData = function TileRenderData() {
      this.overlayTexOffset = vec2d.create();
      this.texOffset = vec2d.create();
      this.geometryInfo = {
        geometry: null,
        numSurfaceIndices: 0,
        numSkirtIndices: 0,
        numWithoutSkirtIndices: 0,
        numVertsPerRow: 0
      };

      this.init();
    };

    TileRenderData.prototype.init = function() {
      this.geometryInfo.geometry = null;
      this.geometryInfo.numSurfaceIndices = 0;
      this.geometryInfo.numSkirtIndices = 0;
      this.geometryInfo.numWithoutSkirtIndices = 0;
      this.geometryInfo.numVertsPerRow = 0;

      this.geometryState = null;
      this.vbo = null;
      this.ibo = null;

      // this.texture is a WebGLTexture created to composite all layers of a tile into. it is only created when
      // compositing is necessary.
      this.texture = null;
      // this.textureReference is a reference to a WebGLTexture from some tile's layerInfo.data, i.e. to one of the
      // source data textures. it is set when rendering can be done directly from the source data (e.g. if only
      // a single opaque layer is present).
      this.textureReference = null;
      vec2d.set2(0, 0, this.texOffset);
      this.texScale = 1;

      this.overlayTexId = null;
      this.overlayTexScale = 1;
      this.overlayOpacity = 1;
      this.localOrigin = null;
    };

    TileRenderData.prototype.updateGeometryState = function(tile) {
      this.geometryState = tile.geometryState(this.geometryState);
      return this.geometryState;
    };

    var TerrainRenderer = function TerrainRenderer(manifold) {
      var gl, stageTextureRep;
      var initialized = false;
      var rootTiles = null;
      var programVariations = null;
      var programs = null;
      var overlayTextures = {};

      var renderDataPool = new ObjectPool(100, TileRenderData);

      var perOriginTileData = new PreallocArray(10, function() {
        return {
          root: null,
          tiles: new PreallocArray(300)
        };
      });

      var tileIterator = new TileUtils.IteratorPreorder();

      var highestVisibileLODTile;

      var afExt, maxMaxAnisotropy, maxAnisotropy;

      // state
      var visible = true;
      var opacity = 1;
      var drawSkirts = true;

      var wireframe = {
        mode: "none",
        width: 1.5,
        falloff: 1.5,
        wireOpacity: 1,
        surfaceOpacity: 0,
        color: [1, 1, 1, 0],
        subdivision: "geometry",
        subdivisionReduceLevels: 0
      };

      var drawBorders = false;
      var disableRendering = false;
      var cullBackFaces = false;
      var renderOrder = 1; // 0: off, 1: front-to-back, -1: back-to-front
      var frontMostTransparent = true;

      // resources
      var fboBlend = null;
      var vboQuad = null;
      var gridTex = null;

      var gridTexImage = null;
      var gridTexImageData = null;

      this.updateTileBackground = function(src) {
        if (gridTexImage) {
          gridTexImage.reject();
        }

        gridTexImageData = src;

        var dfd = new Deferred();
        gridTexImage = dfd;

        if (src) {
          var image = new Image();

          if (src instanceof Image) {
            image.src = src.src;
          } else {
            image.src = src;
          }

          image.onload = function() {
            if (!dfd.isFulfilled()) {
              dfd.resolve(image);
            }
          };
        } else {
          dfd.resolve(null);
        }

        this.renderTileBackground();
        return dfd.promise;
      };

      // stats
      var numTrianglesRendered = 0,
        numTilesRendered = 0,
        numTilesCulled = 0,
        numOriginsRendered = 0;

      this.numTileTexturesComposited = 0;

      this.castShadows = false;

      this.loaded = function() {};

      var loaded = false;

      this.needsRender = true;
      this.didRender = false;

      // Increase the capacity to increase the maximum number of queries to
      // perform per frame.
      var visibleScaleRangeQueries = new PreallocArray(10);
      var visibleScaleRangeQueriesInvPtr = 0;

      var visibleScaleRangeQueryQueue = new PreallocArray(30);
      var visibleScaleRangeQueryPool = new ObjectPool(10, function() {
        this.extent = vec4d.create();
        this.minScale = 0;
        this.maxScale = 0;
        this.callback = null;
      });

      this.renderTileBackground = function() {
        if (gl && gridTexImage) {
          return gridTexImage.then(function(image) {
            gridTex = this._buildTexture();

            if (image) {
              GLUtil.texImage2D(image, gridTex, gl, null, null, false, false, false);
            }

            if (rootTiles) {
              TileUtils.traverseTilesPreorder(rootTiles, function(tile) {
                this.updateTileTexture(tile);
              }.bind(this));
            }
          }.bind(this));
        }
      };

      this.initializeRenderContext = function(context) {
        gl = context.gl;

        afExt = (gl.getExtension("EXT_texture_filter_anisotropic") ||
            gl.getExtension("MOZ_EXT_texture_filter_anisotropic") ||
            gl.getExtension("WEBKIT_EXT_texture_filter_anisotropic")
          );
        assert(!TEXTURE_MAX_ANISOTROPY_EXT || (TEXTURE_MAX_ANISOTROPY_EXT === afExt.TEXTURE_MAX_ANISOTROPY_EXT),
          "contexts have different definitions afExt.TEXTURE_MAX_ANISOTROPY_EXT");
        if(afExt != null){
          TEXTURE_MAX_ANISOTROPY_EXT = afExt.TEXTURE_MAX_ANISOTROPY_EXT;
          maxMaxAnisotropy = gl.getParameter(afExt.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
          maxAnisotropy = Math.min(8, maxMaxAnisotropy);
        }

        var indexUintExt = gl.getExtension("OES_element_index_uint");
        TileGeometryFactory.setSupportsUintIndices(!!indexUintExt);

        when(this.renderTileBackground(), function() {
          initialized = true;
          this.needsRender = true;
        }.bind(this));

        //VBO and FBO for Texture Composition
        var vert = new Float32Array(20);
        vert[0]  = -1.0; vert[1]  = -1.0; vert[2]  = 0.0; vert[3]  = 0;   vert[4]  = 0;
        vert[5]  =  1.0; vert[6]  = -1.0; vert[7]  = 0.0; vert[8]  = 1.0; vert[9]  = 0;
        vert[10] = -1.0; vert[11] =  1.0; vert[12] = 0.0; vert[13] = 0;   vert[14] = 1.0;
        vert[15] =  1.0; vert[16] =  1.0; vert[17] = 0.0; vert[18] = 1.0; vert[19] = 1.0;

        vboQuad = new GLVBO(vert, vertexBufferLayout, gl);
        fboBlend = gl.createFramebuffer();

        stageTextureRep = context.textureRep;

        var snippets = context.shaderSnippets,
          shaderRep = context.shaderRep,
          programRep = context.programRep;

        if (!snippets.vsTerrain) {
          snippets._parse(TerrainMaterialXML);
        }

        // used for Wireframe program
        gl.getExtension("OES_standard_derivatives");

        var colorPrograms = new ShaderVariations("terrain", ["vsTerrain", "fsTerrain"], null, programRep, shaderRep, snippets, gl);

        colorPrograms.addDefine("Spherical", "SPHERICAL");
        colorPrograms.addDefine("Overlay", "OVERLAY");
        colorPrograms.addDefine("Atmosphere", "ATMOSPHERE");
        colorPrograms.addDefine("Wireframe", "WIREFRAME");
        colorPrograms.addDefine("TileBorders", "TILE_BORDERS");

        colorPrograms.addBinaryShaderSnippetSuffix("Wireframe", "Wireframe", [false, true]);

        var normalPrograms = new ShaderVariations("terrainNormal", ["vsTerrainNormal", "fsNormal"], null, programRep, shaderRep, snippets, gl);
        normalPrograms.addDefine("Spherical", "SPHERICAL");
        normalPrograms.addDefine("AlphaZero", "ALPHA_ZERO");

        programs = {
          depth: programRep.get("depth"),
          depthShadowMap: programRep.get("depthShadowMap"),
          depthOnly: GLSLProgram.fromSnippets("vsTerrainDepthOnly", "fsTerrainDepthOnly", snippets, gl),
          blendLayers: GLSLProgram.fromSnippets("vertexShaderBlendLayers", "fragmentShaderBlendLayers", snippets, gl)
        };

        programVariations = {
          color: colorPrograms,
          normal: normalPrograms
        };

        this._updatePrograms();
      };

      this._updatePrograms = function() {
        var spherical = manifold === "spherical";

        var wireframeShader = wireframe.mode === "shader";

        programs.color = programVariations.color.getProgram([spherical, true, spherical, wireframeShader, drawBorders,  wireframeShader || drawBorders]);
        programs.normal = programVariations.normal.getProgram([spherical, true]);

      };

      this.install = function(stage) {
        stage.addExternalRenderer([OPAQUE_SLOT, TRANSPARENT_SLOT], this);
      };

      this.uninstall = function(stage) {
        stage.removeExternalRenderer([OPAQUE_SLOT, TRANSPARENT_SLOT], this);
      };

      this.setRootTiles = function(newRootTiles) {
        rootTiles = newRootTiles;
      };

      this.loadTile = function(tile) {
        assert(tile.renderData === null);

        tile.renderData = renderDataPool.acquire();
        tile.renderData.init();

        var localOrigin = this.getLocalOriginOfTile(tile);

        var newGeometry = tile.createGeometry(tile.renderData.updateGeometryState(tile),
                                              localOrigin,
                                              wireframe.mode === "debug",
                                              tile.renderData.geometryInfo);

        tile.renderData.localOrigin = localOrigin;

        this._setTileGeometry(tile, newGeometry);
        this.updateTileTexture(tile);

        this.needsRender = true;
      };

      this.queryVisibleScaleRange = function(extent, minScale, maxScale, callback) {
        var query = visibleScaleRangeQueryPool.acquire();
        vec4d.set(extent, query.extent);

        if (minScale) {
          query.minScale = minScale;
        } else {
          query.minScale = -Number.MAX_VALUE;
        }

        if (maxScale != null) {
          query.maxScale = maxScale;
        } else {
          query.maxScale = Number.MAX_VALUE;
        }

        query.callback = callback;

        visibleScaleRangeQueryQueue.push(query);
        this.needsRender = true;
      };

      this._buildTexture = function (image) {
        var id = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, id);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        if (maxAnisotropy) {
          gl.texParameterf(gl.TEXTURE_2D, TEXTURE_MAX_ANISOTROPY_EXT, maxAnisotropy);
        }


        if(image) {
          //ToDo: try/catch is only a workaround for texture security (cors) error.
          try {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
          }
          catch(e) {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, bufferSize, bufferSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
            console.warn("TerrainRenderer: failed to execute 'texImage2D', cross-origin image may not be loaded.");
           }
        } else {
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, bufferSize, bufferSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        }

        // Always generate mipmaps on texture initialization, even if the
        // texture has not yet any data. This fixes potential issues on some
        // Intel HD and possibly AMD cards which can cause texture mip map
        // corruption when generating mipmaps after rendering to texture from
        // an FBO.
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.generateMipmap(gl.TEXTURE_2D);

        return id;
      };

      this._composeTexture = function(tex, scale, offset) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, tex);

        programs.blendLayers.uniform1f("scale", scale);
        programs.blendLayers.uniform2fv("offset", offset);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, vboQuad.getNum());
      };

      this._composeMapLayers = function(tile, layersInfo, upToLayerIdx, lastTextureIsTransparent, layerOpacities) {
        var lc = TerrainConst.LayerClass.MAP;

        if (!tile.renderData.texture) {
          tile.renderData.texture = this._buildTexture();
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, fboBlend);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tile.renderData.texture, 0);
        gl.viewport(0, 0, bufferSize, bufferSize);
        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.enable(gl.BLEND);
        gl.blendFuncSeparate(gl.ONE_MINUS_DST_ALPHA, gl.DST_ALPHA, gl.ONE_MINUS_DST_ALPHA, gl.ONE);

        programs.blendLayers.use();
        programs.blendLayers.uniform1i("tex", 0);

        vertexBufferLayout.enableVertexAttribArrays(gl, programs.blendLayers, false);
        vboQuad.bind();
        vboQuad.setPointers(programs.blendLayers);

        for (var layerIdx = 0; layerIdx <= upToLayerIdx; layerIdx++) {
          var layerInfo = layersInfo[layerIdx];

          var targetLayerInfo = null, offset, scale;
          if (layerInfo.data) {
            targetLayerInfo = layerInfo;
            offset = ZEROZERO;
            scale = 1;
          }
          else if (layerInfo.upsampleFromTile) {
            var usInfo = layerInfo.upsampleFromTile;
            targetLayerInfo = usInfo.tile.layerInfo[lc][layerIdx];
            offset = usInfo.offset;
            scale = usInfo.scale;
          }

          if (targetLayerInfo) {
            if(targetLayerInfo.data instanceof Image) {
              targetLayerInfo.data = this._buildTexture(targetLayerInfo.data);
            }
            programs.blendLayers.uniform1f("opacity", layerOpacities[layerIdx]);
            this._composeTexture(targetLayerInfo.data, scale, offset);
          }
        }

        if (lastTextureIsTransparent) {
          this._composeTexture(gridTex, 1, ZEROZERO);
        }

        //Enable mipmapping
        gl.bindTexture(gl.TEXTURE_2D, tile.renderData.texture);
        gl.generateMipmap(gl.TEXTURE_2D);

        //Reset render state
        vertexBufferLayout.disableVertexAttribArrays(gl, programs.blendLayers, false);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        var defaultState = gl.web3DDefaultState;
        gl.blendFunc(defaultState.blendFuncSrc, defaultState.blendFuncDst);
        gl.disable(gl.BLEND);

        this.numTileTexturesComposited++;
      };

      var tmpLayerOpacities = new Array(20); // 20 may not suffice, but thanks to JavaScript madness, the array will magically grow
      this.updateTileTexture = function(tile) {
        var layersInfo = tile.layerInfo[TerrainConst.LayerClass.MAP];

        for (var i = 0; i < layersInfo.length; i++) {
          layersInfo[i].pendingUpdates &= ~TerrainConst.TileUpdateTypes.UPDATE_TEXTURE;
        }

        if (!tile.renderData) {
          return;
        }

        var layerInfo, targetLayerInfo, usInfo;

        var lc = TerrainConst.LayerClass.MAP;
        var renderData = tile.renderData;

        // find out up to which layers we need to composite
        var renderUpToLayerIdx, numTextures = 0;
        for (renderUpToLayerIdx = 0; renderUpToLayerIdx < layersInfo.length; renderUpToLayerIdx++) {
          layerInfo = layersInfo[renderUpToLayerIdx];
          var layerView = tile.parentSurface.layerViewByIndex(renderUpToLayerIdx, lc);
          var opacity = layerView.layer.get("opacity");
          tmpLayerOpacities[renderUpToLayerIdx] = opacity;

          if (layerInfo.data || layerInfo.upsampleFromTile) {
            numTextures++;
            if (!layerView.isTransparent() && (opacity >= 1.0)) {
              break;
            }
          }
        }

        var lastTextureIsTransparent = false;
        if (renderUpToLayerIdx === layersInfo.length) {
          lastTextureIsTransparent = true;
          renderUpToLayerIdx--;
        }

        if (numTextures === 0) {
          renderData.textureReference = gridTex;
          vec2d.set2(0, 0, renderData.texOffset);
          renderData.texScale = 1;
        }
        else if ((numTextures === 1) && !lastTextureIsTransparent) {
          // special case: only one texture needed for rendering -> we reference the source data texture directly
          layerInfo = layersInfo[renderUpToLayerIdx];
          if (layerInfo.data) {
            targetLayerInfo = layerInfo;
            vec2d.set2(0, 0, renderData.texOffset);
            renderData.texScale = 1;
          }
          else {
            usInfo = layerInfo.upsampleFromTile;
            targetLayerInfo = usInfo.tile.layerInfo[lc][renderUpToLayerIdx];
            vec2d.set(usInfo.offset, renderData.texOffset);
            renderData.texScale = usInfo.scale;
          }

          if (targetLayerInfo) {
            if(targetLayerInfo.data instanceof Image) {
              targetLayerInfo.data = this._buildTexture(targetLayerInfo.data);
            }
            renderData.textureReference = targetLayerInfo.data;
          }
        }
        else {
          // general case: composite all textures into renderData.texture
          this._composeMapLayers(tile, layersInfo, renderUpToLayerIdx, lastTextureIsTransparent, tmpLayerOpacities);
          renderData.textureReference = null;
          vec2d.set2(0, 0, renderData.texOffset);
          renderData.texScale = 1;
        }

        this.needsRender = true;
      };

      this.releaseTileTexture = function(texture) {
          gl.deleteTexture(texture);
      };

      this.releaseTileTextures = function(tile) {
        var layersInfo = tile.layerInfo[TerrainConst.LayerClass.MAP];
        for (var layerIdx = 0; layerIdx < layersInfo.length; layerIdx++) {
          var layerInfo = layersInfo[layerIdx];
          if (layerInfo && layerInfo.data instanceof window.WebGLTexture) {
            gl.deleteTexture(layerInfo.data);
          }
        }
      };

      this.updateTileGeometryNeedsUpdate = function(tile) {
        return tile.renderData.updateGeometryState(tile).needsUpdate;
      };

      this._updateTileGeometry = function(tile) {
        var state = tile.renderData.geometryState;

        var layersInfo = tile.layerInfo[TerrainConst.LayerClass.ELEVATION];

        for (var i = 0; i < layersInfo.length; i++) {
          layersInfo[i].pendingUpdates &= ~TerrainConst.TileUpdateTypes.UPDATE_GEOMETRY;
        }

        if (state.needsUpdate) {
          if (tile.renderData.vbo) {
            this._releaseTileGeometry(tile);
          }

          var newGeometry = tile.createGeometry(state,
                                                tile.renderData.localOrigin,
                                                wireframe.mode === "debug",
                                                tile.renderData.geometryInfo);

          this._setTileGeometry(tile, newGeometry);

          return true;
        }

        return false;
      };

      this.updateTileGeometry = function(tile) {
        tile.renderData.updateGeometryState(tile);
        return this._updateTileGeometry(tile);
      };

      this.unloadTile = function(tile) {
        this._releaseTileGeometry(tile);
        if (tile.renderData.texture) {
          gl.deleteTexture(tile.renderData.texture);
        }
        renderDataPool.release(tile.renderData);
        tile.renderData = null;
      };

      this.getLocalOriginOfTile = function(tile) {
        if (tile.lij[0] >= LOCAL_ORIGIN_ADOPTION_LEVEL) {
          while (tile.lij[0] > LOCAL_ORIGIN_SRC_LEVEL) {
            tile = tile.parent;
          }

          return tile.centerAtSeaLevel;
        } else {
          if (manifold === "spherical") {
            return ZERO_VEC3;
          } else {
            while (tile.parent) {
              tile = tile.parent;
            }

            return tile.centerAtSeaLevel;
          }
        }
      };

      this.setVisibility = function(v) {
        visible = v;
        this.needsRender = true;
      };

      this.getStats = function() {
        return {
          numTilesRendered: numTilesRendered,
          numTilesCulled: numTilesCulled,
          numTrianglesRendered: numTrianglesRendered,
          numOriginsRendered: numOriginsRendered
        };
      };

      this.setMaxAnisotropy = function(newMaxAnisotropy) {
        if (afExt) {
          newMaxAnisotropy = Util.clamp(newMaxAnisotropy, 1, maxMaxAnisotropy);
          if (newMaxAnisotropy !== maxAnisotropy) {
            maxAnisotropy = newMaxAnisotropy;
            if (rootTiles) {
              TileUtils.traverseTilesPreorder(rootTiles, function(tile) {
                if (tile.renderData && tile.renderData.texture) {
                  gl.bindTexture(gl.TEXTURE_2D, tile.renderData.texture);
                  gl.texParameterf(gl.TEXTURE_2D, afExt.TEXTURE_MAX_ANISOTROPY_EXT, maxAnisotropy);
                }
              });
            }
          }
        }

        this.needsRender = true;
      };

      this.getMaxAnisotropy = function() {
        return maxAnisotropy;
      };

      this.setDisableRendering = function(disabled) {
        disableRendering = !!disabled;
        this.needsRender = true;
      };

       this.getOpacity = function() {
        return opacity;
      };

      this.getWireframeEnabled = function() {
        return wireframe.mode === "shader";
      };

      this.setWireframe = function(config) {
        if (!config || config === true) {
          config = {
            mode: config ? "shader" : "none"
          };
        }

        if (config.mode !== undefined && wireframe.mode !== config.mode) {
          var wasWireframeGeom = (wireframe.mode === "debug");
          var isWireframeGeom = (config.mode === "debug");

          wireframe.mode = config.mode;
          this._updatePrograms();

          if (wasWireframeGeom !== isWireframeGeom) {
            if (rootTiles) {
              TileUtils.traverseTilesPreorder(rootTiles, function(tile) {
                if (tile.renderData) {
                  if (tile.renderData.vbo) {
                    this._releaseTileGeometry(tile);
                  }

                  var newGeometry = tile.createGeometry(tile.renderData.updateGeometryState(tile),
                                                        tile.renderData.localOrigin,
                                                        isWireframeGeom,
                                                        tile.renderData.geometryInfo);

                  this._setTileGeometry(tile, newGeometry);
                }
              }.bind(this));
            }
          }

          this.needsRender = true;
        }

        for (var k in config) { // jshint ignore:line
          if (wireframe.hasOwnProperty(k)) {
            wireframe[k] = config[k];
          }

          this.needsRender = true;
        }
      };

      this.setOpacity = function(value) {
        opacity = value;
        this.needsRender = true;
      };

      this.setDrawSkirts = function(value) {
        drawSkirts = value;
        this.needsRender = true;
      };

      this.setCullBackFaces = function(value) {
        cullBackFaces = value;
        this.needsRender = true;
      };

      this.setRenderOrder = function(value) {
        renderOrder = value;
        this.needsRender = true;
      };

      this.setBorders = function(enabled) {
        if (drawBorders !== enabled) {
          drawBorders = enabled;

          if (wireframe.mode === "none") {
            wireframe.transitionTime = 0;
          }

          this._updatePrograms();
          this.needsRender = true;
        }
      };

      this.setFrontMostTransparent = function(enabled) {
        if (frontMostTransparent !== enabled) {
          frontMostTransparent = enabled;
          this.needsRender = true;
        }
      };

      function prepareScaleRangeQueries() {
        // Pick N scale range queries of the queue
        while (visibleScaleRangeQueries.length < visibleScaleRangeQueries.data.length &&
               visibleScaleRangeQueryQueue.length > 0) {
          var q = visibleScaleRangeQueryQueue.pop();
          visibleScaleRangeQueries.push(q);
        }

        visibleScaleRangeQueriesInvPtr = visibleScaleRangeQueries.length;
      }

      function processScaleRangeQueries() {
        // Iterate over popped queries past the end of the prealloc array as
        // long as they still have a result associated and resolve the result.
        // These are the visible tiles. Note that this relies on an implementation
        // detail of the PreallocArray.
        for (var i = 0; i < visibleScaleRangeQueries.length; i++) {
          var q = visibleScaleRangeQueries.data[i];
          visibleScaleRangeQueryPool.release(q);

          q.callback(i >= visibleScaleRangeQueriesInvPtr);
          q.callback = null;
        }

        visibleScaleRangeQueries.clear();
      }

      this.setNeedsRender = function() {
        this.needsRender = true;
        this.didRender = false;
      };

      this.resetNeedsRender = function() {
        if (this.didRender) {
          this.needsRender = visibleScaleRangeQueryQueue.length !== 0;
          this.didRender = false;
        }
      };

      function tileCompareFunc(a, b) {
        var ad = a.screenDepth;
        var bd = b.screenDepth;

        return ad < bd ? -renderOrder : (ad > bd ? renderOrder : 0);
      }

      function originCompareFunc(a, b) {
        if (a.tiles.length === 0) {
          return -renderOrder;
        }

        if (b.tiles.length === 0) {
          return renderOrder;
        }

        return tileCompareFunc(a.tiles.data[0], b.tiles.data[0]);
      }

      function subdivideWireframe(subdivision, levels) {
        if (levels === undefined) {
          levels = wireframe.subdivisionReduceLevels;
        }

        if (levels === 0) {
          return subdivision;
        }

        if (levels < 0) {
          return Math.floor((subdivision - 1) * (1 << (-levels))) + 1;
        } else {
          return Math.floor((subdivision - 1) / (1 << levels)) + 1;
        }
      }

      var tmpVpos = vec3d.create();

      this.isTransparent = function() {
        return    opacity < 1
               || ((wireframe.mode === "shader" || drawBorders) && (wireframe.wireOpacity < 1 || wireframe.surfaceOpacity < 1))
               || !gridTexImageData;
      };

      this.render = function(context){//pass, slot, camera, lightingData, shadowMap, ssaoHelper) {
        if (!initialized || disableRendering || !visible || !rootTiles) {
          return;
        }

        var needsTransparentSlot = this.isTransparent();

        var desiredSlot = needsTransparentSlot ? TRANSPARENT_SLOT : OPAQUE_SLOT;

        if (context.slot !== desiredSlot) {
          return;
        }

        perOriginTileData.clear();

        highestVisibileLODTile = null;

        this._renderCollectOrigins();

        if (renderOrder !== 0) {
          // Sort tiles within each origin first
          for (var i = 0; i < perOriginTileData.length; i++) {
            this._sortFrontToBack(perOriginTileData.data[i].tiles, tileCompareFunc);
          }

          // Sort origins based on closed tile in each origin
          this._sortFrontToBack(perOriginTileData, originCompareFunc);
        }

        var program, texturedRenderPass = false;
        var enableBlend = false;

        var pass = context.pass;
        var camera = context.camera;

        if (pass === "material") {
          enableBlend = needsTransparentSlot;

          if (needsTransparentSlot && frontMostTransparent) {
            var depthOnlyProgram = programs.depthOnly;

            depthOnlyProgram.use();
            vertexBufferLayout.enableVertexAttribArrays(gl, depthOnlyProgram, false);

            gl.colorMask(false, false, false, false);
            this._renderTilesDepthOnly(camera, gl, depthOnlyProgram);

            gl.colorMask(true, true, true, true);
            gl.depthFunc(gl.EQUAL);
            gl.depthMask(false);
          }

          program = programs.color;
          texturedRenderPass = true;

          program.use();
          program.uniform1f("opacity", opacity);

          if (enableBlend) {
            gl.enable(gl.BLEND);
          }

          if (!gl.web3DDefaultState.cullEnabled && cullBackFaces) {
            gl.enable(gl.CULL_FACE);
          } else if (gl.web3DDefaultState.cullEnabled && !cullBackFaces) {
            gl.disable(gl.CULL_FACE);
          }

          if (wireframe.mode === "shader" || drawBorders) {
            program.uniform1f("wireframe.width", wireframe.width);
            program.uniform1f("wireframe.falloff", Math.min(wireframe.width, wireframe.falloff));
            program.uniform1f("wireframe.wireOpacity", wireframe.wireOpacity * opacity);
            program.uniform1f("wireframe.surfaceOpacity", wireframe.surfaceOpacity * opacity);
            program.uniform4fv("wireframe.color", wireframe.color);

            program.uniform1f("wireframe.near", camera.near);
            program.uniform1f("wireframe.far", camera.far);

            if (wireframe.subdivision !== "geometry" && wireframe.subdivision !== "constant") {
              program.uniform1f("wireframe.subdivision", subdivideWireframe(wireframe.subdivision));
            }
          }
        } else if ( ((pass === "materialDepthShadowMap") && this.castShadows) || (pass === "materialDepth")) {
          program = (pass === "materialDepthShadowMap")?programs.depthShadowMap:programs.depth;
          program.use();
          program.uniformMatrix4fv("model", IDENTITY);

          tmpNearFar[0] = camera.near;
          tmpNearFar[1] = camera.far;

          program.uniform2fv("nearFar", tmpNearFar);
        } else if (pass === "materialNormal") {
          program = programs.normal;
          program.use();
        } else {
          return;
        }

        if (context.shadowMap) {
          context.shadowMap.bind(program);
        }
        if (context.ssaoHelper) {
          context.ssaoHelper.setUniforms(program);
        }

        vertexBufferLayout.enableVertexAttribArrays(gl, program, false);

        if (texturedRenderPass) {
          program.uniform1i("tex", FIRST_TEX_UNIT);
          program.uniform1i("overlayTex", FIRST_TEX_UNIT + 1);
        }

        program.uniformMatrix4fv("viewNormal", camera.viewInverseTransposeMatrix);
        program.uniformMatrix4fv("proj", camera.projectionMatrix);
        program.uniform3fv("lightDirection", context.lightingData.getLightDirection());

        var view = camera.viewMatrix;
        vec3d.set3(view[12], view[13], view[14], tmpVpos);
        program.uniform3fv("viewDirection", tmpVpos);

        numTilesRendered = 0;
        numTilesCulled = 0;
        numTrianglesRendered = 0;
        numOriginsRendered = 0;

        prepareScaleRangeQueries();

        for (i = 0; i < perOriginTileData.length; i++) {
          var data = perOriginTileData.data[i];

          program.uniform3fv("origin", data.origin);
          MaterialUtil.bindView(data.origin, view, program);

          if (context.shadowMap) {
            context.shadowMap.bindView(program, data.origin);
          }

          numOriginsRendered++;
          this._renderTiles(data.tiles, program, texturedRenderPass);
        }

        vertexBufferLayout.disableVertexAttribArrays(gl, program, false);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        
        if (enableBlend) {
          gl.disable(gl.BLEND);
        }

        if (needsTransparentSlot && frontMostTransparent) {
         gl.depthFunc(gl.LESS);
         gl.depthMask(true);
        }

        if (!gl.web3DDefaultState.cullEnabled && cullBackFaces) {
          gl.disable(gl.CULL_FACE);
        } else if (gl.web3DDefaultState.cullEnabled && !cullBackFaces) {
          gl.enable(gl.CULL_FACE);
        }

        processScaleRangeQueries();

        if (numTilesRendered > 0 && !loaded) {
          loaded = true;

          if (this.loaded) {
            this.loaded();
          }
        }

        return true;
      };

      this._renderCollectOrigins = function() {
        for (var i = 0; i < rootTiles.length; i++) {
          var rootTile = rootTiles[i];

          // Generate a root tile first
          var rootOrigin = perOriginTileData.next();

          rootOrigin.root = rootTile;

          if (manifold === "spherical") {
            rootOrigin.origin = ZERO_VEC3;
          } else {
            rootOrigin.origin = rootTile.centerAtSeaLevel;
          }

          rootOrigin.tiles.clear();

          this._renderCollectOriginsForRoot(rootOrigin);
        }
      };

      this._renderCollectOriginsForRoot = function(rootOrigin) {
        tileIterator.reset(rootOrigin.root);

        while (!tileIterator.done) {
          var tile = tileIterator.next();
          var data = tile.renderData;

          if (data && !tile.visible) {
            numTilesCulled++;
            tileIterator.skip();
            continue;
          }

          var current = perOriginTileData.peek();

          if (tile.lij[0] === LOCAL_ORIGIN_SRC_LEVEL) {
            // Replace empty origin if its not the root origin
            if (current === rootOrigin || current.tiles.length !== 0) {
              current = perOriginTileData.next();
              current.tiles.clear();
            }

            current.root = tile;
            current.origin = tile.centerAtSeaLevel;
          }

          if (data) {
            var level = tile.lij[0];

            if (level >= LOCAL_ORIGIN_ADOPTION_LEVEL) {
              perOriginTileData.peek().tiles.push(tile);
            } else {
              // Revert to root placement
              rootOrigin.tiles.push(tile);
            }

            if (highestVisibileLODTile === null || highestVisibileLODTile.lij[0] < level) {
              highestVisibileLODTile = tile;
            }

            tileIterator.skip();
          }
        }
      };

      this._sortFrontToBack = function(tiles, tileCompareFunc) {
        tiles.sort(tileCompareFunc);
      };

      function scaleQueriesForTile(tile) {
        var tileEx = tile.extent;
        var level = tile.lij[0];

        var i = 0;

        while (i < visibleScaleRangeQueriesInvPtr) {
          var q = visibleScaleRangeQueries.data[i];
          var queryEx = q.extent;

          if (level >= q.minScale && level <= q.maxScale &&
              queryEx[0] <= tileEx[2] && queryEx[2] >= tileEx[0] &&
              queryEx[1] <= tileEx[3] && queryEx[3] >= tileEx[1]) {
            // Tile is visible for this query, swap it to the end and pop
            visibleScaleRangeQueries.swap(i, visibleScaleRangeQueriesInvPtr - 1);
            visibleScaleRangeQueriesInvPtr--;
          } else {
            i++;
          }
        }
      }

      this._renderTilesDepthOnly = function(camera, gl, program) {
        var view = camera.viewMatrix;

        program.uniformMatrix4fv("proj", camera.projectionMatrix);

        for (var j = 0; j < perOriginTileData.length; j++) {
          var originData = perOriginTileData.data[j];

          program.uniform3fv("origin", originData.origin);
          MaterialUtil.bindView(originData.origin, view, program);

          for (var i = 0; i < originData.tiles.length; i++) {
            var tile = originData.tiles.data[i];
            var data = tile.renderData;

            data.vbo.bind();
            data.vbo.setPointers(program);

            var indexBuffer = data.ibo;
            indexBuffer.bind();

            var numIndices = indexBuffer.getNum();

            if (!drawSkirts) {
              numIndices = data.geometryInfo.numWithoutSkirtIndices;
            }

            gl.drawElements(gl.TRIANGLES, numIndices, indexBuffer.getType(), 0);
          }
        }
      };

      this._renderTiles = function(tiles, program, texturedRenderPass) {
        if (tiles.length === 0) {
          return;
        }

        var drawType = gl.TRIANGLES;

        if (wireframe.mode === "debug") {
          drawType = gl.LINES;
        }

        var isWireframeGeometry = (wireframe.subdivision === "geometry");
        var isWireframeConstant = (wireframe.subdivision === "constant");

        var hlod = highestVisibileLODTile;
        var wireframeBaseLevel;
        var wireframeBaseSubdivide;

        if (hlod) {
          wireframeBaseLevel = hlod.lij[0];
          wireframeBaseSubdivide = subdivideWireframe(hlod.renderData.geometryInfo.numVertsPerRow);
        } else {
          // This case should not really happen, if there are tiles to render
          // then there should be a highestVisibleLODTile. Just to be sure though.
          wireframeBaseLevel = 16;
          wireframeBaseSubdivide = 16;
        }

        for (var i = 0; i < tiles.length; i++) {
          var tile = tiles.data[i];
          var data = tile.renderData;
          data.vbo.bind();
          data.vbo.setPointers(program);

          var indexBuffer = data.ibo;
          indexBuffer.bind();

          if (texturedRenderPass) {
            program.uniform2fv("texOffset", data.texOffset);
            program.uniform1f("texScale", data.texScale);

            gl.activeTexture(gl.TEXTURE0 + FIRST_TEX_UNIT);

            var texture = data.textureReference || data.texture;
            gl.bindTexture(gl.TEXTURE_2D, texture);

            if (data.overlayTexId) {
              bindOverlayTexture(program, data);
            } else {
              program.uniform2fv("overlayTexOffset", OVL_TEX_OFFSET_DISABLE);
            }

            if ((wireframe.mode === "shader" || drawBorders) && (isWireframeGeometry || isWireframeConstant)) {
              if (isWireframeGeometry) {
                program.uniform1f("wireframe.subdivision", subdivideWireframe(data.geometryInfo.numVertsPerRow));
              } else {
                var subdivide = subdivideWireframe(wireframeBaseSubdivide, tile.lij[0] - wireframeBaseLevel);
                program.uniform1f("wireframe.subdivision", subdivide);
              }
            }
          }

          var numIndices = indexBuffer.getNum();

          if (!drawSkirts) {
            numIndices = data.geometryInfo.numWithoutSkirtIndices;
          }

          gl.drawElements(drawType, numIndices, indexBuffer.getType(), 0);

          tile.renderOrder = numTilesRendered;
          numTilesRendered++;
          numTrianglesRendered += numIndices / 3;

          scaleQueriesForTile(tile);
        }
      };

      var bindOverlayTexture = function(program, matParams) {
        var overlayTexId = matParams.overlayTexId;
        var overlayTex = overlayTextures[overlayTexId];
        if (!overlayTex) {
          overlayTex = stageTextureRep.aquire(overlayTexId);
          assert(overlayTex);
          overlayTextures[overlayTexId] = overlayTex;
        }
        program.uniform2fv("overlayTexOffset", matParams.overlayTexOffset);
        program.uniform1f("overlayTexScale", matParams.overlayTexScale);
        program.uniform1f("overlayOpacity", matParams.overlayOpacity);
        gl.activeTexture(gl.TEXTURE0 + FIRST_TEX_UNIT + 1);
        gl.bindTexture(gl.TEXTURE_2D, overlayTex);
      };

      var dir = vec3d.create();
      var pp0 = vec3d.create();
      var pp1 = vec3d.create();

      this.intersect = function(selector, p0, p1, point) {
        if (!rootTiles) {
          return;
        }

        if (selector.mode === "select" && this.isTransparent()) {
          return;
        }

        vec3d.subtract(p1, p0, dir);
        var minResult = selector.getMinResult();
        var maxResult = selector.getMaxResult();

        tileIterator.reset(rootTiles);

        while (!tileIterator.done) {
          var tile = tileIterator.next();

          if ((tile.renderData === null) || !tile.visible) {
            continue;
          }

          var geometry = tile.renderData.geometryInfo.geometry;
          var origin = tile.renderData.localOrigin;

          vec3d.subtract(p0, origin, pp0);
          vec3d.subtract(p1, origin, pp1);

          MaterialUtil.intersectTriangleGeometry(geometry, 0, undefined, point, p0, p1, pp0, pp1, undefined, selector.tolerance, function(distance, normal) {
            if (distance >= 0.0 && vec3d.dot(normal, dir) < 0) {
              var terrainTile;

              if (minResult.dist === undefined || distance < minResult.dist) {
                terrainTile = TileUtils.lij2str(tile.lij[0], tile.lij[1], tile.lij[2]);
                minResult.set(undefined, terrainTile, distance, normal, undefined);
                minResult.setIntersector("terrain");
              }

              if (maxResult.dist === undefined || distance > maxResult.dist) {
                terrainTile = TileUtils.lij2str(tile.lij[0], tile.lij[1], tile.lij[2]);
                maxResult.set(undefined, terrainTile, distance, normal, undefined);
                maxResult.setIntersector("terrain");
              }
            }
          });
        }
      };

      this._setTileGeometry = function(tile, geometryInfo) {
        var renderData = tile.renderData;
        var geometryData = geometryInfo.geometry.getData();
        var vboData = geometryData.getVertexAttr().terrain.data;
        renderData.vbo = new GLVBO(vboData, vertexBufferLayout, gl);
        var iboData = geometryData.getFaces()[0].indices.terrain;
        renderData.ibo = new GLIBO(iboData, gl);
        if (renderData.geometryInfo.geometry) {
          TileGeometryFactory.releaseGeometry(renderData.geometryInfo.geometry);
        }
        renderData.geometryInfo = geometryInfo;
        this.needsRender = true;
      };

      this._releaseTileGeometry = function(tile) {
        var renderData = tile.renderData;
        renderData.vbo.dispose();
        renderData.ibo.dispose();
        renderData.vbo = null;
        renderData.ibo = null;
        if (renderData.geometryInfo.geometry) {
          TileGeometryFactory.releaseGeometry(renderData.geometryInfo.geometry);
        }
        renderData.geometryInfo.geometry = null;
        this.needsRender = true;
      };
    };

    TerrainRenderer.TileRenderData = TileRenderData;
    return TerrainRenderer;
});
