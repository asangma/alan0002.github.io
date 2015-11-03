/**
 * Mixin for {@link module:esri/views/View View}.
 *
 * @module esri/views/DOMContainer
 * @mixin
 * @since 4.0
 */
 define(
[
  "dojo/_base/lang",

  "dojo/has",
  "dojo/on",
  "dojo/dom-style",
  
  "esri/core/Accessor", 
  "esri/core/Scheduler"
], 
function(
  lang,
  has, on, style,
  Accessor, Scheduler
) {
  
  var AUTO = "auto";
  var USER_DEFINED = "user-defined";

  var position = { x: 0, y: 0 };

  var getPosition = function getPosition(node) {
    var	doc = node.ownerDocument || window.document;
    var win = doc.parentWindow || doc.defaultView;
    var bounds = node.getBoundingClientRect();

    // position + scroll
    position.x = bounds.left + win.pageXOffset;
    position.y = bounds.top + win.pageYOffset;

    return position;
  };

  var padExtents = {l: 0, t: 0, r: 0, b: 0, w: 0, h: 0};

  var getPadExtents = function getPadExtents(node, computedStyle) {
    var s = computedStyle;
    var px = style.toPixelValue;
    var l = px(node, s.paddingLeft);
    var t = px(node, s.paddingTop);
    var r = px(node, s.paddingRight);
    var b = px(node, s.paddingBottom);
    
    padExtents.l = l;
    padExtents.t = t;
    padExtents.r = r;
    padExtents.b = b;
    padExtents.w = l + r;
    padExtents.h = t + b;

    return padExtents;
  };

  var borderExtents = {l: 0, t: 0, r: 0, b: 0, w: 0, h: 0};

  var none = "none";

  var getBorderExtents = function getBorderExtents(node, computedStyle){
    var s = computedStyle;
    var px = style.toPixelValue;
    var l = s.borderLeftStyle != none ? px(node, s.borderLeftWidth) : 0;
    var t = s.borderTopStyle != none ? px(node, s.borderTopWidth) : 0;
    var r = s.borderRightStyle != none ? px(node, s.borderRightWidth) : 0;
    var b = s.borderBottomStyle != none ? px(node, s.borderBottomWidth) : 0;

    borderExtents.l = l;
    borderExtents.t = t;
    borderExtents.r = r;
    borderExtents.b = b;
    borderExtents.w = l + r;
    borderExtents.h = t + b;

    return borderExtents;
  };       

  var measurements = {x: 0, y: 0, w:0, h: 0};

  var hasOpera = has("opera");

  var getMeasurements = function getMeasurements(node, computedStyle){
    var s = computedStyle;
    var w = node.clientWidth, h;
    var pe = getPadExtents(node, s);
    var be = getBorderExtents(node, s);
    var position = getPosition(node, s);

    if(!w){
      w = node.offsetWidth;
      h = node.offsetHeight;
    }
    else{
      h = node.clientHeight;
      be.w = be.h = 0;
    }

    // On Opera, offsetLeft includes the parent's border
    if(hasOpera){
      pe.l += be.l;
      pe.t += be.t;
    }

    measurements.x = position.x;
    measurements.y = position.y;
    measurements.w = w - pe.w - be.w;
    measurements.h = h - pe.h - be.h;

    if (measurements.w < 0) {
      measurements.w = 0;
    }
    if (measurements.h < 0) {
      measurements.h = 0;
    }

    return measurements;
  };

  /**
   * return the class list in a string format for a specific node
   */
  var getFullClassListString = (function() {
    if ("classList" in document.createElement("_")) {
      return function(node) {
        return node.classList.toString();
      };
    }
    // see https://developer.mozilla.org/en-US/docs/Web/API/Element/classList
    var strTrim = String.prototype.trim || function () {
      return this.replace(/^\s+|\s+$/g, "");
    };
    return function(node) {
      var trimmedClasses = strTrim.call(node.getAttribute("class") || "");
      var classes = trimmedClasses ? trimmedClasses.split(/\s+/) : [];
      return classes.join(" ");
    };
  })();

  // yann: not really frequencies
  var MIN_FREQ = 0.016;    //sec
  var MAX_FREQ = 0.750;    //sec
  var RESIZING_FREQ = 0.512; // sec
  var FREQ_INC_FACTOR = 2;
  
  var DOMContainer = Accessor.createSubclass(
  /** @lends module:esri/views/DOMContainer */      
  {
    declaredClass: "esri.views.DOMContainer",
    
    classMetadata: {
      properties: {
        container: {},
        size: {
          copy: function(a, b) {
            // todo refactor once gl-matrix is propertly shared accross views.
            a[0] = b[0];
            a[1] = b[1];
          }
        },
        heightResizeMode: {
          readOnly: true
        },
        widthResizeMode: {
          readOnly: true
        },
        resizing: {},
        suspended: {}
      },
      computed: {
        width: ["size"],
        height: ["size"]
      }
    },

    //--------------------------------------------------------------------------
    //
    //  Lifecycle
    //
    //--------------------------------------------------------------------------
    
    constructor: function(properties) {
      var info = this._measureInfo = {
        task: null,     // measurement task
        count: 0,       // number of consecutive equal measurements
        freq: MIN_FREQ, // measurement frequency in seconds
        time: MAX_FREQ, // secs since last measurement
        classList: null
      };

      var resizeHdl = null;
      this.watch("container", function(newValue, oldValue, property, target) {
        if (resizeHdl) {
          resizeHdl.remove();
          resizeHdl = null;
          info.freq = MIN_FREQ;
          info.time = MAX_FREQ;
          info.count = 0;
        }
        if (info.task) {
          info.task.remove();
          info.task = null;
        }
        if (newValue) {
          resizeHdl = on(window, "resize", function() {
            info.freq = MIN_FREQ;
            info.time = MAX_FREQ;
            info.count = 0;
          }.bind(target));
          info.task = Scheduler.addFrameTask({
            prepare: target._measure.bind(target)
          });
        }
      });
    },

    getDefaults: function() {
      return lang.mixin(this.inherited(arguments), {
        size: [0, 0],
        position: [0, 0]
      });
    },

    destroy: function() { 
      this.container = null;
    },

    //--------------------------------------------------------------------------
    //
    //  Variables
    //
    //--------------------------------------------------------------------------
    
    /** 
     * task: null,     // measurement task
     * count: 0,       // number of consecutive equal measurements
     * freq: MIN_FREQ, // measurement frequency in seconds
     * time: MIN_FREQ  // secs since last measurement
     * @private
     */
    _measureInfo: null,

    //--------------------------------------------------------------------------
    //
    //  Properties
    //
    //--------------------------------------------------------------------------
    
    //----------------------------------
    //  size
    //----------------------------------

    /**
     * An array containing the width and height of the view in pixels, e.g. `[width, height]`.
     * 
     * @type {number[]}
     * @readonly
     * @example
     * view.width = 600;
     * view.heigth = 400;
     * //This will print [600, 400]
     * console.log(view.size);
     */
    size: null,

    _sizeSetter: function(newValue, cached) {
      if (!cached) {
        cached = [0, 0];
      }
      cached[0] = newValue[0];
      cached[1] = newValue[1];
      return cached;
    },
    
    //----------------------------------
    //  position
    //----------------------------------

    /**
     * The position of the top-left corner of the view in the 
     * page in [x, y] screen coordinates.
     * 
     * In the [Basic map 2D sample](../sample-code/2d/basic2d/), printing
     * `view.position` to the console would be return `[0,0]`. In the
     * [Bootstrap Starter sample](../sample-code/bonus/bootstrap-starter/),
     * printing `view.position` in the console returns `[0,50]`.
     * 
     * @type {number[]}
     * @readonly
     * @private
     */
    position: null,

    _positionSetter: function(newValue, cached) {
      if (!cached) {
        cached = [0, 0];
      }
      cached[0] = newValue[0];
      cached[1] = newValue[1];
      return cached;
    },

    //----------------------------------
    //  height
    //----------------------------------

    /**
     * The height of the view in pixels. Generally, you should handle
     * view height with CSS on the DOM element containing the view. 
     * However, this property offers a convenient way to do it 
     * programmatically.
     * 
     * There is no requirement to set the height inside the view object
     * or the CSS of the DOM node containing the view when initializing it.
     * The view uses the full height of its container element by default.
     *
     * @type {number}
     * @default 0
     * @example
     * //sets the height to 100px
     * view.height = 100;
     * //sets the height to 100% in the page
     * view.height = '100%';
     * //also sets the height to 100%
     * view.height = 'auto';
     */
    height: 0,

    _heightGetter: function(value) {
      return this.size[1];
    },

    _heightSetter: function(value, oldValue) {
      var container = this.container;

      // parse the value. if no valid value, sizing will be auto.
      if (!value) {
        // "", 0, null, undefined
        value = AUTO;
      }
      else if (typeof value === "string") {
        // supports strings like "100px"
        if (value.indexOf("px") > -1) {
          value = style.toPixelValue(container, value);
        }
        else {
          value = AUTO;
        }
      }
      else {
        value = style.toPixelValue(container, value);
      }

      if (value === AUTO) {
        // just make sure we reset the inline style
        if (container) {
          container.style.height = "";
        }

        // r/o property
        this._accessorProps.set("heightResizeMode", AUTO);
        this._measureInfo.freq = MIN_FREQ;

        // return the current value to be cached
        // the new value will be computed at the next frame
        return oldValue;
      }
      else {
        this._accessorProps.set("heightResizeMode", USER_DEFINED);
        this._measureInfo.freq = MIN_FREQ;
        if (container) {
          container.style.height = value + "px";
        }
        return value;
      }
    },

    //----------------------------------
    //  heightResizeMode
    //----------------------------------

    /**
     * Indicates if the height of the view is measured automatically, or defined by the user.
     * 
     * **Possible Values:** auto | user-defined
     * @type {string}
     * @readonly
     * @default
     * @example
     * //sets the height to 150px
     * view.height = 150;
     * //prints 'user-defined'
     * console.log(view.heightResizeMode);
     * @example
     * //sets the height to 100% of the page
     * view.height = 'auto';
     * //prints 'auto'
     * console.log(view.heightResizeMode);
     */
    heightResizeMode: "auto",

    //----------------------------------
    //  resizing
    //----------------------------------

    /**
     * Indicates if the view is resizing.
     *
     * @type {boolean}
     * @readonly
     * @default
     */
    resizing: false,

    //----------------------------------
    //  suspended
    //----------------------------------

    /**
     * Indicates if the view is visible on the page.
     *
     * @type {boolean}
     * @readonly
     * @default
     */
    suspended: true,

    //----------------------------------
    //  width
    //----------------------------------

    /**
     * The width of the view in pixels. Generally, you should handle
     * view width with CSS on the DOM element containing the view. 
     * However, this property offers a convenient way to do it 
     * programmatically.
     * 
     * There is no requirement to set the width inside the view object
     * or the CSS of the DOM node containing the view when initializing it.
     * The view uses the full width of its container element by default.
     *
     * @type {number}
     * @default 0
     * @example
     * //sets the width to 100px
     * view.width = 100;
     * //sets the width to 100% in the page
     * view.width = '100%';
     * //also sets the width to 100%
     * view.width = 'auto';
     */
    width: 0,

    _widthGetter: function(value) {
      return this.size[0];
    },

    _widthSetter: function(value, oldValue) {
      var container = this.container;

      // parse the value. if no valid value, sizing will be auto.
      if (!value) {
        // "", 0, null, undefined
        value = AUTO;
      }
      else if (typeof value === "string") {
        // supports strings like "100px"
        if (value.indexOf("px") > -1) {
          value = style.toPixelValue(container, value);
        }
        else {
          value = AUTO;
        }
      }
      else {
        value = style.toPixelValue(container, value);
      }

      if (value === AUTO) {
        // just make sure we reset the inline style
        if (container) {
          container.style.width = "";
        }

        // r/o property
        this._accessorProps.set("widthResizeMode", AUTO);
        this._measureInfo.freq = MIN_FREQ;

        // return the current value to be cached
        // the new value will be computed at the next frame
        return oldValue;
      }
      else {
        this._accessorProps.set("widthResizeMode", USER_DEFINED);
        this._measureInfo.freq = MIN_FREQ;
        if (container) {
          container.style.width = value + "px";
        }
        return value;
      }
    },

    //----------------------------------
    //  widthResizeMode
    //----------------------------------

    /**
     * Indicates if the width of the view is measured automatically, or defined by the user.
     * 
     * **Possible Values:** auto | user-defined
     * @type {string}
     * @readonly
     * @default
     * @example
     * //sets the width to 150px
     * view.width = 150;
     * //prints 'user-defined'
     * console.log(view.widthResizeMode);
     * @example
     * //sets the width to 100% of the page
     * view.width = 'auto';
     * //prints 'auto'
     * console.log(view.widthResizeMode);
     */
    widthResizeMode: "auto",


    //--------------------------------------------------------------------------
    //
    //  Public Methods
    //
    //--------------------------------------------------------------------------

    /**
     * use clientX, clientY
     * @private
     */
    pageToContainer: function(x, y, out) {
      var pos = this.position;

      x = x - pos[0];
      y = y - pos[1];
      if (out) {
        out[0] = x;
        out[1] = y;
      }
      else {
        out = [x, y];
      }
      return out;
    },

    //--------------------------------------------------------------------------
    //
    //  Private Methods
    //
    //--------------------------------------------------------------------------
    
    _measure: (function() {
      var s = [0, 0];

      return function(t, dt, sinceEpoch, spendInFrame) {
        var info = this._measureInfo;
        info.time += dt;
        if (info.time < info.freq) {
          return;
        }
        info.time = 0;

        var node = this.container;
        var root = this.root;
        var surface = this.surface;
        var size = this.size;
        var position = this.position;

        // should emit a "resize" event
        var emit = false;

        var px = style.toPixelValue;

        var h = 0;
        var w = 0;
        var x = 0;
        var y = 0;

        var oldW = size[0];
        var oldH = size[1];
        var oldX = position[0];
        var oldY = position[1];

        var doMeasureHeight = this.heightResizeMode === AUTO;
        var doMeasureWidth = this.widthResizeMode === AUTO;
        var doMeasure = node && (!oldW || !oldH || doMeasureHeight || doMeasureWidth);

        var suspended = node == null;

        // Check the suspension
        if (node) {
          var classList = getFullClassListString(node);
          var cs = style.getComputedStyle(node);
          var m = getMeasurements(node, cs);

          w = doMeasureWidth ? m.w : this.width;
          h = doMeasureHeight ? m.h : this.height;
          x = m.x;
          y = m.y;

          if (classList === info.classList) {
            if (w !== 0) {
              doMeasureWidth = false;
            }
            if (h !== 0) {
              doMeasureHeight = false;
            }
          }
          info.classList = classList;

          if (!w && !h) {
            // width and height are 0...
            // let's ignore the values
            doMeasure = false;
            suspended = true;
          }
        }

        if (doMeasure) {        
          var minWidth = px(node, cs.minWidth);
          var minHeight = px(node, cs.minHeight);
          var maxWidth = px(node, cs.maxWidth);
          var maxHeight = px(node, cs.maxHeight);

          var doc = node.ownerDocument || window.document;
          var body = doc.body;
          var bounds = body.getBoundingClientRect();

          if (doMeasureHeight) {
            var bodyHeightMargin = bounds.top + (bounds.bottom - bounds.height);
            var nodeHeightMargin = px(node, cs.marginTop) + px(node, cs.marginBottom);
            var docHeight = doc.documentElement.clientHeight;
            var bodyHeight = body.clientHeight;
            var oldHeight = h || root.clientHeight;
            h = (docHeight - bodyHeight + oldHeight) - bodyHeightMargin - nodeHeightMargin;
            if (minHeight > 0) {
              h = Math.max(h, minHeight);
            }
            if (maxHeight > 0) {
              h = Math.min(h, maxHeight);
            }
            else {
              h = Math.min(h, window.innerHeight - bodyHeightMargin - nodeHeightMargin);
            }
          }

          if (doMeasureWidth) {
            var bodyWidthMargin = bounds.left + (bounds.right - bounds.width);
            var nodeWidthMargin = px(node, cs.marginLeft) + px(node, cs.marginRight);
            var docWidth = document.documentElement.clientWidth;
            var bodyWidth = body.clientWidth;
            var oldWidth = w || root.clientWidth;
            w = (docWidth - bodyWidth + oldWidth) - bodyWidthMargin - nodeWidthMargin;
            if (minWidth > 0) {
              w = Math.max(w, minWidth);
            }
            if (maxWidth > 0) {
              w = Math.min(w, maxWidth);
            }
            else {
              w = Math.min(w, window.innerWidth - bodyWidthMargin - nodeWidthMargin);
            }
          }
        }
        
        w = w < 0 ? 0 : w;
        h = h < 0 ? 0 : h;

        if ((w && h) && (w !== oldW || h !== oldH)) {
          s[0] = w;
          s[1] = h;
          this._accessorProps.set("size", s);
          emit = true;
          info.count = 0;
          info.freq = MIN_FREQ;
        }
        else if (w === oldW && h === oldH) {
          // reduce the fq of measurements
          info.count++;
          info.count = 0;
          info.freq = Math.min(MAX_FREQ, info.freq * FREQ_INC_FACTOR);
          if (info.freq >= RESIZING_FREQ) {
            this.resizing = false;
          }
        }

        if (x !== oldX || y !== oldY) {
          s[0] = x;
          s[1] = y;
          this._accessorProps.set("position", s);
        }

        if (emit) {
          this.resizing = true;
          if (root && surface) {
            root.style.width = surface.style.width = w + "px";
            root.style.height = surface.style.height = h + "px";
          }
          this.emit("resize", {
            oldWidth: oldW,
            oldHeight: oldH,
            width: w,
            height: h
          });
        }

        // update suspended state
        if(this.suspended !== suspended) {
          this.suspended = suspended;
        }
      };
    })()

  });
  
  return DOMContainer;
});
