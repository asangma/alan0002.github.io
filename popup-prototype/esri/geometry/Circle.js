/**
 * A circle is a {@link module:esri/geometry/Polygon Polygon} created by specifying a [center point](#center) 
 * and a [radius](#radius). The point 
 * can be provided as a {@link module:esri/geometry/Point Point} object or an array of latitude/longitude values. 
 * 
 * @module esri/geometry/Circle
 * @since 4.0
 * @see module:esri/geometry/Polygon
 */
define(
[
  "../core/declare",
  "dojo/_base/lang",
  "../core/lang",
  "./Point",
  "./Polygon",
  "./support/geodesicUtils",
  "./support/webMercatorUtils",
  "./support/WKIDUnitConversion",
  "./support/units"
],
function (declare, lang, esriLang, Point, Polygon, geodesicUtils,
  webMercatorUtils, WKIDUnitConversion, units) {

  var _unitToMeters = {
    esriCentimeters: 0.01,
    esriDecimeters: 0.1,
    esriFeet: 0.3048,
    esriInches: 0.0254,
    esriKilometers: 1000,
    esriMeters: 1,
    esriMiles: 1609.34,
    esriMillimeters: 0.001,
    esriNauticalMiles: 1852,
    esriYards: 0.9144,
    esriDecimalDegrees: 111320
  };

  var defaultCircle = {
    radius: 1000,
    radiusUnit: units.METERS,
    geodesic: false,
    numberOfPoints: 60
  };

  /** 
  * @extends module:esri/geometry/Polygon
  * @constructor module:esri/geometry/Circle
  * @param {Object} properties - See the [properties](#properties) for a list of all the properties
  *                              that may be passed into the constructor.
  */      
  var Circle = declare(Polygon, 
  /** @lends module:esri/geometry/Circle.prototype */                     
  {
    declaredClass: "esri.geometry.Circle",

    classMetadata: {
      properties: {
        center: {
          type: Point
        }
      }
    },

    //--------------------------------------------------------------------------
    //
    //  Lifecycle
    //
    //--------------------------------------------------------------------------

    getDefaults: function() {
      return lang.mixin(this.inherited(arguments, []), defaultCircle);
    },

    normalizeCtorArgs: function(center, options) {
      var ret;

      if (center && center.center) {
        ret = center;
      }
      else if (center && center.rings) {
        // Internal constructor used for cloning, let Polygon handle the
        // construction from rings
        return this.inherited(arguments);
      }
      else {
        ret = {
          center: center
        };
      }

      return lang.mixin(this.inherited(arguments, []), ret, options);
    },

    initialize: function() {
      var center = this.center;
      var numberOfPoints = this.numberOfPoints;

      if (this.rings.length !== 0 || !center) {
        // We will have "rings" available already when a circle is created
        // using the constructor signature of a polygon.
        // See: webMercatorUtils.geographicToWebMercator. 
        // geographicToWebMercator needs to be fixed so that we can remove 
        // this "if" block.
        return;
      }

      var radiusMeter = this.radius * _unitToMeters[this.radiusUnit],
          centerSr = center.spatialReference,
          centerSrType = "geographic",
          circle;

      if (centerSr.isWebMercator()) {
        centerSrType = "webMercator";
      }
      else if (esriLang.isDefined(WKIDUnitConversion[centerSr.wkid]) ||
        (centerSr.wkt && centerSr.wkt.indexOf("PROJCS") === 0)) {
        centerSrType = "projected";
      }

      if (this.geodesic) {
        var geographicCenter;
        switch (centerSrType) {
          case "webMercator":
            geographicCenter = webMercatorUtils.webMercatorToGeographic(center);
            break;
          case "projected":
            console.error("Creating a geodesic circle requires the center to be specified in web mercator or geographic coordinate system");
            break;
          case "geographic":
            geographicCenter = center;
            break;
        }
        circle = this._createGeodesicCircle(geographicCenter, radiusMeter, numberOfPoints);
        if (centerSrType === "webMercator") {
          circle = webMercatorUtils.geographicToWebMercator(circle);
        }
      }
      else {
        var radiusInSR;
        if (centerSrType === "webMercator" || centerSrType === "projected") {
          radiusInSR = radiusMeter / this._convert2Meters(1, center.spatialReference);
        }
        else if (centerSrType === "geographic") {
          //radius could be either linear unit or degree
          //either case, convert it to degree
          radiusInSR = radiusMeter / _unitToMeters.esriDecimalDegrees;
        }
        circle = this._createPlanarCircle(center, radiusInSR, numberOfPoints);
      }

      this.spatialReference = circle.spatialReference;

      this.addRing(circle.rings[0]);
    },


    //--------------------------------------------------------------------------
    //
    //  Properties
    //
    //--------------------------------------------------------------------------

    //----------------------------------
    //  center
    //----------------------------------  
    
    /**
    * The center point of the circle. The center must be specified either as a
    * {@link module:esri/geometry/Point Point} or an array of longitude/latitude coordinates.
    *
    * @type {module:esri/geometry/Point | number[]}
    */
    center: null,
      
    //----------------------------------
    //  geodesic
    //----------------------------------
    
    /**
    * Applicable when the spatial reference of the center point is either set to Web
    * Mercator (wkid: 3857) or geographic/geodesic (wkid: 4326). When  either of 
    * those spatial references is used, set geodesic to `true` to minimize
    * distortion. Other coordinate
    * systems will not create geodesic circles.
    *
    * @type {boolean}
    * @default false
    */  
    geodesic: false,  
      
    //----------------------------------
    //  hasM
    //----------------------------------

    _hasMGetter: function() { return false; },

    //----------------------------------
    //  hasZ
    //----------------------------------

    _hasZGetter: function() { return false; },
    
    //----------------------------------
    //  numberOfPoints
    //----------------------------------    
      
    /**
    * This value defines the number of points 
    * along the curve of the circle. 
    * 
    * @type {number}
    * @default
    */  
    numberOfPoints: 60,  
      
    //----------------------------------
    //  radius
    //----------------------------------  
     
    /**
    * The radius of the circle.
    * 
    * @type {number}
    * @default 1000
    */
    radius: null,
      
    //----------------------------------
    //  radiusUnit
    //----------------------------------  
     
    /**
    * Unit of the radius.
    *
    * **Possible Values:** esriMeters | esriKilometers | esriCentimeters | esriFeet | 
    * esriInches | esriMiles | esriMillimeters | esriNauticalMiles | esriYards
    * 
    * @type {string}
    * @default esriMeters
    */  
    radiusUnit: null,  


    //--------------------------------------------------------------------------
    //
    //  Public Methods
    //
    //--------------------------------------------------------------------------

    clone: function() {
      return new Circle({
        rings: this.rings,

        hasZ: this.hasZ,
        hasM: this.hasM,

        spatialReference: this.spatialReference
      });
    },


    //--------------------------------------------------------------------------
    //
    //  Private Methods
    //
    //--------------------------------------------------------------------------

    _createGeodesicCircle: function (center, radiusMeter, numberOfPoints) {
      var alpha = 0,
        toRad = Math.PI / 180,
        pts = [],
        pt, geodesicCircle;

      while (alpha < 2 * Math.PI) {
        pt = geodesicUtils._directGeodeticSolver(center.y * toRad, center.x * toRad, alpha, radiusMeter);
        pts.push(pt.toArray());
        alpha += Math.PI / (numberOfPoints / 2);
      }
      
      //close the polygon
      pts.push(pts[0]);
      //under wkid 4326
      geodesicCircle = new Polygon(pts);

      return geodesicCircle;
    },

    _createPlanarCircle: function (center, radius, numberOfPoints) {
      var alpha = 0,
        circle, pts = [],
        x, y;

      while (alpha < 2 * Math.PI) {
        x = center.x + Math.cos(alpha) * radius;
        y = center.y + Math.sin(alpha) * radius;
        pts.push([x, y]);
        alpha += Math.PI / (numberOfPoints / 2);
      }

      pts.push(pts[0]);

      circle = new Polygon({
        spatialReference: center.spatialReference,
        rings: [pts]
      });

      return circle;
    },

    _convert2Meters: function (length, sr) {
      var coeff;

      if (esriLang.isDefined(WKIDUnitConversion[sr.wkid])) {
        coeff = WKIDUnitConversion.values[WKIDUnitConversion[sr.wkid]];
      }
      else {
        var wkt = sr.wkt;
        var start = wkt.lastIndexOf(",") + 1;
        var end = wkt.lastIndexOf("]]");
        coeff = parseFloat(wkt.substring(start, end));
      }

      return length * coeff; //in meters
    }

  });

  return Circle;
});
