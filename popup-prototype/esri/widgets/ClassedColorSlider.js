define([
    "../kernel",
    "../renderers/support/utils",
    
    "dijit/_OnDijitClickMixin",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetBase",
    "dijit/Tooltip",
    "dojo/number",
    "dojo/string",
  
    "./RendererSlider",
      
    "dojo/_base/array",
    "../core/declare",
    "dojo/_base/lang",
    "dojo/i18n!../nls/jsapi",
    
    "dojo/dom-geometry",
    "dojo/dom-style",
    "dojo/Evented",
    "dojo/has",
    "dojox/gfx",
    
    "dojo/text!./ClassedColorSlider/templates/ClassedColorSlider.html"
  ],
  function (
    esriKernel, esriRendererUtils,
    _OnDijitClickMixin, _TemplatedMixin, _WidgetBase,Tooltip, dojoNumber, dojoString,
    RendererSlider,
    array, declare, lang, i18n,
    domGeo, domStyle, Evented, has, gfx,
    template
  ) {

    var ClassedColorSlider = declare("esri.widgets.ClassedColorSlider", [_WidgetBase, _TemplatedMixin, _OnDijitClickMixin, Evented], {
      
      // Dom Node Properties
      baseClass: "esriClassedColorSlider",
      basePath: require.toUrl("esri/widgets/ClassedColorSlider/"),
      templateString: template,
      domNode: null,
      containerNode: null,
      
      // Data Properties
      breakInfos: null,
      histogram: null,

      showHistogram: true,
      showStatistics: true,
      
      handles: null,
      
      _histogramWidthDefault: 100,
      _rampWidthDefault: 25,
      
      showLabels: null,
      showTicks: null,
      showHandles: null,
      
      _rampNode: null,
      _sliderHeight: null,
      _colorRampSurface: null,
      _histogramSurface: null,
      _rect: null,
      _barsGroup: null,
      
      _updateTimer: null,
      
      classificationMethod: null,
      normalizationType: null,
      
      constructor: function (options, srcNodeRef) {
        
        this.inherited(arguments);

        // Required
        if(!srcNodeRef){
          return;
        }

        // Parent Nodes
        this.domNode = srcNodeRef;
        this.containerNode = this._containerNode;
        
        // Layout
        this.histogram = options.histogram || false;
        this.statistics = options.statistics || false;        
        this.histogramWidth = options.histogramWidth || this._histogramWidthDefault;
        this.rampWidth = options.rampWidth || this._rampWidthDefault;
        
        // Handles
        this.handles = options.handles || [];
        
        // ShowX
        this.showLabels = options.showLabels || true;
        this.showTicks = options.showTicks || true;
        this.showHandles = options.showHandles || true;

        // Data
        this.breakInfos = lang.clone(options.breakInfos);
        this.values = this._getHandleInfo(this.breakInfos);
        
        this.classificationMethod = options.classificationMethod || null;
        this.normalizationType = options.normalizationType || null;
        
      },
      
      postCreate: function(){
       
       this.inherited(arguments);
       
        if(this.breakInfos !== null && this.breakInfos.length > 1){
        
          // Expected Behavior
          this.minValue = this.breakInfos[0].minValue;
          this.maxValue = this.breakInfos[this.breakInfos.length-1].maxValue;
          
        }else if (this.breakInfos !== null && this.breakInfos.length === 1){
        
          // 1 Feature UseCase
          this.minValue = this.breakInfos[0].minValue;
          this.maxValue = this.breakInfos[0].maxValue;
          
        }else{
          // Using Defaults
          this.minValue = 0;
          this.maxValue = 100;
          this.breakInfos = [
            {minValue: 0, maxValue: 20},
            {minValue: 20, maxValue: 80},
            {minValue: 80, maxValue: 100}
          ];
          this.values = this._getHandleInfo(this.breakInfos);
          this._updateBreakInfoLabels();
        }

      },

      startup: function (){

        this.inherited(arguments);
        
        // Create the Base Slider
        this._slider = new RendererSlider({
          type: "ClassedColorSlider",
          values: this.values,
          minimum: this.minValue,
          maximum: this.maxValue,
          showLabels: this.showLabels,
          showTicks:  this.showTicks,
          showHandles: this.showHandles,
          classificationMethod: this.classificationMethod,
          normalizationType: this.normalizationType
        }, this._sliderNode);

        this._slider.startup();
        
        // Prepare Nodes for content
        this._rampNode = this._slider._sliderAreaRight;
        this._sliderHeight = domStyle.get(this._rampNode, "height") || 155;

        // Fill the Ramp Bar
        this._createSVGSurfaces();
        
        // Slide Event
        this._slider.on("slide", lang.hitch(this, function(evt){
          this._updateBreakInfos(evt.values);
          this._updateBreakInfoLabels();
          this._fillRamp();
        })); 
        
        // Sync _slider with ClassedColorSlider instance
         this._slider.on("change", lang.hitch(this, function(evt){
          this.values = evt.values;
          this._updateBreakInfos(evt.values);
          this._updateBreakInfoLabels();
          this.emit("change", lang.clone(this.breakInfos));
        }));
        
        //Sync _slider handle label updates
        this._slider.on("handle-value-change", lang.hitch(this, function(evt){
          this._updateBreakInfos(evt.values);
          this._updateBreakInfoLabels();
          this._fillRamp();
          this.emit("handle-value-change", lang.clone(this.breakInfos));
        }));

        this._slider.on("data-value-change", lang.hitch(this, function(evt){
          this.breakInfos[0].minValue = this.minValue = evt.min;
          this.breakInfos[this.breakInfos.length-1].maxValue = this.maxValue = evt.max;
          this._updateBreakInfoLabels();          
          this._updateRendererSlider();
          this.emit("data-value-change", { "minValue": this.minValue, "maxValue": this.maxValue, "breakInfos": lang.clone(this.breakInfos)});
        }));
        
        this._slider.on("stop",  lang.hitch(this, function(evt){
          this.emit("handle-value-change", lang.clone(this.breakInfos));
        }));
        
        if(this.showHistogram && this.histogram){ this._generateHistogram(); }
        if(this.statistics && this.showStatistics){ this._generateStatistics(); } 

        this.watch("breakInfos", this._updateTimeout);
        this.watch("handles", this._updateTimeout);
        
        this.watch("statistics", this._updateTimeout);
        this.watch("histogram", this._showHistogram);
        
        this.watch("showHandles", this._updateTimeout);
        this.watch("showLabels", this._updateTimeout);
        this.watch("showTicks", this._updateTimeout);  
        this.watch("showHistogram", this._toggleHistogram);     
        
      },
      
      _clearRect: function(){
        this._colorRampSurface.destroy();
        this._histogramSurface.destroy();
      },
      
      _createSVGSurfaces: function(){

        this._colorRampSurface = gfx.createSurface(this._rampNode, this.rampWidth, this._sliderHeight);
        this._histogramSurface = gfx.createSurface(this._rampNode, this.histogramWidth, this._sliderHeight);
        domStyle.set(this._histogramSurface.rawNode, {
          "overflow": "visible",
          "display": "inline-block",
          "left": this.rampWidth + "px"
        });
        
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
      
        this._slider.set("values", this._getHandleInfo(this.breakInfos));
        this._slider.set("handles", this.handles);
        this._slider._reset();
        this._slider._updateRoundedLabels();        
        this._slider._generateMoveables();
        
        this._clearRect();
        this._createSVGSurfaces();
        
        if(this.showHistogram && this.histogram){ this._generateHistogram(); }
        if(this.statistics && this.showStatistics){ this._generateStatistics(); } 
        
      },

      // Purpose:
      // -- Creates the 'average' line indicator behind the histogram
      // Notes:
      // -- Assumes _histogramSurface SVG element exists 
      // -- Assumes file 'images/xAvg.png' exists 
      _generateStatistics: function(){
      
        var stats = this.statistics;
        
        if(stats.count < 2){
          return;
        }
        
        var slider = this._slider;
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
          this._avgHandleLine = this._histogramSurface.createLine({ 
            //start
            "x1": 0, 
            "y1": yAxisAlignment, 
            // end
            "x2": this.histogramWidth, 
            "y2": yAxisAlignment 
          }).setStroke("#c0c0c0");
          
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
      
      _getPrecision: function(){
        return (Math.floor(Math.log(this.maxValue) / Math.log(10)) < 2) ? (2 - Math.floor(Math.log(this.maxValue) / Math.log(10))) : 0;
      },
      
      // Purpose:
      // -- Create the Histogram
      // Notes:
      // -- Requires valid histogram property
      _generateHistogram: function(){
        
        var width;
        
        // Create the Container
        this._barsGroup = this._histogramSurface.createGroup();
        
        // Get bins, create array for loop
        var counts = array.map(this.histogram.bins, function(bin){ 
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
      // -- Handles generation/destruction of the histogram
      _showHistogram: function(){
        if(this.histogram){
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
          domStyle.set(this._barsGroup.rawNode, "display", "inline-block");
          this._showHistogram();               
        }else{
          domStyle.set(this._barsGroup.rawNode, "display", "none");
        }
      },
      
      // Purpose:
      // -- Populates stops object array with handle information
      // Params:
      // -- colorInfo.stops[{},...]
      // Returns:
      // -- colorInfo.stops[{},...]
      _getHandleInfo: function(breakInfos){
      
        var values = [], i;
        for (i=0; i<breakInfos.length-1; i++) {
          values.push(breakInfos[i].maxValue);
        }
        return values;
      },
      
      // Purpose:
      // -- Updates minValue and maxValue properties for breakInfos[]
      // Params:
      // -- values property from the 'slide' and 'handle-value-change' events
      // Notes:
      // -- 
      _updateBreakInfos: function(handleValues){
      
        var i, breakInfos = this.breakInfos;
        
        esriRendererUtils.updateClassBreak({
          classBreaks: breakInfos,
          normalizationType: this.normalizationType,
          classificationMethod: this.classificationMethod,
          change: handleValues
        });
        
        for (i=0; i<handleValues.length; i++) {
          breakInfos[i].maxValue = handleValues[i];
          if(breakInfos[i+1]){
            breakInfos[i+1].minValue = handleValues[i];
          }
        }
      },
      
      // Purpose:
      // -- Updates the label property for breakInfos after slider updates
      // Notes:
      // -- Updated to use relative breakInfos reference
      // -- Needed for when slider values are updated in rapid succession
      _updateBreakInfoLabels: function(){
      
        var breakInfos = this.breakInfos;
        var classMethod = this.classificationMethod;
        var normType = this.normalizationType;
        
        esriRendererUtils.setLabelsForClassBreaks ({
          classBreaks: breakInfos,
          normalizationType: normType,
          classificationMethod: classMethod,
          round: true
        });
        
        /*
        var i, infos, breakInfos = this.breakInfos;
        for (i=0; i<breakInfos.length; i++) {
          infos = breakInfos[i];
          infos.label = infos.minValue + " - " + infos.maxValue;
        }
        */
        
      },
      
      // Purpose:
      // -- Fills the ramp
      // Notes:
      // -- 
      _fillRamp: function(){
      
        var breakInfos = this.breakInfos;
        var max = this.maxValue;
        var min = this.minValue;
        var rampColors = [];
        var i;
        
        for (i=0; i<breakInfos.length; i++) {
        
          // Calculate Offset
          // -- Divide by 0 hot-fix for when min and max are the same
          var offsetMax, offsetMin;
          if(max === min){
            offsetMax = offsetMin = 0;
          }else{
            offsetMax = (max - breakInfos[i].minValue) / (max - min);
            offsetMin = (max - breakInfos[i].maxValue) / (max - min);
          }
          
          rampColors.push({ 
            offset: offsetMax,
            color: (breakInfos[i].symbol) ? breakInfos[i].symbol.color : "#5daddd"
          });
          rampColors.push({ 
            offset: offsetMin,
            color: (breakInfos[i].symbol) ? breakInfos[i].symbol.color : "#5daddd"
          });
        }
        rampColors.reverse();    
        
        this._rect.setFill({
          type: "linear",
          x1: 0, y1: 0,
          x2: 0, y2: 200,
          colors: rampColors
        });
      },

      destroy: function(){
        this.inherited(arguments); 
        this._slider.destroy();
        if(this._avgHandleTooltip){
          this._avgHandleTooltip.destroy();
        }
      }
      
    });

    
    
    return ClassedColorSlider;
  });