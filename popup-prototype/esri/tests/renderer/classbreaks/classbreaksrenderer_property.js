dojo.provide("esri.tests.renderer.classbreaks.classbreaksrenderer_property");




doh.registerGroup("renderer.classbreaks.classbreaksrenderer_property", [{
    name: "classbreaksrenderer_property",
    timeout: 3000,
    runTest: function(){
		 
		  	var graphicsLayer = new esri.layers.GraphicsLayer();
			
			var defaultSymbol = new esri.symbol.SimpleFillSymbol().setStyle(esri.symbol.SimpleFillSymbol.STYLE_NULL);
			var classrenderer = new esri.renderer.ClassBreaksRenderer(defaultSymbol, "POP07_SQMI");
			classrenderer.addBreak(0,25,new esri.symbol.SimpleFillSymbol().setColor(new dojo.Color([56, 168, 0,0.5])));
        	classrenderer.addBreak(25,75,new esri.symbol.SimpleFillSymbol().setColor(new dojo.Color([139, 209, 0,0.5])));
        	classrenderer.addBreak(75,175,new esri.symbol.SimpleFillSymbol().setColor(new dojo.Color([255,255,0,0.5])));
        	classrenderer.addBreak(175,400,new esri.symbol.SimpleFillSymbol().setColor(new dojo.Color([255,128,0,0.5])));
        	classrenderer.addBreak(400,Infinity,new esri.symbol.SimpleFillSymbol().setColor(new dojo.Color([255,0,0,0.5])));
			
			var infos = [{minPop:10,maxPop:35,symbol:new esri.symbol.SimpleFillSymbol().setColor(new dojo.Color([56, 168, 0,0.5])),
			label:"break1",description:"this is group1"},
			{minPop:35,maxPop:85,symbol:new esri.symbol.SimpleFillSymbol().setColor(new dojo.Color([139, 209, 0,0.5])),
			label:"break2",description:"this is group2"},
			];
			
			classrenderer.infos = infos;
			graphicsLayer.setRenderer(classrenderer);
			
			doh.assertEqual("POP07_SQMI",graphicsLayer.renderer.attributeField);
			doh.assertEqual([[0, 25], [25, 75], [75, 175], [175, 400], [400, Infinity]],graphicsLayer.renderer.breaks);
			doh.assertEqual(10,classrenderer.infos[0].minPop);
			doh.assertEqual("simplefillsymbol",classrenderer.infos[0].symbol.type);
			doh.assertEqual("break2",classrenderer.infos[1].label);
			doh.assertEqual("this is group2",classrenderer.infos[1].description);
			
    	
	}
	
	
}]);
