define([
  "./PerformanceTimer",
  "./gl-matrix"
  ], function (PerformanceTimer, glMatrix) {

  var vec3d = glMatrix.vec3d;
  var mat4d = glMatrix.mat4d;

  var DEFAULT_TOLERANCE = 1e-5;

  function Result(p0, p1) {
    this.normal = vec3d.create();
    this.init(p0, p1);
  }

  Result.prototype.getIntersectionPoint = function(intersectionPoint) {
    if (this.dist === undefined) {
      return false;
    }

    vec3d.lerp(this.p0, this.p1, this.dist, intersectionPoint);
    return true;
  };

  Result.prototype.set = function(object, name, dist, normal, priority, center, geometryId, triangleNr) {
    this.dist = dist;
    vec3d.set(normal, this.normal);
    this.object = object;
    this.name = name;
    this.priority = priority;
    this.center = center;
    this.geometryId = geometryId;
    this.triangleNr = triangleNr;
  };

  Result.prototype.setIntersector = function(intersector) {
    this.intersector = intersector;
  };

  Result.prototype.init = function(p0, p1) {
    this.dist = undefined;
    this.object = undefined;
    this.name = undefined;
    this.priority = undefined;
    this.center = null;
    this.geometryId = null;
    this.triangleNr = null;
    this.intersector = "stage";
    this.p0 = p0;
    this.p1 = p1;
  };

  function Selector(layers, objectIds, p0, p1, point, camera, tolerance, isSelection) {
    this.dir = vec3d.create();

    this.normalDir = null;

    this.minResult = new Result(p0, p1);
    this.maxResult = new Result(p0, p1);

    this.timer = new PerformanceTimer(1);

    this.invertedM = mat4d.create();

    this.intersectObject = this.intersectObject.bind(this);
    this.init(layers, objectIds, p0, p1, point, camera, tolerance, isSelection);

    this.mode = "intersect";
  }

  Selector.prototype.init = function(layers, objectIds, p0, p1, point, camera, tolerance, isSelection) {
    if (p0 && p1) {
      vec3d.subtract(p1, p0, this.dir);
    }

    this.minResult.init(p0, p1);
    this.maxResult.init(p0, p1);
    this.numObjectsTested = 0;

    this.point = point;
    this.camera = camera;
    this.isSelection = isSelection;
    this.layers = layers;
    this.objectIds = objectIds;
    this.p0 = p0;
    this.p1 = p1;
    this.hudResults = [];

    if (tolerance == null) {
      tolerance = DEFAULT_TOLERANCE;
    }

    this.tolerance = tolerance;

    if (this.objectIds) {
      // TODO: current Set shim doesn't support initialization through constructor. this code could be
      // replaced with "objectIdSet = new Set(objectIds);" otherwise
      this.objectIdSet = new Set();

      for (i = 0; i < this.objectIds.length; i++) {
        this.objectIdSet.add(this.objectIds[i]);
      }
    } else {
      this.objectIdSet = null;
    }

    if (this.layers) {
      this.timer.start();

      for (var h = 0; h < this.layers.length; ++h) {
        var layer = this.layers[h];

        var spatialAccelerator = layer.getSpatialQueryAccelerator ? layer.getSpatialQueryAccelerator() : undefined;

        if (spatialAccelerator) {
          spatialAccelerator.forEachObjectAlongRay(this.p0, this.dir, this.intersectObject);
        } else {
          var layerObjects = layer.getObjects();

          for (var i = 0, length = layerObjects.length; i < length; ++i) {
            this.intersectObject(layerObjects[i]);
          }
        }
      }

      this.timer.stop();

      this.performanceInfo = {
        queryDuration: this.timer.getLast(),
        numObjectsTested: this.numObjectsTested
      };
    }
  };

  Selector.prototype.getDirection = function() {
    if (!this.normalDir) {
      this.normalDir = vec3d.create();
      vec3d.normalize(this.dir, this.normalDir);
    }

    return this.normalDir;
  };

  var tmpCombinedTrafo = mat4d.create();
  var pp0 = vec3d.create();
  var pp1 = vec3d.create();

  Selector.prototype.intersectObject = function(object) {
    if (this.objectIdSet && !this.objectIdSet.has(object.getId())) {
      return;
    }

    this.numObjectsTested++;

    var id = object.getId();
    var geoRecords = object.getGeometryRecords();
    var objTrafo = object.getObjectTransformation();
    var combinedTrafo = tmpCombinedTrafo;


    for (var i = 0; i < geoRecords.length; i++) {
      var geometry = geoRecords[i].geometry;
      var geometryId = geometry.getId();
      var geomaterials = geoRecords[i].materials;

      mat4d.set(objTrafo, combinedTrafo);
      mat4d.multiply(combinedTrafo, geoRecords[i].transformation);

      mat4d.inverse(combinedTrafo, this.invertedM);
      mat4d.multiplyVec3(this.invertedM, this.p0, pp0);
      mat4d.multiplyVec3(this.invertedM, this.p1, pp1);

      for (var j = 0, numGroups = geometry.getNumGroups(); j < numGroups; ++j) {
        geomaterials[j].intersect(geometry, j, combinedTrafo, this.point, this.p0, this.p1, pp0, pp1, this.camera, this.tolerance, function(distance, normal, triangleNr, priority, hudMaterial) {
          if (distance >= 0.0) {
            
            // store all hudmaterials and sort later
            if (hudMaterial) {
              var hudResult = new Result();
              hudResult.set(object, id, distance, normal, priority, object.getCenter(), geometryId, triangleNr);
              this.hudResults.push(hudResult);
            }
            else {
              if(this.minResult.priority === undefined || priority >= this.minResult.priority) {
                if (this.minResult.dist === undefined || distance < this.minResult.dist) {
                  this.minResult.set(object, id, distance, normal, priority, null, geometryId, triangleNr);
                 }
              }

              if (this.maxResult.priority === undefined || priority >= this.maxResult.priority) {
                if (this.maxResult.dist === undefined || distance > this.maxResult.dist) {
                  this.maxResult.set(object, id, distance, normal, priority, null, geometryId, triangleNr);
                }
              }

            }

          }

        }.bind(this), this.isSelection);
      }
    }
  };

  Selector.prototype.getMinResult = function() {
    return this.minResult;
  };

  Selector.prototype.getMaxResult = function() {
    return this.maxResult;
  };

  Selector.prototype.getHudResults = function() {
    return this.hudResults;
  };

  Selector.DEFAULT_TOLERANCE = DEFAULT_TOLERANCE;

  return Selector;
});
