/*jslint browser: true, continue: true, eqeq: true, nomen: true, plusplus: true, regexp: true, unparam: true, sloppy: true, todo: true, vars: true, white: true */
/*global define */
define([
  "require",

  "../../../core/declare",

  "dojo/Deferred",

  "../../../request",
  
  "../../../core/Accessor",
  "../../../core/Promise"
],
function(
  require,
  declare,
  Deferred,
  request,
  Accessor, Promise
) {

  var AutoController = declare([Accessor, Promise], {

    //--------------------------------------------------------------------------
    //
    //  Lifecycle
    //
    //--------------------------------------------------------------------------
    
    initialize: function() {
      var self = this;
      var promise = this.layer
          .then(function() {
            // TODO
            // Add support for hosted FS based on exceedslimit statistic.
            return self
              ._getFeatureCount()
              .then(function(response) {
                var mode = self._canUseSnapshot(response && response.count) ? 0 : 1;
                return self._createController(mode);
              });
          })
          .then(function(controller) {
            self.activeController = controller;
          });
      this.addResolvingPromise(promise);
    },

    //--------------------------------------------------------------------------
    //
    //  Properties
    //
    //--------------------------------------------------------------------------

    controllerModulePaths: {
      "0": "./SnapshotController",
      "1": "./OnDemandController"
    },

    //--------------------------------------------------------------------------
    //
    //  Private functions
    //
    //--------------------------------------------------------------------------

    _getFeatureCount: function() {
      // Execute query for count using layer's current filters.
      var layer = this.layer,
          timeDef = layer.timeDefinition;

      var countRequest = request({
        url: layer.graphicsSource.parsedUrl.path + "/query",
        content: {
          f: "json",
          where: layer.definitionExpression || "1=1",
          timeExtent: timeDef && timeDef.toJSON(),
          returnCountOnly: true
        },
        callbackParamName: "callback"
      });

      return countRequest;
    },

    _canUseSnapshot: function(count) {
      var layer = this.layer,
        type = layer.geometryType;

      // Use snapshot controller if count <= maxXyzCountForAuto.
      // Else, use on-demand controller.
      return (
        (
          type === "esriGeometryPolyline" ||
            type === "esriGeometryPolygon" ||
            type === "esriGeometryMultipoint"
          // TODO
          // xyFootprints of multipatch feature layer
          )
          && count <= layer.maxRecordCountForAuto
        )
        || (type === "esriGeometryPoint" && count <= layer.maxPointCountForAuto);
    },

    _createController: function(mode) {
      var dfd = new Deferred(),
          modulePath = this.controllerModulePaths[mode];

      if (modulePath) {
        require(
          [ modulePath ],

          function(ControllerClass) {
            var controller = new ControllerClass({
              layer:     this.layer,
              layerView: this.layerView
            });

            controller.then(
              function() {
                dfd.resolve(controller);
              },

              function(err) {
                dfd.reject(err);
              }
            );
          }.bind(this)
        );
      }
      else {
        dfd.reject(
          new Error("Module path not found for controller type: \"" + this.mode + "\"")
        );
      }

      return dfd.promise;
    }
  });

  

  return AutoController;
});
