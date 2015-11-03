define([
  "dijit/popup"
], function (popup) {

  var stylerUtil = {

    bindSliderAndTextBox: function (slider, spinner) {
      slider.on("change", function (value) {
        spinner.set("value", value, false);
      });

      spinner.on("change", function (value) {
          var finalValue,
              constraints,
              min,
              max;

          if (isNaN(value)) {
            this.set("value", slider.get("value"), false);
            return;
          }

          constraints = this.get("constraints");
          min = constraints.min;
          max = constraints.max;

          finalValue = value > max ? max :
                       value < min ? min :
                       value;

          this.set("value", finalValue, false);
          slider.set("value", finalValue, false);
        }
      );
    },

    silentlyUpdateIntermediateChangingValueWidget: function (widget, value) {
      // workaround to prevent "change" event from firing when intermediateChanges = true
      widget.intermediateChanges = false;
      widget.set("value", value, false);
      widget.intermediateChanges = true;
    },

    ensureEnabledChildSelection: function (tabContainer) {
      var selectedChildWidget = tabContainer.selectedChildWidget || {},
          children,
          totalChildren;

      if (selectedChildWidget.disabled) {
        children = tabContainer.getChildren();
        totalChildren = children.length;

        for (var i = 0; i < totalChildren; i++) {
          if (!children[i].disabled) {
            tabContainer.selectChild(children[i]);
            break;
          }
        }
      }
    },

    enable: function(widget) {
      widget.set("disabled", false);
    },

    disable: function(widget) {
      widget.set("disabled", true);
    },

    popUp: function (editor, node) {
      var stylingCommitHandler,
          stylingStopHandler;

      stylingCommitHandler = editor.on("styling-commit", function () {
        stylingCommitHandler.remove();
        stylingStopHandler.remove();

        popup.close(editor);
      });

      stylingStopHandler = editor.on("styling-stop", function () {
        stylingCommitHandler.remove();
        stylingStopHandler.remove();

        popup.close(editor);
      });

      popup.open({
        popup: editor,
        around: node,
        orient: ["above"]
      });
    }

  };

  return stylerUtil;
});
