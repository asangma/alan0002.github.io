define(
[
  "../core/declare"
],
function(declare) {

  var SymbolAger = declare(null, {
    declaredClass: "esri.renderer.SymbolAger",
    
    getAgedSymbol: function(symbol, graphic) {
      // to be implemented by subclasses
    },
    
    _setSymbolSize: function(symbol, size) {
      switch(symbol.type) {
        case "simplemarkersymbol":
          symbol.setSize(size);
          break;
        case "picturemarkersymbol":
          symbol.setWidth(size);
          symbol.setHeight(size);
          break;
        case "simplelinesymbol":
        case "cartographiclinesymbol":
          symbol.setWidth(size);
          break;
        case "simplefillsymbol":
        case "picturefillsymbol":
          if (symbol.outline) {
            symbol.outline.setWidth(size);
          }
          break;
      }
    }
  });

   

  return SymbolAger;
});
