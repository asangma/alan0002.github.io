define(
[
  "../core/declare",
  "./Renderer"
],
function(declare, Renderer) {

  var TemporalRenderer = declare(Renderer, {
    declaredClass: "esri.renderer.TemporalRenderer",

    constructor: function(observationRenderer, latestObservationRenderer, trackRenderer, observationAger) {
      this.observationRenderer = observationRenderer;
      this.latestObservationRenderer = latestObservationRenderer;
      this.trackRenderer = trackRenderer;
      this.observationAger = observationAger;
    },

    // Uses internal feature layer members: _getKind, _map
    getSymbol: function(graphic) {
      var featureLayer = graphic.getLayer(),
          renderer = this.getObservationRenderer(graphic),
          symbol = (renderer && renderer.getSymbol(graphic)),
          ager = this.observationAger;

      // age the symbol for regular observations
      if (
        featureLayer.timeInfo &&
        featureLayer._map.timeExtent &&
        (renderer === this.observationRenderer) &&
        ager && symbol
      ) {
        symbol = ager.getAgedSymbol(symbol, graphic);
      }

      return symbol;
    },

    getObservationRenderer: function(graphic) {
      return (graphic.getLayer()._getKind(graphic) === 0) ?
               this.observationRenderer :
               (this.latestObservationRenderer || this.observationRenderer);
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
      var retVal = {
        type: "temporal"
      };

      retVal.observationRenderer = this.observationRenderer.toJSON();
      if (this.latestObservationRenderer){
        retVal.latestObservationRenderer = this.latestObservationRenderer.toJSON();
      }
      if (this.trackRenderer){
        retVal.trackRenderer = this.trackRenderer.toJSON();
      }
      if (this.observationAger){
        retVal.observationAger = this.observationAger.toJSON();
      }
      return retVal;
    }
  });

  

  return TemporalRenderer;
});
