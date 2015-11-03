/* jshint forin:false */
define([
  "../../../core/declare", "dojo/promise/all", "dojo/Deferred", "dojo/_base/lang", "dojo/io-query",

  "../../../layers/support/LabelClass",
  "../../../core/urlUtils",
  "../../../core/watchUtils",
  "../../../geometry/support/webMercatorUtils",

  "../../layers/GraphicsLayerView",
  "../../../layers/graphics/controllers/SnapshotController",
  "../../../geometry/SpatialReference",
  "../../../geometry/Extent",
  "../../../processors/SpatialIndex",

  "./graphics/SymbolConverter",
  "./graphics/TextureCollection",
  "./graphics/Canvas3DSymbolSet",
  "./graphics/Canvas3DGraphicSet",
  "./graphics/graphicUtils",

  "./support/LayerViewUpdatingPercentage",

  "../support/ResourceController",
  "../lib/glMatrix",
  "../support/earthUtils",
  "../support/projectionUtils",
  "../support/Intersection",
  "../webgl-engine/Stage",
  "../webgl-engine/lib/Util",
  "../webgl-engine/lib/Layer",
  "../webgl-engine/lib/FloatingBoxLocalOriginFactory",
  "../webgl-engine/materials/HUDMaterial",
  "../support/PromiseLightweight",
  "../webgl-engine/lib/TextTextureAtlas",
  "../webgl-engine/lib/MaterialCollection",
  "../../../core/arrayUtils"
], function(
  declare, all,Deferred, lang, ioQuery,
  LabelClass, urlUtils, watchUtils, webMercatorUtils,
  GraphicsLayerView, SnapshotController, SpatialReference, Extent, SpatialIndex,
  SymbolConverter, TextureCollection, Canvas3DSymbolSet, Canvas3DGraphicSet, graphicUtils,
  LayerViewUpdatingPercentage,
  ResourceController, glMatrix, earthUtils, projectionUtils, Intersection,
  Stage, Util, StageLayer, FloatingBoxLocalOriginFactory, HUDMaterial, PromiseLightweight, TextTextureAtlas, MaterialCollection, arrayUtils
  ) {

  var removeHandle = function(handle) {
    handle.remove();
  };

  var isWGS84 = function(sr) {
    return sr.wkid === SpatialReference.WGS84.wkid;
  }

  var visibilityFlagScale = "VISIBILITY_SCALERANGE";
  var visibilityFlagGraphic = "VISIBILITY_GRAPHIC";
  var visibilityFlagLabelScale = "VISIBILITY_SCALERANGE_LABEL";
  var visibilityFlagShowLabels = "VISIBILITY_LABEL_SHOW";

  var SNAPSHOTCONTROLLER_MAXPAGESIZE = 300;
  var ELEVATION_UPDATE_BATCH_SIZE = 20;
  var SUSPEND_RESUME_EXTENT_OPTIMISM = 1.2;
  var EXTENT_VISIBILITY_MIN_Z = -0.3*earthUtils.earthRadius;

  // Maximum extent span (in meters) for which to start suspending based on
  // view frustum tests.
  var MAX_SUSPEND_RESUME_EXTENT_SPAN = 0.5 * earthUtils.earthRadius * Math.PI;

  // Minimum altitude from which to start suspending using the frustum
  // intersection. Above this altitude we use a simpler test based on whether
  // the extent is facing away from the camera.
  var MIN_SUSPEND_RESUME_GLOBAL_ALTITUDE = 0.9 * earthUtils.earthRadius;

  var DEBUG_SR_GUARDS = false;

  var vec4d = glMatrix.vec4d;
  var vec3d = glMatrix.vec3d;

  var tmpVec = vec3d.create();

  var GraphicsLayerView3D = declare([GraphicsLayerView, LayerViewUpdatingPercentage], {
    declaredClass: "esri.views.3d.layers.GraphicsLayerView3D",

    supportsDraping: true,
    hasDraped: false,

    "symbols-updating": false,
    _progressMaxNumNodes: 1,
    updateElevation : true,
    _overlayUpdating: false,

    /*****************************
     * Construction & destruction
     *****************************/
    initialize: function() {

      // Initialize stage
      this._stage = this.view._stage;
      this._stageLayer = new StageLayer(this.layer.id, {
        "state": this.suspended ? "HIDDEN" : "VISIBLE",
        "fullExtent": projectionUtils.convertExtent(this.layer.fullExtent, this.view.renderSpatialReference),
        "initialExtent": projectionUtils.convertExtent(this.layer.initialExtent, this.view.renderSpatialReference)
      }, this.layer.id);
      this._stage.add(Stage.ModelContentType.LAYER, this._stageLayer);
      this._labelStageLayer = new StageLayer(this.layer.id, {
        "state": this.suspended ? "HIDDEN" : "IGNORED"
      }, this.layer.id + "_labels");
      this._stage.add(Stage.ModelContentType.LAYER, this._labelStageLayer);
      this._stage.addToViewContent([this._stageLayer.getId(), this._labelStageLayer.getId()]);

      this.view.labelManager.addSceneServiceLayerView(this);

      // Register with ResourceController
      this._streamDataSupplier =
        this.view.resourceController.registerClient(this,
                                                    ResourceController.ClientType.SYMBOLOGY,
                                                    this._addUrlToken.bind(this));

      // _canvas3DSymbols is a database that maps symbol IDs to an instance of a Canvas3DSymbol
      this._canvas3DSymbols = {};

      // graphic ID -> Canvas3DGraphic
      this._canvas3DGraphics = {};
      this._canvas3DGraphicsKeys = {}; //for accelerated traversal we don't want to recreate this per frame

      // symbol ID -> { graphic ID -> Canvas3DGraphic }
      this._canvas3DGraphicsBySymbol = {};

      this._elevationDirtyGraphicsQueue = [];
      this._elevationDirtyGraphicsSet = {};

      // an object containing the IDs of all graphics (resp. their symbols) which are waiting for resources before
      // they can be displayed/updated
      this._updatingGraphicIds = {};

      this._canvas3DGraphicsDrapedIds = {};

      this.textTextureAtlas = null;
      this.hudMaterialCollection = null;

      // shared resources are any resources that depend solely on the symbol and that provide a significant
      // benefit when shared (e.g. save downloads, save memory, faster rendering due to material sharing)
      this._sharedResources = {
        textures: new TextureCollection(this._streamDataSupplier, this._stage)
        /*,
         meshMarkers: new SharedResourceContainer()*/
      };

      // the symbol constructors are given a context with references to various objects they may need for the creation
      // of themselves and of the Canvas3DGraphics
      this._symbolCreationContext = {
        sharedResources: this._sharedResources,
        renderer: this.layer.renderer,

        // stage is needed in Canvas3DGraphic to display graphics
        stage: this._stage,

        // StreamDataSupplier is needed to download symbol resources (i.e. I3S symbol models)
        streamDataSupplier: this._streamDataSupplier,

        // the following objects are needed for elevation alignment:
        elevationProvider: null,
        renderSpatialReference: this.view.renderSpatialReference,
        renderCoordsHelper: this.view.renderCoordsHelper,
        
        // the following is needed to support non-meter map units
        mapCoordsHelper: this.view.mapCoordsHelper,

        layer: this.layer,
        layerOrder: this.view.getDrawingOrder(this.layer.get("id")) || 0,
        localOriginFactory: new FloatingBoxLocalOriginFactory(5000000, 16),
        
        // Clipping
        clippingExtent: null
      };

      // Retrieve and handle graphics collection/controller
      this._graphicsCollection = null;
      this._graphicsCollectionEventHandle = null;
      this._graphicsControllerEventHandles = [];
      this._graphicsControllerLoading = true;
      this._initGraphicsController();

      // Spatial index is used to handle scale and elevation updates from terrain
      this._spatialIndex = new SpatialIndex();
      this._spatialIndexNumGraphics = 0;
      this._spatialIndexNumPendingQueries = 0;

      this.view.resourceController.registerIdleFrameWorker(this, {
        needsUpdate: this._needsIdleUpdate,
        idleFrame: this._idleUpdate
      });

      this._viewChangeListenerHandles = [];
      this._viewChangeUpdate = this._viewChangeUpdate.bind(this);
      this._viewChangeListenerHandles.push(this.view.on("resize", this._viewChangeUpdate));
      this._viewChangeListenerHandles.push(this.view.navigation.on("currentViewChanged", this._viewChangeUpdate));
      this._frustumVisibilityDirty = true;
      this._frustumVisibility = true;

      this._scaleVisibilityDirty = true;
      this._scaleVisibility = true;
      this._scaleVisibilityQuery = false;

      this._clippingChangedHandle = this.view.watch("clippingArea", this._updateClippingExtent.bind(this));
      this._updateClippingExtent();

      this._updateSuspendScaleVisibleFinish = this._updateSuspendScaleVisibleFinish.bind(this);

      this._viewChangeUpdate();

      this.computedExtent = null;
      this._suspendResumeExtent = null;
      this._suspendResumeExtentEngine = {
        extent: new Array(4),
        planes: new Array(4),
        maxSpan: 0,
        center: {
          origin: vec3d.create(),
          direction: vec3d.create()
        }
      };
      this._suspendResumeExtentEngineDirty = true;

      for (var i = 0; i < 4; i++) {
        this._suspendResumeExtentEngine.extent[i] = {
          origin: vec3d.create(),
          direction: vec3d.create(),
          cap: {
            next: null,
            direction: vec3d.create()
          }
        };

        this._suspendResumeExtentEngine.planes[i] = vec4d.create();
      }

      // Cap plane
      this._suspendResumeExtentEngine.planes[4] = vec4d.create();

      // Basic layer and LayerView events
      this.on("suspend", function() {
        this._stageLayer.setState("HIDDEN");
        this._labelStageLayer.setState("HIDDEN");
        this._hideAllGraphics();
        this.updateElevation = false;
      }.bind(this));

      this.on("resume", function() {
        this._stageLayer.setState("VISIBLE");
        this._labelStageLayer.setState("IGNORED");

        if (this.updateElevation) {
          this._markAllGraphicsElevationDirty();
        }

        if (this._showLabelsChangeOnResume) {
          this._showLabelsChange();
        }

        if (this.view.basemapTerrain) {
          this._updateGraphicsVisibility();
        }
      });

      this._layerEventHandles = [
        this.layer.watch("renderer", this._rendererChange.bind(this)),
        this.layer.watch("opacity", this._opacityChange.bind(this)),
        this.layer.watch("elevationInfo", this._elevationInfoChange.bind(this)),
        this.layer.watch("showLabels", this._showLabelsChange.bind(this)),
        this.layer.watch("minScale", this._layerMinMaxScaleChangeHandler.bind(this)),
        this.layer.watch("maxScale", this._layerMinMaxScaleChangeHandler.bind(this)),
        this.layer.on("graphic-update", this._graphicUpdateHandler.bind(this))
      ];

      this._scaleChangeEventHandle = null;
      this._elevationUpdateEventHandle = null;

      // Labelling
      this._showLabelsChangeOnResume = false;
      this._labelClasses = [];
      this.addResolvingPromise(this._initLabelingInfo());

      this._basemapTerrainEventHandle = this.view.watch("basemapTerrain", this._basemapTerrainChanged.bind(this));
      this._basemapTerrainChanged(this.view.basemapTerrain);

      // Properties based on map SR or globe mode
      this._viewIsSpherical = this.view.globeMode === "spherical";

      var mapSRDefinedDfd = new Deferred();

      this._mapSR = null;
      this._renderSREqualsMapSR = null;
      watchUtils.whenOnce(this.view, "map.spatialReference", function(sr) {
        if (this._viewIsSpherical && !sr.isWebMercator()) {
          console.error("Map spatial reference must be Web Mercator in spherical SceneView mode");
        }

        this._mapSR = sr;
        this._renderSREqualsMapSR = this.view.renderSpatialReference.equals(sr);
        this._symbolCreationContext.overlaySR = sr;
        mapSRDefinedDfd.resolve();
      }.bind(this));

      this.addResolvingPromise(mapSRDefinedDfd.promise);
    },

    _addUrlToken: function(url) {
      if (url.indexOf("?token=") !== -1) {
        return url;
      }

      var query = lang.mixin({
        token: this.layer.token
      });

      query = ioQuery.objectToQuery(query);
      url += (query ? ("?" + query) : "");

      if (this._canUseXhr == null) {
        //cache this once
        this._canUseXhr = urlUtils.canUseXhr(url);
      }

      // yann6817: remove condition
      if (!this._canUseXhr) {
        return urlUtils.addProxy(url);
      }
      return url;
    },
    
    _updateClippingExtent: function() {
      // Update clipping area
      var prevClippingExtent = this._symbolCreationContext.clippingExtent;
      var rect = [];
      if (projectionUtils.extentToBoundingRect(this.view.clippingArea, rect, this.view.map.spatialReference)) {
        // Canvas3D symbols compute their bounding boxes in 3D. It is easier to convert the clipping extent
        // to 3D as well and work only with 3D bounding boxes.
        this._symbolCreationContext.clippingExtent = [rect[0], rect[1], -Infinity, rect[2], rect[3], Infinity];
      } else {
        this._symbolCreationContext.clippingExtent = null;
      }

      // Update clipping area
      if (!arrayUtils.equals(this._symbolCreationContext.clippingExtent, prevClippingExtent)) {

        // Recreate all symbols (unless it's the first time)
        if (prevClippingExtent !== undefined) {
          this._recreateAllGraphics();
        }
      }
    },

    _basemapTerrainChanged: function(basemapTerrain) {
      this._symbolCreationContext.elevationProvider = basemapTerrain;

      // recreate all graphics. ideally, we would only recreate graphics that use elevation info
      this._recreateAllGraphics();

      if (!basemapTerrain) {
        if (this._elevationUpdateEventHandle) {
          this._elevationUpdateEventHandle.remove();
          this._elevationUpdateEventHandle = null;
        }

        if (this._scaleChangeEventHandle) {
          this._scaleChangeEventHandle.remove();
          this._scaleChangeEventHandle = null;
        }
      } else {
        this._elevationUpdateEventHandle = basemapTerrain.on("elevation-change", this._elevationUpdateHandler.bind(this));
        this.updateElevation = false;

        this._layerMinMaxScaleChangeHandler();
      }
    },

    _initGraphicsController: function() {
      var graphicsControllerPromise = this.layer.createGraphicsController({
        layerView: this,
        options: {
          maxPageSize: SNAPSHOTCONTROLLER_MAXPAGESIZE,
          extentAccessor: this.view,
          extentProperty: "clippingArea"
        }
      });
      all([this, graphicsControllerPromise]).then(
        function(data) {
          var controller = data[1];

          if (controller instanceof SnapshotController) {
            var h2 = controller.on("all-features-loaded", function() {
              this._graphicsControllerLoading = false;
              this._evaluateUpdatingState();
            }.bind(this));

            this._graphicsControllerEventHandles.push(h2);
          }
          else {
            this._graphicsControllerLoading = false;
          }

          this._graphicsCollection = controller.graphicsCollection;
          this._graphicsCollectionEventHandle =
            this._graphicsCollection.on("change", this._collectionChangeHandler.bind(this));
          // add initial graphics
          if (this._graphicsCollection.length > 0) {
            this.add(this._graphicsCollection.getAll());
          }

          this._evaluateUpdatingState();
        }.bind(this)
      );
    },

    _viewChangeUpdate: function() {
      this._frustumVisibilityDirty = true;
    },

    destroy: function() {
      this._graphicsCollection = null;
      if (this._graphicsCollectionEventHandle) {
        this._graphicsCollectionEventHandle.remove();
      }
      this._graphicsControllerEventHandles.forEach(removeHandle);

      if (this._elevationUpdateEventHandle) {
        this._elevationUpdateEventHandle.remove();
        this._elevationUpdateEventHandle = null;
      }

      this._layerEventHandles.forEach(removeHandle);

      if (this._scaleChangeEventHandle) {
        this._scaleChangeEventHandle.remove();
        this._scaleChangeEventHandle = null;
      }

      this._basemapTerrainEventHandle.remove();
      this._basemapTerrainEventHandle = null;

      var stageLayersId = [this._stageLayer.getId(), this._labelStageLayer.getId()];
      this._stage.removeFromViewContent(stageLayersId);
      this._stage.remove(Stage.ModelContentType.LAYER, stageLayersId[0]);
      this._stage.remove(Stage.ModelContentType.LAYER, stageLayersId[1]);
      this.view.resourceController.deregisterIdleFrameWorker(this);
      this.view.labelManager.removeSceneServiceLayerView(this);

      var draped = false;
      for (var graphicId in this._canvas3DGraphics) {
        draped = draped || this._canvas3DGraphics[graphicId].isDraped();
        this._canvas3DGraphics[graphicId].destroy();
      }

      this._canvas3DGraphics = {};
      this._canvas3DGraphicsKeys = null;
      for (var symbolId in this._canvas3DSymbols) {
        this._canvas3DSymbols[symbolId].destroy();
      }

      this._canvas3DGraphicsDrapedIds = {};
      this.hasDraped = false;

      this._viewChangeListenerHandles.forEach(removeHandle);
      this._clippingChangedHandle.remove(); 

      if (this._controller != null) {
        this._controller.destroy();
      }

      if (draped) {
        this.emit("draped-data-change");
      }
    },

    /**************************
     * Public interface
     **************************/

    add: function(graphics) {
      if (this.isResolved()) {
        // optimization: avoid using .then() if possible
        this._add(graphics);
      }
      else {
        this.then(function() { this._add(graphics);}.bind(this));
      }
    },

    remove: function(graphics) {
      var draped = false;
      var numGraphics = graphics.length;
      for (var i = 0; i < numGraphics; i++) {
        var graphicID = graphics[i].id;
        var canvas3DGraphic = this._canvas3DGraphics[graphicID];

        if (canvas3DGraphic) {
          var isDraped = canvas3DGraphic.isDraped();

          if (isDraped) {
            delete this._canvas3DGraphicsDrapedIds[graphicID];
            draped = true;
          }

          var symbolID = canvas3DGraphic.canvas3DSymbol.symbol.id;
          canvas3DGraphic.destroy();
          delete this._canvas3DGraphics[graphicID];
          delete this._canvas3DGraphicsBySymbol[symbolID][graphicID];
          this._canvas3DGraphicsKeys = null;
          // TODO: remove from spatial index
        }
      }

      this._updateHasDraped();

      if (draped) {
        this.emit("draped-data-change");
      }
      this.view.labelManager.setDirty();
    },

    getRenderingInfo: function(graphic) {
      // overridden from GraphicsLayerView
      var renderingInfo = this.inherited(arguments);

      if (renderingInfo && renderingInfo.color) {
        var c = renderingInfo.color;
        renderingInfo.color = [c.r / 255, c.g / 255, c.b / 255, c.a];
      }
      return renderingInfo;
    },

    _drawingOrderSetter: function(newDrawingOrder) { // gets called by View3D._updateLayerOrder whenever layer order changed
      this._symbolCreationContext.layerOrder = newDrawingOrder;
      var dirtyMaterials = {};
      var dirtySymbols = {};
      for (var graphicId in this._canvas3DGraphics) {
        var canvas3DGraphic = this._canvas3DGraphics[graphicId];
        canvas3DGraphic.setDrawOrder(newDrawingOrder, dirtyMaterials, dirtySymbols);
      }
      for (var symbolId in dirtySymbols) {
        var canvas3DSymbol = this._canvas3DSymbols[symbolId];
        canvas3DSymbol.setDrawOrder(newDrawingOrder, dirtyMaterials);
      }
      if (!Util.objectEmpty(dirtyMaterials)) {
        this.view._stage.getTextureGraphicsRenderer().updateRenderOrder(dirtyMaterials);
        this.emit("draped-data-change");
      }
    },

    getGraphicsFromStageObject: function(stageObject, triangleNr) {
      var graphic = null;
      if (this._graphicsCollection) {
        var metaData = stageObject.getMetadata();
        this._graphicsCollection.some(function(g) {
          if (g.id === metaData.graphicId) {
            graphic = g;
            return g;
          }
          return false;
        });
      }

      var p = new PromiseLightweight.Promise();
      if (graphic!=null) {
        p.done(graphic);
      }
      else {
        p.reject();
      }
      return p;
    },

    getCanvas3DGraphics: function () {
      return this._canvas3DGraphics;
    },

    getCanvas3DGraphicsKeys: function () {
      if (this._canvas3DGraphicsKeys == null) {
        this._canvas3DGraphicsKeys = Object.keys(this._canvas3DGraphics);
      }
      return this._canvas3DGraphicsKeys;
    },

    /**************************
     * Generic event handlers
     **************************/
    _collectionChangeHandler: function(event) {
      this.add(event.added);
      this.remove(event.removed);
    },

    _needsIdleUpdate: function() {
      return this._frustumVisibilityDirty ||
             (this.view.basemapTerrain && (this._scaleVisibilityDirty || this._elevationDirtyGraphicsQueue.length > 0));
    },

    _idleUpdate: function(timeBudget) {
      if (this._frustumVisibilityDirty) {
        this._updateSuspendFrustumVisible();

        this._frustumVisibilityDirty = false;

        if (timeBudget.done()) {
          return;
        }
      }

      if (!this.view.basemapTerrain) {
        return;
      }

      if (this._scaleVisibilityDirty) {
        this._updateSuspendScaleVisible();
        this._scaleVisibilityDirty = false;

        if (timeBudget.done()) {
          return;
        }
      }

      var numInQueue = this._elevationDirtyGraphicsQueue.length;
      if (numInQueue > 0) {
        var layerId = this._stageLayer.getId(),
          labelLayerId = this._labelStageLayer.getId();
        var batch = 0;
        for (var queueIdx = 0; queueIdx < numInQueue; queueIdx++) {
          var graphicID = this._elevationDirtyGraphicsQueue[queueIdx];
          var canvas3DGraphic = this._canvas3DGraphics[graphicID];
          if (canvas3DGraphic) {
            canvas3DGraphic.alignWithElevation(this.view.basemapTerrain, this.view.renderCoordsHelper, this.view.mapCoordsHelper);
          }
          delete this._elevationDirtyGraphicsSet[graphicID];
          batch++;
          if (batch >= ELEVATION_UPDATE_BATCH_SIZE) {
            this.view._stage.processDirtyLayer(layerId);
            this.view._stage.processDirtyLayer(labelLayerId);
            if (timeBudget.done()) {
              break;
            }
            batch = 0;
          }
        }
        this.view._stage.processDirtyLayer(layerId);
        this.view._stage.processDirtyLayer(labelLayerId);
        this._elevationDirtyGraphicsQueue.splice(0, queueIdx + 1);
        //console.log("Elevation update: %d graphics in %d ms (%d) ", queueIdx + 1, timeBudget.elapsed(), timeBudget.budget);
        this.view.labelManager.setDirty();
      }

      this._evaluateUpdatingState();
    },

    /*********************************************
     * Graphics & Symbol construction/destruction
     *********************************************/

    _add: function(graphics) {
      var numGraphics = graphics.length;
      var updateGraphicUpdateState = false;
      var scaleRangeEnabled = this._scaleRangeEnabled();

      for (var i = 0; i < numGraphics; i++) {
        var graphic = graphics[i];
        var geometry = graphic.geometry;
        if (geometry == null) {
          continue;
        }

        this._expandComputedExtent(geometry);

        var renderingInfo = this.getRenderingInfo(graphic);
        if (renderingInfo) {
          var symbol = renderingInfo.symbol;
          var canvas3DSymbol = this._getOrCreateCanvas3DSymbol(symbol, renderingInfo.renderer);
          if (canvas3DSymbol) {
            this._beginGraphicUpdate(graphic);
            canvas3DSymbol.then(
              function(graphic, symbol, canvas3DSymbol, renderingInfo) {
                if (!this._canvas3DGraphicsBySymbol[symbol.id]) {
                  this._canvas3DGraphicsBySymbol[symbol.id] = {};
                }
                this._createCanvas3DGraphic(canvas3DSymbol, graphic, renderingInfo, scaleRangeEnabled);

                this._endGraphicUpdate(graphic, updateGraphicUpdateState);
                this.view.labelManager.setDirty();
              }.bind(this, graphic, symbol, canvas3DSymbol, renderingInfo),
              function(graphic) {
                this._endGraphicUpdate(graphic, updateGraphicUpdateState);
              }.bind(this, graphic)
            );
          }
        }
      }

      this._endGraphicUpdate(null, true);
      updateGraphicUpdateState = true;
    },

    _getOrCreateCanvas3DSymbol: function(symbol, renderer) {
      // check if we already have an entry for this symbol in the symbol database
      var canvas3DSymbol = this._canvas3DSymbols[symbol.id];

      if (!canvas3DSymbol) {
        // convert 2D API style symbols (like SimpleMarkerSymbol) to Web3D symbology
        var web3DSymbol = SymbolConverter.toWeb3DSymbol(symbol, true);
        if (web3DSymbol) {
          var backgroundFillLayers;
          if (renderer && renderer.backgroundFillSymbol) {
            var backgroundFillSymbol = SymbolConverter.toWeb3DSymbol(renderer.backgroundFillSymbol);
            if (backgroundFillSymbol) {
              backgroundFillLayers = backgroundFillSymbol.symbolLayers;
            }
          }

          canvas3DSymbol = new Canvas3DSymbolSet(web3DSymbol, this._symbolCreationContext, backgroundFillLayers);
          this._canvas3DSymbols[symbol.id] = canvas3DSymbol;
        }
      }

      // internal symbols derive from Deferred, which is resolved when all resources are loaded
      return canvas3DSymbol;
    },

    _createCanvas3DGraphic: function(canvas3DSymbol, graphic, renderingInfo, scaleRangeEnabled) {
      // drop out silently if graphic has already been added
      if (!this._canvas3DGraphics[graphic.id]) {
        var canvas3DGraphic = canvas3DSymbol.createCanvas3DGraphic(graphic, renderingInfo);
        if (this.layerLabelsEnabled()) {
          canvas3DGraphic = this._createLabelsForGraphic(graphic, canvas3DGraphic, renderingInfo);
        }
        this._canvas3DGraphics[graphic.id] = canvas3DGraphic;
        this._canvas3DGraphicsKeys = null;
        this._canvas3DGraphicsBySymbol[canvas3DSymbol.symbol.id][graphic.id] = canvas3DGraphic;
        canvas3DGraphic.initialize(this._stageLayer, this._labelStageLayer, this._stage);

        var draped = canvas3DGraphic.isDraped();

        if (draped) {
          this._canvas3DGraphicsDrapedIds[graphic.id] = true;
          this.hasDraped = true;
        }

        canvas3DGraphic.centroid = null;
        if ((graphic.geometry.type !== "point") && (canvas3DGraphic instanceof Canvas3DGraphicSet)) {
          canvas3DGraphic.centroid = graphicUtils.computeCentroid(graphic.geometry, this._mapSR);
        }

        var scaleVisible = !this.suspended;

        if (this._shouldAddToSpatialIndex(graphic, canvas3DGraphic, scaleRangeEnabled)) {
          var added = this._addGraphicToSpatialIndex(graphic, canvas3DGraphic);
          if (scaleRangeEnabled && added) {
            scaleVisible = scaleVisible && this._graphicVisibleAtScale(graphic, canvas3DGraphic);
          }
        }

        var changeScale = canvas3DGraphic.setVisibilityFlag(visibilityFlagScale, scaleVisible);
        var changeVisible = canvas3DGraphic.setVisibilityFlag(visibilityFlagGraphic, graphic.visible);

        // A change happened if either one affected the visibility, but not both
        // since the second "change" would have reset the visibility (i.e. this
        // is a xor)
        var change = (changeScale !== changeVisible);

        if (change && draped) {
          this.emit("draped-data-change");
        }
      }
    },

    _shouldAddToSpatialIndex: function(graphic, canvas3DGraphic, scaleRangeEnabled) {
      return scaleRangeEnabled || canvas3DGraphic.mustAlignToTerrain();
    },

    _addGraphicsToSpatialIndex: function() {
      // this method must be called whenever one of the factors of whether graphics need to be in the spatial index
      // or not has changed (e.g. elevationInfo.mode, layer.minScale)
      if (!this._graphicsCollection) {
        return;
      }
      var graphics = this._graphicsCollection.getAll();
      var numGraphics = graphics.length;
      var scaleRangeEnabled = this._scaleRangeEnabled();
      for (var i = 0; i < numGraphics; i++) {
        var graphic = graphics[i];
        var canvas3DGraphic = this._canvas3DGraphics[graphic.id];
        if (canvas3DGraphic && !canvas3DGraphic.addedToSpatialIndex) {
          if (this._shouldAddToSpatialIndex(graphic, canvas3DGraphic, scaleRangeEnabled)) {
            this._addGraphicToSpatialIndex(graphic, canvas3DGraphic);
          }
        }
      }
    },

    _addGraphicToSpatialIndex: function(graphic, canvas3DGraphic) {
      var graphicSR = graphic.geometry.spatialReference,
        mapSR = this._mapSR;

      var indexedGraphic = {
        id: graphic.id,
      };

      if (!graphicSR.equals(mapSR)) {
        var gProj;

        if (isWGS84(graphicSR) && mapSR.isWebMercator()) {
          gProj = webMercatorUtils.geographicToWebMercator(graphic.geometry);
        }
        else if (graphicSR.isWebMercator() && isWGS84(mapSR)) {
          gProj = webMercatorUtils.webMercatorToGeographic(graphic.geometry);
        }
        else {
          console.warn("Cannot convert graphic geometry to map spatial reference, elevation and scale updates are disabled");
          return false;
        }

        indexedGraphic.geometry = gProj.toJSON(true);
      } else {
        indexedGraphic.geometry = graphic.geometry.toJSON(true);
      }

      this._spatialIndexNumGraphics++;
      this._spatialIndex.runProcess([indexedGraphic], this.layer.id);
      canvas3DGraphic.addedToSpatialIndex = true;
    },

    _recreateSymbol: function(symbolId) {
      var canvas3DGraphics = this._canvas3DGraphicsBySymbol[symbolId];
      var graphics = [];
      var draped = false;
      for (var graphicId in canvas3DGraphics) {
        var canvas3DGraphic = canvas3DGraphics[graphicId];
        var isDraped = canvas3DGraphic.isDraped();

        if (isDraped) {
          delete this._canvas3DGraphicsDrapedIds[graphicId];
          draped = true;
        }

        graphics.push(canvas3DGraphic.graphic);
        canvas3DGraphic.destroy();
        this._canvas3DGraphics[graphicId] = null;
      }
      this._canvas3DGraphicsBySymbol[symbolId] = {};

      var canvas3DSymbol = this._canvas3DSymbols[symbolId];
      canvas3DSymbol.destroy();
      this._canvas3DSymbols[symbolId] = null;

      this._updateHasDraped();

      if (draped) {
        this.emit("draped-data-change");
      }

      this.add(graphics);
    },

    _clearSymbolsAndGraphics: function() {
      var draped = false;
      for (var graphicId in this._canvas3DGraphics) {
        draped = draped || this._canvas3DGraphics[graphicId].isDraped();
        this._canvas3DGraphics[graphicId].destroy();
      }
      this._canvas3DGraphics = {};
      this._canvas3DGraphicsKeys = null;

      for (var symbolId in this._canvas3DSymbols) {
        this._canvas3DSymbols[symbolId].destroy();
      }
      this._canvas3DSymbols = {};

      this._canvas3DGraphicsBySymbol = {};
      this._elevationDirtyGraphicsSet = {};
      this._elevationDirtyGraphicsQueue = [];
      this._updatingGraphicIds = {};

      this._canvas3DGraphicsDrapedIds = {};
      this.hasDraped = false;

      if(draped) {
        this.emit("draped-data-change");
      }
      this.view.labelManager.setDirty();
      // TODO: clear spatial index

      if (this.textTextureAtlas) {
        this.textTextureAtlas.dispose();
        this.textTextureAtlas = null;
      }
      if (this.hudMaterialCollection) {
        this.hudMaterialCollection.dispose();
        this.hudMaterialCollection = null;
      }
    },

    /*********************************
     * Labelling
     *********************************/

    _initLabelingInfo: function() {
      var deferred = new Deferred();

      this.layer.then(function() {
        var labelingInfo = this.layer.labelingInfo;
        if (labelingInfo) {
          this._labelClasses = new Array(labelingInfo.length);
          var labelClassPromises = [];
          for (var i = 0; i < labelingInfo.length; i++) {
            var canvas3DSymbol = this._getOrCreateCanvas3DSymbol(labelingInfo[i].symbol);
            canvas3DSymbol.then(
              function(i, canvas3DSymbol) {
                this._labelClasses[i] = {
                  labelClass: labelingInfo[i],
                  canvas3DSymbol: canvas3DSymbol,
                  canvas3DGraphics: []
                };
              }.bind(this, i, canvas3DSymbol)
            );
            labelClassPromises.push(canvas3DSymbol);
          }
          all(labelClassPromises).then(function() {
            deferred.resolve();
          });
        }
        else {
          deferred.resolve();
        }
      }.bind(this));

      return deferred.promise;
    },

    _createLabelsForGraphic: function(graphic, canvas3DGraphic, renderingInfo) {
      if (this._labelClasses && this._labelClasses.length > 0) {

        for (var i=0; i<this._labelClasses.length; i++) {
          var labelClass = this._labelClasses[i];
          //take first passing where clause
          if (!LabelClass.evaluateWhere(labelClass.labelClass.where, graphic.attributes)) {
            continue;
          }

          var labelExpression = labelClass.labelClass.getLabelExpression();
          if (!labelExpression /* including "" */) {
            continue;
          }
          var text = LabelClass.buildLabelText(labelExpression, graphic.attributes, this.layer.fields);
          if (!text /* including "" */) {
            continue;
          }
          var labelCanvas3DSymbol = labelClass.canvas3DSymbol.childCanvas3DSymbols[0];

          var offsets = this._evalLabelPlacementParams(graphic, canvas3DGraphic, renderingInfo);


          if (this.textTextureAtlas == null) {
            this.textTextureAtlas = new TextTextureAtlas(this.layer.id,this._stage);
            this.hudMaterialCollection = new MaterialCollection(this._stage);
          }

          var labelGraphic = labelCanvas3DSymbol.createCanvas3DGraphic(graphic, {
            text: text,
            centerOffset: offsets.centerOffset,
            translation: offsets.translation,
            screenOffset: offsets.screenOffset,
            anchor: offsets.anchor},
            this.hudMaterialCollection,this.textTextureAtlas);

          if (labelGraphic) {
            labelGraphic._labelClass = labelClass.labelClass;
            canvas3DGraphic.addLabelGraphic(labelGraphic);
            labelClass.canvas3DGraphics.push(canvas3DGraphic);
            labelGraphic.setVisibilityFlag(visibilityFlagShowLabels, this.layerLabelsEnabled());

            this.view.labelManager.setInitialLabelGraphicState(labelGraphic);
          }
          break;
        }

      }
      return canvas3DGraphic;
    },

    _evalLabelPlacementParams: function(graphic, canvas3DGraphic, renderingInfo) {

      var labelClass0 = this.layer.labelingInfo[0];
      var placementInfo = placementInfoTable[labelClass0.labelPlacement] || placementInfoTable["default"];

      if (graphic.geometry.type === "polygon") {
        return {
          anchor: "center"
        };
      } else if (graphic.geometry.type === "polyline") {
        return {
          anchor: "center"
        };
      } else if (graphic.geometry.type === "extent") {
        return {
          anchor: "center"
        };
      } else if (graphic.geometry.type !== "point") {
        return {
          anchor: placementInfo.anchor
        };
      }


      //Fixme: can we use first symbolLayer always here?
      var graphicSymbol = canvas3DGraphic.canvas3DSymbol.symbol.symbolLayers[0];
      var shaderOffsets = {
        screenOffset: [0, 0],
        centerOffset: [0, 0, 0, -1],
        translation: canvas3DGraphic.getCenterObjectSpace(),
        anchor: placementInfo.anchor
      };

      //FIXME: update once we have support for several labelClasses

      var symbolSize;
      if (graphicSymbol.type === "Icon") {
        symbolSize = canvas3DGraphic._graphics[0].getScreenSize();

        if (!canvas3DGraphic.isDraped()) {
          var material = canvas3DGraphic._graphics[0].stageObject.getGeometryRecords()[0].materials[0];
          if (material instanceof HUDMaterial) {
            var matParams = material.getParams();
            shaderOffsets.screenOffset = [symbolSize[0] / 2 * placementInfo.normalizedOffset[0] - (matParams.anchorPos[0] - 0.5) * 2,
                                          symbolSize[1] / 2 * placementInfo.normalizedOffset[1] - (matParams.anchorPos[1] - 0.5) * 2];
          } else {
            shaderOffsets.screenOffset = [symbolSize[0] / 2 * placementInfo.normalizedOffset[0],
                                          symbolSize[1] / 2 * placementInfo.normalizedOffset[1]];
          }
        }
        else {
          shaderOffsets.anchor = "center";
          //shaderOffsets.screenOffset = [symbolSize[0] / 2 * placementOffsets.normalizedOffset[0], symbolSize[1] / 2 * placementOffsets.normalizedOffset[1]];
        }


      } else if (graphicSymbol.type === "Object") {
        var bbox = canvas3DGraphic._graphics[0].getBoundingBoxObjectSpace();
        symbolSize = [bbox[3] - bbox[0], bbox[4] - bbox[1], bbox[5] - bbox[2]];
        var marginFactor = 1.1;
        //calc radius of object in xy, apply this as centerOffset (viewspace) in x,y
        var maxXY = Math.max(symbolSize[0], symbolSize[1]) * marginFactor;
        shaderOffsets.centerOffset[0] = maxXY / 2 * placementInfo.normalizedOffset[0];
        shaderOffsets.centerOffset[1] = maxXY / 2 * placementInfo.normalizedOffset[1];

        //no viewSpace adjustments in z. translate label to top (placement above) or bottom (placement velow) in world position.
        shaderOffsets.translation[2] += symbolSize[2] * (placementInfo.normalizedOffset[2] / 2) * marginFactor;
      }
      return shaderOffsets;
    },


    /*******************************************
     * Layer/LayerView property change handlers
     ******************************************/

    _pendingRendererChange: null,

    _recreateAllGraphics: function() {
      this._clearSymbolsAndGraphics();
      this.computedExtent = null;
      this._updateSuspendResumeExtent();

      if (this._graphicsCollection) {
        this.add(this._graphicsCollection.getAll());
      }
    },

    _rendererChange: function(newValue, oldValue, prop, target) {
      if (this.get("symbols-updating")) {
        // setting a new renderer while symbols are still updating creates an inconsistent state
        // TODO: this is a hacky workaround, it would be better to cancel or "disarm" pending updates and start
        // re-creating the graphics with the new renderer immediately
        this._pendingRendererChange = Array.prototype.slice.call(arguments, 0);
      }
      else {
        this._symbolCreationContext.renderer = newValue;

        // recreate all graphics. ideally, we would only recreate graphics that are symbolized by the renderer.
        this._recreateAllGraphics();
      }
    },

    _opacityChange: function(newValue) {
      var drapedChanges = false;
      for (var symbolId in this._canvas3DGraphicsBySymbol) {
        var canvas3DSymbol = this._canvas3DSymbols[symbolId];
        var symbolGraphics = this._canvas3DGraphicsBySymbol[symbolId];
        canvas3DSymbol.layerPropertyChanged("opacity");

        if (!drapedChanges) {
          // check if any of the affected graphics are draped -> issue overlay redraw
          for (var graphicId in symbolGraphics) {
            if (symbolGraphics[graphicId].isDraped()) {
              this.emit("draped-data-change");
              drapedChanges = true;
              break;
            }
          }
        }
      }
    },
    layerLabelsEnabled: function() {
      return this.layer.get("showLabels");
    },
    _showLabelsChange: function(newValue) {
      if (this.get("suspended")) {
        this._showLabelsChangeOnResume = true;
        return;
      }
      if (!this._graphicsCollection) {
        return;
      }
      var show = this.layerLabelsEnabled();
      this._graphicsCollection.forEach(function(graphic) {
        var canvas3DGraphic = this._canvas3DGraphics[graphic.id];
        if (canvas3DGraphic) {

          if (show && canvas3DGraphic._labelGraphics.length === 0) {
            var renderingInfo = this.getRenderingInfo(graphic);
            canvas3DGraphic = this._createLabelsForGraphic(graphic, canvas3DGraphic, renderingInfo);
            for (var j = 0; j < canvas3DGraphic._labelGraphics.length; j++) {
              var lg = canvas3DGraphic._labelGraphics[j];
              lg.initialize(this._labelStageLayer, this._stage);
            }
          }

          for (j = 0; j < canvas3DGraphic._labelGraphics.length; j++) {
            lg = canvas3DGraphic._labelGraphics[j];
            lg.setVisibilityFlag(visibilityFlagShowLabels, show);
          }
        }
      }.bind(this));
      this.view.labelManager.setDirty();
      this._showLabelsChangeOnResume = false;
    },
    _elevationInfoChange: function(newValue) {
      //ensure that if symbols are re-created, the Canvas3DTextSymbols of labels have been updated
      if (this._labelClasses) {
        this._labelClasses.forEach(function(labelClass) {
          labelClass.canvas3DSymbol.layerPropertyChanged("elevationInfo", {});
        });
      }
      for (var symbolId in this._canvas3DGraphicsBySymbol) {
        var canvas3DSymbol = this._canvas3DSymbols[symbolId];
        var symbolGraphics = this._canvas3DGraphicsBySymbol[symbolId];
        if (!canvas3DSymbol.layerPropertyChanged("elevationInfo", symbolGraphics)) {
          this._recreateSymbol(symbolId);
        }
        else {
          // if we don't recreate the symbol, we have to update all the label graphics attached to this symbol's
          // graphics. this isn't very nice, we should re-think the internal label representation.
          for (var graphicId in symbolGraphics) {
            var canvas3DGraphicSet = symbolGraphics[graphicId],
              graphic = canvas3DGraphicSet.graphic;
            var labelGraphics3D = canvas3DGraphicSet._labelGraphics;
            for (var i = 0; i < labelGraphics3D.length; i++) {
              var canvas3DGraphic = labelGraphics3D[i];
              canvas3DGraphic.canvas3DSymbol.updateGraphicElevationInfo(graphic, canvas3DGraphic);
            }
          }
        }
      }
    },

    /*********************************
     * Visibility
     *********************************/

    _scaleUpdateHandler: function(evt) {
      if (!this.suspended && this._spatialIndexNumGraphics > 0) {
        // Store since evt might get reused
        var tileExtent = evt.extent;
        var scale = evt.scale;

        this._spatialIndexNumPendingQueries++;
        this._spatialIndex.intersects(tileExtent, undefined, undefined, true).then(function(msg) {
          this._spatialIndexNumPendingQueries--;
          var showAtScale = this._visibleAtScale(scale);
          var drapedChanges = false;

          var numHits = msg.results.length;
          for (var i = 0; i < numHits; i++) {
            var result = msg.results[i];
            var canvas3DGraphic = this._canvas3DGraphics[result];
            if (canvas3DGraphic) {
              var centroid = canvas3DGraphic.centroid;
              if (centroid && ((tileExtent[0] > centroid.x || tileExtent[1] > centroid.y ||
                tileExtent[2] < centroid.x || tileExtent[3] < centroid.y))) {
                continue;
              }

              var change = canvas3DGraphic.setVisibilityFlag(visibilityFlagScale, showAtScale);

              for (var j = 0; j < canvas3DGraphic._labelGraphics.length; j++) {
                var lg = canvas3DGraphic._labelGraphics[j];
                if (lg._labelClass && lg._labelClass.minScale != null && lg._labelClass.maxScale != null) {
                  var visibleAtScale = this._visibleAtScaleLabel(scale, lg._labelClass);
                  change = change || lg.setVisibilityFlag(visibilityFlagLabelScale, visibleAtScale);
                }
              }

              if (change) {
                this.view.labelManager.setDirty();
              }
              if (change && canvas3DGraphic.isDraped()) {
                drapedChanges = true;
              }
            }
          }

          if (drapedChanges) {
            this.emit("draped-data-change");
          }
        }.bind(this));
      }

      this._scaleVisibilityDirty = true;
    },

    _visibleAtScaleLabel: function(scale, label) {
      return (scale > label.maxScale) && (!label.minScale || (scale < label.minScale));
    },

    _visibleAtScale: function(scale) {
      var minScale = this.layer.get("minScale"),
        maxScale = this.layer.get("maxScale");
      return (scale > maxScale) && (!minScale || (scale < minScale));
    },

    _graphicVisibleAtScale: function(graphic, canvas3DGraphic) {
      var point;
      if (canvas3DGraphic.centroid) {
        point = canvas3DGraphic.centroid;
      } else if (graphic.geometry.type === "point") {
        point = graphic.geometry;
      }

      if (point) {
        var basemapTerrain = this.view.basemapTerrain;
        var scale = basemapTerrain ? this.view.basemapTerrain.getScale(point) : 1;
        return this._visibleAtScale(scale);
      }
      return true;
    },

    _scaleRangeEnabled: function() {
      var minScale = this.layer.get("minScale");
      return ((minScale !== null) && (minScale > 0) && (minScale < 80000000)) || (this.layer.get("maxScale") > 1000);
      // extra check for "minScale !== null" because "null < 10000"
    },

    _layerMinMaxScaleChangeHandler: function() {
      var basemapTerrain = this.view.basemapTerrain;

      if (!basemapTerrain) {
        return;
      }

      var hasScaleRange = this._scaleRangeEnabled();

      if (hasScaleRange && !this._scaleChangeEventHandle) {
        // Start watching for terrain scale changes
        this._scaleChangeEventHandle =
          this.view.basemapTerrain.on("scale-change", this._scaleUpdateHandler.bind(this));

        if (!this.suspended) {
          this._addGraphicsToSpatialIndex();
        }
      } else if (!hasScaleRange && this._scaleChangeEventHandle) {
        this._scaleChangeEventHandle.remove();
        this._scaleChangeEventHandle = null;
      }

      if (!this.suspended) {
        this._updateGraphicsVisibility();
      }

      this._scaleVisibilityDirty = true;
    },

    _graphicUpdateHandler: function(event) {
      var canvas3DGraphic = this._canvas3DGraphics[event.graphic.id];

      if (!canvas3DGraphic) {
        return;
      }

      switch (event.property) {
        case "visible":
          var change = canvas3DGraphic.setVisibilityFlag(visibilityFlagGraphic, event.newValue);

          if (change) {
            if (canvas3DGraphic.isDraped()) {
              this.emit("draped-data-change");
            }

            this.view.labelManager.setDirty();
          }
        break;
      }
    },

    _updateGraphicsVisibility: function() {
      if (this._graphicsCollection==null) {
        return;
      }
      var drapedChanges = false;
       this._graphicsCollection.forEach(function(graphic) {
        var canvas3DGraphic = this._canvas3DGraphics[graphic.id];
        if (canvas3DGraphic) {
          var visibleAtScale = this._graphicVisibleAtScale(graphic, canvas3DGraphic);
          var change = canvas3DGraphic.setVisibilityFlag(visibilityFlagScale, visibleAtScale);

          if (change && canvas3DGraphic.isDraped()) {
            drapedChanges = true;
          }
        }
      }.bind(this));

      if (drapedChanges) {
        this.emit("draped-data-change");
      }

      this.view.labelManager.setDirty();
    },

    _hideAllGraphics: function() {
      if (!this._graphicsCollection) {
        return;
      }

      var drapedChanges = false;
      this._graphicsCollection.forEach(function(graphic) {
        var canvas3DGraphic = this._canvas3DGraphics[graphic.id];
        if (canvas3DGraphic) {
          var change = canvas3DGraphic.setVisibilityFlag(visibilityFlagScale, false);
          if (change && canvas3DGraphic.isDraped()) {
            drapedChanges = true;
          }
        }
      }.bind(this));

      if (drapedChanges) {
        this.emit("draped-data-change");
      }

      this.view.labelManager.setDirty();
    },

    _updateSuspendResumeExtentEngine: function() {
      if (!this._suspendResumeExtentEngineDirty) {
        return;
      }

      this._suspendResumeExtentEngineDirty = false;

      var i,
        sre = this._suspendResumeExtent,
        sree = this._suspendResumeExtentEngine,
        worldUpAtPosition = this.view.renderCoordsHelper.worldUpAtPosition;

      vec3d.set3(sre[0], sre[1], EXTENT_VISIBILITY_MIN_Z, sree.extent[0].origin);
      vec3d.set3(sre[2], sre[1], EXTENT_VISIBILITY_MIN_Z, sree.extent[1].origin);
      vec3d.set3(sre[2], sre[3], EXTENT_VISIBILITY_MIN_Z, sree.extent[2].origin);
      vec3d.set3(sre[0], sre[3], EXTENT_VISIBILITY_MIN_Z, sree.extent[3].origin);

      if (!this._renderSREqualsMapSR) {
        var srcSR = this._mapSR,
          destSR = this.view.renderSpatialReference;
        for (i = 0; i < 4; i++) {
          projectionUtils.vectorToVector(sree.extent[i].origin, srcSR, sree.extent[i].origin, destSR);
        }
      }

      vec3d.add(sree.extent[0].origin, sree.extent[2].origin, sree.center.origin);
      vec3d.scale(sree.center.origin, 0.5);

      worldUpAtPosition(sree.center.origin, sree.center.direction);

      for (i = 0; i < 4; i++) {
        var ci = sree.extent[i];
        worldUpAtPosition(ci.origin, ci.direction);

        var cn = sree.extent[i == 3 ? 0 : i + 1];
        ci.cap.next = cn.origin;
        vec3d.direction(cn.origin, ci.origin, ci.cap.direction);

        // Plane
        vec3d.cross(sree.extent[i].cap.direction, sree.extent[i].direction, sree.planes[i]);
        sree.planes[i][3] = -vec3d.dot(sree.planes[i], sree.extent[i].origin);
      }

      sree.maxSpan = Math.max(Math.abs(sre[0] - sre[2]), Math.abs(sre[1] - sre[3]));
    },

    _isVisibleInFrustumGlobal: function() {
      // Compare whether corners of extent all point away from the camera
      var sree = this._suspendResumeExtentEngine;
      var frustum = this.view.getFrustum();

      if (vec3d.dot(sree.center.direction, frustum.direction) < 0) {
        return true;
      }

      for (var i = 0; i < 4; i++) {
        var ext = sree.extent[i];

        if (vec3d.dot(ext.direction, frustum.direction) < 0) {
          return true;
        }
      }

      return false;
    },

    _isVisibleInFrustum: function() {
      var frustum = this.view.getFrustum();

      this._updateSuspendResumeExtentEngine();

      if (this._viewIsSpherical) {
        // If the extent spans a really global area, then just never suspend it.
        // This is mostly because the frustum intersection method doesn't work
        // in these cases because we create a volume by extruding the extent
        // corners and this is more inaccurate the more curvature the extent has
        // when projected.
        if (this._suspendResumeExtentEngine.maxSpan > MAX_SUSPEND_RESUME_EXTENT_SPAN) {
          return true;
        }

        // In global mode, the far plane of the view frustum can be quite permissive.
        // Instead, do a quicker test based on whether an extent is facing
        // away from the camera.
        if (frustum.altitude() >= MIN_SUSPEND_RESUME_GLOBAL_ALTITUDE) {
          return this._isVisibleInFrustumGlobal();
        }
      }

      // Test intersection of extent rays with frustum
      for (var i = 0; i < this._suspendResumeExtentEngine.extent.length; i++) {
        var ci = this._suspendResumeExtentEngine.extent[i];

        // Intersect frustum with each ray
        if (Intersection.frustumRay(frustum.planes,
                                    ci.origin,
                                    null,
                                    ci.direction)) {
          return true;
        }

        // Intersect frustum with conservative extent cap lines
        if (Intersection.frustumLineSegment(frustum.planes,
                                            ci.origin,
                                            ci.cap.next,
                                            ci.cap.direction)) {
          return true;
        }
      }

      // Test intersection frustum line segments with extent frustum
      for (i = 0; i < frustum.lines.length; i++) {
        var line = frustum.lines[i];

        if (Intersection.frustumLineSegment(this._suspendResumeExtentEngine.planes,
                                            line.origin,
                                            line.endpoint,
                                            line.direction)) {
          return true;
        }
      }

      return false;
    },

    _updateSuspendFrustumVisible: function() {
      if (!this._suspendResumeExtent) {
        return;
      }

      var isVis = this._isVisibleInFrustum();

      if (isVis !== this._frustumVisibility) {
        this._frustumVisibility = isVis;
        this.notifyChange("suspended");
      }
    },

    _updateSuspendScaleVisibleFinish: function(visible) {
      this._scaleVisibilityQuery = false;

      if (this._scaleVisibility !== visible) {
        this._scaleVisibility = visible;
        this.notifyChange("suspended");
      }
    },

    _updateSuspendScaleVisible: function() {
      var bt = this.view.basemapTerrain;

      if (!this._suspendResumeExtent || !bt || !this._scaleRangeEnabled()) {
        this._updateSuspendScaleVisibleFinish(true);
      } else if (!this._scaleVisibilityQuery) {
        this._scaleVisibilityQuery = true;

        var minScale = this.layer.minScale,
          maxScale = this.layer.maxScale,
          minLevel = minScale ? bt.tilingScheme.levelAtScale(minScale) : 0,
          maxLevel = maxScale ? bt.tilingScheme.levelAtScale(maxScale) : Infinity;

        bt.queryVisibleScaleRange(this._suspendResumeExtent,
                                  minLevel,
                                  maxLevel,
                                  this._updateSuspendScaleVisibleFinish);
      }
    },

    canResume: function() {
      if (!this.inherited(arguments)) {
        return false;
      }

      if (!this._frustumVisibility) {
        return false;
      }

      if (!this._scaleVisibility) {
        return false;
      }

      return true;
    },

    /*********************************
     * Elevation alignment
     *********************************/

    _elevationUpdateHandler: function(evt) {
      var tileExtent = evt.extent;

      if (!this.suspended) {
        if (tileExtent[0] === -Infinity) {
          this._markAllGraphicsElevationDirty();
        }
        else if (this._spatialIndexNumGraphics > 0) {
          this._spatialIndexNumPendingQueries++;
          this._spatialIndex.intersects(tileExtent, undefined, undefined, true).then(function (msg) {
            this._spatialIndexNumPendingQueries--;
            var graphicIds = msg.results;
            var numHits = graphicIds.length;
            for (var i = 0; i < numHits; i++) {
              var graphicId = graphicIds[i];
              var canvas3DGraphic = this._canvas3DGraphics[graphicId];
              if (canvas3DGraphic && canvas3DGraphic.mustAlignToTerrain()) {
                this._markGraphicElevationDirty(graphicId);
              }
            }
            this._evaluateUpdatingState();
          }.bind(this));
        }
      }
      else if(!this.updateElevation) {
        var layerExtent = this.computedExtent;

        if(layerExtent &&
          (tileExtent[2] > layerExtent.xmin) && (tileExtent[0] < layerExtent.xmax) &&
          (tileExtent[3] > layerExtent.ymin) && (tileExtent[1] < layerExtent.ymax))
        {
          this.updateElevation = true;
        }
      }
    },

    _markGraphicElevationDirty: function(graphicID) {
      if (!this._elevationDirtyGraphicsSet[graphicID]) {
        this._elevationDirtyGraphicsSet[graphicID] = true;

        // FIFO list: graphics may be removed before they are processed in an idle update.
        //   indirection over graphic id ensures that removed graphics are not retained. consumer of list is
        //   forced to retrieve graphic from this._canvas3DGraphics and check if it's still there
        this._elevationDirtyGraphicsQueue.push(graphicID);
      }
    },

    _markAllGraphicsElevationDirty: function() {
      for (var graphicID in this._canvas3DGraphics) {
        this._markGraphicElevationDirty(graphicID);
      }
      this._evaluateUpdatingState();
    },

    /*********************************
     * Misc
     *********************************/

    _evaluateUpdatingState: function() {
      var numNodesUpdating = this._elevationDirtyGraphicsQueue.length + Object.keys(this._updatingGraphicIds).length;
      this._progressMaxNumNodes = Math.max(numNodesUpdating,this._progressMaxNumNodes);
      if (numNodesUpdating === 0) {
        this._progressMaxNumNodes = 1;
      }

      this.updatingPercentage = (this._graphicsControllerLoading || this._overlayUpdating) ? 100 :
        100.0 * numNodesUpdating / this._progressMaxNumNodes;

      this.updating = (numNodesUpdating > 0) || (this._spatialIndexNumPendingQueries > 0) ||
        this._graphicsControllerLoading || this._overlayUpdating;
    },

    _beginGraphicUpdate: function(graphic) {
      this._updatingGraphicIds[graphic.id] = true;
      if (!this.get("symbols-updating")) {
        this.set("symbols-updating", true);
      }
      this._evaluateUpdatingState();
    },

    _endGraphicUpdate: function(graphic, updateState) {
      if (graphic) {
        delete this._updatingGraphicIds[graphic.id];
      }
      if (updateState && this.get("symbols-updating") && Util.objectEmpty(this._updatingGraphicIds)) {
        this.view.flushDisplayModifications();
        this.set("symbols-updating", false);
        if (this._pendingRendererChange) {
          var pendingRendererChange = this._pendingRendererChange;
          this._pendingRendererChange = null;
          this._rendererChange.apply(this, pendingRendererChange);
        }
      }

      this._evaluateUpdatingState();
    },

    _expandComputedExtent: function(geometry) {
      // Expand computed extent
      var xmin, xmax, ymin, ymax, zmin, zmax;

      if (geometry.type === "point") {
        xmin = xmax = geometry.x;
        ymin = ymax = geometry.y;

        if (geometry.z) {
          zmin = zmax = geometry.z;
        }
      }
      else {
        var geometryExtent = geometry.extent;

        if (!geometryExtent) {
          // This can happen when the geometry does not contain any data
          return;
        }

        xmin = geometryExtent.xmin;
        xmax = geometryExtent.xmax;
        ymin = geometryExtent.ymin;
        ymax = geometryExtent.ymax;
        zmin = geometryExtent.zmin;
        zmax = geometryExtent.zmax;
      }

      var mapSR = this._mapSR;
      if (!geometry.spatialReference.equals(mapSR)) {
        if (projectionUtils.xyzToVector(xmin, ymin, 0, geometry.spatialReference, tmpVec, mapSR)) {
          xmin = tmpVec[0];
          ymin = tmpVec[1];

          projectionUtils.xyzToVector(xmax, ymax, 0, geometry.spatialReference, tmpVec, mapSR);
          xmax = tmpVec[0];
          ymax = tmpVec[1];
        }
        else if (DEBUG_SR_GUARDS) {
          throw new Error("Geometry has incompatible spatial reference");
        }
      }

      var ce = this.computedExtent;
      if (ce) {
        ce.xmin = Math.min(xmin, ce.xmin);
        ce.xmax = Math.max(xmax, ce.xmax);
        ce.ymin = Math.min(ymin, ce.ymin);
        ce.ymax = Math.max(ymax, ce.ymax);
      }
      else {
        ce = new Extent(xmin, ymin, xmax, ymax, geometry.spatialReference);
        this.computedExtent = ce;
      }

      if ((zmin != null) && (zmax != null)) {
        ce.zmin = (ce.zmin != null) ? Math.min(zmin, ce.zmin) : zmin;
        ce.zmax = (ce.zmax != null) ? Math.max(zmax, ce.zmax) : zmax;
      }

      this._updateSuspendResumeExtent();
    },

    _updateSuspendResumeExtent: function() {
      if (this.computedExtent) {
        if (!this._suspendResumeExtent) {
          this._suspendResumeExtent = vec4d.create();
        }
        var ce  = this.computedExtent;
        var sre = this._suspendResumeExtent;
        var dx = 0.5 * ce.width * (SUSPEND_RESUME_EXTENT_OPTIMISM - 1);
        var dy = 0.5 * ce.height * (SUSPEND_RESUME_EXTENT_OPTIMISM - 1);

        vec4d.set4(ce.xmin - dx, ce.ymin - dy, ce.xmax + dx, ce.ymax + dy, sre);
      }
      else {
        this._suspendResumeExtent = null;
      }

      // Assume that this function is only called when the extent is likely to change,
      // so don't bother optimizing only setting these flags when necessary
      this._frustumVisibilityDirty = true;
      this._scaleVisibilityDirty = true;
      this._suspendResumeExtentEngineDirty = true;
    },

    _updateHasDraped: function() {
      this.hasDraped = false;

      for (var k in this._canvas3DGraphicsDrapedIds) {
        if (this._canvas3DGraphicsDrapedIds.hasOwnProperty(k)) {
          this.hasDraped = true;
          break;
        }
      }
    },

      getStats: function() {
        var numVisibleScale = 0;
        var numVisibleGraphic = 0;
        var numVisibleLabelScale = 0;
        var numVisibleShowLabels = 0;
        for (var graphicId in this._canvas3DGraphics) {
          var graphic = this._canvas3DGraphics[graphicId];
          if (graphic && graphic.areVisibilityFlagsSet(visibilityFlagScale, null)) {
            numVisibleScale++;
          }
          if (graphic && graphic.areVisibilityFlagsSet(visibilityFlagGraphic, null)) {
            numVisibleGraphic++;
          }
          if (graphic && graphic.areVisibilityFlagsSet(visibilityFlagLabelScale, null)) {
            numVisibleLabelScale++;
          }
          if (graphic && graphic.areVisibilityFlagsSet(visibilityFlagShowLabels, null)) {
            numVisibleShowLabels++;
          }
        }
        
        function arrlen(arr) {
          return arr && arr.length || null;
        }
        function collen(col) {
          return col && col.getAll().length || null;
        }
        function objlen(obj) {
          return obj && Object.keys(obj).length || null;
        }

        // In order to save rows, display extent in one row, with reduced precision
        var extentPrecision = 4;
        var resumeExtent = "null"
        if (this._suspendResumeExtent) {
          resumeExtent = this._suspendResumeExtent.map(function(x) {
            return x.toPrecision(extentPrecision);
          }).join(", ");
        }
        var computedExtent = "null"
        if (this.computedExtent) {
          computedExtent = 
          [this.computedExtent.xmin,this.computedExtent.ymin,this.computedExtent.xmax,this.computedExtent.ymax].map(function(x) {
            return x.toPrecision(extentPrecision);
          }).join(", ");
        }

        return {
          numCollection: collen(this._graphicsCollection),
          numGraphics: objlen(this._canvas3DGraphics),
          numDraped: objlen(this._canvas3DGraphicsDrapedIds),
          numUpdatingGraphics: objlen(this._updatingGraphicIds),
          numVisibleScale: numVisibleScale,
          numVisibleGraphic: numVisibleGraphic,
          numVisibleLabelScale: numVisibleLabelScale,
          numVisibleShowLabels: numVisibleShowLabels,
          numElevationDirty: arrlen(this._elevationDirtyGraphicsQueue),
          visibilityFrustum: this._frustumVisibility,
          resumeExtent: resumeExtent,
          computedExtent: computedExtent,
          suspended: this.suspended
        };
      },
  });

  var placementInfoTable = {
    "above-center":  {"normalizedOffset": [ 0,  1, 0], "anchor": "bottom", "pointPriorities": "AboveCenter" },
    "above-left":    {"normalizedOffset": [-1,  1, 0], "anchor": "bottomRight", "pointPriorities": "AboveLeft"},
    "above-right":   {"normalizedOffset": [ 1,  1, 0], "anchor": "bottomLeft", "pointPriorities": "AboveRight"},
    "below-center":  {"normalizedOffset": [ 0, -1, 0], "anchor": "top", "pointPriorities": "BelowCenter"},
    "below-left":    {"normalizedOffset": [-1, -1, 0], "anchor": "topRight", "pointPriorities": "BelowLeft"},
    "below-right":   {"normalizedOffset": [ 1, -1, 0], "anchor": "topLeft", "pointPriorities": "BelowRight"},
    "center-center": {"normalizedOffset": [ 0,  0, 1], "anchor": "center", "pointPriorities": "CenterCenter"},
    "center-left":   {"normalizedOffset": [-1,  0, 0], "anchor": "right", "pointPriorities": "CenterLeft"},
    "center-right":  {"normalizedOffset": [ 1,  0, 0], "anchor": "left", "pointPriorities": "CenterRight"}
  };

  var placementAliases = {
    "above-center": ["default", "esriServerPointLabelPlacementAboveCenter"],
    "above-left":   ["esriServerPointLabelPlacementAboveLeft"],
    "above-right":  ["esriServerPointLabelPlacementAboveRight"],
    "below-center": ["esriServerPointLabelPlacementBelowCenter"],
    "below-left":   ["esriServerPointLabelPlacementBelowLeft"],
    "below-right":  ["esriServerPointLabelPlacementBelowRight"],
    "center-center":["esriServerPointLabelPlacementCenterCenter"],
    "center-left":  ["esriServerPointLabelPlacementCenterLeft"],
    "center-right": ["esriServerPointLabelPlacementCenterRight"]
  };

  for (var placementAliasesKey in placementAliases) {
    var aliases = placementAliases[placementAliasesKey],
      original = placementInfoTable[placementAliasesKey];
    aliases.forEach(function(alias) {
      placementInfoTable[alias] = original;
    });
  }

  if (Object.freeze) {
    Object.freeze(placementInfoTable);
    Object.keys(placementInfoTable).forEach(function(key){
      Object.freeze(placementInfoTable[key]);
      Object.freeze(placementInfoTable[key].normalizedOffset);
    });
  }

  return GraphicsLayerView3D;
});
