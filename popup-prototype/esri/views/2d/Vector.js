/*jslint browser: true, continue: true, eqeq: true, nomen: true, plusplus: true, regexp: true, unparam: true, sloppy: true, todo: true, vars: true, white: true */
/*global define */
define(
[
  "../../core/declare",
  
  "../../geometry/Extent",
  
  "../../core/Accessor"
],
function(
  declare,
  Extent,
  Accessor
) {

var ID = 0;
function generateID() {
  return "vec" + ID++;
}

var Vector = declare([Accessor], {

  declaredClass: "esri.views.2d.Vector",
  
  //--------------------------------------------------------------------------
  //
  //  Constructor
  //
  //--------------------------------------------------------------------------
  
  constructor: function Vector() {
    this.id = generateID();
  },

  //--------------------------------------------------------------------------
  //
  //  Properties
  //
  //--------------------------------------------------------------------------
  
  //----------------------------------
  //  graphic
  //----------------------------------
  
  _graphicSetter: function(value, oldValue) {
    if (value === oldValue) {
      return oldValue;
    }    
    if (value) {
      this.extent = this._getGraphicExtent(value);
    }
    else {
      this.extent = null;
    }
    
    this.graphicChanged();
    return value;
  },
  
  //----------------------------------
  //  symbol
  //----------------------------------
  
  _symbolSetter: function(value, oldValue) {
    if (value === oldValue) {
      return oldValue;
    }

    if (this._symbolChangeHandle) {
      this._symbolChangeHandle.remove();
      this._symbolChangeHandle = null;
    }
    
    // if (this.symbol) {
      // this._symbolChangeHandle = this.symbol.on("property-change", this._symbolChangeHandler);
    // }
    
    this.symbolChanged();
    return value;
  },
  
  //----------------------------------
  //  color
  //----------------------------------
  
  _colorSetter: function(value, oldValue) {
    if (value === oldValue) {
      return oldValue;
    }
    this.symbolChanged();
    return value;
  },
  
  //----------------------------------
  //  size
  //----------------------------------
  
  _sizeSetter: function(value, oldValue) {
    if (value === oldValue) {
      return oldValue;
    }
    this.symbolChanged();
    return value;
  },
  
  //----------------------------------
  //  parent
  //----------------------------------
  
  _parentSetter: function(value, oldValue) {
    if (value === oldValue) {
      return oldValue;
    }    
    if (value) {
      if (this._requestDrawFlag) {
        value.requestVectorDraw(this);
      }
    }
    return value;
  },
  
  
  //--------------------------------------------------------------------------
  //
  //  Public function
  //
  //--------------------------------------------------------------------------
  
  graphicChanged: function() {
    this._graphicChanged = true;
    this.requestDraw();
  },
  
  symbolChanged: function() {
    this._symbolChanged = true;
    this.requestDraw();
  },
  
  rendered: function() {
    this._graphicChanged = false;
    this._symbolChanged  = false;
  },
  
  requestDraw: function() {
    if (this._requestDrawFlag) {
      return;
    }
    this._requestDrawFlag = true;

    if (this.parent) {
      this.parent.requestVectorDraw(this);
    }
  },
  
  
  //--------------------------------------------------------------------------
  //
  //  Private functions
  //
  //--------------------------------------------------------------------------
  
  _getGraphicExtent: function(graphic) {
    var geom = graphic.geometry,
        extent = null;
    
    if (geom) {    
      extent = geom.extent;
      if (!extent) {
        var x, y;
        if (geom.declaredClass === "esri.geometry.Point") {
          x = geom.x;
          y = geom.y;
        }
        else if (geom.declaredClass === "esri.geometry.Multipoint") {
          x = geom.points[0][0];
          y = geom.points[0][1];
        }
        else {
          //Extent not calculated for this type of geometry. All geometries should return an extent, what geometry type failed?
          //console.debug("Error condition: " + this.declaredClass + "._updateExtent(" + geom.type + ").");
          return null;
        }
        extent = new Extent(x, y, x, y, geom.spatialReference);
      }
    }
    return extent;
  }
  
  
  //--------------------------------------------------------------------------
  //
  //  Event Handler
  //
  //--------------------------------------------------------------------------

  
});

return Vector;

});
