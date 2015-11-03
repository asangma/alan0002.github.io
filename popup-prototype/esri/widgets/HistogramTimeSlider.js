define([
  "../core/lang",
  "../TimeExtent",

  "dijit/_TemplatedMixin",
  "dijit/_WidgetBase",
  "dijit/form/HorizontalSlider",

  'dojo/_base/array',
  "../core/declare",
  "dojo/dom",
  "dojo/dom-style",
  "dojo/on",
  "dojo/string",

  "dojox/gfx",
  "dojox/form/RangeSlider",

  "dojo/i18n!../nls/jsapi",

  "dojo/text!dojox/form/resources/HorizontalRangeSlider.html",
  // host locally for testing HorizontalRangeSlider.html
  // cannot use from hosted JS API build due to cross-origin restrictions
  //"dojo/text!modules/templates/HorizontalRangeSlider.html",
  "dojo/text!./HistogramTimeSlider/templates/HistogramTimeSlider.html"
  // host locally for testing TimeSlider.html
  // cannot use from hosted JS API build due to cross-origin restrictions
  //"dojo/text!modules/HistogramTimeSlider/templates/HistogramTimeSlider.html"
],

/*
  TimeSlider

  Constructor Params:
    params - 
      required: layers ( array of layers to be used in the TimeSlider )
      optional: mode ( show_all, show_partial ), defaults to show_partial
                color ( sets theme for slider )
                
    element - element for dijit to append to in app
*/

function(
  esriLang, TimeExtent,
  TemplatedMixin, WidgetBase, HorizontalSlider,
  arr, declare, dom, domStyle, on, string,
  gfx, RangeSlider,
  nlsJsapi,
  hTemplate, template
) {

  var HistogramTimeSlider = declare([WidgetBase, TemplatedMixin], {

    declaredClass: "esri.widgets.HistogramTimeSlider",
    templateString: template,
    
    constructor: function(params, element) {
      var self = this;
      this.layers = params.layers;
      this.element = element;
      this.bins = [];
      this.fullTimeExtent = [];
      this._mode = params.mode || "show_partial"; //"show_partial"; show_all
      this._resolution = "esriTimeUnitsSeconds";
      this._timeInterval = params.timeInterval;
      this._numeric_res = 3600000;
      this._max_bins = 400;
      this._prev_num_bins = 0; 
      this._max_bin_height = 0;
      this._color = params.color || "rgb(5, 112, 176)";
      this._active = false;
      this.is_streaming = false;
      this.load_count = 0;
      this._textColor = params.textColor || "rgb(82, 95, 109)";

      //required for streaming layer
      this.timeField = params.timeField;
      
      // default to DateString, more info:  http://developers.arcgis.com/en/javascript/jshelp/intro_formatinfowindow.html
      this.dateFormat = params.dateFormat || "DateString";
      // set up a template to use with esriLang.substitute to format dates
      this._dateTemplate = "${date: " + this.dateFormat + "}";

      this._wire();
      
      this._resolutions = {
        "esriTimeUnitsSeconds"  : [ 0 ],
        "esriTimeUnitsMinutes"  : [ 0 ],
        "esriTimeUnitsHours"    : [ 0 ],
        "esriTimeUnitsDays"     : [ 0 ],
        "esriTimeUnitsMonths"   : [ 0 ],
        "esriTimeUnitsYears"    : [ 0 ]
      };
      
      this._num_resolutions = {
        "esriTimeUnitsSeconds" : 1000,
        "esriTimeUnitsMinutes" : 60000,
        "esriTimeUnitsHours" : 3600000,
        "esriTimeUnitsDays" : 86400000,
        "esriTimeUnitsMonths" : 2592000000,
        "esriTimeUnitsYears" : 31536000000
      };
      
      //build initial histogram, bind streaming layers
      arr.forEach(this.layers, function(layer,i) {
        if ( layer.url ) {
          var handle = layer.on("update-end", function() {
            handle.remove();
            var i, li;
            
            self.fullTimeExtent = self.getFullTimeExtent();
            if ( layer.graphics ) {
              self.updateLength = layer.graphics.length;
              for ( i = 0, li = layer.graphics.length; i < li; i++ ) {
                var time = layer.graphics[ i ].attributes[ layer.timeInfo.startTimeField ];
                self._add( time );
              }
            }

          });
        } else {

          self._bindStreamingEvents( layer );

        }
        
      });
    },
    
    /*
     * Returns max time extent of all time enabled layers on the map
     * 
     * 
     */
    getFullTimeExtent: function() {
      var min = null;
      var max = null;
      var i, li;
      for (i=0,li=this.layers.length;i<li;i++) {
        if (this.layers[i].timeInfo.timeExtent.startTime) { //new streaming layers this is null
          var start = this.layers[i].timeInfo.timeExtent.startTime.getTime();
          var end = this.layers[i].timeInfo.timeExtent.endTime.getTime(); 
          if ( !min ) {
            min = start;
            max = end;  
          } else if ( min > start ) {
            min = start;
          } else if ( max < end ) {
            max = end;
          }
        }
      }
      return [min, max];
    },
    
    /*
     * TODO remove this? Only in here because esri setTimeSlider requires this call
     */
    getCurrentTimeExtent: function() {
    },
    
    /*
     * Wire general events
     * 
     * 
     */
    _wire: function() {
      var self = this;
      
      //not active when mouse up
      on(window, "mouseup, blur", function() {
        if (self._active && ( self.bins.length !== self._prev_num_bins)) {
          self._active = false;
          self._prev_num_bins = self.bins.length;
          self._drawHistogram();  
          self._updateSlider();
        }
      });
      
      //redraw on window resize
      on(window, "resize", function() {
        self._prev_num_bins = self.bins.length;
        self._drawHistogram();  
        self._updateSlider();
      });
      
    },
    
     /*
     * Bind streaming layers
     * 
     */
    _bindStreamingEvents: function(layer) {
      var self = this;
      layer.on("graphic-draw", function(m) {
        self.is_streaming = true;
        var time = m.graphic.attributes[ self.timeField ];
        self._add( time );
      });
      layer.on("graphic-remove", function(m) {
        self.is_streaming = true;
        var time = m.graphic.attributes[ self.timeField ];
        if ( self._mode === "show_partial" ) {
          self._remove( time );
        }
      });
    },
    
    /*
     * Find the next best resolution
     * 
     */
    _nextRes: function(){
      var res;
      for ( res in this._resolutions ) {
        if ( this._resolutions[res].length <= this._max_bins) {
          return res;
        }
      }
    },
    
    /*
     * Maintains counts for all resolutions (sec, min, hour, day, month, year)
     * 
     */
    _updateAllResolutions: function( seconds, remove ) {
      
      var interval = this._timeInterval || this._resolution;
      var mult = ( this._num_resolutions[ interval ] / 1000 );
      var min = Math.floor( (seconds * mult ) / 60 ),
        hour = Math.floor( (seconds * mult ) / (60*60) ),
        day = Math.floor( (seconds * mult ) / ( 60*60*24 ) ),
        month = Math.floor( (seconds * mult ) / ( 60*60*24*30 ) ),
        year = Math.floor( (seconds * mult ) / ( 60*60*24*365 ) );
      
      /** Seconds **/
      if ( interval === "esriTimeUnitsSeconds") {
        var diff_sec = ( seconds - this._resolutions.esriTimeUnitsSeconds.length );
        var i, j;
        if ( diff_sec >= 1 ) {
          for (i = 0; i<diff_sec; i++) {
            this._resolutions.esriTimeUnitsSeconds.push(0);
          }
        }
        if (!this._resolutions.esriTimeUnitsSeconds[ seconds ]) {
          this._resolutions.esriTimeUnitsSeconds[ seconds ] = 0;
        }
        !remove ? 
          this._resolutions.esriTimeUnitsSeconds[ seconds ]++ : 
          this._resolutions.esriTimeUnitsSeconds[ seconds ]--;
      }

      /** Minutes **/
      if (this._timeInterval !== "esriTimeUnitsHours") {
        var diff_mins = ( min - this._resolutions.esriTimeUnitsMinutes.length );
        var i, j;
        if ( diff_mins >= 1 ) {
          for (i = 0; i<diff_mins; i++) {
            this._resolutions.esriTimeUnitsMinutes.push(0);
          }
        }
        if (!this._resolutions.esriTimeUnitsMinutes[ min ]) {
          this._resolutions.esriTimeUnitsMinutes[ min ] = 0;
        }
        !remove ? 
          this._resolutions.esriTimeUnitsMinutes[ min ]++ : 
          this._resolutions.esriTimeUnitsMinutes[ min ]--;
      }
      
      /** Hours **/
      var diff_hours = ( hour - this._resolutions.esriTimeUnitsHours.length );
      if ( diff_hours >= 1 ) {
        for (j = 0; j<diff_hours; j++) {
          this._resolutions.esriTimeUnitsHours.push(0);
        }
      }
      if (!this._resolutions.esriTimeUnitsHours[ hour ]) {
        this._resolutions.esriTimeUnitsHours[ hour ] = 0;
      }
      !remove ? 
        this._resolutions.esriTimeUnitsHours[ hour ]++ : 
        this._resolutions.esriTimeUnitsHours[ hour ]--;
        
      /** DAYS **/
      var diff_days = ( day - this._resolutions.esriTimeUnitsDays.length );
      if ( diff_days >= 1 ) {
        for (j = 0; j<diff_days; j++) {
          this._resolutions.esriTimeUnitsDays.push(0);
        }
      }
      if (!this._resolutions.esriTimeUnitsDays[ day ]) {
        this._resolutions.esriTimeUnitsDays[ day ] = 0;
      }
      !remove ? 
        this._resolutions.esriTimeUnitsDays[ day ]++ : 
        this._resolutions.esriTimeUnitsDays[ day ]--;
      
      /** Months **/
      var diff_month = ( month - this._resolutions.esriTimeUnitsMonths.length );
      if ( diff_month >= 1 ) {
        for (j = 0; j<diff_month; j++) {
          this._resolutions.esriTimeUnitsMonths.push(0);
        }
      }
      if (!this._resolutions.esriTimeUnitsMonths[ month ]) {
        this._resolutions.esriTimeUnitsMonths[ month ] = 0;
      }
      !remove ? 
        this._resolutions.esriTimeUnitsMonths[ month ]++ : 
        this._resolutions.esriTimeUnitsMonths[ month ]--;
      
      /** YEARS **/
      var diff_year = ( year - this._resolutions.esriTimeUnitsYears.length );
      if ( diff_year >= 1 ) {
        for (j = 0; j<diff_year; j++) {
          this._resolutions.esriTimeUnitsYears.push(0);
        }
      }
      if (!this._resolutions.esriTimeUnitsYears[ year ]) {
        this._resolutions.esriTimeUnitsYears[ year ] = 0;
      }
      !remove ? 
        this._resolutions.esriTimeUnitsYears[ year ]++ : 
        this._resolutions.esriTimeUnitsYears[ year ]--;
      
      
      //set bins and update histogram
      if ( !this._timeInterval ) {
        if ( this._resolutions[ this._resolution ].length >= this._max_bins ) {
          this._resolution = this._nextRes();
        }  
      } 
      
      
      var index = 0;
      switch (this._resolution) {
        case "esriTimeUnitsSeconds" :
          index = seconds;
          this._numeric_res = 1000;
          break;
        case "esriTimeUnitsMinutes" : 
          index = min;
          this._numeric_res = 60000;
          break;
        case "esriTimeUnitsHours" : 
          index = hour;
          this._numeric_res = 3600000;
          break;
        case "esriTimeUnitsDays" : 
          index = day;
          this._numeric_res = 86400000;
          break;
        case "esriTimeUnitsMonths" : 
          index = month;
          this._numeric_res = 2592000000;
          break;
        case "esriTimeUnitsYears" : 
          index = year;
          this._numeric_res = 31536000000;
          break;
      }
      
      this._setBins( index );
    },
   
    /*
     * 
     * Sets bins used by slider based on current resolution
     * 
     * 
     */
    _setBins: function( index ) {
      var res = this._timeInterval || this._resolution;
      this.bins = this._resolutions[ res ];
      
      var start = 0;
       
      var i = 0; 
      while (this.bins[i] === 0) {
        start = i + 1;
        i = i + 1;
      } 
      
      //update the slider
      if ( this._active ) {
        //do not update the slider if it is being used
        if (start !== this.minVisibleIndex) {
          this.minVisibleIndex = start; 
        }
        return;
      } else {
        if (!this.is_steaming && this.updateLength === this.load_count) {
          if ( ( this.bins.length !== this._prev_num_bins) || (start !== this.minVisibleIndex) ) {
            this.minVisibleIndex = start;
            this._prev_num_bins = this.bins.length;
            this._drawHistogram();
            if (this._slider) {
              this._updateSlider();
            }
          }
        } else {
          if ( this.is_streaming && ((this.bins.length != this._prev_num_bins) || ( start != this.minVisibleIndex ) )) {
            this.minVisibleIndex = start;
            this._prev_num_bins = this.bins.length;
            this._drawHistogram();
            if (this._slider) this._updateSlider();
          } else if ( this.is_streaming ) {
            this._updateHeights( index );
          }
        }
      }
      
    
    },
    
    
    /*
     * Update Time Extents
     * 
     * 
     */
    _updateFullTimeExtent: function( time ) {
      
      if ( !this.fullTimeExtent[0] ) {
        this.fullTimeExtent[0] = time;
      }
      if ( !this.fullTimeExtent[1] ) {
        this.fullTimeExtent[1] = time;
      }
      
      if ( time < this.fullTimeExtent[0] ) {
        this.fullTimeExtent[0] = time;
      }
      if ( time > this.fullTimeExtent[1] ) {
        this.fullTimeExtent[1] = time;
      }
      
    },
    
    /*
     * Get bin index for any given time
     * 
     */
    _getBin: function( time ) {
      var res = this._timeInterval || this._resolution;
      var index = Math.floor( ( time - this.fullTimeExtent[0] ) / this._num_resolutions[ res ] );
      return index;
    },
    
    
    /*
     * Add
     * Increments corresponding bin count
     * 
     */
    _add: function( time ) {
      var res = this._timeInterval || this._resolution;
      
      if (!this.is_steaming) {
        this.load_count++;
      }
      
      this._updateFullTimeExtent( time );
      
      var index = this._getBin( time );
      //fill is missing bins with ZERO
      var diff = (index - this._resolutions[ res ].length);
      var i;
      if (diff >= 1) {
        for (i = 0; i<diff; i++) {
          this._resolutions[ res ].push(0);
        }
      }
      
      this._updateAllResolutions( index );
      if (!this._slider) {
        this._createSlider();
      }
      
    },
    
    /*
     * Remove
     * (de)Increments corresponding bin count 
     * 
     */
    _remove: function( time ) {
      var index = this._getBin( time );
      this._resolutions.esriTimeUnitsSeconds[ index ]--;
      this._updateAllResolutions( index, true );
      if ( !this._active ) {
        this._updateSlider();
      }
    },
    
    /*
     * 
     * Build initial slider
     * Creates dojo slider for interaction with histogram
     * 
     */
    _createSlider: function() {
      var self = this;
      
      var HorizontalRangeSlider = declare([HorizontalSlider, RangeSlider], {
        templateString: hTemplate
      });
      
      this._slider = new HorizontalRangeSlider({
        name: "histogram-slider",
        values: [0, 100],
        minimum: 0,
        maximum: 100,
        showButtons: false,
        intermediateChanges: true,
        discreteValues: 2,
        style: "width:100%",
        onChange: function(values){
          var min = Math.floor(values[0]);
          var max = Math.floor(values[1]);
          self._getUserExtents(min, max);
          self._disableBins(min, max);
        }
      }, "histogram-slider");
      
    },
    
    /*
     * 
     * Update slider
     * Update slider values when points are added and removed
     * 
     */
    _updateSlider: function() {
      this._slider.discreteValues = this.histogram.length + 1;
      this._slider.maximum = this.histogram.length;
      this._slider._setValueAttr([0, this.histogram.length], false, false);
    },
    
    /*
     * Figure out user defined extents; fire event!
     * 
     * 
     */
    _getUserExtents: function(min, max) {
      var res = this._timeInterval || this._resolution;
      
      var timeExtent = new TimeExtent();
      timeExtent.startTime = new Date(this.fullTimeExtent[0] + ((min + this.minVisibleIndex) * this._num_resolutions[ res ]));
      timeExtent.endTime = new Date(this.fullTimeExtent[0] + ((max + this.minVisibleIndex) * this._num_resolutions[ res ]));
      
      this._updateDateRange(timeExtent);
      this.emit("time-extent-change", {
        timeExtent: timeExtent
      });
    },
    
       
    /*
     * Draw Histogram
     * Creates initial histogram, redraws histogram when bin is added or removed
     * 
     */
    _drawHistogram: function() {
      var self = this,
        ticks = [];
      
      if ( this.histogramSurface ) {
        this.histogramSurface.clear();
      } else {
        this.histogramSurface = gfx.createSurface("histogram-container", dom.byId(this.element.id).offsetWidth, 100);  
      }
      
      var max = Math.max.apply(Math, this.bins),
        width = (this.histogramSurface._parent.clientWidth / (this.bins.length - this.minVisibleIndex)),
        gap = width / 10,
        x = 0;
      
      this.histogram = [];
      var i, li;
      for ( i = this.minVisibleIndex, li = this.bins.length; i < li; i++ ) {
        var height = ( this.bins[ i ] / max ) * 100;
        var y = ( 100 - height );
       
        var bar = this.histogramSurface.createRect( { x: x, y: y, width: width - gap, height: height } )
          .setFill(this._color);
        
        this.histogram.push( bar );
        x = x + width;
        ticks.push( x );
        
        //tooltips
        bar.bin = this.bins[i];
        bar.x = x - width;
        bar.num = i;
        bar.max = max;
        bar.on("mouseover", function( e ) {
          self._showTipForBin( e.gfxTarget.bin, e.gfxTarget.num, e.gfxTarget.x );
        });
        bar.on("mouseout", function() {
          self._hideTipForBin();
        });
      }
      
      this._updateTimeTicks( ticks );
      this._updateScaleBar( max );
      this.emit("update");
      
    },
    
    /*
     * Update heights
     * Only called when existing bin values change, not when bin added or removed
     * 
     */
    _updateHeights: function( index ) {
      var max = Math.max.apply( Math, this.bins );
      var height;
      var y;
      var i, li;
      
      if ( max !== this._max_bin_height ) {
        for ( i = this.minVisibleIndex, li = this.histogram.length; i < li; i++ ) {
          height = ( this.bins[ i ] / max ) * 100;
          y = 100 - height; 
          this.histogram[ i ].setShape( { y: y, height: height } );
        }
      } else {
        height = ( this.bins[ index ] / max ) * 100;
        y = 100 - height;
        this.histogram[ index - this.minVisibleIndex ].setShape({ y: y, height: height });
      }
      
      this._updateScaleBar( max );
      this._max_bin_height = max;
    },
    
    
    /*
     * Maintains x time ticks
     * 
     * 
     */
    _updateTimeTicks: function( ticks ) {
      var res = this._timeInterval || this._resolution,
        step = Math.floor(this.histogram.length / 3),
        dateObj, dateString,
        i;
      
      for (i=0;i<2;i++){
        
        this.histogramSurface.createLine({ x1: ticks[step], y1: 0, x2: ticks[step], y2:this.histogramSurface._parent.clientHeight }).setStroke( this._textColor );

        dateObj = new Date(this.fullTimeExtent[0] + (( (step + 1) - this.minVisibleIndex) * this._num_resolutions[ res ]));
        dateString = esriLang.substitute({ date: dateObj.getTime() }, this._dateTemplate);
        
        this.histogramSurface.createText({ x: ticks[step] + 2, y: 10, text: dateString} ).setFont( { size : "12px"} ).setFill( this._textColor );
        step = step + step;
      }
        
    },
    
    /*
     * Updates time extent helper in UI
     * 
     */
    _updateDateRange: function( timeExtent ) {
      var start = esriLang.substitute({ date: new Date(timeExtent.startTime).getTime() }, this._dateTemplate);
      var end = esriLang.substitute({ date: new Date(timeExtent.endTime).getTime() }, this._dateTemplate);
      var dateRange = string.substitute(nlsJsapi.widgets.HistogramTimeSlider.dateRange, {
        start: start,
        end: end
      });

      dom.byId("histogram-range").innerHTML = dateRange;
    },
    
    /*
     * Gray out histogram bins when out of view
     * Needs min max slider values
     * 
     */
    _disableBins: function( min, max ) {
      var self = this;
      
      if ( min === 0 && max === this.histogram.length ) {
        this.histogram[ 0 ].setFill( this._color );
        this.histogram[ this.histogram.length - 1 ].setFill( this._color );
        return;
      }
      
      arr.forEach(this.histogram, function(bar,i) {
        if (i < min) { 
          bar.setFill("rgb(216,216,216)");
        } else if (i >= max ) {
          bar.setFill("rgb(216,216,216)");
        } else {
          bar.setFill( self._color );
        }
      });
    
    },
    
    /*
     * 
     * Draws scalebar, updates dynamically as data streams
     * 
     */
    _updateScaleBar: function(max) {
      if (this.scaleLeft) {
        this.scaleLeft.clear();
        this.scaleRight.clear();
      } else {
        this.scaleRight = gfx.createSurface("scale-bar-right", 45, 110);
        this.scaleLeft = gfx.createSurface("scale-bar-left", 45, 110);
      }

      var offset_max, offset, offset_mid;
      
      offset_max = (max > 99) ? offset = 10 : 20;
      offset_mid = ((max / 2) > 99) ? offset_mid = 10 : 20;
      this.scaleLeft.createLine({ x1: 40, y1: 5, x2:40, y2:130 }).setStroke("rgb(82, 95, 109)");
      this.scaleLeft.createLine({ x1: 40, y1: 5, x2:37, y2:5 }).setStroke("rgb(82, 95, 109)");
      this.scaleLeft.createLine({ x1: 40, y1: 60, x2:37, y2:60 }).setStroke("rgb(82, 95, 109)");
      this.scaleLeft.createText({ x: offset_max, y: 10, text: max} ).setFont( { size : "14px"} ).setFill( this._textColor );
      this.scaleLeft.createText({ x: offset_mid, y: 65, text: (Math.floor(max / 2))} ).setFont( { size : "14px" } ).setFill( this._textColor );
      
      this.scaleRight.createLine({ x1: 0, y1: 5, x2:0, y2:130 }).setStroke("rgb(82, 95, 109)");
      this.scaleRight.createLine({ x1: 0, y1: 5, x2:3, y2:5 }).setStroke("rgb(82, 95, 109)");
      this.scaleRight.createLine({ x1: 0, y1: 60, x2:3, y2:60 }).setStroke("rgb(82, 95, 109)");
      this.scaleRight.createText({ x: 4, y: 10, text: max} ).setFont( { size : "14px"} ).setFill( this._textColor );
      this.scaleRight.createText({ x: 4, y: 65, text: (Math.floor(max / 2))} ).setFont( { size : "14px"} ).setFill( this._textColor );
    },
    
    
    /*
     * Show / hide histogram toolips
     * 
     */
    _showTipForBin : function( bin, cnt, x ) {
      var res = this._timeInterval || this._resolution;
      if ( this._active ) {
        return;
      }
      
      var time1 = new Date(this.fullTimeExtent[0] + ((cnt - this.minVisibleIndex) * this._num_resolutions[ res ]));
      time1 = esriLang.substitute({ date: time1.getTime() }, this._dateTemplate);
      var time2 = new Date(this.fullTimeExtent[0] + (((cnt + 1) - this.minVisibleIndex) * this._num_resolutions[ res ]));
      time2 = esriLang.substitute({ date: time2.getTime() }, this._dateTemplate);

      var binCount = string.substitute(nlsJsapi.widgets.HistogramTimeSlider.count, { count: bin });

      dom.byId( "focusTip" ).innerHTML = ( "<span style='font-size:8pt'>" +time1 +" to "+time2+"</span> <br /> " + binCount );
      
      domStyle.set( "focusTip" , {
        "display" : "block",
        "left": x + "px",
        "top": "-10px"
      });
    },
    
    _hideTipForBin : function () {
      dom.byId( "focusTip" ).style.display = "none";
    }

  });
  
  
  
  return HistogramTimeSlider;
});
