define([
    "dojo/on",
    "dojo/dom-style",
    "dojo/has"
  ],
  function (
    on, style, has
  ) {

    var domUtils = {

      //TODO: Replace with show/hide/toggle once introduced in dojo 0.9
      show: function (/* HTMLElement or dijit/_WidgetBase */ node) {
        node = domUtils.getNode(node);

        if (node) {
          node.style.display = "block";
        }
      },

      getNode: function (/* HTMLElement or dijit/_WidgetBase */ nodeOrWidget) {
        return (nodeOrWidget && nodeOrWidget.domNode) || nodeOrWidget;
      },

      hide: function (/* HTMLElement or dijit/_WidgetBase */ node) {
        node = domUtils.getNode(node);

        if (node) {
          node.style.display = "none";
        }
      },

      toggle: function (/* HTMLElement or dijit/_WidgetBase */ node) {
        node = domUtils.getNode(node);

        if (node) {
          node.style.display = node.style.display === "none" ? "block" : "none";
        }
      },

      documentBox: (has("ie") <= 8) ?
                   {
                     w: document.documentElement.clientWidth,
                     h: document.documentElement.clientHeight
                   } :
                   {
                     w: window.innerWidth,
                     h: window.innerHeight
                   },

      setScrollable: function (/* HTMLElement or dijit/_WidgetBase */ node) {
        node = this.getNode(node);

        if (!node) {
          return;
        }

        var previousX = 0, previousY = 0, sWidth = 0, sHeight = 0, cWidth = 0, cHeight = 0;

        return [
          on(node, "touchstart", function (evt) {
            previousX = evt.touches[0].screenX;
            previousY = evt.touches[0].screenY;

            sWidth = node.scrollWidth;
            sHeight = node.scrollHeight;
            cWidth = node.clientWidth;
            cHeight = node.clientHeight;
          }),

          on(node, "touchmove", function (evt) {
            // Prevent page from scrolling
            evt.preventDefault();

            var child = node.firstChild;
            if (child instanceof Text) {
              child = node.childNodes[1];
            }
            var currentX = child._currentX || 0,
                currentY = child._currentY || 0;

            currentX += (evt.touches[0].screenX - previousX);
            if (currentX > 0) {
              currentX = 0;
            }
            else if (currentX < 0 && (Math.abs(currentX) + cWidth) > sWidth) {
              currentX = -1 * (sWidth - cWidth);
            }
            child._currentX = currentX;

            currentY += (evt.touches[0].screenY - previousY);
            if (currentY > 0) {
              currentY = 0;
            }
            else if (currentY < 0 && (Math.abs(currentY) + cHeight) > sHeight) {
              currentY = -1 * (sHeight - cHeight);
            }
            child._currentY = currentY;

            style.set(child, {
              "-webkit-transition-property": "-webkit-transform",
              "-webkit-transform": "translate(" + currentX + "px, " + currentY + "px)"
            });

            previousX = evt.touches[0].screenX;
            previousY = evt.touches[0].screenY;
          })
        ];
      }
    };

    return domUtils;
  });
