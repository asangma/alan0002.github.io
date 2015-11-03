define(
[
  "../../config",
  "../../core/lang",
  "./WKIDUnitConversion"
],
function(esriConfig, esriLang, WKIDUnitConversion) {

  //for scale calculation
  var inchesPerMeter = 39.37,
      decDegToMeters = 20015077.0 / 180.0,
      lookup = WKIDUnitConversion;

  function _getScale(extent, mapWd, unitValue) {
    return (extent && mapWd) ? 
           ((extent.getWidth() / mapWd) * (unitValue || decDegToMeters) * inchesPerMeter * esriConfig.screenDPI) :
           0;
  }


  var scaleUtils = {

    getUnitValueForSR: function(inSR) {
      return this.getUnitValue(inSR) || decDegToMeters;
    },

    /* internal */
    getUnitValue: function(inSR) {
      // Returns the value of one map unit for the given spatial reference
      // (in meters)
      // inSR can be SpatialReference or WKID or WKT
      var wkid, wkt, unitValue;
      
      if (inSR) {
        if (typeof inSR === "object") {
          wkid = inSR.wkid;
          wkt = inSR.wkt;
        }
        else if (typeof inSR === "number") {
          wkid = inSR;
        }
        else if (typeof inSR === "string") {
          wkt = inSR;
        }
      }
      
      if (wkid) {
        unitValue = lookup.values[lookup[wkid]];
      }
      else if ( wkt && (wkt.search(/^PROJCS/i) !== -1) ) {
        var result = /UNIT\[([^\]]+)\]\]$/i.exec(wkt);
        if (result && result[1]) {
          unitValue = parseFloat(result[1].split(",")[1]);
        }
      }
      // else assumed to be in degrees
      
      return unitValue;
    },

    //scale calculation
    getScale: function(map, inExtent, wkid) {
      var extent, width, unitValue;
      
      if (arguments.length > 1 && (esriLang.isDefined(inExtent) && !inExtent.declaredClass)) { // backward compatibility for method signature
        // [ extent, width, wkid ]
        extent = map;
        width = inExtent;
        //wkid = arguments[2];
        inExtent = null;
        
        unitValue = scaleUtils.getUnitValue(wkid);
      }
      else {
        // [ map, inExtent? ]
        extent = inExtent || map.extent;
        width = map.width;
        
        unitValue = scaleUtils.getUnitValue(extent && extent.spatialReference);
      }
      
      return _getScale(extent, width, unitValue);
    },
    
    /**
     * Get the extent for the specified scale.
     *
     * @param {esri/views/View} view - The view to compute the extent for. The view is used to get its width and extent
     * @param {number} scale - Scale value to compute the extent for. Scale is in the scale unit as the view's spatial reference
     *
     * @return {esri/geometry/Extent} An extent at this scale. 
     */
    getExtentForScale: function(view, scale) {
      var viewExtent = view.get("extent"),
          viewWidth  = view.get("width"),
          unitValue  = scaleUtils.getUnitValue(viewExtent.get("spatialReference"));
      return viewExtent.expand(
        ((scale * viewWidth) / ((unitValue || decDegToMeters) * inchesPerMeter * esriConfig.screenDPI)) / viewExtent.get("width")
      );
    }

  };

  

  return scaleUtils;  
});
