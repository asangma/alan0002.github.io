define([
        "../core/declare",
        "dojo/_base/lang",
        "dojo/_base/array",
        "dojo/dom-construct",
        "../core/lang",
        "../symbols/PictureMarkerSymbol",
        "../Color",
        "./Renderer"
    ], function(
    declare, lang, array, domConstruct, esriLang,
    PictureMarkerSymbol, Color, Renderer
) {
    var HeatmapRenderer = declare([Renderer], {
        declaredClass: "esri.renderer.HeatmapRenderer",

        colors: null,

        blurRadius: 10,

        maxPixelIntensity: 100,

        minPixelIntensity: 0,

        field: null,

        fieldOffset: null,

        colorStops: null,

        constructor: function(options) {
            this._supportsCanvas = (window.CanvasRenderingContext2D) ? true : false;
            if (!this._supportsCanvas) {
              console.log("The HeatmapRenderer requires a Canvas enabled Browser.  IE8 and less does not support Canvas.");
              return;
            }
            if(typeof(options) == "string"){
              options = JSON.parse(options);
            }
            lang.mixin(this, options);
            this._canvas = null;
            if(!this.colors && !this.colorStops){
              //add default color ramp
              this.colorStops = [
                {ratio: 0, color: "rgba(255, 140, 0, 0)"}, // orange (transparent)
                {ratio: 0.75, color: "rgba(255, 140, 0, 1)"}, // orange (opaque)
                {ratio: 0.9, color: "rgba(255, 0,   0, 1)"}  // Red (opaque)
              ];
            }
            this.gradient = this._generateGradient(this.colorStops || this.colors);
        },

        getSymbol: function(feature) {
            //basically a hack to fit a surface renderer into a feature rendering system
            //creates a picture marker symbol with the entire heatmap as a data uri encoded url
            //feature is a graphic-like object with required attributes of imageData & size
            if (!this._supportsCanvas){
                //no canvas for you!
                return false;
            }
            var dataArray = feature.attributes.imageData,
                size = feature.attributes.size;
            if(!size){
              return null;
            }
            var ctx = this._getContext(size[0],size[1]);
            var imgData = ctx.getImageData(0,0,size[0],size[1]);
            //normalize dataArray to a Uint8 type array
            if(window.ArrayBuffer && dataArray instanceof ArrayBuffer){
                dataArray = (window.Uint8ClampedArray) ? new Uint8ClampedArray(dataArray) : new Uint8Array(dataArray);
            } else if (dataArray.BYTES_PER_ELEMENT && dataArray.BYTES_PER_ELEMENT !== 1){
                dataArray = (window.Uint8ClampedArray) ? new Uint8ClampedArray(dataArray.buffer) : new Uint8Array(dataArray.buffer);
            }
            //handle IE canvas image data type, which is not a true typed array
            if(window.CanvasPixelArray && imgData.data instanceof window.CanvasPixelArray){
              var idata = imgData.data,
                  len = idata.length;
              //fastest looping method
              while(len--){
                idata[len] = dataArray[len];
              }
            } //everybody else gets to use normal, native typed array methods 
            else {
              imgData.data.set(dataArray);
            }
            ctx.putImageData(imgData,0,0);
            var symbol = new PictureMarkerSymbol(ctx.canvas.toDataURL(), size[0], size[1]);
            return symbol;
        },

        setColors: function(ramp){
          if(ramp && (ramp instanceof Array || ramp.colors)){
            this.gradient = this._generateGradient(ramp.colors || ramp);
            this.colors = ramp;
          }
          return this;
        },

        setColorStops: function(ramp){
          if(ramp && (ramp instanceof Array || ramp.colorStops)){
            this.gradient = this._generateGradient(ramp.colorStops || ramp);
            this.colorStops = ramp;
          }
          return this;
        },

        setMaxPixelIntensity: function(val){
          this.maxPixelIntensity = val;
          return this;
        },

        setMinPixelIntensity: function(val){
          this.minPixelIntensity = val;
          return this;
        },

        setField: function(fld){
          this.field = fld;
          return this;
        },

        setFieldOffset:  function(val){
          this.fieldOffset = val;
          return this;
        },

        setBlurRadius: function(val){
          this.blurRadius = val;
          return this;
        },

        getStats: function(){
          //overwrittern and filled in by the HeatmapManager, calculated by the heatmapCalculator
        },

        getHistogramData: function(){
          //overwrittern and filled in by the HeatmapManager, calculated by the heatmapCalculator
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
          var retVal = lang.mixin(
            this.inherited(arguments), {
              type: "heatmap",
              blurRadius: this.blurRadius,
              colorStops: this._colorsToStops(this.colorStops || this.colors),
              maxPixelIntensity: this.maxPixelIntensity,
              minPixelIntensity: this.minPixelIntensity,
              field: this.field
            }
          );
          if(this.fieldOffset != null){
            retVal.fieldOffset = this.fieldOffset;
          }
          array.forEach(retVal.colorStops, function(s){
            s.color = Color.toJSON(s.color);
          });
          return esriLang.fixJson(retVal);
        },

        _getContext: function(w, h) {
            if (!this._canvas) {
                this._canvas = this._initCanvas(w, h);
            } else {
                this._canvas.width = w;
                this._canvas.height = h;
            }

            var ctx = this._canvas.getContext("2d");
            return ctx;

        },

        _initCanvas: function(w,h) {
          var canvas = domConstruct.create("canvas", {
            id: "hm_canvas-" + Math.floor(Math.random() * 1000),
            style: "position: absolute; left: -10000px; top: 0px;"
          }, null);
          canvas.width=w;
          canvas.height=h;
          document.body.appendChild(canvas);
          return canvas;
        },

        _generateGradient: function(colors, gradientLength) {
          if(!gradientLength){ 
            gradientLength = 512; 
          }
          var stops = this._colorsToStops(colors);
          var ctx = this._getContext(1, gradientLength || 512),
              gradient = ctx.createLinearGradient(0, 0, 0, gradientLength);

          for (var i = 0, s; i < stops.length; i++) {
              s = stops[i];
              gradient.addColorStop(s.ratio, s.color.toCss(true));
          }

          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, 1, gradientLength);

          var gradData = ctx.getImageData(0, 0, 1, gradientLength).data;
          return gradData;
        },

        _colorsToStops: function(colors){
          var stops = [];
          
          if(!colors[0]){ 
            return stops; 
          }
          
          //stops or just colors
          if(colors[0].ratio != null){
            //stops. already have the 0-1 ratios, just need sanitized color
            stops = array.map(colors, function(c){
              return {
                ratio: c.ratio,
                color: this._toColor(c.color)
              };
            }, this);
          } 
          else if(colors[0].value != null) {
            //stops. need to adjust values to ratios
            //like colorInfo, we are ignoring class's min,max pixel intensity values in favor of stated values
            //find min & max values
            var min = Infinity, max = -Infinity, range = 0, i;
            for(i=0;i<colors.length;i++){
              var val = colors[i].value;
              if(val<min){ min = val; }
              if(val>max){ max = val; }
            }
            range = max-min;
            //set class properties to found min & max
            this.maxPixelIntensity = max;
            this.minPixelIntensity = min;
            //normalize to ratio and rbga color
            stops = array.map(colors, function(stop){
              var v = stop.value, c = this._toColor(stop.color);
              return {
                value: v,
                ratio: (v-min)/range,
                color: c
              };
            }, this);
          } 
          else {
            // just colors
            var len = colors.length-1;
            stops = array.map(colors, function(c, i){
              return {
                color: this._toColor(c),
                ratio: i/len
              };
            }, this);
          }
          
          return stops;
        },
  
        _toColor: function(color) {
          if(!color.toRgba && !color.declaredClass){
            color = new Color(color);
          }
          
          return color;
        }
    });
    
     
    
    return HeatmapRenderer;
});
