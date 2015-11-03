define(["./Util"], function(Util) {

  //manually copied only the necessary functions from proj4js to keep it as small as possible.

  var deg2rad = Util.deg2rad;
  var rad2deg = Util.rad2deg;

  return {
    LLtoUTM: function (Lat, Long) {
      var a = 6378137.0;
      var eccSquared = 0.00669438;
      var k0 = 0.9996;
      var LongOrigin;
      var eccPrimeSquared;
      var N, T, C, A, M;
      var LatRad = deg2rad(Lat);
      var LongRad = deg2rad(Long);
      var LongOriginRad;
      var ZoneNumber;
      ZoneNumber = Math.floor((Long + 180) / 6) + 1;
      if (Long === 180) {
        ZoneNumber = 60;
      }

      // Special zone for Norway
      if (Lat >= 56.0 && Lat < 64.0 && Long >= 3.0 && Long < 12.0) {
        ZoneNumber = 32;
      }
      // Special zones for Svalbard
      if (Lat >= 72.0 && Lat < 84.0) {
        if (Long >= 0.0 && Long < 9.0) {
          ZoneNumber = 31;
        }
        else if (Long >= 9.0 && Long < 21.0) {
          ZoneNumber = 33;
        }
        else if (Long >= 21.0 && Long < 33.0) {
          ZoneNumber = 35;
        }
        else if (Long >= 33.0 && Long < 42.0) {
          ZoneNumber = 37;
        }
      }

      LongOrigin = (ZoneNumber - 1) * 6 - 180 + 3;
      LongOriginRad = deg2rad(LongOrigin);

      eccPrimeSquared = (eccSquared) / (1 - eccSquared);

      N = a / Math.sqrt(1 - eccSquared * Math.sin(LatRad) * Math.sin(LatRad));
      T = Math.tan(LatRad) * Math.tan(LatRad);
      C = eccPrimeSquared * Math.cos(LatRad) * Math.cos(LatRad);
      A = Math.cos(LatRad) * (LongRad - LongOriginRad);

      M = a * ((1 - eccSquared / 4 - 3 * eccSquared * eccSquared / 64 - 5 * eccSquared * eccSquared * eccSquared / 256) * LatRad - (3 * eccSquared / 8 + 3 * eccSquared * eccSquared / 32 + 45 * eccSquared * eccSquared * eccSquared / 1024) * Math.sin(2 * LatRad) + (15 * eccSquared * eccSquared / 256 + 45 * eccSquared * eccSquared * eccSquared / 1024) * Math.sin(4 * LatRad) - (35 * eccSquared * eccSquared * eccSquared / 3072) * Math.sin(6 * LatRad));

      var UTMEasting = (k0 * N * (A + (1 - T + C) * A * A * A / 6.0 + (5 - 18 * T + T * T + 72 * C - 58 * eccPrimeSquared) * A * A * A * A * A / 120.0) + 500000.0);

      var UTMNorthing = (k0 * (M + N * Math.tan(LatRad) * (A * A / 2 + (5 - T + 9 * C + 4 * C * C) * A * A * A * A / 24.0 + (61 - 58 * T + T * T + 600 * C - 330 * eccPrimeSquared) * A * A * A * A * A * A / 720.0)));
      if (Lat < 0.0) {
        UTMNorthing += 10000000.0; //10000000 meter offset for
        // southern hemisphere
      }

      return {
        northing: UTMNorthing,
        easting: UTMEasting,
        zoneNumber: ZoneNumber,
        zoneLetter: this.getLetterDesignator(Lat)
      };
    },

    getLetterDesignator: function (lat) {
      //This is here as an error flag to show that the Latitude is
      //outside MGRS limits
      var LetterDesignator = "Z";

      if ((84 >= lat) && (lat >= 72)) {
        LetterDesignator = "X";
      }
      else if ((72 > lat) && (lat >= 64)) {
        LetterDesignator = "W";
      }
      else if ((64 > lat) && (lat >= 56)) {
        LetterDesignator = "V";
      }
      else if ((56 > lat) && (lat >= 48)) {
        LetterDesignator = "U";
      }
      else if ((48 > lat) && (lat >= 40)) {
        LetterDesignator = "T";
      }
      else if ((40 > lat) && (lat >= 32)) {
        LetterDesignator = "S";
      }
      else if ((32 > lat) && (lat >= 24)) {
        LetterDesignator = "R";
      }
      else if ((24 > lat) && (lat >= 16)) {
        LetterDesignator = "Q";
      }
      else if ((16 > lat) && (lat >= 8)) {
        LetterDesignator = "P";
      }
      else if ((8 > lat) && (lat >= 0)) {
        LetterDesignator = "N";
      }
      else if ((0 > lat) && (lat >= -8)) {
        LetterDesignator = "M";
      }
      else if ((-8 > lat) && (lat >= -16)) {
        LetterDesignator = "L";
      }
      else if ((-16 > lat) && (lat >= -24)) {
        LetterDesignator = "K";
      }
      else if ((-24 > lat) && (lat >= -32)) {
        LetterDesignator = "J";
      }
      else if ((-32 > lat) && (lat >= -40)) {
        LetterDesignator = "H";
      }
      else if ((-40 > lat) && (lat >= -48)) {
        LetterDesignator = "G";
      }
      else if ((-48 > lat) && (lat >= -56)) {
        LetterDesignator = "F";
      }
      else if ((-56 > lat) && (lat >= -64)) {
        LetterDesignator = "E";
      }
      else if ((-64 > lat) && (lat >= -72)) {
        LetterDesignator = "D";
      }
      else if ((-72 > lat) && (lat >= -80)) {
        LetterDesignator = "C";
      }
      return LetterDesignator;
    },

    UTMtoLL: function (utm) {

      var UTMNorthing = utm.northing;
      var UTMEasting = utm.easting;
      var zoneLetter = utm.zoneLetter;
      var zoneNumber = utm.zoneNumber;
      // check the ZoneNummber is valid
      if (zoneNumber < 0 || zoneNumber > 60) {
        return null;
      }

      var k0 = 0.9996;
      var a = 6378137.0; //ellip.radius;
      var eccSquared = 0.00669438; //ellip.eccsq;
      var eccPrimeSquared;
      var e1 = (1 - Math.sqrt(1 - eccSquared)) / (1 + Math.sqrt(1 - eccSquared));
      var N1, T1, C1, R1, D, M;
      var LongOrigin;
      var mu, phi1Rad;

      // remove 500,000 meter offset for longitude
      var x = UTMEasting - 500000.0;
      var y = UTMNorthing;

      if (zoneLetter < "N") {
        y -= 10000000.0; // remove 10,000,000 meter offset used
        // for southern hemisphere
      }

      // There are 60 zones with zone 1 being at West -180 to -174
      LongOrigin = (zoneNumber - 1) * 6 - 180 + 3; // +3 puts origin
      // in middle of
      // zone

      eccPrimeSquared = (eccSquared) / (1 - eccSquared);

      M = y / k0;
      mu = M / (a * (1 - eccSquared / 4 - 3 * eccSquared * eccSquared / 64 - 5 * eccSquared * eccSquared * eccSquared / 256));

      phi1Rad = mu + (3 * e1 / 2 - 27 * e1 * e1 * e1 / 32) * Math.sin(2 * mu) + (21 * e1 * e1 / 16 - 55 * e1 * e1 * e1 * e1 / 32) * Math.sin(4 * mu) + (151 * e1 * e1 * e1 / 96) * Math.sin(6 * mu);
      // double phi1 = ProjMath.radToDeg(phi1Rad);

      N1 = a / Math.sqrt(1 - eccSquared * Math.sin(phi1Rad) * Math.sin(phi1Rad));
      T1 = Math.tan(phi1Rad) * Math.tan(phi1Rad);
      C1 = eccPrimeSquared * Math.cos(phi1Rad) * Math.cos(phi1Rad);
      R1 = a * (1 - eccSquared) / Math.pow(1 - eccSquared * Math.sin(phi1Rad) * Math.sin(phi1Rad), 1.5);
      D = x / (N1 * k0);

      var lat = phi1Rad - (N1 * Math.tan(phi1Rad) / R1) * (D * D / 2 - (5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * eccPrimeSquared) * D * D * D * D / 24 + (61 + 90 * T1 + 298 * C1 + 45 * T1 * T1 - 252 * eccPrimeSquared - 3 * C1 * C1) * D * D * D * D * D * D / 720);
      lat = rad2deg(lat);

      var lon = (D - (1 + 2 * T1 + C1) * D * D * D / 6 + (5 - 2 * C1 + 28 * T1 - 3 * C1 * C1 + 8 * eccPrimeSquared + 24 * T1 * T1) * D * D * D * D * D / 120) / Math.cos(phi1Rad);
      lon = LongOrigin + rad2deg(lon);

      var result;
      if (utm.accuracy) {
        var topRight = UTMtoLL({ // jshint ignore:line
          northing: utm.northing + utm.accuracy,
          easting: utm.easting + utm.accuracy,
          zoneLetter: utm.zoneLetter,
          zoneNumber: utm.zoneNumber
        });
        result = {
          top: topRight.lat,
          right: topRight.lon,
          bottom: lat,
          left: lon
        };
      }
      else {
        result = {
          lat: lat,
          lon: lon
        };
      }
      return result;
    }
  };
});