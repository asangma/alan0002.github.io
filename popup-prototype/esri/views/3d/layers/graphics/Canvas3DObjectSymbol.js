/* jshint forin:false */
define([
  "../../../../core/declare",
  "../../../../Color",

  "./Canvas3DSymbolBase", "./Canvas3DGraphic", "./ElevationAligners", "./Canvas3DSymbolCommonCode",

  "../i3s/I3SSymbolLoader",

  "../../lib/glMatrix",

  "../../webgl-engine/Stage",
  "../../webgl-engine/lib/Geometry",
  "../../webgl-engine/lib/GeometryUtil",
  "../../webgl-engine/materials/Material",
  "../../webgl-engine/lib/Util"

], function(
  declare, esriColor,
  Canvas3DSymbolBase, Canvas3DGraphic, ElevationAligners, Canvas3DSymbolCommonCode,
  I3SSymbolLoader,
  glMatrix,
  Stage, Geometry, GeometryUtil, Material, Util
) {

  var assert = Util.assert;
  var mat4d = glMatrix.mat4d;
  var vec3d = glMatrix.vec3d;

  var ONEONEONE = [1, 1, 1];
  var VERTEX_COLOR_AMBIENT = ONEONEONE;
  var VERTEX_COLOR_DIFFUSE = ONEONEONE;
  var DEFAULT_SCALE = [10, 10, 10];


  var STAGE_RESOURCE_TYPES = [Stage.ModelContentType.MATERIAL, Stage.ModelContentType.TEXTURE,
    Stage.ModelContentType.GEOMETRY];

  var Canvas3DObjectSymbol = declare([Canvas3DSymbolBase], {
    _prepareResources: function() {
      var symbol = this.symbol;
      var idHint = this._getStageIdHint();

      if (symbol.resource && symbol.resource.href) {
        var resourceURI = symbol.resource.href;
        if (resourceURI && resourceURI.indexOf("http") === 0 && location.protocol === "https:") {
          resourceURI = resourceURI.replace(/^http:/i, "https:");
        }
        this._prepareModelResources(resourceURI, idHint);
      }
      else {
        var primitive = symbol.resource ? symbol.resource.primitive : "sphere";
        this._preparePrimitiveResources(primitive, idHint);
      }
    },

    _computeSymbolScale : function(symbol, boundingBox) {
        var size = [symbol.width, symbol.depth, symbol.height];
        if (size[0] || size[1] || size[2]) {
          // compute axes scales such that the first of (width, depth, height) determines scale for undefined axes
          var scale = new Array(3);
          var refScale = 1;
          // convert size to scale
          for (var axis = 2; axis >= 0; axis--) {
            var val = size[axis];
            if (val) {
              refScale = val / (boundingBox[axis + 3] - boundingBox[axis]);
              scale[axis] = refScale;
            }
          }
          // fill in undefined scales
          for (axis = 2; axis >= 0; axis--) {
            if (!scale[axis]) {
              scale[axis] = refScale;
            }
          }

          return scale;
        }
        else {
          return null;
        }      
    },

    _preparePrimitiveResources: function(primitive, idHint) {
      var symbol = this.symbol;

      if (primitive === "sphere") {
        this._geometryData = GeometryUtil.createPolySphereGeometry(0.5, 2, true);
        this._geometryOrigin = "center";
      }
      else if (primitive === "cube") {
        this._geometryData = GeometryUtil.createBoxGeometry(1.0);
        this._geometryOrigin = "center";
      }
      else if (primitive === "cylinder") {
        this._geometryData = GeometryUtil.createCylinderGeometry(1, 0.5, 16, [0, 0, 1], [0, 0, 0.5]);
        this._geometryOrigin = "bottom";
      }
      else if (primitive === "cone") {
        if(symbol.height < 0) {
          this._geometryData = GeometryUtil.createConeGeometry(1.0, 0.5, 15, true);
          symbol.height = -symbol.height;
        } else {
          this._geometryData = GeometryUtil.createConeGeometry(1.0, 0.5, 15, false);
        }
        GeometryUtil.cgToGIS(this._geometryData);
        this._geometryOrigin = "bottom";
      }
      else if (primitive === "tetrahedron") {
        this._geometryData = GeometryUtil.createTetrahedronGeometry(1.0);
        GeometryUtil.cgToGIS(this._geometryData);
        this._geometryOrigin = "bottom";
      }
      else if (primitive === "diamond") {
        this._geometryData = GeometryUtil.createDiamondGeometry(1.0);
        GeometryUtil.cgToGIS(this._geometryData);
        this._geometryOrigin = "center";
      }
      else {
        console.warn("Unknown object symbol primitive: " + primitive);
        this.reject();
        return;
      }

      this._geometry = new Geometry(this._geometryData, idHint);
      this._context.stage.add(Stage.ModelContentType.GEOMETRY, this._geometry);

      var boundingBox = [-0.5, -0.5, -0.5, 0.5, 0.5, 0.5];
      this._symbolScale = this._computeSymbolScale(symbol, boundingBox);
      this._boundingBox = boundingBox;

      var opacity = this._getMaterialOpacity();

      var matParams = {
        //specular: [0.2, 0.2, 0.2],
        specular: [0, 0, 0],
        shininess: 3,
        opacity: opacity,
        transparent: (opacity < 1) || this._isPropertyDriven("opacity"),
        instanced: this._hasPerInstanceColor() ? ["transformation", "color"] : ["transformation"]
      };

      if (this._isPropertyDriven("color")) {
        matParams.ambient = VERTEX_COLOR_AMBIENT;
        matParams.diffuse = VERTEX_COLOR_DIFFUSE;
      }
      else {
        var color = symbol.material ? esriColor.toUnitRGB(symbol.material.color) : ONEONEONE;
        matParams.ambient = color;//color.map(function(v) { return v/1.5; });
        matParams.diffuse = color;
      }
      
      this._material = new Material(matParams, idHint + "_objectmat");
      this._context.stage.add(Stage.ModelContentType.MATERIAL, this._material);
      this.resolve();
    },

    _prepareModelResources: function(url, idHint) {
      var symbolLoadOptions = {
        materialParamsMixin: {
          instanced: this._hasPerInstanceColor() ? ["transformation", "color"] : ["transformation"]
        },
        idHint: idHint
      };
      var symbolLoader = new I3SSymbolLoader(this._context.streamDataSupplier);
      symbolLoader.fetchSymbol(url, symbolLoadOptions).then(function(result) {
        // add resources to stage;
        var stageResources = result.stageResources;
        var stage = this._context.stage;
        var symbolMaterial = this.symbol.material;

        var colorOverride;
        if (this._isPropertyDriven("color")) {
          // color defined by colorInfo (visualVariables) -> color will be specified per instance, override material color to white
          colorOverride = { ambient: VERTEX_COLOR_AMBIENT, diffuse: VERTEX_COLOR_DIFFUSE};
        }
        else if (symbolMaterial && symbolMaterial.color) {
          // color defined by symbol -> override material color with symbol color
          var color = esriColor.toUnitRGB(symbolMaterial.color);
          colorOverride = {
            ambient: color.map(function(v) { return v/1.5; }),
            diffuse: color
          };
        }

        var opacityOverride = this._computeModelOpacityOverride();

        result.originalMaterialOpacities = new Array(stageResources[Stage.ModelContentType.MATERIAL].length);
        stageResources[Stage.ModelContentType.MATERIAL].forEach(function(material, idx) {
          var matParams = material.getParameterValues();
          result.originalMaterialOpacities[idx] = matParams.opacity;
          if (colorOverride) {
            material.setParameterValues(colorOverride);
          }
          if (opacityOverride.overwrite) {
            material.setParameterValues({opacity: opacityOverride.overwrite, transparent: opacityOverride.blendingRequired});
          }
          else if (opacityOverride.multiply != null) {
            matParams.opacity *= opacityOverride.multiply;
            matParams.transparent = matParams.opacity < 1;
            material.setParameterValues({opacity: matParams.opacity, transparent: matParams.transparent});
          }
        });

        STAGE_RESOURCE_TYPES.forEach(function(type) {
          var objs = stageResources[type];
          for (var i=0; objs && i < objs.length; i++) {
            stage.add(type, objs[i]);
          }
        });

        var geometries = stageResources[Stage.ModelContentType.GEOMETRY];
        var geoTransformations = result.geometryTransformations;

        // compute bounding box of all geometries
        var boundingBox = [Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE,
          -Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE];
        var p0 = [0, 0, 0], p1 = [0, 0, 0];
        for (var geoIdx = 0; geoIdx < geometries.length; geoIdx++) {
          var geometry = geometries[geoIdx];
          for ( var j = 0, num = geometry.getNumGroups(); j < num; ++j) {
            var boundingInfo = geometry.getBoundingInfo(j);
            mat4d.multiplyVec3(geoTransformations[geoIdx], boundingInfo.getBBMin(), p0);
            mat4d.multiplyVec3(geoTransformations[geoIdx], boundingInfo.getBBMax(), p1);
            for ( var k = 0; k < 3; ++k) {
              if (p0[k] > p1[k]) {
                // geo transformation could still have contained negative scale values -> ensure that min is min and max is max
                var tmp = p0[k];
                p0[k] = p1[k];
                p1[k] = tmp;
              }
              boundingBox[k] = Math.min(boundingBox[k], p0[k]);
              boundingBox[k+3] = Math.max(boundingBox[k+3], p1[k]);
            }
          }
        }
        this._boundingBox = boundingBox;

        var symbol = this.symbol;
        
        this._symbolScale = this._computeSymbolScale(symbol, boundingBox);

        vec3d.scale(result.pivotOffset, -1);
        var numTrafos = geoTransformations.length;
        for (var trafoIdx = 0; trafoIdx < numTrafos; trafoIdx++) {
          mat4d.translate(geoTransformations[trafoIdx], result.pivotOffset);
        }
        vec3d.scale(result.pivotOffset, -1);

        this._i3sModel = result;
        this.resolve();
      }.bind(this), function() { this.reject(); }.bind(this));
    },

    _computeModelOpacityOverride: function() {
      // this function determines if and how the opacity value of the original materials needs to be overridden

      var result = {
        overwrite: null,
        blendingRequired: false,
        multiply: null
      };

      var materialOpacity = this._getMaterialOpacity();
      if (this._isPropertyDriven("opacity")) {
        // opacity defined by opacityInfo in visualVariables -> opacity will be specified per instance, override
        // material opacity to match layer opacity
        result.overwrite = materialOpacity;
        result.blendingRequired = true;
      }
      else if (this.symbol.material && (this.symbol.material.transparency !== undefined)) {
        // opacity defined by symbol -> override material opacity with symbol opacity
        result.overwrite = materialOpacity;
        result.blendingRequired = result.overwrite < 1;
      }
      else {
        // if opacity isn't overridden by symbol or opacityInfo, we still need to multiply it with the layer opacity
        if (materialOpacity < 1) {
          result.multiply = materialOpacity;
          result.blendingRequired = true;
        }
      }

      return result;
    },

    destroy: function() {
      var stage = this._context.stage;
      if (this._i3sModel) {
        var stageResources = this._i3sModel.stageResources;
        STAGE_RESOURCE_TYPES.forEach(function(type) {
          var objs = stageResources[type];
          for (var i=0; objs && i < objs.length; i++) {
            stage.remove(type, objs[i].getId());
          }
        });
      }
      else {
        if (this._material) {
          stage.remove(Stage.ModelContentType.MATERIAL, this._material.getId());
        }
        if (this._geometry) {
          stage.remove(Stage.ModelContentType.GEOMETRY, this._geometry.getId());
        }
      }
    },

    createCanvas3DGraphic: function(graphic, renderingInfo) {
      var geometry = graphic.geometry;

      if (geometry.type === "polyline") {
        geometry = Canvas3DSymbolCommonCode.placePointOnPolyline(geometry);
      }
      else if (geometry.type === "polygon") {
        geometry = Canvas3DSymbolCommonCode.placePointOnPolygon(geometry);
      }
      else if (geometry.type === "extent") {
        geometry = geometry.get("center");
      }
      else if ((geometry.type !== "point")) {
        this._logWarning("unsupported geometry type for object symbol: " + geometry.type);
        return null;
      }
      var idHint = "graphic"+graphic.id;

      var elevationInfo = this._getGraphicElevationInfo(graphic);

      return this._createAs3DShape(graphic, geometry, renderingInfo, elevationInfo, idHint, graphic.id);
    },

    layerPropertyChanged: function(name, canvas3DGraphics, symbolLayerIdx) {
      if (name === "opacity") {
        if (this._i3sModel) {
          var opacityOverride = this._computeModelOpacityOverride();
          this._i3sModel.stageResources[Stage.ModelContentType.MATERIAL].forEach(function(material, idx) {
            if (opacityOverride.overwrite) {
              material.setParameterValues({opacity: opacityOverride.overwrite, transparent: opacityOverride.blendingRequired });
            }
            else {
              var opacity = this._i3sModel.originalMaterialOpacities[idx];
              if (opacityOverride.multiply != null) {
                opacity *= opacityOverride.multiply;
              }
              material.setParameterValues({opacity: opacity, transparent: opacity < 1});
            }
          }.bind(this));
        }
        else {
          var opacity = this._getMaterialOpacity();
          this._material.setParameterValues({opacity: opacity, transparent: opacity < 1 || this._isPropertyDriven("opacity")});
        }
        return true;
      }
      else if (name === "elevationInfo") {
        this._updateElevationInfo();
        var elevationProvider = this._context.elevationProvider;
        var renderCoordsHelper = this._context.renderCoordsHelper;
        var mapCoordsHelper = this._context.mapCoordsHelper;
        var perObjectElevationAligner = ElevationAligners.perObjectElevationAligner;
        var ABSOLUTE_HEIGHT = Canvas3DSymbolCommonCode.ELEV_MODES.ABSOLUTE_HEIGHT;
        for (var id in canvas3DGraphics) {
          var canvas3DGraphicSet = canvas3DGraphics[id];
          var canvas3DGraphic = canvas3DGraphicSet._graphics[symbolLayerIdx];
          if (canvas3DGraphic) {
            var graphic = canvas3DGraphicSet.graphic;
            var elevationInfo = this._getGraphicElevationInfo(graphic);
            canvas3DGraphic.elevationAligner =  (elevationInfo.mode !== ABSOLUTE_HEIGHT) ? perObjectElevationAligner : null;
            canvas3DGraphic.elevationInfo.set(elevationInfo);
            perObjectElevationAligner(canvas3DGraphic, elevationProvider, renderCoordsHelper, mapCoordsHelper);
          }
        }
        return true;
      }
      return false;
    },
    
    _createAs3DShape: function(graphic, geometry, renderingInfo, elevationInfo, idHint, graphicId) {
      var stageObject;

      var instanceParameters =  this._hasPerInstanceColor() ?
        { color: this._mixinColorAndOpacity(renderingInfo.color, renderingInfo.opacity) }:
        null;

      var scale = this._computeObjectScale(renderingInfo, !this._i3sModel);

      var layerId = this._context.layer.get("id");
      
      if (this._i3sModel) {
        var geos = this._i3sModel.stageResources[Stage.ModelContentType.GEOMETRY];
        var mats = this._i3sModel.materialsByComponent;
        var trafos = this._i3sModel.geometryTransformations;

        stageObject = Canvas3DSymbolCommonCode.createStageObjectForPoint.call(this, geometry, null,
          null, null, null, elevationInfo, idHint, layerId, graphicId);

        if (stageObject === null) {
          return null;
        }

        for (var geoIdx = 0; geoIdx < geos.length; geoIdx++) {
          var transformation = trafos[geoIdx];
          if (scale) {
            var newTrafo = mat4d.identity();
            mat4d.scale(newTrafo, scale);
            mat4d.multiply(newTrafo, transformation);
            transformation = newTrafo;
          }
          var materialForEachGroup = mats[geoIdx];
          var numGroups = materialForEachGroup.length;
          var instanceParameterForEachGroup = new Array(numGroups);
          for (var groupIdx = 0; groupIdx < numGroups; groupIdx++) {
            instanceParameterForEachGroup[groupIdx] = instanceParameters;
          }
          stageObject.addGeometry(geos[geoIdx], materialForEachGroup, transformation, instanceParameterForEachGroup);
        }
      }
      else {
        var symbol = this.symbol;

        var translation;
        if ((symbol.anchor === "bottom") && (this._geometryOrigin === "center")) {
          translation = [0, 0, 0.5];
        }
        else if ((symbol.anchor === "center") && (this._geometryOrigin === "bottom")) {
          translation = [0, 0, -0.5];
        }

        var geoTrafo = mat4d.identity();
        mat4d.scale(geoTrafo, scale);
        if (translation) {
          mat4d.translate(geoTrafo, translation);
        }

        stageObject = Canvas3DSymbolCommonCode.createStageObjectForPoint.call(this, geometry, [this._geometry],
          [[this._material]], [geoTrafo], [instanceParameters], elevationInfo, idHint, layerId, graphicId);
      }
      
      if (stageObject === null) {
        return null;
      }

      stageObject.setCastShadow(true);

      var elevationAligner = null;   
      if (elevationInfo.mode !== Canvas3DSymbolCommonCode.ELEV_MODES.ABSOLUTE_HEIGHT) {
        elevationAligner = ElevationAligners.perObjectElevationAligner;
      } 

      var canvas3DGraphic = new Canvas3DGraphic(this, stageObject, null, null, null, elevationAligner, elevationInfo,
        Canvas3DGraphic.VisibilityModes.REMOVE_OBJECT);

      Canvas3DSymbolCommonCode.extendPointGraphicElevationInfo(canvas3DGraphic, geometry, this._context.elevationProvider);

      return canvas3DGraphic;
    },

    _computeObjectScale: function(renderingInfo, forceDefault) {
      var scale;

      if (renderingInfo.size && this._isPropertyDriven("size")) {
        var bb = this._boundingBox;
        var sizeInfo = renderingInfo.size;
        scale = new Array(3);
        var refScale;
        // convert size to scale
        for (var axis = 2; axis >= 0; axis--) {
          var val = sizeInfo[axis];
          if (isFinite(val)) {
            refScale = val / (bb[axis + 3] - bb[axis]);
            scale[axis] = refScale;
          }
          else if (val === "symbolValue") {
            scale[axis] = refScale = this._symbolScale ? this._symbolScale[axis] : 1 ;
          }
        }
        assert(refScale != null, "sizeInfo has no values");
        // fill in undefined scales
        for (axis = 2; axis >= 0; axis--) {
          if (scale[axis] == null) {
            scale[axis] = refScale;
          }
        }
      }
      else if (this._symbolScale) {
        // copy because the array gets modified below
        scale = this._symbolScale.slice(0);
      }
      else if (forceDefault) {
        // copy because the array gets modified below
        scale = DEFAULT_SCALE.slice(0);
      }
      else {
        scale = null;
      }

      // Convert meters to map units
      if (scale) {
        for (axis = 2; axis >= 0; axis--) {
            scale[axis] /= this._context.mapCoordsHelper.mapUnitInMeters;
        }
      }

      return scale;
    },

    _hasPerInstanceColor: function() {
      return this._isPropertyDriven("color") || this._isPropertyDriven("opacity");
    }
  });

  return Canvas3DObjectSymbol;
});

