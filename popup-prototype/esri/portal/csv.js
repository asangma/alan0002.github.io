define([
  "dojo/_base/lang",
  "dojo/_base/array",
  "dojo/_base/Deferred",
  "dojo/sniff",
  "dojo/number",
  "dojox/data/CsvStore",
  
  "../config",
  "../request",
  "../geometry/SpatialReference",
  "../geometry/support/jsonUtils",
  "../geometry/support/webMercatorUtils"
], function(lang, array, Deferred, has, number, CsvStore,
            esriConfig, esriRequest, SpatialReference, jsonUtils, webMercatorUtils) {

  var latFieldStrings = ["lat", "latitude", "y", "ycenter", "latitude83", "latdecdeg", "POINT-Y"],
      longFieldStrings = ["lon", "lng", "long", "longitude", "x", "xcenter", "longitude83", "longdecdeg", "POINT-X"];

  /*****************
   * Internal methods
   *****************/

  function _getSeparator(string) {
    var separators = [",", " ", ";", "|", "\t"];
    var maxSeparatorLength = 0;
    var maxSeparatorValue = "";
    array.forEach(separators, function(separator) {
      var length = string.split(separator).length;
      if (length > maxSeparatorLength) {
        maxSeparatorLength = length;
        maxSeparatorValue = separator;
      }
    });
    return maxSeparatorValue;
  }

  function _isValidDate(d, strValue) {
    if (!d || Object.prototype.toString.call(d) !== "[object Date]" || isNaN(d.getTime())) {
      return false;
    }

    var isDate = true;

    // Check for false positives in Chrome where the following strings are
    // parsed as Date objects:
    //   new Date("technology 10")
    //   new Date("http://a.com/b/c/570")
    // Related bug: http://code.google.com/p/chromium/issues/detail?id=53209
    // The situation is a real mess.
    // http://www.google.com/codesearch#search&q=DateParseString+package:http://v8\.googlecode\.com
    // http://www.google.com/codesearch#W9JxUuHYyMg/trunk/src/dateparser-inl.h
    // Note these comments in dateparser-inl.h:
    //   Any unrecognized word before the first number is ignored.
    //   Garbage words are illegal if a number has been read.
    // http://code.google.com/p/v8/source/browse/trunk/src/date.js#1056
    // http://code.google.com/p/v8/source/browse/trunk/src/date.js#534

    // IMPORTANT NOTE
    // If this routine is updated, make sure esri\arcgisonline\map\fileImport.js
    // is updated as well

    if (has("chrome") && /\d+\W*$/.test(strValue)) { // strings ends with a number
      var match = strValue.match(/[a-zA-Z]{2,}/);
      if (match) { // process all words that have only alphabet characters
        var garbageFound = false, i = 0, len = match.length, reKeywords = /^((jan(uary)?)|(feb(ruary)?)|(mar(ch)?)|(apr(il)?)|(may)|(jun(e)?)|(jul(y)?)|(aug(ust)?)|(sep(tember)?)|(oct(ober)?)|(nov(ember)?)|(dec(ember)?)|(am)|(pm)|(gmt)|(utc))$/i;

        while (!garbageFound && (i <= len) && !(garbageFound = !reKeywords.test(match[i]))) {
          i++;
        }

        isDate = !garbageFound;
      }
    }

    return isDate;
  }

  function _processCsvData(data, layerJson, handler) {
    var newLineIdx = data.indexOf("\n");
    var firstLine = lang.trim(data.substr(0, newLineIdx)); //remove extra whitespace, not sure if I need to do this since I threw out space delimiters
    var separator = layerJson.columnDelimiter;
    if (!separator) {
      separator = _getSeparator(firstLine);
    }

    var csvStore = new CsvStore({
      data: data,
      separator: separator
    });
    csvStore.fetch({
      onComplete: function(items, request) {
        var objectId = 0;

        var featureCollection = {
          "layerDefinition": layerJson.layerDefinition,
          "featureSet": {
            "features": [],
            "geometryType": "esriGeometryPoint"
          }
        };

        var objectIdFieldName = featureCollection.layerDefinition.objectIdField;
        var layerDefFields = featureCollection.layerDefinition.fields;

        if (!objectIdFieldName) {
          if (!array.some(layerDefFields, function(field) {
                if (field.type === "esriFieldTypeOID") {
                  objectIdFieldName = field.name;
                  return true;
                }
                return false;
              })
          ) {
            layerDefFields.push({
              "name": "__OBJECTID",
              "alias": "__OBJECTID",
              "type": "esriFieldTypeOID",
              "editable": false
            });
            objectIdFieldName = "__OBJECTID";
          }
        }

        var latField, longField;

        // var fieldNames = csvStore.getAttributes(items[0]); if first item has null values we end up missing fields
        var fieldNames = csvStore._attributes;

        var dateFieldPosList = [];
        var numberFieldPosList = [];
        array.forEach(layerDefFields, function(field) {
          if (field.type === "esriFieldTypeDate") {
            dateFieldPosList.push(field.name);
          } else if (field.type === "esriFieldTypeDouble" || field.type === "esriFieldTypeInteger") {
            numberFieldPosList.push(field.name);
          }
        });

        if (layerJson.locationInfo && layerJson.locationInfo.locationType === "coordinates") {
          latField = layerJson.locationInfo.latitudeFieldName;
          longField = layerJson.locationInfo.longitudeFieldName;
        } else {
          array.forEach(fieldNames, function(fieldName) {
            var matchId;
            matchId = array.indexOf(latFieldStrings, fieldName.toLowerCase());
            if (matchId !== -1) {
              latField = fieldName;
            }
            matchId = array.indexOf(longFieldStrings, fieldName.toLowerCase());
            if (matchId !== -1) {
              longField = fieldName;
            }
          });
        }

        if (!latField || !longField) {
          // otherwise dialog doesn't show up in IE or Safari
          var errMsg = "File does not seem to contain fields with point coordinates.";
          setTimeout(function() {
            console.error(errMsg);
          }, 1);
          if (handler) {
            handler(null, new Error(errMsg));
          }
          return;
        }

        // make sure latField and longField are in numberFieldPosList
        if (array.indexOf(numberFieldPosList, latField) === -1) {
          numberFieldPosList.push(latField);
        }
        if (array.indexOf(numberFieldPosList, longField) === -1) {
          numberFieldPosList.push(longField);
        }

        var outFields; // default is all fields
        if (lang.isArray(layerJson.outFields) &&
            array.indexOf(layerJson.outFields, "*") === -1) {
          outFields = layerJson.outFields;
        }

        // add missing fields to layerDefFields
        array.forEach(fieldNames, function(fieldName) {
          if (!array.some(layerDefFields, function(field) {
                return fieldName === field.name;
              })
          ) {
            layerDefFields.push({
              "name": fieldName,
              "alias": fieldName,
              "type": (fieldName === latField || fieldName === longField) ?
                  "esriFieldTypeDouble" : "esriFieldTypeString"
            });
          }
        });

        // Add records in this CSV store as graphics
        var i = 0, il = items.length;
        for (i; i < il; i++) {
          var item = items[i];

          var attrs = csvStore.getAttributes(item),
              attributes = {};

          // Read all the attributes for  this record/item
          array.forEach(attrs, function(attr) {
            if (attr &&
                (attr === latField ||
                    attr === longField ||
                    !outFields ||
                    array.indexOf(outFields, attr) > -1)
            ) {
              var origAttr = attr;
              if (attr.length === 0) {
                array.forEach(layerDefFields, function(field, idx) {
                  if (field.name === "attribute_" + (idx - 1)) {
                    attr = "attribute_" + (idx - 1);
                  }
                });
              }

              if (array.indexOf(dateFieldPosList, attr) > -1) {
                // date field
                var val = csvStore.getValue(item, origAttr),
                    date = new Date(val);
                attributes[attr] = _isValidDate(date, val) ? date.getTime() : null;
              } else if (array.indexOf(numberFieldPosList, attr) > -1) {
                // number fields
                var value = number.parse(csvStore.getValue(item, origAttr));
                if ((attr === latField || attr === longField) &&
                    (isNaN(value) || Math.abs(value) > 181)) {
                  // locale set to english:
                  // dojo.number.parse works fine for 1.234
                  // dojo.number.parse returns 1234 for 1,234
                  // dojo.number.parse returns NaN for 1,2345
                  // parseFloat returns 1 for 1,234
                  // locale set to french:
                  // dojo.number.parse works fine for 1,234
                  // dojo.number.parse returns 1234 for 1.234
                  // dojo.number.parse returns NaN for 1.2345
                  // parseFloat works for 1.234
                  value = parseFloat(csvStore.getValue(item, origAttr));
                  if (isNaN(value)) {
                    attributes[attr] = null;
                  } else {
                    attributes[attr] = value;
                  }
                } else if (isNaN(value)) {
                  attributes[attr] = null;
                } else {
                  attributes[attr] = value;
                }
              } else {
                // string fields
                attributes[attr] = csvStore.getValue(item, origAttr);
              }
            } // else CSV file bad. Line has more values than fields
          });

          attributes[objectIdFieldName] = objectId;
          objectId++;

          var latitude = attributes[latField];
          var longitude = attributes[longField];

          // values are null if field is type number, but actual value is a string
          if (longitude == null || latitude == null || isNaN(latitude) || isNaN(longitude)) {
            continue;
          }

          if (outFields && array.indexOf(outFields, latField) === -1) {
            delete attributes[latField];
          }
          if (outFields && array.indexOf(outFields, longField) === -1) {
            delete attributes[longField];
          }

          var feature = {
            "geometry": {
              x: longitude,
              y: latitude,
              spatialReference: {
                wkid: 4326
              }
            },
            "attributes": attributes
          };
          featureCollection.featureSet.features.push(feature);
        }

        featureCollection.layerDefinition.name = "csv";

        if (handler) {
          handler(featureCollection);
        }
      },
      onError: function(error) {
        console.error("Error fetching items from CSV store: ", error);
        if (handler) {
          handler(null, error);
        }
      }
    });

    return true;
  }

  function _projectGeometries(jsonGeometries, geometryType, inSR, outSR, handler, errorHandler) {
    if (jsonGeometries.length === 0) {
      handler(null);
    }

    // build esri.Geometry objects
    var Geometry = jsonUtils.getGeometryType(geometryType);
    var geometries = [];
    array.forEach(jsonGeometries, function(jsonGeometry) {
      var geometry = new Geometry(jsonGeometry);
      geometry.spatialReference = inSR;
      geometries.push(geometry);
    }, this);

    var mercator = [102113, 102100, 3857];
    if (inSR.wkid && inSR.wkid === 4326 && outSR.wkid && array.indexOf(mercator, outSR.wkid) > -1) {

      array.forEach(geometries, function(geometry) {
        // clip it, so it's not going to Infinity
        if (geometry.xmin) {
          geometry.xmin = Math.max(geometry.xmin, -180);
          geometry.xmax = Math.min(geometry.xmax, 180);
          geometry.ymin = Math.max(geometry.ymin, -89.99);
          geometry.ymax = Math.min(geometry.ymax, 89.99);
        } else if (geometry.rings) {
          array.forEach(geometry.rings, function(ring) {
            array.forEach(ring, function(point) {
              point[0] = Math.min(Math.max(point[0], -180), 180);
              point[1] = Math.min(Math.max(point[1], -89.99), 89.99);
            }, this);
          }, this);
        } else if (geometry.paths) {
          array.forEach(geometry.paths, function(path) {
            array.forEach(path, function(point) {
              point[0] = Math.min(Math.max(point[0], -180), 180);
              point[1] = Math.min(Math.max(point[1], -89.99), 89.99);
            }, this);
          }, this);
        } else if (geometry.x) {
          geometry.x = Math.min(Math.max(geometry.x, -180), 180);
          geometry.y = Math.min(Math.max(geometry.y, -89.99), 89.99);
        }
      }, this);

      jsonGeometries = [];
      array.forEach(geometries, function(geometry) {
        var outGeometry = webMercatorUtils.geographicToWebMercator(geometry);
        if (outSR.wkid !== 102100) {
          // geographicToWebMercator returns 102100; make sure it's what we want
          outGeometry.spatialReference = outSR;
        }
        jsonGeometries.push(outGeometry.toJSON());
      }, this);
      handler(jsonGeometries);

    } else if (inSR.wkid !== null && array.indexOf(mercator, inSR.wkid) > -1 &&
        outSR.wkid !== null && outSR.wkid === 4326) {

      jsonGeometries = [];
      array.forEach(geometries, function(geometry) {
        jsonGeometries.push(webMercatorUtils.webMercatorToGeographic(geometry).toJSON());
      }, this);
      handler(jsonGeometries);

    } else {

      var projectHandler = function(result, args) {
        // check if response is valid
        // [{"type":"extent","xmin":NaN,"ymin":NaN,"xmax":NaN,"ymax":NaN,"spatialReference":{"wkid":29902,"wkt":null,"declaredClass":"esri.SpatialReference"},"declaredClass":"esri.geometry.Extent"}]
        if (result && result.length === jsonGeometries.length) {
          jsonGeometries = [];
          array.forEach(result, function(geometry) {
            if (geometry &&
                ((geometry.rings && geometry.rings.length > 0 && geometry.rings[0].length > 0 && geometry.rings[0][0].length > 0 && !isNaN(geometry.rings[0][0][0]) && !isNaN(geometry.rings[0][0][1])) ||
                    (geometry.paths && geometry.paths.length > 0 && geometry.paths[0].length > 0 && geometry.paths[0][0].length > 0 && !isNaN(geometry.paths[0][0][0]) && !isNaN(geometry.paths[0][0][1])) ||
                    (geometry.xmin && !isNaN(geometry.xmin) && geometry.ymin && !isNaN(geometry.ymin)) ||
                    (geometry.x && !isNaN(geometry.x) && geometry.y && !isNaN(geometry.y)))) {
              jsonGeometries.push(geometry.toJSON());
            } else {
              // invalid geometry
              jsonGeometries.push(null);
            }
          }, this);
          handler(jsonGeometries);
        } else {
          errorHandler(result, args);
        }
      };
      if (esriConfig.geometryService) {
        esriConfig.geometryService.project(geometries, outSR, lang.hitch(this, projectHandler), errorHandler);
      } else {
        handler(null);
      }
    }
  }

  function _sameSpatialReference(sp1, sp2) {
    var mercator = [102113, 102100, 3857];
    if (sp1 && sp2 && sp1.wkid === sp2.wkid && sp1.wkt === sp2.wkt) {
      return true;
    } else if (sp1 && sp2 && sp1.wkid && sp2.wkid &&
        array.indexOf(mercator, sp1.wkid) > -1 && array.indexOf(mercator, sp2.wkid) > -1) {
      return true;
    }

    return false;
  }

  function _projectFeatureSet(fcLayer, oldSpatialReference, newSpatialReference, handler) {

    if (!fcLayer.featureSet || fcLayer.featureSet.features.length === 0) {
      return;
    }

    if (_sameSpatialReference(newSpatialReference, oldSpatialReference)) {
      handler(fcLayer);
      return;
    }

    var geometries;

    var projectHandler = function(jsonGeometries) {
      var newFeatures = [];
      array.forEach(fcLayer.featureSet.features, function(feature, i) {
        if (jsonGeometries[i]) {
          feature.geometry = jsonGeometries[i];
          newFeatures.push(feature);
        } // else feature could not get projected; take it out
      }, this);
      // fcLayer.featureSet.features = newFeatures;
      // update extent
      //results in bad JSON in config fcLayer.layerDefinition.extent = esri.arcgisonline.map.featColl.getFeatureSetFullExtent(fcLayer.featureSet);
      handler(fcLayer);
    };

    var finalProjectErrorHandler = function(result, args) {
      // don't do anything
      console.error("error projecting featureSet (" + fcLayer.layerDefinition.name + "). Final try.");
      // fcLayer.layerDefinition.extent = null;
      handler(fcLayer);
    };

    var projectErrorHandler = function(result, args) {
      console.error("error projecting featureSet (" + fcLayer.layerDefinition.name + "). Try one more time.");
      // give it one more try
      _projectGeometries(geometries, fcLayer.featureSet.geometryType, oldSpatialReference, newSpatialReference,
          lang.hitch(this, projectHandler), lang.hitch(this, finalProjectErrorHandler));
    };

    if (fcLayer.featureSet.features && fcLayer.featureSet.features.length > 0) {
      geometries = [];
      array.forEach(fcLayer.featureSet.features, function(feature) {
        if (feature.geometry.toJSON) {
          // Geometry object
          geometries.push(feature.geometry);
        } else {
          // simple object
          var Geometry = jsonUtils.getGeometryType(fcLayer.featureSet.geometryType);
          geometries.push(new Geometry(feature.geometry));
        }
      });
      if (!oldSpatialReference.toJSON) {
        // simple object
        oldSpatialReference = new SpatialReference(oldSpatialReference);
      }
      if (!newSpatialReference.toJSON) {
        // simple object
        newSpatialReference = new SpatialReference(newSpatialReference);
      }
      _projectGeometries(geometries, fcLayer.featureSet.geometryType, oldSpatialReference, newSpatialReference,
          lang.hitch(this, projectHandler), lang.hitch(this, projectErrorHandler));
    } else {
      // fcLayer.layerDefinition.extent = null;
      handler(fcLayer);
    }
  }

  /*****************
   * Public methods
   *****************/

  /* layerJson =
  {
    "type": "CSV",
    "url": "http://www.arcgis.com/xxx/sales.csv",
    "id": "Sales",
    "visibility": true,
    "opacity": 1,
    "title": "Sales",
    "layerDefinition": {
    },
    "popupInfo": {
    },
    "locationInfo": {
      "locationType": "coordinates | address | lookup",
      "latitudeFieldName": "If locationType = coordinates, the name of the field which contains the Y coordinate",
      "longitudeFieldName": "If locationType = coordinates, the name of the field which contains the X coordinate",
      "addressTemplate": "if locationType = address, a string value which defines the address to find based on CSV field values.  Example: {Address} {City}, {State} {Zip}"
    },
    "outFields": []
  }
  */
  function buildCSVFeatureCollection(layerJson) {

    var deferred = new Deferred();

    var processCSVDataHandler = function(featureCollection, error) {
      if (error) {
        deferred.errback(error);
      }
      else {
        deferred.callback(featureCollection);
      }
    };

    var req = {
      url: layerJson.url,
      handleAs: "text",
      load: function(response) {
        _processCsvData(response, layerJson, lang.hitch(this, processCSVDataHandler));
      },
      error: function(error) {
        deferred.errback(error);
        console.error("error: " + error);
      }
    };
    
    if (layerJson.url.indexOf("arcgis.com") > -1 && layerJson.url.indexOf("/content/items") > -1 && layerJson.url.indexOf("/data") > -1) {
      // needed for Online CSV items because request gets forwarded to Amazon S3
      // example: https://team.maps.arcgis.com/sharing/rest/content/items/9c7b161a18e14b39b416b89d025131b7/data
      req.headers = { "Content-Type": "" };
    }

    esriRequest(req, {
      usePost: false
    });

    return deferred.promise;
  }

  function projectFeatureCollection(featureCollection, outSR, inSR) {

    var deferred = new Deferred();

    var projectFeatureSetHandler = function(featureCollection2) {
      deferred.callback(featureCollection2);
    };

    if (!inSR) {
      inSR = new SpatialReference({wkid: 4326});
    }

    _projectFeatureSet(featureCollection, inSR, outSR, lang.hitch(this, projectFeatureSetHandler));

    return deferred.promise;
  }

  function generateDefaultPopupInfo(featureCollection) {
    var fields = featureCollection.layerDefinition.fields;

    var decimal = {
      "esriFieldTypeDouble": 1,
      "esriFieldTypeSingle": 1
    };

    var integer = {
      "esriFieldTypeInteger": 1,
      "esriFieldTypeSmallInteger": 1
    };

    var dt = {
      "esriFieldTypeDate": 1
    };

    var displayField = null;
    var fieldInfos = array.map(fields, lang.hitch(this, function(item) {

      if (item.name.toUpperCase() === "NAME") {
        displayField = item.name;
      }
      var visible = (item.type !== "esriFieldTypeOID" && item.type !== "esriFieldTypeGlobalID" && item.type !== "esriFieldTypeGeometry");
      var format = null;

      if (visible) {
        var f = item.name.toLowerCase();
        var hideFieldsStr = ",stretched value,fnode_,tnode_,lpoly_,rpoly_,poly_,subclass,subclass_,rings_ok,rings_nok,";

        if (hideFieldsStr.indexOf("," + f + ",") > -1 || f.indexOf("area") > -1 || f.indexOf("length") > -1 ||
            f.indexOf("shape") > -1 ||
            f.indexOf("perimeter") > -1 ||
            f.indexOf("objectid") > -1 ||
            f.indexOf("_") === f.length - 1 ||
            (f.indexOf("_i") === f.length - 2 && f.length > 1)) {
          visible = false;
        }
        if (item.type in integer) {
          format = {
            places: 0,
            digitSeparator: true
          };
        } else if (item.type in decimal) {
          format = {
            places: 2,
            digitSeparator: true
          };
        } else if (item.type in dt) {
          format = {
            dateFormat: "shortDateShortTime"
          };
        }
      }

      return lang.mixin({}, {
        fieldName: item.name,
        label: item.alias,
        isEditable: true,
        tooltip: "",
        visible: visible,
        format: format,
        stringFieldOption: "textbox"
      });
    }));

    var popupInfo = {
      title: displayField ? "{" + displayField + "}" : "",
      fieldInfos: fieldInfos,
      description: null,
      showAttachments: false,
      mediaInfos: []
    };
    return popupInfo;
  }

  var csv = {
    latFieldStrings: latFieldStrings,
    longFieldStrings: longFieldStrings,
    buildCSVFeatureCollection: buildCSVFeatureCollection,
    projectFeatureCollection: projectFeatureCollection,
    generateDefaultPopupInfo: generateDefaultPopupInfo,

    _getSeparator: _getSeparator,
    _isValidDate: _isValidDate,
    _processCsvData: _processCsvData,
    _projectGeometries: _projectGeometries,
    _sameSpatialReference: _sameSpatialReference,
    _projectFeatureSet: _projectFeatureSet
  };

  

  return csv;
});
