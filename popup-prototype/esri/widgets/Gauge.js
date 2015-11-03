define([
    "../core/declare",
    "dojo/_base/lang",
    "dojo/dom-construct",
    "dojo/dom-geometry",
    "dojo/dom-style",
    "dojo/number",

    "dojo/text!./templates/Gauge.html",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dojox/widget/AnalogGauge",
    "dojox/widget/gauge/AnalogArcIndicator"

  ],
  function(
    declare, lang, construct, domGeom, style, number, template, WidgetBase, TemplatedMixin, AnalogGauge, ArcIndicator) {
    
    var Gauge = declare([WidgetBase, TemplatedMixin], {
      declaredClass: "esri.widgets.Gauge",
      
      templateString: template,
      widgetsInTemplate: false,
      
      constructor: function(options, srcRefNode) {
        // expected properties and values for the options argument:
        //  caption:  text to display below the gauge
        //  color:  color for the gauge indicator
        //  dataField:  attribute field used to drive the gauge
        //  dataFormat:  whether to display an actual value or a percentage, valid values are "value" or "percentage", tick marks are only added when this is "percentage"
        //  dataLabelField:  attribute field to use display a feature's name, displayed below gauge title
        //  maxDataValue:  maximum value for the gauge
        //  noDataLabel:  string to use when a feature doesn't have a value for dataLabelField
        //  numberFormat:  object passed to dojo/number.format, see dojo documentation for details:  http://dojotoolkit.org/api/1.8/dojo/number, most common options:  specify a number of decimal places, for instance: { "places": 2 }
        //  title:  title for the gauge
        //  unitLabel:  label attribute field being displayed, use "" for no label
        //  fromWebmap:  boolean, if true, all options listed above are ignored and the JSON from a webmap is used to create the gauge
        //
        // srcRefNode is the DOM node where the gauge will be created

        // set up widget defaults
        this.caption = "&nbsp;";
        this.color = "#000";
        this.dataFormat = "value";
        this.maxDataValue = 100;
        this.title = "&nbsp;";
        this.unitLabel = "";
        this.fromWebmap = false;

        // used to keep a reference to the current graphic
        this.feature = null;

        // start with no feature name
        this.dataLabel = "&nbsp;";

        // mixin constructor options 
        lang.mixin(this, options);

        // default is to not show ticks on the gauge
        this._majorTicks = "";
        
        // initialize value to zero
        this.value = 0;

        // default to zero decimal places if numberFormat is not provided
        this.numberFormat = this.numberFormat || { "places": 0 };

        if ( this.fromWebmap ) {
          // map properties from webmap JSON gadget to names that the gauge widget expected
          this.dataField = this.field;
          this.dataFormat = this.valueLabel;
          this.dataLabelField = this.displayField;
          this.maxDataValue = this.target;
          this.unitLabel = "";
        }

        if ( this.dataFormat == "percentage" ) {
          this.unitLabel = "%";
          this._majorTicks = { offset: 90, interval: 25, length: 3, color: "black" };
        }

        // watch updates of public properties and update the widget accordingly
        this.watch("caption", this._updateCaption);
        this.watch("dataLabel", this._updateDataLabel); 
        this.watch("title", this._updateTitle);
        this.watch("value", this._updateValue); 
        this.watch("feature", this._updateFeature); 
      },

      startup: function() {
        this.inherited(arguments);

        // create gauge now that the template has been inserted into the DOM
        // using startup instead of postCreate because some element
        // dimensions are needed
        var gaugeBackground = new ArcIndicator({
          interactionMode: "indicator",
          noChange: true,
          value: this.maxDataValue,
          width: 20,
          offset: 65,
          color: [204, 204, 204, 1], 
          title: "value",
          hideValue: true,
          duration: 100 // default in dojo is 1000
        });
        
        var indicator = new ArcIndicator({
          interactionMode: "indicator", 
          noChange: false,
          value: this.value,
          width: 20,
          offset: 65,
          color: this.color,
          title: "value",
          hideValue: true,
          onDragMove: "",
          duration: 100 // default in dojo is 1000
        });

        this.gaugeWidget = new AnalogGauge({
          background: [204, 204, 204, 0.0],
          width: parseInt(this.gaugeNode.style.width),
          height: parseInt(this.gaugeNode.style.height) + 10, // add 10 px so ticks show
          cx: parseInt(this.gaugeNode.style.width) / 2, 
          cy: parseInt(this.gaugeNode.style.height),
          style: "position: absolute;",
          radius: parseInt(this.gaugeNode.style.width) / 2, 
          useTooltip: false,
          ranges: [{ low: 0, high: this.maxDataValue, color: "rgba(255,0,0,0)" }],
          majorTicks: this._majorTicks, 
          indicators: [ gaugeBackground, indicator ]
        }, construct.create("div", null, this.gaugeNode));
        this.gaugeWidget.startup();

        // override method that handles mouse down so the gauge 
        // doesn't update when the indicator is clicked
        this.gaugeWidget._handleMouseDownIndicator = function() { };

        // add percent label
        this.valueNode = construct.create("div",{
          "innerHTML": "0" + this.unitLabel,
          "style": {
            "bottom": parseInt(this.gaugeNode.style.height) - (this.gaugeWidget.cy - 20) + "px",
            "color": "#000",
            "font-family": "arial",
            "font-size": "1em",
            "left": "-1000px",
            "position": "absolute"
          }
        }, this.gaugeWidget.domNode);
        
        // put the percent label in the middle of the gauge
        var contentBox = domGeom.getContentBox(this.valueNode);
        style.set(this.valueNode, "left", this.gaugeWidget.cx + "px");
        style.set(this.valueNode, "marginLeft", (-contentBox.w/2) + "px");
        if( this.gaugeWidget.cx ) {
          style.set(this.valueNode, "marginBottom", (-contentBox.h/2) + "px");
        }

        // only do this if a layer is passed in
        if ( this.layer ) {
          this._connectMouseOver();
        }
      },

      destroy: function() {
        if ( this._mouseOverHandler ) {
          this._mouseOverHandler.remove();
        }
        this.gaugeWidget.destroy();
        construct.empty(this.domNode);
        // this.inherited(arguments);
      },

      _connectMouseOver: function() {
        this._mouseOverHandler = this.layer.on("mouse-over", lang.hitch(this, function(e) {
          this.set("feature", e);
        }));
      },

      _formatValue: function(val) {
        if ( this.dataFormat === "percentage" ) {
          // calculate the percentage
          val = Math.round(( val / this.maxDataValue ) * 100);
        }
        return number.format(val, this.numberFormat);
      },

      _updateCaption: function(attr, oldVal, newVal) {
        this.captionNode.innerHTML = newVal;
      },

      _updateTitle: function(attr, oldVal, newVal) {
        this.titleNode.innerHTML = newVal;
      }, 

      _updateValue: function(attr, oldVal, newVal) {
        var val = this._formatValue(newVal);
        this.valueNode.innerHTML = val + this.unitLabel;
        if ( this.dataFormat === "percentage" ) {
          this.gaugeWidget.indicators[1].update(parseInt(val));
        } else { 
          this.gaugeWidget.indicators[1].update(parseInt(newVal)); 
        }
      },

      _updateDataLabel: function(attr, oldVal, newVal) {
        this.dataLabelNode.innerHTML = newVal;
      },

      _updateFeature: function(attr, oldVal, newVal) {
        // check that this is either a graphic or
        // or an event object with a graphic as a property
        if ( ! newVal || 
             ( newVal.hasOwnPropety && // this is for IE8, using hasOwnProperty was causing an error
               ! newVal.hasOwnProperty("graphic") && 
               ! newVal.declaredClass == "esri.Graphic" )
           ) {
          console.log("Gauge Dijit:  a graphic is required to update the gauge.");
          return;
        }

        this.feature = newVal.graphic || newVal;
        
        // update the widget's percent value
        // use zero when feature's don't have a valid value
        this.set("value", this.feature.attributes[this.dataField] || 0);
        this.set("dataLabel", this.feature.attributes[this.dataLabelField] || this.noDataLabel);
      }
    });

    return Gauge;
  });

