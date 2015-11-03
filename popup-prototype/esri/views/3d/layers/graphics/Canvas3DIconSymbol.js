/* jshint forin:false */
define([
  "../../../../core/declare",
  "dojo/_base/lang",
  "dojo/when",

  "./Canvas3DSymbolBase", "./Canvas3DGraphic", "./Canvas3DDrapedGraphic", "./ElevationAligners", "./Canvas3DSymbolCommonCode",

  "../../../../core/urlUtils",
  "../../../../core/screenUtils",
  "../../../../config",

  "../../../../Color",
  "../../../../geometry/Polygon",

  "../../support/projectionUtils",
  "../../support/mathUtils",
  "../../lib/glMatrix",

  "../../webgl-engine/Stage",
  "../../webgl-engine/lib/Geometry",
  "../../webgl-engine/lib/GeometryUtil",
  "../../webgl-engine/lib/RenderGeometry",
  "../../webgl-engine/lib/Texture",
  "../../webgl-engine/materials/HUDMaterial"
], function(
  declare, lang, when,
  Canvas3DSymbolBase, Canvas3DGraphic, Canvas3DDrapedGraphic, ElevationAligners, Canvas3DSymbolCommonCode,
  urlUtils, screenUtils, esriConfig,
  esriColor, Polygon,
  projectionUtils, mathUtils, glMatrix,
  Stage, Geometry, GeometryUtil, RenderGeometry, Texture, HUDMaterial
) {
  var vec3d = glMatrix.vec3d;
  var mat4d = glMatrix.mat4d;

  var IDENTITYMAT4 = mat4d.identity();
  var UP_DIR = [0, 0, 1];
  var BLACK = [0, 0, 0, 1];
  var TRANSPARENT = [0, 0, 0, 0];
  var VALID_ANCHOR_STRINGS =
    ["center", "bottom", "top", "left", "right", "bottomLeft", "bottomRight", "topLeft", "topRight"];
  var DEFAULT_PRIMITIVE = "circle",
    DEFAULT_SIZE = 16,
    DEFAULT_OUTLINE_SIZE = 1.5;

  var PRIMITIVE_SDF_TEX_SIZE = 128,
    PRIMITIVE_SDF_SYMBOL_SIZE_RATIO = 0.5;

  var primitives = {
    PRIM_CIRCLE: "circle",
    PRIM_SQUARE: "square",
    PRIM_CROSS: "cross",
    PRIM_X: "x",
    PRIM_KITE: "kite"
  };

  var Canvas3DIconSymbol = declare([Canvas3DSymbolBase], {
    _prepareResources: function() {
      var symbol = this.symbol;
      var symbolSize = (symbol.size != null) ? symbol.size : DEFAULT_SIZE;
      this._size = null;
      this._symbolTextureRatio = 1;
      this._primitive = null;

      var idHint = this._getStageIdHint();

      if (this._isPropertyDriven("size") && symbolSize < 64) {
        // upscale texture res to be ready for bigger symbol sizes
        symbolSize = 64;
      }

      var resource = symbol.resource || { primitive: DEFAULT_PRIMITIVE };
      
      var matParams = {
          anchorPos: this._getAnchorPos(symbol),
      }

      // texture: either defined by user, or as a primitive
      var resourceURI = resource.href || resource.dataURI;
      if (resourceURI) {
        // user-defined resource
        matParams.color = this._getFillColor(symbol, null);
        matParams.outlineColor = this._getOutlineColor(symbol);
        matParams.outlineSize = this._getOutlineSize(symbol, null);
        matParams.textureIsSignedDistanceField = false;
        this._prepareImageResources(resourceURI, symbolSize, matParams, idHint);
      } else {
        // primitive
        var primitive = resource.primitive || DEFAULT_PRIMITIVE;
        var primitiveURI = "primitive:" + primitive;
        this._primitive = primitive;

        matParams.color = this._getFillColor(symbol, primitive);
        matParams.outlineColor = this._getOutlineColor(symbol);
        matParams.outlineSize = this._getOutlineSize(symbol, primitive);
        
        if (isOutlineOnly(primitive) && (matParams.outlineSize === 0)) {
          // don't draw outline-only primitives if outline size is 0
          this.reject();
          return;
        }

        this.texture = this._context.sharedResources.textures.acquire(primitiveURI, makeSignedDistanceFieldTexture);
        this._textureURI = primitiveURI;

        matParams.textureIsSignedDistanceField = true;
        matParams.textureId = this.texture.getId();
        this._createMaterialsAndAddToStage(matParams, this._context.stage, idHint);

        this._size = [symbolSize, symbolSize];
        this._symbolTextureRatio = 1/PRIMITIVE_SDF_SYMBOL_SIZE_RATIO;
        this.resolve();
      }
    },

    _getOutlineDefaultSize: function(primitive) {
      if (isOutlineOnly(primitive)) {
        // Symbols needs outline
        return DEFAULT_OUTLINE_SIZE;
      } else {
        // Symbol does not need outline
        return 0;
      }
    },

    _getOutlineSize: function(symbol, primitive) {
      if (symbol.outline) {
        if (symbol.outline.size != null) {
          // Outline size given
          return symbol.outline.size;
        } else {
          // Outline size unspecified
          return this._getOutlineDefaultSize(primitive);
        }
      } else {
        // No outline
        return this._getOutlineDefaultSize(primitive);
      }
    },

    _getOutlineColor: function(symbol) {
      var layerOpacity = this._getLayerOpacity();
      if (symbol.outline) {
        if (symbol.outline.color != null) {
          // Outline color given
          var c = esriColor.toUnitRGB(symbol.outline.color);
          var a = symbol.outline.color.a * layerOpacity;
          return [c[0], c[1], c[2], a];
        } else {
          // Outline color unspecified
          return [0,0,0,layerOpacity];
        }
      } else {
        // No outline
        return [0,0,0,layerOpacity];
      }
    },

    _getFillColor: function(symbol, primitive) {
      if (isOutlineOnly(primitive)) {
        // Primitive has no fill
        return TRANSPARENT;
      } else {
        // This function accesses this.symbol
        return this._getMaterialOpacityAndColor();
      }
    },

    _getAnchorPos: function(symbol) {
      return (VALID_ANCHOR_STRINGS.indexOf(symbol.anchor) > -1) ? symbol.anchor : "center";
    },

    _prepareImageResources: function(resourceURI, symbolSize, matParams, idHint) {
      if (resourceURI.indexOf("http") === 0 && location.protocol === "https:") {
        resourceURI = resourceURI.replace(/^http:/i, "https:");
      }

      var textureLoaded = function(stageTexture) {
        var texParams = stageTexture.params;

        var ratio  = texParams.width/texParams.height;
        if (symbolSize) {
          if(ratio > 1){
            this._size = [symbolSize, symbolSize / ratio];
          }
          else {
            this._size = [symbolSize * ratio, symbolSize];
          }
        } else {
          this._size = [texParams.width, texParams.height];
        }

        matParams.textureId = stageTexture.getId();
        this._createMaterialsAndAddToStage(matParams, this._context.stage, idHint);
        this.resolve();
      }.bind(this);

      var isSvgData = resourceURI.substring(0,14)==="data:image/svg";
      var isSvgUrl = resourceURI.substring(resourceURI.length-4, resourceURI.length)===".svg";
      var isSvg = isSvgData || isSvgUrl ;

      if (!isSvg) {
        when(this._context.sharedResources.textures.acquire(resourceURI),
          textureLoaded,
          function() { this.reject(); }.bind(this)
        );
        this._textureURI = resourceURI;
      }
      else
      {
        var svgImage = new Image();

        if (isSvgData) {
          svgImage.src = resourceURI;
        }
        else if (urlUtils.canUseXhr(resourceURI)) {
          var url = resourceURI;

          if (url.indexOf("//") === 0) {
            url = window.location.protocol + url;
          }

          if (!urlUtils.hasSameOrigin(url, window.location.href)) {
            svgImage.crossOrigin = "anonymous";
          }

          svgImage.src = resourceURI;
        }
        else {
          svgImage.src = esriConfig.request.proxyUrl + "?" + resourceURI;
        }

        svgImage.onerror = function() {
          this.reject();
        }.bind(this);
        svgImage.onload = function() {
          // to ensure correct uniform scaling without undesired borders (i.e. keep the fitting frame)
          // scaled svg dimensions need to be set in the same ratio as original
          var svgWidth = svgImage.width;
          var svgHeight = svgImage.height;
          var svgRatio = 1;
          if(svgWidth && svgHeight){
            svgRatio = svgWidth/svgHeight;
          }

          if(symbolSize != null){
            // symbols size is applied to the main (the bigger) axis of the resource

            if(svgRatio > 1){ //landscape
              svgWidth = symbolSize;
              svgHeight = symbolSize/svgRatio;
            }
            else { //portrait
              svgHeight = symbolSize;
              svgWidth = symbolSize*svgRatio;
            }
          }
          svgImage.setAttribute("width", svgWidth);
          svgImage.setAttribute("height", svgHeight);


          //round-trip using draw to canvas to prevent chrome bug
          //chrome bug: previous svg symbols are still seen on a glTexImage (probably missing clear in between)
          var myCanvas = document.createElement("canvas");
          myCanvas.width = svgImage.width;
          myCanvas.height = svgImage.height;
          var myCanvasContext = myCanvas.getContext("2d");
          myCanvasContext.drawImage(svgImage, 0, 0, svgImage.width, svgImage.height);
          var dataURL = myCanvas.toDataURL();

          when(this._context.sharedResources.textures.acquire(dataURL),
            textureLoaded,
            function() { this.reject(); }
          );
          this.textureURI = dataURL;
        }.bind(this);

        svgImage.onerror = function() {
          console.warn("Failed to create Icon primitive");
          this.reject();
        }.bind(this);
      }
    },

    _createMaterialsAndAddToStage: function(matParams, stage, idHint) {
      matParams.occlusionTest = false;
      this._drapedMaterial = new HUDMaterial(matParams, idHint + "_iconDraped");
      stage.add(Stage.ModelContentType.MATERIAL, this._drapedMaterial);
      matParams = lang.clone(matParams);
      matParams.occlusionTest = true;
      this._material = new HUDMaterial(matParams, idHint + "_icon");
      stage.add(Stage.ModelContentType.MATERIAL, this._material);
    },

    destroy: function() {
      if (this._material) {
        this._context.stage.remove(Stage.ModelContentType.MATERIAL, this._material.getId());
      }
      if (this._drapedMaterial) {
        this._context.stage.remove(Stage.ModelContentType.MATERIAL, this._drapedMaterial.getId());
      }
      if (this._textureURI) {
        this._context.sharedResources.textures.release(this._textureURI);
      }
    },

    createCanvas3DGraphic: function(graphic, renderingInfo, clippingArea) {
      var geometry = graphic.geometry;

      if (geometry.type === "extent") {
        geometry = Polygon.fromExtent(geometry);
      }

      if (geometry.type === "polyline") {
        geometry = Canvas3DSymbolCommonCode.placePointOnPolyline(geometry);
      } else if (geometry.type === "polygon") {
        geometry = Canvas3DSymbolCommonCode.placePointOnPolygon(geometry);
      } else if ((geometry.type !== "point")) {
        this._logWarning("unsupported geometry type for icon symbol: " + geometry.type);
        return null;
      }
      var idHint = "graphic" + graphic.id;

      var scaleFactor = 1;
      if (this._isPropertyDriven("size")) {
        // by current design, sizeInfo is always applied to the main sizeAxis (the bigger dimension of the icon)
        // i.e. sizeInfo axis is basically ignored wgen applied on Icons
        if (renderingInfo.size) {
          for (var i = 0; i < 3; i++) {
            if (renderingInfo.size[i]) {
              // values from Renderer are in pt -> convert to px
              renderingInfo.size[i] = screenUtils.pt2px(renderingInfo.size[i]);
            }
          }
          var sizeAxis = this._size[0]>this._size[1] ? this._size[0] : this._size[1];
          if (isFinite(renderingInfo.size[0])) {
            scaleFactor = renderingInfo.size[0]/sizeAxis;
          } else if (renderingInfo.size[0] === "symbolValue") {
            scaleFactor = 1;
          } else if (isFinite(renderingInfo.size[2])) {
            // height is size[2] (size[1] is depth -> ignore)
            scaleFactor = renderingInfo.size[2]/sizeAxis;
          }
        }
      }

      var drivenColor = this._getVertexOpacityAndColor(renderingInfo);

      scaleFactor *= this._symbolTextureRatio;
      var sizeScaled = [this._size[0]*scaleFactor,this._size[1]*scaleFactor];

      var elevationInfo = this._getGraphicElevationInfo(graphic);

      if (elevationInfo.mode === Canvas3DSymbolCommonCode.ELEV_MODES.ON_THE_GROUND) {
        return this._createAsOverlay(graphic, geometry, drivenColor, sizeScaled, elevationInfo, idHint, graphic.id, clippingArea);
      }
      else {
        return this._createAs3DShape(graphic, geometry, drivenColor, sizeScaled, elevationInfo, idHint, graphic.id, clippingArea);
      }
    },

    layerPropertyChanged: function(name, canvas3DGraphics, symbolLayerIdx) {
      if (name === "opacity") {
        var color = this._getFillColor(this.symbol, this._primitive);
        this._drapedMaterial.setParameterValues({color: color});
        this._material.setParameterValues({color: color});

        var outlineColor = this._getOutlineColor(this.symbol);
        this._drapedMaterial.setParameterValues({outlineColor: outlineColor});
        this._material.setParameterValues({outlineColor: outlineColor});
        return true;
      }
      else if (name === "elevationInfo") {
        var prevMode = this._elevationInfo.mode;
        this._updateElevationInfo();
        var newMode = this._elevationInfo.mode;

        // in case the symbol/graphics switch between 3D and draped display, we need to recreate the symbol:

        var MODES = Canvas3DSymbolCommonCode.ELEV_MODES;
        if ((prevMode === MODES.ON_THE_GROUND) && (newMode === MODES.ON_THE_GROUND)) {
          // if mode stays at onTheGround, no further actions are necessary (changes in offset/featureExpression
          // won't matter)
          return true;
        }
        if ((prevMode !== newMode) && ((prevMode === MODES.ON_THE_GROUND) || (newMode === MODES.ON_THE_GROUND))) {
          // if mode switches from or to onTheGround, symbol needs to be recreated
          return false;
        }

        // otherwise we can handle the change by setting the proper elevation aligner and recomputing the elevation.
        var elevationProvider = this._context.elevationProvider;
        var renderCoordsHelper = this._context.renderCoordsHelper;
        var mapCoordsHelper = this._context.mapCoordsHelper;
        var perObjectElevationAligner = ElevationAligners.perObjectElevationAligner;
        for (var id in canvas3DGraphics) {
          var canvas3DGraphicSet = canvas3DGraphics[id];
          var canvas3DGraphic = canvas3DGraphicSet._graphics[symbolLayerIdx];
          if (canvas3DGraphic) {
            var graphic = canvas3DGraphicSet.graphic;
            var elevationInfo = this._getGraphicElevationInfo(graphic);
            canvas3DGraphic.elevationAligner = (newMode === MODES.RELATIVE_TO_GROUND) ? perObjectElevationAligner : null;
            canvas3DGraphic.elevationInfo.set(elevationInfo);
            perObjectElevationAligner(canvas3DGraphic, elevationProvider, renderCoordsHelper, mapCoordsHelper);
          }
        }
        return true;
      }
      return false;
    },

    setDrawOrder: function(drawOrder, dirtyMaterials) {
      // override implementation from Canvas3DSymbolBase due to the need for a separate material for draped Icons
      if (this._drapedMaterial) {
        this._drapedMaterial.setRenderPriority(drawOrder);
        dirtyMaterials[this._drapedMaterial.getId()] = true;
      }
    },

    // Icon symbol has a special default case for elevation mode and offset, therefore we override the
    // corresponding methods
    _defaultElevationInfoNoZ: {
      mode: Canvas3DSymbolCommonCode.ELEV_MODES.RELATIVE_TO_GROUND,
      offset: 0
    },
    _getGraphicElevationInfo: function(graphic) {
      var elevationInfo = this.inherited(arguments);

      // to avoid flickering issues, lift icon 1m above the ground if there is no offset/z-value
      if ((elevationInfo.mode === Canvas3DSymbolCommonCode.ELEV_MODES.RELATIVE_TO_GROUND) &&
        (elevationInfo.offset === 0) &&
        !graphic.geometry.get("hasZ"))
      {
        elevationInfo.offset = 1 / this._context.mapCoordsHelper.mapUnitInMeters;
      }
      return elevationInfo;
    },

    _createAs3DShape: function(graphic, geometry, color, sizeScaled, elevationInfo, idHint, graphicId) {
      var geometryData = GeometryUtil.createPointGeometry(UP_DIR, null, color, sizeScaled);

      var stageGeometry = new Geometry(geometryData, idHint);
      var stageGeometries = [stageGeometry];
      var layerId = this._context.layer.get("id");
      var stageObject = Canvas3DSymbolCommonCode.createStageObjectForPoint.call(this, geometry, stageGeometries,
            [[this._material]], null, null, elevationInfo, idHint, layerId, graphicId);
      if (stageObject === null) {
        return null;
      }

      var elevationAligner = null;
      if (elevationInfo.mode === Canvas3DSymbolCommonCode.ELEV_MODES.RELATIVE_TO_GROUND) {
        elevationAligner = ElevationAligners.perObjectElevationAligner;
      }

      var canvas3DGraphic = new Canvas3DGraphic(this, stageObject, stageGeometries, null, null,
        elevationAligner, elevationInfo);
      canvas3DGraphic.getScreenSize = (function(sizeX, sizeY) {
        return function() {
          return [sizeX, sizeY];
        };
      })(sizeScaled[0]/this._symbolTextureRatio, sizeScaled[1]/this._symbolTextureRatio);
      Canvas3DSymbolCommonCode.extendPointGraphicElevationInfo(canvas3DGraphic, geometry, this._context.elevationProvider);
      return canvas3DGraphic;
    },

    _createAsOverlay: function(graphic, geometry, color, sizeScaled, elevationInfo, idHint, graphicId) {
      this._drapedMaterial.setRenderPriority(this._symbolLayerOrder);

      // SR transformation
      var pos = vec3d.create();
      projectionUtils.pointToVector(geometry, pos, this._context.overlaySR);
      pos[2] = this._getDrapedZ();

      // Perform clipping
      var clippingExtent = this._context.clippingExtent;
      if (clippingExtent && !Canvas3DSymbolCommonCode.pointInBox2D(pos, clippingExtent)) {
        return null;
      }

      var drapedGeoData = GeometryUtil.createPointGeometry(UP_DIR, pos, color, sizeScaled, true);
      var drapedRG = new RenderGeometry(drapedGeoData);
      drapedRG.material = this._drapedMaterial;
      drapedRG.center = pos;
      drapedRG.bsRadius = 0;
      drapedRG.transformation = IDENTITYMAT4;
      drapedRG.name = idHint;
      drapedRG.uniqueName = idHint + "#" + drapedGeoData.id;
      var canvas3DDrapedGraphic = new Canvas3DDrapedGraphic(this, [drapedRG], null, null);
            canvas3DDrapedGraphic.getScreenSize = (function(sizeX, sizeY) {
        return function() {
          return [sizeX, sizeY];
        };
      })(sizeScaled[0]/this._symbolTextureRatio, sizeScaled[1]/this._symbolTextureRatio);
      return canvas3DDrapedGraphic;
    }
  });

  Canvas3DIconSymbol.VALID_ANCHOR_STRINGS = VALID_ANCHOR_STRINGS;
  
  function isOutlineOnly(primitive) {
    return (primitive ==="cross" || primitive === "x");
  }

  function makeSignedDistanceFieldTexture(prim) {
    var data,
      texSize = PRIMITIVE_SDF_TEX_SIZE,
      symbolSize = texSize*PRIMITIVE_SDF_SYMBOL_SIZE_RATIO;

    if (prim.substring(0, 10) === "primitive:") {
      prim = prim.substring(10);
    }

    switch (prim) {
      case primitives.PRIM_CIRCLE:
          data = computeSignedDistancefieldCicle(texSize, symbolSize);
        break;

      case primitives.PRIM_SQUARE:
          data = computeSignedDistancefieldSquare(texSize, symbolSize, false);
        break;

      case primitives.PRIM_KITE:
          data = computeSignedDistancefieldSquare(texSize, symbolSize, true);
        break;

      case primitives.PRIM_CROSS:
          data = computeSignedDistancefieldCrossAndX(texSize, symbolSize, false);
        break;

      case primitives.PRIM_X:
          data = computeSignedDistancefieldCrossAndX(texSize, symbolSize, true);
        break;
    }

    return new Texture(data, "sdf_" + prim, {
      mipmap : false,
      wrapClamp : true,
      width : PRIMITIVE_SDF_TEX_SIZE,
      height : PRIMITIVE_SDF_TEX_SIZE,
      components : 4
    });
  }
  
  var bit_shift = [256.0*256.0*256.0, 256.0*256.0, 256.0, 1.0];
  var bit_mask  = [0.0, 1.0/256.0, 1.0/256.0, 1.0/256.0];
  var bit_shift_inv = [1.0/(256.0*256.0*256.0), 1.0/(256.0*256.0), 1.0/256.0, 1.0];

  function fract(x) {
    return x - Math.floor(x);
  }

  /** Writes a float in [0,1) to a RGBA buffer */
  function packFloat(f, buffer, offset) {
    // Limit to [0,1)
    f = mathUtils.clamp(f, 0, 0.9999991);

    var res0 = fract(f * bit_shift[0]);
    var res1 = fract(f * bit_shift[1]);
    var res2 = fract(f * bit_shift[2]);
    var res3 = fract(f * bit_shift[3]);

    buffer[offset+0] = 256 * (res0 - res0 * bit_mask[0]);
    buffer[offset+1] = 256 * (res1 - res0 * bit_mask[1]);
    buffer[offset+2] = 256 * (res2 - res1 * bit_mask[2]);
    buffer[offset+3] = 256 * (res3 - res2 * bit_mask[3]);
  }

  /** Reads a float packed by packFloat() */
  function unpackFloat(buffer, offset) {
    var tex0 = buffer[offset+0] / 256;
    var tex1 = buffer[offset+1] / 256;
    var tex2 = buffer[offset+2] / 256;
    var tex3 = buffer[offset+3] / 256;

    var res = 0;
    res += tex0 * bit_shift_inv[0];
    res += tex1 * bit_shift_inv[1];
    res += tex2 * bit_shift_inv[2];
    res += tex3 * bit_shift_inv[3];

    return res;
  }

  function computeSignedDistancefieldCicle(texSize, symbolSize) {
    var s = texSize;
    
    var data = new Uint8Array(4 * s * s);
    var center = s / 2 - 0.5;
    var r = symbolSize/2;  
    
    for(var y = 0; y < s; y++) {
      for(var x = 0; x < s; x++) {
        var idx = x + s * y;

        var dx = x - center;
        var dy = y - center;
        var d  = Math.sqrt(dx*dx + dy*dy) - r;

        // Transform distance to [0,1]
        d = d/texSize + 0.5;

        // Encode distance to RGBA
        packFloat(d, data, 4*idx);
      }
    }

    return data;
  }

  function computeSignedDistancefieldSquare(texSize, symbolSize, rotate45) {
    if (rotate45) {
      // if symbol is rotated (-> kite), adjust size such that the diagonal of the square is equal to the
      // symbol width
      symbolSize /= Math.SQRT2;
    }
    var data = new Uint8Array(4 * texSize * texSize);
    for (var y = 0; y < texSize; y++) {
      for (var x = 0; x < texSize; x++) {
        var xx = x - 0.5*(texSize-0.5),
          yy = y - 0.5*(texSize-0.5),
          idx = y*texSize + x;
        if (rotate45) {
          // rotate coordinates by 45 degrees (see http://math.stackexchange.com/a/383343)
          var xxx = (xx + yy) / Math.SQRT2;
          yy = (yy - xx) / Math.SQRT2;
          xx = xxx;
        }
        var d = Math.max(Math.abs(xx), Math.abs(yy)) - 0.5*symbolSize;

        // Transform distance to [0,1]
        d = d/texSize + 0.5;

        // Encode distance to RGBA
        packFloat(d, data, 4*idx);
      }
    }
    return data;
  }

  function computeSignedDistancefieldCrossAndX(texSize, symbolSize, rotate45) {
    if (rotate45) {
      // if symbol is rotated (-> kite), adjust size such that cross covers the diagonal
      symbolSize *= Math.SQRT2;
    }
    var ss2 = 0.5*symbolSize;
    var data = new Uint8Array(4 * texSize * texSize);
    for (var y = 0; y < texSize; y++) {
      for (var x = 0; x < texSize; x++) {
        var xx = x - 0.5*texSize - 0.5,
          yy = y - 0.5*texSize - 0.5,
          idx = y*texSize + x;
        if (rotate45) {
          // rotate coordinates by 45 degrees (see http://math.stackexchange.com/a/383343)
          var xxx = (xx + yy) / Math.SQRT2;
          yy = (yy - xx) / Math.SQRT2;
          xx = xxx;
        }
        xx = Math.abs(xx);
        yy = Math.abs(yy);
        var dist;
        if (xx > yy) {
          dist = (xx > ss2) ? Math.sqrt((xx-ss2)*(xx-ss2) + yy*yy) : yy;
        }
        else {
          dist = (yy > ss2) ? Math.sqrt(xx*xx + (yy-ss2)*(yy-ss2)) : xx;
        }
        // Transform distance to [0,1]
        dist = dist/texSize + 0.5;

        // Encode distance to RGBA
        packFloat(dist, data, 4*idx);
      }
    }
    return data;
  }

  return Canvas3DIconSymbol;
});
