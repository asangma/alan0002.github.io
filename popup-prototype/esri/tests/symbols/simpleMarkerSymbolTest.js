dojo.provide("esri.tests.symbols.simpleMarkerSymbolTest");

dojo.require("esri.symbol");

var simpleMarkerSymbol;

doh.registerGroup("symbols.simpleMarkerSymbolTest",
	[
        {
            name: "testGetStyle",
            timeout: 3000,
            runTest: function(t)
            {                   
                t.assertEqual(esri.symbol.SimpleMarkerSymbol.STYLE_SQUARE, simpleMarkerSymbol.style);                            
            }
        },
        {
            name: "testSetStyle",
            timeout: 3000,
            runTest: function(t)
            {                   
			    simpleMarkerSymbol.setStyle(esri.symbol.SimpleMarkerSymbol.STYLE_DIAMOND);
                t.assertEqual(esri.symbol.SimpleMarkerSymbol.STYLE_DIAMOND, simpleMarkerSymbol.style);                            
            }
        },		
        {
            name: "testSize",
            timeout: 3000,
            runTest: function(t)
            {                   
                var size = simpleMarkerSymbol.size;
                t.assertEqual(size, 20);                            
            }
        },          		
        {
            name: "testGetOutline",
            timeout: 3000,
            runTest: function(t)
            {                   
                var outline = new esri.symbol.SimpleLineSymbol();
                t.assertEqual(new esri.symbol.SimpleLineSymbol(), simpleMarkerSymbol.outline);                            
            }
        }, 
        {
            name: "testSetOutline",
            timeout: 3000,
            runTest: function(t)
            {
				var outline = new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_DOT,
				                    new dojo.Color([255, 255, 0, 1]), 35);              
			    simpleMarkerSymbol.setOutline(outline);    
                t.assertEqual(outline, simpleMarkerSymbol.outline);                            
            }
        },		 		
        {
            name: "testColor",
            timeout: 3000,
            runTest: function(t)
            {                   
                var color = simpleMarkerSymbol.color;
                t.assertEqual(new dojo.Color([0, 0, 255, 1]), color);                            
            }
        },  	
		{
			name: "testtoJson",
			timeout: 3000,
			runTest: function(t)
			{
				var simpleMarkerSymbolJson = simpleMarkerSymbol.toJSON();
				var symbol2 = new esri.symbol.SimpleMarkerSymbol(simpleMarkerSymbolJson);
        var symbol2Json = symbol2.toJSON();

				t.assertEqual(dojo.toJson(simpleMarkerSymbolJson), dojo.toJson(symbol2Json));
			}
		}		
	],
		
	function()//setUp()
	{
        //initialize symbology
        simpleMarkerSymbol = new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_SQUARE, 20, new esri.symbol.SimpleLineSymbol(), new dojo.Color([0, 0, 255, 1]));             
	},
	
	function()//tearDown
	{
		simpleMarkerSymbol = null;
	}
);
