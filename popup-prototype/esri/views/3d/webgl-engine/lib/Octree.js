/* jshint bitwise:false */
define(["./Util"],
function (Util) {
  var assert = Util.assert;

  return function Octree(rootSize, rootCenter, config) {
    var minNodeRadius = 1;

    rootSize *= 0.5; // convert to "radius"
    rootCenter = rootCenter || [0, 0, 0];
    config = config || {};
    config.maxObjectsInNode = config.maxObjectsInNode || 10;
    config.minBSRadius = config.minBSRadius || 1; // objects with smaller bounding sphere radius
      // will be treated as if they were this big to prevent deep (or even infinite) recursion
      // with small objects close to each other

// child indexing:
//   +-----+-----+
//   |  2  |  3  |
//   |   |   |
//y  +-----+-----+
//   |  0  |  1  |
//   |   |   |
//   +-----+-----+
// 0     x
// analogously for +z with 4, 5, 6, 7

    function createNode() {
      return {
        leafObjects: [], // objects that would fit in a child node if node was split
        fixedObjects: [],  // objects that will not fit in any children
        children: new Array(8)
      };
    }
    var root = createNode();
    this._getRoot = function() { return root; };

    var getRootSize = this.getRootSize = function() {
      return rootSize*2;
    };
    
    var tmpRootCenter = [0, 0, 0];
    var getRootCenter = this.getRootCenter = function() {
      tmpRootCenter[0] = rootCenter[0];
      tmpRootCenter[1] = rootCenter[1];
      tmpRootCenter[2] = rootCenter[2];
      return tmpRootCenter;
    };

    var shouldAddToFixedObjects = function(obj) {
      //todo: zero-sized objects are added to fixedObjects. Is this still a good idea with lots of points in plp?
      var objRadius = obj.getBSRadiusApprox();
      return objRadius===0.0;
    };
    
    this.addObject = function(obj) {
      var objCenter = obj.getCenter();
      var objRadius = obj.getBSRadiusApprox();
      if (!shouldAddToFixedObjects(obj) && fitsInRootBounds(objCenter, objRadius)) {
        insertObjectRec(obj, objCenter, objRadius, root, getRootSize(), getRootCenter());
      } else {
        root.fixedObjects.push(obj);
      }
    };

    this.removeObject = function(obj) {
      var objCenter = obj.getCenter();
      var objRadius = obj.getBSRadiusApprox();
      return removeObjectRec(obj, objCenter, objRadius, root, getRootSize(), getRootCenter());
    };

    this.updateObject = function(obj, oldBBData) {
      if (removeObjectRec(obj, oldBBData.center, oldBBData.bsRadius, root, getRootSize(), getRootCenter())) {
        this.addObject(obj);
        return true;
      }
      return false;
    };

    // callback(obj)
    this.forEachObjectInBB = function(bbLow, bbHigh, callback) {
      forEachObjectInBBRec(root, getRootSize(), getRootCenter(), {bbLow: bbLow, bbHigh: bbHigh, callback: callback});
    };

    // o: ray origin, d: ray direction, callback(obj)
    this.forEachObjectAlongRay = function(o, d, callback) {
      forEachObjectAlongRayRec(root, getRootSize(), getRootCenter(), {o: o, d: d, callback:callback});
    };

    // callback(center, niceRadius, actualRadius, fixedObjects, leafObjects)
    this.forEachNode = function(callback) {
      forEachNodeRec(root, getRootSize(), getRootCenter(), {callback: callback});
    };

    this.computeStats = function() {
      var result = {
        leafObjects: 0,
        fixedObjects: 0,
        leafNodes: 0,
        innerNodes: 0,
        nodesWithMoreThan10FixedObjects: 0,
        nodesWithMoreThan30FixedObjects: 0,
        nodesWithMoreThan100FixedObjects: 0,
        maxDepth: 0
      };

      gatherStatsRec(root, 0, result);
      result.totalNumObjects = result.leafObjects + result.fixedObjects;
      result.totalNumNodes = result.leafNodes + result.innerNodes;
      result.estimatedMemUsage = 200*result.totalNumNodes + 4*result.totalNumObjects;

      return result;
    };

    this.debugDump = function () {
      return debugDumpNodeRec(root);
    };

    this.validate = function() {
      return validateRec(root, getRootSize(), getRootCenter());
    };

    function gatherStatsRec(node, level, result) {
      result.maxDepth = Math.max(level, result.maxDepth);
      var numFixedObjects = node.fixedObjects.length;
      result.fixedObjects += numFixedObjects;
      if (numFixedObjects > 10) {
        result.nodesWithMoreThan10FixedObjects++;
      }
      if (numFixedObjects > 30) {
        result.nodesWithMoreThan30FixedObjects++;
      }
      if (numFixedObjects > 100) {
        result.nodesWithMoreThan100FixedObjects++;
      }

      if (node.leafObjects) {
        result.leafNodes++;
        result.leafObjects += node.leafObjects.length;
      } else {
        result.innerNodes++;
        for (var i = 0; i < 8; i++) {
          if (node.children[i]) {
            gatherStatsRec(node.children[i], level + 1, result);
          }
        }
      }
    }

    function debugDumpNodeRec(node) {
      function getObjId(obj) { return obj.getId(); }
      var dump = {};
      if (node.leafObjects && node.leafObjects.length > 0) {
        dump.leafs = node.leafObjects.map(getObjId);
      }
      if (node.fixedObjects && node.fixedObjects.length > 0) {
        dump.fixed = node.fixedObjects.map(getObjId);
      }

      for (var i = 0; i < 8; i++) {
        if (node.children[i]) {
          dump["child" + i] = debugDumpNodeRec(node.children[i]);
        }
      }
      return dump;
    }

    function validateRec(node, nodeRadius, nodeCenter) {
      if (node !== root) {
        assert(!nodeEmpty(node), "Octree validation failed (dangling empty node)");
      }

      var nodeBBMin = [nodeCenter[0] - nodeRadius, nodeCenter[1] - nodeRadius, nodeCenter[2] - nodeRadius];
      var nodeBBMax = [nodeCenter[0] + nodeRadius, nodeCenter[1] + nodeRadius, nodeCenter[2] + nodeRadius];

      var allObjs = node.fixedObjects.slice();
      if (node.leafObjects) {
        allObjs.push.apply(allObjs, node.leafObjects);
      } else {
        forEachChild(node, nodeRadius, nodeCenter, validateRec, {});
      }

      if (node !== root) {
        for (var i=0; i < allObjs.length; i++) {
          var objCenter = allObjs[i].getCenter();
          var objRadius = allObjs[i].getBSRadiusApprox();

          for (var d = 0; d < 3; d++) {
            assert((objCenter[d] - objRadius >= nodeBBMin[d]) &&
                 (objCenter[d] + objRadius <= nodeBBMax[d]),
              "Octree validation failed (object outside node bounds)");
          }
        }
      }
      return true;
    }

    function insertObjectRec(obj, objCenter, objRadius, node, nodeRadius, nodeCenter) {
      if (!shouldAddToFixedObjects(obj) && fitsInAnyChildNode(objRadius, nodeRadius)) {
        if (node.leafObjects) {
          node.leafObjects.push(obj);
          if ((node.leafObjects.length > config.maxObjectsInNode) && (0.5*nodeRadius > minNodeRadius)) {
            splitNode(node, nodeRadius, nodeCenter);
          }
        } else {
          insertAsChild(obj, objCenter, objRadius, node, nodeRadius, nodeCenter);
        }
      } else {
        node.fixedObjects.push(obj);
      }
    }

    function insertAsChild(obj, objCenter, objRadius, node, nodeRadius, nodeCenter /* will be clobbered*/) {
      var childNodeIdx = determineSubNode(objCenter, nodeRadius, nodeCenter);
      if (!node.children[childNodeIdx]) {
        node.children[childNodeIdx] = createNode();
      }
      insertObjectRec(obj, objCenter, objRadius, node.children[childNodeIdx], nodeRadius*0.5, nodeCenter);
    }

    function splitNode(node, nodeRadius, nodeCenter) {
      var childNodeCenter = new Array(3);
      for (var i = 0; i < node.leafObjects.length; i++) {
        childNodeCenter[0] = nodeCenter[0];
        childNodeCenter[1] = nodeCenter[1];
        childNodeCenter[2] = nodeCenter[2];
        var childObj = node.leafObjects[i];
        insertAsChild(childObj, childObj.getCenter(), childObj.getBSRadiusApprox(), node, nodeRadius, childNodeCenter);
      }
      node.leafObjects = undefined;
    }

    function removeObjectRec(obj, objCenter, objRadius, node, nodeRadius, nodeCenter) {
      if (!shouldAddToFixedObjects(obj)&&fitsInAnyChildNode(objRadius, nodeRadius)) {
        if (node.leafObjects) {
          return removeFromArray(node.leafObjects, obj);
        } else {
          var childNodeIdx = determineSubNode(objCenter, nodeRadius, nodeCenter);
          if (node.children[childNodeIdx]) {
            if (removeObjectRec(obj, objCenter, objRadius, node.children[childNodeIdx], nodeRadius*0.5, nodeCenter)) {
              if (nodeEmpty(node.children[childNodeIdx])) {
                delete node.children[childNodeIdx];
              }
              return true;
            }
          }
          return false;
        }
      } else {
        return removeFromArray(node.fixedObjects, obj);
      }
    }

    function removeFromArray(array, obj) {
      var idx = array.indexOf(obj);
      if (idx < 0) {
        return false;
      }
      array.splice(idx, 1);
      return true;
    }

    function forEachObjectInBBRec(node, nodeRadius, nodeCenter, params) {
      // check if node overlaps with given BB
      if (node !== root) {
        for (var i = 0; i < 3; i++) {
          if ((params.bbLow[i] > nodeCenter[i] + nodeRadius) || (params.bbHigh[i] < nodeCenter[i] - nodeRadius)) {
            return true;
          }
        }
      }

      node.fixedObjects.forEach(params.callback);

      if (node.leafObjects) {
        node.leafObjects.forEach(params.callback);
      } else {
        forEachChild(node, nodeRadius, nodeCenter, forEachObjectInBBRec, params);
      }

      return true;
    }

    var tmpBMin = [0,0,0];
    var tmpBMax = [0,0,0];
    function forEachObjectAlongRayRec(node, nodeRadius, nodeCenter, params) {
      // check if node is intersected by ray
      if (node !== root) {
        tmpBMin[0] = nodeCenter[0] - nodeRadius;
        tmpBMin[1] = nodeCenter[1] - nodeRadius;
        tmpBMin[2] = nodeCenter[2] - nodeRadius;
        tmpBMax[0] = nodeCenter[0] + nodeRadius;
        tmpBMax[1] = nodeCenter[1] + nodeRadius;
        tmpBMax[2] = nodeCenter[2] + nodeRadius;
        if (!Util.rayBoxTest(params.o, params.d, tmpBMin, tmpBMax)) {
          return true;
        }
      }

      node.fixedObjects.forEach(params.callback);

      if (node.leafObjects) {
        node.leafObjects.forEach(params.callback);
      } else {
        forEachChild(node, nodeRadius, nodeCenter, forEachObjectAlongRayRec, params);
      }

      return true;
    }

    function forEachNodeRec(node, nodeRadius, nodeCenter, params) {
      params.callback(nodeCenter, nodeRadius*0.5, nodeRadius, node.fixedObjects, node.leafObjects ? node.leafObjects : []);

      forEachChild(node, nodeRadius, nodeCenter, forEachNodeRec, params);
      return true;
    }

    function fitsInRootBounds(objCenter, objRadius) {
      var rootSizeExt = rootSize * 1.5;
      if ((objCenter[0] + objRadius > rootCenter[0] + rootSizeExt) ||
        (objCenter[0] - objRadius < rootCenter[0] - rootSizeExt)) {
        return false;
      }
      if ((objCenter[1] + objRadius > rootCenter[1] + rootSizeExt) ||
        (objCenter[1] - objRadius < rootCenter[1] - rootSizeExt)) {
        return false;
      }
      return !((objCenter[2] + objRadius > rootCenter[2] + rootSizeExt) ||
        (objCenter[2] - objRadius < rootCenter[2] - rootSizeExt));
    }

    function fitsInAnyChildNode(objRadius, nodeRadius) {
//      var objBBMin = obj.getBBMin();
//      var objBBMax = obj.getBBMax();
//      var looseNodeRadius = nodeRadius * 1.5;
//
//      return (objBBMin[0] > nodeCenter[0] - looseNodeRadius) && (objBBMax[0] < nodeCenter[0] + looseNodeRadius)
//        && (objBBMin[1] > nodeCenter[1] - looseNodeRadius) && (objBBMax[1] < nodeCenter[1] + looseNodeRadius)
//        && (objBBMin[2] > nodeCenter[2] - looseNodeRadius) && (objBBMax[2] < nodeCenter[2] + looseNodeRadius);
      return objRadius <= nodeRadius*0.25;
    }

    function determineSubNode(objCenter, nodeRadius, nodeCenter /*nodeCenter is both input and output param! */) {
      var childNodeIdx = 0;
      var childNodeOffset = nodeRadius * 0.25;

      if (nodeCenter[0] < objCenter[0]) {
        childNodeIdx = 1;
        nodeCenter[0] += childNodeOffset;
      } else {
        nodeCenter[0] -= childNodeOffset;
      }

      if (nodeCenter[1] < objCenter[1]) {
        childNodeIdx |= 2;
        nodeCenter[1] += childNodeOffset;
      } else {
        nodeCenter[1] -= childNodeOffset;
      }

      if (nodeCenter[2] < objCenter[2]) {
        childNodeIdx |= 4;
        nodeCenter[2] += childNodeOffset;
      } else {
        nodeCenter[2] -= childNodeOffset;
      }

      return childNodeIdx;
    }

    function forEachChild(node, nodeRadius, nodeCenter, func, params) {
      var childNodeRadius = nodeRadius * 0.5;
      var childNodeOffset = childNodeRadius * 0.5;
      var childNodeCenter = new Array(3);
      for (var i = 0; i < 8; i++) {
        if (node.children[i]) {
          childNodeCenter[0] = nodeCenter[0] + ((i&1) ? childNodeOffset : -childNodeOffset);
          childNodeCenter[1] = nodeCenter[1] + ((i&2) ? childNodeOffset : -childNodeOffset);
          childNodeCenter[2] = nodeCenter[2] + ((i&4) ? childNodeOffset : -childNodeOffset);
          if (!func(node.children[i], childNodeRadius, childNodeCenter, params)) {
            return false;
          }
        }
      }
      return true;
    }

    function nodeEmpty(node) {
      if (node.leafObjects) {
        if (node.leafObjects.length > 0) {
          return false;
        }
      } else {
        for (var i=0; i < 8; i++) {
          if (node.children[i]) {
            return false;
          }
        }
      }
      return node.fixedObjects.length === 0;
    }
  };
});