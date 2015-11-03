define([
    "dijit/_OnDijitClickMixin",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetBase",
    "dijit/Tooltip",
    
    "./RendererSlider",
    "../Color",
      
    "dojo/_base/array",
    "../core/declare",
    "dojo/_base/lang",
    "dojo/i18n!../nls/jsapi",
    
    "dojo/dom-geometry",
    "dojo/dom-style",
    "dojo/Evented",
    "dojo/number",
    "dojo/string",    
    
    "dojo/dom-construct",
    "dojo/dom-class",
    "dojox/gfx",
    "dojo/text!./SizeInfoSlider/templates/SizeInfoSlider.html",

    "require"
  ],
  function (
    _OnDijitClickMixin, _TemplatedMixin, _WidgetBase, Tooltip,
    RendererSlider, Color,
    array, declare, lang, i18n,
    domGeo, domStyle, Evented, dojoNumber, dojoString,
    domConstruct,domClass, gfx, template,
    require
  ) {

    var SizeInfoSlider = declare("esri.widgets.SizeInfoSlider", [_WidgetBase, _TemplatedMixin, _OnDijitClickMixin, Evented], {
      
      // Dom Node Properties
      baseClass: "esriSizeInfoSlider",
      templateString: template,
      domNode: null,
      containerNode: null,
      
      // Data Properties
      values: null,
      
      minValue: null,
      maxValue: null,
      
      minSize: null,
      maxSize: null,
      
      histogram: null,
      statistics: null,
      showHistogram: true,
      showStatistics: true,
      
      _histogramWidthDefault: 100,
      _rampWidthDefault: 25,
      _symbolWidthDefault: 50,
      
      showLabels: null,
      showTicks: null,
      showHandles: null,

      _rampNode: null,
      _sliderHeight: null,
      _barsGroup: null,
      _updateTimer: null,
      
      zoomOptions: {},
      
      constructor: function (options, srcNodeRef) {
      
        this.inherited(arguments);

        if(!srcNodeRef){
          return;
        }

        // Parent Nodes
        this.domNode = srcNodeRef;
        this.containerNode = this._containerNode;
        
        //this.values = options.values;
        this.symbol = options.symbol;
        this.statistics = options.statistics || false;
        this.histogram = options.histogram || false;
        this.zoomOptions = options.zoomOptions || null;
        
        this.sizeInfo = options.sizeInfo;
        this.minSize = this.sizeInfo.minSize;
        this.maxSize = this.sizeInfo.maxSize;

        // Width Defaults 
        this.histogramWidth = options.histogramWidth || this._histogramWidthDefault;
        this.symbolWidth = options.symbolWidth || this._symbolWidthDefault;        
        this.rampWidth = options.rampWidth || this._rampWidthDefault;
        
        // Widget Options
        this.showLabels = options.showLabels || true;
        this.showTicks = options.showTicks || true;
        this.showHandles = options.showHandles || true;
        
        
        if(this.statistics){
          this.minValue = this.statistics.min;
          this.maxValue = this.statistics.max;
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
        
        if(this.zoomOptions !== null){
          this.toggleSliderBottom = this.zoomOptions.minSliderValue > this.minValue;
          this.toggleSliderTop = this.zoomOptions.maxSliderValue < this.maxValue;
        }
        
      },
      
      postCreate: function(){
        
        this.inherited(arguments);
        
        // Null
        if(this.sizeInfo.minDataValue === null && this.sizeInfo.maxDataValue === null || this.sizeInfo.minDataValue === 0 && this.sizeInfo.maxDataValue === 0){
          
          // Defaults
          if(this.minValue === null && this.maxValue === null){
            this.minValue = 0;
            this.maxValue = 100;
            this.values = [20, 80];          
          }

        }else{
        
          // 1 Feature
          if(this.minValue === this.maxValue){
            if(this.minValue === 0){
              this.maxValue = 100;
              this.values = [20, 80];
            }else if(this.minValue === null){
              this.minValue = 0;
              this.maxValue = 100;
              this.values = [20, 80];
            }else{
              this.maxValue = this.minValue * 2;
              this.minValue = 0;
              this.values = [(this.maxValue /5), (this.maxValue / 5 * 4)];
            }
          }else{
            // Expected Behaviour
            this.values = [this.sizeInfo.minDataValue, this.sizeInfo.maxDataValue];
          }
        }
        
        // Fallback
        if(this.minValue === null){
          this.minValue = 0;
        }
        
        if(this.maxValue === null){
          this.maxValue = 100;
        }        

      },
      
      startup: function (){
      
        this.inherited(arguments);
        
        // Create the Base Slider
        this._slider = new RendererSlider({
          type: "SizeInfoSlider",
          values: this.values,
          minLabel: (this.zoomOptions) ? this.minValue : null,
          maxLabel: (this.zoomOptions) ?  this.maxValue : null,
          minimum: (this.zoomOptions) ? this.zoomOptions.minSliderValue : this.minValue,
          maximum: (this.zoomOptions) ? this.zoomOptions.maxSliderValue : this.maxValue,
          _isZoomed: (this.zoomOptions) ? true : false,
          showLabels: this.showLabels,
          showTicks: this.showTicks,
          showHandles: this.showHandles          
        }, this._sliderNode);
        
        this._slider.startup();        
        
        // Prepare Nodes for content
        this._rampNode = this._slider._sliderAreaRight;
        this._sliderHeight = domStyle.get(this._rampNode, "height") || 155;
        
        // Fill the Ramp Bar             
        this._createSVGSurfaces();
        
        // Slide Event
        this._slider.on("slide", lang.hitch(this, function(evt){
          this._fillRamp(evt.values);
        }));
        
        // Sync _slider with SizeInfoSlider instance
        this._slider.on("change", lang.hitch(this, function(evt){    
          this.sizeInfo.minDataValue = evt.values[0];
          this.sizeInfo.maxDataValue = evt.values[1];
          this.values = [this.sizeInfo.minDataValue, this.sizeInfo.maxDataValue];             
          this.emit("change", lang.clone(this.sizeInfo));
        }));
        
        //Sync _slider handle label updates
        this._slider.on("handle-value-change", lang.hitch(this, function(evt){
          this.values = evt.values;
          this.sizeInfo.minDataValue = evt.values[0];
          this.sizeInfo.maxDataValue = evt.values[1];
          this._updateRendererSlider();
          this.emit("handle-value-change", lang.clone(this.sizeInfo));  
        }));
        
        this._slider.on("data-value-change", lang.hitch(this, function(evt){
          this.minValue = evt.min;
          this.maxValue = evt.max;
          this._updateRendererSlider();
          this.emit("data-value-change", {"minValue": evt.min, "maxValue" : evt.max, "sizeInfo": lang.clone(this.sizeInfo)});          
        }));
        
        this._slider.on("stop",  lang.hitch(this, function(){       
          this.emit("handle-value-change", lang.clone(this.sizeInfo));
        }));
        
        if(this.statistics && this.showStatistics){ this._generateStatistics(); } 
        if(this.showHistogram && (this.histogram || (this.zoomOptions && this.zoomOptions.histogram))){ 
          this._generateHistogram(); 
        }
        
        // Watch Own Updates
        this.watch("minValue", this._updateTimeout);
        this.watch("maxValue", this._updateTimeout);
        this.watch("symbol", this._updateTimeout);
        this.watch("sizeInfo", this._updateTimeout);
        this.watch("minSize", this._updateTimeout);
        this.watch("maxSize", this._updateTimeout);
        
        this.watch("statistics", this._updateTimeout);
        this.watch("histogram", this._updateTimeout);
        this.watch("showHistogram", this._toggleHistogram);
        
        this.watch("zoomOptions", this._updateTimeout);
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
      _toggleHistogram: function(){
        if(this.showHistogram){
          //domStyle.set(this._histogramSurface.rawNode, "display", "inline-block");
          domStyle.set(this._barsGroup.rawNode, "display", "inline-block");
          this._showHistogram();
        }else{
          //domStyle.set(this._histogramSurface.rawNode, "display", "none");
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
      
        // Required to update point symbol on slider
        this.minSize = this.sizeInfo.minSize;
        this.maxSize = this.sizeInfo.maxSize;
        this.values = [this.sizeInfo.minDataValue, this.sizeInfo.maxDataValue];
        
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
        
        this._slider.set("values", this.values);
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
        var barHeight = this._sliderHeight / counts.length;
        
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
      _attachSymbols: function() {
        this._attachSymbol(this._slider.moveables[0], this.minSize, "min");
        this._attachSymbol(this._slider.moveables[1], this.maxSize, "max");
      },
      
      // Purpose:
      // -- 
      // Params:
      // -- 
      // Returns:
      // --
      // Notes:
      // -- 
      _attachSymbol: function(node, value){
      
        if (!node._symbol) {
          node._symbol = domConstruct.create("div", { style: "position: absolute; left: 10px;"}, node);
        }

        var handlerHeight = domStyle.get(node._handler, "height");
        var nodeSymbol = node._symbol;
        var symbol = this.symbol;
        
        switch(symbol.type) {
          case "simplelinesymbol":
            value = (value === this.minSize) ? 5 : 13;
            this._generateLineSymbol(node, value, handlerHeight);
            break;
          case "simplemarkersymbol":
            value = (value === this.minSize) ? 12 : 48;
            this._generateCircleSymbol(nodeSymbol, value, handlerHeight);
            break;
        }

        return nodeSymbol;
      },
      
      // Purpose:
      // -- 
      // Params:
      // -- 
      // Notes:
      // -- 
      _generateLineSymbol: function(node, value, handlerHeight){

        var nodeTick = node._tick;        
        domClass.add(nodeTick, "handlerTickSize");
        
        var nodeSymbol = node._symbol;
        domStyle.set(nodeSymbol, "top", (handlerHeight / 2 ) - value + "px");
        domStyle.set(nodeSymbol, "height", value * 2 + "px");
        domStyle.set(nodeSymbol, "width", (value - 4) + "px");
        nodeSymbol.innerHTML = "";
        
        // Create the Line
        var svg = gfx.createSurface(nodeSymbol);
        svg.rawNode.style.position = "absolute";
        svg.rawNode.style.top = (value === 1) ? "1px" : (value / 2) + "px";        
          
        if(!domGeo.isBodyLtr()){
          svg.rawNode.style.left = "-45px";
        }

        svg.setDimensions(this.rampWidth, value);
        
        svg.createRect({
          width: this.rampWidth,
          height: value
        }).setFill(new Color([0, 121, 193, 0.8]));
        
          
        return svg;
      
      },
      
      // Purpose:
      // -- 
      // Params:
      // -- 
      // Notes:
      // -- 
      _generateCircleSymbol: function(nodeSymbol, value, handlerHeight){
        // -- Old Implementation
        var radius = value / 2;
        var symbolStrokeWidth = 1;
        
        domStyle.set(nodeSymbol, "top", handlerHeight / 2 - (radius + symbolStrokeWidth) + "px");
        domStyle.set(nodeSymbol, "height", (radius + symbolStrokeWidth) * 2 + "px");
        domStyle.set(nodeSymbol, "width", radius + "px");
        
        nodeSymbol.innerHTML = "";
        
        var svg = gfx.createSurface(nodeSymbol);
        svg.rawNode.style.position = "absolute";
        
        if(!domGeo.isBodyLtr()){
          svg.rawNode.style.left = "-45px";
        }     
        
        svg.setDimensions((radius + symbolStrokeWidth), (radius + symbolStrokeWidth)*2);
        svg.createCircle({ cx: 0, cy: (radius + symbolStrokeWidth), r: radius }).setFill(new Color([0, 121, 193, 0.8])).setStroke("#fff");

        return svg;
      
      },

      // Purpose:
      // -- 
      // Params:
      // -- 
      // Notes:
      // -- 
      _fillRamp: function(values){
      
        var slider = this._slider;
        var height = this._sliderHeight;
        var value0 = values ? values[0] : slider.values[0];
        var value1 = values ? values[1] : slider.values[1];

        var pt0 = Math.round(height - ((value0 - slider.minimum) / (slider.maximum - slider.minimum) * height));
        var pt1 = Math.round(height - ((value1 - slider.minimum) / (slider.maximum - slider.minimum) * height));
        
        var minWidth = 5;
        var maxWidth = this.rampWidth;

        this._proportionalSymbolSurface.clear();
        this._proportionalSymbolSurface.createPath()
          .moveTo(maxWidth, 0)
          .lineTo(maxWidth, pt1)
          .lineTo(minWidth, pt0)
          .lineTo(minWidth, height)
          .lineTo(0, height)
          .lineTo(0, 0)
          .closePath()
          .setFill("#9a9a9a");
        domStyle.set(this._proportionalSymbolSurface.rawNode, "overflow", "visible");
        domStyle.set(this._proportionalSymbolSurface.rawNode, "background-color", "#d9d9d9");
        
        if (this.zoomOptions !== null) {
          if (this.toggleSliderBottom && this.toggleSliderTop) {
            this._proportionalSymbolSurface.createPath("M0,1 L6.25,-1 L12.5,1 L18.75,-1 L25,1").setStroke({ color: "#fff", width: 3 }).setTransform(gfx.matrix.translate(0, 5));
            this._proportionalSymbolSurface.createPath("M0,1 L6.25,-1 L12.5,1 L18.75,-1 L25,1").setStroke({ color: "#fff", width: 3 }).setTransform(gfx.matrix.translate(0, 195));
          } else if (this.toggleSliderBottom) {
            this._proportionalSymbolSurface.createPath("M0,1 L6.25,-1 L12.5,1 L18.75,-1 L25,1").setStroke({ color: "#fff", width: 3 }).setTransform(gfx.matrix.translate(0, 195));
          } else if (this.toggleSliderTop) {
            this._proportionalSymbolSurface.createPath("M0,1 L6.25,-1 L12.5,1 L18.75,-1 L25,1").setStroke({ color: "#fff", width: 3 }).setTransform(gfx.matrix.translate(0, 5));
          }
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
            "x" : (domGeo.isBodyLtr()) ?this.histogramWidth + 2 : 0,
            "y" : yAxisAlignment -8,
            "width" : 12, 
            "height" : 14, 
            "src" : require.toUrl("./images/xAvg.png")
          });
          var formattedLabel = dojoString.substitute(i18n.widgets.rendererSlider.statsAvg, {avg : dojoNumber.format(stats.avg, { places: this._getPrecision()})});
          this._avgHandleTooltip = new Tooltip({
            connectId: [this._avgHandleImage.rawNode],
            label: formattedLabel
          });
          
        }));

      },
      
      _clearRect: function(){
        this._proportionalSymbolSurface.destroy();
        this._histogramSurface.destroy();
      },
      
      _createSVGSurfaces: function(){
 
        this._proportionalSymbolSurface = gfx.createSurface(this._rampNode, this.rampWidth, this._sliderHeight);
        this._histogramSurface = gfx.createSurface(this._rampNode, this.histogramWidth, this._sliderHeight);
        domStyle.set(this._histogramSurface.rawNode, {
          "overflow":"visible",
          "display": "inline-block",
          "left": this.rampWidth + "px"
        });
        
        // Create Ramp Bar Border
        this._rect = this._proportionalSymbolSurface.createRect(this._proportionalSymbolSurface.getDimensions());//.setStroke("#888");

        // Fill the Ramp Bar
        this._fillRamp();
        this._attachSymbols();
      },
      
      // Purpose:
      // -- 
      // Params:
      // -- 
      // Notes:
      // -- 
      destroy: function(){
        this.inherited(arguments); 
        this._slider.destroy();
        if(this._avgHandleTooltip){
          this._avgHandleTooltip.destroy();
        }
      }
      
    });

    
    
    return SizeInfoSlider;
  });
