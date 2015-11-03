define([
    "../kernel",
    "../renderers/support/utils",
    
    "dijit/_OnDijitClickMixin",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetBase",
    "dijit/Tooltip",
    
    "./RendererSlider",
      
    "dojo/_base/array",
    "../core/declare",
    "dojo/_base/lang",
    "dojo/i18n!../nls/jsapi",
    
    "dojo/dom-geometry",
    "dojo/dom-style",
    "dojo/Evented",
    "dojo/has",
    "dojo/number",
    "dojo/string",    

    "dojox/gfx",
    
    "dojo/text!./ColorInfoSlider/templates/ColorInfoSlider.html"
  ],
  function (
    esriKernel, esriRendererUtils, 
    _OnDijitClickMixin, _TemplatedMixin, _WidgetBase, Tooltip,
    RendererSlider,
    array, declare, lang, i18n,
    domGeo, domStyle, Evented, has, dojoNumber, dojoString,
    gfx,
    template
  ) {

    var ColorInfoSlider = declare("esri.widgets.ColorInfoSlider", [_WidgetBase, _TemplatedMixin, _OnDijitClickMixin, Evented], {
      
      // Dom Node Properties
      baseClass: "esriColorInfoSlider",
      basePath: require.toUrl("esri/widgets/ColorInfoSlider/"),
      templateString: template,
      domNode: null,
      containerNode: null,
      
      // Data Properties
      colorInfo: null,
      minValue: null,
      maxValue: null,
      histogram: null,
      statistics: null,
       
      handles: null,
      primaryHandle: null,
      
      _histogramWidthDefault: 100,
      _rampWidthDefault: 25,
      
      showLabels: null,
      showTicks: null,
      showHandles: null,
      
      showHistogram: true,
      showStatistics: true,
      
      _rampNode: null,
      _sliderHeight: null,
      _colorRampSurface: null,
      _histogramSurface: null,
      _rect: null,
      _barsGroup: null,
      
      _updateTimer: null,
      
      showTransparentBackground: false,
      _transparentBackgroundNode: null,
      
      classificationMethod: null,
      normalizationType: null,      
      
      zoomOptions: {},
      
      constructor: function (options, srcNodeRef) {
      
        this.inherited(arguments);
        
        if(!srcNodeRef){
          return;
        }

        // Parent Nodes
        this.domNode = srcNodeRef;
        this.containerNode = this._containerNode;
        
        // Histogram & Statistics
        this.histogram = options.histogram || false;
        this.statistics = options.statistics || false;
        
        this.zoomOptions = options.zoomOptions || null;
        this.colorInfo =  lang.clone(options.colorInfo) || null;
        
        // Width Defaults 
        this.histogramWidth = options.histogramWidth || this._histogramWidthDefault;
        this.rampWidth = options.rampWidth || this._rampWidthDefault;
        
        // Widget Options
        this.handles = options.handles || [];
        this.primaryHandle = options.primaryHandle || null;
        
        this.showLabels = options.showLabels || true;
        this.showTicks = options.showTicks || true;
        this.showHandles = options.showHandles || true;
        
        if(this.statistics){
          this.minValue = this.statistics.min || 0;
          this.maxValue = this.statistics.max || 100;
        }else{
          // Defaults
          this.minValue = 0;
          this.maxValue = 100;
        }
        
        // Override
        if(options.minValue !== undefined){
          this.minValue = options.minValue;
        }
       
        // Override
        if(options.maxValue !== undefined){
           this.maxValue = options.maxValue;
        }
        
        this.showTransparentBackground = options.showTransparentBackground || false;
        
        if(this.zoomOptions !== null){
          this.toggleSliderBottom = this.zoomOptions.minSliderValue > this.minValue;
          this.toggleSliderTop = this.zoomOptions.maxSliderValue < this.maxValue;
        }

      },
      
      postCreate: function(){
      
        this.inherited(arguments);

        // Make sure all color values are not the same..
        if(this.colorInfo.stops[0].value === this.colorInfo.stops[this.colorInfo.stops.length - 1].value && this.colorInfo.stops[0].value !== 0){
          // If not...
          this.minValue = 0;
          this.maxValue = this.colorInfo.stops[0].value * 2;
          this.colorInfo.stops[0].value = this.maxValue / 5;
          this.colorInfo.stops[this.colorInfo.stops.length - 1].value = (this.maxValue  / 5 * 4);
        }    

        if(this.minValue === this.maxValue){
          if(this.minValue === 0){
              this.maxValue = 100;
            }else if(this.minValue === null){
              this.maxValue = 100;
              this.minValue = 0;
            }else{
              this.maxValue = this.minValue * 2;
              this.minValue = 0;
            }
        }
        
        this.values = this._generateHandleValues(lang.clone(this.colorInfo.stops));   

      },
      
      startup: function (){

        this.inherited(arguments);
        
        // Create the Base Slider
        this._slider = new RendererSlider({
          type: "ColorInfoSlider",
          values: this.values,
          minLabel: (this.zoomOptions) ?  this.minValue : null,
          maxLabel: (this.zoomOptions) ? this.maxValue : null,          
          minimum: (this.zoomOptions) ? this.zoomOptions.minSliderValue : this.minValue,
          maximum: (this.zoomOptions) ? this.zoomOptions.maxSliderValue : this.maxValue,
          _isZoomed: (this.zoomOptions) ? true : false,
          showLabels: this.showLabels,
          showTicks: this.showTicks,
          showHandles: this.showHandles,
          handles: this.handles,
          primaryHandle: this.primaryHandle
        }, this._sliderNode);
        
        this._slider.startup();

        // Prepare Nodes for content
        this._rampNode = this._slider._sliderAreaRight;
        this._sliderHeight = domStyle.get(this._rampNode, "height") || 155;
        
        // Fill the Ramp Bar        
        this._valuesAutoAdjust();         
        this._createSVGSurfaces();
      
        // Slide Event
        this._slider.on("slide", lang.hitch(this, function(){
          this._valuesAutoAdjust();
          this._fillRamp();
        })); 
        
        // Sync _slider with ColorInfoSlider instance
         this._slider.on("change", lang.hitch(this, function(evt){
          // Update Local Reference
          this.values = evt.values;
          this._updateColorInfo(evt.values);
          // Bubble Event
          this.emit("change", lang.clone(this.colorInfo));
        }));
        
        //Sync _slider handle label updates
        this._slider.on("handle-value-change", lang.hitch(this, function(evt){
          this.values = evt.values;
          this._updateColorInfo(evt.values);
          this._valuesAutoAdjust();
          this._fillRamp();
          this.emit("handle-value-change", lang.clone(this.colorInfo));
        }));
        
        this._slider.on("data-value-change", lang.hitch(this, function(evt){
          this.minValue = evt.min;
          this.maxValue = evt.max;
          this._updateRendererSlider();
          this.emit("data-value-change", { "minValue": this.minValue, "maxValue": this.maxValue, "colorInfo": lang.clone(this.colorInfo)});
        }));
        
        this._slider.on("stop",  lang.hitch(this, function(evt){
          this.emit("handle-value-change", lang.clone(this.colorInfo));
        }));
        
        // Optional Histogram + Statistics Properties
        if(this.statistics && this.showStatistics){ this._generateStatistics(); } 
        if(this.showHistogram && (this.histogram || (this.zoomOptions && this.zoomOptions.histogram))){ 
          this._generateHistogram(); 
        }

        // Watch Own Updates
        this.watch("colorInfo", this._updateTimeout);
        
        this.watch("handles", this._updateTimeout);
        this.watch("primaryHandle", this._updateTimeout);

        this.watch("statistics", this._updateTimeout);
        this.watch("histogram", this._updateTimeout);
        this.watch("zoomOptions", this._updateTimeout);   
        
        this.watch("showHistogram", this._toggleHistogram);
        this.watch("showTransparentBackground", this._toggleTransparentBackground);
        this.watch("showHandles", this._updateTimeout);
        this.watch("showLabels", this._updateTimeout);
        this.watch("showTicks", this._updateTimeout);

      },
      
      _clearRect: function(){
        this._colorRampSurface.destroy();
        this._histogramSurface.destroy();
      },
      
      _createSVGSurfaces: function(){
 
        this._colorRampSurface = gfx.createSurface(this._rampNode, this.rampWidth, this._sliderHeight);
        this._histogramSurface = gfx.createSurface(this._rampNode, this.histogramWidth, this._sliderHeight);
        domStyle.set(this._histogramSurface.rawNode, {
          "overflow":"visible",
          "display": "inline-block",
          "left": this.rampWidth + "px"
        });
        
        // Show typical 'checker-board' background to indicate transparency 
        // -- Important to do this before _fillRamp() function
        this._transparentBackgroundNode = this._generateTransparentBackground();

        // Create Ramp Bar Border
        this._rect = this._colorRampSurface.createRect(this._colorRampSurface.getDimensions());
        // Use CSS for border (not SVG)
        domStyle.set(this._colorRampSurface.rawNode, "border", "1px solid #888");
        
        // Fill the Ramp Bar
        this._fillRamp();
        
        //create breaks on ramp if focus
        if (this.zoomOptions !== null) {
          if (this.toggleSliderBottom && this.toggleSliderTop) {
            this._colorRampSurface.createPath("M0,1 L6.25,-1 L12.5,1 L18.75,-1 L25,1").setStroke({ color: "#fff", width: 3 }).setTransform(gfx.matrix.translate(0, 5));
            this._colorRampSurface.createPath("M0,1 L6.25,-1 L12.5,1 L18.75,-1 L25,1").setStroke({ color: "#fff", width: 3 }).setTransform(gfx.matrix.translate(0, 195));
          } else if (this.toggleSliderBottom) {
            this._colorRampSurface.createPath("M0,1 L6.25,-1 L12.5,1 L18.75,-1 L25,1").setStroke({ color: "#fff", width: 3 }).setTransform(gfx.matrix.translate(0, 195));
          } else if (this.toggleSliderTop) {
            this._colorRampSurface.createPath("M0,1 L6.25,-1 L12.5,1 L18.75,-1 L25,1").setStroke({ color: "#fff", width: 3 }).setTransform(gfx.matrix.translate(0, 5));
          }
        }
        
      },
      
      // Purpose:
      // -- Handles generation/destruction of the histogram
      _showHistogram: function(){
        if(this.histogram || (this.zoomOptions && this.zoomOptions.histogram)){
          this._generateHistogram(); 
        }else if(this._barsGroup){
          this._barsGroup.destroy();
          this._barsGroup = null;
        }
      },
      
      // Purpose:
      // -- Toggles the histogram's DOM Node
      _toggleHistogram: function(evt){
        if(this.showHistogram){
          domStyle.set(this._barsGroup.rawNode, "display", "inline-block");
          this._showHistogram();          
        }else{
          domStyle.set(this._barsGroup.rawNode, "display", "none");
        }

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
        
        if(this.zoomOptions !== null){
          this.toggleSliderBottom = this.zoomOptions.minSliderValue > this.minValue;
          this.toggleSliderTop = this.zoomOptions.maxSliderValue < this.maxValue;
          this._slider.set("minimum", this.zoomOptions.minSliderValue);
          this._slider.set("maximum", this.zoomOptions.maxSliderValue);
          this._slider.set("_isZoomed", true);    
          this._slider.set("maxLabel", this.maxValue);
          this._slider.set("minLabel",  this.minValue);
        }else{
          this._slider.set("minimum", this.minValue);
          this._slider.set("maximum", this.maxValue);
          this._slider.set("_isZoomed", false); 
          this._slider.set("maxLabel", null);
          this._slider.set("minLabel",  null);       
        }
        
        // Update Values
        this.values = this._generateHandleValues(lang.clone(this.colorInfo.stops));
        this._slider.set("values", this.values);
        this._slider.set("handles", this.handles);
        this._slider.set("primaryHandle", this.primaryHandle);
        
        this._slider._reset();
        this._slider._updateRoundedLabels();        
        this._slider._generateMoveables();

        this._clearRect();
        this._createSVGSurfaces();
        
        if(this.statistics && this.showStatistics){ this._generateStatistics(); } 
        if(this.showHistogram && (this.histogram || (this.zoomOptions && this.zoomOptions.histogram))){ 
          this._generateHistogram(); 
        }
       
      },
      
      _getPrecision: function(){
        return (Math.floor(Math.log(this.maxValue) / Math.log(10)) < 2) ? (2 - Math.floor(Math.log(this.maxValue) / Math.log(10))) : 0;
      },

      // Purpose:
      // -- Create the Histogram
      // Notes:
      // -- Requires valid histogram property
      _generateHistogram: function(){
      
        var histogram = (this.zoomOptions && this.zoomOptions.histogram) ? this.zoomOptions.histogram : this.histogram;
        
        var width;
        
        // Create the Container
        this._barsGroup = this._histogramSurface.createGroup();
        
        // Get bins, create array for loop
        var counts = array.map(histogram.bins, function(bin){ 
          return (typeof bin === "object") ? bin.count : bin;
        });
        
        // Ask Jerome why this is needed
        counts.reverse();

        // Calculate bar height based on total number of bars
        var barHeight = this._histogramSurface.getDimensions().height / counts.length;
        
        // Generate the Bars
        array.forEach(counts, lang.hitch(this, function(count, i){
          width = (count > 0) ? this.histogramWidth * (count / Math.max.apply(Math, counts)) : 0;
          this._barsGroup.createRect({
            "width": width,
            "height": barHeight
          }).setStroke("#c0c0c0").setFill("#aaa").setTransform(gfx.matrix.translate(0, barHeight * i));
        }));
        
        // Update the Histogram UX
        domStyle.set(this._histogramSurface.rawNode, {
          "display": "inline-block",
          "left": this.rampWidth + "px"
        });

        if(!domGeo.isBodyLtr()){
          //this._barsGroup.setTransform(gfx.matrix.flipX);
          this._barsGroup.setTransform({dx: this.histogramWidth, dy: 0, xx: -1, xy: 0, yx: 0, yy: 1});
        }

      },
      
      // Purpose:
      // -- 
      // Params:
      // -- 
      // Returns:
      // --
      // Notes:
      // -- 
      _generateStatistics: function(){
      
        var stats = this.statistics;
        
        if(stats.count < 2){
          return;
        }
        
        var slider = this._slider;
        var zoomOptions = this.zoomOptions || null;
        var localMin, localMax;
        
        if(stats.min === stats.max && stats.min ===  stats.avg){
          localMin = 0;
          localMax = stats.avg * 2;
        }else{
          localMin = stats.min;
          localMax = stats.max;
        }
        
        if(localMin !== slider.minimum || localMax  !== slider.maximum){
          localMin = slider.minimum;
          localMax = slider.maximum;
        }        

        if(zoomOptions){
          localMin = zoomOptions.minSliderValue;
          localMax = zoomOptions.maxSliderValue;
        }
        
        var showValues = [{ "value": stats.avg, "label": "average"}];
        // Filter Outliers
        showValues = array.filter(showValues, function(value){ 
          return (value.value >= localMin && value.value <= localMax);
        });
        
        // Create each line and label
        array.forEach(showValues, lang.hitch(this, function(value){
        
          // Calculate y-axis position of the stats indicators
          var yAxisAlignment = this._sliderHeight * (localMax - value.value) / (localMax - localMin);

          // Create Line(s)
          // -- moveToBack() so line is behind histogram
          this._avgHandleLine = this._histogramSurface.createLine({ 
            //start
            "x1": 0, 
            "y1": yAxisAlignment, 
            // end
            "x2": this.histogramWidth, 
            "y2": yAxisAlignment 
          }).setStroke("#c0c0c0").moveToBack();
          
          this._avgHandleImage = this._histogramSurface.createImage({
            "x" : (domGeo.isBodyLtr()) ? this.histogramWidth + 2 : 0,
            "y" : yAxisAlignment -8, 
            "width" : 12, 
            "height" : 14, 
            "src" : this.basePath + "images/xAvg.png"
          });
          
          var formattedLabel = dojoString.substitute(i18n.widgets.rendererSlider.statsAvg, {avg : dojoNumber.format(stats.avg, { places: this._getPrecision()})});
          this._avgHandleTooltip = new Tooltip({
            connectId: [this._avgHandleImage.rawNode],
            label: formattedLabel
          });
          
        }));

      },
      
      // Purpose:
      // -- Creates Transparency Layer on the Ramp
      _generateTransparentBackground: function(){
        var node = this._colorRampSurface.createRect({ 
          width: this.rampWidth, 
          height: this._sliderHeight 
        }).setFill( (this.showTransparentBackground) ? this._getTransparentFill() : null);
        node.moveToBack();
        return node;

      },
      
      // Purpose: 
      // -- Handles generation/destruction of optional transparent background
      _toggleTransparentBackground: function(){
        if(this.showTransparentBackground){
          this._transparentBackgroundNode.setFill(this._getTransparentFill());
        }else{
          this._transparentBackgroundNode.setFill(null);
        }
      },
      
      // Purpose:
      // -- Generates fill for _transparentBackgroundNode
      // Returns:
      // -- Object (.setFill())
      _getTransparentFill: function(){
        return {
          type: "pattern", 
          x: 0,  
          y: 0,  
          width: 16, 
          height: 16,
          src: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZlcnNpb249IjEuMSIgaGVpZ2h0PSIxNiIgd2lkdGg9IjE2Ij48cGF0aCBkPSJNMCAwIEw4IDAgTDggOCBMMCA4IFoiIGZpbGw9IiNjY2MiIC8+PHBhdGggZD0iTTAgMCBMOCAwIEw4IDggTDAgOCBaIiBmaWxsPSIjZmZmIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwLDgpIiAvPjxwYXRoIGQ9Ik0wIDAgTDggMCBMOCA4IEwwIDggWiIgZmlsbD0iI2NjYyIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoOCw4KSIgLz48cGF0aCBkPSJNMCAwIEw4IDAgTDggOCBMMCA4IFoiIGZpbGw9IiNmZmYiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDgsMCkiIC8+PC9zdmc+"
        };
      },
      
      _updateColorInfo: function (newValues){
        
        // Update the stop values
        array.forEach(this.colorInfo.stops, lang.hitch(this, function(stop, idx){
          stop.value = newValues[idx].value;
        })); 

        // Update the Labels (only works if labels are not already null)
        esriRendererUtils.updateColorStops({
          stops: this.colorInfo.stops, 
          changes: newValues
        });
        
      },
      
      _generateHandleValues: function(stops){
        
        var newValues = [];
        
        array.forEach(stops, lang.hitch(this, function(stop, idx){
          
          // Check if stop is hidden (no handle)
          if (array.indexOf(this.handles, idx) === -1 && idx !== this.primaryHandle) { 
            stop.hidden = true; 
          }
          
          // Check if stop is primary handle
          if(idx === this.primaryHandle){ 
            stop.primaryHandle = true; 
          }
          
          // Save updated stop
          newValues.push(stop);
        
        }));
        
        return newValues;
        
      },

      // Purpose:
      // -- 
      // Params:
      // -- 
      // Notes:
      // -- Taken from Jerome's InteractiveColorRamp.js
      _valuesAutoAdjust: function(){

        var values = this._slider.values;
        var lowerIndex, upperIndex, range, lowerValue, upperValue, h, j; 
        
        var showValues = [];
        array.forEach(values, function(value, i) {
          if (!value.hidden) {
            showValues.push(i);
          }
        });
        
        for (h=0; h<showValues.length-1; h++) {
        
          lowerIndex = showValues[h];
          upperIndex = showValues[h+1];
          range = upperIndex - lowerIndex;
          lowerValue = values[lowerIndex].value;
          upperValue = values[upperIndex].value;

          for (j=lowerIndex+1; j<upperIndex; j++) {
            values[j].value = lowerValue*(upperIndex-j)/range + upperValue*(j-lowerIndex)/range;
          }
          
        }
      },
      
      // Purpose:
      // -- 
      // Params:
      // -- 
      // Notes:
      // -- 
      _fillRamp: function(){
      
        var stops = this._slider.values;
        var min = this._slider.minimum;
        var max = this._slider.maximum;
        var allStops = stops.slice(0);
        
        // offset property is required for the Histogram? TODO
        array.forEach(allStops, function(stop){
          stop.offset = (max - stop.value)/(max - min);
        });
        
        allStops.reverse();    
        
        if (this.zoomOptions !== null) {
          if (this.toggleSliderBottom && this.toggleSliderTop) {
            this._rect.setFill({
              "type": "linear",
              "x1" : 0, 
              "y1" : 10,
              "x2" : 0, 
              "y2" : 190,
              "colors" : allStops
            });
          } else if (this.toggleSliderBottom) {
            this._rect.setFill({
              "type": "linear",
              "x1" : 0, 
              "y1" : 0,
              "x2" : 0, 
              "y2" : 180,
              "colors" : allStops
            });
          } else if (this.toggleSliderTop) {
            this._rect.setFill({
              "type": "linear",
              "x1" : 0, 
              "y1" : 20,
              "x2" : 0, 
              "y2" : 200,
              "colors" : allStops
            });
          }
        } else {
          this._rect.setFill({
            "type": "linear",
            "x1" : 0, 
            "y1" : 0,
            "x2" : 0, 
            "y2" : 200,
            "colors" : allStops
          });
        }
        
      },
      
      destroy: function(){
        this.inherited(arguments); 
        this._slider.destroy();
        if(this._avgHandleTooltip){
          this._avgHandleTooltip.destroy();
        }
      }
      
    });

    
    
    return ColorInfoSlider;
  });
