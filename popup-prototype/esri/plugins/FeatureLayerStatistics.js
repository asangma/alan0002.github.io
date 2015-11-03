define([
  "dojo/_base/lang",
  "dojo/_base/array",
  "../core/declare",
  "dojo/Deferred",
  "dojo/on",
  "dojo/promise/all",
  "dojo/when",
    
  "../config",
  "../geometry/SpatialReference",
    
  "../tasks/support/Query",
  "../tasks/support/StatisticDefinition",
  "../tasks/GenerateRendererTask",
  "../tasks/support/UniqueValueDefinition",
  "../tasks/support/ClassBreaksDefinition",
  "../tasks/support/GenerateRendererParameters",
  "../tasks/support/generateRenderer",
  "../tasks/GeometryService",
  "../tasks/support/ProjectParameters",
  
  "../layers/support/TileInfo",
  "../layers/support/HeatmapManager",
  
  "../workers/heatmapCalculator",
  
  "../geometry/support/mathUtils",
  "../geometry/support/webMercatorUtils",
  "../geometry/Point",
  "../geometry/Extent"
], 
function(
  lang, array, declare, Deferred, on, all, when,
  esriConfig, SpatialReference,
  Query, StatDefinition,  GRTask, UVDefinition, CBDefinition, GRParameters, generateRenderer, GeometryService, ProjParams,
  TileInfo, HMManager, HMCalculator,
  mathUtils, webMercatorUtils, Point, Extent
) {
  
  var calcIntensityMatrix = HMCalculator.prototype._calculateIntensityMatrix,
      calcHeatmapStats = HMCalculator.calculateStats,
      getScreenPoints = HMManager.prototype._getScreenPoints;
  
  ////////////////////
  // Module value
  ////////////////////
  
  var FeatureLayerStatistics = declare(null, {
    
    declaredClass: "esri.plugins.FeatureLayerStatistics",
    
    sampleSize: 500,
    generalizeForScale: 4000 * 100, // scale corresponds to 105 meter resolution.
    generalizeForResolution: 105, // meters
    mapWidth: 1280,  // pixels - assumed width of map control
    mapHeight: 800,  // pixels - assumed height of map control
    minDistance: 12, // pixels - based on typical marker of size 8px, outline 1px and buffer 2px between points
    minLength: 30,   // pixels - length of a decent looking line
    minSize: 15,     // pixels - minimum size of a polygon that is not obstructed by its outline.
    minPixels: 15,   // pixels
    samplingThreshold: 20000,
    numBins: 10,
    numClasses: 5,
    classificationMethod: "equal-interval",
    standardDeviationInterval: 1,
    geometryServiceUrl: window.location.protocol + "//utility.arcgisonline.com/arcgis/rest/services/Geometry/GeometryServer",
    
    // TileInfo copied from:
    // http://services.arcgisonline.com/arcgis/rest/services/World_Street_Map/MapServer
    tileInfo: new TileInfo({
      "rows": 256,
      "cols": 256,
      "dpi": 96,
      "format": "JPEG",
      "compressionQuality": 90,
      "origin": {
        "x": -2.0037508342787E7,
        "y": 2.0037508342787E7
      },
      "spatialReference": {
        "wkid": 102100,
        "latestWkid": 3857
      },
      "lods": [
        { "level": 0,  "resolution": 156543.03392800014,  "scale": 5.91657527591555E8 },
        { "level": 1,  "resolution": 78271.51696399994,   "scale": 2.95828763795777E8 },
        { "level": 2,  "resolution": 39135.75848200009,   "scale": 1.47914381897889E8 },
        { "level": 3,  "resolution": 19567.87924099992,   "scale": 7.3957190948944E7 },
        { "level": 4,  "resolution": 9783.93962049996,    "scale": 3.6978595474472E7 },
        { "level": 5,  "resolution": 4891.96981024998,    "scale": 1.8489297737236E7 },
        { "level": 6,  "resolution": 2445.98490512499,    "scale": 9244648.868618 },
        { "level": 7,  "resolution": 1222.992452562495,   "scale": 4622324.434309 },
        { "level": 8,  "resolution": 611.4962262813797,   "scale": 2311162.217155 },
        { "level": 9,  "resolution": 305.74811314055756,  "scale": 1155581.108577 },
        { "level": 10, "resolution": 152.87405657041106,  "scale": 577790.554289 },
        { "level": 11, "resolution": 76.43702828507324,   "scale": 288895.277144 },
        { "level": 12, "resolution": 38.21851414253662,   "scale": 144447.638572 },
        { "level": 13, "resolution": 19.10925707126831,   "scale": 72223.819286 },
        { "level": 14, "resolution": 9.554628535634155,   "scale": 36111.909643 },
        { "level": 15, "resolution": 4.77731426794937,    "scale": 18055.954822 },
        { "level": 16, "resolution": 2.388657133974685,   "scale": 9027.977411 },
        { "level": 17, "resolution": 1.1943285668550503,  "scale": 4513.988705 },
        { "level": 18, "resolution": 0.5971642835598172,  "scale": 2256.994353 },
        { "level": 19, "resolution": 0.29858214164761665, "scale": 1128.497176 }
      ]
    }),
    
    // TODO
    // timeout: 10000, // 10 seconds
    
    constructor: function(parameters) {
      lang.mixin(this, parameters);
      
      this._scaleCache = this._sampleCache = null;
      
      this._gsTask = esriConfig.geometryService || new GeometryService(this.geometryServiceUrl);
      
      if (this.layer.loaded) {
        this._createGRTask();
      }
      else {
        // With on.once we don't have to worry about removing the signal.
        on.once(this.layer, "load", lang.hitch(this, this._createGRTask));
      }
    },
    
    destroy: function() {
      // TODO
      // Remove all pending layer load signals
      
      this.layer = this._grTask = this._scaleCache = this._sampleCache = null;
    },
    
    getUniqueValues: function(parameters) {
      var dfd = new Deferred();
      
      // Reject if required parameters are missing.
      if (!parameters || !parameters.field) {
        this._rejectDfd(dfd, "FeatureLayerStatistics.getUniqueValues: 'field' parameter is missing.");
      }
      else {
        // Wait for layer to load.
        this._callAfterLoad(this._findUniqueValues, {
          dfd: dfd,
          params: parameters
        });
      }
      
      return dfd.promise;
    },
    
    getFieldStatistics: function(parameters) {
      var dfd = new Deferred();
      
      // Reject if required parameters are missing.
      if (
        !(
          parameters && 
          parameters.field
        )
      ) {
        this._rejectDfd(dfd, "FeatureLayerStatistics.getFieldStatistics: 'field' parameter is missing.");
      }
      else {
        // Wait for layer to load.
        this._callAfterLoad(this._getFieldStats, {
          dfd: dfd,
          params: parameters
        });
      }
      
      return dfd.promise;
    },
    
    getSpatialStatistics: function(parameters) {
      var dfd = new Deferred();
      
      // Reject if required parameters are missing.
      if (
        !(
          parameters && 
          parameters.features && 
          parameters.features.length
        )
      ) {
        this._rejectDfd(dfd, "FeatureLayerStatistics.getSpatialStatistics: 'features' parameter is missing or it has no features.");
      }
      else {
        // Wait for layer to load.
        this._callAfterLoad(this._spatialStats, {
          dfd: dfd,
          params: parameters
        });
      }
      
      return dfd.promise;
    },
    
    getSuggestedSizeRange: function(parameters) {
      var dfd = new Deferred();
      
      // Wait for layer to load.
      this._callAfterLoad(this._getSizeRange, {
        dfd: dfd,
        params: parameters
      });
      
      return dfd.promise;
    },
    
    getHeatmapStatistics: function(parameters) {
      var dfd = new Deferred();
      
      // Wait for layer to load.
      this._callAfterLoad(this._getHeatmapStats, {
        dfd: dfd,
        params: parameters
      });
      
      return dfd.promise;
    },
    
    getHistogram: function (parameters) {
      var dfd = new Deferred();
      
      // Reject if required parameters are missing.
      if (
        !(
          parameters && 
          parameters.field
        )
      ) {
        this._rejectDfd(dfd, "FeatureLayerStatistics.getHistogram: 'field' parameter is missing.");
      }
      else {
        // Wait for layer to load.
        this._callAfterLoad(this._getHistogram, {
          dfd: dfd,
          params: parameters
        });
      }
      
      return dfd.promise;
    },
    
    getSampleFeatures: function(parameters) {
      var dfd = new Deferred();

      // Wait for layer to load.
      this._callAfterLoad(this._sampleFeatures, {
        dfd: dfd,
        params: parameters
      });
      
      return dfd.promise;
    },
    
    getSuggestedScaleRange: function(parameters) {
      var dfd = new Deferred();

      // Wait for layer to load.
      this._callAfterLoad(this._scaleRange, {
        dfd: dfd,
        params: parameters
      });

      return dfd.promise;
    },
    
    getClassBreaks: function(parameters) {
      var dfd = new Deferred();
      
      // Reject if required parameters are missing.
      if (
        !(
          parameters && 
          parameters.field
        )
      ) {
        this._rejectDfd(dfd, "FeatureLayerStatistics.getClassBreaks: 'field' parameter is missing.");
      }
      else {
        // Wait for layer to load.
        this._callAfterLoad(this._findClassBreaks, {
          dfd: dfd,
          params: parameters
        });
      }
      
      return dfd.promise;
    },
    
    ////////////////////
    // Internal methods
    ////////////////////
    
    _srcQuery: "service-query",
    _srcGenRend: "service-generate-renderer",
    _srcMemory: "features-in-memory",
    _log10e: Math.LOG10E,

    // Matches a number
    _reNumber: /\s*(\+|-)?((\d+(\.\d+)?)|(\.\d+))\s*/gi,
    
    ////////////////////
    // Field statistics
    ////////////////////
    
    _isCollection: function() {
      // Returns true if this layer is a feature collection.
      return !this.layer.url;
    },
    
    _getFieldStats: function(info) {
      var self = this,
          params = info.params,
          fieldInfo = this.layer.getField(params.field);
      
      if (this._rejectNonNumeric(info.dfd, fieldInfo, "getFieldStatistics")) {
        return;
      }
      
      if (!this._isCollection()) {
        // Service based layer.
        var primaryAttempt = params.normalizationType
          // Extract approx stats using generate renderer.
          // outStatistics does not support normalization.
          ? this._statsFromGenRend(params)
    
          // Use outStatistics query.
          : this._statsFromQuery(params);
  
        primaryAttempt
          .then(function(stats) {
            info.dfd.resolve(stats);
          })
    
          .otherwise(function(error) {
            self._statsFromMemory(params)
                .then(function(stats) {
                  info.dfd.resolve(stats);
                })
          
                .otherwise(function(error) {
                  self._rejectDfd(info.dfd, "FeatureLayerStatistics.getFieldStatistics: unable to calculate field statistics.");
                });
          });
      }
      else {
        // Feature collection layer: use features in-memory.
        this
          ._statsFromMemory(params)
          .then(function(stats) {
            info.dfd.resolve(stats);
          })
    
          .otherwise(function(error) {
            self._rejectDfd(info.dfd, "FeatureLayerStatistics.getFieldStatistics: unable to calculate field statistics.");
          });
      }
    },
    
    _statsFromQuery: function(params) {
      var layer = this.layer, dfd = new Deferred();
      
      if (layer.url && layer.supportsStatistics) {
        var query = new Query(), 
            self = this,
            types = [ "min", "max", "avg", "stddev", "count", "sum", "var"],

            // Construct where clause to calculate stats only within the 
            // data range specified by the caller.
            customRangeFilter = this._getRangeExpr(params.field, params.minValue, params.maxValue);
  
        if (customRangeFilter) {
          query.where = customRangeFilter;
        }
        
        query.outStatistics = array.map(types,  function(type){
          var def = new StatDefinition();
          
          def.statisticType = type;
          def.onStatisticField = params.field;
          def.outStatisticFieldName = (type === "var") ? "variance" : type;
          
          return def;
        });
        
        layer
          .queryFeatures(query)
          .then(function(featureSet){
            var features = featureSet && featureSet.features,
                statsAttrs = features && features[0] && features[0].attributes,
                type, stats = {
                  source: self._srcQuery
                };
            
            for (type in statsAttrs) {
              stats[type.toLowerCase()] = statsAttrs[type];
            }
    
            // Statistics query returns <null> for stddev and variance 
            // if there is only one matching feature for the query. 
            // Let's fix it here.
            if (
              stats.min === stats.max && stats.min != null &&
              stats.stddev == null
            ) {
              stats.stddev = stats.variance = 0;
            }
            
            dfd.resolve(stats);
          })
          
          .otherwise(function(error) {
            self._rejectDfd(dfd, "FeatureLayerStatistics: Statistics query operation failed.");
          });
      }
      else {
        this._rejectDfd(dfd, "FeatureLayerStatistics: Statistics query requires a layer that supports statistics.");
      }
      
      return dfd.promise;
    },
    
    _statsFromMemory: function(params) {
      var dfd = new Deferred(),
          normTotal;
      
      if (params.normalizationType === "percent-of-total") {
        // Calculate "total" field value first - this is required for the actual
        // statistics calculation with normalization.
        normTotal = this._calcStatsFromMemory({
          field: params.field
        }).sum;
  
        if (normTotal == null) {
          // We cannot move forward without normalizationTotal.
          this._rejectDfd(dfd, "getFieldStatistics: invalid normalizationTotal.");
          return;
        }
  
        params = lang.mixin({
          normalizationTotal: normTotal
        }, params);
      }
      
      dfd.resolve(this._calcStatsFromMemory(params));
      
      return dfd.promise;
    },
    
    _calcStatsFromMemory: function(params) {
      var values = this._getDataValues(this.layer.graphics, params),
          stats = this._calcStatistics(values, !params.normalizationType);
      
      stats.source = this._srcMemory;
  
      return stats;
    },
    
    _getDataValues: function(features, params) {
      // Extracts and returns an array of data values to be used for 
      // statistics calculation.
      var fieldName = params.field,
          normType = params.normalizationType,
          normField = params.normalizationField,
          normTotal = params.normalizationTotal,
          minValue = (params.minValue == null) ? -Infinity : params.minValue,
          maxValue = (params.maxValue == null) ? Infinity : params.maxValue,
          attr, normValue, value, values = [];
  
      // Extract non-null values first
      array.forEach(features, function(feature) {
        attr = feature.attributes;
        value = attr && attr[fieldName];
    
        if (normType && value != null) {
          // Calculate normalized data value
          normValue = attr && parseFloat(attr[normField]);
      
          if (normType === "log" && value != 0) {
            // Base 10 logarithm
            value = Math.log(value) * this._log10e;
          }
          else if (normType === "percent-of-total" && !isNaN(normTotal) && normTotal != 0) {
            value = (value / normTotal) * 100;
          }
          else if (normType === "field" && !isNaN(normValue) && normValue != 0) {
            value = value / normValue;
          }
        }
    
        // Exclude features with no data.
        // This matches ArcGIS server's statistics query behavior.
        if (
          value != null && !isNaN(value) &&
        
            // Make sure we filter out values out of min/max range. This is 
            // needed especially when the caller has specified custom minValue 
            // and maxValue.
          value >= minValue && value <= maxValue
        ) {
          values.push(value);
        }
      }, this);
      
      return values;
    },
    
    _calcStatistics: function(values, useSampleStdDev) {
      var min = Infinity, max = -Infinity, count = 0, 
          
          // The following stats should be null if there are no values.
          sum = null, avg = null, stddev = null, variance = null;

      // Calcaulate statistics
      array.forEach(values, function(value) {
        count++; 
        
        sum += value;
        
        if (value < min) {
          min = value;
        }
        
        if (value > max) {
          max = value;
        }
      });
      
      // Calculate standard deviation.
      if (count) {
        avg = sum / count;
        
        var diffSquared = 0;
        
        array.forEach(values, function(value) {
          diffSquared += Math.pow(value - avg, 2);
        });
        
        // "Sample" stddev means divide by "count - 1" i.e. useSampleStdDev is true.
        // "Population" stddev means divide by "count"
        // This matches ArcGIS server's statistics query behavior.
        if (useSampleStdDev) {
          variance = (count > 1)
            ? (diffSquared / (count - 1))
            : 0;
        }
        else {
          variance = (count > 0)
            ? (diffSquared / count)
            : 0;
        }
        
        stddev = Math.sqrt(variance);
      }
      
      return { 
        min:    count ? min : null,
        max:    count ? max : null,
        count:  count,
        sum:    sum,
        avg:    avg,
        stddev: stddev,
        variance: variance
      };
    },
    
    _statsFromGenRend: function(params) {
      var dfd = new Deferred(),
          self = this,
          normType = params.normalizationType,
          normField = params.normalizationField;
      
      this.getClassBreaks({
            field: params.field,
            classificationMethod: "standard-deviation",
            standardDeviationInterval: 0.25,
            normalizationType: normType,
            normalizationField: (normType === "field") ? normField : undefined,
            minValue: params.minValue,
            maxValue: params.maxValue
          })
          
          .then(function(cbResponse) {
            var brkWithAvg, avg, stddev, range;

            array.some(cbResponse.classBreakInfos, function(brk, idx) {
              if (brk.hasAvg) {
                brkWithAvg = brk;
              }
      
              return !!brkWithAvg;
            });
            
            if (brkWithAvg) {
              range = (brkWithAvg.maxValue - brkWithAvg.minValue);
              
              // Avg and stddev below are approximate values.
              
              avg = brkWithAvg.minValue + (range / 2);
              
              // Multiplication factor is 4 since stddev interval is 0.25.
              // It would be 2 if stddev interval is 0.5.
              stddev = range * 4;
            }
    
            dfd.resolve({
              min: cbResponse.minValue,
              max: cbResponse.maxValue,
              avg: avg,
              stddev: stddev,
              source: self._srcGenRend
            });
          })
          
          .otherwise(function(error) {
            self._rejectDfd(dfd, "FeatureLayerStatistics.getFieldStatistics: unable to calculate class breaks.");
          });
      
      return dfd.promise;
    },
    
    ////////////////////
    // Spatial statistics
    ////////////////////
    
    _spatialStats: function(info) {
      var features = info.params.features,
          geomType = this.layer.geometryType,
          stats = {},
          featureType = {
            point:   geomType === "esriGeometryPoint",
            mPoint:  geomType === "esriGeometryMultipoint",
            line:    geomType === "esriGeometryPolyline",
            polygon: geomType === "esriGeometryPolygon"
          };
    
      // Calculate type specific stats.
      if (featureType.point) {
        stats = this._getPointStats(features);
      }
      else if (featureType.mPoint) {
        stats = this._getPointStats(features, true);
      }
      else if (featureType.line) {
        stats = this._getLineStats(features);
      }
      else if (featureType.polygon) {
        stats = this._getPolygonStats(features);
      }
      // TODO
      // Add multipatch support
      
      // Calculate common stats:
      // Can be null.
      stats.avgXY = this._getAvgXY(features, featureType);
      
      info.dfd.resolve(stats);
    },
    
    _getPointStats: function(features, isMultipoint) {
      // Returns the min/max/average of "distance between a point and its closest point".
      var i, j, len = features.length, pointA, pointB, 
          distance, obj1 = {}, obj2 = {},
          totalMinDistance = 0, totalMaxDistance = 0,
          overallMinDistance = Infinity, overallMaxDistance = -Infinity,
          numMinCalcs = 0, numMaxCalcs = 0,
          minDistance, maxDistance, points = [];
      
      if (isMultipoint) {
        // Features are multipoints:
        // Flatten points within multipoints into a single array.
        for (i = 0; i < len; i++) {
          if (features[i].geometry) {
            points.push.apply(points, features[i].geometry.points);
          }
        }
      }
      else {
        // Features are points.
        points = features;
      }
      
      // points = [ <Graphic> ]
      //  or
      // points = [ [<x>, <y>], ... ]
      
      len = points.length;
      
      for (i = 0; i < len; i++) {
        // Get pointA
        if (isMultipoint) {
          obj1.x = points[i][0];
          obj1.y = points[i][1];
          
          pointA = obj1;
        }
        else {
          pointA = points[i].geometry;
        }
        
        if (!pointA) {
          continue;
        }
        
        minDistance = Infinity;
        maxDistance = -Infinity;
        
        // Find the distance between pointA and its closest point.
        for (j = 0; j < len; j++) {
          // Don't calculate distance between pointA and pointA.
          if (j === i) {
            continue;
          }

          // Get pointB
          if (isMultipoint) {
            obj2.x = points[j][0];
            obj2.y = points[j][1];
            
            pointB = obj2;
          }
          else {
            pointB = points[j].geometry;
          }
          
          if (pointB) {
            distance = mathUtils.getLength(pointA, pointB);
            
            if (distance > 0) {
              // Calculate min distance for pointA.
              if (distance < minDistance) {
                minDistance = distance;
              }
              
              // Calculate overall min distance.
              if (distance < overallMinDistance) {
                overallMinDistance = distance;
              }

              // Calculate max distance for pointA.
              if (distance > maxDistance) {
                maxDistance = distance;
              }
              
              // Calculate overall max distance.
              if (distance > overallMaxDistance) {
                overallMaxDistance = distance;
              }
            }
          }
        }
        
        // Calculate sum of all minDistances.
        if (minDistance !== Infinity) {
          ++numMinCalcs;
          totalMinDistance += minDistance;
        }

        // Calculate sum of all maxDistances.
        if (maxDistance !== -Infinity) {
          ++numMaxCalcs;
          totalMaxDistance += maxDistance;
        }
      }
      
      return {
        minDistance: (overallMinDistance !== Infinity) ? overallMinDistance : null,
        maxDistance: (overallMaxDistance !== -Infinity) ? overallMaxDistance : null,
        
        avgMinDistance: numMinCalcs ? (totalMinDistance / numMinCalcs) : null,
        avgMaxDistance: numMaxCalcs ? (totalMaxDistance / numMaxCalcs) : null
      };
    },
    
    _getLineStats: function(features) {
      // Returns the average approximate-length of the given polylines.
      var i, len = features.length, 
          geom, obj1 = {}, obj2 = {},
          length, minLength = Infinity, maxLength = -Infinity,
          totalLength = 0, numFeatures = 0;
      
      for (i = 0; i < len; i++) {
        geom = features[i].geometry;
        
        if (geom) {
          length = this._getLineLength(geom, obj1, obj2);

          if (length > 0) {
            ++numFeatures;
            totalLength += length;

            // Calculate overall min length.
            if (length < minLength) {
              minLength = length;
            }

            // Calculate overall max length.
            if (length > maxLength) {
              maxLength = length;
            }
          }
        }
      }
      
      return {
        minLength: (minLength !== Infinity) ? minLength : null,
        maxLength: (maxLength !== -Infinity) ? maxLength : null,
        avgLength: numFeatures ? (totalLength / numFeatures) : null
      };
    },
  
    _getLineLength: function(geom, obj1, obj2) {
      // Returns the sum of approximate-length of paths in the given polyline.
      var paths = geom.paths,
          i, len = paths.length,
          points, length, totalLength = 0;
      
      for (i = 0; i < len; i++) {
        points = paths[i];
        
        length = this._getActualLineLength(points, obj1, obj2);

        if (length > 0) {
          totalLength += length;
          //console.log(i, " line length = ", length);
        }
      }
      
      return totalLength;
    },
  
    _getApproxLineLength: function(points, obj1, obj2) {
      // Calculate approximate length of the path:
      // i.e. distance between the first and last points of the path.
      var firstPt = points[0],
          lastPt = points[points.length - 1],
          length = 0;
  
      if (
        firstPt && lastPt && 
        firstPt[0] === lastPt[0] &&
        firstPt[1] === lastPt[1]
      ) {
        lastPt = points[points.length - 2];
      }
      
      if (firstPt && lastPt && firstPt !== lastPt) {
        obj1.x = firstPt[0];
        obj1.y = firstPt[1];
    
        obj2.x = lastPt[0];
        obj2.y = lastPt[1];
    
        length = mathUtils.getLength(obj1, obj2);
      }
      
      return length;
    },
  
    _getActualLineLength: function(points, obj1, obj2) {
      var i, len = points.length,
          pointA, pointB,
          length = 0;
      
      for (i = 0; i < len - 1; i++) {
        pointA = points[i];
        pointB = points[i + 1];
  
        if (pointA && pointB) {
          obj1.x = pointA[0];
          obj1.y = pointA[1];
    
          obj2.x = pointB[0];
          obj2.y = pointB[1];
    
          length += mathUtils.getLength(obj1, obj2);
        }
      }
      
      return length;
    },
    
    _getPolygonStats: function(features) {
      // Returns the average approximate-size of the given polygons.
      var i, len = features.length, 
          size, minSize = Infinity, maxSize = -Infinity,
          totalSize = 0, numFeatures = 0,
          extent;
      
      for (i = 0; i < len; i++) {
        if (features[i].geometry) {
          extent = features[i].geometry.getExtent();
          
          if (extent) {
            // Approximate size
            size = (extent.getWidth() + extent.getHeight()) / 2;
            
            if (size > 0) {
              ++numFeatures;
              totalSize += size;

              // Calculate overall min size.
              if (size < minSize) {
                minSize = size;
              }
  
              // Calculate overall max size.
              if (size > maxSize) {
                maxSize = size;
              }
            }
          }
        }
      }
      
      return {
        minSize: (minSize !== Infinity) ? minSize : null,
        maxSize: (maxSize !== -Infinity) ? maxSize : null,
        avgSize: numFeatures ? (totalSize / numFeatures) : null
      };
    },
    
    _getAvgXY: function(features, featureType) {
      var i, j, k, len = features.length, lenS, lenP, geom,
          points, paths, rings,
          totalX = null, totalY = null,
          numPoints = 0, avgLocation;
      
      for (i = 0; i < len; i++) {
        geom = features[i].geometry;
        
        if (geom) {
          // Calculate sum of all x and y coordinates
          if (featureType.point) {
            ++numPoints;
            totalX += geom.x;
            totalY += geom.y;
          }
          else if (featureType.mPoint) {
            points = geom.points;
            lenP = points.length;
            
            for (j = 0; j < lenP; j++) {
              ++numPoints;
              totalX += points[j][0];
              totalY += points[j][1];
            }
          }
          else if (featureType.line) {
            paths = geom.paths;
            lenS = paths.length;
            
            for (j = 0; j < lenS; j++) {
              points = paths[j];
              lenP = points.length;
              
              for (k = 0; k < lenP; k++) {
                ++numPoints;
                totalX += points[k][0];
                totalY += points[k][1];
              }
            }
          }
          else if (featureType.polygon) {
            rings = geom.rings;
            lenS = rings.length;
            
            for (j = 0; j < lenS; j++) {
              points = rings[j];
              lenP = points.length;
              
              for (k = 0; k < lenP; k++) {
                ++numPoints;
                totalX += points[k][0];
                totalY += points[k][1];
              }
            }
          }
        }
      }
      
      // Calculate average x and y
      if (totalX != null && totalY != null) {
        avgLocation = {
          x: totalX / numPoints,
          y: totalY / numPoints
        };
      }
      
      return avgLocation;
    },
    
    ////////////////////
    // Size range
    ////////////////////
    
    _getSizeRange: function(info) {
      var self = this,
          layer = this.layer,
          map = layer.getMap();
      
      if (layer.geometryType !== "esriGeometryPolygon") {
        this._rejectDfd(info.dfd, "FeatureLayerStatistics.getSuggestedSizeRange: not supported for points and lines.");
        return;
      }
      else if (!map) {
        this._rejectDfd(info.dfd, "FeatureLayerStatistics.getSuggestedSizeRange: layer has to be added to the map.");
        return;
      }
      
      this._getFeatures(map, info.params)
      
          .then(function(features) {
            //console.log("features = ", features.length);

            // Calculate average size of features in map units.
            self
              .getSpatialStatistics({  features: features })

              .then(function(spatialStats) {
                //console.log("field stats = ", stats);
                //console.log("spatialStats = ", spatialStats);
              
                // Calculate optimal size range.
                self._calcSizeRange(spatialStats, map, info.dfd);
              })

              .otherwise(function(error) {
                self._rejectDfd(info.dfd, "FeatureLayerStatistics.getSuggestedSizeRange: unable to calculate spatial statistics.");
              });
          })

          .otherwise(function(error) {
            self._rejectDfd(info.dfd, error.message);
          });
    },
    
    _getFeatures: function(map, params) {
      var dfd = new Deferred(),
          self = this,
          featureSetPromise;
      
      if (params && params.useMapExtent) {
        // Query features intersecting the current map extent.
        var featuresQuery = new Query();
        featuresQuery.geometry = map.extent;

        // TODO
        // Make sure we're not triggering a service query - currently we are 
        // if the layer is using orderByFields.
        // Fix FeatureLayer._canDoClientSideQuery
        featureSetPromise = this.layer.queryFeatures(featuresQuery);
      }
      else {
        featureSetPromise = { features: this.layer.graphics.slice(0) };
      }

      when(featureSetPromise)
        .then(function(featureSet) {
        
          var features = featureSet && featureSet.features;

          if (features && features.length) {
            dfd.resolve(features);
          }
          else {
            self._rejectDfd(dfd, "FeatureLayerStatistics.getSuggestedSizeRange: layer has 0 features.");
          }
        })

        .otherwise(function(error) {
          self._rejectDfd(dfd, "FeatureLayerStatistics.getSuggestedSizeRange: unable to query features.");
        });
      
      return dfd.promise;
    },
    
    _calcSizeRange: function(spatialStats, map, dfd) {
      var avgSize  = spatialStats && spatialStats.avgSize,
          resolution = map.getResolution(),
          minSize, computedMax, maxSize;
          //dataRange = stats.max - stats.min,
          //sdPct = 100 * ((stats.stddev * 2) / dataRange),
          //avgPct = 100 * ((stats.avg - stats.min) / dataRange);

      //console.log("(stddev * 2) / (max - min) = ", sdPct.toFixed(2), "%");
      //console.log("(avg - min) / (max - min) = ", avgPct.toFixed(2), "%");

      if (avgSize == null || isNaN(avgSize) || !resolution) {
        this._rejectDfd(dfd, "FeatureLayerStatistics.getSuggestedSizeRange: invalid average feature size.");
      }
      /*else if (sdPct > 15 || avgPct > 15) {
        // Tested using: http://services.arcgis.com/V6ZHFr6zdgNZuVG0/ArcGIS/rest/services/CHSI2009USCounties/FeatureServer/0
        this._rejectDfd(dfd, "FeatureLayerStatistics.getSuggestedSizeRange: unable to find optimal size range.");
      }*/
      // Average size of features in screen pixels - based on 
      // current map resolution.
      else {
        avgSize = Math.ceil(avgSize / resolution); // in pixels
        
        // Let minSize be 1/4th of average feature size.
        minSize = Math.ceil(avgSize / 4);
        
        // But let's limit minSize between 4 and 16. I don't think
        // minSize beyond 16px helps size visualization because it is 
        // too large to perceive size difference.
        if (minSize < 4) {
          minSize = 4;
        }
        else if (minSize > 16) {
          minSize = 16;
        }
        
        // Max size will not be more than 80 given minSize has an upper 
        // limit of 16.
        computedMax = minSize * 5;
        
        // Lower limit = 50, Upper limit = 80.
        maxSize = (computedMax < 50) ? 50 : computedMax;
        
        //computedMax = this._calcMaxSize(stats, sizeForAvgData, minSize);
        
        //console.log("avgSize = ", avgSize, "computedMax = ", computedMax);
        //console.log("minSize = ", minSize, "maxSize = ", maxSize);

        if (maxSize == null || isNaN(maxSize)) {
          this._rejectDfd(dfd, "FeatureLayerStatistics.getSuggestedSizeRange: invalid maxSize.");
        }
        else {
          dfd.resolve({
            minSize: minSize,
            maxSize: maxSize,
            spatialStatistics: spatialStats,
            avgFeatureSize: avgSize
          });
        }
      }
    },

    /*_calcMaxSize: function(stats, sizeForAvgData, minSize) {
      // Returns maxSize given all other values.
      // Note: Based on equation from Renderer.getSize.
      var value = stats.avg,
          minValue = stats.min,
          maxValue = stats.max,
          maxSize, featureRatio;

      featureRatio = (value - minValue) / (maxValue - minValue);
      maxSize = Math.ceil( minSize + ((sizeForAvgData - minSize) / featureRatio) );

      return maxSize;
    },*/
    
    ////////////////////
    // Heatmap statistics
    ////////////////////
    
    _getHeatmapStats: function(info) {
      var self = this,
          layer = this.layer,
          params = info.params,
          dfd = info.dfd,
          fieldOffset = params.fieldOffset,
          
          // field is optional
          fieldInfo = params.field && this.layer.getField(params.field);
      
      if (params.field && this._rejectNonNumeric(dfd, fieldInfo, "getHeatmapStatistics")) {
        return;
      }
      
      if (params.field && fieldOffset == null) {
        layer
          .statisticsPlugin
          .getFieldStatistics({ field: params.field })
      
          .then(function(fieldStats) {
            self._calcHeatmapStats(fieldStats, fieldOffset, params, dfd);
          })
      
          .otherwise(function(error) {
            self._rejectDfd(dfd, "FeatureLayerStatistics.getHeatmapStatistics: unable to calculate field statistics.");
          });
      }
      else {
        this._calcHeatmapStats(null, fieldOffset, params, dfd);
      }
    },
    
    _calcHeatmapStats: function(fieldStats, fieldOffset, params, dfd) {
      var self = this;
      
      // Calculate fied offset using field statistics.
      if (fieldStats) {
        var min = fieldStats.min,
            max = fieldStats.max;
  
        if (!fieldStats.count) {
          fieldOffset = 1;
        }
        else if (min === max && min === 0) {
          fieldOffset = 1;
        }
        else if (max <= 0) {
          // Strictly negative, just use absolute value
          fieldOffset = "abs";
        }
        else if (min < 0) {
          // Values are on either side of zero. Add an offset value to them
          // so that they are all positive and above zero.
          // Add 1% so that values are strictly greater than zero.
          fieldOffset = min * (-1.01);
        }
      }
  
      this._heatStatsFromMemory(params, fieldOffset)
        
        .then(function(stats) {
          // Add additional info to the result object.
          stats.fieldStatistics = fieldStats;
          stats.fieldOffset = fieldOffset;
          
          dfd.resolve(stats);
        })
    
        .otherwise(function(error) {
          self._rejectDfd(dfd, "FeatureLayerStatistics.getHeatmapStatistics: unable to calculate heatmap statistics.");
        });
    },
    
    _heatStatsFromMemory: function(params, fieldOffset) {
      var dfd = new Deferred(),
          layer = this.layer,
          graphics = layer.graphics,
          featureCount = graphics.length,
          map = layer.getMap(),
          heatStats;
      
      if (!featureCount) {
        dfd.resolve({
          count:  0,
          min:    null,
          max:    null,
          avg:    null,
          stddev: null,
          source: this._srcMemory
        });
        
        return dfd.promise;
      }
      
      var intensityInfo = map && calcIntensityMatrix(
        getScreenPoints(graphics, map, layer), 
        map.width, 
        map.height,
        params.blurRadius || 10,
        params.field,
        fieldOffset
      );
      
      heatStats = intensityInfo && 
        intensityInfo.matrix && 
        calcHeatmapStats(intensityInfo.matrix);

      if (heatStats) {
        dfd.resolve({ 
          count:  featureCount,
          min:    heatStats.min,
          max:    heatStats.max,
          avg:    heatStats.mean,
          stddev: heatStats.stdDev,
          source: this._srcMemory
        });
      }
      else {
        // TODO
        // Add more info in the error message about some errors
        this._rejectDfd(dfd, "FeatureLayerStatistics.getHeatmapStatistics: unable to calculate heatmap statistics.");
      }
      
      return dfd.promise;
    },
    
    ////////////////////
    // Histogram
    ////////////////////
    
    _getHistogram: function(info) {
      var self = this,
          params = info.params,
          customMin = params.minValue,
          customMax = params.maxValue,
          hasCustomMinMax = (customMin != null && customMax != null),
          fieldInfo = this.layer.getField(params.field);
      
      if (this._rejectNonNumeric(info.dfd, fieldInfo, "getHistogram")) {
        return;
      }
      
      // (1) Generate bins
      // (2) Query count for each bin from the service.
      //       On failure: execute count queries in-memory.
      
      // Use generate renderer to get bin parameters: min, max and bin intervals
      if (
        params.normalizationType ||
        (
          params.classificationMethod && 
          params.classificationMethod !== "equal-interval"
        )
      ) {
        this._binParamsFromGenRend(params)
            .then(function(binParams) {
              
              if (hasCustomMinMax) {
                // Generate renderer returns error under the following conditions.
                // Observed in Online hosted FS
                if (customMin > binParams.max || customMax < binParams.min) {
                  self._rejectDfd(info.dfd, "FeatureLayerStatistics.getHistogram: custom value range is beyond field value range.");
                }
                else {
                  // Construct where clause to calculate stats only within the 
                  // data range specified by the caller.
                  var fieldExpr = self._getFieldExpr(params, binParams.normTotal),
                      customRangeFilter = self._getRangeExpr(fieldExpr, customMin, customMax);
                  
                  self._binParamsFromGenRend(params, customRangeFilter)
                      .then(function(customBinParams) {
                        self._getBins(info, customBinParams.sqlExpr, customBinParams.min, customBinParams.max, customBinParams.intervals, customBinParams.source, customBinParams.normTotal, customBinParams.excludeZerosExpr);
                      })
  
                      .otherwise(function(error) {
                        // TODO
                        // Should we calculate binParams for customRangeFilter in-memory?
                        self._rejectDfd(info.dfd, "FeatureLayerStatistics.getHistogram: unable to calculate histogram parameters using custom min/max values.");
                      });
                }
              }
              else {
                self._getBins(info, binParams.sqlExpr, binParams.min, binParams.max, binParams.intervals, binParams.source, binParams.normTotal, binParams.excludeZerosExpr);
              }
              
            })
            
            .otherwise(function(error) {
              self._rejectDfd(info.dfd, "FeatureLayerStatistics.getHistogram: unable to calculate min/max from generate renderer operation.");
            });
      }
      // Use field statistics
      else {
        if (hasCustomMinMax) {
          // Caller has specified both minValue and maxValue
          this._getBins(info, null, customMin, customMax, null, "parameters");
        }
        else {
          this.getFieldStatistics(params)
              .then(function(stats) {
                if (!stats.count) {
                  self._rejectDfd(info.dfd, "FeatureLayerStatistics.getHistogram: cannot calculate histogram for 0 features (statistics.count = 0).");
                }
                else {
                  self._getBins(info, null, stats.min, stats.max, null, stats.source);
                }
              })
              
              .otherwise(function(error) {
                self._rejectDfd(info.dfd, "FeatureLayerStatistics.getHistogram: unable to calculate min/max.");
              });
        }
      }
    },
    
    _getBins: function(info, sqlExpr, min, max, intervals, statSource, normTotal, excludeZerosExpr) {
      var self = this,
          field = info.params.field,
          numBins = info.params.numBins || this.numBins,
          binSize = (max - min) / numBins,
          i, minValue = min, maxValue;
      
      if (!intervals) {
        intervals = [];
        
        // Equal interval bins
        for (i = 1; i <= numBins; i++) {
          maxValue = minValue + binSize;
          
          intervals.push([
            minValue,
            maxValue // (i < numBins) ? maxValue : null
          ]);
          
          minValue = maxValue;
        }
      }
      
      sqlExpr = sqlExpr || field;
      
      if (!this._isCollection()) {
        this._queryBins(sqlExpr, intervals, excludeZerosExpr)
          .then(function(counts) {
            var outBins = array.map(counts, function(count, i) {
              return {
                minValue: intervals[i][0],
                maxValue: intervals[i][1],
                count:    count
              };
            });
      
            info.dfd.resolve({
              bins:     outBins,
              minValue: min,
              maxValue: max,
              normalizationTotal: normTotal,
              source:   self._srcQuery,
              statisticsSource: statSource
            });
          })
    
          .otherwise(function(error) {
            self._countBinsInMemory(info, min, max, intervals, normTotal, statSource);
          });
      }
      else { // feature collection
        this._countBinsInMemory(info, min, max, intervals, normTotal, statSource);
      }
    },
    
    _countBinsInMemory: function(info, min, max, intervals, normTotal, statSource) {
      var self = this;
      
      this._binsFromMemory(info.params, min, max, intervals, normTotal)
        .then(function(outBins) {
          info.dfd.resolve({
            bins:     outBins,
            minValue: min,
            maxValue: max,
            normalizationTotal: normTotal,
            source:   self._srcMemory,
            statisticsSource: statSource
          });
        })
    
        .otherwise(function(error) {
          self._rejectDfd(info.dfd, "FeatureLayerStatistics: unable to calculate histogram.");
        });
    },
    
    _queryBins: function(sqlExpr, intervals, excludeZerosExpr) {
      var layer = this.layer, i, query, queries = [],
          numIntervals = intervals.length;
      
      for (i = 0; i < numIntervals; i++) {
        query = new Query();
        
        query.where = (
          // To exclude zero values from count
          (
            excludeZerosExpr 
              ? (excludeZerosExpr + " AND ")
              : ""
          ) +
          // Range comparison
          sqlExpr + " >= " + intervals[i][0] + 
          (
            (intervals[i][1] !== null) 
              ? (
                " AND " + 
                sqlExpr + 
                
                // maxValue of the last interval is inclusive
                ( (i === numIntervals - 1) ? " <= " : " < " ) +
                 
                intervals[i][1]
              )
              : ""
          )
        );

        queries.push(query);
      }
  
      return all(
        array.map(queries, function(query){ 
          return layer.queryCount(query) ;
        })
      );
    },
    
    _binsFromMemory: function(params, min, max, intervals, normTotal) {
      var dfd = new Deferred(),
          field = params.field,
          normType = params.normalizationType,
          normField = params.normalizationField,
          graphics = this.layer.graphics, graphic, attr, dataValue,
          i, len, idx, value, normValue,
          outBins = [];
      
      if (!graphics.length) {
        this._rejectDfd(dfd, "Layer has 0 features in memory.");
        return dfd.promise;
      }
      
      len = intervals.length;
      
      // Prepare outBins with count = 0
      for (i = 0; i < len; i++) {
        outBins.push({
          minValue: intervals[i][0],
          maxValue: intervals[i][1], // will be null for the last bin
          count: 0
        });
      }
      
      len = graphics.length;
      
      for (i = 0; i < len; i++) {
        graphic = graphics[i];
        attr = graphic && graphic.attributes;
        dataValue = attr && attr[field];

        // Exclude features with no data.
        if (dataValue != null) {
          // Calculate normalized data value
          if (normType) {
            value = null;
            normValue = attr && parseFloat(attr[normField]);
  
            if (normType === "log" && dataValue != 0) {
              // Base 10 logarithm
              value = Math.log(dataValue) * this._log10e;
            }
            else if (normType === "percent-of-total" && !isNaN(normTotal) && normTotal != 0) {
              value = (dataValue / normTotal) * 100;
            }
            else if (normType === "field" && !isNaN(normValue) && normValue != 0) {
              value = dataValue / normValue;
            }
          }
          // Data value
          else {
            value = dataValue;
          }
          
          if (
            value != null && !isNaN(value) && 
            
            // Make sure we filter out values out of min/max range. This is 
            // needed especially when the caller has specified custom minValue 
            // and maxValue.
            value >= min && value <= max
          ) {
            idx = this._binIndex(intervals, value);
            
            if (idx > -1) {
              outBins[idx].count++;
            }
          }
        }
      }
      
      dfd.resolve(outBins);
      
      return dfd.promise;
    },
    
    _binIndex: function(intervals, value) {
      var i, len = intervals.length, minValue, idx = -1;
      
      for (i = len - 1; i >= 0; i--) {
        minValue = intervals[i][0];
        
        // Ideally we would also like to compare against maxValue - to make 
        // sure that we're not counting values out of bounds when custom min/max 
        // is specified by the caller.
        // However it is not necessary since _binsFromMemory is filtering out 
        // values that are out of bounds.
        if (value >= minValue) {
          idx = i;
          break;
        }
      }
      
      return idx;
    },
    
    _binParamsFromGenRend: function(params, customRangeFilter) {
      var layer = this.layer, dfd = new Deferred(),
          self = this;
  
      // [1] Prepare input parameters to generate class breaks.
      var whereInfo = this._getGRWhereInfo(layer, params),
          where = whereInfo.where,
          numBins = params.numBins || this.numBins,
          cbDef = this._createCBDefn(params, numBins),
          grParams = new GRParameters();
      
      grParams.classificationDefinition = cbDef;
  
      // where = filter for non-zero values + layer defn expr
      // customRangeFilter = filter for custom min/max
      grParams.where = where
        ? (
          where +
          (customRangeFilter ? (" AND " + customRangeFilter) : "")
        )
        : customRangeFilter;
  
      // [2] Execute generate renderer operation.
      if (!this._isCollection() && layer.version >= 10.1) {
        // Execute generate renderer task
        this._grTask
          .execute(grParams)
          
          .then(function(renderer) {
            self._resolveBinParams(renderer, whereInfo, self._srcGenRend, params, dfd);
          })
          
          .otherwise(function(error) {
            self._binParamsFromMemory(numBins, whereInfo, self._srcMemory, params, dfd);
          });
      }
      else {
        self._binParamsFromMemory(numBins, whereInfo, self._srcMemory, params, dfd);
      }
      
      return dfd.promise;
    },
  
    _binParamsFromMemory: function(numBins, whereInfo, source, params, dfd) {
      var self = this;
    
      this._cbFromMemory(params, numBins)
      
        .then(function(renderer) {
          self._resolveBinParams(renderer, whereInfo, source, params, dfd);
        })
      
        .otherwise(function(error) {
          self._rejectDfd(dfd, "FeatureLayerStatistics.getHistogram: unable to calculate class breaks.");
        });
    },
    
    _resolveBinParams: function(renderer, whereInfo, source, params, dfd) {
      var min, max, intervals = [], infos = renderer.infos,
          len = infos.length;
  
      min = infos[0].minValue;
      max = infos[len - 1].maxValue;
  
      array.forEach(infos, function(cbInfo, idx) {
        intervals.push([
          cbInfo.minValue,
          cbInfo.maxValue // (idx === len - 1) ? null : cbInfo.maxValue
        ]);
      });
  
      dfd.resolve({
        min: min,
        max: max,
        intervals: intervals,
    
        // Calculate LHS of the expression to use for count queries.
        sqlExpr: this._getFieldExpr(params, renderer.normalizationTotal),
    
        excludeZerosExpr: whereInfo.excludeZerosExpr,
        normTotal: renderer.normalizationTotal,
        source: source
      });
    },
    
    _getGRWhereInfo: function(layer, params) {
      var field = params.field, 
          normType = params.normalizationType, 
          normField = params.normalizationField,
          
          // User-defined layer filter
          defExpr = layer.getDefinitionExpression(),
          
          excludeZerosExpr;
      
      // Generate renderer returns error when:
      // 1. Using normalize by log where some features have 0 value for <field>.
      // 2. Using normalize by field where some features have 0 value for <normField>. 
      // Let's exclude 0s from our calculations.
      if (normType === "log") {
        excludeZerosExpr = "(NOT " + field + " = 0)";
      }
      else if (normType === "field") {
        excludeZerosExpr = "(NOT " + normField + " = 0)";
      }
      
      return {
        where: excludeZerosExpr 
          ? (
            excludeZerosExpr + 
            (defExpr ? (" AND " + defExpr) : "")
          )
          : defExpr,
        
        excludeZerosExpr: excludeZerosExpr
      };
    },
    
    _getFieldExpr: function(params, normTotal) {
      // Returns LHS of a SQL comparison expression
      var field = params.field, 
          normType = params.normalizationType, 
          normField = params.normalizationField,
          fieldExpr = field;
      
      if (normType === "percent-of-total") {
        fieldExpr = "((" + field + " / " + normTotal + ") * 100)";
      }
      else if (normType === "log") {
        fieldExpr = "(log(" + field + ") * " + this._log10e + ")";
      }
      else if (normType === "field") {
        fieldExpr = "(" + field + " / " + normField + ")";
      }
      
      return fieldExpr;
    },
    
    _getRangeExpr: function(fieldExpr, min, max) {
      // Returns SQL expression to match field values within min and max.
      var minExpr = (min != null) ? (fieldExpr + " >= " + min) : "", 
          maxExpr = (max != null) ? (fieldExpr + " <= " + max) : "",
          expr = "";
      
      if (minExpr && maxExpr) {
        expr = minExpr + " AND " + maxExpr;
      }
      else {
        expr = minExpr || maxExpr;
      }
      
      return expr ? ( "(" + expr + ")" ) : "";
    },
    
    ////////////////////
    // Sample features
    ////////////////////
    
    _sampleFeatures: function(info) {
      var self = this,
          params = info.params,
          dfd = info.dfd,
          layer = this.layer,
          graphics = layer.graphics,
          cache = this._sampleCache,
          resample = params && params.resample,
          sampleSize = (params && params.sampleSize) || this.sampleSize;

      // 1) Randomly pick features in-memory if we have <sampleSize> features.
      // 2) If NOT:
      //    a) Cutoff <sampleSize> to <maxRecordCount>
      //    b) Query featureCount
      //    c) If featureCount <= sampleSize:
      //         Query all features
      //    d) Else:
      //         If featureCount <= 20k:
      //           Get all object ids
      //           Randomly pick <sampleSize> ids
      //           Query features with these ids
      //         Else:
      //           Query all features
      //            - Randomly pick <sampleSize> features? No - more features is good.
      // On ERROR: fallback to (1)
      
      // Use cache only if:
      // Caller did not specify SR
      // Or, the specified SR is identical to SR of features in the cache.
      // NOTE
      // We ignore params when using the existing cache.
      if (cache && !resample) {
        dfd.resolve(this._cloneSample(cache));
        return;
      }

      // TODO
      // Do not use layer.graphics if their SR is not the same as params.SR if specified.
      
      // TODO
      // We should probably return error if the server does not support 
      // returnCountOnly query parameter. Ex: 10.0 - sampleserver3
      
      dfd._time = {
        start: this._getTime()
      };
      
      if (graphics.length && sampleSize <= graphics.length) {
        this._resolveSample(dfd, this._pickItems(graphics, sampleSize), this._srcMemory);
      }
      else {
        var countQuery = new Query();
        countQuery.where = "1=1"; // make sure we query feature count from service
        
        dfd._time.countStart = this._getTime();
        
        layer
          .queryCount(countQuery)
          .then(function(featureCount) {
            dfd._time.countEnd = self._getTime();
            
            dfd._totalFeatures = featureCount;
            
            if (sampleSize > layer.maxRecordCount) {
              sampleSize = layer.maxRecordCount;
            }
            
            var featuresQuery;
            
            if (!featureCount) {
              // There are no features in the layer.
              self._resolveSample(dfd, [], self._srcQuery);
            }
            else if (featureCount <= sampleSize) {
              // Fetch all available features
              featuresQuery = new Query();
              featuresQuery.where = "1=1";
                
              self._queryFeatures(featuresQuery, params, layer, graphics, dfd);
            }
            else {
              if (featureCount <= self.samplingThreshold) {
                // Get all object ids and randomly pick <sampleSize> features.
                var idsQuery = new Query();
                idsQuery.where = "1=1";
                
                dfd._time.idStart = self._getTime();
                
                layer
                  .queryIds(idsQuery)
                  .then(function(objectIds) {
                    dfd._time.idEnd = self._getTime();
                    
                    // Randomly pick <sampleSize> object ids
                    var featuresByIds = new Query();
                    featuresByIds.objectIds = self._pickItems(objectIds, sampleSize);
                    
                    self._queryFeatures(featuresByIds, params, layer, graphics, dfd);
                  })
                  
                  .otherwise(function(error) {
                    // console.log("_sampleFeatures: IDs Query failed.", error);
                    // Unable to fetch object ids, just query as much as we can.
                    featuresQuery = new Query();
                    featuresQuery.where = "1=1";
                    
                    self._queryFeatures(featuresQuery, params, layer, graphics, dfd);
                  });
              }
              else {
                // Fetch as many features as possible upto <maxRecordCount> features.
                featuresQuery = new Query();
                featuresQuery.where = "1=1";
                
                // Safeguard against very large <maxRecordCount>.
                // Ex: 
                // http://services1.arcgis.com/r6QlyAADl0kfhp1m/arcgis/rest/services/Parcels_Hosted/FeatureServer/0
                // has maxRecordCount = 90,000
                var advQueryCapabilities = layer.advancedQueryCapabilities;
                if (advQueryCapabilities && advQueryCapabilities.supportsPagination) {
                  // Works only for services that support pagination.
                  featuresQuery.num = sampleSize;
                }
                
                self._queryFeatures(featuresQuery, params, layer, graphics, dfd);
              }
            }
          })
          
          .otherwise(function(error) {
            // console.log("_sampleFeatures: Count Query failed.", error);
            self._resolveSample(dfd, self._pickItems(graphics, graphics.length), self._srcMemory);
          });
      }
    },
    
    _queryFeatures: function(query, params, layer, graphics, dfd) {
      var self = this;
      
      query.outSpatialReference = params && params.spatialReference;
      query.maxAllowableOffset = params && params.maxAllowableOffset;
      query.outFields = params && params.outFields;
      
      dfd._time.featStart = this._getTime();

      layer
        .queryFeatures(query)
        .then(function(featureSet) {
          dfd._time.featEnd = self._getTime();
          
          var features = featureSet && featureSet.features;
          self._resolveSample(dfd, features || [], self._srcQuery);
        })
        
        .otherwise(function(error) {
          // console.log("_queryFeatures: FL.queryFeatures failed.", error);
          self._resolveSample(dfd, self._pickItems(graphics, graphics.length), self._srcMemory);
        });
    },
    
    _pickItems: function(items, sampleSize) {
      var len = items.length, indices = [], idx,
          samples = [];
      
      if (sampleSize >= len) {
        // Return all items
        samples = items.slice(0);
      }
      else {
        // Randomly pick <sampleSize> items
        while (samples.length < sampleSize) { // pick until we have enough
          idx = this._getRandomInt(0, len);

          // Prevent duplicate items
          if (array.indexOf(indices, idx) === -1) {
            indices.push(idx);
            samples.push(items[idx]);
          }
        }
      }
      
      return samples;
    },
    
    _getRandomInt: function(min, max) {
      // Returns a random integer between min (included) and max (excluded)
      return Math.floor(Math.random() * (max - min)) + min;
    },
    
    _resolveSample: function(dfd, features, source) {
      features = features || [];
      
      // Extract spatial reference from features.
      var i, len = features.length, geom, sr;
      for (i = 0; i < len; i++) {
        geom = features[i].geometry;
        
        sr = geom && geom.spatialReference;
        if (sr) {
          break;
        }
      }
      
      dfd._time.end = (new Date()).getTime();
      
      var time = dfd._time;
      dfd._time = null;
      
      this._sampleCache = {
        features: features,
        spatialReference: sr && new SpatialReference( sr.toJSON() ),
        source: source,
        time: this._getTimeStats(time),
        totalFeatures: dfd._totalFeatures
      };
      
      dfd.resolve(this._cloneSample(this._sampleCache));
    },
    
    _cloneSample: function(sample) {
      return {
        features: array.map(sample.features, function(feature) {
          return new feature.constructor(feature.toJSON());
        }),
        spatialReference: sample.spatialReference && new SpatialReference( sample.spatialReference.toJSON() ),
        source: sample.source,
        time: lang.clone(sample.time),
        totalFeatures: sample.totalFeatures
      };
    },
    
    _getTimeStats: function(time) {
      var timeDiff = this._getTimeDiff;
      
      return {
        total:        timeDiff(time.start, time.end),
        features:     timeDiff(time.featStart, time.featEnd),
        featureIds:   timeDiff(time.idStart, time.idEnd),
        featureCount: timeDiff(time.countStart, time.countEnd)
      };
    },
    
    _getTimeDiff: function(start, end) {
      var retVal, elapsed, unit;
      
      if (start != null && end != null) {
        elapsed = (end - start); 
        unit = "millisecond";
        
        if (elapsed >= 1000) {
          elapsed = elapsed / 1000;
          unit = "second";

          if (elapsed >= 60) {
            elapsed = elapsed / 60;
            unit = "minute";
          }
        }
        
        retVal = {
          value: Number(elapsed.toFixed(2)),
          unit: unit
        };
      }
      
      return retVal;
    },
    
    _getTime: function() {
      return (new Date()).getTime();
    },
    
    ////////////////////
    // View info
    ////////////////////
    
    _scaleRange: function(info) {
      var self = this,
          params = info.params,
          layer = this.layer,
          geomType = this.layer.geometryType,
          
          featureType = {
            point:   geomType === "esriGeometryPoint",
            mPoint:  geomType === "esriGeometryMultipoint",
            line:    geomType === "esriGeometryPolyline",
            polygon: geomType === "esriGeometryPolygon"
          },
          
          sampleSize = (params && params.sampleSize) || this.sampleSize,
          map = (params && params.map) || layer.getMap(),
          mapWidth = (params && params.mapWidth) || this.mapWidth,
          mapHeight = (params && params.mapHeight) || this.mapHeight,
          genScale = (params && params.generalizeForScale) || this.generalizeForScale,
        
          tileInfo, sampleSR, maxOffset;

      if (map && map.__tileInfo) {
        //console.log("MAP available");
        
        tileInfo = map.__tileInfo;
        sampleSR = map.spatialReference;

        // Offset corresponding to the desired scale.
        maxOffset = ((map.extent.getWidth() / map.width) / map.getScale()) * genScale;
      }
      else {
        //console.log("MAP NOT available");
        
        // Use defaults:
        // AGOL basemap tiling scheme i.e. 102100.
        tileInfo = this.tileInfo;
        sampleSR = tileInfo.spatialReference;
  
        // In meters: matches SR of tileInfo.
        // Default = 105 meters, unless generalizeForScale parameter is specified.
        maxOffset = (this.generalizeForResolution / this.generalizeForScale) * genScale;
      }
      
      // We need to calculate minScale, maxScale and center
      // We will use a sampling of <sampleSize> features in map SR.
      
      // TODO
      // Is there a better distribution algorithm for sampling?
      this.getSampleFeatures({ 
            sampleSize: sampleSize,
            spatialReference: sampleSR,
            maxAllowableOffset: maxOffset,
            outFields: []
          })
      
          .then(function(sample) {
            // TODO
            // We need to query extent from the service to make sure we have the 
            // appropriate fullExtent considering the layer's definition expression.
            // That is, layer's fullExtent of the entire dataset is not relevant 
            // when displaying a subset of that dataset.
            var projectedFullExtent = self._projectExtent(layer.fullExtent, sampleSR),
                sampleFeatures = sample.features;
            
            if (sampleFeatures && sampleFeatures.length) {
              self.getSpatialStatistics({ features: sampleFeatures })
              
                  .then(function(spatialStats) {
                    when(projectedFullExtent)
                      .always(function(fullExtent) {
                        fullExtent = (fullExtent && fullExtent.hasOwnProperty("xmin")) ? fullExtent : null;
                        // console.log("Projection result: ", fullExtent);
                        
                        var minLOD = self._getLODForMinScale(params, spatialStats, featureType, tileInfo),
                            
                            // We don't want to restrict max scale for points, lines and multipoints.
                            // Only polygons have the degrading experience if we let them visible
                            // at scales where they can occupy the entire map.
                            maxLOD = featureType.polygon 
                              ? self._getLODForMaxScale(params, spatialStats, featureType, tileInfo)
                              : null;
                        
                        self._processScaleRange(info.dfd, minLOD, maxLOD, tileInfo, mapWidth, mapHeight, fullExtent, sample, spatialStats, featureType);
                      });
                  })
                  
                  .otherwise(function(error) {
                    self._rejectDfd(info.dfd, "FeatureLayerStatistics.getSuggestedScaleRange: unable to calculate spatial statistics.");
                  });
            }
            else {
              self._rejectDfd(info.dfd, "FeatureLayerStatistics.getSuggestedScaleRange: sampling returned 0 features.");
            }
          })
          
          .otherwise(function(error) {
            self._rejectDfd(info.dfd, "FeatureLayerStatistics.getSuggestedScaleRange: unable to sample features.");
          });
    },
  
    _processScaleRange: function(dfd, minLOD, maxLOD, tileInfo, mapWidth, mapHeight, fullExtent, sample, spatialStats, featureType) {
      var avgXY = spatialStats.avgXY,
      
          // Choices for calculating center:
          // 1) Use average-x and average-y of all sampled features
          // 2) Use center of the extent of all sampled features
          // 3) Use center of the extent of a random/smallest/largest sampled feature
          // 4) Use center of the layer's full extent
          center = avgXY && new Point(
            avgXY.x,
            avgXY.y,
            sample.spatialReference && new SpatialReference( sample.spatialReference.toJSON() )
          ),

          self = this,
          minScale,
          
          maxScale = featureType.polygon 
            ? (maxLOD ? Math.floor(maxLOD.scale) : null)
            : 0,
          
          lods = tileInfo.lods,
          closestLOD;
      
      // If extent of the "minScale" at the "center" completely contains the 
      // layer's fullExtent, we can zoom in further as long as the primary 
      // criteria (size, length or distance) is not violated.
      if (minLOD && fullExtent && center) {
        closestLOD = this._findClosestLOD(lods, minLOD, fullExtent, center, mapWidth, mapHeight);
      }
      
      // Use the closest LOD or the original LOD.
      minLOD = closestLOD || minLOD;
  
      minScale = minLOD ? Math.ceil(minLOD.scale) : null;
      
      if (minLOD || maxLOD) {
        if (minLOD && center) {
          // console.log("Initial center: ", center.toJSON());
          
          this._countAtView(center, minLOD, mapWidth, mapHeight)
          
              .then(function(featureCount) {
                // console.log("featureCount at suggested scale and center: ", featureCount);
                
                var adjustedCenter;
                
                // If there are no features visible at the suggested scale 
                // and center, then let's pick a location where there is 
                // atleast one feature.
                if (!featureCount) {
                  // Pick the first feature.
                  var feature = sample.features[0], extent;
                  
                  if (featureType.point) {
                    adjustedCenter = feature.geometry;
                  }
                  else {
                    extent = feature.geometry && feature.geometry.getExtent();
                    adjustedCenter = extent && extent.getCenter();
                  }
                  
                  // console.log("Adjusted center: ", adjustedCenter && adjustedCenter.toJSON());
                }
                
                self._resolveScaleRange(dfd, minScale, maxScale, adjustedCenter || center, sample, spatialStats);
              })
              
              .otherwise(function(error) {
                // Unable to get count at the suggested scale and center:
                // Be optimistic and return what we've got.
                self._resolveScaleRange(dfd, minScale, maxScale, center, sample, spatialStats);
              });
        }
        else {
          // We still have Min LOD or center.
          this._resolveScaleRange(dfd, minScale, maxScale, center, sample, spatialStats);
        }
      }
      else {
        this._rejectDfd(dfd, "FeatureLayerStatistics.getSuggestedScaleRange: unable to find optimal scale range.");
      }
    },
    
    _resolveScaleRange: function(dfd, minScale, maxScale, center, sample, spatialStats) {
      // Check if minScale is greater than maxScale.
      // If not, then we have stumbled upon invalid scale range.
      if (minScale < maxScale) {
        this._rejectDfd(dfd, "FeatureLayerStatistics.getSuggestedScaleRange: invalid scale range - calculated minScale is less than maxScale.");
      }
      else {
        dfd.resolve({
          minScale:   minScale,
          maxScale:   maxScale,
          center:     center,
          sampleInfo: sample,
          spatialStatistics: spatialStats
        });
      }
    },
    
    _countAtView: function(center, minViewLOD, mapWidth, mapHeight) {
      var viewExtent = this._getExtentFromCenter(center, minViewLOD, mapWidth, mapHeight);

      var countQuery = new Query();
      countQuery.geometry = viewExtent;
      
      return this.layer.queryCount(countQuery).promise;
    },
    
    _projectExtent: function(extent, sr) {
      // Project <extent> to the specified <sr>.
      // Returns extent or a promise that resolves to an extent.
      if (extent.spatialReference.equals(sr)) {
        // console.log("Projection not required.");
        return new extent.constructor(extent.toJSON());
      }
      else if (webMercatorUtils.canProject(extent.spatialReference, sr)) {
        // console.log("Client-side projection required.");
        return webMercatorUtils.project(extent, sr);
      }
      else {
        var params = new ProjParams();
        params.geometries = [ extent ];
        params.outSR = sr;
        
        // console.log("Server-side projection required.");
        
        return this._gsTask
          .project(params)
          .then(function(extents) {
            return extents && extents[0];
          });
      }
    },
    
    _getLODForMinScale: function(params, spatialStats, featureType, tileInfo) {
      // minScale:
      // For polygons: use average feature size (minSize)
      // For lines: use average feature length (minLength)
      // For points: use average distance between features (minDistance)
      
      // TODO
      // Calculate <minXyz> using the layer's current symbology. 
      
      // TODO
      // Should we use histogram of feature sizes?
      
      var minDistance = (params && params.minDistance) || this.minDistance,
          minLength = (params && params.minLength) || this.minLength,
          minSize = (params && params.minSize) || this.minSize,
          avgMapUnits, lod, minPixels;
      
      if (featureType.point) {
        avgMapUnits = spatialStats.avgMinDistance;
        minPixels = minDistance;
      }
      else if (featureType.mPoint) {
        avgMapUnits = spatialStats.avgMinDistance;
        minPixels = minDistance;
      }
      else if (featureType.line) {
        avgMapUnits = spatialStats.avgLength;
        minPixels = minLength;
      }
      else if (featureType.polygon) {
        avgMapUnits = spatialStats.avgSize;
        minPixels = minSize;
      }

      //console.log("[minScale] Average map units ", avgMapUnits, "minPixels ", minPixels);

      if (avgMapUnits > 0) {
        lod = this._findLOD(tileInfo, avgMapUnits, minPixels);
      }

      //console.log("[minScale] LOD = ", lod && lod.toJSON());
      
      return lod;
    },
  
    _getLODForMaxScale: function(params, spatialStats, featureType, tileInfo) {
      var mapWidth = this.mapWidth,
          
          // Defaults based on Mark Harrower's map scale cheat sheet.
          maxDistance = (params && params.maxDistance) || (mapWidth / 4),
          maxLength = (params && params.maxLength) || (mapWidth / 4),
          maxSize = (params && params.maxSize) || (mapWidth / 2),
          
          mapUnits, lod, maxPixels;
    
      if (featureType.point) {
        mapUnits = spatialStats.minDistance;
        maxPixels = maxDistance;
      }
      else if (featureType.mPoint) {
        mapUnits = spatialStats.minDistance;
        maxPixels = maxDistance;
      }
      else if (featureType.line) {
        mapUnits = spatialStats.minLength;
        maxPixels = maxLength;
      }
      else if (featureType.polygon) {
        mapUnits = spatialStats.minSize;
        maxPixels = maxSize;
      }
    
      //console.log("[maxScale] map units ", mapUnits, "maxPixels ", maxPixels);
    
      if (mapUnits > 0) {
        lod = this._findLOD(tileInfo, mapUnits, null, maxPixels);
      }
    
      //console.log("[maxScale] LOD = ", lod && lod.toJSON());
    
      return lod;
    },
  
    _findLOD: function(tileInfo, mapUnits, minPixels, maxPixels) {
      // Returns the first LOD that for which <mapUnits>/<lod.resolution> yields:
      //   Minimum of <minPixels> - if <minPixels> is given.
      //   Maximum of <maxPixels> - if <maxPixels> is given.
      var lods = tileInfo && tileInfo.lods,
          match, lod, i, screenSize;
    
      // Tiled basemap
      if (lods && lods.length) {
        // Min/max LODs available for the map.
        var /*minMapLOD = lods[map.getMinZoom()],
            maxMapLOD = lods[map.getMaxZoom()],*/
      
            // Calculate the loop direction based on whether we're searching 
            // for minPixels or maxPixels.
            reverseLookup = (maxPixels != null),
            start = reverseLookup ? (lods.length - 1) : 0,
            end = reverseLookup ? 0 : (lods.length - 1),
            step = reverseLookup ? -1 : 1;
      
        // Iterate from "start" to "end"
        for (
          i = start;
          reverseLookup ? (i >= end) : (i <= end);
          i += step
        ) {
        
          lod = lods[i];
        
          /*if (
            lod.level < minMapLOD.level ||
            lod.level > maxMapLOD.level
          ) {
            continue;
          }*/
        
          // Rounding ensures that a matching LOD can be within 0.5 pixels of 
          // the required <minPixels>.
          // TODO
          // Should we increase this tolerance to 1px or 1.5px?
          screenSize = Math.round(mapUnits / lod.resolution);
        
          //console.log(" level ", lod.level, "resolution ", lod.resolution, "pixels ", screenSize, "scale ", lod.scale);
        
          if (reverseLookup) {
            if (screenSize <= maxPixels) {
              match = lod;
              break;
            }
          }
          else {
            if (screenSize >= minPixels) {
              match = lod;
              break;
            }
          }
        }
      }
    
      return match;
    },
    
    _getExtentFromCenter: function(center, lod, mapWidth, mapHeight) {
      // Calculates "extent" around the given "center" at the resolution specified 
      // by the "lod".
      var halfExtentWidth = (mapWidth / 2) * lod.resolution,
          halfExtentHeight = (mapHeight / 2) * lod.resolution;
    
      return new Extent(
        center.x - halfExtentWidth, 
        center.y - halfExtentHeight, 
        center.x + halfExtentWidth, 
        center.y + halfExtentHeight, 
        new SpatialReference( center.spatialReference.toJSON() )
      );
    },
    
    _findClosestLOD: function(lods, startLOD, fullExtent, center, mapWidth, mapHeight) {
      // Returns LOD greater than startLOD that can fully contain the 
      // layer's fullExtent.
      var i, len = lods.length, extentAtLevel, closestLOD;
      
      for (i = 0; i < len; i++) {
        // Ignore LODs lower than startLOD.
        if (lods[i].level < startLOD.level) {
          continue;
        }
        
        extentAtLevel = this._getExtentFromCenter(center, lods[i], mapWidth, mapHeight);
        
        if (!extentAtLevel.contains(fullExtent)) {
          // Pick the previous LOD since it fully contains the fullExtent.
          closestLOD = lods[i - 1];
          break;
        }
        // We've exhausted all LODs but "contains" operation still returns true:
        // Pick this last available LOD as the closest.
        else if (i === len - 1) {
          closestLOD = lods[i];
          break;
        }
      }
      
      closestLOD = (closestLOD && (closestLOD.level > startLOD.level)) ? closestLOD : null;

      //console.log("Even closest LOD = ", closestLOD && closestLOD.toJSON());
      return closestLOD;
    },
    
    ////////////////////
    // Unique values
    ////////////////////
    
    _findUniqueValues: function(info) {
      var self = this,
          params = info.params,
          fieldInfo = this.layer.getField(params.field);
      
      if (!fieldInfo) {
        this._rejectDfd(info.dfd, "FeatureLayerStatistics.getUniqueValues: unknown 'field'.");
        return;
      }
      
      if (!this._isCollection()) {
        // [1] Use statistics query if layer supportsStatistics.
        this._uvFromStatisticsQuery(params)
          .then(function(response) {
            self._resolveUVDfd(response, info, fieldInfo, self._srcQuery);
          })
    
          .otherwise(function(error) {
            // [2] Use generate renderer task if possible.
            self._uvFromGenRenderer(params, fieldInfo)
              .then(function(response) {
                self._resolveUVDfd(response, info, fieldInfo, self._srcGenRend);
              })
        
              .otherwise(function(error) {
                // [3] Calculate client-side using available features as the last resort.
                self._uvFromMemory(params)
                  .then(function(response) {
                    self._resolveUVDfd(response, info, fieldInfo, self._srcMemory);
                  })
            
                  .otherwise(function(error) {
                    self._rejectDfd(info.dfd, "FeatureLayerStatistics: unable to calculate unique values.");
                  });
              });
          });
      }
      else {
        this._uvFromMemory(params)
          .then(function(response) {
            self._resolveUVDfd(response, info, fieldInfo, self._srcMemory);
          })
    
          .otherwise(function(error) {
            self._rejectDfd(info.dfd, "FeatureLayerStatistics: unable to calculate unique values.");
          });
      }
    },
    
    _uvFromStatisticsQuery: function(params) {
      var layer = this.layer, dfd = new Deferred();
      
      if (layer.supportsStatistics) {
        var countOutField = "countOF" + params.field, self = this;
        
        var statDef = new StatDefinition();
        statDef.statisticType = "count";
        statDef.onStatisticField = params.field;
        statDef.outStatisticFieldName = countOutField;
        
        // We're querying for num of features for each unique value in "params.field"
        var query = new Query();
        query.outStatistics = [ statDef ];
        query.groupByFieldsForStatistics = [ params.field ];
        // query.orderByFields = [ countOutField + " DESC"  ];
        
        layer
          .queryFeatures(query)
          .then(function(featureSet) {
            var attr, dataValue, count = {}, countValue,
                hasNull;

            array.forEach(featureSet.features, function(feature) {
              attr = feature.attributes;
              dataValue = this._getAttributeVal(attr, params.field);
              countValue = this._getAttributeVal(attr, countOutField);
              
              if (dataValue === null && countValue === 0) {
                hasNull = true;
              }
              
              // Treat undefined, null and <empty-string> as just one type of value:
              // null
              if (
                dataValue == null ||  dataValue === "" || 
                (typeof dataValue === "string" && lang.trim(dataValue) === "") 
              ) {
                dataValue = null;
              }
              
              // Initialize the counter if we haven't seen this value before.
              // Else, just increment the count.
              if (count[dataValue] == null) {
                count[dataValue] = {
                  count: countValue,
                  data: dataValue
                };
              }
              else {
                count[dataValue].count = count[dataValue].count + countValue;
              }
            }, self);
            
            // Statistics query incorrectly returns count = 0 for null value:
            // If statistics query result had null, then we will perform a
            // separate count query to accurately count features with null value.
            if (hasNull) {
              query = new Query();
              query.where = params.field + " is NULL";
              
              // Query num of features with null value in "params.field"
              layer
                .queryCount(query)
                .then(function(nullCount) {
                  nullCount = nullCount || 0;
                  count["null"].count = count["null"].count + nullCount;
                  
                  dfd.resolve({ count: count });
                })
                
                .otherwise(function(error) {
                  dfd.resolve({ count: count });
                });
                
            }
            else {
              dfd.resolve({ count: count });
            }
          })
          
          .otherwise(function(error) {
            self._rejectDfd(dfd, "FeatureLayerStatistics: Statistics query operation failed.");
          });
      }
      else {
        this._rejectDfd(dfd, "FeatureLayerStatistics: Statistics query requires a layer that supports statistics.");
      }
      
      return dfd.promise;
    },
    
    _uvFromGenRenderer: function(params, fieldInfo) {
      var layer = this.layer, dfd = new Deferred(),
          self = this;
      
      if (layer.version >= 10.1) {
        // Define input parameters
        var uvDef = new UVDefinition();
        uvDef.attributeField = params.field;
        
        var grParams = new GRParameters();
        grParams.classificationDefinition = uvDef;
        grParams.where = layer.getDefinitionExpression();
        
        // Execute generate renderer task
        this._grTask
          .execute(grParams)
          .then(function(renderer) {
            var count = {}, dataValue,
                isNumericField = (array.indexOf(self._numericTypes, fieldInfo.type) > -1);
            
            array.forEach(renderer.infos, function(uvInfo) {
              dataValue = uvInfo.value;
              
              // Treat undefined, null and <empty-string> as just one type of value:
              // null
              if (
                dataValue == null || dataValue === "" || 
                (
                  typeof dataValue === "string" && 
                  (
                    lang.trim(dataValue) === "" || 
                    // Generate renderer returns this peculiar string for 
                    // features with null value.
                    dataValue.toLowerCase() === "<null>"
                  )
                ) 
              ) {
                dataValue = null;
              }
              
              // Initialize the counter if we haven't seen this value before.
              // Else, just increment the count.
              if (count[dataValue] == null) {
                count[dataValue] = {
                  count: uvInfo.count,
                  
                  // Generate renderer returns numeric values as strings in 
                  // uvInfo.label.
                  // Let's convert them back to numbers.
                  data: (isNumericField && dataValue) ? Number(dataValue) : dataValue
                };
              }
              else {
                count[dataValue].count = count[dataValue].count + uvInfo.count;
              }
            });
      
            dfd.resolve({ count: count });
          })
          
          .otherwise(function(error) {
            self._rejectDfd(dfd, "FeatureLayerStatistics: Generate renderer operation failed.");
          });
      }
      else {
        this._rejectDfd(dfd, "FeatureLayerStatistics: Generate renderer operation requires server version 10.1 or later.");
      }
      
      return dfd.promise;
    },
    
    _uvFromMemory: function(params) {
      var layer = this.layer, dfd = new Deferred(),
          fieldName = params.field,
          attr, dataValue, count = {};
      
      array.forEach(layer.graphics, function(graphic) {
        attr = graphic.attributes;
        dataValue = attr && attr[fieldName];
        
        // Treat undefined, null and <empty-string> as just one type of value:
        // null
        if (
          dataValue == null ||  dataValue === "" || 
          (typeof dataValue === "string" && lang.trim(dataValue) === "") 
        ) {
          dataValue = null;
        }
        
        // Initialize the counter if we haven't seen this value before.
        // Else, just increment the count.
        if (count[dataValue] == null) {
          count[dataValue] = {
            count: 1,
            data: dataValue
          };
        }
        else {
          count[dataValue].count++;
        }
      });
      
      dfd.resolve({ count: count });
      
      return dfd.promise;
    },
    
    _resolveUVDfd: function(response, info, fieldInfo, source) {
      var //fieldName = info.params.field, 
          count = response.count,
          domain = this.layer.getDomain(fieldInfo.name),
          dataValue, infos = [], obj; 
      
      // Make sure we include *all* domain codes to the unique values list, 
      // if the caller asked for them.
      if (
        info.params.includeAllCodedValues && 
        domain && domain.type === "codedValue"
      ) {
        array.forEach(domain.codedValues, function(codedValue) {
          var data = codedValue.code;
          
          if (!count.hasOwnProperty(data)) {
            count[data] = {
              data: data,
              count: 0
            };
          }
        });
      }
      
      for (dataValue in count) {
        obj = count[dataValue];
        
        infos.push({
          value: obj.data,
          count: obj.count
        });
      }

      info.dfd.resolve({
        source: source,
        uniqueValueInfos: infos
      });
    },
    
    ////////////////////
    // Class breaks
    ////////////////////
    
    _findClassBreaks: function(info) {
      var self = this,
          params = info.params,
          
          minValue = params.minValue,
          maxValue = params.maxValue,
          hasCustomMinMax = (minValue != null || maxValue != null),
          classMethod = params.classificationMethod,
          isNormByTotal = (params.normalizationType === "percent-of-total"),
          numClasses =  params.numClasses || this.numClasses,
          
          // Applicable only when custom min/max are specified.
          // Default is true.
          analyze = (params.analyzeData !== false),
          
          fieldInfo = this.layer.getField(params.field);
      
      if (this._rejectNonNumeric(info.dfd, fieldInfo, "getClassBreaks")) {
        return;
      }
      else if (hasCustomMinMax) {
        if (analyze) {
          if (isNormByTotal && params.normalizationTotal == null) {
            // We need to know <normaliztionTotal>.
            this._rejectDfd(info.dfd, "FeatureLayerStatistics.getClassBreaks: normalizationTotal is required when minValue/maxValue are specified.");
            return;
  
            // We can also fetch <normaliztionTotal> from the server by calling 
            // generate renderer without custom data range first.
          }
        }
        else {
          if (minValue == null || maxValue == null) {
            this._rejectDfd(info.dfd, "FeatureLayerStatistics.getClassBreaks: both minValue AND maxValue are required when data analysis is disabled.");
            return;
          }
          else if (classMethod && classMethod !== "equal-interval") {
            // We can support equal-interval classification only.
            // Other classification methods need data analysis by nature.
            this._rejectDfd(info.dfd, "FeatureLayerStatistics.getClassBreaks: data analysis can be disabled only for equal-interval classification.");
            return;
          }
          else if (isNormByTotal && params.normalizationTotal == null) {
            // We need to know <normaliztionTotal> since we're not analysing the data.
            this._rejectDfd(info.dfd, "FeatureLayerStatistics.getClassBreaks: normalizationTotal is required when data analysis is disabled.");
            return;
          }
        }
      }
      else if (!analyze) {
        this._rejectDfd(info.dfd, "FeatureLayerStatistics.getClassBreaks: both minValue AND maxValue are required when data analysis is disabled.");
        return;
      }
      
      if (analyze) {
        this._cbFromGenRend(params, numClasses)
          .then(function(renderer) {
            self._resolveCBDfd(info.dfd, params, renderer, self._srcGenRend);
          })
    
          .otherwise(function(error) {
            if (hasCustomMinMax) {
              // TODO
              // Remove this when _cbFromMemory supports minValue/maxValue.
              self._rejectDfd(info.dfd, "FeatureLayerStatistics.getClassBreaks: cannot calculate class breaks in-memory when minValue/maxValue are specified.");
            }
            else {
              self._cbFromMemory(params, numClasses)
                .then(function(renderer) {
                  self._resolveCBDfd(info.dfd, params, renderer, self._srcMemory);
                })
          
                .otherwise(function(error) {
                  self._rejectDfd(info.dfd, "FeatureLayerStatistics: unable to calculate class breaks.");
                });
            }
          });
      }
      else {
        // Can be safely assumed to be equal-interval classification due to 
        // error checks above.
        this._cbFromInterpolation(params, numClasses)
          .then(function(renderer) {
            self._resolveCBDfd(info.dfd, params, renderer, self._srcMemory);
          })
    
          .otherwise(function(error) {
            self._rejectDfd(info.dfd, "FeatureLayerStatistics: unable to calculate class breaks.");
          });
      }
    },
    
    _cbFromGenRend: function(params, numClasses) {
      var layer = this.layer, dfd = new Deferred(),
          self = this;
      
      if (layer.url && layer.version >= 10.1) {
        // Define input parameters
        var cbDef = this._createCBDefn(params, numClasses),
            whereInfo = this._getGRWhereInfo(layer, params),
            where = whereInfo.where,
            fieldExpr = this._getFieldExpr(params, params.normalizationTotal),
            customRangeFilter = this._getRangeExpr(fieldExpr, params.minValue, params.maxValue);
        
        var grParams = new GRParameters();
        grParams.classificationDefinition = cbDef;
  
        // where = filter for non-zero values + layer defn expr
        // customRangeFilter = filter for custom min/max
        grParams.where = where
          ? (
            where +
            (customRangeFilter ? (" AND " + customRangeFilter) : "")
          )
          : customRangeFilter;
  
        // TODO
        // Generate renderer returns error if the custom min/max range doesn't
        // match atleast one feature.
  
        // Execute generate renderer task
        this._grTask
          .execute(grParams)
          .then(function(renderer) {
            dfd.resolve(renderer);
          })
          
          .otherwise(function(error) {
            self._rejectDfd(dfd, "FeatureLayerStatistics: Generate renderer operation failed.");
          });
      }
      else {
        this._rejectDfd(dfd, "FeatureLayerStatistics: Generate renderer operation requires server version 10.1 or later.");
      }
      
      return dfd.promise;
    },
    
    _cbFromMemory: function(params, numClasses) {
      // TODO
      // Client-side algorithm seems to be wrong.
      // Test layer: http://services.arcgis.com/V6ZHFr6zdgNZuVG0/arcgis/rest/services/Warren_College_Trees/FeatureServer/0
      var dfd = new Deferred(),
          graphics = this.layer.graphics;
  
      if (graphics.length) {
        var cbDef = this._createCBDefn(params, numClasses),
            normTotal;
  
        if (params.normalizationType === "percent-of-total") {
          // Calculate "total" field value first - this is required for the actual
          // statistics calculation with normalization.
          normTotal = this._calcStatsFromMemory({
            field: params.field
          }).sum;
  
          if (normTotal == null) {
            // We cannot move forward without normalizationTotal.
            this._rejectDfd(dfd, "FeatureLayerStatistics: Invalid normalizationTotal.");
            return dfd.promise;
          }
  
          params = lang.mixin({
            normalizationTotal: normTotal
          }, params);
        }
  
        dfd.resolve(
          generateRenderer.createClassBreaksRenderer({
            features: graphics,
            definition: cbDef,
    
            // Temporary property until we figure out how to refactor
            // generateRenderer module.
            values: this._getDataValues(graphics, params)
          })
        );
      }
      else {
        this._rejectDfd(dfd, "Layer has 0 features in memory.");
      }
      
      return dfd.promise;
    },
    
    _cbFromInterpolation: function(params, numClasses) {
      // Generates class breaks using equal-interval classification.
      var dfd = new Deferred(),
          minValue = params.minValue,
          maxValue = params.maxValue;
      
      // Check validity of input parameters.
      if (
        (minValue >= maxValue) || 
        !numClasses || numClasses < 1
      ) {
        this._rejectDfd(dfd, "FeatureLayerStatistics.getClassBreaks: invalid input parameters: minValue, maxValue or numClasses.");
      }
      else {
        var infos = [], i, min,
            interval = (maxValue - minValue) / numClasses;
        
        for (i = 0; i < numClasses; i++) {
          min = minValue + (i * interval);
    
          infos.push({
            minValue: min,
            maxValue: min + interval
          });
        }
  
        // It is possible that the calculation above introduces
        // inifintesimal precision problem for the final maxValue.
        // Let's fix it.
        infos[numClasses - 1].maxValue = maxValue;
  
        // Resolves using renderer-like object just enough to be accepted by 
        // _resolveCBDfd.
        dfd.resolve({
          infos: infos,
          normalizationTotal: params.normalizationTotal
        });
      }
      
      return dfd.promise;
    },
    
    _createCBDefn: function(params, breakCount) {
      var field = params.field,
          classMethod = params.classificationMethod || this.classificationMethod,
          normType = params.normalizationType,
          normField = params.normalizationField;

      var cbDef = new CBDefinition();
      cbDef.classificationField = field;
      cbDef.breakCount = breakCount;
      cbDef.classificationMethod = classMethod;
      
      cbDef.standardDeviationInterval = (classMethod === "standard-deviation") 
        ? (params.standardDeviationInterval || this.standardDeviationInterval) 
        : undefined;
      
      cbDef.normalizationType = normType;
      cbDef.normalizationField = (normType === "field") ? normField : undefined;
      
      return cbDef;
    },
    
    _resolveCBDfd: function(dfd, params, renderer, source) {
      // console.log("renderer = ", renderer);
      
      var cbInfos = renderer.infos, len = cbInfos.length,
          min = cbInfos[0].minValue,
          max = cbInfos[len - 1].maxValue,
          isStdDev = (params.classificationMethod === "standard-deviation"),
          reNumber = this._reNumber,
          range, outInfo, label;

      // TODO
      // Remove spurious precision from min and max values
      
      cbInfos = array.map(cbInfos, function(cbInfo) {
        label = cbInfo.label;
        
        // Standard break properties
        outInfo = {
          minValue: cbInfo.minValue,
          maxValue: cbInfo.maxValue,
          
          // TODO
          // Add percent sign after min and max value where needed
          // Hosted Service does not set it.
          // Labels from SS6 seem to have it.
          // TODO
          // How should the label look when method = stddev, norm = percent?
          // TODO
          // Should we manually construct labels from values?
          label: label
        };

        // Add min/max stddev values to each break
        if (isStdDev && label) {
          // Extract stddev numbers from the label
          // Examples:
          //  "\u003c -0.75 Std. Dev."
          //  "-0.75 - -0.25 Std. Dev."
          //  "\u003e 5.34 Std. Dev."
          range = label.match(reNumber);
          
          // Convert them to numeric values.
          range = array.map(range, function(numStr) {
            return +lang.trim(numStr);
          });
          
          if (range.length === 2) {
            outInfo.minStdDev = range[0];
            outInfo.maxStdDev = range[1];
            
            // Examples:
            // -0.5 0.5
            // -0.25 0.25
            // -0.19 0.14
            // -0.12 0.13
            if (range[0] < 0 && range[1] > 0) {
              outInfo.hasAvg = true;
            }
          }
          else if (range.length === 1) {
            if (label.indexOf("<") > -1) {
              outInfo.minStdDev = null;
              outInfo.maxStdDev = range[0];
            }
            else if (label.indexOf(">") > -1) {
              outInfo.minStdDev = range[0];
              outInfo.maxStdDev = null;
            }
          }
          
          // console.log(label, range, outInfo.hasAvg);
        }
        
        return outInfo;
      });
      
      dfd.resolve({
        minValue: min,
        maxValue: max,
        classBreakInfos: cbInfos,
        normalizationTotal: renderer.normalizationTotal,
        source: source
      });
    },
    
    _rejectDfd: function(dfd, errorMsg) {
      // TODO
      // Aggregate and bubble up all error messages including the 
      // message/details returned by the service.
      //console.log("FLS ERROR: ", errorMsg);
      dfd.reject(new Error(errorMsg));
    },
    
    _rejectNonNumeric: function(dfd, fieldInfo, method) {
      var error;
      
      // Reject if
      // 1. Field is not found
      // 2. Field is not numeric
      if (!fieldInfo) {
        this._rejectDfd(dfd, "FeatureLayerStatistics." + method + ": unknown 'field'.");
        error = true;
      }
      else if (
        fieldInfo.name === this.layer.objectIdField || 
        array.indexOf(this._numericTypes, fieldInfo.type) === -1
      ) {
        this._rejectDfd(dfd, "FeatureLayerStatistics." + method + ": 'field' should be numeric.");
        error = true;
      }
      
      return error;
    },
    
    _getAttributeVal: function(attributes, fieldName) {
      // Accessing attribute value would be a simple object["property"],
      // except statistics query result does not retain character casing
      // of out statistic fields provided in the query parameters.
      // We need to do case-agnostic attribute lookup.
      var value, name;
      
      fieldName = fieldName.toLowerCase();
      
      if (attributes) {
        for (name in attributes) {
          if (name.toLowerCase() === fieldName) {
            value = attributes[name];
            break;
          }
        }
      }
      
      return value;
    },
    
    _callAfterLoad: function(callback, info) {
      if (this.layer.loaded) {
        callback.call(this, info);
      }
      else {
        on.once(this.layer, "load", lang.hitch(this, callback, info));
      }
    },
    
    _numericTypes: [
      "esriFieldTypeInteger",
      "esriFieldTypeSmallInteger",
      "esriFieldTypeSingle",
      "esriFieldTypeDouble"
    ],
    
    _createGRTask: function() {
      this._grTask = new GRTask(this.layer, {
        source:     this.layer.source,
        gdbVersion: this.layer.gdbVersion
      });
    }
    
  });
  
  ////////////////////
  // Static functions
  ////////////////////
  
  // All plugins must implement these functions regardless of their
  // internal architecture.
  
  lang.mixin(FeatureLayerStatistics, {
    
    // Called by PluginTarget.addPlugin
    add: function(layer, options) {
      if (!layer.statisticsPlugin) {
        var parameters = options || {};
        parameters.layer = layer;
        
        layer.statisticsPlugin = new FeatureLayerStatistics(parameters);
      }
    },

    // Called by PluginTarget.removePlugin
    remove: function(layer) {
      if (layer.statisticsPlugin) {
        layer.statisticsPlugin.destroy();
        delete layer.statisticsPlugin;
      }
    }
    
  });

  return FeatureLayerStatistics;
});
