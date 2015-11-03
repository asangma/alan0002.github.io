dojo.provide("esri.tests.symbols.pictureMarkerSymbolTest");

dojo.require("esri.symbol");

var pictureMarkerSymbol;

doh.registerGroup("symbols.pictureMarkerSymbolTest",
    [
        {
            name: "testGetURL",
            timeout: 3000,
            runTest: function(t)
            {                   
                t.assertEqual("http://www.esri.com/graphics/aexicon.jpg", pictureMarkerSymbol.url);                            
            }
        },
        {
            name: "testSetURL",
            timeout: 3000,
            runTest: function(t)
            {   
			    var url = "http://www.esri.com/software/arcgis/graphics/arcgis_logo.jpg";                
                pictureMarkerSymbol.setUrl(url);
                t.assertEqual(url, pictureMarkerSymbol.url);                            
            }
        },      
        {
            name: "testGetWidth",
            timeout: 3000,
            runTest: function(t)
            {                   
                t.assertEqual(20, pictureMarkerSymbol.width);                            
            }
        },                  
        {
            name: "testSetWidth",
            timeout: 3000,
            runTest: function(t)
            {                   
			    pictureMarkerSymbol.setWidth(30);
				t.assertEqual(30, pictureMarkerSymbol.width);
            }
        },
        {
            name: "testGetHeight",
            timeout: 3000,
            runTest: function(t)
            {                   
                t.assertEqual(20, pictureMarkerSymbol.height);                            
            }
        },		 
        {
            name: "testSetHeight",
            timeout: 3000,
            runTest: function(t)
            {
                pictureMarkerSymbol.setHeight(30);
                t.assertEqual(30, pictureMarkerSymbol.height);
            }
        },              
        {
            name: "testType",
            timeout: 3000,
            runTest: function(t)
            {                   
                t.assertEqual("picturemarkersymbol", pictureMarkerSymbol.type);                            
            }
        },      		      
        {
            name: "testtoJson",
            timeout: 3000,
            runTest: function(t)
            {
                var pictureMarkerSymbolJson = pictureMarkerSymbol.toJSON();
				var pictureMarkerSymbol2 = new esri.symbol.PictureMarkerSymbol(pictureMarkerSymbolJson);
                            
                t.assertEqual(dojo.toJson(pictureMarkerSymbolJson), dojo.toJson(pictureMarkerSymbol2.toJSON()));
            }
        }       
    ],
        
    function()//setUp()
    {
        //initialize symbology
        pictureMarkerSymbol = new esri.symbol.PictureMarkerSymbol('http://www.esri.com/graphics/aexicon.jpg', 20, 20); 
    },
    
    function()//tearDown
    {
        pictureMarkerSymbol = null;
    }
);
