dojo.provide("esri.tests.renderer.simple.simplerenderer");



doh.registerGroup("renderer.simple.simplerenderer", [{
    name: "simplerenderer",
    timeout: 3000,
    runTest: function(){
		 
		  	var graphicsLayer = new esri.layers.GraphicsLayer();
			
			var defaultSymbol = new esri.symbol.SimpleFillSymbol().setStyle(esri.symbol.SimpleFillSymbol.STYLE_NULL);
			var simpleRenderer = new esri.renderer.SimpleRenderer(defaultSymbol);
			simpleRenderer.label= "TestLabel";
			simpleRenderer.description = "This is for testing."
			graphicsLayer.setRenderer(simpleRenderer);
				
			doh.assertEqual("simplefillsymbol",graphicsLayer.renderer.symbol.type);
			doh.assertEqual("none",graphicsLayer.renderer.symbol.style);
			
			doh.assertEqual("TestLabel",graphicsLayer.renderer.label);
			doh.assertEqual("This is for testing.",graphicsLayer.renderer.description);
  
    	
	}
	
	
}]);
