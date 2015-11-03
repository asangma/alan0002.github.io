define([
    "../../core/LinkedList",
    
    "../../core/declare"
],
function(LinkedList, declare) {
  var HandlerList = declare([LinkedList],
  /** @lends  esri/views/HandlerList.prototype */
  {

    classMetadata: {
      computed: {
        view: ["gestureManager.view"]
      }
    },

    //--------------------------------------------------------------------------
    //
    //  Lifecycle
    //
    //--------------------------------------------------------------------------

    constructor: function() {
      this.on("add, remove", this._collectEvents.bind(this));
    },

    //--------------------------------------------------------------------------
    //
    //  Properties
    //
    //--------------------------------------------------------------------------

    //----------------------------------
    //  removers
    //----------------------------------

    /**
     * An array of event removers to stop / remove all event handlers in this handler chain
     * @type {Array}
     */
    removers: null,

    //----------------------------------
    //  gestureManager
    //----------------------------------

    /**
     * The gesture manager instance this handler is attached to.
     *
     * @name gestureManager
     * @instance
     * @type {esri/views/input/GestureManager}
     */
    _gestureManager: null,

    _gestureManagerSetter: function(value) {
      this._addCustomGestures();
      return value;
    },

    //----------------------------------
    //  events
    //----------------------------------

    _gestures: null,

    _eventsGetter: function() {
      return this._gestures;
    },

    //----------------------------------
    //  customGestures
    //----------------------------------

    _customGestures: null,

    _customGesturesSetter: function(value) {
      this._addCustomGestures();
      return value;
    },

    //----------------------------------
    //  view
    //----------------------------------
    _viewGetter: function() {
      return this.get("gestureManager.view");
    },


    _gestureConfig: null,

    _phaseDict: {
      1: "start",
      2: "move",
      4: "end",
      8: "cancel",
      "START": 1,
      "MOVE": 2,
      "END": 4,
      "CANCEL": 8
    },


    //--------------------------------------------------------------------------
    //
    //  Public Methods
    //
    //--------------------------------------------------------------------------


    /**
     * General purpose event handler. The event is handled by any gesture event handlers in this
     * Handler class and then passed down the handler chain until it stopped.
     * Events can be stopped by returning `false` from a gesture handling function or calling
     * `preventDefault` on the event object.
     * @param  {Event} evt - the gesture event
     */
    processEvent: function processevent(evt) {
      var etype = evt && (evt.type || evt.name || evt.eventType);
      evt.lastEvent = this._lastEvt;

      if (etype === "hammer.input") {
        etype = "input";
      }
      var handler = this.first,
        propogate = true,
        result;
      while (handler) {
        var listener = handler[etype];
        if (listener) {
          result = listener.call(handler, evt);
          propogate = result !== false && evt.defaultPrevented !== true;
        }
        handler = propogate && this.next();
      }
      if (evt.eventType < this._phaseDict.END) {
        this._lastEvt = evt;
      } else {
        this._lastEvt = null;
      }
      if (propogate) {
        this.view.emit(etype, evt);
      }
    },


    //--------------------------------------------------------------------------
    //
    //  Private Methods
    //
    //--------------------------------------------------------------------------

    _collectEvents: function() {
      var handler = this.first;
      var evts = [];
      this._gestureConfig = this._collectCustoms();
      while (handler) {
        evts = evts.concat(handler.get("events"));
        handler = this.next();
      }
      this._gestures = evts;
      return evts;
    },

    _collectCustoms: function() {
      var handler = this.first;
      var gestConfig = null;
      var custom;
      while (handler) {
        custom = handler.customGestures;
        if (custom) {
          if (!gestConfig) {
            gestConfig = custom;
          } else {
            var names = Object.keys(custom);
            for (var i = names.length - 1; i >= 0; i--) {
              var n = names[i];
              if (!gestConfig[n]) {
                gestConfig[n] = custom[n];
              }
            }
          }
        }
        handler = this.next();
      }
      if (gestConfig != null && this.gestureManager) {
        this._gestureConfig = gestConfig;
        var gm = this.gestureManager;
        gestConfig.forEach(function(g) {
          gm.addGesture(g);
        });
      }
      return gestConfig;
    },

    _addCustomGestures: function() {
      if (this._gestureManager && this._customGestures) {
        var gm = this._gestureManager;
        this.customGestures.forEach(function(g) {
          gm.addGesture(g);
        });
      }
    }
  });

  return HandlerList;

  });