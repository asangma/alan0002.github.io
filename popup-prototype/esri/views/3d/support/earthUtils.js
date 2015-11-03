define([
  "dojo/_base/lang",

	"./mathUtils",
  
  "../../../geometry/Point",
  "../../../geometry/SpatialReference",
  "../../../geometry/support/webMercatorUtils"
], function(
   lang,
   mathUtils,
   Point, SpatialReference,
   webMercatorUtils) {

  // The radius of earth, in meters
  var EARTH_RADIUS = 6378137.0;

  var tmpPosWGS84 = new Point(0, 0, SpatialReference.WGS84);

  function pointWGS84(position, ret) {
    if (position.spatialReference.wkid !== SpatialReference.WGS84.wkid) {
      webMercatorUtils.webMercatorToGeographic(position, false, ret);
    } else {
      ret.x = position.x;
      ret.y = position.y;
    }

    ret.z = position.z;
    return ret;
  }
  
  var earthUtils = {
    earthRadius: EARTH_RADIUS,
    halfEarthCircumference: Math.PI * EARTH_RADIUS,
    earthCircumference: 2 * Math.PI * EARTH_RADIUS,

    /** 
    * caculate the great circle distance 
    * @param {number|Point} lat1|point1
    * @param {number|Point} lon1|point2
    * @param {number|undefined} lat2 
    * @param {number|undefined} lon2 
    */ 
    getGreatCircleDistance: function(lon1, lat1, lon2, lat2) {
      // Allow passing in two Point objects
      if (lon2 === undefined && lat2 === undefined && lang.isObject(lon1) && lang.isObject(lat1)) {
        lon2 = lat1.get("longitude");
        lat2 = lat1.get("latitude");
        lat1 = lon1.get("latitude");
        lon1 = lon1.get("longitude");
      }

      var radLat1 = mathUtils.deg2rad(lat1);
      var radLat2 = mathUtils.deg2rad(lat2);
      var radLon1 = mathUtils.deg2rad(lon1);
      var radLon2 = mathUtils.deg2rad(lon2);

      var dRadLat = radLat1 - radLat2;
      var dRadLon = radLon1 - radLon2;

      var sRadLato2 = Math.sin(dRadLat / 2);
      var sRadLono2 = Math.sin(dRadLon / 2);

      var s = 2 * mathUtils.asin(Math.sqrt(sRadLato2 * sRadLato2 + Math.cos(radLat1) * Math.cos(radLat2) * sRadLono2 * sRadLono2));
      var distance = s * EARTH_RADIUS;
      distance = Math.round(distance * 10000) / 10000.0;

      return distance;
    },

    getGreatCircleSpanAt: function(centerPoint, minPoint, maxPoint) {
      var sr = minPoint.spatialReference;

      var minLon = new Point(minPoint.x, centerPoint.y, sr);
      var maxLon = new Point(maxPoint.x, centerPoint.y, sr);

      var minLat = new Point(centerPoint.x, minPoint.y, sr);
      var maxLat = new Point(centerPoint.x, maxPoint.y, sr);

      return {
        lon: this.getGreatCircleDistance(minLon, maxLon),
        lat: this.getGreatCircleDistance(minLat, maxLat)
      };
    },

    getLonDeltaForDistance: function(lon, lat, distance) {
      var s = distance / EARTH_RADIUS;
      var radLat = mathUtils.deg2rad(lat);

      var sso2 = Math.sin(s / 2);
      var clat = Math.cos(radLat);

      var b = 2 * mathUtils.asin(Math.sqrt((sso2 * sso2) / (clat * clat)));

      return mathUtils.rad2deg(b);
    },

    getLatDeltaForDistance: function(lon, lat, distance) {
      return mathUtils.rad2deg(distance / EARTH_RADIUS);
    },

    getLatLonDeltaForDistance: function(lon, lat, distance) {
      return {
        lat: this.getLatDeltaForDistance(lon, lat, distance),
        lon: this.getLonDeltaForDistance(lon, lat, distance)
      };
    },

    getMaxCameraAltitude: function(fov) {
      var halfFov = fov/2;
      var rad = mathUtils.deg2rad(halfFov);

      return ((1-Math.sin(rad))*EARTH_RADIUS)/Math.sin(rad);
    },

    getViewExtentDistance: function(altitude, fov) {
      // rad of half fov
      var radHF = mathUtils.deg2rad(fov/2);
      var viewLength = (altitude+EARTH_RADIUS)*Math.cos(radHF)-Math.sqrt(Math.pow(Math.cos(radHF)*(altitude+EARTH_RADIUS),2)-altitude*altitude-2*altitude*EARTH_RADIUS);

      var earthCenterAngle = 2 * mathUtils.acos((Math.pow(altitude+EARTH_RADIUS, 2) + Math.pow(EARTH_RADIUS, 2) - Math.pow(viewLength, 2))/(2*(altitude+EARTH_RADIUS)*EARTH_RADIUS));
      return earthCenterAngle * EARTH_RADIUS;
    },

    computeCarthesianDistance: function(point1, point2) {
      function wgs84ToGlobal(p) {
        // TODO: place this routine in a generic 3D math utility class?
        var lat = mathUtils.deg2rad(p.get("latitude"));
        var lon = mathUtils.deg2rad(p.get("longitude"));
        var cosLat = Math.cos(lat);
        var radius = EARTH_RADIUS + (p.z || 0);
        return [Math.cos(lon) * cosLat * radius,
                Math.sin(lat) * radius,
                -Math.sin(lon) * cosLat * radius];
      }

      var p1 = wgs84ToGlobal(point1);
      var p2 = wgs84ToGlobal(point2);
      var d = [p2[0] - p1[0], p2[1] - p1[1], p2[2] - p1[2]];
      return Math.sqrt(d[0]*d[0] + d[1]*d[1] + d[2]*d[2]);
    },

    longitudeToTimezone: function(longitude, fractional) {
      // drastic approximation: assume that timezones are deliminated by meridians
      var timezone = longitude / 15;

      if (!fractional) {
        timezone = Math.round(timezone);
      }

      return timezone;
    },

    positionToTimezone: function(position, ret) {
      pointWGS84(position, tmpPosWGS84);

      if (!ret) {
        ret = {
          hours: 0,
          minutes: 0,
          seconds: 0
        };
      }

      ret.hours = earthUtils.longitudeToTimezone(tmpPosWGS84.x, true);
      var frac = ret.hours % 1;
      ret.hours -= frac;

      ret.minutes = frac * 60.0;
      var minutesFrac = ret.minutes  % 1;
      ret.minutes -= minutesFrac;

      ret.seconds = Math.round(minutesFrac * 60.0);
      return ret;
    }
  };

  return earthUtils;
});