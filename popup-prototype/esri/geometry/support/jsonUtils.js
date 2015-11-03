define(
[
  "../Point",
  "../Polyline",
  "../Polygon",
  "../Multipoint",
  "../Extent"
],
function(Point, Polyline, Polygon, Multipoint, Extent) {

  function fromJson(json) {
    try {
      throw new Error("fromJson is deprecated, use fromJSON instead");
    }
    catch (e) {
      console.warn(e.stack);
    }

    return fromJSON(json);
  }

  function fromJSON(/*Object*/ json) {
    if (!json) {
      return null;
    }

    //Convert json representation to appropriate esri.geometry.* object
    if (!json) {
      return null;
    }
    else if (json.x !== undefined && json.y !== undefined) {
      return Point.fromJSON(json);
    }
    else if (json.paths !== undefined) {
      return Polyline.fromJSON(json);
    }
    else if (json.rings !== undefined) {
      return Polygon.fromJSON(json);
    }
    else if (json.points !== undefined) {
      return Multipoint.fromJSON(json);
    }
    else if (json.xmin !== undefined && json.ymin !== undefined && json.xmax !== undefined && json.ymax !== undefined) {
      return Extent.fromJSON(json);
    }

    return null;
  }

  function getJsonType(/*esri.geometry.Geometry*/ geometry) {
    //summary: Returns the JSON type name for a given geometry. This is only
    //         for geometries that can be processed by the server
    // geometry: esri.geometry.Point/Polyline/Polygon/Extent: Geometry to get type for
    // returns: String: Geometry type name as represented on server

    if (geometry instanceof Point) {
      return "esriGeometryPoint";
    }
    else if (geometry instanceof Polyline) {
      return "esriGeometryPolyline";
    }
    else if (geometry instanceof Polygon) {
      return "esriGeometryPolygon";
    }
    else if (geometry instanceof Extent) {
      return "esriGeometryEnvelope";
    }
    else if (geometry instanceof Multipoint) {
      return "esriGeometryMultipoint";
    }

    return null;
  }

  var GEOM_CTOR_MAP = {
    "esriGeometryPoint":      Point,
    "esriGeometryPolyline":   Polyline,
    "esriGeometryPolygon":    Polygon,
    "esriGeometryEnvelope":   Extent,
    "esriGeometryMultipoint": Multipoint
  };

  function getGeometryType(/*String*/ jsonType) {
    return jsonType && GEOM_CTOR_MAP[jsonType] || null;
  }
    
  var jsonUtils = {
    fromJSON: fromJSON,
    fromJson: fromJson,
    getJsonType: getJsonType,
    getGeometryType: getGeometryType
  };

  return jsonUtils;
});
