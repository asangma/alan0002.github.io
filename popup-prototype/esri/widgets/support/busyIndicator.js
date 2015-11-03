define([
    "dijit/registry",

    "dojo/_base/lang",
    "dojo/dom",
    "dojo/dom-construct",

    "dojox/widget/Standby",

    "require"
  ],
  function (
    registry,
    lang, dom, domConstruct,
    Standby,
    require
  ) {

    var busyIndicatorUtil = {

      _defaultStandbyParams: {
        image: require.toUrl("../images/loading-throb.gif"),
        color: "#fff",
        opacity: 0.75,
        duration: 200
      },

      // target required
      create: function (params) {
        var indicator;

        params = this._normalizeParams(params);

        if (!params) {
          return;
        }

        indicator = new Standby(busyIndicatorUtil._toStandbyParams(params));

        domConstruct.place(indicator.domNode, document.body);

        return busyIndicatorUtil._createHandle(indicator);
      },

      _normalizeParams: function (params) {
        var target;

        if (!params) {
          return;
        }

        if (params.target) {
          return params;
        }

        if (typeof params === "string") {
          var w = registry.byId(params);
          target = w ? w.domNode : dom.byId(params);
        }
        else if (params.domNode) {
          target = params.domNode;
        }
        else {
          target = dom.byId(params);
        }

        if (!target) {
          return;
        }

        return {
          target: target
        };
      },

      _toStandbyParams: function (params) {
        if (params.imageUrl) {
          params.image = params.imageUrl;
        }

        if (params.backgroundColor) {
          params.color = params.backgroundColor;
        }

        if (params.backgroundOpacity) {
          params.opacity = params.backgroundOpacity;
        }

        if (params.fadeDuration) {
          params.duration = params.fadeDuration;
        }

        return lang.mixin({}, busyIndicatorUtil._defaultStandbyParams, params);
      },

      _createHandle: function (indicator) {
        return {
          show: function () {
            if (indicator) {
              indicator.show();
            }
          },

          hide: function () {
            if (indicator) {
              indicator.hide();
            }
          },

          destroy: function () {
            if (indicator) {
              indicator.destroy();
              indicator = null;
            }
          }
        };
      }
    };

    return busyIndicatorUtil;
  });
