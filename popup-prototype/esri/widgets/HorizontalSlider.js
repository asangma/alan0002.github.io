define([
    "dijit/form/HorizontalRuleLabels",
    "dijit/form/HorizontalSlider",

    "../core/declare",
    "dojo/_base/lang",
    "dojo/has",

    "esri/kernel"
  ],
  function (
    HorizontalRuleLabels, HorizontalSlider,
    declare, lang, has,
    esriKernel
  ) {
    var EsriHorizontalSlider = declare("esri.widgets.HorizontalSlider", HorizontalSlider, {

      baseClass: "esriHorizontalSlider",

      showButtons: false,

      labels: null,

      constructor: function (params) {
        params = params || {};

        if (params.labels) {
          this.labels = params.labels;
        }
      },

      buildRendering: function () {
        this.inherited(arguments);

        if (this.labels) {
          var ruleLabels = new HorizontalRuleLabels({
            labels: this.labels
          });

          ruleLabels.placeAt(this.bottomDecoration);
        }
      }
    });

    

    return EsriHorizontalSlider;
  });
