/* jshint forin:false */
define([
    "../../../core/declare",

    "../../layers/LayerView",

    "../../../geometry/Extent",
    "../../../config",
    "../../../core/urlUtils",
    

    "../lib/glMatrix",

    "../webgl-engine/Stage",
    "../webgl-engine/lib/Texture",
    "../webgl-engine/lib/RenderGeometry",
    "../webgl-engine/lib/GeometryData",
    "../webgl-engine/lib/GeometryUtil",
    "../webgl-engine/materials/Material",
    "../webgl-engine/lib/Util"
  ],

function (
  declare,
  LayerView,
  Extent, esriConfig, urlUtils,
  glMatrix,
  Stage, Texture, RenderGeometry, GeometryData, GeometryUtil, Material, Util) {

  var assert = Util.assert;
  var mat4d = glMatrix.mat4d;
  var VertexAttrConstants = Util.VertexAttrConstants;

  var removeHandle = function(handle) {
    handle.remove();
  };

  var DynamicLayerView3D = declare(LayerView, {
    declaredClass: "esri.views.3d.layers.DynamicLayerView3D",

    supportsDraping: true,
    hasDraped: true,

    drawingOrder: 0,

    _updatingOverlay: false,

    constructor: function (/* {layer, view} mixed in via parent class*/) {
      this._extents = [];
      this._images = [];
    },
    
    initialize: function() {
      this.drawingOrder = this.view.getDrawingOrder(this.layer.get("id"));

      // handle scale changes
      this._scaleUpdateHandler = this._scaleUpdateHandler.bind(this);
      this._scaleEventHandles = [
        this.view.map.watch("scale", this._scaleUpdateHandler),
        this.layer.watch("minScale", this._scaleUpdateHandler),
        this.layer.watch("maxScale", this._scaleUpdateHandler)
      ];

      // handle suspend/resume
      this.on("suspend", function() {
        this.clear();
        this.emit("draped-data-change");
      }.bind(this));
      this.on("resume", function() {
        var numExtents = this._extents.length;
        for (var i = 0; i < numExtents; i++) {
          this.fetch(i);
        }
      }.bind(this));

      // handle layer property changes
      this._layerPropertyWatches = [
        this.layer.watch("opacity", this._opacityChangeHandler.bind(this))
      ];
    },

    destroy: function() {
      this.clear();

      this._scaleEventHandles.forEach(removeHandle);
      this._scaleEventHandles.length = 0;

      this._layerPropertyWatches.forEach(removeHandle);
      this._layerPropertyWatches.length = 0;
    },

    setDrapingExtent: function(extentIdx, extent, spatialReference, resolution) {
      this._extents[extentIdx] = {
        extent: extent,
        spatialReference: spatialReference,
        resolution: resolution
      };
      if (!this.suspended) {
        this.fetch(extentIdx);
      }
    },

    fetch: function(extentIdx) {
      var extentRec = this._extents[extentIdx];
      var extent = extentRec.extent;
      var width = extentRec.resolution;
      var esriExtent = new Extent(extent[0], extent[1], extent[2], extent[3], extentRec.spatialReference);
      this.layer.getImageUrl({
        extent: esriExtent,
        width: width,
        height: width
      }, function(url) {

        if (!this._images[extentIdx]) {
          this._images[extentIdx] = {texture: null, material: null, rendergeometry: null, domImage: null, worldExtent: extent, loading: false};
        }

        var image = this._images[extentIdx];

        var domImage = image.domImage || new Image();

        if (urlUtils.canUseXhr(url)) {
          domImage.crossOrigin = "anonymous";
        }
        else {
          url = esriConfig.request.proxyUrl + "?" + url;
        }

        domImage.src = url;
        image.loading = true;

        domImage.onload = function imgOnLoad() {
          assert(image.domImage === domImage);

          image.worldExtent = extent;
          this._createStageObjects(extentIdx, domImage);
          if ((extentIdx === 0) && this._images[1] && this._images[1].rendergeometry) {
            this._createStageObjects(1, null);
          }

          image.loading = false;
          this._evaluateUpdatingState();
          this.emit("draped-data-change");
        }.bind(this);

        domImage.onerror = function imgOnError() {
          image.loading = false;

          this._clearDomImage(image);
          this._evaluateUpdatingState();
        }.bind(this);
        image.domImage = domImage;
        this._evaluateUpdatingState();
      }.bind(this));
    },

    clear: function() {
      for (var extentIdx in this._images) {
        this.clearImage(extentIdx);
      }
    },

    clearImage: function(extentIdx) {
      var image = this._images[extentIdx];
      if (image) {
        if (image.htmlImage) {
          image.htmlImage.removeAttribute("src");
          image.htmlImage.removeAttribute("onload");
          image.htmlImage.removeAttribute("onerror");
          image.htmlImage = null;
        }
        if (image.rendergeometry) {
          this.view._stage.getTextureGraphicsRenderer().removeRenderGeometries([image.rendergeometry]);
          image.rendergeometry = null;
        }

        if (image.texture) {
          this.view._stage.remove(Stage.ModelContentType.TEXTURE, image.texture.getId());
          image.texture = null;
        }

        if (image.material) {
          this.view._stage.remove(Stage.ModelContentType.MATERIAL, image.material.getId());
          image.material = null;
        }
        
        this._clearDomImage(image);
        image.loading = false;
      }
    },

    _drawingOrderSetter: function(newDrawingOrder, oldDrawingOrder) {
      if (newDrawingOrder !== oldDrawingOrder) {
        var dirtyMaterials = {};
        this._images.forEach(function (image) {
          if (image && image.material) {
            image.material.setRenderPriority(newDrawingOrder);
            dirtyMaterials[image.material.getId()] = true;
          }
        });
        if (!Util.objectEmpty(dirtyMaterials)) {
          this.view._stage.getTextureGraphicsRenderer().updateRenderOrder(dirtyMaterials);
          this.emit("draped-data-change");
        }
      }
      return newDrawingOrder;
    },

    _scaleUpdateHandler: function() {
      var minScale = this.layer.get("minScale"),
        maxScale = this.layer.get("maxScale"),
        scale = this.view.map.get("scale");
      this.visibleAtMapScale = (scale > maxScale) && (!minScale || (scale < minScale));
      this.notifyChange("suspended");
    },

    _opacityChangeHandler: function(newValue) {
      this._images.forEach(function(image) {
        if (image && image.material) {
          image.material.setParameterValues({opacity: newValue});
        }
      }.bind(this));
      this.emit("draped-data-change");
    },

    _clearDomImage: function(image) {
      if (image.domImage) {
        image.domImage.removeAttribute("src");
        image.domImage.removeAttribute("onload");
        image.domImage.removeAttribute("onerror");
        image.domImage = null;
      }
    },
    
    _evaluateUpdatingState: function() {
      if (this._updatingOverlay) {
        this.set("updating", true);
        return;
      }

      var updating = false;
      for (var extentIdx in this._images) {
        var image = this._images[extentIdx];
        if (image.loading) {
          updating = true;
          break;
        }
      }
      
      this.set("updating", updating);
    },

    _createStageObjects: function(extentIdx, htmlImg) {
      var stage = this.view._stage;
      var texRend = stage.getTextureGraphicsRenderer();

      var image = this._images[extentIdx];

      if (htmlImg) {
        if (image.texture) {
          stage.remove(Stage.ModelContentType.TEXTURE, image.texture.getId());
        }
        image.texture = new Texture(htmlImg, "dynamicMapLayer", {width: htmlImg.width, height: htmlImg.height});
        stage.add(Stage.ModelContentType.TEXTURE, image.texture);
      } else {
        assert(image.texture);
      }

      if (!image.material) {
        image.material = new Material({
          ambient: [1.0, 1.0, 1.0], // (extentIdx === 0) ? [1, 0, 0] : [0, 0, 1], //
          diffuse: [0, 0, 0],
          transparent: true,
          opacity: this.layer.get("opacity"),
          textureId: image.texture.getId()
        }, "dynamicMapLayer");
        image.material.setRenderPriority(this.drawingOrder);
        stage.add(Stage.ModelContentType.MATERIAL, image.material);
      } else if (htmlImg) {
        image.material.setParameterValues({textureId: image.texture.getId()});
      }

      var z = -1;
      var geoData;
      if (extentIdx === 0) {
        var extent = image.worldExtent;
        var verts = [[extent[0], extent[1], z], [extent[2], extent[1], z],
          [extent[2], extent[3], z], [extent[0], extent[3], z]];
        geoData = GeometryUtil.createSquareGeometry(verts, true);
      } else {
        assert(extentIdx === 1);
        var innerImageExtent = this._images[0].worldExtent;
        if (!innerImageExtent) {
          return;
        }
        geoData = createOuterImageGeometry(innerImageExtent, image.worldExtent, z);
      }

      var drapedRG = new RenderGeometry(geoData);
      drapedRG.material = image.material;
      drapedRG.origin = {"vec3": [0, 0, 0], "id": "0_0" };
      drapedRG.transformation = mat4d.identity();
      drapedRG.name = "dynamicMapLayer";
      drapedRG.uniqueName = "dynamicMapLayer" + "#" + geoData.id;

      texRend.addRenderGeometries([drapedRG]);
      if (image.rendergeometry) {
        texRend.removeRenderGeometries([image.rendergeometry]);
      }
      image.rendergeometry = drapedRG;
    }
  });

  var createOuterImageGeometry = (function() {
    var normals = new Float32Array([0, 0, 1]);

    return function createOuterImageGeometry(innerExtent, outerExtent, z) {
      var rowHeights = [innerExtent[1] - outerExtent[1], innerExtent[3] - innerExtent[1], outerExtent[3] - innerExtent[3], 123456];
      var colWidths = [innerExtent[0] - outerExtent[0], innerExtent[2] - innerExtent[0], outerExtent[2] - innerExtent[2], 123456];
      var width = outerExtent[2] - outerExtent[0];
      var height = outerExtent[3] - outerExtent[1];

      var numCols = ((colWidths[0] > 0) && (colWidths[2] > 0)) ? 3 : 2;
      var numRows = ((rowHeights[0] > 0) && (rowHeights[2] > 0)) ? 3 : 2;
      var numVerts = (numRows+1)*(numCols+1);

      var vertices = new Float32Array(numVerts*3);
      var texCoords = new Float32Array(numVerts*2);
      var vertexIndices = new Uint32Array((numRows*numCols - 1)*6);
      var y = 0;
      var vertBufIdx = 0, texCoordBufIdx = 0, vertIdx = 0, faceBufIdx = 0;
      for (var yIdx = 0; yIdx < 4; yIdx++) {
        var rowHeight = rowHeights[yIdx];
        if (rowHeight <= 0) {
          continue;
        }
        var x = 0;
        for (var xIdx = 0; xIdx < 4; xIdx++) {
          var colWidth = colWidths[xIdx];
          if (colWidth <= 0) {
            continue;
          }
          vertices[vertBufIdx++] = outerExtent[0] + x;
          vertices[vertBufIdx++] = outerExtent[1] + y;
          vertices[vertBufIdx++] = z;
          texCoords[texCoordBufIdx++] = x/width;
          texCoords[texCoordBufIdx++] = y/height;

          if ((xIdx < 3) && (yIdx < 3) && !((xIdx === 1) && (yIdx === 1))) {
            vertexIndices[faceBufIdx++] = vertIdx;
            vertexIndices[faceBufIdx++] = vertIdx + 1;
            vertexIndices[faceBufIdx++] = vertIdx + numCols + 1;
            vertexIndices[faceBufIdx++] = vertIdx + 1;
            vertexIndices[faceBufIdx++] = vertIdx + numCols + 2;
            vertexIndices[faceBufIdx++] = vertIdx + numCols + 1;
          }

          vertIdx++;
          x += colWidth;
        }
        y += rowHeight;
      }

      var vertexAttr = {};
      vertexAttr[VertexAttrConstants.POSITION] = { "size" : 3, "data" : vertices };
      vertexAttr[VertexAttrConstants.NORMAL] = { "size" : 3, "data" : normals };
      vertexAttr[VertexAttrConstants.UV0] = { "size" : 2, "data" : texCoords };

      var faceIndices = {};
      var normalIndices = new Uint32Array(vertexIndices.length);
      for (var i = 0; i < normalIndices.length; i++) {
        normalIndices[i] = 0;
      }
      faceIndices[VertexAttrConstants.POSITION] = vertexIndices;
      faceIndices[VertexAttrConstants.NORMAL] = normalIndices;
      faceIndices[VertexAttrConstants.UV0] = vertexIndices;

      return {
        "faces" : { "type" : "triangle", "indices" : faceIndices, "positionKey" : VertexAttrConstants.POSITION },
        "vertexAttr" : vertexAttr,
        "id" : GeometryData.getNewId().toString()  // toString()ing it to make it same type as with proper GeometryData (see Model.getGeometryRenderGeometries())
      };
    };
  })();

  return DynamicLayerView3D;
});
