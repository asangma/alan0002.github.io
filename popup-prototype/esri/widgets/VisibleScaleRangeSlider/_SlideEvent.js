define([
  "dojo/_base/array",
  "../../core/declare"
],
function(
  array, declare
) {

  return declare(null, {

    declaredClass: "esri.dijit.VisibleScaleRangeSlider._SlideEvent",

    _events: [
      "onMouseMove",
      "onFirstMove",
      {
        name: "onMoveStop",
        hookTo: "destroy" // dojo/dnd/Mover calls onMoveStop on the host not on itself
      }
      // can't do onMoveStart since it is called in dojo/dnd/Mover's constructor
    ],

    postCreate: function() {
      this.inherited(arguments);

      this._extendMover(this._movable);
      this._extendMover(this._movableBar, "rangebar");
      this._extendMover(this._movableMax, "max");
    },

    _extendMover: function(movable, eventSuffix) {
      if (!movable) {
        return;
      }

      var mover     = movable.mover,
          events    = this._events,
          extension = {};

      array.forEach(events, function(event) {
        var hookTo,
            name,
            originalFunc,
            suffix,
            eventName,
            hijackerFunc,
            hookedFunc;

        if (typeof event === "object") {
          name = event.name;
          hookTo = event.hookTo;
        }
        else {
          name = event;
        }

        originalFunc = mover.prototype[name] || function() {};
        suffix = eventSuffix || "";
        eventName = "slide" + suffix + "-" + name.toLowerCase();  // TODO: make eventName customizable
        hijackerFunc = function() {
          originalFunc.apply(this, arguments);

          this.widget.emit(eventName, {
            movable: movable
          });
        };

        if (hookTo) {
          hookedFunc = mover.prototype[hookTo];

          extension[hookTo] = function() {
            hookedFunc.apply(this, arguments);
            hijackerFunc.apply(this, arguments);
          };
        }

        extension[name] = hijackerFunc;
      });

      mover.extend(extension);
    }

  });
});
