Resources
=============

- [Knowledge Transfer Slides](https://esri.box.com/s/sp1lgp1alm2ewz99343l00j7hosd3a27)

- [Main I3S spec](https://devtopia.esri.com/Zurich-R-D-Center/i3s-spec/blob/master/format/Indexed%203d%20Scene%20Format%20Specification.md)

- [Entry point for layer docs](https://devtopia.esri.com/WebGIS/arcgis-3d-platform)
- [MP layer spec](https://devtopia.esri.com/WebGIS/arcgis-3d-object-layers), also [I3S spec meshpyramid profile]( https://devtopia.esri.com/Zurich-R-D-Center/i3s-spec/blob/master/profiles/meshpyramids/meshpyramids.md)

- [PLP LoD scheme](https://devtopia.esri.com/WebGIS/arcgis-3d-platform/blob/master/PointLayer/PLP LoD Scheme.md)
- [PLP point LoD details](https://devtopia.esri.com/WebGIS/arcgis-3d-platform/blob/master/PointLayer/LoD_for_point.md)

- Test caches: [Tab SceneLayer in google doc](https://docs.google.com/spreadsheets/d/1psZFYG1WBaX8M_8tppF1FOE5BngkBZlDoWMtwb-dCrc/edit)
- Local servers: [zrh-ser1](http://zrh-arcgis-ser1.esri.com/arcgis/rest/services/Hosted), [zrh-ser2](http://zrh-arcgis-ser2.esri.com/arcgis/rest/services/Hosted), [zrh-ser3](http://zrh-arcgis-ser3.esri.com/arcgis/rest/services/Hosted)

- [Spec repository](https://devtopia.esri.com/Zurich-R-D-Center/i3s-spec)
- [Validator repository](https://devtopia.esri.com/Zurich-R-D-Center/i3s-validator)

Implementation - Big picture
=============

For each i3s url, a SceneLayer is created in WebSceneLayers. SceneLayer then initializes _companionFeatureLayer.
Later, for each SceneLayer, a SceneLayerViewFactory is created in Layer.createLayerView.
This then creates either a SceneLayerView3D or SceneGraphicsLayerView3D based on the profile.

The view constructors call SceneLayer.createGraphicsController, which then creates a I3SOnDemandController.

![](https://devtopia.esri.com/WebGIS/arcgis-js-api/blob/4.0master/docs/I3S/i3sInitialize.png)

The I3S* objects are used to traverse the index tree (I3SIndexTraversal), decide which nodes to load based on LOD (I3SLodHandling), load all necessary node data (I3SNodeLoader) and then call
the corresponding functions in SceneLayerView3D or SceneGraphicsLayerView3D (using requiredFunctions) when data arrives. Everything is managed by I3SOnDemandController.

SceneLayerView3D is for the MeshPyramid and FeatureTree profile, while SceneGraphicsLayerView3D is for PLP layers.
SceneGraphicsLayerView3D and SceneLayerView3D consume I3S geometry bundles, and show them either as graphics or meshes.

![](https://devtopia.esri.com/WebGIS/arcgis-js-api/blob/4.0master/docs/I3S/i3sBigPictureSequenceDiagram.png)


Implementation Details for I3S*
=============

I3SOnDemandController:
-------------------
 
central point, initializes everything, handles events, starts/stops loading, handles work queues and calls lod handling in idle frames
 
* enables common node loading infrastructure for SceneLayerView3D and SceneGraphicsLayerView3D
    * those two layers provide requiredFunctions and optionalFunctions to I3SOnDemandController (essentially acting as an interface)
    * necessary because they have different behaviour on node loading
* I3SOnDemandController manages i3s traversal, index, node and bundle loading
* it calls requiredFunctions like addBundle during traversal
 
* constructor: initializes _streamDataSupplier
* has pointer to layerView, listens to "suspend" and "resume", which registers/deregisters idle frame workers
* idle frame workers: updateEventListenerWhileSuspended, updateEventListener, which pointo to _animationFrameHandler, _startNodeLoading, cancelNodeLoading and _needsAnimationFrameHandler

* _startNodeLoading always called after camera move and timeout
    * _initViewData inits all camera* dependent values
    * I3SNodeLoader and I3SIndexTraversal are recreated
    * _lodHandling.startNodeLoading initializes lod structures
* cancelNodeLoading clears all queues, stops I3SNodeLoader and I3SIndexTraversal
 
* provides queueAnimationFrameFunctionCall for async queing of idle frame work,  also used by SceneLayerView3D

* provides callbackfunctions
    * _processNodeIndexDocument used by I3SIndexTraversal
    * _removeNodeData used by SceneLayerView3D
    * _bundleLoadedCallback used by I3SNodeLoader
  
I3SIndexTraversal
-------------------

 * traverses the index nodes
 * traversalOptions: initDepthFirst, perLevelTraversal
 * queues nodes ordered according to camera distance
 
 * continueTraversal is called by I3SOnDemandController._animationFrameHandler
 * takes at most maxNumNodes element from queue, requests them using getNode
    * when they arrive, enqueues connected nodes
    * then calls I3SOnDemandController.processNodeIndexDocument
  
 
I3SNodeLoader
-------------------

* given an index node, loads all necesary feature, binary, texture, and shared data, and then calls I3SOnDemandController._bundleLoadedCallback for each completed geometry bundle
* supports loading without featureData (meshpyramid profile) using buildDefaultFeatureData and calcDefaultFeatureDataOffsets

* entry point: loadNodeData, called by I3SOnDemandController when a i3s index node arrives
    * first loads all shared data
    * if loading without feature* data calls buildDefaultFeatureData
    * otherwise, requests each featureData bundle
    * on each arriving feature data (or defaultFeatureData)
        * calls collectGeometries to get a list of {features, featureDataAttributes, featureDataPositions, geometries, faceRanges};
            * this resolves all GeometryReference and Embedded geometries
            * this is later called allGeometryData
        * request binary geometry data
        * prefetch textures using loadTextures. this ensures that geometry is only added when texture is there too
        * when all binary geometry data and textures arrive for a bundle (promiseArrayJoined.then)
            * when MP: calcDefaultFeatureDataOffsets reads header and features from binary geometry bundle, adds it to collectedGeometries
            * queue a function call in I3SOnDemandController, this later calls I3SOnDemandController._bundleLoadedCallback


I3SLodHandling
-------------------

* enables common lod handling for SceneLayerView3D and SceneGraphicsLayerView3D

* supports different traversal strategies: swap, global and per_level
   * per_level: always complete one level before starting next. Don't skip levels.
       * uses finishedLevel, _deleteUpToLevelRecurse, also lodSwapBuildInfoForNode
   * global: after every added/removed node, a complete recursion is performed over all nodes, deciding which ones to remove
       * uses _lodGlobalHandlingRecursion and _lodGlobalHandlingRecursionRemoveIntermediate, also lodSwapBuildInfoForNode
   * swap: the most fine* grained method, used for featureTree profile. Lod is decided per node, but features are swapped individually as they are loaded
       * uses _lodSwapBuildUnmatchingFeatureLookups and lodSwapBuildInfoForNode

* shouldLoadNode calculates lod decision per node according to the current strategy and camera
    * called by I3SOnDemandController whenever an index node was loaded

* if the node should be loaded, I3SOnDemandController calls I3SLodHandling.lodSwapBuildInfoForNode
    * here, according to the strategy it is determined what to swap out (nodes or features), when this node is loaded
    * this lodSwapInformation is passed through as a parameter to I3SNodeLoader.loadNodeData, and passed further when a bundle is loaded
* lodSwapBundleLoaded is called by I3SOnDemandController whenever a geometry bundle was loaded
    * swaps out data based on the lodSwapInformation which is passed through from lodSwapToRemove which was set
 

Implementation Details for Layer Views
=============


SceneGraphicsLayerView3D
-------------------

* _initGraphicsController:
    * collect all callback functions for I3SOnDemandController in requiredFunctions and optionalFunctions
    * createGraphicsController to create an I3SOnDemandController

* _bundleLoadedCallback: Called by I3SNodeLoader when a geometry bundle is loaded completely
    * for all geometries in allGeometryData
        * create ArrayBufferView or get embedded position
        * based on type, create point, line, or polygon graphic

* based on the lod type, I3SOnDemandController calls _removeFeatures or _removeNodeData when nodes or features should be removed

* isBundleAlreadyAddedToStage: for a given index node and bundle id, is it already in the engine?
* _getAddedFeatures is used by I3SOnDemandController to query what is already in the view during _removeInvisibleNodes

 
SceneLayerView3D
-------------------

* initialize
    *  _initGraphicsController
    * init metadata to keep track of what is shown: _nodeId2Meta, _matId2Meta, _texId2Meta
    * add layer watches: renderer, opacity
    * _addThisLayerToStage

* isBundleAlreadyAddedToStage, _getAddedFeatures, _areAllBundlesLoaded: use _nodeId2Meta to determine what is in the stage

* _addBundle
    * already in stage? unhide and return
    * init _nodeId2Meta
    * for all {geometries, features, featureDataAttributes} in allGeometryData
        * for all geometries
            * _createVertexAndIndexArrays(geometry, geometryArrayBuffer)
            *  _createEngineMats - _createEngineMaterial
            * reprojectPoints
            * _calculateNormals
            * create stage geometry
        * add metadata: graphics, i3sNode, faceRanges, featureIds
        * create Object3D
    * add all objects to stage
    * promiseLoaded.done()

* _setObjectSymbology(obj)
    * for all graphics (can be dummy graphics just with attributes)
        * _getRenderingInfo
        * get color
        * store in faceRangeColors
    * obj.setFacerangeColors
        * changes color vertexAttributes
    * update transparency

* for picking: getFaceRangeFromTriangleNr
* for framing: calcFacerangeBoundingSphere, validateBoundingData

* remove data: _hideFeatures, _removeFeatures, _removeNodeDataFromStage

* getGraphicsFromStageObject: use attributes either from object metadata (filled in addBundle), companion layer or featureData document to create graphics

* _updateAllTextureLOD: Texture LOD handling (independent of other LOD!), called in _startNodeLoading
    * for all texMeta in _texId2Meta: _updateTextureLOD
        * _calcDesiredTextureLOD
        * needs to swap?
            * determine url
            * request image from streamDataSupplier
                * async: _textureImageLoaded
                * create and add stage texture
                * replace texure in engine mats

