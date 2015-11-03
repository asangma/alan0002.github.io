/*jslint browser: true, continue: true, eqeq: true, nomen: true, plusplus: true, regexp: true, unparam: true, sloppy: true, todo: true, vars: true, white: true */
/* jshint forin:false */
/*global define */
define([
    "../../../core/declare",
    "dojo/promise/all",

    "../../../views/3d/support/ResourceController",
    "../../../views/3d/support/PreallocArray",

    "../../../geometry/SpatialReference",

    "../../../views/3d/layers/i3s/I3SNodeLoader",
    "../../../views/3d/layers/i3s/I3SIndexTraversal",
    "../../../views/3d/layers/i3s/I3SUtil",
    "../../../views/3d/layers/i3s/I3SLodHandling",
    
    "../../../core/Accessor",
    "../../../core/Evented",
    "../../../core/Promise",
    "../../../views/3d/support/PromiseLightweight",
    "../../../views/3d/support/projectionUtils",
    "../../../views/3d/lib/glMatrix"
  ],
  function(
    declare, all,
    ResourceController, PreallocArray,
    SpatialReference,
    I3SNodeLoader, I3SIndexTraversal, I3SUtil, I3SLodHandling,
    Accessor, Evented, Promise, promiseLightweight, projectionUtils, glMatrix
    ) {

    var DBG = false;
    var DBG_SHOW_NODES = false;

    var vec3d = glMatrix.vec3d;
    var vec3 = glMatrix.vec3;

    var I3SOnDemandController = declare([Accessor, Evented, Promise], {

      constructor: function(properties) {
        this._nodeIndex = {};
        this._animFrameFunctionQueue =  [[], []];

        this.updateEventListener = {
          needsUpdate: this._needsAnimationFrameHandler.bind(this),
          idleFrame: this._animationFrameHandler.bind(this),
          idleBegin: this._startNodeLoading.bind(this),
          idleEnd: this.cancelNodeLoading.bind(this)
        };
        this.updateEventListenerWhileSuspended = {
          idleBegin: this._startNodeLoadingWhileSuspended.bind(this)
        };

        this._lodHandling = new I3SLodHandling();
      },


      initialize: function() {

        this.layerView._controller = this;

        // TODO Yann: use computed properties: this.addComputed("streamDataSupplier", "view");
        // _streamDataSupplierCompute: function() {
        //   if (this.layerView.view) {
        //     return this.layerView.view.resourceController.registerClient(
        //       this, ResourceController.ClientType.SCENE, properties.addUrlTokenFunction);
        //   }
        //   return null;
        //}
        this._streamDataSupplier = this.layerView.view.resourceController.registerClient(
          this, ResourceController.ClientType.SCENE, this.addUrlTokenFunction);
        
        var loadPromise = all([ this.layer, this.layerView ]).then(function() {
          this.graphicsSource = this.layer.graphicsSource;

          this._layerViewHandles = [
            this.layerView.on("suspend", function(evt) {
              evt.target.view.resourceController.deregisterIdleFrameWorker(this);
              this.updateEventListener.idleEnd();
              evt.target.view.resourceController.registerIdleFrameWorker(this, this.updateEventListenerWhileSuspended);
              if (evt.target.setVisibility!=null) {
                evt.target.setVisibility(false);
              }
            }.bind(this)),

            this.layerView.on("resume", function(evt) {
              if (evt.target.setVisibility != null) {
                evt.target.setVisibility(true);
              }
              evt.target.view.resourceController.deregisterIdleFrameWorker(this);
              evt.target.view.resourceController.registerIdleFrameWorker(this, this.updateEventListener);
              this.updateEventListener.idleBegin();
            }.bind(this))
          ];          
          
          if(!this.layerView.suspended) {
            if (this.layerView.setVisibility!=null) {
              this.layerView.setVisibility(true);
            }
            this.layerView.view.resourceController.registerIdleFrameWorker(this, this.updateEventListener);
          } else {
            this.layerView.view.resourceController.registerIdleFrameWorker(this, this.updateEventListenerWhileSuspended);
          }

          this._clippingAreaChangedHandles = [this.layerView.view.watch("clippingArea", this._clippingAreaChanged.bind(this))];
          this._clippingAreaChanged();

          if (this.layerViewOptionalFunctions.traversalOptions.elevationInfo) {
            this._basemapTerrainChangeHandler();
          }
        }.bind(this));

        this.addResolvingPromise(loadPromise);
      },

      destroy: function() {
        this.layerView.view.resourceController.deregisterIdleFrameWorker(this);
        this.layerView.view.resourceController.deregisterClient(this.layerView);
		this._removeHandles(this._layerViewHandles);
        this._removeHandles(this._requiredAttributesChangedHandles);
        this._removeHandles(this._clippingAreaChangedHandles);
        this._removeHandles(this._elevationHandles);
        this._streamDataSupplier = null;
        this._nodeLoader = null;
        this._nodeIndex = null;
      },

      //--------------------------------------------------------------------------
      //
      //  Variables
      //
      //--------------------------------------------------------------------------

      updateEventListener: null,
      updateEventListenerWhileSuspended: null,
      _lodHandling: null,
      _nodeIndex: null,
      _numNodesLoading: 0,
      _progressMaxNumNodes: 1,
      _animFrameFunctionQueue: null,
      _nodeLoader: null,
      _crsVertex: null,
      _crsIndex: null,
      _camPos: null,
      _screenSizeFactor: null,
      _defaultGeometrySchema: null,
      _rootNodeUrl: null,
      _poi: null,

      _requiredAttributes: null,

      _layerViewHandles: [],
      _requiredAttributesChangedHandles: [],
      _clippingAreaChangedHandles: [],
      _elevationHandles: [],
      _elevationUpdateNodes: null,

      _clippingArea: null,

      _updatesDisabled: false,

      //--------------------------------------------------------------------------
      //
      //  Properties
      //
      //--------------------------------------------------------------------------

      //----------------------------------
      //  layerView
      //----------------------------------
	  
	  _removeHandles: function(handles) {
		  if (handles) {
          handles.forEach(function(hdl) {
            hdl.remove();
          });
          handles.length = 0;
        }
	  },

      //----------------------------------
      //  isMeshPyramid
      //----------------------------------
      
      _isMeshPyramid: null,
      
      _isMeshPyramidGetter: function() {
        return this._isMeshPyramid;
      },

      //----------------------------------
      //  streamDataSupplier
      //----------------------------------

      _streamDataSupplier: null,

      _streamDataSupplierGetter: function() {
         return this._streamDataSupplier;
      },

      //----------------------------------
      //  crsVertex
      //----------------------------------

      _crsVertexGetter: function() {
        return this._crsVertex;
      },

      _crsIndexGetter: function() {
        return this._crsIndex;
      },

      _camPosGetter: function() {
        return this._camPos;
      },

      _nodeIndexGetter: function() {
        return this._nodeIndex;
      },

      _screenSizeFactorGetter: function() {
        return this._screenSizeFactor;
      },

      _modifyNumNodesLoading:function(amount){
        this._numNodesLoading+=amount;
      },

      //----------------------------------
      //  Required Attributes for Renderer
      //----------------------------------

      _getRequiredAttributes: function() {
        if (this._attributeStorageInfo == null || !this._fields) {
          return [];
        }

        var requiredFields = Object.create(null);
        if (this.layer.renderer) {
          this.layer.renderer.collectRequiredFields(requiredFields);
        }
        if (this.layer.showLabels && this.layer.labelingInfo) {
          this.layer.labelingInfo.forEach(function(labelClass) {
            labelClass.collectRequiredFields(requiredFields);
          });
        }

        var attributeStorageInfo = this._attributeStorageInfo;
        var fields = this._fields;
        var requiredAttributes = Object.keys(requiredFields)
          .map(function(fieldName) {
            var index = attributeStorageInfo.findIndex(function(info){return info.name === fieldName;});
            var field = fields.find(function(field){return field.name === fieldName;});
            return {
              index: index,
              name: fieldName,
              field: field,
              attributeStorageInfo: attributeStorageInfo[index]
            };
          })
          .filter(function(requiredAttribute) {
            return requiredAttribute.index !== -1 && requiredAttribute.field != null;
          });

        return requiredAttributes;
      },

      _rendererChanged: function() {
        var requiredAttributes = this._getRequiredAttributes();

        this.cancelNodeLoading();
        this._requiredAttributes = requiredAttributes;
        this._startNodeLoading();
      },

      _showLabelsChanged: function() {
        var requiredAttributes = this._getRequiredAttributes();
        var changed = true;
        if (requiredAttributes.length == this._requiredAttributes.length) {
          changed = !this._requiredAttributes.every(function(a){return requiredAttributes.find(function(b){return a.name === b.name;});});
        }
        if (changed) {
          this.cancelNodeLoading();
          this._requiredAttributes = requiredAttributes;
          this._startNodeLoading();
        }
      },

      _labelingInfoChanged: function() {
        // not implemented
      },

      _clippingAreaChanged: function() {
        var bb = [];
        if (projectionUtils.extentToBoundingBox(this.layerView.view.clippingArea, bb, this.layerView.view.renderSpatialReference)) {
          this._clippingArea = bb;
        } else {
          this._clippingArea = null;
        }
        this.cancelNodeLoading();
        this._startNodeLoading();
      },

      _basemapTerrainChangeHandler: function() {
        this._removeHandles(this._elevationHandles);

        this._elevationHandles.push(
          this.layerView.view.watch("basemapTerrain",
            this._basemapTerrainChangeHandler.bind(this))
        );
        if (this.layerView.view.basemapTerrain != null) {
          this._elevationHandles.push(
            this.layerView.view.basemapTerrain.on("elevation-change",
              this._elevationUpdateHandler.bind(this)));
        }
      },

      _elevationUpdateHandler: function(evt) {
        var aabb = [evt.extent[0], evt.extent[1], -Infinity, 
                    evt.extent[2], evt.extent[3], Infinity];
        var srAabb = this.layerView.view.basemapTerrain.spatialReference;
        if (this._elevationUpdateNodes == null) {
            this._elevationUpdateNodes = new PreallocArray(10);
        }
        var nodes = this._elevationUpdateNodes;
        nodes.clear();
        I3SUtil.findIntersectingNodes(aabb, srAabb,
          this.nodeIndex.root, this._crsIndex, this.nodeIndex, nodes);

        var nodeElevationUpdate = this.layerViewOptionalFunctions.nodeElevationUpdate;

        var length = nodes.length;
        for (var i=0; i<length; i++) {
          var node = nodes.data[i];
          if (node.computedMbs) {
            node.computedMbs[3] = -1; // invalidate affected mbs
          }
          if (nodeElevationUpdate) {
            nodeElevationUpdate(node.id, aabb, srAabb);
          }
        }

        this.cancelNodeLoading();
        this._startNodeLoading();
      },

      //--------------------------------------------------------------------------
      //
      //  Public Methods
      //
      //--------------------------------------------------------------------------

      queueAnimationFrameFunctionCall: function (fct, that, args, cancelFunc, prio) {
        if (this._nodeLoader!=null) {
          prio = prio || 0;
          this._animFrameFunctionQueue[prio].push({fct: fct, that: that, args: args, cancelFunc: cancelFunc});
        }
      },

      getBaseUrl: function() {
        return I3SUtil.addTrailingSlash(this.layer.url);
      },


      //--------------------------------------------------------------------------
      //
      //  Private Methods
      //
      //--------------------------------------------------------------------------

      _needsAnimationFrameHandler: function() {
        return true;
      },

      _animationFrameHandler: function(timeBudget) {
        if (this._nodeLoader==null || (this.layerViewOptionalFunctions.areUpdatesDisabled && this.layerViewOptionalFunctions.areUpdatesDisabled()===true)) {
          return;
        }

        var f;

        while (this._animFrameFunctionQueue[0].length>0 && !timeBudget.done())
        {
          f = this._animFrameFunctionQueue[0].shift();
          f.fct.apply(f.that, f.args);
        }

        var numIndicesToLoad = 5-this._numNodesLoading; // make sure we don't get too far ahead of node loading
        if (this._indexLoader!=null && numIndicesToLoad>0) {
          this._indexLoader.continueTraversal(numIndicesToLoad);
        }

        while (this._animFrameFunctionQueue[1].length>0 && !timeBudget.done()) {
          f = this._animFrameFunctionQueue[1].shift();
          f.fct.apply(f.that, f.args);
        }

        this._evaluateUpdating();
        this._lodHandling.lodGlobalHandling();
      },

      _evaluateUpdating: function() {
        var numNodes = this._indexLoader!=null?this._indexLoader.getQueueSize() + this._numNodesLoading*3.0:0;
        var updating = numNodes>0;
        if (numNodes===0) {
          this._progressMaxNumNodes = 1;
        }
        this._progressMaxNumNodes=Math.max(numNodes,this._progressMaxNumNodes);

        if (this.layerView.updating !== updating) {
          this.layerView.updating = updating;
        }
        var up = 100.0*numNodes/this._progressMaxNumNodes;
        if (this.layerView.updatingPercentage !== up) {
          this.layerView.updatingPercentage = up;
        }
      },

      _initViewData: function() {

        if (this._crsIndex==null || this._isMeshPyramid==null) {

          var layer = this.layer;
          this._isMeshPyramid = layer.store.lodType==="MeshPyramid";
          this._defaultGeometrySchema = layer.store.defaultGeometrySchema;
          this._fields = layer.fields;
          this._attributeStorageInfo = layer.attributeStorageInfo;

          this._rootNodeUrl = layer.store.rootNode;

          if (layer.store.indexCRS==null && layer.store.geographicCRS==null) {
            this.warningEvent("Input data invalid: layer.store.indexCRS is undefined.",1);
          }

          if (layer.store.vertexCRS==null && layer.store.projectedCRS==null) {
            this.warningEvent("Input data invalid: layer.store.vertexCRS is undefined.",1);
          }

          this._crsIndex = new SpatialReference(I3SUtil.extractWkid(layer.store.indexCRS||layer.store.geographicCRS));
          this._crsVertex = new SpatialReference(I3SUtil.extractWkid(layer.store.vertexCRS||layer.store.projectedCRS));

          // prefer layer.spatialReference if available, because wkid and latestWkid is only available there.
          if (this._crsIndex.equals(layer.spatialReference)) {
            this._crsIndex = layer.spatialReference;
          }
          if (this._crsVertex.equals(layer.spatialReference)) {
            this._crsVertex = layer.spatialReference;
          }
        }

        var camera = this.layerView.view.navigation.targetCamera;

        this._camPos = camera.eye; // used in computeFeatureSizeOnScreen()
        this._screenSizeFactor = 1 / camera.perPixelRatio; // used in computeFeatureSizeOnScreen()

        this._poi = vec3d.create();
        var viewDir = vec3d.create();
        vec3d.subtract(camera.center, camera.eye, viewDir);
        vec3d.normalize(viewDir);
        var angleOfElevation = Math.acos(vec3d.dot(camera.center, viewDir) /
          vec3d.length(camera.center)) - 0.5*Math.PI;
        vec3.lerp(camera.eye, camera.center, Math.max(0, Math.min(1, angleOfElevation/(0.5*Math.PI))), this._poi);

        var lodBias = 1.0;

        var errorMetricToUse = this.layerViewOptionalFunctions.traversalOptions!=null ? this.layerViewOptionalFunctions.traversalOptions.errorMetricToUse: null;

        var elevationInfo = this.layerViewOptionalFunctions.traversalOptions.elevationInfo
        var elevationProvider = elevationInfo ? this.layerView.view.basemapTerrain : null;

        var maxDistance = 250000000;
        this._viewportQueries = new I3SUtil.ViewportQueries(this._crsIndex,
          this.layerView.view.renderCoordsHelper,
          camera, maxDistance,
          this._clippingArea,
          false,
          //params for debugging. can be undefined.
            undefined,
            undefined,
            undefined,
          lodBias,
          errorMetricToUse,
          elevationProvider,
          elevationInfo
        );
      },

      _startNodeLoadingWhileSuspended: function() {
        this._initViewData();
        //only remove invisible during suspended
        this._removeInvisibleNodes();

      },

      warningEvent: function(msg, severity) {
        this.emit("i3s-load-log", {type:severity===1?"fatal":"warning", msg:msg});
        console.warn("i3s-load-log warningEvent severity "+severity, " message "+msg);
      },
      
      _startNodeLoading: function() {
        if (this._updatesDisabled) { return; }
        if (this._streamDataSupplier==null) { return; }

        this._initViewData();
        var texPrefetch = this.layerViewOptionalFunctions.getTexturePrefetchFunctions!=null?this.layerViewOptionalFunctions.getTexturePrefetchFunctions():undefined;

        //todo: how to decide when to bypass featuredata? this may be stored in i3s in the future
        var bypassFeaturedata = this.isMeshPyramid && this._defaultGeometrySchema!=null && this._defaultGeometrySchema.ordering!=null;

        // gather required attributes from the renderer and register renderer changes (only if setting attributes is possible)
        if (this.layerViewOptionalFunctions.getLoadedAttributes != null && this._requiredAttributes == null)
        {
          this._requiredAttributes = this._getRequiredAttributes();
          this._requiredAttributesChangedHandles = [
            this.layer.watch("renderer", this._rendererChanged.bind(this)),
            this.layer.watch("showLabels", this._showLabelsChanged.bind(this)),
            this.layer.watch("labelingInfo", this._labelingInfoChanged.bind(this))
          ];
        }

        this._nodeLoader = new I3SNodeLoader(this._streamDataSupplier,
          this._bundleLoadedCallback.bind(this),
          this.getBaseUrl(),
          this.queueAnimationFrameFunctionCall.bind(this),
          undefined, //this._nodeDebugVisualizer
          this.layerView.view.renderCoordsHelper, this._crsIndex,

          //the following params are only relevant for texture prefetching
          texPrefetch?texPrefetch._calcDesiredTextureLOD:undefined,
          texPrefetch?texPrefetch._imageIsPartOfTextureBundle:undefined,
          texPrefetch?texPrefetch._matId2Meta:undefined,
          texPrefetch?texPrefetch._texId2Meta:undefined,
          texPrefetch?texPrefetch.useCompressedTextures:undefined, this.warningEvent,
          this._defaultGeometrySchema,
          this._requiredAttributes,
          bypassFeaturedata
        );

        var rootUrlSplit = this._rootNodeUrl.split("/");
        var rootNodeId = rootUrlSplit[rootUrlSplit.length-1];

        this._indexLoader = new I3SIndexTraversal(this.getBaseUrl(), this._rootNodeUrl, rootNodeId, this._poi, this._nodeIndex, this._streamDataSupplier,
          this._viewportQueries, this._processNodeIndexDocument.bind(this),this._lodHandling.finishedLevel.bind(this._lodHandling),
          this.layerViewOptionalFunctions._nodeDebugVisualizer, this.warningEvent, this.layer._addTrailingSlash, this.layerViewOptionalFunctions.traversalOptions);

        this._indexLoader.start();

        var visibleNodes = this._removeInvisibleNodes();

        var lodMode = this.layerViewOptionalFunctions.traversalOptions!=null && this.layerViewOptionalFunctions.traversalOptions.perLevelTraversal===true?"perLevel":
          this._isMeshPyramid?"global":"swap";

        this._lodHandling.startNodeLoading(this.layerViewRequiredFunctions, this.layerViewOptionalFunctions,
          this._indexLoader.nodeIsVisible.bind(this._indexLoader),
          this._indexLoader.nodeTraversalState.bind(this._indexLoader),
          lodMode, this._nodeIndex, visibleNodes, rootNodeId);

        if (this.layerViewOptionalFunctions.additionalStartNodeLoadingHandler)
        {
          this.layerViewOptionalFunctions.additionalStartNodeLoadingHandler();
        }

        this._evaluateUpdating();
      },

      isNodeLoading: function() {
        return (this._nodeLoader!=null && this._indexLoader!=null);
      },

      cancelNodeLoading: function() {

        if (!this.isNodeLoading()) {
          return;
        }

        this._indexLoader.cancel();
        this._nodeLoader.cancel();

        this._streamDataSupplier.cancelRequestsBulk(this._streamDataSupplier.getRequestedURLs());

        for (var prio = 0; prio < this._animFrameFunctionQueue.length; prio++) {
          for (var i=0; i<this._animFrameFunctionQueue[prio].length; i++) {
            if (this._animFrameFunctionQueue[prio][i].cancelFunc!==undefined) {
              this._animFrameFunctionQueue[prio][i].cancelFunc();
            }
          }
        }

        this._numNodesLoading = 0;

        if (DBG) {
          console.log("cancelNodeLoading()");
        }

        this._animFrameFunctionQueue = [[],[]];
        this._nodeLoader = undefined;
        this._indexLoader = undefined;

        this._lodHandling.cancelNodeLoading();

        if (this.layerViewOptionalFunctions.additionalCancelNodeLoadingHandler)
        {
          this.layerViewOptionalFunctions.additionalCancelNodeLoadingHandler();
        }

        this._evaluateUpdating();
      },

      _removeInvisibleNodes: function() {

        var visibleNodes = {};

        var isNodeVisible = this._viewportQueries.isNodeVisible;
        for (var nodeID in this._nodeIndex) {
          if (this._nodeIndex.hasOwnProperty(nodeID)) {
            var node = this._nodeIndex[nodeID];

            if (this.layerViewRequiredFunctions.getAddedFeatures(node.id)==null) {
              continue;
            }

            if (isNodeVisible(node)===false) {
              this._removeNodeData(node);
            }
            else {
              visibleNodes[nodeID] = node;
            }
          }
        }
        return visibleNodes;

      },
      _removeNodeData: function(node) {
        this._lodHandling.setLodGlobalDirty();
        this.layerViewRequiredFunctions.removeNodeData(node);
        delete this._nodeIndex[node.id];

        if (DBG) {
          console.debug("_removeNodeData, deleting "+node.id);
        }
      },

      _processNodeIndexDocument: function(node, nodeParent) {
        var promiseLoaded = new promiseLightweight.Promise();


        if (DBG) {
          console.debug("_processNodeIndexDocument node id: "+node.id +" areAllBundlesLoaded "+
          this.layerViewRequiredFunctions.areAllBundlesLoaded(node, true)+
          " shouldLoadNode "+this._lodHandling.shouldLoadNode(node, nodeParent));
        }

        if (node.featureData!=null && (node.featureData.length > 0)) {
          if (!this.layerViewRequiredFunctions.areAllBundlesLoaded(node, true)) {

            if (this.layerViewOptionalFunctions._nodeDebugVisualizer!=null && DBG_SHOW_NODES) {
              this.layerViewOptionalFunctions._nodeDebugVisualizer.show(node, this._crsIndex, "yellow"); // loading node data
            }

            if (this._lodHandling.shouldLoadNode(node, nodeParent))
            {

              if (DBG) {
                console.debug("_processNodeIndexDocument, shouldLoadNode true for "+node.id);
              }

              var nodeSw = this._lodHandling.lodSwapBuildInfoForNode(node);

              if (this.layerViewRequiredFunctions.isOverMemory()) {
                promiseLoaded.done();
                return false;
              }


              this._modifyNumNodesLoading(1);

              var bundles = [];
              for (var bundleNr=0; bundleNr<node.featureData.length; bundleNr++) {
                var alreadyLoadedToStage = this.layerViewRequiredFunctions.isBundleAlreadyAddedToStage(node, bundleNr);
                var alreadyLoaded = alreadyLoadedToStage.alreadyLoaded;
                var wasPartiallyHidden = alreadyLoadedToStage.wasPartiallyHidden;
                if (alreadyLoaded && !wasPartiallyHidden) {
                  continue;
                }
                bundles.push(bundleNr);
              }

              this.queueAnimationFrameFunctionCall(this._nodeLoader.loadNodeData,
                this._nodeLoader, [node, bundles, promiseLoaded, this.layerViewOptionalFunctions.getTexturePrefetchFunctions!=null, nodeSw],undefined,1);

              promiseLoaded.then(
                function(){
                  this._modifyNumNodesLoading(-1);
                }.bind(this),function(){
                  this._modifyNumNodesLoading(-1);
                }.bind(this));

              return promiseLoaded;
            }
          } else {
            var getLoadedAttributes = this.layerViewOptionalFunctions.getLoadedAttributes;
            var loadedAttributes = getLoadedAttributes != null ? getLoadedAttributes(node) : undefined;
            // check if the loadedAttributes object is still the same as the current
            // reuiredAttributes object. (changing the renderer creates a new object).
            if (loadedAttributes != null && loadedAttributes !== this._requiredAttributes)
            {
              var nodeURL = I3SUtil.getNodeURL(this.getBaseUrl(), node.id);
              this._nodeLoader.loadAttributes(node, nodeURL, this._requiredAttributes).then(function (attributeData) {
                this.layerViewOptionalFunctions.setAttributeData(node, this._requiredAttributes, attributeData);
              }.bind(this), function(error) {
                // the attribute data failed to load. set to empty, with the requiredAttributes set so we don't reload.
                this.layerViewOptionalFunctions.setAttributeData(node, this._requiredAttributes, {});
              }.bind(this));
            }

            //make sure we remove nodes after a cancel()
            if (this._lodHandling.shouldLoadNode(node, nodeParent))
            {
              nodeSw = this._lodHandling.lodSwapBuildInfoForNode(node);
              //TODO: fix only works for whole node replace. how to fix for swap?
              if (nodeSw && nodeSw.swapPairs==null) {
                this._lodHandling.lodSwapBundleLoaded(node, null, nodeSw);
              }
            }

            if (this._nodeDebugVisualizer!=null && DBG_SHOW_NODES) {
              this._nodeDebugVisualizer.show(node, this._crsIndex, "grey"); // node already displayed
            }
          }
        } else if (this._nodeDebugVisualizer!=null && DBG_SHOW_NODES) {
          this._nodeDebugVisualizer.show(node, this._crsIndex, "blue"); // node has no features
        }

        promiseLoaded.done();
        return promiseLoaded;
      },

      _bundleLoadedCallback: function(node, allGeometryData, attributeDataInfo, store, promiseLoaded, preloadedDomImages, bundleNr, lodSwapToRemove) {

        this._lodHandling.lodSwapBundleLoaded(node, allGeometryData,lodSwapToRemove);
        this.layerViewRequiredFunctions.addBundle(node, allGeometryData, attributeDataInfo, store, promiseLoaded, preloadedDomImages, bundleNr);

        if (this.layerViewOptionalFunctions.setPolygonOffset!=null) {
          var po = this._lodHandling.shouldSetPolygonOffset(node);
          if (po) {
            this.layerViewOptionalFunctions.setPolygonOffset(node,po);
          }
        }
      }
      
    });

    

    return I3SOnDemandController;
  });
