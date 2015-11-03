/* jshint forin: false*/
define(["./I3SUtil",
  "../../support/PromiseLightweight",
  "../../webgl-engine/lib/es6-shim",
  "../../lib/glMatrix",
  "./GoogPriorityQueue" ], function (I3SUtil, promise,
                                     es6_shim_,
                                     glMatrix,
                                     GoogPriorityQueue) {
  // This class implements the algorithms described here:
  // https://devtopia/Zurich-R-D-Center/i3s-spec/wiki/Node-loading-strategy

  var DBG_SHOW_QUEUED = false;
  var DBG_LEVEL_TRAVERSAL = false;

  return function I3SIndexTraversal(
      baseURL, startNodeUrl, rootId, poi, nodeIndex,
      streamDataSupplier, viewportQueries, processNodeIndexDocument, finishedLevelCallback,
      debugVis, warningEvent, _addTrailingSlash, _traversalOptions) {

    var knownNodes = new Set();
    var goog = GoogPriorityQueue.goog;
    var queues = [];
    var queueTraversalEnabled = false;
    var cancelled = false;

    var isVisible = viewportQueries.isNodeVisible;
    var isTooHighLOD = viewportQueries.isTooHighLOD;
    var isChosenLOD = viewportQueries.isChosenLod;
    var hasLOD = viewportQueries.hasLOD;
    var distToPOI = viewportQueries.distToPOI;

    var engineSR = viewportQueries.engineSR;

    var vec3d = glMatrix.vec3d;
    var enginePos = vec3d.create();

    var numIndicesLoading = 0;
    var dataLoadingPerLevel = [];

    var initPromise;
    var rootUrl;

    var currentLevel = 0;

    var traversalOptions = _traversalOptions || {initDepthFirst:true, neighborhood:true, perLevelTraversal: false};
    
    this.start = function() {

      this._nodeTraversalState = {};
      this._nodeIsVisibleCached = {};

      dataLoadingPerLevel = [];
      currentLevel = 0;

      rootUrl = I3SUtil.concatUrl(baseURL, startNodeUrl);
      if (_addTrailingSlash) {
        rootUrl = I3SUtil.addTrailingSlash(rootUrl);
      }

      if (traversalOptions.initDepthFirst) {
        initPromise = new promise.Promise();
        getNode(rootUrl, rootId, initQueryCallback.bind(this));
        initPromise.then(function () {
          if (cancelled) {
            return;
          }
          queueTraversalEnabled = true;
        });
      }
      else {
        enqueue(0, {id: rootId, hrefConcat: rootUrl}, 0);
        queueTraversalEnabled = true;
      }
    };

    function initQueryErrback()
    {
      initPromise.done();
    }

    this.continueTraversal = function(_maxNumNodes) {
      
      if (!queueTraversalEnabled) {
        return;
      }

      var maxNumNodes =  _maxNumNodes==null?5:_maxNumNodes;

      var _this = this;

      for (var qIdx=0; qIdx<queues.length; qIdx++) {

        if (traversalOptions.perLevelTraversal && currentLevel!=qIdx) {
          continue;
        }

        var queue = queues[qIdx];
        while (maxNumNodes-- >0 && !queue.isEmpty()) {
          (function (level){
            var nodeRef = queue.dequeue();
            dataLoadingPerLevel[level]++;
            var decrement =  function() { dataLoadingPerLevel[level]--; };

            getNode(nodeRef.hrefConcat, nodeRef.id,
              function(href, node)
              {
                if (node.parentNode==null) {
                  _this.nodeTraversalState(node.id);
                  _this.enqueueConnected(href, node, undefined, level);
                  processNodeIndexDocument(node, undefined).then(decrement, decrement);
                }
                else
                {
                  //for lod selection, we always need the parent node
                  concatHref(node.parentNode, href);
                  getNode(node.parentNode.hrefConcat, node.parentNode.id,
                    function(hrefParent, nodeParent)
                    {
                      _this.nodeTraversalState(node.id);
                      _this.enqueueConnected(href, node, nodeParent, level);
                      processNodeIndexDocument(node, nodeParent).then(decrement, decrement);
                    }
                  );
                }
              },
              decrement);
          }(qIdx));
        }

        if (traversalOptions.perLevelTraversal && queue.isEmpty() && dataLoadingPerLevel[qIdx]===0) {
          if (DBG_LEVEL_TRAVERSAL) {
            console.debug("finished level "+currentLevel);
          }
          finishedLevelCallback(currentLevel);
          currentLevel++;
        }
      }
      
    };

    this.isQueueTraversalEnabled = function() {
      return queueTraversalEnabled;
    };

    this.getQueueSize = function() {
      var s = 0;
      for (var qIdx=0; qIdx<queues.length; qIdx++) {
        s+=queues[qIdx].getCount();
      }
      return s;
    };

    this.cancel = function() {
      queueTraversalEnabled = false;
      for (var qIdx=0; qIdx<queues.length; qIdx++) {
        queues[qIdx].clear();
      }
      cancelled = true;
    };

    this.isLoading = function() {
      return (numIndicesLoading > 0) || (this.getQueueSize()>0);
    };



    this.nodeIsVisible = function(nodeRef) {
      if (this._nodeIsVisibleCached[nodeRef.id]!=null) {
        return this._nodeIsVisibleCached[nodeRef.id];
      }
      this._nodeIsVisibleCached[nodeRef.id]=isVisible(nodeRef);
      return this._nodeIsVisibleCached[nodeRef.id];
    };

    this.nodeTraversalState = function(nodeId) {
      if (this._nodeTraversalState[nodeId]!=null) {
        return this._nodeTraversalState[nodeId];
      }

      var node = nodeIndex[nodeId];
      if (node==null) {
        return null;
      }

      var nodeParent = null;

      var isTooHighLodParent = null;
      if (node.parentNode!=null) {
        nodeParent = nodeIndex[node.parentNode.id];
        if (nodeParent==null) {
          return null;
        }
        var tsParent = this._nodeTraversalState[nodeParent.id];
        if (tsParent!=null) {
          isTooHighLodParent = tsParent.nodeIsTooHighLOD;
        }
      }

      var nodeHasLOD =  hasLOD(node);
      var nodeIsTooHighLOD = isTooHighLOD(node);
      var isChosenLod = isChosenLOD(node, nodeParent, nodeIsTooHighLOD, isTooHighLodParent);

      this._nodeTraversalState[node.id] = {visited:true, nodeHasLOD:nodeHasLOD, nodeIsTooHighLOD:nodeIsTooHighLOD,
        isChosenLod: isChosenLod};

      return this._nodeTraversalState[nodeId];
    };

    // *********************************************************************************************************
    // ** Generic traversal functions

    function getNode(nodeURL, nodeID, callback, errBack) {
      // checks nodeIndex if node is present and executes callback immediately if so.
      // otherwise it requests download of the node, callback will be executed once data arrives.
      numIndicesLoading++;
      if (nodeIndex[nodeID]) {
        callback(nodeURL, nodeIndex[nodeID]);
        numIndicesLoading--;
      } else {
        streamDataSupplier.request(nodeURL, "json").then(function (url, node) {

          nodeIndex[node.id] = node;
          callback(url, node);
          numIndicesLoading--;
        }, function (err) {
          if (errBack != null) {
            errBack(err);
          }
          loadErrorCallback(err);
          numIndicesLoading--;
        }, this);
      }
    }

    // *********************************************************************************************************
    // ** Initial depth-first query for leaf node that is closest to POI

 
    function initQueryCallback(url, node) {
      if (cancelled) {
        initPromise.done();
        return;
      }

      this.nodeTraversalState(node.id);
      this.enqueueConnected(url, node);
      if (isLeafNode(node)) {
        initPromise.done();
      } else {
        var minDist = 1000000000;
        var minChildRef;
        for (var i = 0; i < node.children.length; ++i) {
          var childRef = node.children[i];
          if (this.nodeIsVisible(childRef)) {
            if (hasLOD(node) && isTooHighLOD(node)) {
              continue;
            }
            var d = distToPOI(childRef, poi);
            if (d < minDist) {
              minDist = d;
              minChildRef = childRef;
            }
          }
        }
        if (minChildRef) {
          var pathComb = I3SUtil.concatUrl(url, minChildRef.href);
          if (_addTrailingSlash) {
            pathComb = I3SUtil.addTrailingSlash(pathComb);
          }
          getNode(pathComb, minChildRef.id, initQueryCallback.bind(this), initQueryErrback);
        }
        else {
          initPromise.done();
        }
      }
    }

    function isLeafNode(node) {
      return node.children==null;
    }

    function concatHref(nodeRef, parentNodeUrl) {
      nodeRef.hrefConcat = I3SUtil.concatUrl(parentNodeUrl, nodeRef.href);
      if (_addTrailingSlash)
      {
        nodeRef.hrefConcat = I3SUtil.addTrailingSlash(nodeRef.hrefConcat);
      }

    }

    // *********************************************************************************************************
    // ** Enqueing connected nodes (neighbors, childs, parents)

    function enqueue(key, value, level) {

      if (!traversalOptions.perLevelTraversal) {
        level = 0;
      }

      knownNodes.add(value.id);
      while (queues.length<=level) {
        queues.push(new goog.structs.PriorityQueue());
        dataLoadingPerLevel.push(0);
      }
      queues[level].enqueue(key, value);
      if (DBG_SHOW_QUEUED && debugVis) {
        debugVis.show(value, "brown");
      }
    }

    this.enqueueConnected=function(url, node, nodeParent, currentLevel) {
      if (cancelled) {
        return;
      }

      if (node==null) {
        return;
      }

      var nts = this.nodeTraversalState(node.id);

      if ((node.id !== rootId) && (node.parentNode!=null && !knownNodes.has(node.parentNode.id))) {
        concatHref(node.parentNode, url);
        enqueue(distToPOI(node.parentNode, poi), node.parentNode, currentLevel-1);
      }
      else if ((node.id === rootId) && (!knownNodes.has(node.id))&&this.nodeIsVisible(node)) {
        node.hrefConcat = url;
        enqueue(distToPOI(node, poi), node, currentLevel);
      }

      var nodeRef;
      for ( var childIdx in node.children) {
        nodeRef = node.children[childIdx];
        var childIsVisible =  this.nodeIsVisible(nodeRef);
        if (!knownNodes.has(nodeRef.id) && (!nts.nodeHasLOD||!nts.nodeIsTooHighLOD) && childIsVisible) {
          concatHref(nodeRef, url);
          enqueue(distToPOI(nodeRef, poi), nodeRef, currentLevel+1);
        }
      }
      if (traversalOptions.neighborhood) {
        for (var neighborIdx in node.neighbors) {
          nodeRef = node.neighbors[neighborIdx];
          var neighborIsVisible = this.nodeIsVisible(nodeRef);
          if (!knownNodes.has(nodeRef.id) && neighborIsVisible) {
            concatHref(nodeRef, url);
            enqueue(distToPOI(nodeRef, poi), nodeRef, currentLevel);
          }
        }
      }
    };

    // *********************************************************************************************************
    // ** Utility functions
    function loadErrorCallback(url) {
      console.log("Error loading " + url);
      if (rootUrl===url)
      {
        warningEvent("Error loading root node " + url,1);
      }
    }
  };
});
