/**
 * Gesture handler that responds to events.
 * 
 * @module esri/views/inputs/Handler
 * @since 4.0
 * @see module:esri/views/inputs/GestureManager
 */
define([
    "../../core/Accessor",
    "../../core/declare",
    "../2d/viewpointUtils"
  ],
  function(Accessor, declare, vpUtils) {
    
    /**
    * @extends module:esri/core/Accessor
    * @constructor module:esri/views/inputs/Handler
    * @param {Object} properties - See the [properties](#properties) for a list of all the properties
    *                              that may be passed into the constructor.
    */
    var Handler = declare([Accessor],
      /** @lends module:esri/views/inputs/Handler.prototype */
      {
        declaredClass: "esri.views.Handler",
        classMetadata: {
          computed: {
            surface: ["view.surface"]
          }
        },
        //--------------------------------------------------------------------------
        //
        //  Lifecycle
        //
        //--------------------------------------------------------------------------
        constructor: function(options){
          this.viewpoint = vpUtils.create();
        },

        destroy: function() {
          this.view = null;
        },

        //--------------------------------------------------------------------------
        //
        //  Properties
        //
        //--------------------------------------------------------------------------

        /** 
         * The next handler in the handler chain.
         * 
         * @type {module:esri/views/inputs/Handler}
         */
        next: null,

        /**
         * @todo customGestures description
         * 
         * @type {Object}
         */
        customGestures: null,

        viewpoint: null,

        _surfaceGetter: function(){
          return this.get("view.surface");
        },

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

        /**
         * Get the event dict for this handler chain
         * @private
         * @return {string[]}
         */
        _eventsGetter: function evtgetter() {
          var evts;
          var cls = this.constructor.prototype;
          var props = Object.keys(cls);
          var superProps = Object.keys(Accessor.prototype);
          evts = props.filter(function(p){
            return p && p[0] !== "_" && p !== "events" && typeof this[p] == "function" && superProps.indexOf(p) < 0;
          }, this);
          return evts;
        }

      });
    return Handler;
  });