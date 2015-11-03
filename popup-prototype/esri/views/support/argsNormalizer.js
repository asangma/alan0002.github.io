define([
  "../../geometry/ScreenPoint"
], function(
  ScreenPoint
) {

  return {
    toScreenPoint: function(x, y, outPoint) {
      var pt;
      
      if (!outPoint) {
        outPoint = new ScreenPoint();
      }

      if (Array.isArray(x)) {
        pt = x;
        x = pt[0];
        y = pt[1];
      }
      else if (typeof x === "object") {
        pt = x;
        x = pt.x;
        y = pt.y;
      }

      outPoint.x = x;
      outPoint.y = y;

      return outPoint;
    }
    /*
    toPoint: function(x, y, z, outSR, outPoint) {
      var inSR;
      var pt;

      if (Array.isArray(x)) {
        pt = x;
        x = pt[0];
        y = pt[1];
        z = pt[2];
        inSR = SpatialReference.WGS84;
      }
      else if (typeof x === "object") {
        pt = x;
        x = pt.x;
        y = pt.y;
        z = pt.z;
        inSR = pt.spatialReference;
      }
      else {
        inSR = outSR;
      }

      if (!outPoint) {
        outPoint = new Point();
      }

      outPoint.x = x;
      outPoint.y = y;

      if (z != null) {
        outPoint.z = z;
      }

      if (!outPoint.spatialReference) {
        outPoint.spatialReference = inSR;
      }

      return outPoint;
    }
    */
  };

});
