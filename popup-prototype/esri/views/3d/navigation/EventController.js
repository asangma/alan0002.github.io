define([
  "dojo/_base/array", 
  "../lib/glMatrix",
  "../../../core/watchUtils",
  "../webgl-engine/lib/Util",
  "./NavigationConstants"
], function (array, glMatrix, watchUtils, Util, NavigationConstants) {

  var EventController = function(view, controls) {
    // constants

    var IS_FIREFOX      = /Firefox/i.test(navigator.userAgent);
    var DOUBLE_CLICK_INTERVAL = 200;

    var MOMENTUM_PAN_INTERVAL = 100;

    var KEYMAP = {
      37: "panLeft",       // left arrow
      38: "panForward",      // up arrow
      39: "panRight",      // right arrow
      40: "panBackward",     // backward arrow
      66: "lookAround",      // B
      74: "panDown",         // J
      78: "lookNorth",       // N
      80: "lookDown",      // P
      85: "panUp"        // U
    };

    // private fields
    var oriControls;

    var vec2d = glMatrix.vec2d,
        vec3d = glMatrix.vec3d,
        assert = Util.assert;

    // initialization
    var touchEvents = ["touchmove", "touchstart", "touchend", "touchcancel"];
    var container = null;

    this.connect = function() {
      container = view.get("canvas");

      if (!container) {
        return;
      }

      array.forEach(touchEvents, function (e) { container.addEventListener(e, touchHandler, true); });

      container.addEventListener("mousedown", mouseDown, false);
      container.addEventListener(IS_FIREFOX ? "DOMMouseScroll": "mousewheel", mouseWheel, false);
      container.addEventListener( "contextmenu", contextMenu, false );

      container.setAttribute("tabindex","1");
      container.addEventListener("keydown", keyDown, false);
      container.addEventListener("keyup", keyUp, false);
    };

    this.disconnect = function() {
      if (!container) {
        return;
      }

      array.forEach(touchEvents, function (e) { container.removeEventListener(e, touchHandler, true); });

      container.removeEventListener("mousedown", mouseDown, false);
      container.removeEventListener(IS_FIREFOX ? "DOMMouseScroll": "mousewheel", mouseWheel, false);
      container.removeEventListener( "contextmenu", contextMenu, false );

      container.removeEventListener("keydown", keyDown, false);
      container.removeEventListener("keyup", keyUp, false);

      container = null;
    };

    var canvasWatch = watchUtils.init(view, "canvas", function() {
      this.disconnect();
      this.connect();
    }.bind(this));

    var navigation = view.navigation;

    // public interface
    this.destroy = function() {
      this.disconnect();
      canvasWatch.remove();
    };

    this.setControls = function(controls_) {
      if (oriControls) {
        // something (like a pressed key) is currently overriding the controls
        oriControls = controls_;
      } else {
        controls = controls_;
      }
    };

    this.getControls = function() {
      return controls;
    };

    // mouse events

    var drag = 0;
    var button = 0;
    var lastClick = 0;
    var mouseDownCoords = null;
    var dragEndTimeout;

    var tmpCoords = vec2d.create();

    function mouseMove(event) {
      event.preventDefault();

      if (drag === 0) {
        return;
      }

      if (typeof event.movementX !== undefined &&
          typeof event.movementY !== undefined &&
          event.movementX === 0 && event.movementY === 0) {
        return;
      }

      var coords = getCoordinates(event, tmpCoords);
      var state = drag - 1;

      switch (button) {
        case 1:
          dispatch("mouseDragLeft", coords, state);
          break;
        case 2:
          dispatch("mouseDragMiddle", coords, state);
          break;
        case 3:
        case 0:
          dispatch("mouseDragRight", coords, state);
          break;
      }

      if (drag === 1 && !(Math.abs(coords[0]-mouseDownCoords[0]) === 0 && Math.abs(coords[1]-mouseDownCoords[1]) === 0) ) {
        drag = 2;
      } else if (drag === 3) {
        if (dragEndTimeout) {
          window.clearTimeout(dragEndTimeout);
        }

        drag = 0;
        button = 0;

        document.removeEventListener("mousemove", mouseMove, true);
        document.removeEventListener("mouseup", mouseUp, true);
      }
    }

    function mouseDown(event) {
      event.preventDefault();
      
      container.focus();
      mouseDownCoords = getCoordinates(event);
      
      if (dragEndTimeout) {
        window.clearTimeout(dragEndTimeout);
      }

      navigation.stop();

      drag = 1;
      button = event.which;

      if (button === 1) {
        if (lastClick > 0) {
          dispatch("mouseClickDouble", getCoordinates(event, tmpCoords), 2);
          lastClick = 0;
        } else {
          lastClick = Date.now();
        }
      }
      
      document.addEventListener("mousemove", mouseMove, true);
      document.addEventListener("mouseup", mouseUp, true);
    }

    function mouseUp(event) {
      event.preventDefault();

      var coords = getCoordinates(event, tmpCoords);

      if (drag === 1 && button === 1) {
        if (lastClick > 0) {
          setTimeout(function() {
            if (lastClick > 0) {
              dispatch("mouseClick", getCoordinates(event, tmpCoords));
              lastClick = 0;
            }
          }, Math.max(DOUBLE_CLICK_INTERVAL - (Date.now() - lastClick), 0));
        }
      } else {
        lastClick = 0;
      }

      if (drag === 2) {
        drag = 3;

        dragEndTimeout = setTimeout(function() {
            if (drag === 3) {
              switch (button) {
                case 1:
                  dispatch("mouseDragLeft", coords, 2);
                  break;
                case 2:
                  dispatch("mouseDragMiddle", coords, 2);
                  break;
                case 3:
                case 0:
                  dispatch("mouseDragRight", coords, 2);
                  break;
              }
            }

            document.removeEventListener("mousemove", mouseMove, true);
            document.removeEventListener("mouseup", mouseUp, true);

            drag = 0;
            button = 0;
          },

          MOMENTUM_PAN_INTERVAL
        );
      } else {
        document.removeEventListener("mousemove", mouseMove, true);
        document.removeEventListener("mouseup", mouseUp, true);

        drag = 0;
        button = 0;
      }
    }

    var tmpCoords2 = vec2d.create();

    function mouseWheel(event) {
      event.preventDefault();

      if (typeof event.wheelDeltaY === undefined || event.wheelDeltaY !== 0) {
        //normalize scroll speed cross-browser. Chrome: 120/click, FF: -1/click * (windows scroll lines)
        dispatch("mouseWheel", event.detail ? event.detail * (-40) : event.wheelDelta, getCoordinates(event, tmpCoords2));
      }
    }

    function touchHandler(event) {
      event.stopPropagation();
      
      var touches = event.changedTouches,
          first = touches[0],
          type = "";
      
      if (event.touches.length > 1) {
        return;
      }

      var simulatedEvent;

      switch (event.type) {
        case "touchstart":
          type = "mousedown";
          break;
        case "touchmove":
          type = "mousemove";
          break;
        case "touchend":
          type = "mouseup";

          simulatedEvent = document.createEvent("MouseEvent");
          simulatedEvent.initMouseEvent("click", true, true, window, 1, first.screenX, first.screenY, first.clientX, first.clientY,
            false, false, false, false, 0/* left */, null);

          first.target.dispatchEvent(simulatedEvent);
          event.preventDefault();
          break;
        default:
          return;
      }

      simulatedEvent = document.createEvent("MouseEvent");

      simulatedEvent.initMouseEvent(type, true, true, window, 1, first.screenX, first.screenY, first.clientX, first.clientY, false,
        false, false, false, 0/* left */, null);
      
      first.target.dispatchEvent(simulatedEvent);
      event.preventDefault();
    }

    function contextMenu(event) {
      event.preventDefault();
    }

    // key events

    function keyDown(event) {
      if (event.shiftKey || event.ctrlKey || event.altKey || event.metaKey) {
        return;
      }

      var fun = KEYMAP[event.keyCode];

      if (fun !== undefined) {
        keyDownOperations[fun]();
        event.preventDefault();
      }
    }

    function keyUp(event) {
      var fun = KEYMAP[event.keyCode];

      if (fun !== undefined) {
        fun = keyUpOperations[fun];
        
        if (fun !== undefined) {
          fun();
        }
        
        event.preventDefault();
      }
    }

    // WebScene operations

    var operations = {

      select : function(coords) {
        if (!view.get("ready")) {
          return;
        }

        view._stage._select(coords);
      },

      frame : function(coords, padding) {
        if (!view.get("ready")) {
          return;
        }

        var pt = vec3d.create();
        var pickResult = view._stage._pick(coords).getMinResult();
        var object = pickResult.object;
        var camera;

        if (object) {
          var layer = object.getParentLayer();

          if (layer && layer.getInteraction() === "PICKABLE") {
            var bs = object.calcFacerangeBoundingSphere(pickResult.triangleNr);
            camera = navigation.targetCamera;
            navigation.frame(bs.center, camera.computeDistanceFromRadius(bs.radiusScaled,1.1));
            return;
          }
        }

        if (pickResult.getIntersectionPoint(pt)) {
          camera = navigation.targetCamera;
          navigation.frame(pt, 0.66 * camera.distance);
        }
      },

      pan : function(coords, state) {
        switch(state) {
          case 0: navigation.pan.begin(coords); break;
          case 1: navigation.pan.update(coords); break;
          case 2: navigation.pan.end(coords); break;
          default: assert(false);
        }
      },

      tumble : function(coords, state) {
        switch(state) {
          case 0: navigation.rotate.begin(coords, NavigationConstants.Rotate.PivotPoint.POI); break;
          case 1: navigation.rotate.update(coords, NavigationConstants.Rotate.PivotPoint.POI); break;
          case 2: navigation.rotate.end(coords); break;
          default: assert(false);
        }
      },

      zoom : function(coords, state) {
        switch(state) {
          case 0: navigation.zoom.begin(coords); break;
          case 1: navigation.zoom.update(coords); break;
          case 2: navigation.zoom.end(coords); break;
          default: assert(false);
        }
      },

      zoomStep : function(scroll, coords) {
        navigation.zoom.stepScreen(scroll, coords);
      },

      lookAround: function(coords, state) {
        switch(state) {
          case 0: navigation.rotate.begin(coords, NavigationConstants.Rotate.PivotPoint.EYE); break;
          case 1: navigation.rotate.update(coords, NavigationConstants.Rotate.PivotPoint.EYE); break;
          case 2: navigation.rotate.end(coords); break;
          default: assert(false);
        }
      }
    };

    var Direction = NavigationConstants.Pan.Direction;

    var keyDownOperations = {
      panLeft: function() {
        navigation.pan.beginContinuous(Direction.LEFT);
      },
      
      panRight: function() {
        navigation.pan.beginContinuous(Direction.RIGHT);
      },
      
      panForward: function() {
        navigation.pan.beginContinuous(Direction.FORWARD);
      },
      
      panBackward: function() {
        navigation.pan.beginContinuous(Direction.BACKWARD);
      },
      
      panUp: function() {
        navigation.pan.beginContinuous(Direction.UP);
      },
      
      panDown: function() {
        navigation.pan.beginContinuous(Direction.DOWN);
      },
      
      lookAround: function() {
        if (!oriControls) {
          oriControls = controls;
          controls = EventController.LOOK_AROUND;
        }
      },
      
      lookNorth: function() {
        view.animateTo({
          heading: 0
        });
      },
      
      lookDown: function() {
        view.animateTo({
          tilt: 0
        });
      }
    };

    var keyUpOperations = {
      panLeft: function() {
        navigation.pan.endContinuous(Direction.LEFT);
      },
      
      panRight: function() {
        navigation.pan.endContinuous(Direction.RIGHT);
      },
      
      panForward: function() {
        navigation.pan.endContinuous(Direction.FORWARD);
      },
      
      panBackward: function() {
        navigation.pan.endContinuous(Direction.BACKWARD);
      },
      
      panUp: function() {
        navigation.pan.endContinuous(Direction.UP);
      },
      
      panDown: function() {
        navigation.pan.endContinuous(Direction.DOWN);
      },
      
      lookAround: function() {
        if (oriControls) {
          controls = oriControls;
          oriControls = undefined;
        }
      }
    };

    // helpers

    function getCoordinates(event, result) {
      if (!result) {
        result = vec2d.create();
      }

      var rect = container.getBoundingClientRect();

      result[0] = event.pageX - rect.left;
      result[1] = rect.height - (event.pageY - rect.top);

      return result;
    }

    function dispatch(event, arg0, arg1) {
      var fun = controls[event];

      if (fun !== undefined) {
        operations[fun](arg0, arg1);
      }
    }
  };

  EventController.PAN  = {
    "mouseClick": "select",
    "mouseClickDouble": "frame",
    "mouseDragLeft": "pan",
    "mouseDragRight": "tumble",
    "mouseDragMiddle": "zoom",
    "mouseWheel": "zoomStep"
  };

  EventController.TUMBLE = {
    "mouseClick": "select",
    "mouseClickDouble": "frame",
    "mouseDragLeft": "tumble",
    "mouseDragRight": "pan",
    "mouseDragMiddle": "zoom",
    "mouseWheel": "zoomStep"
  };

  EventController.LOOK_AROUND  = {
    "mouseClick": "select",
    "mouseClickDouble": "frame",
    "mouseDragLeft": "lookAround",
    "mouseDragRight": "tumble",
    "mouseDragMiddle": "pan",
    "mouseWheel": "zoomStep"
  };

  EventController.OLD  = {
    "mouseClick": "select",
    "mouseClickDouble": "frame",
    "mouseDragMiddle": "tumble",
    "mouseDragRight": "pan",
    "mouseWheel": "zoomStep"
  };

  EventController.PRO_PAN  = {
    "mouseClick": "select",
    "mouseClickDouble": "frame",
    "mouseDragLeft": "pan",
    "mouseDragMiddle": "tumble",
    "mouseDragRight": "zoom",
    "mouseWheel": "zoomStep"
  };

  EventController.PRO_TUMBLE = {
    "mouseClick": "select",
    "mouseClickDouble": "frame",
    "mouseDragLeft": "tumble",
    "mouseDragMiddle": "pan",
    "mouseDragRight": "zoom",
    "mouseWheel": "zoomStep"
  };

  return EventController;

});
