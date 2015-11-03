define([
  "./Canvas3DIconSymbol",
  "./Canvas3DObjectSymbol",
  "./Canvas3DLineSymbol",
  "./Canvas3DPathSymbol",
  "./Canvas3DFillSymbol",
  "./Canvas3DExtrudeSymbol",
  "./Canvas3DTextSymbol",

  "../../webgl-engine/lib/Util"
], function(Canvas3DIconSymbol, Canvas3DObjectSymbol, Canvas3DLineSymbol,
            Canvas3DPathSymbol, Canvas3DFillSymbol, Canvas3DExtrudeSymbol, Canvas3DTextSymbol,
            Util
) {
  var assert = Util.assert;

  var SymbolClasses = {
    "Icon": Canvas3DIconSymbol,
    "Object": Canvas3DObjectSymbol,
    "Line": Canvas3DLineSymbol,
    "Path": Canvas3DPathSymbol,
    "Fill": Canvas3DFillSymbol,
    "Extrude": Canvas3DExtrudeSymbol,
    "Text": Canvas3DTextSymbol
  };

  var Canvas3DSymbolFactory = {
    make: function(symbol, context, ignoreDrivers) {
      var SymbolClass = SymbolClasses[symbol.type];
      assert(SymbolClass, "unknown symbol type " + symbol.type);
      var canvas3DSymbol = new SymbolClass(symbol, context, ignoreDrivers);
      return canvas3DSymbol;
    }
  };

  return Canvas3DSymbolFactory;
});
