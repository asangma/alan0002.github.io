dojo.provide("esri.tests.symbols.textSymbolTest");

dojo.require("esri.symbol");

var textSymbol, font;

doh.registerGroup("symbols.textSymbolTest",
    [
        {
            name: "testGetAlign",
            timeout: 3000,
            runTest: function(t)
            {                   
                t.assertEqual(esri.symbol.TextSymbol.ALIGN_MIDDLE, textSymbol.align);                            
            }
        },
        {
            name: "testSetAlign",
            timeout: 3000,
            runTest: function(t)
            {                   
                textSymbol.setAlign(esri.symbol.TextSymbol.ALIGN_START);
                t.assertEqual(esri.symbol.TextSymbol.ALIGN_START, textSymbol.align);                            
            }
        },      
        {
            name: "testGetAngle",
            timeout: 3000,
            runTest: function(t)
            {                   
                t.assertEqual(0, textSymbol.angle);                            
            }
        },
        {
            name: "testSetAngle",
            timeout: 3000,
            runTest: function(t)
            {                   
                textSymbol.setAngle(10);
                t.assertEqual(10, textSymbol.angle);                            
            }
        },      
        {
            name: "testGetDecoration",
            timeout: 3000,
            runTest: function(t)
            {                   
                t.assertEqual(esri.symbol.TextSymbol.DECORATION_NONE, textSymbol.decoration);                            
            }
        },
        {
            name: "testSetDecoration",
            timeout: 3000,
            runTest: function(t)
            {   
			    textSymbol.setDecoration(esri.symbol.TextSymbol.DECORATION_OVERLINE);
                t.assertEqual(esri.symbol.TextSymbol.DECORATION_OVERLINE, textSymbol.decoration);			
            }
        },      
        {
            name: "testGetFont",
            timeout: 3000,
            runTest: function(t)
            {                   
                t.assertEqual(font, textSymbol.font);                            
            }
        },
        {
            name: "testSetFont",
            timeout: 3000,
            runTest: function(t)
            {   
		        //initialize symbology
		        newFont = new esri.symbol.Font();
		        newFont.setSize("15");
		        newFont.setStyle(esri.symbol.Font.STYLE_ITALIC);
				newFont.setVariant(esri.symbol.Font.VARIANT_NORMAL);
				newFont.setWeight(esri.symbol.Font.WEIGHT_BOLD);
                
                textSymbol.setFont(newFont);
                t.assertEqual(newFont, textSymbol.font);                            
            }
        },      
        {
            name: "testGetKerning",
            timeout: 3000,
            runTest: function(t)
            {           
                t.assertTrue(textSymbol.kerning);                            
            }
        },
        {
            name: "testSetKerning",
            timeout: 3000,
            runTest: function(t)
            {                   
                textSymbol.setKerning(false);
                t.assertFalse(textSymbol.kerning);                            
            }
        },      		
        {
            name: "testGetRotated",
            timeout: 3000,
            runTest: function(t)
            {                   
                t.assertFalse(textSymbol.rotated);                            
            }
        },
        {
            name: "testSetRotated",
            timeout: 3000,
            runTest: function(t)
            {   
                textSymbol.setRotated(true);              
                t.assertTrue(textSymbol.rotated);                            
            }
        },      
        {
            name: "testGetText",
            timeout: 3000,
            runTest: function(t)
            {                   
                t.assertEqual("IDIC", textSymbol.text);                            
            }
        },
        {
            name: "testSetText",
            timeout: 3000,
            runTest: function(t)
            {      
			    var txt = "Live Long and Prosper";              
                textSymbol.setText(txt);
                t.assertEqual(txt, textSymbol.text);                            
            }
        },     
        {
            name: "testGetXOffset",
            timeout: 3000,
            runTest: function(t)
            {                   
                t.assertEqual(0, textSymbol.xoffset);                            
            }
        },
        {
            name: "testGetYOffset",
            timeout: 3000,
            runTest: function(t)
            {                   
                t.assertEqual(0, textSymbol.yoffset);                            
            }
        },
        {
            name: "testSetOffset",
            timeout: 3000,
            runTest: function(t)
            {   
                textSymbol.setOffset(5, 6);
				t.assertEqual(5, textSymbol.xoffset);
                t.assertEqual(6, textSymbol.yoffset);            
    		}
        },      
        {
            name: "testColor",
            timeout: 3000,
            runTest: function(t)
            {   
                t.assertEqual(new dojo.Color([0, 255, 0, 0.5]), textSymbol.color);
            }
        },   		      
        {
            name: "testtoJson",
            timeout: 3000,
            runTest: function(t)
            {
                var textSymbolJson = textSymbol.toJSON();
				var textSymbol2 = new esri.symbol.TextSymbol(textSymbolJson);
                            
                t.assertEqual(textSymbolJson, textSymbol2.toJSON());
            }
        }       
    ],
        
    function()//setUp()
    {
        //initialize symbology
		font = new esri.symbol.Font();
		font.setSize("10");
		font.setStyle(esri.symbol.Font.STYLE_NORMAL);
		
        textSymbol = new esri.symbol.TextSymbol("IDIC", font, new dojo.Color([0, 255, 0, 0.5]));
    },
    
    function()//tearDown
    {
        textSymbol = null;
    }
);
