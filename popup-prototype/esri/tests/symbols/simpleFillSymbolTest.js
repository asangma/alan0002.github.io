dojo.provide("esri.tests.symbols.simpleFillSymbolTest");

dojo.require("esri.symbol");

var symbol;

doh.registerGroup("symbols.simpleFillSymbolTest",
	[
        {
            name: "testStyle",
            timeout: 3000,
            runTest: function(t)
            {                   
                var style = symbol.style;
                t.assertEqual(esri.symbol.SimpleFillSymbol.STYLE_SOLID, style);                            
            }
        },
        {
            name: "testColor",
            timeout: 3000,
            runTest: function(t)
            {                   
                var color = symbol.color;
                t.assertEqual(new dojo.Color([255, 0, 0, 1]), color);                            
            }
        },  
        {
            name: "testOutline",
            timeout: 3000,
            runTest: function(t)
            {                   
                var outline = new esri.symbol.SimpleLineSymbol();
                t.assertEqual(outline, new esri.symbol.SimpleLineSymbol());                            
            }
        },  
        {
            name: "testJson",
            timeout: 3000,
            runTest: function(t)
            {                                  
                var symbolJson = symbol.toJSON();

                var symbol2 = new esri.symbol.SimpleFillSymbol(symbolJson);
                var symbol2Json = symbol2.toJSON();
                
                t.assertEqual(symbolJson, symbol2Json);                            
            }
        }	
	],
		
	function()//setUp()
	{
        //initialize symbology		
		symbol = new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID, new esri.symbol.SimpleLineSymbol(), new dojo.Color([255, 0, 0, 1]));		
	},
	
	function()//tearDown
	{
		symbol = null;
	}
);
