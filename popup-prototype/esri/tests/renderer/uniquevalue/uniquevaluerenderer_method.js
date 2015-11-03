dojo.provide("esri.tests.renderer.uniquevalue.uniquevaluerenderer_method");



doh.registerGroup("renderer.uniquevalue.uniquevaluerenderer_method", [{
    name: "uniquevaluerenderer_method",
    timeout: 3000,
    runTest: function(){
		 
		  	var graphicsLayer = new esri.layers.GraphicsLayer();
			
			var defaultSymbol = new esri.symbol.SimpleFillSymbol().setStyle(esri.symbol.SimpleFillSymbol.STYLE_NULL);
			var uniquerenderer = new esri.renderer.UniqueValueRenderer(defaultSymbol, "STATE");
			
			uniquerenderer.addValue("California", new esri.symbol.SimpleFillSymbol().setColor(new dojo.Color([255,0,0,0.5])));
        	uniquerenderer.addValue("New York", new esri.symbol.SimpleFillSymbol().setColor(new dojo.Color([0,255,0,0.5])));
        	uniquerenderer.addValue("Georgia", new esri.symbol.SimpleFillSymbol().setColor(new dojo.Color([0,0,255,0.5])));
			uniquerenderer.removeValue("Georgia", new esri.symbol.SimpleFillSymbol().setColor(new dojo.Color([0,0,255,0.5])));
			
			graphicsLayer.setRenderer(uniquerenderer);
			
			doh.assertEqual("STATE",graphicsLayer.renderer.attributeField);
			doh.assertEqual(["California", "New York"],graphicsLayer.renderer.values);
		  
    	
	}
	
	
}]);
