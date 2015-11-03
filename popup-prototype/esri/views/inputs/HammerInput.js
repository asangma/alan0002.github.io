define([
    "../../core/libs/hammer/hammer",
    "../../core/declare",
    "dojo/aspect"
  ],
  function(Hammer, declare, aspect) {

    var defaultGestures = {
      pan: true,
      tap: {
        threshold: 5,
        posThreshold: 20
      },
      click: {
        event: "click",
        action: "tap",
        threshold: 5,
        posThreshold: 20,
        firesWith: ["tap"]
      },
      pinch: {
        threshold: 0.01,
        firesWith: ["pan", "rotate"]
      },
      rotate: {
        threshold: 5,
        firesWith: ["pan", "pinch"]
      },
      hold: {
        time: 350
      },
      swipe: {
        firesWith: ["pan"]
      },
      "double-tap": {
        event: "double-tap",
        action: "tap",
        taps: 2,
        threshold: 30,
        posThreshold: 30,
        firesWith: ["tap"]
      }
    };

    var strSplit = /\s*,\s*/g;

    var HammerGesture = declare(null,
      /** lends esri/views/inputs/HammerInput.prototype */
      {
        /**
         * Gesture event recognizers available, keyed by event names
         * @type {Object}
         */
        gestures: null,
        /**
         * The Hammer.Manager instance used to register & recognize gesture events
         * @type {Hammer.Manager}
         */
        manager: null,
        /**
         * @param  {DOMElement} el - the dom element the gesture input manager is attached to
         * @constructs
         */
        constructor: function(el) {
          // Prevent traditional mouse from dragging the image instead of map
          // TODO: investigate why hammer doesnt take care of this
          var isMS = navigator.msPointerEnabled,
              stopFunc = function(e) {
                e.preventDefault();
              };
          el.addEventListener("selectstart", stopFunc, false);
          el.addEventListener("dragstart", stopFunc, false);

          this.manager = new Hammer.Manager(el);
          this.gestures = {};
          aspect.after(this.manager, "add", this._emitAdd.bind(this.manager), true);
        },
        /**
         * Listen for gesture events
         * @param  {string} event - gesture event name
         * @param  {function} listener - the function to handle the event
         * @return {Object}  Object with a `remove` function to enable removal of the event listener.
         */
        on: function(event, listener) {
          var inMgmr = this.manager;
          var defGest = defaultGestures[event];

          if (strSplit.test(event)) {
            var that = this;
            
            event.split(strSplit).forEach(function(name) {
              that.on(name, listener);
            });
            return {
              remove: function() {
                inMgmr.off(event.replace(strSplit, " "), listener);
              }
            };
          }

          if (event != "input" && !inMgmr.get(event) && defGest) {
            this.addGesture({
              action: defGest.action || event,
              event: defGest.event || event,
              rules: defGest === true ? undefined : defGest
            });
          }

          if ((this.gestures && this.gestures[event]) || event == "input") {
            if (event == "input") {
              event = "hammer.input";
            }
            inMgmr.on(event, listener);
            var remover = {
              remove: function() {
                inMgmr.off(event, listener);
              }
            };
            return remover;
          }
          else {
            // console.warn("no such event/gesture, '" + event + "' exists.");
            return false;
          }
        },
        /**
         * Add or replace a gesture recognizer
         * @param {Object} options - the configurable options for a recognizer
         */
        addGesture: function(options) {
          if (!options) {
            return false;
          }
          var action = options.action,
            type = options.event,
            rules = options.rules,
            firesWith = rules && rules.firesWith,
            exclusiveTo = rules && rules.exclusiveTo;

          if (action == "hold") {
            action = "Press";
          }
          else {
            action = action && (action.slice(0, 1).toUpperCase() + action.slice(1));
          }

          if (Hammer[action] && typeof Hammer[action] == "function") {
            if (rules && type) {
              rules.event = type;
            }
            else if (type) {
              rules = {
                event: type
              };
            }
            var recognizer = new Hammer[action](rules);

            this.gestures[type || options.action] = recognizer;
            this.manager && this.manager.add(recognizer);

            //recognizeWith and requireFailure can only be registered on existing gestures
            aspect.around(recognizer, "recognizeWith", this._checkGestureLinks.bind(recognizer));
            aspect.around(recognizer, "requireFailure", this._checkGestureLinks.bind(recognizer));

            if (firesWith) {
              if (!Array.isArray(firesWith)) {
                firesWith = [firesWith];
              }
              recognizer.recognizeWith(firesWith);
            }
            if (exclusiveTo) {
              recognizer.requireFailure(exclusiveTo);
            }
            return true;
          } else {
            console.warn("no such action to base the new gesture on");
            return false;
          }
        },
        /**
         * Remove a gesture recognizer
         * @param  {string} type - name of the gesture event recognizer
         */
        removeGesture: function(type) {
          return this.manager && this.manager.remove(type);
        },
        /**
         * Reconfigure the recognizer for a gesture type
         * @param  {string} type - the gesture type
         * @param  {Object} options - the options to set on the recognizer
         */
        configureGesture: function(type, options) {
          return this.manager && this.manager.set(type, options);
        },
        _checkGestureLinks: function(addFunc) {
          var gesture = this,
            inMgmr = this.manager;

          addFunc = addFunc.bind(gesture);
          return (function(inMgmr) {
            return function checkCanLink(otherGesture) {
              var canLink = inMgmr && inMgmr.get(otherGesture);
              if (canLink || Array.isArray(otherGesture)) {
                addFunc(otherGesture);
              } else {
                var test = function testAdd(event) {
                  var newGest = event.gesture;
                  if (otherGesture == newGest.options.event) {
                    addFunc(otherGesture);
                    inMgmr.off("add", test);
                  }
                };
                inMgmr.on("add", test);
              }
            };
          })(inMgmr);
        },
        _emitAdd: function(gesture) {
          this.emit("add", {
            "gesture": gesture
          });
        }
      });

    return HammerGesture;
  });