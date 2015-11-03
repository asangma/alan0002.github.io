define([
  "dijit/Tooltip",

  "dojo/_base/array",
  "../core/declare",
  "dojo/_base/lang",
  "dojo/dom"
], function (
  Tooltip,
  array, declare, lang, dom
) {

  return declare(null, {

    declaredClass: "esri.widgets._Tooltip",

    _tooltips: null,

    constructor: function () {
      this._tooltips = [];
    },

    startup: function () {
      this.inherited(arguments);

      if (this._started) {
        return;
      }

      array.forEach(this._tooltips, function (tooltip) {
        tooltip.startup();
      });
    },

    destroy: function () {
      this.inherited(arguments);

      array.forEach(this._tooltips, function (tooltip) {
        tooltip.destroy();
      });

      this._tooltips = null;
    },

    createTooltips: function (tooltips) {
      array.forEach(tooltips, function (tooltip) {
        this.createTooltip(tooltip.node, tooltip.label);
      }, this);
    },

    createTooltip: function (node, label) {
      var connectId = this._getConnectId(node),
          tooltipParams,
          tooltip;

      if (!connectId) {
        return;
      }

      if (typeof label === "object") {
        tooltipParams = lang.mixin({}, label, {
          connectId: connectId
        });
      }
      else {
        tooltipParams = {
          connectId: connectId,
          label: label
        };
      }

      tooltip = new Tooltip(tooltipParams);

      if (this._started) {
        tooltip.startup();
      }

      this._tooltips.push(tooltip);
    },

    _getConnectId: function (node) {
      var connectId,
          connectNode;

      if (!node) {
        return;
      }

      if (lang.isArray(node)) {
        connectId = [];

        array.forEach(node, function (n) {
          connectNode = this._getNode(n);

          if (connectNode) {
            connectId.push(connectNode);
          }
        });

        if (connectId.length === 0) {
          // valid connectId is required
          return;
        }
      }
      else {
        connectId = this._getNode(node);

        if (!connectId) {
          // valid connectId is required
          return;
        }
      }

      return connectId;
    },

    _getNode: function (nodeOrWidget) {
      return dom.byId(nodeOrWidget.domNode || nodeOrWidget);
    },

    findTooltip: function (node) {
      var connectId = this._getNode(node),
          tooltips,
          totalTooltips,
          tooltip,
          matchFound;

      if (!node) {
        return;
      }

      tooltips = this._tooltips;
      totalTooltips = tooltips.length;

      for (var i = 0; i < totalTooltips; i++) {
        tooltip = tooltips[i];

        matchFound = lang.isArray(tooltip.connectId) ?
                     array.indexOf(tooltip.connectId, connectId) > -1 :
                     tooltip.connectId === connectId;

        if (matchFound) {
          return tooltip;
        }
      }
    }
  });
});
