/* jshint forin: false */
define(["../../../core/declare",
  "./StreamDataLoader"
  ], function(declare, StreamDataLoader) {

    var StreamDataSupplier = declare(null, {
      _clientType: undefined,
      _loader: undefined,
      constructor: function(clientType, loader, addUrlTokenFunction) {
        this._clientType = clientType;
        this._loader = loader;
        this._addUrlTokenFunction = addUrlTokenFunction;
      },

      request: function(url, docType, options) {
        return this._loader.request(url, docType, this._clientType, options, this._addUrlTokenFunction);
      },
      isRequested: function(url) {
        return this._loader.isRequested(url);
      },
      cancelRequest: function(requestPromise) {
        this._loader.cancel(requestPromise);
      },
      getRequestedURLs: function() {
        return this._loader.getRequestedURLs(this._clientType);
      },
      cancelRequestsBulk: function(toCancel) {
        this._loader.cancelBulk(toCancel, this._clientType);
      }
    });

    return declare(null, {
      constructor: function(downloadSlotsPerType) {
        this._loader = new StreamDataLoader(downloadSlotsPerType);
      },

      destroy: function() {
        this._loader.destroy();
        this._loader = null;
      },

      hasPendingDownloads: function() {
        return this._loader.hasPendingDownloads();
      },

      makeSupplier: function(clientType, addUrlTokenFunction) {
        return new StreamDataSupplier(clientType, this._loader, addUrlTokenFunction);
      }
    });
  }
);
