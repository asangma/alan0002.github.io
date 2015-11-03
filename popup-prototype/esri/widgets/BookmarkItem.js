define(
[
  "../core/declare",
  "dojo/_base/lang",
  "dojo/has", 
  "../kernel"
], function(
  declare, lang, has, esriKernel
) {
  var BMI = declare(null, {
    declaredClass: "esri.widgets.BookmarkItem",

    constructor: function (params) {
      this.name = params.name;
      this.extent = params.extent;
    },

    toJson: function() {
      try {
        throw new Error("toJson is deprecated, use toJSON instead");
      }
      catch (e) {
        console.warn(e.stack);
      }

      return this.toJSON();
    },

    toJSON: function() {
      var json = {};
      var extent = this.extent.toJSON();
      //Instead of using json.extent = this.extent.toJSON();
      //The following line of code is a workaround for desktop to recognize the json. 
      //CR220356 has details.
      json.extent = {spatialReference: extent.spatialReference, xmax: extent.xmax, xmin: extent.xmin, ymax: extent.ymax, ymin: extent.ymin};
      json.name = this.name;
      return json;
    }
  });

  

  return BMI;
});
