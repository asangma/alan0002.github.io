/**
 * Contains information about the tiling scheme for {@link module:esri/layers/ArcGISTiledLayer ArcGISTiledLayers}
 * and {@link module:esri/layers/ArcGISElevationLayer ArcGISElevationLayers}. TileInfo has no constructor.
 * 
 * @module esri/layers/support/TileInfo
 * @noconstructor
 * @since 4.0
 * @see module:esri/layers/ArcGISElevationLayer
 * @see module:esri/layers/ArcGISTiledLayer
 */
define(
[
  "dojo/_base/lang",
  
  "../../core/lang",
  
  "../../geometry/SpatialReference",
  "../../geometry/Point",
  
  "./LOD",
  
  "../../core/JSONSupport"
],
function(
  lang,
  esriLang,
  SpatialReference, Point,
  LOD,
  JSONSupport
) {

//--------------------------------------------------------------------------
//
//  TileInfo
//
//--------------------------------------------------------------------------

/**
* @extends module:esri/core/Accessor
* @mixes module:esri/core/JSONSupport
* @constructor module:esri/layers/support/TileInfo
*/
var TileInfo = JSONSupport.createSubclass(
/** @lends module:esri/layers/support/TileInfo.prototype */                       
{
  declaredClass: "esri.layers.support.TileInfo",
  
  classMetadata: {
    computed: {
      origin: ["spatialReference"]
    }
  },
  
  //--------------------------------------------------------------------------
  //
  //  Properties
  //
  //--------------------------------------------------------------------------

  //----------------------------------
  //  lods
  //----------------------------------

  /**
  * An array of levels of detail that define the tiling scheme.
  *
  * @type {module:esri/layers/support/LOD[]}
  */
  lods: null,
  
  _lodsReader: function(value) {
    return value.map(function(lod) {
      return LOD.fromJSON(lod);
    });
  },
  
  _lodsSetter: function(value) {
    var minScale = 0, maxScale = 0;
    var scales = [];
    if (value) {
      minScale = -Infinity;
      maxScale = Infinity;
      value.forEach(function(lod) {
        scales.push(lod.scale);
        minScale = (lod.scale > minScale) ? lod.scale : minScale;
        maxScale = (lod.scale < maxScale) ? lod.scale : maxScale;
      }, this);
    }
    this.scales = scales;
    this.minScale = minScale;
    this.maxScale = maxScale;
    return value;
  },

  //----------------------------------
  //  origin
  //----------------------------------
    
  /**
  * The tiling scheme origin.
  *
  * @type {module:esri/geometry/Point}
  */
  origin: null,    
  
  _originReader: function(value, source) {
    return Point.fromJSON(lang.mixin({
      spatialReference: source.spatialReference
    }, value));
  },

  //----------------------------------
  //  spatialReference
  //----------------------------------
  
  /**
  * The spatial reference of the tiling schema.
  *
  * @type {module:esri/geometry/SpatialReference}
  */
  spatialReference: null,    
    
  _spatialReferenceReader: function(value, source) {
    return value && new SpatialReference(value);
  },
  
  _spatialReferenceSetter: function(value) {
    if (value) {
      return value.clone();
    }
    return null;
  },
    
  /**
  * The dots per inch (DPI) of the tiling scheme.
  *
  * @name dpi
  * @instance
  * @type {number}
  */      
    
  /**
  * Image format of the cached tiles. 
  * 
  * **Possible Values:** png8 | png24 | png32 | jpg | LERC
  *
  * @name format
  * @instance
  * @type {string}
  */ 
    
  /**
  * Height of each tile in pixels.
  *
  * @name height
  * @instance
  * @type {number}
  */ 
    
  /**
  * Width of each tile in pixels.
  *
  * @name width
  * @instance
  * @type {number}
  */     
    
  
  //--------------------------------------------------------------------------
  //
  //  Public Methods
  //
  //--------------------------------------------------------------------------
  
  zoomToScale: function(zoom) {
    var scales = this.scales;
    if (zoom <= 0) {
      return scales[0];
    }
    else if (zoom >= scales.length) {
      return scales[scales.length - 1];
    }
    else {
      var z1 = Math.round(zoom - 0.5),
          z2 = Math.round(zoom);
      return (scales[z2]) + (z2 - zoom) * (scales[z1] - scales[z2]);
    }
  },

  scaleToZoom: function(scale) {
    var scales = this.scales,
        zoom = 0, n = scales.length - 1,
        s1, s2;

    for (zoom; zoom < n; zoom++) {
      s1 = scales[zoom];
      s2 = scales[zoom + 1];
      if (s1 <= scale) {
        return zoom;
      }
      if (s2 === scale) {
        return zoom + 1;
      }
      if (s1 > scale && s2 < scale) {
        return (zoom + 1) - (scale - s2) / (s1 - s2);
      }
    }
  },

  snapScale: function(scale, maxZoomDistance) {
    if (maxZoomDistance == null) {
      maxZoomDistance = 0.95;
    }
    var zoom = this.scaleToZoom(scale);
    var zoomDistance = zoom % Math.floor(zoom);
    if (zoomDistance >= maxZoomDistance) {
      return this.zoomToScale(Math.ceil(zoom));
    }
    else {
      return this.zoomToScale(Math.floor(zoom));
    }
  },

  clone: function() {
    return TileInfo.fromJSON(this.toJSON());
  },

  toJSON: function() {
    return esriLang.fixJson({
      rows:               this.rows,
      cols:               this.cols,
      dpi:                this.dpi,
      format:             this.format,
      compressionQuality: this.compressionQuality,
      origin:             this.origin && this.origin.toJSON(),
      spatialReference:   this.spatialReference && this.spatialReference.toJSON(),
      lods:               this.lods && this.lods.map(function(lod) {
                            return lod.toJSON();
                          })
    });
  }

});

return TileInfo;  

});
