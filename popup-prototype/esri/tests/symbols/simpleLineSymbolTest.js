dojo.provide("esri.tests.symbols.simpleLineSymbolTest");

dojo.require("esri.symbol");

var lineSymbol;

doh.registerGroup("symbols.simpleLineSymbolTest",
	[
        {
            name: "testStyle",
            timeout: 3000,
            runTest: function(t)
            {                   
                var style = lineSymbol.style;           
                t.assertEqual(esri.symbol.SimpleLineSymbol.STYLE_SOLID, style);                            
            }
        },
        {
            name: "testWidth",
            timeout: 3000,
            runTest: function(t)
            {                   
                var width = lineSymbol.width;//returns  rgba(0, 255, 0, 0.5) r=0 g=255 b=0 a=0.5
                t.assertEqual(width, 20);                            
            }
        },  		
        {
            name: "testColor",
            timeout: 3000,
            runTest: function(t)
            {                   
                var color = lineSymbol.color;//returns 20
                t.assertEqual(new dojo.Color([0, 255, 0, 0.5]), color);                            
            }
        },  
		{
            name: "testJson",
            timeout: 3000,
            runTest: function(t)
            {                   
                var lineSymbolJson = lineSymbol.toJSON();
                
                var lineSymbol2 = new esri.symbol.SimpleLineSymbol(lineSymbolJson);
                var lineSymbol2Json = lineSymbol2.toJSON();
                
                t.assertEqual(dojo.toJson(lineSymbolJson), dojo.toJson(lineSymbol2Json));
            }
        }
	],
		
	function()//setUp()
	{
        //initialize symbology
        lineSymbol = new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([0, 255, 0, 0.5]), 20);               
		
	},
	
	function()//tearDown
	{
		lineSymbol = null;
	}
);
