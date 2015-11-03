dojo.provide("esri.tests.symbols.pictureFillSymbolTest");

dojo.require("esri.symbol");

var pictureFillSymbol;

doh.registerGroup("symbols.pictureFillSymbolTest",
    [
        {
            name: "testGetURL",
            timeout: 3000,
            runTest: function(t)
            {                   
                t.assertEqual("http://www.esri.com/software/arcgis/graphics/social_distance_xls_med.jpg", pictureFillSymbol.url);                            
            }
        },
        {
            name: "testSetURL",
            timeout: 3000,
            runTest: function(t)
            {   
			    var url = "http://www.esri.com/software/arcgis/graphics/social_distance_med.jpg";                
                pictureFillSymbol.setUrl(url);
                t.assertEqual(url, pictureFillSymbol.url);                            
            }
        },      
        {
            name: "testOutline",
            timeout: 3000,
            runTest: function(t)
            {   
                t.assertEqual(new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([0, 255, 0, 0.5]), 20), 
				    pictureFillSymbol.outline);                            
            }
        },
        {
            name: "testGetWidth",
            timeout: 3000,
            runTest: function(t)
            {                   
                t.assertEqual(175, pictureFillSymbol.width);                            
            }
        },                  
        {
            name: "testSetWidth",
            timeout: 3000,
            runTest: function(t)
            {                   
			    pictureFillSymbol.setWidth(200);
				t.assertEqual(200, pictureFillSymbol.width);
            }
        },
        {
            name: "testGetHeight",
            timeout: 3000,
            runTest: function(t)
            {                   
                t.assertEqual(156, pictureFillSymbol.height);                            
            }
        },		 
        {
            name: "testSetHeight",
            timeout: 3000,
            runTest: function(t)
            {
                pictureFillSymbol.setHeight(150);
                t.assertEqual(150, pictureFillSymbol.height);
            }
        },              
        {
            name: "testType",
            timeout: 3000,
            runTest: function(t)
            {
                t.assertEqual("picturefillsymbol", pictureFillSymbol.type);                            
            }
        },   
        {
            name: "testGetXScale",
            timeout: 3000,
            runTest: function(t)
            {                   
                t.assertEqual(1, pictureFillSymbol.xscale);                            
            }
        },       
        {
            name: "testSetXScale",
            timeout: 3000,
            runTest: function(t)
            {
                pictureFillSymbol.setXScale(5);
                t.assertEqual(5, pictureFillSymbol.xscale);
            }
        },              
        {
            name: "testGetYScale",
            timeout: 3000,
            runTest: function(t)
            {                   
                t.assertEqual(1, pictureFillSymbol.yscale);                            
            }
        },       
        {
            name: "testSetYScale",
            timeout: 3000,
            runTest: function(t)
            {
                pictureFillSymbol.setYScale(6);
                t.assertEqual(6, pictureFillSymbol.yscale);
            }
        },   
        {
            name: "testGetOffset",
            timeout: 3000,
            runTest: function(t)
            {
                t.assertEqual(0, pictureFillSymbol.xoffset);
				t.assertEqual(0, pictureFillSymbol.yoffset);
            }
        },   
        {
            name: "testSetOffset",
            timeout: 3000,
            runTest: function(t)
            {
                pictureFillSymbol.setOffset(100, 120);
                t.assertEqual(100, pictureFillSymbol.xoffset);
                t.assertEqual(120, pictureFillSymbol.yoffset);
            }
        },   				           		   		      
        {
            name: "testtoJson",
            timeout: 3000,
            runTest: function(t)
            {
                var pictureFillSymbolJson = pictureFillSymbol.toJSON();
				var pictureFillSymbol2 = new esri.symbol.PictureFillSymbol(pictureFillSymbolJson);
                            
                t.assertEqual(pictureFillSymbolJson, pictureFillSymbol2.toJSON());
            }
        }       
    ],
        
    function()//setUp()
    {
        //initialize symbology
		var simpleLineSymbol = new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([0, 255, 0, 0.5]), 20);
        pictureFillSymbol = new esri.symbol.PictureFillSymbol("http://www.esri.com/software/arcgis/graphics/social_distance_xls_med.jpg",
		simpleLineSymbol, 175, 156); 
    },
    
    function()//tearDown
    {
        pictureFillSymbol = null;
    }
);
