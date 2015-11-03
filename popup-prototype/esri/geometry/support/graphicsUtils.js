define(
[
  "dojo/_base/array",
  "../Extent"
],
function(array, Extent) {
  
  var graphicsUtils = {
    graphicsExtent: function(/*esri.Graphic[]*/ graphics) {
      var g = graphics[0].geometry,
          fullExt = g.getExtent(),
          ext, i, il = graphics.length;
          
      if (fullExt === null) {
        fullExt = new Extent(g.x, g.y, g.x, g.y, g.spatialReference);
      }
    
      for (i=1; i<il; i++) {
        ext = (g = graphics[i].geometry).getExtent();
        if (ext === null) {
          ext = new Extent(g.x, g.y, g.x, g.y, g.spatialReference);
        }
    
        fullExt = fullExt.union(ext);
      }
    
      if (fullExt.getWidth() < 0 && fullExt.getHeight() < 0) {
        return null;
      }
      
      return fullExt;
    },
    
    getGeometries: function(/*esri.Graphic[]*/ graphics) {
      return array.map(graphics, function(graphic) {
        return graphic.geometry;
      });
    },
    
    _encodeGraphics: function(/*esri.Graphic[]*/ graphics, normalized) {
      var encoded = [], json, enc, norm;
      array.forEach(graphics, function(g, i) {
        json = g.toJSON();
        enc = {};
        if (json.geometry) {
          norm = normalized && normalized[i];
          enc.geometry = norm && norm.toJSON() || json.geometry;
        }
        if (json.attributes) {
          enc.attributes = json.attributes;
        }
        encoded[i] = enc;
      });
      return encoded;
    }
  };
  
  
  
  return graphicsUtils;
});
