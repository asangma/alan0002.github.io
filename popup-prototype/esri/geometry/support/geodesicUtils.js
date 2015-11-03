define(
[
  "dojo/_base/array",
  "../SpatialReference",
  "../Point",
  "../Polyline",
  "../Polygon"
],
function(array, SpatialReference, Point, Polyline, Polygon) {

  var _unitsDictionary = {
    //length unit conversion from miles
    "esriMiles": 1,
    "esriKilometers": 1.609344,
    "esriFeet": 5280,
    "esriMeters": 1609.34,
    "esriYards": 1760,
    "esriNauticalMiles": 0.869,
    "esriCentimeters": 160934,
    "esriDecimeters": 16093.4,
    "esriInches": 63360,
    "esriMillimeters": 1609340,    
    //area unit conversion from acres
    "esriAcres": 1,
    "esriAres": 40.4685642,
    "esriSquareKilometers": 0.00404685642,
    "esriSquareMiles": 0.0015625,
    "esriSquareFeet": 43560,
    "esriSquareMeters": 4046.85642,
    "esriHectares": 0.404685642,
    "esriSquareYards": 4840,
    "esriSquareInches": 6272640,
    "esriSquareMillimeters": 4046856420,
    "esriSquareCentimeters": 40468564.2,
    "esriSquareDecimeters": 404685.642
  };

  function _toEqualAreaPoint(pt) {
    var toRad = Math.PI / 180;
    var a = 6378137;
    var eSq = 0.00669437999019741354678198566736,
        e = 0.08181919084296430236105472696748;
    var sinY = Math.sin(pt.y * toRad);
    var q = (1 - eSq) * ((sinY / (1 - eSq * (sinY * sinY)) - (1 / (2 * e)) * Math.log((1 - e * sinY) / (1 + e * sinY))));
    var x = a * pt.x * toRad;
    var y = a * q * 0.5;
    var equalAreaCynlindricalProjectedPt = new Point(x, y);
    return equalAreaCynlindricalProjectedPt;
  }

  //direct and inverse geodesic solver algorithm is based on http://www.ngs.noaa.gov/PUBS_LIB/inverse.pdf
  //http://en.wikipedia.org/wiki/Vincenty's_formulae
  function _directGeodeticSolver( /*radians*/ lat, /*radians*/ lon, /*radians*/ alpha, /*meters*/ s) {
    var a = 6378137,
        b = 6356752.31424518,
        f = 1 / 298.257223563, // WGS84 ellipsoid params
        sinA = Math.sin(alpha),
        cosA = Math.cos(alpha),
        tanU1 = (1 - f) * Math.tan(lat),
        cosU1 = 1 / Math.sqrt((1 + tanU1 * tanU1)),
        sinU1 = tanU1 * cosU1,
        sigma1 = Math.atan2(tanU1, cosA),
        sinsqAlpha = (cosU1 * sinA) * (cosU1 * sinA),
        cosSqAlpha = 1 - sinsqAlpha,
        uSq = cosSqAlpha * (a * a - b * b) / (b * b),
        coef1 = 1 + uSq / 16384 * (4096 + uSq * (-768 + uSq * (320 - 175 * uSq))),
        coef2 = uSq / 1024 * (256 + uSq * (-128 + uSq * (74 - 47 * uSq))),
        sigma = s / (b * coef1),
        sigmaP = 2 * Math.PI,
        sinSigma, cosSigma, cos2SigmaM, deltaSigma;
    while (Math.abs(sigma - sigmaP) > 1e-12) {
      cos2SigmaM = Math.cos(2 * sigma1 + sigma);
      sinSigma = Math.sin(sigma);
      cosSigma = Math.cos(sigma);
      deltaSigma = coef2 * sinSigma * (cos2SigmaM + coef2 / 4 * (cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM) - coef2 / 6 * cos2SigmaM * (-3 + 4 * sinSigma * sinSigma) * (-3 + 4 * cos2SigmaM * cos2SigmaM)));
      sigmaP = sigma;
      sigma = s / (b * coef1) + deltaSigma;
    }
    var temp = sinU1 * sinSigma - cosU1 * cosSigma * cosA,
        lat2 = Math.atan2(sinU1 * cosSigma + cosU1 * sinSigma * cosA, (1 - f) * Math.sqrt(sinsqAlpha + temp * temp)),
        lambda = Math.atan2(sinSigma * sinA, cosU1 * cosSigma - sinU1 * sinSigma * cosA),
        coef3 = f / 16 * cosSqAlpha * (4 + f * (4 - 3 * cosSqAlpha)),
        adjustedLon = lambda - (1 - coef3) * f * Math.sqrt(sinsqAlpha) * (sigma + coef3 * sinSigma * (cos2SigmaM + coef3 * cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM))),
        lat2Deg = lat2 / (Math.PI / 180),
        lon2Deg = (lon + adjustedLon) / (Math.PI / 180),
        pt = new Point(lon2Deg, lat2Deg, new SpatialReference({
          wkid: 4326
        }));
    return pt;
  }

  function _inverseGeodeticSolver( /*radians*/ lat1, /*radians*/ lon1, /*radians*/ lat2, /*radians*/ lon2) {
    var a = 6378137,
        b = 6356752.31424518,
        f = 1 / 298.257223563, // WGS84 ellipsoid params
        d = (lon2 - lon1),
        u1 = Math.atan((1 - f) * Math.tan(lat1)),
        u2 = Math.atan((1 - f) * Math.tan(lat2)),
        sinU1 = Math.sin(u1),
        cosU1 = Math.cos(u1),
        sinU2 = Math.sin(u2),
        cosU2 = Math.cos(u2),
        lambda = d,
        lambdaP, iterLimit = 1000,
        cosSqAlpha, sinSigma, cos2SigmaM, cosSigma, sigma, sinLambda, cosLambda, sinAlpha, temp;
    do {
      sinLambda = Math.sin(lambda);
      cosLambda = Math.cos(lambda);
      sinSigma = Math.sqrt((cosU2 * sinLambda) * (cosU2 * sinLambda) + (cosU1 * sinU2 - sinU1 * cosU2 * cosLambda) * (cosU1 * sinU2 - sinU1 * cosU2 * cosLambda));
      if (sinSigma === 0) {
        return 0;
      }
      cosSigma = sinU1 * sinU2 + cosU1 * cosU2 * cosLambda;
      sigma = Math.atan2(sinSigma, cosSigma);
      sinAlpha = cosU1 * cosU2 * sinLambda / sinSigma;
      cosSqAlpha = 1 - sinAlpha * sinAlpha;
      cos2SigmaM = cosSigma - 2 * sinU1 * sinU2 / cosSqAlpha;
      if (isNaN(cos2SigmaM)) {
        cos2SigmaM = 0;
      }
      temp = f / 16 * cosSqAlpha * (4 + f * (4 - 3 * cosSqAlpha));
      lambdaP = lambda;
      lambda = d + (1 - temp) * f * sinAlpha * (sigma + temp * sinSigma * (cos2SigmaM + temp * cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM)));
    }
    while (Math.abs(lambda - lambdaP) > 1e-12 && --iterLimit > 0);
    if (iterLimit === 0) {
      //As Vincenty pointed out, when two points are nearly antipodal, the formula may not converge
      //It's time to switch to other formula, which may not as highly accurate as Vincenty's. Just for the special case.
      //Here implements Haversine formula
      var haversine_R = 6371009, // km
          haversine_d = Math.acos(Math.sin(lat1)*Math.sin(lat2) + Math.cos(lat1)*Math.cos(lat2) * Math.cos(lon2-lon1)) * haversine_R,
          dLon = lon2-lon1,
          y = Math.sin(dLon) * Math.cos(lat2),
          x = Math.cos(lat1)*Math.sin(lat2) - Math.sin(lat1)*Math.cos(lat2)*Math.cos(dLon),
          brng = Math.atan2(y, x);
      return {"azimuth": brng, "geodesicDistance": haversine_d};
    }
    var uSq = cosSqAlpha * (a * a - b * b) / (b * b),
        coef1 = 1 + uSq / 16384 * (4096 + uSq * (-768 + uSq * (320 - 175 * uSq))),
        coef2 = uSq / 1024 * (256 + uSq * (-128 + uSq * (74 - 47 * uSq))),
        deltaSigma = coef2 * sinSigma * (cos2SigmaM + coef2 / 4 * (cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM) - coef2 / 6 * cos2SigmaM * (-3 + 4 * sinSigma * sinSigma) * (-3 + 4 * cos2SigmaM * cos2SigmaM))),
        geodesicDistance = b * coef1 * (sigma - deltaSigma),
        azimuth = Math.atan2(cosU2 * Math.sin(lambda), cosU1 * sinU2 - sinU1 * cosU2 * Math.cos(lambda)),
        reverseAzimuth = Math.atan2(cosU1 * Math.sin(lambda), cosU1 * sinU2 * Math.cos(lambda) - sinU1 * cosU2),
        inverseResult = {
          azimuth: azimuth,
          geodesicDistance: geodesicDistance,
          reverseAzimuth: reverseAzimuth
        };
    return inverseResult;
  }

  function geodesicDensify(geom, maxSegmentLength) {
    //geom must be under WGS84
    var toRad = Math.PI / 180;
    var radius = 6371008.771515059;
    if (maxSegmentLength < radius / 10000) {
      maxSegmentLength = radius / 10000;
    }
    if (!(geom instanceof Polyline || geom instanceof Polygon)) {
      var msg = "_geodesicDensify: the input geometry is neither polyline nor polygon";
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
      var lon1, lat1, lon2, lat2, i, j;
      lon1 = ring[0][0] * toRad;
      lat1 = ring[0][1] * toRad;
      for (i = 0; i < ring.length - 1; i++) {
        lon2 = ring[i + 1][0] * toRad;
        lat2 = ring[i + 1][1] * toRad;
        if (lon1 === lon2 && lat1 === lat2) {
          continue;
        }
        var inverseGeodeticResult = _inverseGeodeticSolver(lat1, lon1, lat2, lon2);
        var azimuth = inverseGeodeticResult.azimuth; //radians
        var geodesicDist = inverseGeodeticResult.geodesicDistance; //meters
        var numberOfSegment = geodesicDist / maxSegmentLength;
        if (numberOfSegment > 1) {
          for (j = 1; j <= numberOfSegment - 1; j++) {
            var length = j * maxSegmentLength;
            var pt = _directGeodeticSolver(lat1, lon1, azimuth, length);
            oRing.push([pt.x, pt.y]);
          }
          var lastDensifiedLength = (geodesicDist + Math.floor(numberOfSegment - 1) * maxSegmentLength) / 2;
          var lastSecondPt = _directGeodeticSolver(lat1, lon1, azimuth, lastDensifiedLength);
          oRing.push([lastSecondPt.x, lastSecondPt.y]);
        }
        var endPt = _directGeodeticSolver(lat1, lon1, azimuth, geodesicDist);
        oRing.push([endPt.x, endPt.y]);
        lon1 = endPt.x * toRad;
        lat1 = endPt.y * toRad;
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

  function geodesicLengths(polylines, lengthUnit) {
    var toRan = Math.PI / 180;
    var lengths = [];
    array.forEach(polylines, function (polyline, idx) {
      var length = 0;
      array.forEach(polyline.paths, function (path, idx) {
        var subLength = 0;
        var i, lon1, lon2, lat1, lat2, inverseGeodeticResult;
        for (i = 1; i < path.length; i++) {
          lon1 = path[i - 1][0] * toRan;
          lon2 = path[i][0] * toRan;
          lat1 = path[i - 1][1] * toRan;
          lat2 = path[i][1] * toRan;
          if (!(lat1 === lat2 && lon1 === lon2)) {
            inverseGeodeticResult = _inverseGeodeticSolver(lat1, lon1, lat2, lon2);
            subLength += inverseGeodeticResult.geodesicDistance / 1609.344; //miles
          }
        }
        length += subLength;
      });
      length *= _unitsDictionary[lengthUnit];
      lengths.push(length);
    });
    return lengths;
  }

  function geodesicAreas(polygons, areaUnit) {
    var geodesicDensifiedPolygons = [];
    array.forEach(polygons, function (polygon, idx) {
      var geodesicDensifiedPolygon = geodesicDensify(polygon, 10000);
      geodesicDensifiedPolygons.push(geodesicDensifiedPolygon);
    });
    var areas = [];
    var point1, point2;
    array.forEach(geodesicDensifiedPolygons, function (polygon, idx) {
      var area = 0;
      array.forEach(polygon.rings, function (ring, idx) {
        point1 = _toEqualAreaPoint(new Point(ring[0][0], ring[0][1]));
        point2 = _toEqualAreaPoint(new Point(ring[ring.length - 1][0], ring[ring.length - 1][1]));
        var subArea = point2.x * point1.y - point1.x * point2.y;
        var i;
        for (i = 0; i < ring.length - 1; i++) {
          point1 = _toEqualAreaPoint(new Point(ring[i + 1][0], ring[i + 1][1]));
          point2 = _toEqualAreaPoint(new Point(ring[i][0], ring[i][1]));
          subArea += point2.x * point1.y - point1.x * point2.y;
        }
        subArea /= 4046.87; //acres
        area += subArea;
      });
      area *= _unitsDictionary[areaUnit];
      areas.push(area / (-2));
    });
    return areas;
  }
  
  var geodesicUtils = {
    geodesicDensify: geodesicDensify,
    geodesicLengths: geodesicLengths,
    geodesicAreas: geodesicAreas,
    _unitsDictionary: _unitsDictionary,
    _toEqualAreaPoint: _toEqualAreaPoint,
    _directGeodeticSolver: _directGeodeticSolver,
    _inverseGeodeticSolver: _inverseGeodeticSolver
  };

  

  return geodesicUtils;  
});
