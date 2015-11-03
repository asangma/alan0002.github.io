define(
[
  "../SimpleMarkerSymbol",
  "../PictureMarkerSymbol",
  "../SimpleLineSymbol",
  "../CartographicLineSymbol",
  "../SimpleFillSymbol",
  "../PictureFillSymbol",
  "../TextSymbol",
  "../PointSymbol3D","../LineSymbol3D", "../PolygonSymbol3D", "../MeshSymbol3D", "../LabelSymbol3D"
],
function(
  SimpleMarkerSymbol, PictureMarkerSymbol, 
  SimpleLineSymbol, CartographicLineSymbol, 
  SimpleFillSymbol, PictureFillSymbol, 
  TextSymbol,
  PointSymbol3D, LineSymbol3D, PolygonSymbol3D, MeshSymbol3D, LabelSymbol3D
) {
  
  var jsonUtils = {

    fromJson: function(json) {
      try {
        throw new Error("fromJson is deprecated, use fromJSON instead");
      }
      catch (e) {
        console.warn(e.stack);
      }

      return jsonUtils.fromJSON(json);
    },

    fromJSON: function(/*Object*/ json) {
      //Convert json representation to appropriate esri.symbol.* object
      var symbol = null;

      if (!json) {
        return null;
      }
          
      switch (json.type) {
        case "esriSMS":
          symbol = SimpleMarkerSymbol.fromJSON(json);
          break;
        case "esriPMS":
          symbol = PictureMarkerSymbol.fromJSON(json);
          break;
        case "esriTS":
          symbol = TextSymbol.fromJSON(json);
          break;
        case "esriSLS":
          if (json.cap !== undefined) {
            symbol = CartographicLineSymbol.fromJSON(json);
          }
          else {
            symbol = SimpleLineSymbol.fromJSON(json);
          }
          break;
        case "esriCLS":
          symbol = CartographicLineSymbol.fromJSON(json);
          break;
        case "esriSFS":
          symbol = SimpleFillSymbol.fromJSON(json);
          break;
        case "esriPFS":
          symbol = PictureFillSymbol.fromJSON(json);
          break;
        case "PointSymbol3D":
          symbol = PointSymbol3D.fromJSON(json);
          break;
        case "LineSymbol3D":
          symbol = LineSymbol3D.fromJSON(json);
          break;  
        case "PolygonSymbol3D":
          symbol = PolygonSymbol3D.fromJSON(json);
          break;            
        case "MeshSymbol3D":
          symbol = MeshSymbol3D.fromJSON(json);
          break;
        case "LabelSymbol3D":
          symbol = LabelSymbol3D.fromJSON(json);
          break;
      }
  
      return symbol;
    }
    
  };

  return jsonUtils;  
});
