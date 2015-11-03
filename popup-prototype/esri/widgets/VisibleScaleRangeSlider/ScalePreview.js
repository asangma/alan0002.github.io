define([
    "dijit/_TemplatedMixin",
    "dijit/_WidgetBase",

    "../../core/declare",
    "dojo/dom-style",

    "dojo/i18n!../../nls/jsapi",

    "dojo/text!./templates/ScalePreview.html"
  ],
  function (
    TemplatedMixin, WidgetBase,
    declare, domStyle,
    nlsJsapi,
    template
  ) {
    var ScalePreview = declare([WidgetBase, TemplatedMixin], {

      declaredClass: "esri.widgets.VisibleScaleRangeSlider.ScalePreview",

      baseClass: "esriScalePreview",

      templateString: template,

      labels: nlsJsapi.widgets.visibleScaleRangeSlider,

      css: {
        header: "esriHeader",
        thumbnail: "esriThumbnail"
      },

      source: null,

      _setSourceAttr: function (source) {
        if (this.source === source) {
          return;
        }

        this._set("source", source);
        domStyle.set(this.dap_scalePreviewThumbnail, "backgroundImage", source);
      },

      backgroundPosition: null,

      _setBackgroundPositionAttr: function (backgroundPosition) {
        if (this.backgroundPosition === backgroundPosition) {
          return;
        }

        this._set("backgroundPosition", backgroundPosition);
        domStyle.set(this.dap_scalePreviewThumbnail, "backgroundPosition", backgroundPosition);
      }
    });

    return ScalePreview;
  });
