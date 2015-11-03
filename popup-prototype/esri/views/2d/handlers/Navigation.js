/*jslint browser: true, continue: true, eqeq: true, nomen: true, plusplus: true, regexp: true, unparam: true, sloppy: true, todo: true, vars: true, white: true */
/*global define */

define(
[
  "../../../core/declare",
  
  "dojo/keys",
  "dojo/dom",
  "dojo/aspect",
  
  // esri
  "../../../core/sniff",
  "../../inputs/Handler",
  "../../2d/viewpointUtils"
],
function(
  declare, keys, dom, aspect,
  has, Handler, vpUtils
) {

var NavigationHandler = declare(Handler, {
  declaredClass: "esri.views.2d.handlers.Navigation",

  //--------------------------------------------------------------------------
  //
  //  Lifecycle
  //
  //--------------------------------------------------------------------------

  constructor: function() {
    this.scroll = this.scroll.bind(this);
    this._surfaceWatcher = this._surfaceWatcher.bind(this);
    this.watch("surface", this._surfaceWatcher);
    
    this._mouseDownHandler = this._mouseDownHandler.bind(this);
    this._mouseUpHandler = this._mouseUpHandler.bind(this);
    this._mouseRotateHandler = this._mouseRotateHandler.bind(this);

    aspect.around(this, "tap", this._tapTest.bind(this));
    aspect.around(this, "click", this._tapTest.bind(this));
  },

  //--------------------------------------------------------------------------
  //
  //  Variables 
  //
  //--------------------------------------------------------------------------

  /**
   * Accumulated mouse / trackpad scroll wheel distance.
   * @type {Number}
   * @private
   */
  _scrollAccum: 0,

  _lastPosition: null,


  //--------------------------------------------------------------------------
  //
  //  Properties
  //
  //--------------------------------------------------------------------------

  /**
   * Enable modifier keys with mouse to perform some navigation movements
   * @type {Boolean}
   * @default true
   */
  /*useMouseModifiers: true,*/
  /**
   * Use "magic mouse/trackpad" gestures for pan on Mac & other devices which support it.
   * @default false
   * @type {Boolean}
   */
  useSmartNavigation: false,
  /**
   * modifier key or button to perform rotation with mouse.
   * Numeric keycode (ie dojo.keys) or button id string ("left", "right", or "center") to enable rotation
   * value of `false` disables mouse rotation modifier
   * @type {(Number|String|Boolean)}
   */
  mouseRotate: "right",//has("mac") ? keys.META : keys.CTRL,
  /**
   * modifier key or button to perform zoomOut with mouse double-tap.
   * Numeric keycode (ie dojo.keys) or button id string ("left", "right", or "center") to enable zoomOut
   * value of `false` disables mouse zoomOut modifier
   * @type {(Number|String|Boolean)}
   */
  mouseZoomOut: keys.SHIFT,
  /**
   * Enables/disables mouse wheel zoom or provide a modifier to enable it.
   * - `true` to zoom in / out with mouse wheel or hardware "scroll" gesture (default)
   * - Numeric keycode (ie dojo.keys) or button id string ("left", "right", or "center") to enable
   * - `false` to disable wheel zoom
   * @type {(Number|String|Boolean)}
   * @default true
   */
  mouseWheelZoom: true,


  //--------------------------------------------------------------------------
  //
  //  Event Handler
  //
  //--------------------------------------------------------------------------
  
  pan: function(event) {
    var deltaX = event.deltaX,
        deltaY = event.deltaY,
        last = event.lastEvent,
        dx = last ? (last.deltaX - deltaX) : -deltaX,
        dy = last ? (deltaY - last.deltaY) : deltaY,
        view = this.view,
        angle = 0,
        phase = event.eventType;
    //console.log("pan dx:", dx, ", dy:", dy, "  deltaX:", deltaX, ", deltaY:", deltaY);
    // Init:
    //   - Capture the events
    // Start:
    //   - Tell view that we interact
    //   - Set the cursor to move mode
    //   - Apply translation on view
    // Middle:
    //   - Apply translation on view
    // End:
    //   - Apply translation on view
    //   - Reset the cursor
    //   - Tell view that we stopped interacting
    
    if (phase == this._phaseDict.START) {
      // this.map.setCursor("move");
      view.interacting = true;
    }
    
    if (phase >= this._phaseDict.END) {
      // this.map.resetMapCursor();
      view.interacting = false;
    }
    else {
      if(!view.interacting){
        view.interacting = true;
      }
      if(dx === 0 && dy === 0){
        return;
      }
      else if(this._hasRotateKey(event.srcEvent)){
        // angle = (last) ? event.angle - last.angle : 0;
        angle = (Math.abs(dx) > Math.abs(dy)) ? dx : dy;
        view.viewpoint = this._scaleAndRotateViewpoint(Math.floor(view.width / 2), Math.floor(view.height / 2), 1, angle);
      }
      else {
        view.viewpoint = vpUtils.translateBy(
          this.viewpoint,
          view.viewpoint,
          [dx || 0, dy || 0]
        );
      }
    }
  },

  "double-tap": function(event) {
    var scale = (event.srcEvent.shiftKey) ? 0.5 : 2;
    var view = this.view;
    view.interacting = false;
    view.animateTo(this._scaleViewpoint(event.center.x, event.center.y, scale));
  },
  
  pinch: function(event) {
    var view = this.view,
        last = event.lastEvent,
        scale = event.scale,
        rotation = event.rotation,
        phase = event.eventType;
    if(scale === 1 && rotation === 0){
      return;
    }

    //adjust rotation and scale relative values 
    rotation = last ? rotation - last.rotation : rotation;
    scale = last ? (scale / last.scale) : scale;
    
    //determine the more important interaction
    var sfactor = Math.abs(1 - scale),
        rfactor = Math.abs(rotation / 90);


    // Init:
    //   - Capture the events
    // Start:
    //   - Tell view that we interact
    //   - Set the cursor to move mode
    //   - Apply translation on view
    // Middle:
    //   - Apply translation on view
    // End:
    //   - Apply translation on view
    //   - Reset the cursor
    //   - Tell view that we stopped interacting
    
    if (phase >= this._phaseDict.END) {
      // this.map.resetMapCursor();
      view.interacting = false;
      return;
    } else if(view.interacting === false){
      view.interacting = true;
    }
    
    /*
    if (rotation !== 0 || scale !== 1){
      console.log("pinch, scale: ", parseInt(scale*100)/100);
      console.log("rotation, rotation: ", parseInt(rotation*100)/100);
      console.log("rfact: ", rfactor, ", sfact: ", sfactor);
    }
    */
    if(sfactor >= rfactor && scale !== 1){
      //console.log("SCALE");
      view.viewpoint = this._scaleViewpoint(event.center.x, event.center.y, scale);
    } 
    else if(rfactor > sfactor && rotation !== 0){
      view.viewpoint = this._scaleAndRotateViewpoint(event.center.x, event.center.y, scale, rotation);
    }

  },
  
  /*rotate: function(event) {
    var view = this.view,
        last = event.lastEvent,
        rotation = event.rotation,
        phase = event.eventType;
    if(rotation === 0){
      return;
    }
    // Init:
    //   - Capture the events
    // Start:
    //   - Tell view that we interact
    //   - Set the cursor to rotate mode
    //   - Apply rotation on view
    // Middle:
    //   - Apply rotation on view
    // End:
    //   - Apply rotation on view
    //   - Reset the cursor
    //   - Tell view that we stopped interacting
   
    if (phase >= this._phaseDict.END) {
      view.interacting = false;
    } else if(view.interacting === false){
      view.interacting = true;
    }
    
      var r = last ? (rotation - last.rotation) : rotation;
    if (r !== 0) {
      //console.log("rotation, rdiff: ", parseInt(r*100)/100, ", rotation: ", parseInt(rotation*100)/100);
      view.viewpoint = this._rotateViewpoint(event.center.x, event.center.y, r);
    }
  },*/
  
  scroll: function(event) {
    if (this.mouseWheelZoom) {
      event.stopPropagation();
      event.preventDefault();
      var view = this.view;
      var delta = -1 * event.deltaY;
      if(delta === 0){
        return;
      }
      var threshold = has("ff") ? 9 : this.view.height / 4;
      var scale;
      if(delta > 0 && this._scrollAccum >= 0 || delta < 0 && this._scrollAccum <= 0){
        this._scrollAccum += delta;
      } else {
        this._scrollAccum = delta;
      }

      if(Math.abs(this._scrollAccum) > threshold){
        scale = (delta < 0 ? 0.5 : 2.0);
        this._scrollAccum = 0;
        view.interacting = false;
        view.animateTo(this._scaleViewpoint(event.clientX, event.clientY, scale));
      }
    }
  },

  tap: function(event){},

  click: function(event){},

  //empty functions for unused events so that they still fire on view
  hold: function(event){},

  swipe: function(event){},

  _mouseDownHandler: function(evt){
    if(evt.button > 0){
      evt.preventDefault();
      evt.stopImmediatePropagation();

      var surface = this.surface;

      // coordinates to relative to the view position
      this._lastPosition = this.view.pageToContainer(evt.clientX, evt.clientY, this._lastPosition);

      surface.addEventListener("mousemove",this._mouseRotateHandler);
      surface.addEventListener("mouseup", this._mouseUpHandler);
      
      this.view.interacting = true; 
    }
  },

  _mouseUpHandler: function(evt){
    var surface = this.surface;
    if(evt.button > 0){
      surface.removeEventListener("mousemove", this._mouseRotateHandler);
      surface.removeEventListener("mouseup", this._mouseUpHandler);
      this.view.interacting = false; 
    }
  },

  _mouseRotateHandler: function(evt){
    var view = this.view;
    
    // coordinates to relative to the view position
    this._coords = view.pageToContainer(evt.clientX, evt.clientY, this._coords);

    // calculate the delta angle between the 2 mouse position
    var sc = view.state.paddedScreenCenter;
    var angle = vpUtils.angleBetween(sc, this._lastPosition, this._coords);
      
    // rotate around the center of the padded area
    view.viewpoint = vpUtils.rotateBy(this.viewpoint, view.content.viewpoint, angle);
    
    var flip = this._lastPosition;
    this._lastPosition = this._coords;
    this._coords = flip;
  },

  _contextStop: function(evt){
    //evt.stopImmediatePropagation();
    evt.preventDefault();
  },

  _surfaceWatcher: function(newValue, oldValue) {
    if (oldValue) {
      oldValue.removeEventListener("wheel", this.scroll);
      oldValue.removeEventListener("mousedown", this._mouseDownHandler);
    }
    var surface = newValue;
    if(surface){
      dom.setSelectable(surface, false);
      surface.addEventListener("wheel", this.scroll);
      if(this.mouseRotate == "right" || this.mouseRotate == "center"){
        surface.addEventListener("mousedown", this._mouseDownHandler);
        surface.addEventListener("contextmenu", this._contextStop, true);
      }
    }
  },

  _scaleViewpoint: function(x, y, scale) {
    var view = this.view;
    var cc = this._getContentCoords(x, y, view);
    return vpUtils.scaleBy(this.viewpoint, cc.viewpoint, scale, cc.coordinates, view.content.size);
  },

  _scaleAndRotateViewpoint: function(x, y, scale, angle){
    var view = this.view;
    var cc = this._getContentCoords(x, y, view);
    return vpUtils.scaleAndRotateBy(this.viewpoint, cc.viewpoint, scale, angle, cc.coordinates, view.content.size);
  },

  _getContentCoords: function(x, y, view){
    // get the viewpoint from the visible area
    var content = view.content;

    // get the starting viewpoint.
    var viewpoint = view.animation ? view.animation.target : content.viewpoint;

    // compute the coordinate relative to the visible area;
    var coords = view.pageToContent(x,y);

    return {
      viewpoint: viewpoint,
      coordinates: coords
    };
  },

  _tapTest: function(originalTap){
    return function(event){
      var promise = this.view.hitTest(event.center.x, event.center.y);
      promise.then(function(results){
        event.graphic = results.graphic;
        event.mapPoint = results.mapPoint;
        originalTap(event);
      });
    };
  },

  _hasRotateKey: function(evt){
    var rkey = this.mouseRotate;
    var test = false;
    if(rkey === false){
      return test;
    }
    if(evt.altKey && rkey == keys.ALT){
      test = true;
    }
    else if(evt.ctrlKey && rkey == keys.CTRL){
      test = true;
    }
    else if(evt.metaKey && rkey == keys.META){
      test = true;
    }
    else if(evt.shiftKey && rkey == keys.SHIFT){
      test = true;
    }
    //TODO buttons
    return test;
  }
  
});

return NavigationHandler;

});
