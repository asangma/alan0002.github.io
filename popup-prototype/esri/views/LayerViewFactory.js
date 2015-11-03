define([
  "dojo/_base/lang",
  
  "dojo/Deferred",
  "dojo/when",

  "../core/Accessor",
  "../core/Scheduler",
  "../core/Collection"
], function(
  lang,
  Deferred, when,
  Accessor, Scheduler, Collection
) {

  /**
   * LayerViewFactory creates and destroy layerviews.
   */
  var LayerViewFactory = Accessor.createSubclass({

    declaredClass: "esri.views.LayerViewFactory",

    classMetadata: {
      properties: {
        working: {}
      }
    },

    constructor: function(view) {

      //--------------------------------------------------------------------------
      //
      //  Variables
      //
      //--------------------------------------------------------------------------
      
      var destroyingCache = new Collection(),
          createRequests  = new Collection(),
          createRequestIds = {},
          timer = null;

      var _viewReadyHandle = view.watch("ready", function(ready) {
        if (ready) {
          schedule();
        } else {
          purge();
        }
      });

      //--------------------------------------------------------------------------
      //
      //  Public Methods
      //
      //--------------------------------------------------------------------------

      /**
       * Schedule the creation of a layerview for a layer
       */
      this.create = function(layer) {
        var dfd;

        if (createRequestIds[layer.id]) {
          dfd = createRequestIds[layer.id];
        }
        else {
          createRequestIds[layer.id] = dfd = new Deferred();
          createRequests.addItem({
            dfd: dfd,
            layer: layer
          });
        }

        if (view.ready) {
          schedule();
        }
        return dfd.promise;
      };

      /**
       * Schedule the destruction of a layerview for a layer
       */
      this.dispose = function(layerView) {
        // console.log("[LayerViewFactory] remove layerview for layer id: " + layerView.layer.id);
        // Add the layerView in the destroying list.
        if (view.ready) {
          destroyingCache.addItem(layerView);
          schedule();
        } else {
          destroyLayerView(layerView);
        }
      };

      this.destroy = function() {
        purge();
        if (_viewReadyHandle) {
          _viewReadyHandle.remove();
          _viewReadyHandle = null;
        }
      };


      //--------------------------------------------------------------------------
      //
      //  Private Methods
      //
      //--------------------------------------------------------------------------

      var work = function() {
        timer = null;

        // 1 - Process all creation requests.
        createRequests.drain(function(request) {
          var dfd = request.dfd,
              layer = request.layer,
              layerView = destroyingCache.find(function(lv) {
                return layer === lv.layer;
              });

          // First look if the layerview for that layer is in the cache
          if (layerView) {
            // console.log("[LayerViewFactory] use cached layerview for layer id: " + layer.id);
            destroyingCache.removeItem(layerView);
            delete createRequestIds[layer.id];
            dfd.resolve(layerView);
          }

          // else create a new LayerView instance
          else {
            layer.load()
            .then(function(layer) {
              return layer.createLayerView(view);
            })
            .then(
              // lang.partial create closure to keep the dfd reference
              lang.partial(function(dfd, layerView) {
                // console.log("[LayerViewFactory] create layerview for layer id: " + layer.id);

                // layerView may be an override
                when(layerView, function(override) {
                  delete createRequestIds[layer.id];
                  if (override.layerView) {
                    layerView = override.layerView;
                  }
                  layer.emit("layer-view-create", {
                    view: view,
                    layerView: layerView
                  });
                  view.emit("layer-view-create", {
                    layer: layer,
                    layerView: layerView
                  });
                  dfd.resolve(layerView);
                }, function(error) {
                  delete createRequestIds[layer.id];
                  dfd.reject(error);
                });
              }, dfd),
              lang.partial(function(dfd, error) {
                delete createRequestIds[layer.id];
                dfd.reject(error);
              }, dfd)
            );
          }
        });

        // 2 - Destroy the remaining layerViews
        destroyingCache.drain(destroyLayerView);

        this.working = false;
      }.bind(this);

      /*
       * When View or Groups want to create or destroy,
       * the operation is delayed. This allows
       */
      var schedule = function() {
        if (!timer) {
          this.working = true;
          timer = Scheduler.schedule(work);
        }
      }.bind(this);

      var purge = function() {
        if (timer) {
          timer.remove();
          timer = null;
        }
        destroyingCache.drain(destroyLayerView);
        createRequests.drain(function(req) {
          req.dfd.reject();
        });
        this.working = false;
      }.bind(this);

      var destroyLayerView = function(layerView) {
        var layer = layerView.layer;
        delete createRequestIds[layer.id];
        // console.log("[LayerViewFactory] destroy layerview for layer id: " + layer.id);
        layer.destroyLayerView(view, layerView);
        layer.emit("layer-view-destroy", {
          view: view,
          layerView: layerView
        });
        view.emit("layer-view-destroy", {
          layer: layer,
          layerView: layerView
        });
      }.bind(this);
    },

    //--------------------------------------------------------------------------
    //
    //  Properties
    //
    //--------------------------------------------------------------------------

    /**
     * Indicates if the factory is either creating or des
     */
    working: false
    
  });

  return LayerViewFactory;

});
