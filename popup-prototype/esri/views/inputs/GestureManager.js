/**
* GestureManager provides a consistent approach to managing the interaction between user interface input
* and a {@link module:esri/views/View}. It standardizes the input of mouse, touch, and pointer events to 
* a common set of input actions and gesture events. Raw input events are available via
* the `input` event type.
*
* @module esri/views/inputs/GestureManager
* @since 4.0
*/
define([
  "../../core/declare",

  "../../core/Accessor",

  "./HandlerList",
  "./HammerInput"
],
function(
  declare,
  Accessor, 
  HandlerList, InputManager
){
  
  /**
   * @extends module:esri/core/Accessor
   * @constructor module:esri/views/inputs/GestureManager
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                              that may be passed into the constructor.
   */    
  var GestureManager = declare([Accessor], 
  /** @lends module:esri/views/inputs/GestureManager.prototype */
  {

      //--------------------------------------------------------------------------
      //
      //  Lifecycle
      //
      //--------------------------------------------------------------------------
      
      constructor: function(options){
        var surface = options.surface || this.surface;
        if(!surface){
          console.error("GestureManager requires a surface dom element to work.");
          return;
        }
        this.inputManager = new InputManager(surface);
        this.handlers = new HandlerList({
          gestureManager: this
        });
      },
      
      
      //--------------------------------------------------------------------------
      //
      //  Properties
      //
      //--------------------------------------------------------------------------
      
      /**
       * The view to which the Gesture Manager is attached.
       * 
       * @type {module:esri/views/MapView | module:esri/views/SceneView}
       */
      view: null,
      /**
       * The DOM HTMLElement that captures the gestures. 
       * This property is **required** when constructing an instance of this class.
       * 
       * @type {HTMLElement}
       */
      surface: null,
      /**
       * Indicates whether the GestureManager should track mouse over events (i.e. "hover").
       * 
       * @type {Boolean}
       * @default false
       */
      trackHover: false,
      /**
       * The active gesture handler responding to the gesture events.
       * 
       * @type {module:esri/views/inputs/Handler}
       */
      handlers: null,

      _handlersSetter: function handlersSetter(value, oldValue){
        if(value == null){
          value = new HandlerList({
            gestureManager: this
          });
        } else {
          value.gestureManager = this;
        }
        this._removeListeners(oldValue);
        this._addListeners(value, value);
        return value;
      },
      
      /**
       * Internal reference to the actual input manager class. Default is HammerInput wrapper for hammer.js
       * @type {Object}
       * @private
       */
      _inputManager: null,
      
      
      //--------------------------------------------------------------------------
      //
      //  Public Methods
      //
      //--------------------------------------------------------------------------

      /**
       * Register gesture event listeners
       * 
       * @param  {string} event - The event name or comma separated list of event names.
       * @param  {function} listener - The function that will handle the input gesture.
       * @return {Object}   An object with a `remove` function to remove the listener.
       */
      on: function(event, listener){
        var inMgmr = this.inputManager;
        return inMgmr && inMgmr.on(event, listener);
      },

      /**
       * Adds a custom gesture event type.
       * @param {Object} options - See the object specification table below.
       * @param {string} options.event - The name of the event that the gesture will fire
       * @param {string} options.action - The input action that the gesture is based on.<br><br>
       * **Known Values:** tap | pan | pinch | rotate | hold | swipe                       
       * @param {Object=} options.rules - The input rules that determine if a gesture should fire
       * @param {number=} options.rules.pointers - The number of inputs touching the screen.
       * @param {number=} options.rules.direction - The direction of the input.
       * @param {number} options.rules.threshold - The minimum or maximum limit in pixels or angle degrees.
       * @param {number} options.rules.velocity - Minimal velocity for a swipe versus a pan.
       * @param {number} options.rules.taps - The number of consecutive taps required.
       * @param {number} options.rules.interval - Maximum time allowed between input actions for
       *   the actions to be considered as consecutive.
       * @param {Object[]} options.rules.firesWith - An array of other gesture events that can happen in parallel
       * @param {Object[]} options.rules.exclusiveTo - An array of other gesture events that can not happen in parallel
       */
      addGesture: function(options){
        var inMgmr = this.inputManager;
        var type = options && options.event;
        if(type === "input"){
         //raw input is already an event and can't be configured
         console.log("'input' is not a configurable gesture. listen to 'input' event with the 'on' function");
         return;
        }
        var added = inMgmr.addGesture(options);
        if(added){
          return this;
        } else {
          return added;
        }
      },
      
      addHandler: function(handler){
        if(!this.handlers){
          this.handlers = new HandlerList();
        }
        this.handlers.add(handler);
        this._addListeners(this.handlers, handler);
        return this;
      },

      removeHandler: function(handler){
        if(this.handlers){
          this._removeListeners(this.handlers);
          this.handlers.remove(handler);
          var h = this.handlers.first;
          while(h){
            this._addListeners(this.handlers, h);
            h = this.handlers.next();
          }
        }
        return this;
      },

      /**
       * Removes the a gesture type.
       * @param  {string} type - The gesture event name.
       */
      removeGesture: function(type){
        return this.inputManager.removeGesture(type);
      },

      /**
       * Reconfigures the gesture event rules.
       * @param  {string} type - The gesture event name.
       * @param  {Object} options - The new rules to use for this gesture event to fire>
       */
      configureGesture: function(type, options){
        return this.inputManager.configureGesture(type, options);
      },
      
      //--------------------------------------------------------------------------
      //
      //  Private Methods
      //
      //--------------------------------------------------------------------------

      _addListeners: function(handlers, handler){
        var evts = handler.events;
        var removers = handlers.removers || [];
        var that = this;
        if(evts){
          var newremovers = evts.map(function(name){
            return that.on(name, handlers.processEvent.bind(handlers));
          });
          handlers.removers = removers.concat(newremovers);
        }
      },

      _removeListeners: function(handlers){
        var removers = handlers && handlers.removers;
        if(removers){
          removers.forEach(function(r){
            r.remove();
          });
        }
      }
  });
  return GestureManager;
});
