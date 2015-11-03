/*jslint browser: true, continue: true, eqeq: true, nomen: true, plusplus: true, regexp: true, unparam: true, sloppy: true, todo: true, vars: true, white: true */
/*global define */
/* jshint forin: false */

define(
  [
    "../../../core/declare",
    "dojo/promise/all",
    "dojo/_base/lang",

    "./GraphicsLayerView3D",
    "./i3s/I3SUtil",
    "../support/projectionUtils",
    "../lib/glMatrix",
    "../../../geometry/Point",
    "../../../geometry/Polyline",
    "../../../geometry/Polygon",
    "../../../Graphic",

    "../support/PromiseLightweight"
  ],
  function(
    declare, all, lang,
    GraphicsLayerView3D, I3SUtil, projectionUtils, glMatrix, Point, Polyline, Polygon, Graphic,
    PromiseLightweight
    ) {

    var DBG_LODSWITCH = false;
    var DBG_NODE_STATUS_VIS = false;
    var DBG_NODE_ID = false;

    var SceneGraphicsLayerView3D = declare(GraphicsLayerView3D, {
      declaredClass: "esri.views.3d.layers.SceneGraphicsLayerView3D",
      constructor: function (properties) {
        this.nodesAddedToStage={};
      },

      getGraphicsFromStageObject: function(stageObject, triangleNr) {
        var promise = new PromiseLightweight.Promise();

        if (this._graphicsCollection) {
          var graphicId = stageObject.getMetadata().graphicId;
          var objectIdField = this._getObjectIdField();
          var companionLayer = this.layer._companionFeatureLayer;

          var graphicFound = this._graphicsCollection.some(function(graphic) {
            if (graphic.id === graphicId) {
              if (graphic._attributesQueried) {
                promise.resolve(graphic);
              }
              else {
                if (graphic.attributes && (graphic.attributes[objectIdField] != null)) {
                  var featureId = graphic.attributes[objectIdField];
                  I3SUtil.queryAttributesFromFeatureLayer(companionLayer, featureId).then(
                    function(attributes) {
                      lang.mixin(graphic.attributes, attributes);
                      graphic._attributesQueried = true;
                      promise.resolve(graphic);
                    },
                    function(err) {
                      promise.reject(err);
                    }
                  );
                }
                else {
                  promise.reject(new Error("No feature ID found on selected graphic."));
                }
              }
              return true;
            }
          });

          if (!graphicFound) {
            promise.reject(new Error("No graphic found for selected geometry."));
          }
        }
        else {
          promise.reject(new Error("Graphics layer view not yet initialized."));
        }

        return promise;
      },

      //override from GraphicsLayerView3D
      _initGraphicsController: function() {

        if (DBG_NODE_STATUS_VIS) {
          this._nodeDebugVisualizer = I3SUtil.makeNodeDebugVisualizer(this._stage,
            this.view.renderCoordsHelper, this.idHint);
          window._nodeDebugVisualizer = this._nodeDebugVisualizer;
        }

        var requiredFunctions = {
          addBundle: this._addBundle.bind(this),
          isBundleAlreadyAddedToStage: this._isBundleAlreadyAddedToStage.bind(this),
          isOverMemory: this._isOverMemory.bind(this),
          removeNodeData: this._removeNodeData.bind(this),
          removeFeatures: this._removeFeatures.bind(this),
          getAddedFeatures: this._getAddedFeatures.bind(this),
          areAllBundlesLoaded: this._areAllBundlesLoaded.bind(this),
          wholeNodeSwitchEnabled: true
        };

        var optionalFunctions = {
          traversalOptions: {
            initDepthFirst:false,
            neighborhood:false,
            perLevelTraversal: true,
            allowPartialOverlaps: false,
            errorMetricToUse: "screenSpaceRelative",
            elevationInfo: this.layer.elevationInfo
          },
          getAllAddedFeatures: this._getAllAddedFeatures.bind(this),
          _nodeDebugVisualizer: this._nodeDebugVisualizer,
          getLoadedAttributes: this.getLoadedAttributes.bind(this),
          setAttributeData: this.setAttributeData.bind(this),
          nodeElevationUpdate: this.nodeElevationUpdate.bind(this)
        };

        var graphicsControllerPromise = this.layer.createGraphicsController({layerView: this, layerViewRequiredFunctions: requiredFunctions, layerViewOptionalFunctions:optionalFunctions});
        all([this, graphicsControllerPromise, this.layer]).then(
          function(data) {
            this._graphicsCollection = this.layer.graphics;
            this._graphicsCollectionEventHandle =
              this._graphicsCollection.on("change", this._collectionChangeHandler.bind(this));
            // add initial graphics
            this.add(this._graphicsCollection.getAll());
          }.bind(this)
        );
      },

      _evaluateUpdatingState: function() {
        //handled by i3sOnDemandController
      },

      _getAllAddedFeatures: function() {
        var nodesFeatures = {};
        for (var gIdx in this.graphics) {
          var graphic = this.graphics[gIdx];
          var features = graphic._features;
          var nodeId = graphic._nodeId;
          nodesFeatures[nodeId] = features;
        }
        return nodesFeatures;
      },
      _addBundle: function(node, allGeometryData, attributeDataInfo, store, promiseLoaded, preloadedDomImages, bundleNr) {

        if (DBG_LODSWITCH) {
          console.log("_bundleLoadedCallback "+node.id+" bundleNr "+bundleNr);
        }


        if (DBG_NODE_STATUS_VIS===true && this._nodeDebugVisualizer!=null) {
          var color = "grey";
          switch (node.level) {
            case 1: color = "red";break;
            case 2: color = "green";break;
            case 3: color = "blue";break;
            case 4: color = "yellow";break;
            case 5: color = "magenta";break;
            case 6: color = "brown";break;
          }

          this._nodeDebugVisualizer.show(node, this._controller._crsIndex, color);
        }

        var sr = this._controller.get("crsIndex");

        var featuresWithGraphics = [];

        var objectIdField = this._getObjectIdField();

        if (this.nodesAddedToStage[node.id]==null) {
          this.nodesAddedToStage[node.id] = {
            bundles: [],
            attributeData: attributeDataInfo ? attributeDataInfo.attributeData : null,
            loadedAttributes: attributeDataInfo ? attributeDataInfo.loadedAttributes : null
            };
        }
        this.nodesAddedToStage[node.id].bundles[bundleNr] = featuresWithGraphics;

        if (allGeometryData==null) {
          if (promiseLoaded != null) {
            promiseLoaded.done();
          }
          return;
        }

        for (var i=0; i<allGeometryData.length; i++) {
          var geometryData = allGeometryData[i];
          var centerPos = geometryData.featureDataPositions[0];

          for (var geomIdx = 0; geomIdx<geometryData.geometries.length; geomIdx++) {
            var addedGraphics = [];

            var featureIdx = (geomIdx < geometryData.features.length) ? geomIdx : 0,
              feature = geometryData.features[featureIdx];

            var attributes = (feature || DBG_NODE_ID) ? {} : null;
            if (feature) {
              attributes[objectIdField] = feature.id;
            }
            if (DBG_NODE_ID) {
              attributes.DBG_NODE_ID = node.id;
            }

            var geomData =   geometryData.geometries[geomIdx];
            var type = geomData.params.type;
            var an = geomData.params.vertexAttributes.position;

            if (geomData.type==="ArrayBufferView") {
              var geometryArrayBuffer = store[node.geometryData[bundleNr].hrefConcat];
              if (an==null) {
                continue;
              }
              var TypedArrayClass = I3SUtil.valueType2TypedArrayClassMap[an.valueType];
              var positionsArray =  new TypedArrayClass(geometryArrayBuffer, an.byteOffset, an.count * an.valuesPerElement);
              var vpe = an.valuesPerElement;
            }
            else if (geomData.type==="Embedded") {
              positionsArray = an;
              vpe = 3;
            }

            var geo, posIdx;

            if (type==="lines") {
              var path = [];
              for (posIdx=0; posIdx<positionsArray.length; posIdx+=vpe) {
                path.push([positionsArray[posIdx]+node.mbs[0],positionsArray[posIdx+1]+node.mbs[1]]);
              }
              geo = new Polyline(sr);
              geo.addPath(path);
              addedGraphics.push(new Graphic(geo, null, attributes));
            }
            else if (type==="points"){
              for (posIdx=0; posIdx<positionsArray.length; posIdx+=vpe) {
                geo = new Point({
                  x: positionsArray[posIdx]+centerPos[0],
                  y: positionsArray[posIdx+1]+centerPos[1],
                  z: (vpe>2)?positionsArray[posIdx+2]+centerPos[2]:undefined,
                  spatialReference: sr
                });

                addedGraphics.push(new Graphic(geo, null, attributes));
              }
            }
            else if (type==="polygon"){
              path = [];
              geo = new Polygon(sr);
              geo._outlineSegments = [];
              for (var ringIdx=0; ringIdx<geomData.params.rings.length; ringIdx++) {
                var ring = geomData.params.rings[ringIdx];
                var offset = ring.start;
                var ringPositions = [];
                var outlineSegments = [];
                var currentOutlineSegment = [-1,-1];
                for (var segmentIdx = 0; segmentIdx<ring.segments.length; segmentIdx+=2) {
                  var segmentType = ring.segments[segmentIdx+0];
                  var segmentLength = ring.segments[segmentIdx+1];
                  // segments with type=2 (==cut) are skipped for polygon outline rendering
                  // consecitive types 1 and 2 are combined
                  if (segmentType===0||segmentType===1) {
                    if (currentOutlineSegment[0] === -1) {
                      currentOutlineSegment[0] = offset-ring.start;
                    }
                    currentOutlineSegment[1] = offset+segmentLength-ring.start;
                  }
                  else {
                    if (currentOutlineSegment[0] !== -1) {
                      outlineSegments.push(currentOutlineSegment);
                      currentOutlineSegment = [-1, -1];
                    }
                  }
                  for (posIdx=offset*vpe; posIdx<(offset+segmentLength)*vpe; posIdx+=vpe) {
                    ringPositions.push([positionsArray[posIdx]+node.mbs[0],positionsArray[posIdx+1]+node.mbs[1]]);
                  }
                  offset+=segmentLength;
                }
                if (currentOutlineSegment[0]!=-1) {
                  outlineSegments.push(currentOutlineSegment);
                }
                geo._outlineSegments.push(outlineSegments);
                geo.addRing(ringPositions);
                if (ring.inner!=null) {
                  console.warn("inner rings not yet supported");
                }
              }
              addedGraphics.push(new Graphic(geo, null, attributes));
            }

            for (var graphicIdx = 0; graphicIdx < addedGraphics.length; graphicIdx++) {
              var graphic = addedGraphics[graphicIdx];
              graphic._attributesQueried = false;
              if (DBG_LODSWITCH) {
                graphic._features = geometryData.features;
                graphic._nodeId = node.id;
              }
            }
            this.layer.add(addedGraphics);

            featuresWithGraphics.push({features:geometryData.features, graphics:addedGraphics});
          }
        }

        // Copy attribute data to individual graphics
        var nodeData = this.nodesAddedToStage[node.id];
        this._setBundleAttributes(nodeData.bundles[bundleNr], nodeData.loadedAttributes, nodeData.attributeData);

        promiseLoaded.done();
      },

      _areAllBundlesLoaded:function(node, ignoreHiding) {
        var nodeStage = this.nodesAddedToStage[node.id];
        if (nodeStage==null) {
          return false;
        }

        var findFeatureId = function(bundle, featureId) {
          var fgIdx = bundle.length;
          while (fgIdx--) {
            var features=bundle[fgIdx].features;
            var f2Idx = features.length;
            while (f2Idx--) {
              if (features[f2Idx].id===featureId){
                return true;
              }
            }
          }
          return false;
        };

        for (var i=0; i<node.featureData.length; i++)
        {
          var bundle = nodeStage.bundles[i];
          if (bundle==null) {
            return false;
          }

          if (ignoreHiding===true) {
            continue;
          }

          var frStart = node.featureData[i].featureRange[0];
          var frEnd = node.featureData[i].featureRange[1];
          for (var fIdx=frStart; fIdx<=frEnd; fIdx++) {
            if (node.features==null || node.features.length<fIdx) {
              continue;
            }
            var featureId = node.features[fIdx].id;
            var found = findFeatureId(bundle, featureId);            
            if (found===false) {
              return false;
            }
          }
        }
        return true;
      },

      _isBundleAlreadyAddedToStage: function(node, bundleIdx) {
        if (this.nodesAddedToStage[node.id]==null)
        {
          return {alreadyLoaded:false, wasPartiallyHidden:false};
        }
        var loaded = this.nodesAddedToStage[node.id].bundles[bundleIdx];
        return {alreadyLoaded:loaded, wasPartiallyHidden:false};
      },

      _isOverMemory: function(){
        return false;
      },
      _removeFeatures:function(node, features) {

        if (DBG_LODSWITCH) {
          console.log("_removeFeatures "+node.id+" features "+features);
        }

        var n = this.nodesAddedToStage[node.id];
        if (n==null) {
          return;
        }
        var b = n.bundles;
        for (var bIdx in b) {
          for (var fgIdx=0; fgIdx<b[bIdx].length; fgIdx++) {
            var featuresWithGraphics=b[bIdx][fgIdx];
            var found = false;
            if (featuresWithGraphics==null) {
              continue;
            }
            for (var f2Idx in featuresWithGraphics.features) {
              if (features.indexOf(featuresWithGraphics.features[f2Idx].id)!==-1) {
                found = true;
                break;
              }
            }
            if (found) {
              this.layer.remove(featuresWithGraphics.graphics);
              delete b[bIdx][fgIdx];
            }
          }
        }

        //anything left?
        for (bIdx = 0; bIdx < b.length; bIdx++) {
          for (fgIdx = 0; fgIdx < b[bIdx].length; fgIdx++) {
            featuresWithGraphics = b[bIdx][fgIdx];
            if (featuresWithGraphics!=null && featuresWithGraphics.graphics.length>0) {
              return;
            }
          }
        }

        this._removeNodeData(node);
      },


      _removeNodeData: function(node) {
        if (DBG_LODSWITCH) {
          console.log("_removeNodeData "+node.id);
        }

        var n = this.nodesAddedToStage[node.id];
        if (n==null) {
          return;
        }
        var b = n.bundles;
        for (var bIdx in b) {
          for (var fgIdx in b[bIdx]) {
            this.layer.remove(b[bIdx][fgIdx].graphics);
          }
        }
        delete this.nodesAddedToStage[node.id];
      },

      _rendererChange: function(newValue, oldValue, prop, target) {
        this._symbolCreationContext.renderer = newValue;

        // Delete all data to force a reload. This is a really brute-force approach.
        // TODO: Update graphics for each node in setAttributeData.
        Object.keys(this.nodesAddedToStage).forEach(function(nodeid) {
          this._removeNodeData({id:nodeid});
        }.bind(this));
      },

      _shouldAddToSpatialIndex: function() {
        return false;
      },

      nodeElevationUpdate: function(nodeId, aabb, srAabb) {
        var n = this.nodesAddedToStage[nodeId];
        if (n==null) {
          return;
        }
        var b = n.bundles;
        for (var bIdx in b) {
          for (var fgIdx in b[bIdx]) {
            var graphics = b[bIdx][fgIdx].graphics;
            for (var gIdx in graphics)
            {
              this._markGraphicElevationDirty(graphics[gIdx].id);
            }
          }
        }
      },

      _getAddedFeatures: function(nodeId) {
        var n = this.nodesAddedToStage[nodeId];
        if (n==null) {
          return null;
        }
        var b = n.bundles;
        var f = [];
        for (var bIdx in b) {
          for (var fgIdx = 0; fgIdx < b[bIdx].length; fgIdx++) {
            var featuresWithGraphics = b[bIdx][fgIdx];
            f = f.concat(featuresWithGraphics.features);
          }
        }
        return f;
      },
      
      getLoadedAttributes: function (node) {
        var n = this.nodesAddedToStage[node.id];
        if (n)
        {
          return n.loadedAttributes;
        }
      },

      setAttributeData: function (node, loadedAttributes, attributeData) {
        var n = this.nodesAddedToStage[node.id];
        if (n) {
          n.loadedAttributes = loadedAttributes;
          n.attributeData = attributeData;

          this._setNodeAttributes(n, attributeData, loadedAttributes);

          if (this.layerLabelsEnabled()) {
            this._showLabelsChange();
          }
        }
      },
      
      _setNodeAttributes: function(nodeData, attributeData, loadedAttributes) {
        var bundles = nodeData.bundles;

        for (var bIdx in bundles) {
          var bundle = bundles[bIdx];
          this._setBundleAttributes(bundle, loadedAttributes, attributeData);
        }
      },

      _setBundleAttributes: function(bundle, loadedAttributes, attributeData) {
        // For each featuresWithGraphics
        for (var fgIdx = 0; fgIdx < bundle.length; fgIdx++) {
          var featuresWithGraphics = bundle[fgIdx];
          // For each graphics
          for (var gIdx = 0; gIdx < featuresWithGraphics.graphics.length; ++gIdx) {
            var graphic = featuresWithGraphics.graphics[gIdx];
            // Reset and copy all attributes
            if (!graphic.attributes) {
              graphic.attributes = {};
            }
            if (loadedAttributes) {
              for (var attrIdx = 0; attrIdx < loadedAttributes.length; ++attrIdx) {
                var attribute = loadedAttributes[attrIdx].name;
                graphic.attributes[attribute] = attributeData[attribute][fgIdx];
              }
            }
          }
        }
      },

      _getObjectIdField: function() {
        return this.layer.objectIdField || "OBJECTID";
      },

      _updateSuspendResumeExtent: function() {
        if (this.layer.fullExtent && this._mapSR) {
          if (!this._suspendResumeExtent) {
            this._suspendResumeExtent = glMatrix.vec4d.create();
          }

          var srcExtent = this.layer.fullExtent;
          if (!projectionUtils.extentToBoundingRect(srcExtent, this._suspendResumeExtent, this._mapSR)) {
            this._suspendResumeExtent = null;
          }
        }
        else {
          this._suspendResumeExtent = null;
        }

        this._frustumVisibilityDirty = true;
        this._scaleVisibilityDirty = true;
        this._suspendResumeExtentEngineDirty = true;
      },

      /** Statistics for debugging */
      getStats: function() {
        var stats = this.inherited(arguments);
        stats.nodesAddedToStage = Object.keys(this.nodesAddedToStage).length;
        return stats;
      }
  });

    return SceneGraphicsLayerView3D;

  });
