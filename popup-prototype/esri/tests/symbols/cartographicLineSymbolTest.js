dojo.provide("esri.tests.symbols.cartographicLineSymbolTest");

dojo.require("esri.symbol");

var cartographicLineSymbol;

doh.registerGroup("symbols.cartographicLineSymbolTest",
	[
        {
            name: "testStyle",
            timeout: 3000,
            runTest: function(t)
            {                   
                var style = cartographicLineSymbol.style;
                t.assertEqual(esri.symbol.SimpleLineSymbol.STYLE_SOLID, style);                            
            }
        },
        {
            name: "testGetCap",
            timeout: 3000,
            runTest: function(t)
            {                                        
                t.assertEqual(esri.symbol.CartographicLineSymbol.CAP_ROUND, cartographicLineSymbol.cap);                            
            }
        },
        {
            name: "testSetCap",
            timeout: 3000,
            runTest: function(t)
            {   
			    cartographicLineSymbol.setCap(esri.symbol.CartographicLineSymbol.CAP_SQUARE); 
			    t.assertEqual(esri.symbol.CartographicLineSymbol.CAP_SQUARE, cartographicLineSymbol.cap);
            }
        },  		
        {
            name: "testGetJoin",
            timeout: 3000,
            runTest: function(t)
            {   
			    t.assertEqual(esri.symbol.CartographicLineSymbol.JOIN_MITER, cartographicLineSymbol.join);                
            }
        },  
        {
            name: "testSetJoin",
            timeout: 3000,
            runTest: function(t)
            {                   
			    cartographicLineSymbol.setJoin(esri.symbol.CartographicLineSymbol.JOIN_BEVEL);
                t.assertEqual(esri.symbol.CartographicLineSymbol.JOIN_BEVEL, cartographicLineSymbol.join);			
            }
        },  
        {
            name: "testGetMiter",
            timeout: 3000,
            runTest: function(t)
            {                   
                t.assertEqual("10", cartographicLineSymbol.miterLimit);                            
            }
        },  
        {
            name: "testSetMiter",
            timeout: 3000,
            runTest: function(t)
            {   
			    cartographicLineSymbol.setMiterLimit("25");
			    t.assertEqual("25", cartographicLineSymbol.miterLimit);                
            }
        },  
        {
            name: "testType",
            timeout: 3000,
            runTest: function(t)
            {                   
                t.assertEqual("cartographiclinesymbol", cartographicLineSymbol.type);                            
            }
        },  
		{
            name: "testJson",
            timeout: 3000,
            runTest: function(t)
            {                   
                var cartographicLineSymbolJson = cartographicLineSymbol.toJSON();
                var cartographicLineSymbol2 = new esri.symbol.CartographicLineSymbol(cartographicLineSymbolJson);
                var cartographicLineSymbol2Json = cartographicLineSymbol2.toJSON();
                
                t.assertEqual(cartographicLineSymbolJson, cartographicLineSymbol2Json);
            }
        }
	],
		
	function()//setUp()
	{
        //initialize symbology
		cartographicLineSymbol = new esri.symbol.CartographicLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([0, 255, 0, 0.5]),
    		20,  esri.symbol.CartographicLineSymbol.CAP_ROUND, esri.symbol.CartographicLineSymbol.JOIN_MITER, "10");
	},
	
	function()//tearDown
	{
		cartographicLineSymbol = null;
	}
);
