define([
  "../core/declare",
  "dojo/_base/array",
  "dojo/_base/lang",
  "../core/lang",
  "./Renderer"
], function(declare, array, lang, esriLang, Renderer) {
    
  // TODO
  // - Implement getSize and getRotationAngle methods or getRenderer?

  var ScaleDependentRenderer = declare(Renderer, {
    declaredClass: "esri.renderer.ScaleDependentRenderer",
    
    constructor: function(options) {    
      this.setRendererInfos((options && options.rendererInfos) || []); 
    },
    
    setRendererInfos: function(infos) {
      this.rendererInfos = infos;
      this._setRangeType();
      return this;
    },

    getSymbol: function(graphic) {
      var selected = this.getRendererInfo(graphic);
      return selected &&
          selected.renderer &&
          selected.renderer.getSymbol(graphic);
    },
    
    getRendererInfo: function(graphic) {
      var map = graphic.getLayer().getMap(),
          selected;
      
      selected = (this.rangeType === "zoom") ? 
                  this.getRendererInfoByZoom(map.getZoom()) :
                  this.getRendererInfoByScale(map.getScale());
    
      return selected;
    },
    
    getRendererInfoByZoom: function(zoom) {
      var info, infos = this.rendererInfos,
          selected, i = 0;
      
      do {
        info = infos[i];
        
        if (zoom >= info.minZoom && zoom <= info.maxZoom) {
          selected = info;
        }
        
        i++;
      }
      while (!selected && i < infos.length);

      return selected;
    },
    
    getRendererInfoByScale: function(scale) {
      var info, infos = this.rendererInfos,
          selected, i = 0,
          minScale, maxScale, minPassed, maxPassed;
      
      do {
        info = infos[i];
        
        // Borrowed from esri/layers/layer.js
        minScale = info.minScale; 
        maxScale = info.maxScale; 
        minPassed = !minScale;
        maxPassed = !maxScale;
        
        if (!minPassed && scale <= minScale) {
          minPassed = true;
        }
        if (!maxPassed && scale >= maxScale) {
          maxPassed = true;
        }

        if (minPassed && maxPassed) {
          selected = info;
        }
        
        i++;
      }
      while (!selected && i < infos.length);

      return selected;
    },

    addRendererInfo: function(rendererInfo) {
      /**
        rendererInfo = {
          "renderer": renderer,
          //can specify scale break based on scale values or zoom levels (tiled only)
          "minScale": minScale,
          "maxScale": maxScale,
          "minZoom":  minZoom,
          "maxZoom":  maxZoom
        } 
      */
      var insertedRenderer, i = 0, 
          info, infos = this.rendererInfos,
          renderRuleProperty = (rendererInfo.hasOwnProperty("minZoom")) ? "minZoom" : "minScale",
          currentLength = infos.length;  
      
      do {
        info = infos[i];
        
        if (
          (currentLength === i) || 
          (rendererInfo[renderRuleProperty] < info[renderRuleProperty])
        ) {
          infos.splice(i, 0, rendererInfo);
          this._setRangeType();
          insertedRenderer = true;
        }
        
        i++;
      } 
      while (!insertedRenderer && i < currentLength);

      return this;
    },

    // removeRendererInfo: function(rendererInfo) {
    //   var i = 0,
    //       renderRuleProperty = (rendererInfo.hasOwnProperty('minZoom')) ? "minZoom" : "minScale",
    // },
    
    _setRangeType: function() {
      // This method should be called to recompute rangeType whenever
      // rendererInfos changes.
      var infos = this.rendererInfos,
          info = infos && infos[0];
          
      if (info) {
        this.rangeType = (info.hasOwnProperty("minZoom"))  ? "zoom" :
                         (info.hasOwnProperty("minScale")) ? "scale" :
                          "";
      }
    },

    toJson: function() {
      try {
        throw new Error("toJson is deprecated, use toJSON instead");
      }
      catch (e) {
        console.warn(e.stack);
      }

      return this.toJSON();
    },

    toJSON: function() {
      if (this.rangeType === "zoom") {
        return null; // unsupported
      }

      var infos = this.rendererInfos || [],
          minScale = infos[0] && infos[0].minScale,
          json = lang.mixin(this.inherited(arguments),
              {
                type: "scaleDependent",
                minScale: (minScale > 0) ? minScale : 0,
                rendererInfos: array.map(infos, function(info) {
                  return esriLang.fixJson({
                    maxScale: (info.maxScale > 0) ? info.maxScale : 0,
                    renderer: info.renderer && info.renderer.toJSON()
                  });
                })
              });

      return esriLang.fixJson(json);
    }
  });

   

  return ScaleDependentRenderer;
});
