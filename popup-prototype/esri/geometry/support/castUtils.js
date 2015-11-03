define([
  "../Point",
  "../Polyline",
  "../Polygon",
  "../Multipoint",
  "../Extent"
], function(Point, Polyline, Polygon, Multipoint, Extent) {

  function cast(obj) {
    if (!obj || obj.declaredClass) {
      return obj || null;
    }

    else if (obj.x !== undefined && obj.y !== undefined) {
      return new Point(obj);
    }
    else if (obj.paths !== undefined) {
      return new Polyline(obj);
    }
    else if (obj.rings !== undefined) {
      return new Polygon(obj);
    }
    else if (obj.points !== undefined) {
      return new Multipoint(obj);
    }
    else if (obj.xmin !== undefined && obj.ymin !== undefined && obj.xmax !== undefined && obj.ymax !== undefined) {
      return new Extent(obj);
    }

    return null;
  }

  var castUtils = {
    cast: cast
  };

  return castUtils;
});
