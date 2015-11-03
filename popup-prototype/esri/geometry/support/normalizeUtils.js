define(
[
  "dojo/_base/array",
  "dojo/_base/lang",
  "dojo/_base/Deferred",
  "../../config",
  "../Polyline",
  "../Polygon",
  "./webMercatorUtils",
  "./jsonUtils"
],
function(array, lang, Deferred, esriConfig, Polyline, Polygon, webMercatorUtils, jsonUtils) {

  function _offsetMagnitude(xCoord,offsetFromX) {  //takes xCoord and computes offsetMagnitude with respect to offsetFromX value   
    return Math.ceil((xCoord - offsetFromX) / (offsetFromX * 2));
  }

  function _updatePolyGeometry(geometry, offsetX) {  //transforms polyline or polygon geometry types
    var geometryParts = geometry.paths || geometry.rings,
        i, j, il = geometryParts.length, jl;
        
    for (i = 0; i < il; i++) {
      var geometryPart = geometryParts[i];
      jl = geometryPart.length;
      
      for (j = 0; j < jl; j++) {
        var currentPoint = geometry.getPoint(i, j);
        geometry.setPoint(i,j,currentPoint.offset(offsetX,0));
      }
    }
    return geometry;
  }

  function _straightLineDensify(geom, maxSegmentLength) {
    if (!(geom instanceof Polyline || geom instanceof Polygon)) {
      var msg = "_straightLineDensify: the input geometry is neither polyline nor polygon";
      console.error(msg);
      throw new Error(msg);
    }
    var isPline = geom instanceof Polyline,
        iRings = isPline ? geom.paths : geom.rings,
        oRings = [],
        oRing;
    array.forEach(iRings, function (ring) {
      oRings.push(oRing = []);
      oRing.push([ring[0][0], ring[0][1]]);
      var x1, y1, x2, y2;
      var i, j, straightLineDist, sinAlpha, cosAlpha, numberOfSegment, xj, yj;
      for (i = 0; i < ring.length - 1; i++) {
        x1 = ring[i][0];
        y1 = ring[i][1];
        x2 = ring[i + 1][0];
        y2 = ring[i + 1][1];
        straightLineDist = Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
        sinAlpha = (y2 - y1) / straightLineDist;
        cosAlpha = (x2 - x1) / straightLineDist;
        numberOfSegment = straightLineDist / maxSegmentLength;
        if (numberOfSegment > 1) {
          for (j = 1; j <= numberOfSegment - 1; j++) {
            var length = j * maxSegmentLength;
            xj = cosAlpha * length + x1;
            yj = sinAlpha * length + y1;
            oRing.push([xj, yj]);
          }
          //the last segment which is longer than the max, but shorter than 2*max
          //divide it in the middle to prevent the result of a very small segment
          var lastDensifiedLength = (straightLineDist + Math.floor(numberOfSegment - 1) * maxSegmentLength) / 2;
          xj = cosAlpha * lastDensifiedLength + x1;
          yj = sinAlpha * lastDensifiedLength + y1;
          oRing.push([xj, yj]);
        }
        //add the end of the original segment
        oRing.push([x2, y2]);
      }
    });
    if (isPline) {
      return new Polyline({
        paths: oRings,
        spatialReference: geom.spatialReference
      });
    } else {
      return new Polygon({
        rings: oRings,
        spatialReference: geom.spatialReference
      });
    }
  }

  function _prepareGeometryForCut(geometry,mercatorFlag,offsetX) {  //prepares geometry for projection input.
    var densifiedMaxSegementLength = 1000000;  //1000km max segment length.  Should this be configurable?
    if (mercatorFlag) {  //densify and convert to wgs84 if coord system is web mercator.  Call webMercatorToGeographic with flag that keeps coordinates in linear space (x can be greater than 180 or less than -180
      var densifiedGeometry = _straightLineDensify(geometry,densifiedMaxSegementLength);
      geometry = webMercatorUtils.webMercatorToGeographic(densifiedGeometry,true);
    }
    if (offsetX) {  //offset geometry if defined
      geometry = _updatePolyGeometry(geometry, offsetX);
    }
    return geometry;
  }
  
  function _pointNormalization(point, maxX, minX) {
    var pointX = point.x || point[0];  //point or multipoint
    var offsetMagnitude;
    if (pointX > maxX) {
      offsetMagnitude = _offsetMagnitude(pointX,maxX); 
      if (point.x) {
        point = point.offset(offsetMagnitude * (-2 * maxX),0);
      } else {
        point[0] = pointX + (offsetMagnitude * (-2 * maxX));
      }
    } else if (pointX < minX) {
      offsetMagnitude = _offsetMagnitude(pointX,minX);  
      if (point.x) {
        point = point.offset(offsetMagnitude * (-2 * minX),0);
      } else {
        point[0] = pointX + (offsetMagnitude * (-2 * minX));
      }
    }
    //console.log(point);
    return point;
  }
 
  function _foldCutResults(geometries,cutResults) {
    var currentGeometryIndex = -1;
    array.forEach(cutResults.cutIndexes, function(cutIndex, i) {
      var currentGeometry = cutResults.geometries[i];
      var geometryParts = currentGeometry.rings || currentGeometry.paths;

      array.forEach(geometryParts, function(points, geometryPartIndex) {
        array.some(points,function(point) {  //test if geometry part is to the right of 180, if so then shift to bring within -180 and +180
          /*if (point[0] === (180 + (offsetMagnitude * 360))) {  //point is equal to either 180, 540, 900, etc.  need to test next point
            return false;  //continue test
          } else*/ 
          
          if (point[0] < 180) {
            return true;  //geometry doesn't need to be shifted; exit out of function
          } else {  //point should be shifted.  Use offsetMagnitude to determine offset.
          
            var partMaxX = 0, j, jl = points.length, ptX;
            for (j = 0; j < jl; j++) {
              ptX = points[j][0];
              partMaxX = ptX > partMaxX ? ptX : partMaxX;
            }
            
            // Since ArcGIS Server v10.1, GeometryServer has slightly different 
            // cut behavior:
            // At the cut boundary (i.e. first and last points in a ring), cut result has 
            // x = 180.00000000000011 instead of 180. It really should be 180 because
            // the x-coordinate of input cut lines is 180.
            // This results in offsetMagnitude value of 1 instead of 0.
            
            // Explanation from GeometryServer team:
            // The difference between 180 (10.0 result) and 180.00000000000011 (10.2.1 result) 
            // is less than both the resolution and tolerance of the spatial reference . 
            // That means that for storage and processing, they are considered the same number. 
            // There will be no effect on operations.

            // toFixed removes that spurious precision.
            partMaxX = Number(partMaxX.toFixed(9));
            
            var offsetMagnitude = _offsetMagnitude(partMaxX,180),
                offsetX = offsetMagnitude * -360,
                pointIndex, pointsLength = points.length;
            
            for (pointIndex = 0; pointIndex < pointsLength; pointIndex++) {
              var currentPoint = currentGeometry.getPoint(geometryPartIndex, pointIndex);
              currentGeometry.setPoint(geometryPartIndex,pointIndex,currentPoint.offset(offsetX,0));
            }

            return true;  //exit out of function
          }      
        });  //end points array.some 
      });  //end geometryPart loop
      
      //cut geometry is either added to geometries array as a new geometry or it is added as a new ring/path to the existing geometry.  
      if (cutIndex === currentGeometryIndex) {  //cut index is equal to current geometry index; add geometry to existing geometry as new rings
        if (currentGeometry.rings) {  //polygon
          array.forEach(currentGeometry.rings, function(ring) {  //each ring in cut geometry should be added to existing geometry
            geometries[cutIndex] = geometries[cutIndex].addRing(ring);
          });
        } else { //polyline
          array.forEach(currentGeometry.paths, function(path) {  //each path in cut geometry should be added to existing geometry
            geometries[cutIndex] = geometries[cutIndex].addPath(path);
          });        
        }
      } else {  //new geometry; add to geometries array.
        currentGeometryIndex = cutIndex;
        geometries[cutIndex] = currentGeometry;
      }
    });
    return geometries;
  }

  function normalizeCentralMeridian(geometries, geometryService, callback, errorCallback) {
    // Deferred
    var dfd = new Deferred();
    dfd.then(callback, errorCallback);

    geometryService = geometryService || esriConfig.geometryService;

    var normalizedGeometries = [],
        geometriesToBeCut = [],
        normalizedSR, 
        info, //input SR
        webMercatorFlag,
        maxX,
        minX,
        wkid,
        plus180Line,
        minus180Line,
        geometryMaxX = 0;  //used to define the maxX for all geometries.  
    
    array.forEach(geometries, function (geometry) {
      if (!geometry) {
        normalizedGeometries.push(geometry);
        return;
      }
      
      // Get some data when we see the first geometry
      // It is expected that all geometries have identical SR
      if (!normalizedSR) {
        normalizedSR = geometry.spatialReference;
        info = normalizedSR._getInfo();
        webMercatorFlag = normalizedSR.isWebMercator();
        maxX = webMercatorFlag ? 20037508.342788905 : 180;
        minX = webMercatorFlag ? -20037508.342788905 : -180;
        wkid = webMercatorFlag ? 102100 : 4326;
        
        plus180Line = new Polyline({
          "paths": [
            [
              [maxX, minX],
              [maxX, maxX]
            ]
          ],
          "spatialReference": { "wkid": wkid }
        });
        
        minus180Line = new Polyline({
          "paths": [
            [
              [minX, minX],
              [minX, maxX]
            ]
          ],
          "spatialReference": { "wkid": wkid }
        });
      }

      // TODO
      // We got to handle mixed SRs better
      
      if (!info) { // We cannot normalize this SR
        normalizedGeometries.push(geometry);
        return;
      }
      
      //first pass through geometries to see if they need to be normalized (shift OR cut and shift).  
      //If geometry type point then offset point if needed.
      //Else If geometry type is multipoint, then offset each point as needed to ensure points between -180 and 180.
      //Else geometry is polyline or polygon, translate geometry if needed so that geometry extent.xmin is within -180 and 180 and then test if geometry extent intersects either -180 or +180
      //var newGeometry = esri.geometry.fromJSON(dojo.fromJson(dojo.toJson(geometry.toJSON()))), //clone geometry.
      var newGeometry = jsonUtils.fromJSON(geometry.toJSON()), //clone geometry.
          geomExtent = geometry.getExtent();

      if (geometry.type === "point") {  //
      
        normalizedGeometries.push(_pointNormalization(newGeometry, maxX, minX));
        
      } else if (geometry.type === "multipoint") {
        
        newGeometry.points = array.map(newGeometry.points, function(point) {
          return _pointNormalization(point, maxX, minX);
        });
        normalizedGeometries.push(newGeometry);
        
      } else if (geometry.type === "extent") {
        var normalized = geomExtent._normalize(null, null, info);
        
        normalizedGeometries.push(normalized.rings ? new Polygon(normalized) : normalized);
        
      } else if (geomExtent) {  
        
        //geometry is polyline or polygon, translate geometry so that geometry extent.xmin is within -180 and 180
        var magnitude = _offsetMagnitude(geomExtent.xmin,minX),  //magnitude of offset with respect to minX
            offset = magnitude * (2 * maxX);
        newGeometry = (offset === 0) ? newGeometry : _updatePolyGeometry(newGeometry, offset);  //offset if needed to bring into range
        geomExtent = geomExtent.offset(offset,0);       
        
        if (geomExtent.intersects(plus180Line) && (geomExtent.xmax !== maxX)) {
          geometryMaxX = (geomExtent.xmax > geometryMaxX) ? geomExtent.xmax : geometryMaxX;  
          newGeometry = _prepareGeometryForCut(newGeometry,webMercatorFlag);
          geometriesToBeCut.push(newGeometry); //intersects 180, candidate for cut
          normalizedGeometries.push("cut"); //place holder for cut geometry        
        
        } else if (geomExtent.intersects(minus180Line) && (geomExtent.xmin !== minX)) {
          geometryMaxX = (geomExtent.xmax * (2*maxX) > geometryMaxX) ? geomExtent.xmax * (2*maxX) : geometryMaxX;
          newGeometry = _prepareGeometryForCut(newGeometry,webMercatorFlag,360);
          geometriesToBeCut.push(newGeometry); //intersects -180 candidate for cut against 180 cut line after offset
          normalizedGeometries.push("cut"); //place holder for cut geometry        
        
        } else {
          //console.log(newGeometry);
          normalizedGeometries.push(newGeometry);  //geometry is within -180 and +180      
        }
      } else {
        // If the geomExtent is not defined then just push the geometry
        normalizedGeometries.push(newGeometry);
      }
    });

    var cutLineDegrees = new Polyline(),
        cutCount = _offsetMagnitude(geometryMaxX,maxX),  //offset magnitude from maxX defines the number of cut lines needed.
        yLast = -90, count = cutCount;
        
    while (cutCount > 0) {
      var cutLongitude = -180 + (360 * cutCount);
      cutLineDegrees.addPath([[cutLongitude,yLast],[cutLongitude,yLast * -1]]);
      yLast = yLast * -1;
      cutCount--;
    }
    //console.log(dojo.toJson(cutLineDegrees.toJSON()));
    
    // "count" could be 0 if geometryMaxX and maxX are equal
    if (geometriesToBeCut.length > 0 && count > 0) {  //need to call geometry service to cut; after cut operation is done, push features back into normalizedGeometries array
      
      if (geometryService) {
        geometryService.cut(geometriesToBeCut,cutLineDegrees,function(cutResults) {
          geometriesToBeCut = _foldCutResults(geometriesToBeCut,cutResults);
          
          var geometriesToBeSimplified = [];
          array.forEach(normalizedGeometries, function (normalizedGeometry, i) { //keep order of input geometries
            if (normalizedGeometry === "cut") {
              var newGeometry = geometriesToBeCut.shift();
              
              // The "equals" case in the if condition below happens in the 
              // following scenario:
              // 1. Draw a polygon across the dateline and normalize it, 
              //    resulting in two rings.
              // 2. Move the polygon so that it is contained within -180 and 
              //    +180.
              // 3. Normalize the polygon now. You'll get here after cut 
              //    finished on this polygon.
              
              if ((geometries[i].rings) && (geometries[i].rings.length > 1) && (newGeometry.rings.length >= geometries[i].rings.length)) {  //candidate for simplify if orig geometry is polygon and has more than 1 ring and the new geometry has more rings than the orig geometry
                normalizedGeometries[i] = "simplify";
                geometriesToBeSimplified.push(newGeometry);
              } else {  //convert back to web mercator if needed and assign to normalizedGeometries array
                normalizedGeometries[i] = (webMercatorFlag === true) ? webMercatorUtils.geographicToWebMercator(newGeometry) : newGeometry;            
              }
            }
          });
          
          if (geometriesToBeSimplified.length > 0) {
            geometryService.simplify(geometriesToBeSimplified,function(simplifiedGeometries) {
              array.forEach(normalizedGeometries, function(normalizedGeometry,i) {
                if (normalizedGeometry === "simplify") {
                  normalizedGeometries[i] = (webMercatorFlag === true) ? webMercatorUtils.geographicToWebMercator(simplifiedGeometries.shift()) : simplifiedGeometries.shift();            
                }
              });
              dfd.callback(normalizedGeometries);  //return normalizedGeometries to caller
            }, function(error) {
              dfd.errback(error);
            });
          } else {
            dfd.callback(normalizedGeometries);  //return normalizedGeometries to caller
          }
          
        }, function(error) {
          dfd.errback(error);
        });
        
      } else { // geometryService argument is missing
        dfd.errback(new Error("esri.geometry.normalizeCentralMeridian: 'geometryService' argument is missing."));
      }
      
    } else {
      // It is possible that some geometries were marked for "cut" but are 
      // false positives. 
      // Example: an input polygon that is split on either side of +180 or -180.
      // Let's handle them before returning to the caller.
      array.forEach(normalizedGeometries, function (normalizedGeometry, i) {
        if (normalizedGeometry === "cut") {
          var newGeometry = geometriesToBeCut.shift();
          //console.log("False positive: ", newGeometry);
          normalizedGeometries[i] = (webMercatorFlag === true) ? webMercatorUtils.geographicToWebMercator(newGeometry) : newGeometry;
        }
      });
      
      dfd.callback(normalizedGeometries);  //return normalizedGeometries to caller
    }
    
    return dfd.promise;
  }
  
  function _addToBucket(value, bucket, argIndex, property) {
    // TODO
    // Add test cases
    var flag = false, className;
    
    if (lang.isObject(value) && value) {
      if (lang.isArray(value)) {
        if (value.length) {
          className = value[0] && value[0].declaredClass;
          if (className && className.indexOf("Graphic") !== -1) {
            // Array of Graphics. Extract Geometries
            value = array.map(value, function(feature) {
              return feature.geometry;
            });
            //value = dojo.filter(value, esri._isDefined);
            flag = value.length ? true : false;
          }
          else if (className && className.indexOf("esri.geometry.") !== -1) {
            // Array of Geometries
            flag = true;
          }
        }
      }
      else {
        className = value.declaredClass;
        if (className && className.indexOf("FeatureSet") !== -1) {
          // Array of Graphics. Extract Geometries
          value = array.map(value.features || [], function(feature) {
            return feature.geometry;
          });
          //value = dojo.filter(value, esri._isDefined);
          flag = value.length ? true : false;
        }
        else if (className && className.indexOf("esri.geometry.") !== -1) {
          // Geometry
          flag = true;
        }
        //flag = true;
      }
    }
    
    if (flag) {
      bucket.push({
        index: argIndex,
        property: property, // optional
        value: value // can be a single geometry or array of geometries
      });
    }
  }
  
  function _disassemble(inArgs, argInfos) {
    // This method will look into the input arguments
    // or their individual properties, find values as 
    // specified by argInfos and put them in an array.
    
    // TODO
    // Add test cases
    
    var bucket = [];
    
    // Look for geometry(s) in the input arguments
    // and push them into a bucket to be normalized
    // Disassembly: arguments broken down
    array.forEach(argInfos, function(argInfo) {
      var argIndex = argInfo.i,
          arg = inArgs[argIndex], 
          properties = argInfo.p, prop;
      
      // We want to look for geometry(s) only
      if (!lang.isObject(arg) || !arg) {
        return;
      }
      
      if (properties) { // argument has property(s) that need to be normalized
        if (properties[0] === "*") { 
          // UNKNOWN parameters. GP FeatureSet parameters
          for (prop in arg) {
            if (arg.hasOwnProperty(prop)) {
              _addToBucket(arg[prop], bucket, argIndex, prop);
            }
          }
        }
        else {
          array.forEach(properties, function(prop) {
            _addToBucket(lang.getObject(prop, false, arg) /*arg[prop]*/, bucket, argIndex, prop);
          });
        }
      }
      else { // argument itself needs to be normalized
        _addToBucket(arg, bucket, argIndex);
      }    
    });
    
    return bucket;
  }
  
  function _reassemble(normalized, components) {
    var idx = 0, assembly = {};
    
    array.forEach(components, function(comp) {
      var index = comp.index,
          property = comp.property,
          value = comp.value,
          len = value.length || 1;
      
      var result = normalized.slice(idx, idx + len);
      if (!lang.isArray(value)) {
        result = result[0];
      }
      
      idx += len;
      delete comp.value;
      
      if (property) {
        assembly[index] = assembly[index] || {};
        assembly[index][property] = result;
      }
      else {
        assembly[index] = result;
      }
    });
    
    return assembly;
  }

  function _createWrappers(className) {
    var classProto = (lang.isObject(className)) ? 
                      className.prototype : 
                      lang.getObject(className + ".prototype");
  
    /**
     * Spec for the method signature:
     * {
     *   n: <String>,
     *      // Name of the method being wrapped
     *   
     *   c: <Number>,
     *      // Number of arguments supported by the method before
     *      // normalization came into play.
     *   
     *      // List of arguments or properties of arguments that
     *      // need to be normalized
     *   a: [
     *    {
     *      i: <Number>,
     *         // Index of this argument in the method signature
     *      
     *      p: <String[]>
     *         // If this argument is an object that may contain
     *         // properties that need to be normalized, indicate
     *         // such properties here. OPTIONAL.
     *    }
     *   ],
     *   
     *   e: <Number>,
     *      // Index of the argument that is an error callback
     * }
     */  
    array.forEach(classProto.__msigns, function(sig) {
      //console.log("Patching: ", className + ".prototype." + sig.n);
      var methodProto = classProto[sig.n];
      
      // Define wrapper
      // methodInfo and methodProto will be available within 
      // this wrapper via closure
      // Test multiple consecutive invocations of the wrapped
      // method -- seems to be doing okay
      classProto[sig.n] = function() {
        var self = this, inArgs = [], i;

        // Pre-process input arguments
        for (i = 0; i < sig.c; i++) {
          inArgs[i] = arguments[i];
        }
        
        // Make sure the wrapped method is aware that
        // "context" is passed as the last argument
        var context = { };
        inArgs.push(context);
        
        var components, toBeNormalized = [], intermediateDfd;
  
        if (self.normalization && !self._isTable) { // normalize if not a feature layer "table"
          components = _disassemble(inArgs, sig.a);
          
          array.forEach(components, function(comp) {
            toBeNormalized = toBeNormalized.concat(comp.value);
          });
          
          //intermediateDfd = esri._fakeNormalize(toBeNormalized.length ? toBeNormalized : null); 
          
          // TODO
          // We got to handle mixed SRs better
          if (toBeNormalized.length) {
            //var sr = toBeNormalized[0].spatialReference;
            //if (sr && sr.isWrappable()) {
              intermediateDfd = normalizeCentralMeridian(toBeNormalized);
            //}
          }
        }
        
        // Check if normalize routine is initiated
        if (intermediateDfd) {
          // Register proper callbacks to be called when we
          // have normalize results
          //console.log("Normalizing...");

          return intermediateDfd.then(
            function(normalized) {
              //console.log("Normalized: ", normalized);
              context.assembly = _reassemble(normalized, components);
              //console.log("Assembly: ", context.assembly);

              // We need to invoke the actual method now that we have
              // the normalized geometry
              return methodProto.apply(self, inArgs);
            });
        }
        else {
          //console.log("Normalizing not happening...");

          // We're not normalizing, just execute the query
          return methodProto.apply(self, inArgs);
        }
      };
      
    }); // methods
    
  }
  
  var normalizeUtils = {
    normalizeCentralMeridian: normalizeCentralMeridian,
    _foldCutResults: _foldCutResults,
    _prepareGeometryForCut: _prepareGeometryForCut,
    _offsetMagnitude: _offsetMagnitude,
    _pointNormalization: _pointNormalization,
    _updatePolyGeometry: _updatePolyGeometry,
    _straightLineDensify: _straightLineDensify,
    
    _createWrappers: _createWrappers,
    _disassemble: _disassemble,
    _addToBucket: _addToBucket,
    _reassemble: _reassemble
  };

  

  return normalizeUtils;  
});
