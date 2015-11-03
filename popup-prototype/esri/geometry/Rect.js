define(
[
  "../core/declare",
  "dojo/_base/lang",
  "dojo/_base/kernel",
  "dojox/gfx/_base",
  "./SpatialReference",
  "./Geometry",
  "./Point",
  "./Extent"
],
function(declare, lang, kernel, gfxBase, SpatialReference, Geometry, Point, Extent) {
  
  function rectToExtent(rect) {
    return new Extent(
      parseFloat(rect.x), 
      parseFloat(rect.y) - parseFloat(rect.height),
      parseFloat(rect.x) + parseFloat(rect.width), 
      parseFloat(rect.y),
      rect.spatialReference
    );
  }

  var defaultRect = lang.clone(gfxBase.defaultRect);

  var Rect = declare(Geometry, {
    declaredClass: "esri.geometry.Rect",
    type: "rect",

    getDefaults: function() {
      return lang.mixin(this.inherited(arguments), defaultRect);
    },

    normalizeCtorArgs: function(/*Number or Object*/ x, /*Number*/ y, /*Number*/ width, /*Number*/ height, /*esri.SpatialReference*/ spatialReference) {
      //summary: Create a new Rectangle object with top-left point ( x, y ) and width
      //         and height of rectangle
      // x: Number or Object: x coordinate of top-left point or { x, y, width, id, spatialReference } object
      // y: Number: y coordinate of top-left point
      // width: Number: width of rectangle
      // height: Number: height of rectangle
      // spatialReference: esri.SpatialReference: spatial reference well-known-id
      if (lang.isObject(x)) {
        return x;
      }

      return {
        x: x,
        y: y,
        width: width,
        height: height,
        spatialReference: spatialReference
      };
    },

    getCenter: function() {
      kernel.deprecated(this.declaredClass + ".getCenter", "Use .center instead", "4.0");
      return this.center;
    },

    _centerGetter: function() {
      //summary: Get center point of Rect
      // returns: esri.geometry.Point: Center point of rectangle
      var x, y;

      x = this.x + this.width / 2;
      y = this.y + this.height / 2;

      return new Point(x, y, this.spatialReference);
    },

    offset: function(/*Number*/ ox, /*Number*/ oy) {
      //summary: esri.geometry.Extent: Return new extent object by offsetting by
      //         argument x and y
      // ox: Number: Offset x distance
      // oy: Number: Offset y distance
      // returns: esri.geometry.Extent: Returns offsetted extent object
      return new Rect(this.x + ox, this.y + oy, this.width, this.height, this.spatialReference);
    },

    intersects: function(/*esri.geometry.Rect*/ rect) {
      //summary: Return true if argument Rect intersects this Rect
      // returns: boolean: true if intersects, else false
      if ((rect.x + rect.width) <= this.x) {
        return false;
      }
      if ((rect.y + rect.height) <= this.y) {
        return false;
      }
      if (rect.y >= (this.y + this.height)) {
        return false;
      }
      if (rect.x >= (this.x + this.width)) {
        return false;
      }
    
      return true;
    },

    _extentGetter: function() {
      return rectToExtent(this);
    },

//    contains: function(/*esri.geometry.Point*/ point) {
//      //summary: Return true if argument Point is fully contained within this Rect
//      // returns: boolean: true if contained, else false
//      return point !== null && point.x >= this.x && point.x <= (this.x + this.width) && point.y >= this.y && point.y <= (this.y + this.height);
//    },
//
//      union: function(/*esri.geometry.Rect*/ rect) {
//        //summary: Returns the union of this and argument Rects
//        // returns: esri.geometry.Rect: unioned Rect
//        var x = Math.min(this.x, rect.x);
//        var y = Math.min(this.y, rect.y);
//        var r = Math.max(this.x + this.width, rect.x + rect.width);
//        var b = Math.max(this.y + this.height, rect.y + rect.height);
//        return new esri.geometry.Rect(x, y, r - x, b - y, this.spatialReference);
//      },

    update: function(x, y, width, height, spatialReference) {
      kernel.deprecated(this.declaredClass + ".update", "Use .set instead", "4.0");

      this.set({
        x: x,
        y: y,
        width: width,
        height: height,
        spatialReference: spatialReference
      });

      return this;
    },

    clone: function() {
      return new Rect({
        x: this.x,
        y: this.y,
        width: this.width,
        height: this.height,

        spatialReference: this.spatialReference
      });
    },

    toJSON: function() {
      var sr = this.spatialReference;

      return {
        x: this.x,
        y: this.y,
        width: this.width,
        height: this.height,

        spatialReference: sr && sr.toJSON()
      };
    } //,
  
  //    toString: function() {
  //      return this.declaredClass + "(" + this.x + ", " + this.y + ", " + this.width + ", " + this.height + (this.spatialReference ? ", " + this.spatialReference : "") + ")";
  //    }
  });

  Rect.defaultProps = defaultRect;

  

  Rect.fromJSON = function(json) {
    return new Rect({
      x: json.x,
      y: json.y,
      width: json.width,
      height: json.height,

      spatialReference: json.spatialReference && SpatialReference.fromJSON(json.spatialReference)
    });
  };

  return Rect;  
});
