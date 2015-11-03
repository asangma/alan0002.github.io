/* jshint forin:false */

define(["../../../../core/declare"],
  function (declare) {

    var DBG_LODSWITCH = false;
    var DBG_PERNODESWITCH = false;

    /*
       Currently two lod approaches are implemented:

       a) Swapping: Before loading node data, determine which existing nodes or features it should replace. Then, when node data arrives, perform swap.
          functions called _lodSwap* implement this.

       b) Global: Whenever node data is added or removed, _lodGlobalDirty is set to true. This causes a global traversal over all nodes in the next frame,
          removing unmatching nodes.
          functions called _lodGlobal* implement this.


     */

    return declare(null, {

      startNodeLoading: function(layerViewRequiredFunctions, layerViewOptionalFunctions, _nodeIsVisible, _nodeTraversalState, _lodMode, _nodeIndex, visibleNodes, _rootId) {
        this.layerViewRequiredFunctions = layerViewRequiredFunctions;
        this.layerViewOptionalFunctions = layerViewOptionalFunctions;
        this._lodGlobalDirty=false;
        this._lodMode = _lodMode;



        this._lodSwapNodeIndex = {};
        this._lodSwapFeatureLookup = {};
        this._lodSwapRootFeatureLookup = {};
        this._lodGlobalDirty = false;
        this._nodeIndex = _nodeIndex;
        this._rootId = _rootId;

        this._nodeTraversalState = _nodeTraversalState;
        this._nodeIsVisible = _nodeIsVisible;

        if (DBG_LODSWITCH) {
          console.debug("_removeInvisibleNodes started");
        }

        if (this._lodMode === "swap") {
          for (var nodeId in visibleNodes) {
            var node = visibleNodes[nodeId];
          if (this._nodeTraversalState(node.id).nodeHasLOD && !this._nodeTraversalState(node.id).isChosenLod)
            {
              if (DBG_LODSWITCH) {
                console.debug("_removeInvisibleNodes: added node " + node.id + " to swap index");
              }
              this._lodSwapNodeIndex[nodeId] = node;
            }
          }
          this._lodSwapBuildUnmatchingFeatureLookups();
        }

      },

      cancelNodeLoading: function() {
        this._lodSwapNodeIndex = {};
      },

      shouldLoadNode: function(node, nodeParent) {

        var ts = this._nodeTraversalState(node.id);
        var hasLod = ts.nodeHasLOD;
        var isChosenLod = ts.isChosenLod;

        if (this._lodMode!="perLevel") {
          return (isChosenLod || !hasLod);
        }
        else {

          if (isChosenLod || !hasLod) {
            return true;
          }

          var subTrees = false;

          if (!this.layerViewOptionalFunctions.traversalOptions.allowPartialOverlaps){
            subTrees = this._allSubtreesIncomplete(node);
          }
          else {
            subTrees = this._someSubtreesIncomplete(node);
          }

          if (DBG_LODSWITCH) {
            console.debug("subTrees "+node.id+ " "+subTrees);
          }

          if (subTrees) {
            return true;
          }
          return false;

        }
      },
      shouldSetPolygonOffset: function(node) {
        if (this._lodMode==="perLevel") {
          return !this._nodeTraversalState(node.id).isChosenLod;
        }
        return false;
      },

      _allSubtreesIncomplete: function(node) {

        var isInStage = this.layerViewRequiredFunctions.areAllBundlesLoaded(node);
        if (isInStage) {
          return false;
        }
        var acc = true;
        if (node.children != null && node.children.length>0) {
          for (var i = 0; i < node.children.length; ++i) {
            var childRef = node.children[i];
            if (!this._nodeIsVisible(childRef)) {
              continue;
            }
            var childNode = this._nodeIndex[childRef.id];
            acc = acc && (childNode==null || this._allSubtreesIncomplete(childNode));
          }
        }
        return acc;
      },
      _someSubtreesIncomplete: function(node) {

        var isInStage = this.layerViewRequiredFunctions.areAllBundlesLoaded(node);
        if (isInStage) {
          return false;
        }
        var acc = false;
        if (node.children != null && node.children.length>0) {
          for (var i = 0; i < node.children.length; ++i) {
            var childRef = node.children[i];
            if (!this._nodeIsVisible(childRef)) {
              continue;
            }
            var childNode = this._nodeIndex[childRef.id];
            acc = acc || (childNode==null || this._allSubtreesIncomplete(childNode));
          }
        }
        return acc;
      },

      setLodGlobalDirty: function() {
        this._lodGlobalDirty = true;
      },
      finishedLevel: function(level) {
        if (this._lodMode==="perLevel") {
          this._deleteUpToLevelRecurse(level-1, 0, this._nodeIndex[this._rootId]);
        }
      },
      _deleteUpToLevelRecurse: function(maxLevel, curLevel, node) {
        if (node==null) {
          return;
        }
        if (curLevel>maxLevel) {
          return;
        }
        if (!this._nodeTraversalState(node.id).isChosenLod) {
          if (DBG_LODSWITCH) {
            console.debug("_deleteUpToLevelRecurse: removing node "+node.id);
          }
          this.layerViewRequiredFunctions.removeNodeData(node);
        }
        if (node.children != null) {
          for (var i = 0; i < node.children.length; ++i) {
            var childRef = node.children[i];
            this._deleteUpToLevelRecurse(maxLevel, curLevel+1, this._nodeIndex[childRef.id]);
          }
        }
      },
      lodSwapBundleLoaded: function(node, allGeometryData, lodSwapInformation) {

        if (DBG_LODSWITCH) {
          console.debug("lodSwapBundleLoaded "+node.id);
        }

        //handle lod swapping
        if (lodSwapInformation!=null) {

          if (lodSwapInformation.swapPairs!=null&& Object.keys(lodSwapInformation.swapPairs).length>0) {
            if (allGeometryData!=null) {
              var lodFeaturesToRemove = lodSwapInformation.swapPairs;

              var allFeatureIds = {};
              for (var i = 0; i < allGeometryData.length; i++) {
                var features = allGeometryData[i].features;

                for (var fIdx = 0; fIdx < features.length; fIdx++) {
                  allFeatureIds[features[fIdx].id] = true;
                }
              }

              for (var n in lodFeaturesToRemove) {

                var lodRem = lodFeaturesToRemove[n];
                var ftToRemove = [];
                var lodFeatures = lodRem.features;

                for (var lodFtIdx = 0; lodFtIdx < lodFeatures.length; lodFtIdx++) {
                  if (allFeatureIds[lodFeatures[lodFtIdx]] != null) {
                    ftToRemove.push(lodFeatures[lodFtIdx]);
                  }
                }

                this.layerViewRequiredFunctions.removeFeatures(lodRem.node, lodRem.features);
              }
            }
          }
          else
          {
            for (var nodeIdx in lodSwapInformation.nodesHigherInTree) {
              this.layerViewRequiredFunctions.removeNodeData(lodSwapInformation.nodesHigherInTree[nodeIdx]);
            }
            for (nodeIdx in lodSwapInformation.nodesDeeperInTree) {
              this.layerViewRequiredFunctions.removeNodeData(lodSwapInformation.nodesDeeperInTree[nodeIdx]);
            }

          }
        }

        this._lodGlobalDirty=true;
      },

      lodGlobalHandling: function () {
        if (this._lodMode==="global" && (this._lodGlobalDirty===true || this.layerViewRequiredFunctions.isOverMemory())) {

          //lod switching using per frame polling
          var rootId = this._rootId;
          if (rootId == null) {
            return;
          }
          if (DBG_PERNODESWITCH) {
            console.debug("****************** _perNodeLodHandling started *******************");
          }

          var rootRef = {id:rootId};
          this._lodGlobalHandlingRecursion(rootRef, this._nodeIndex, false, false, 0);

          //prevent states where more than two lod levels are shown.
          this._lodGlobalHandlingRecursionRemoveIntermediate(rootId, this._nodeIndex, false, 0);

          this._lodGlobalDirty=false;
        }

      },
      /*******************
       * Functions for lod swapping approach
       *******************/

      lodSwapBuildInfoForNode: function (node) {

        var wholeNodeReplace = true;

        if (DBG_LODSWITCH) {
          console.debug("lodSwapBuildInfoForNode: node "+node.id);
        }

        var hasLod = this._nodeTraversalState(node.id).nodeHasLOD;

        if (!hasLod) {
          return null;
        }

        if (this._lodMode==="swap") {
          var swapPairs = {};
          var nodesDeeperInTree = {};
          var nodesHigherInTree = {};
          var isDeeperInTree, isHigherInTree;

          //find nodes higher in tree
          var nodeTreeKey = node.id + "";

          for (var unmatchingLodNodeId in this._lodSwapNodeIndex) {
            var unmatchingLodNode = this._lodSwapNodeIndex[unmatchingLodNodeId];

            var addedFeatures = this.layerViewRequiredFunctions.getAddedFeatures(unmatchingLodNode.id);

            if (addedFeatures == null) {
              continue;
            }

            isDeeperInTree = (node.parentNode === null) || (unmatchingLodNode.id + "").indexOf(nodeTreeKey) === 0;
            isHigherInTree = (unmatchingLodNode.parentNode == null) || (nodeTreeKey).indexOf(unmatchingLodNode.id + "") === 0;

            if (isHigherInTree === true) {
              nodesHigherInTree[unmatchingLodNode.id] = unmatchingLodNode;
            }

            if (isDeeperInTree === true) {
              nodesDeeperInTree[unmatchingLodNode.id] = unmatchingLodNode;

              if (wholeNodeReplace) {
                continue;
              }

              for (var fIdx = 0; fIdx < addedFeatures.length; fIdx++) {
                if (swapPairs == null) {
                  swapPairs = {};
                }
                if (swapPairs[unmatchingLodNodeId] == null) {
                  swapPairs[unmatchingLodNodeId] = {features: [], node: unmatchingLodNode};
                }
                swapPairs[unmatchingLodNodeId].features.push(addedFeatures[fIdx]);
              }
            }
          }

          if (node.features != null && wholeNodeReplace === false) {
            for (var featureIdx in node.features) {
              var feature = node.features[featureIdx];

              if (feature.rootFeature != null) {

                var rfList = this._lodSwapRootFeatureLookup[feature.rootFeature];
                if (rfList != null) {
                  for (var rfIdx = 0; rfIdx < rfList.length; rfIdx++) {
                    var unmNf = rfList[rfIdx].node;
                    if (unmNf != null && (nodesDeeperInTree[unmNf.id] == null) && (nodesHigherInTree[unmNf.id] != null)) {
                      var unmNfId = unmNf.id;
                      if (swapPairs[unmNfId] == null) {
                        swapPairs[unmNfId] = {features: [], node: unmNf};
                      }
                      swapPairs[unmNfId].features.push(rfList[rfIdx].featureId);
                    }
                  }
                }

                var unmNode = this._lodSwapFeatureLookup[feature.rootFeature];
                if (unmNode != null && !nodesDeeperInTree[unmNode.id]) {
                  var nodeId = unmNode.id;
                  if (swapPairs[nodeId] == null) {
                    swapPairs[nodeId] = {features: [], node: unmNode};
                  }
                  swapPairs[nodeId].features.push(feature.rootFeature);
                }
              }
            }
          }


          if (DBG_LODSWITCH && wholeNodeReplace) {

            var nodesDeeperInTreeAll = {};
            var nodesHigherInTreeAll = {};

            for (var lodNodeId in this._nodeIndex) {
              var lodNode = this._nodeIndex[lodNodeId];

              addedFeatures = this.layerViewRequiredFunctions.getAddedFeatures(lodNodeId);

              if (addedFeatures == null) {
                continue;
              }

              isDeeperInTree = (node.parentNode === null) || (lodNodeId + "").indexOf(nodeTreeKey) === 0;
              isHigherInTree = (lodNode.parentNode == null) || (nodeTreeKey).indexOf(lodNodeId + "") === 0;

              if (isHigherInTree === true) {
                nodesHigherInTreeAll[lodNodeId] = lodNode;
              }

              if (isDeeperInTree === true) {
                nodesDeeperInTreeAll[lodNodeId] = lodNode;
              }
            }

            if ((Object.keys(nodesHigherInTreeAll).length != Object.keys(nodesHigherInTree).length) ||
              (Object.keys(nodesDeeperInTreeAll).length != Object.keys(nodesDeeperInTree).length)) {
              console.debug("!! mismatch node nodesInTreeAll vs nodesInTree from unmatchingLodNodeId");
            }
          }

          if (wholeNodeReplace) {
            if (DBG_LODSWITCH) {
              var s = "nodesHigherInTree: ";
              for (var swapPairIdx in nodesHigherInTree) {
                s += "[" + nodesHigherInTree[swapPairIdx].id + "], ";
              }
              s += " nodesDeeperInTree: ";
              for (swapPairIdx in nodesDeeperInTree) {
                s += "[" + nodesDeeperInTree[swapPairIdx].id + "], ";
              }
              console.debug("_lodSwapBuildInfoForNode: node " + node.id + ", swapPairs " + s);
            }

            return {nodesHigherInTree: nodesHigherInTree, nodesDeeperInTree: nodesDeeperInTree};
          }
          else {
            if (DBG_LODSWITCH && swapPairs) {
              s = "";
              for (swapPairIdx in swapPairs) {
                s += "[" + swapPairs[swapPairIdx].features + ", nodeId: " + swapPairs[swapPairIdx].node.id + "], ";
              }
              console.debug("_lodSwapBuildInfoForNode: node " + node.id + ", swapPairs " + s);
            }

            return {swapPairs: swapPairs};
          }
        }
        else if (this._lodMode==="perLevel") {
          if (this._nodeTraversalState(node.id).isChosenLod) {
            nodesDeeperInTree = {};
            this._getNodesRecurse(node, nodesDeeperInTree);
            return {nodesHigherInTree: null, nodesDeeperInTree: nodesDeeperInTree};
          }
        }

      },
      _getNodesRecurse: function(node, encounteredNodes) {
        if (node.children != null) {
          for (var i = 0; i < node.children.length; ++i) {
            var childRef = node.children[i];
            var childNode = this._nodeIndex[childRef.id];
            if (childNode==null) {
              continue;
            }
            encounteredNodes[childRef.id] = childNode;
            this._getNodesRecurse(childNode, encounteredNodes);
          }
        }
      },

      _lodSwapBuildUnmatchingFeatureLookups: function () {
        this._lodSwapFeatureLookup = {};
        this._lodSwapRootFeatureLookup = {};

        for (var unmatchingLodNodeId in this._lodSwapNodeIndex) {
          var unmatchingLodNode = this._lodSwapNodeIndex[unmatchingLodNodeId];

          var addedFeatures = this.layerViewRequiredFunctions.getAddedFeatures(unmatchingLodNode.id);

          if (addedFeatures == null) {
            continue;
          }

          for (var fIdx = 0; fIdx < addedFeatures.length; fIdx++) {
            var unmatchingLodFeature = addedFeatures[fIdx];

            this._lodSwapFeatureLookup[unmatchingLodFeature.id] = unmatchingLodNode;
            if (unmatchingLodFeature.rootFeature != null) {
              if (this._lodSwapRootFeatureLookup[unmatchingLodFeature.rootFeature] == null) {
                this._lodSwapRootFeatureLookup[unmatchingLodFeature.rootFeature] = [];
              }
              this._lodSwapRootFeatureLookup[unmatchingLodFeature.rootFeature].push({
                node: unmatchingLodNode,
                featureId: unmatchingLodFeature.id
              });
            }
          }
        }
      },


      _validateLodTreeVisibilities: function () {

        var f = this._layerViewOptionalFunctions.getAllAddedFeatures;
        if (f == null) {
          return;
        }
        var nodesFeatures = f();

        console.debug("validating lod tree: ");

        var encounteredFeatures = {};
        var encounteredRootFeatureIds = {};
        var passed = true;

        for (var nodeId in nodesFeatures) {
          var features = nodesFeatures[nodeId];

          for (var fIdx in features) {
            var feature = features[fIdx];

            if (encounteredFeatures[feature.id] != null && encounteredFeatures[feature.id] != nodeId) {
              console.debug("node " + nodeId + " !! encountered feature " + feature.id + " already in node " + encounteredFeatures[feature.id]);
              passed = false;
            }


            if (encounteredRootFeatureIds[feature.id] != null && encounteredRootFeatureIds[feature.id] != nodeId) {
              console.debug("node " + nodeId + " !! encountered feature " + feature.id + " already as rootFeature in node " + encounteredRootFeatureIds[feature.id]);
              passed = false;
            }

            encounteredFeatures[feature.id] = nodeId;

            if (feature.rootFeature != null && encounteredRootFeatureIds[feature.rootFeature] != nodeId) {
              if (encounteredRootFeatureIds[feature.rootFeature] != null) {
                console.debug("node " + nodeId + " !! encountered rootFeature " + feature.rootFeature + " already in node " + encounteredRootFeatureIds[feature.rootFeature]);
                passed = false;
              }

              if (encounteredFeatures[feature.rootFeature] != null) {
                console.debug("node " + nodeId + " !! encountered rootFeature " + feature.rootFeature + " already as feature");
                passed = false;
              }

              encounteredRootFeatureIds[feature.rootFeature] = nodeId;
            }


          }
        }
        return passed;
      },

      /*******************
       * Functions for global lod approach
       *******************/

      _lodGlobalHandlingRecursion: function (nodeRef, nodeIndex, higherNodeIsShown, higherNodeIsChosen,
                                             level) {

        var nodeId = nodeRef.id;
        var node = nodeIndex[nodeId];

        if (node == null) {
          var isVisible = nodeRef.mbs!=null?this._nodeIsVisible(nodeRef):false;
          var ret =  higherNodeIsChosen || !isVisible;
          if (DBG_PERNODESWITCH) {
            console.debug(new Array(level).join(" ")+"node==null id " + nodeId + " isComplete " + ret+ " higherNodeIsChosen "+higherNodeIsChosen+" isVisible "+isVisible );
          }
          return ret;
        }

        var ts = this._nodeTraversalState(nodeId);
        isVisible = this._nodeIsVisible(node);

        var isChosenLod = ts.isChosenLod;

        var isAddedToStage = this.layerViewRequiredFunctions.isBundleAlreadyAddedToStage(node, 0).alreadyLoaded;
        var subtreeComplete = true;

        if (node.children != null) {
          for (var i = 0; i < node.children.length; ++i) {
            var childRef = node.children[i];
            var childIsComplete = this._lodGlobalHandlingRecursion(childRef, nodeIndex,
              (isAddedToStage && isChosenLod) || higherNodeIsShown, isChosenLod || higherNodeIsChosen, level + 1);
            if (!childIsComplete) {
              subtreeComplete = false;
            }
          }
        }


        var overMem = this.layerViewRequiredFunctions.isOverMemory();

        if (isAddedToStage && !isChosenLod && ( (higherNodeIsChosen ? higherNodeIsShown : subtreeComplete) || overMem)) {
          this.setLodGlobalDirty();
          this.layerViewRequiredFunctions.removeNodeData(node);
          isAddedToStage = false;
          if (DBG_PERNODESWITCH) {
            console.debug(new Array(level).join(" ") + "**qeued node removal id " + node.id);
          }
        }

        if (isAddedToStage) {
          if (this.layerViewOptionalFunctions.setPolygonOffset) {
            //reduce z-fighting for concurrently loaded lods
            var po = !(isChosenLod && !higherNodeIsChosen);
            this.layerViewOptionalFunctions.setPolygonOffset(node, po);
          }
        }

        ret = subtreeComplete || isAddedToStage;

        if ((isChosenLod && isAddedToStage) ||
          !isVisible || higherNodeIsChosen) {
          ret = true;
        }

        if (isChosenLod && !isAddedToStage && isVisible) {
          ret = false;
        }

        if (DBG_PERNODESWITCH) {
          console.debug(new Array(level).join(" ") + "id " + node.id + " isComplete " + ret + " isVisible " + isVisible + " isAddedToStage " + isAddedToStage + " isChosenLod " + isChosenLod + " subtreeComplete " + subtreeComplete + " higherNodeIsShown " + higherNodeIsShown + " higherNodeIsChosen " + higherNodeIsChosen);
        }

        return ret;
      },


      _lodGlobalHandlingRecursionRemoveIntermediate: function (nodeId, nodeIndex, higherNodeIsShown,
                                                               level) {
        var node = nodeIndex[nodeId];
        if (node == null) {
          return;
        }
        var isAddedToStage = this.layerViewRequiredFunctions.isBundleAlreadyAddedToStage(node, 0).alreadyLoaded;

        var ts = this._nodeTraversalState(nodeId);
        var isChosenLod = ts.isChosenLod;

        if (node.children != null) {
          for (var i = 0; i < node.children.length; ++i) {
            var childRef = node.children[i];
            this._lodGlobalHandlingRecursionRemoveIntermediate(childRef.id, nodeIndex,
              (isAddedToStage) || higherNodeIsShown, level + 1);
          }
        }
        if (higherNodeIsShown && !isChosenLod && isAddedToStage) {
          this.layerViewRequiredFunctions.removeNodeData(node);
          this.setLodGlobalDirty();
        }
      }

    });
  }
);