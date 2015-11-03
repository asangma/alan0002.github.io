define([
  "../../../../core/declare",
  "../../support/PromiseLightweight",
  "./Canvas3DSymbolFactory",
  "./Canvas3DGraphicSet"
], function(declare, PromiseLightweight, Canvas3DSymbolFactory, Canvas3DGraphicSet) {
  var Canvas3DSymbolSet = declare(PromiseLightweight.Promise, {
    constructor: function(symbol, context, backgroundLayers) {
      this.symbol = symbol;
      var symbolLayers = symbol.symbolLayers,
        numBackgroundLayers = 0;
      if (backgroundLayers) {
        symbolLayers = backgroundLayers.concat(symbolLayers);
        numBackgroundLayers = backgroundLayers.length;
      }
      var numSymbolLayers = symbolLayers.length;
      this.childCanvas3DSymbols = new Array(symbolLayers.length);
      var layerOrder = context.layerOrder;
      var pendingSymbolPromises = 0;
      var validSymbols = 0;

      var allSymbolLayersProcessed = false;
      var symbolLoadedHandler = function(i, canvas3DSymbol) {
        if (canvas3DSymbol) {
          this.childCanvas3DSymbols[i] = canvas3DSymbol;
          validSymbols++;
        }
        pendingSymbolPromises--;
        if (allSymbolLayersProcessed && (pendingSymbolPromises < 1)) {
          if (validSymbols > 0) {
            this.resolve();
          }
          else {
            this.reject();
          }
        }
      };

      for (var i = 0; i < numSymbolLayers; i++) {
        var symbolLayer = symbolLayers[i];
        if (symbolLayer.enable === false) { // symbol is enabled by default (when enable == null)
          continue;
        }
        context.layerOrder = layerOrder + (1-(1+i)/numSymbolLayers);
        var isBackgroundLayer = i < numBackgroundLayers;
        var canvas3DSymbol = Canvas3DSymbolFactory.make(symbolLayer, context, isBackgroundLayer);
        if (canvas3DSymbol) {
          pendingSymbolPromises++;
          canvas3DSymbol.then(
            symbolLoadedHandler.bind(this, i, canvas3DSymbol), // success
            symbolLoadedHandler.bind(this, i, null)            // error
          );
        }
      }
      context.layerOrder = layerOrder; // restore original layer order
      allSymbolLayersProcessed = true;

      if (!this.isFulfilled() && (pendingSymbolPromises < 1)) {
        if (validSymbols > 0) {
          this.resolve();
        }
        else {
          this.reject();
        }
      }
    },

    createCanvas3DGraphic: function(graphic, overrides) {
      var canvas3DGraphics = new Array(this.childCanvas3DSymbols.length);
      for (var i = 0; i < this.childCanvas3DSymbols.length; i++) {
        var canvas3DSymbol = this.childCanvas3DSymbols[i];
        if (canvas3DSymbol) {
          canvas3DGraphics[i] = canvas3DSymbol.createCanvas3DGraphic(graphic, overrides);
        }
      }
      return new Canvas3DGraphicSet(graphic, this, canvas3DGraphics);
    },

    layerPropertyChanged: function(name, canvas3DGraphics) {
      var numSymbols = this.childCanvas3DSymbols.length;
      for (var i = 0; i < numSymbols; i++) {
        var symbolLayer = this.childCanvas3DSymbols[i];
        if (symbolLayer && !symbolLayer.layerPropertyChanged(name, canvas3DGraphics, i)) {
          return false;
        }
      }
      return true;
    },

    setDrawOrder: function(layerDrawOrder, dirtyMaterials) {
      var numSymbols = this.childCanvas3DSymbols.length;
      for (var i = 0; i < numSymbols; i++) {
        var canvas3DSymbol = this.childCanvas3DSymbols[i];
        if (canvas3DSymbol) {
          var order = layerDrawOrder + (1-(1+i)/numSymbols);
          canvas3DSymbol.setDrawOrder(order, dirtyMaterials);
        }
      }
    },

    destroy: function() {
      for (var i = 0; i < this.childCanvas3DSymbols.length; i++) {
        if (this.childCanvas3DSymbols[i]) {
          this.childCanvas3DSymbols[i].destroy();
        }
      }
    }
  });

  return Canvas3DSymbolSet;
});
