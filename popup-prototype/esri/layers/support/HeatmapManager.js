define([
  "require", 
  
  "../../core/declare",
  "dojo/_base/lang",
  "dojo/_base/array",
  "dojo/aspect",
    
  "../../geometry/Point",
  "../../geometry/support/webMercatorUtils",
  
  "./MapImage",
  
  "../FeatureLayer",
  
  "../../renderers/HeatmapRenderer",
  
  "../../tasks/support/Query",
  
  "dojo/_base/fx"
], function(
  require,
  declare, lang, array, aspect,
  Point, webMercatorUtils,
  MapImage,
  FeatureLayer,
  HeatmapRenderer,
  Query,
  djFx
) {
  var HeatmapManager = declare(null, {
    declaredClass: "esri.layers.support.HeatmapManager",
    heatmapRenderer: null,
    sourceLayer: null,
    imageLayer: null,
    useTiles: true,
    useWorker: false,
    map: null,
    
    constructor: function(layer) {
      this.sourceLayer = layer;
      this._hndls = [];
    },
    
    initialize: function(map) {
      this.map = map;
      var layer = this.sourceLayer;
      var renderer = layer.renderer;
      layer.setDrawMode(false);
      this.imageLayer = map._getMapImageLyr();
      var that = this;
      
      if(renderer instanceof HeatmapRenderer){
        this.heatmapRenderer = renderer;
      } else {
        //we must have a scale dependant renderer, with a currently selected heatmap renderer (or else we wouldn't have gotten here)
        this.heatmapRenderer = (renderer.getRendererInfoByZoom(map.getZoom()) || renderer.getRendererInfoByScale(map.getScale())).renderer;
      }
      
      // we know we can use bind b/c we are using canvas & no browser supports canvas but not bind
      this.recalculateHeatmap = this.recalculateHeatmap.bind(this);
      this._removeRenderer = this._removeRenderer.bind(this);
      this._handleRendererChange = this._handleRendererChange.bind(this);
      this._rendererChangeHandle = this.sourceLayer.on("renderer-change", this._handleRendererChange);
      this._handleOpacityChange = this._handleOpacityChange.bind(this);
      this._reprojectFeature = this._reprojectFeature.bind(this);
      
      /*if(this.sourceLayer.spatialIndex || map.spatialIndex || this.heatmapRenderer.useWorkers){
        this.useWorker = true;
        require(["../workers/WorkerClient"],function(WorkerClient){
          that._calculatorClient = new WorkerClient("esri/workers/heatmapCalculator");
          that._calculatorClient.postMessage(lang.mixin({
            action:"initialize",
            width: that.map.width,
            height: that.map.height
          }, that.heatmapRenderer._getOptions())).then(that._setupRenderer);
        });
      } else {*/
        require(["../../workers/heatmapCalculator"], function(HeatmapCalculator){
          that._calculator = new HeatmapCalculator(lang.mixin({
            width: that.map.width,
            height: that.map.height
          }, that._getOptions()));
          that._setupRenderer();
          that.heatmapRenderer.getStats = HeatmapCalculator.calculateStats;
          that.heatmapRenderer.getHistogramData = HeatmapCalculator.getHistogramData;
        });
      //}
    },

    destroy: function(){
      this._removeHandlers();
      this._rendererChangeHandle && (this._rendererChangeHandle.remove());
      this._rendererChangeHandle = this.sourceLayer = this.imageLayer = this.map = this.heatmapRenderer = this._hndls = null;
    },

    _handleRendererChange: function(evt) {
      var rndr = evt.renderer;
      var newHmr = (rndr instanceof HeatmapRenderer);
      if (this.heatmapRenderer) {
        if (newHmr) {
          //we just changed to a different heatmap renderer (or heatmap renderer subclass)
          this.heatmapRenderer = rndr;
        } else {
          this._removeRenderer(evt);
        }
      } else if(newHmr){
        //switching back to or to a new heatmap renderer
        this.heatmapRenderer = rndr;
        if(this.sourceLayer && this.map){
          this._setupRenderer();
        }
      }
    },
    
    _handleOpacityChange: function(evt){
      var opacity = evt.opacity;
      var img = this._getImageBySourceId(this.sourceLayer.id);
      if(img){
        img.setOpacity(opacity);
      }
    },

    _setupRenderer: function() {
      var hndl = this._hndls;
      var layer = this.sourceLayer;
      var map = this.map;
      var that = this;
      
      layer._originalDraw = layer._draw;
      layer._draw = noop;

      //need to clear any old drawn symbols from non-heatmap renderers
      layer._div.clear();
      //have to eventually reset graphics to undrawn state or they won't redraw
      setTimeout(this._resetGraphics.bind(this), 250);

      hndl.push(layer.on("update-end", function rch(evt) {
        that.recalculateHeatmap();
      }));
      hndl.push(layer.on("suspend", function(evt){
        var img = that._getImageBySourceId(that.sourceLayer.id);
        img && (img.hide());
      }));
      hndl.push(layer.on("resume", function(evt){
        var img = that._getImageBySourceId(that.sourceLayer.id);
        img && (img.show());
      }));
      hndl.push(aspect.after(layer, "redraw", this.recalculateHeatmap));
      hndl.push(map.on("layer-remove", function(evt){
        if(evt.layer == layer){
          var img = that._getImageBySourceId(that.sourceLayer.id);
          img && (that.imageLayer.removeImage(img));
          that._removeRenderer({target:layer});
        }
      }));
      if(layer._collection){
        //only needed on feature collections, because server based stuff will come in correctly
        hndl.push(layer.on("graphic-add", function(evt){
          that._reprojectFeature(evt.graphic);
        }));
      }
      if (layer.mode !== FeatureLayer.MODE_ONDEMAND) {
        hndl.push(map.on("resize, pan-end", function(evt) {
          setTimeout(that.recalculateHeatmap, 16);
        }));
        hndl.push(map.on("zoom-end", function(evt) {
          setTimeout(function(){
            if(layer._getRenderer().isInstanceOf(HeatmapRenderer)){
              that.recalculateHeatmap();
            }
          }, 16);
        }));
      }
      
      hndl.push(layer.on("opacity-change", this._handleOpacityChange));
      
      if(this.imageLayer.suspended){
        this.imageLayer.resume();
      }
      if (layer.graphics && layer.graphics.length) {
        //if the layer has graphics and they are in a different projection than the map, they must be reprojected
        //the normal draw function does this automattically for WGS84/WebMerc, but not the heatmap renderer.
        if(layer.graphics[0].geometry && !map.spatialReference.equals(layer.graphics[0].geometry.spatialReference)){
          array.forEach(layer.graphics, (function(g){
            this._reprojectFeature(g);
          }).bind(this));
        }
        this.recalculateHeatmap();
      }
    },
    
    _removeRenderer: function(evt) {
      var layer = evt.target;
      layer._draw = layer._originalDraw;
      delete layer._originalDraw;
      layer.setDrawMode(true);
      this._removeHandlers();
      this._hndls = [];
      var img = this._getImageBySourceId(this.sourceLayer.id);
      img && (this.imageLayer.removeImage(img));
      if(layer.renderer != evt.renderer && layer.renderer.getRendererInfo){
        //scale dep renderer, just suspend things
        this.heatmapRenderer = null;
      } else {
        //switched to a new simple renderer
        layer.redraw();
        this.destroy(); 
      }
    },
    
    recalculateHeatmap: function() {
      if(this._calculator){
        this._doMainCalculation();
      } else if(this._calculatorClient){
        this._doWorkerCalculation();
      }
    },

    _reprojectFeature: function(feat){
      if(!feat || !feat.geometry){
        return;
      }
      var geom = feat.geometry,
          mapSR = this.map.spatialReference,
          graphicSR = geom.spatialReference;
      if(!mapSR.equals(graphicSR)){
        var g = webMercatorUtils.project(geom, mapSR);
        if(g == null){
          console.log("Unable to reproject features to map's spatial reference. Please convert feature geometry before adding to layer");
        } else {
          feat.geometry = g;
        }
      }
    },
    
    _doWorkerCalculation: function(){

    },
    
    _doMainCalculation: function() {
      var lyr = this.sourceLayer,
        map = this.map,
        hmr = this.heatmapRenderer,
        extent = this.map.extent,
        w = this.map.width,
        h = this.map.height,
        calculator = this._calculator,
        that = this;
        
      var calcImgData = function(results) {
        var pts = that._getScreenPoints(results.features, map, lyr);
        
        var imgData = calculator.calculateImageData(lang.mixin({
          screenPoints: pts,
          mapinfo: {
            extent: [extent.xmin, extent.ymin, extent.xmax, extent.ymax],
            resolution: map.getResolution()
          },
          width: w,
          height: h
        },that._getOptions()));
        
        var pmsym = hmr.getSymbol(createMockGraphic({
          geometry: map.extent,
          attributes: {
            size: [w, h],
            imageData: imgData
          },
          layer: lyr
        }));
        
        var mi = new MapImage({
          extent: map.extent,
          href: pmsym.url,
          opacity: 0,
          sourceId: lyr.id
        });

        that._swapMapImages(mi, that._getImageBySourceId(lyr.id));

        if(lyr.suspended){
          mi.hide();
        }
        
      };
      
      var qry = {
        geometry: map.extent,
        timeExtent: (lyr.useMapTime) ? map.timeExtent : undefined,
        spatialRelationship: Query.SPATIAL_REL_INTERSECTS
      };
      
      //never go back the server, but do take advantage client side extent query optimizations
      if(lyr._canDoClientSideQuery(qry) != null){
        lyr.queryFeatures(qry, calcImgData);
      } else {
        //this is more efficient in a worker with a spatial index, but better than going back to server
        calcImgData({
          features: lyr.graphics
        });
      }
    },
    
    _getScreenPoints: function(features, map, layer) {
      // NOTE
      // This function is used by FeatureLayerStatistics plugin.
      // Update the plugin if this function is modified.
      // Keep this function stateless i.e. do not modify class members.
      var pts = [],
        len = features.length,
        i = 0,
        adj = 0,
        pt, sp,
      
      //determine affine transformation
        m0 = new Point(map.extent.xmin, map.extent.ymax, map.spatialReference),
        p0 = map.toScreen(m0),
        ix = p0.x, iy = p0.y,
        res = map.getResolution(),
        offsets;
      
      //Moving points back and forth so that they are all in actual screen coordinates
      var parts = map.extent.getCacheValue("_parts");
      if (parts) {
        offsets = array.map(parts, function(part) {
          return layer._intersects(map, part.extent)[0];
        });
      }

      while (len--) {
        pt = features[len];
        if(!pt.geometry){
          continue;
        }
        // for each point we do an "ax + b" operation
        sp = {
          x: Math.ceil((pt.geometry.x - m0.x)/res + ix),
          y: Math.floor((m0.y - pt.geometry.y)/res - iy),
          attributes: pt.attributes
        };
        if(offsets){
          adj = (offsets.length > 1 && sp.x < -offsets[0]) ? offsets[1] : offsets[0];
          sp.x += adj;
        }
        pts[i++] = sp;
      }
      
      return pts;
    },

    _getImageBySourceId: function(id){
      var imgs = this.imageLayer.getImages();
      imgs = array.filter(imgs, function(img){
        return img.sourceId == id;
      });
      if(!imgs.length){
        return;
      } else {
        //always return the last image (this was the most recently added)
        return imgs[imgs.length-1];
      }
    },

    _swapMapImages: function(i0, i2){
      var imgLyr = this.imageLayer;
      var fl = this.sourceLayer;
      var i0EndOpac = fl.opacity || 1;
      function remove(){
        imgLyr.removeImage(i2);
      }
      imgLyr.addImage(i0);
      djFx.anim(i0._node, {opacity: i0EndOpac}, null, null, function() {
        i0.opacity = i0EndOpac;
      });
      if(i2 != null){
        djFx.anim(i2._node, {opacity: 0}, null, null, remove);
      }
    },

    _removeHandlers: function(){
      if(this._hndls == null){
        return;
      } else {
        var len = this._hndls.length;
        while (len--) {
          this._hndls[len].remove();
        }
      }
    },

    _getOptions: function() {
      var hmr = this.heatmapRenderer;
      return {
        blurRadius: hmr.blurRadius,
        gradient: hmr.gradient,
        maxPixelIntensity: hmr.maxPixelIntensity,
        minPixelIntensity: hmr.minPixelIntensity,
        field: hmr.field,
        fieldOffset: hmr.fieldOffset
      };
    },

    _resetGraphics: function(){
      var graphics = this.sourceLayer.graphics,
          i = graphics.length,
          f;
      while(i--){
        f=graphics[i];
        f._shape = f._offsets = undefined;
      }
    }

  });

  function noop() {}

  function createMockGraphic(options){
    var geom = options.geometry,
        attr = options.attributes,
        lyr = options.layer;
    return {
      geometry: geom,
      attributes: attr,
      getLayer: function(){
        return lyr;
      }
    };
  }
  
  return HeatmapManager; 
});
