define([
    "dijit/_OnDijitClickMixin",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetBase",
    
    "./RendererSlider",

    "dojo/_base/array",
    "../core/declare",
    "dojo/_base/lang",
    
    "dojo/dom-style",
    "dojo/Evented",

    "dojox/gfx",
    "dojo/i18n!../nls/jsapi",
    "dojo/text!./HeatmapSlider/templates/HeatmapSlider.html"
  ],
  function (
    _OnDijitClickMixin, _TemplatedMixin, _WidgetBase,
    RendererSlider,
    array, declare, lang,
    domStyle, Evented,
    gfx, i18n,
    template
  ) {

    var HeatmapSlider = declare("esri.widgets.HeatmapSlider", [_WidgetBase, _TemplatedMixin, _OnDijitClickMixin, Evented], {
      
      // Dom Node Properties
      baseClass: "esriHeatmapSlider",
      templateString: template,
      domNode: null,
      containerNode: null,
      handles: null,
      
      _rampWidthDefault: 25,
      
      showLabels: null,
      showTicks: null,
      showHandles: null,

      _rampNode: null,
      _sliderHeight: null,
      _colorRampSurface: null,
      _rect: null,
      _updateTimer: null,
      
      constructor: function (options, srcNodeRef) {
        
        this.inherited(arguments);

        if(!srcNodeRef){
          return;
        }

        // Parent Nodes
        this.domNode = srcNodeRef;
        this.containerNode = this._containerNode;
        
        this.rampWidth = options.rampWidth || this._rampWidthDefault;
        
        //only two color stops (id=3 and id=15) show handler
        this.handles = options.handles || [3, 15];
        
        this.showLabels = options.showLabels || true;
        this.showTicks = options.showTicks || true;
        this.showHandles = options.showHandles || true;

        //colorStops is the only required parameter
        this.colorStops = options.colorStops;
        
        // Test
        this.minSliderValue = 0;
        this.maxSliderValue = 1;
        
        this.values = [ this.colorStops[3].ratio, this.colorStops[15].ratio];
      },
      
      postCreate: function(){
       
       this.inherited(arguments);
        
      },

      startup: function (){
        
        this.inherited(arguments);
        
        // Create the Base Slider
        this._slider = new RendererSlider({
          type: "HeatmapSlider",
          values: this.values,
          minimum: this.minSliderValue,
          maximum: this.maxSliderValue,
          precision:2,
          showLabels:  this.showLabels,
          showTicks: this.showTicks,
          showHandles: this.showHandles,
          minLabel: i18n.widgets.rendererSlider.low,
          maxLabel: i18n.widgets.rendererSlider.high
        }, this._sliderNode);

        this._slider.startup();
        
        // Prepare Nodes for content
        this._rampNode = this._slider._sliderAreaRight;
        this._sliderHeight = domStyle.get(this._rampNode, "height") || 155;

        // Fill the Ramp Bar
        this._createSVGSurfaces();
        
        // Slide Event
        this._slider.on("slide", lang.hitch(this, function(evt){
          this._updateColorStops(evt.values[0], evt.values[1]);
          this._fillRamp();
        })); 
        
        // Sync _slider with HeatmapSlider instance
       this._slider.on("change", lang.hitch(this, function(evt){
          this.values = [evt.values[0], evt.values[1]];        
          this.emit("change", lang.clone(this.colorStops));
        }));

        //Sync _slider handle label updates
        this._slider.on("handle-value-change", lang.hitch(this, function(evt){
          this._updateRendererSlider();
        }));
        
        this._slider.on("data-value-change", lang.hitch(this, function(evt){
          this._updateRendererSlider();   
        }));
        
        this._slider.on("stop",  lang.hitch(this, function(evt){
          this.emit("handle-value-change", lang.clone(this.colorStops));
        }));        

        this.watch("colorStops", this._updateTimeout);        
      },
      
      _createSVGSurfaces: function(){
 
        this._colorRampSurface = gfx.createSurface(this._rampNode, this.rampWidth, this._sliderHeight);
        
        // Create Ramp Bar Border
        this._rect = this._colorRampSurface.createRect(this._colorRampSurface.getDimensions()).setStroke("#888");
        
        // Fill the Ramp Bar
        this._fillRamp();
        
      },
      
      // Purpose:
      // -- Timeout handler for consecutive property updates
      // Notes:
      // -- Requires valid histogram property
      // -- _updateRendererSlider() callback
      _updateTimeout: function(){
        var self = this;
        
        clearTimeout(this._updateTimer);
        
        this._updateTimer = setTimeout(function() {
          var that = self;
          self = null;
          
          clearTimeout(that._updateTimer);
          that._updateRendererSlider();
        }, 0);
      },
      
      
      // Purpose:
      // -- Callback for _updateTimeout()
      _updateRendererSlider: function(){
      
        this.values = [ this.colorStops[3].ratio, this.colorStops[15].ratio];
        this._slider.set("values", this.values);
        
        this._slider._reset();
        this._slider._updateRoundedLabels();        
        this._slider._generateMoveables();
        this._clearRect();
        this._createSVGSurfaces();
        
      },
      
      _clearRect: function(){
        this._colorRampSurface.destroy();
      },
      
      destroy: function(){
        this.inherited(arguments); 
        this._slider.destroy();
      },
      
      //update colorStops based on min and max ratio when slide
      _updateColorStops: function(minRatio, maxRatio){
        array.forEach(this.colorStops, lang.hitch(this, function(colorStop, index){
          if (index > 2) { //exclude first 3 colorStops from being updated
            colorStop.ratio = minRatio + (maxRatio - minRatio) * ( (index - 3) / 12 );
            
            // Issue #1465
            if(index === 3 && colorStop.ratio < this.colorStops[2].ratio){
              colorStop.ratio =  this.colorStops[2].ratio;
            }
            
          }
        }));
      },
      
      //draw color ramp
      _fillRamp: function(){
        var allStops = this.colorStops.slice(0);
        array.forEach(allStops, function(stop){
          stop.offset = 1 - stop.ratio;
        });
        allStops.reverse();

        this._rect.setFill({
          "type": "linear",
          "x1" : 0, 
          "y1" : 0,
          "x2" : 0, 
          "y2" : 200 / (1 - 0.01),
          "colors" : allStops
        });
      }      
    });

    
    
    return HeatmapSlider;
  });
