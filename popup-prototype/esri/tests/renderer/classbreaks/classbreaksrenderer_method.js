dojo.provide("esri.tests.renderer.classbreaks.classbreaksrenderer_method");



doh.registerGroup("renderer.classbreaks.classbreaksrenderer_method", [{
    name: "classbreaksrenderer_method",
    timeout: 3000,
    runTest: function(){
		 
		  	var graphicsLayer = new esri.layers.GraphicsLayer();
			
			var defaultSymbol = new esri.symbol.SimpleFillSymbol().setStyle(esri.symbol.SimpleFillSymbol.STYLE_NULL);
			var classrenderer = new esri.renderer.ClassBreaksRenderer(defaultSymbol, "POP07_SQMI");
					
			
			classrenderer.addBreak({minPop:0,maxPop:25,symbol:new esri.symbol.SimpleFillSymbol().setColor(new dojo.Color([56, 168, 0,0.5])),
			label:"break1",description:"this is group1"});
			classrenderer.addBreak({minPop:25,maxPop:75,symbol:new esri.symbol.SimpleFillSymbol().setColor(new dojo.Color([139, 209, 0,0.5])),
			label:"break2",description:"this is group2"});
			
			graphicsLayer.setRenderer(classrenderer);
			
			doh.assertEqual("POP07_SQMI",graphicsLayer.renderer.attributeField);
			console.log(graphicsLayer.renderer.infos);
			doh.assertEqual(0,classrenderer.infos[0].minPop);
			doh.assertEqual("simplefillsymbol",classrenderer.infos[0].symbol.type);
			doh.assertEqual("break2",classrenderer.infos[1].label);
			doh.assertEqual("this is group2",classrenderer.infos[1].description);
			
    	
	}
	
	
}]);
