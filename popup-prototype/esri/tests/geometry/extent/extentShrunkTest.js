dojo.provide("esri.tests.geometry.extent.extentShrunkTest");

dojo.require("esri.geometry");

var extentShrunk = null;

var extentShrunkResponse = 
    {
        "serviceDescription": "",
        "mapName": "Layers",
        "description": "",
        "copyrightText": "",
        "layers": [
            {
                "id": 0,
                "name": "Cities",
                "parentLayerId": -1,
                "defaultVisibility": true,
                "subLayerIds": null
            }, 
            {
                "id": 1,
                "name": "Rivers",
                "parentLayerId": -1,
                "defaultVisibility": true,
                "subLayerIds": null
            }, 
            {
                "id": 2,
                "name": "States",
                "parentLayerId": -1,
                "defaultVisibility": true,
                "subLayerIds": null
            }],
        "spatialReference": 
            {
                "wkid": 4326
            },
        "singleFusedMapCache": false,
        "initialExtent": 
            {
                "xmin": -110.42110444004717,
                "ymin": 28.141852646024976,
                "xmax": -80.87758418070553,
                "ymax": 45.592804563920524,
				"spatialReference": 
                    {
                        "wkid": 4326
                    }
            },
        "fullExtent": 
            {
                "xmin": -110.42110444004717,
                "ymin": 28.141852646024976,
                "xmax": -80.87758418070553,
                "ymax": 45.592804563920524,
                "spatialReference": 
                    {
                        "wkid": 4326
                    }
            }, 
        "units": "esriDecimalDegrees",
        "documentInfo": 
            {
                "Title": "USA_States_Cities_Rivers",
                "Author": "Jeremy",
                "Comments": "",
                "Subject": "",
                "Category": "",
                "Keywords": ""
            }
    };
	
var extentShrunkJson = 
    {
        "xmin": -110.42110444004717,
        "ymin": 28.141852646024976,
        "xmax": -80.87758418070553,
        "ymax": 45.592804563920524,
        "spatialReference": 
            {
                "wkid": 4326
            }
     };
 
doh.registerGroup("geometry.extent.extentShrunkTest", [
    {
        name: "testMinXYMaxXY",
        timeout: 5000,
        runTest: function(t)
        {
		    var responseExt = extentShrunkResponse.initialExtent;
		    t.assertEqual(responseExt.xmin, extentShrunk.xmin);
		    t.assertEqual(responseExt.ymin, extentShrunk.ymin);
		    t.assertEqual(responseExt.xmax, extentShrunk.xmax);
		    t.assertEqual(responseExt.ymax, extentShrunk.ymax);
        }
    },
    {
        name: "testToJson",
        timeout: 5000,
        runTest: function(t)
        {
			t.assertEqual(extentShrunkJson, extentShrunk.toJSON());
        }
    },	
	{
        name: "testSpatialReference",
        timeout: 5000,
        runTest: function(t)
        {
            t.assertEqual(extentShrunkResponse.spatialReference.wkid, extentShrunk.spatialReference.wkid);
        }
    },
    {
        name: "testGetCenter",
        timeout: 5000,
        runTest: function(t)
        {
		    var center = extentShrunk.getCenter();
		    t.assertEqual(
		        {
		            "x": -95.64934431037636,//returns -95.64934431037635
		            "y": 36.867328604972755,
		            "spatialReference": 
		                {
		                    "wkid": 4326
		                }
		        }, center.toJSON());
	        }
    },
	{
        name: "testGetWidth",
        timeout: 5000,
        runTest: function(t)
        {
            t.assertEqual(29.543520259341648, extentShrunk.getWidth());			
        }
    },
    {
        name: "testGetHeight",
        timeout: 5000,
        runTest: function(t)
        {
            t.assertEqual(17.450951917895548, extentShrunk.getHeight());
        }
    },	
    {
        name: "testContains",
        timeout: 5000,
        runTest: function(t)
        {		
		    t.assertTrue(extentShrunk.contains(new esri.geometry.Point(
		        {
		            "x": -109.68623352050781,
		            "y": 34.31640625,
		            "spatialReference": 
		                {
		                    "wkid": 4326
		                }
		        })));
		    t.assertTrue(extentShrunk.contains(new esri.geometry.Point(
		        {
		            "x": -96.10696792602539,
		            "y": 38.75904083251953,
		            "spatialReference": 
		                {
		                    "wkid": 4326
		                }
		        })));
		    t.assertTrue(extentShrunk.contains(new esri.geometry.Point(
		        {
		            "x": -80.99739761352539,
		            "y": 28.427947998046875,
		            "spatialReference": 
		                {
		                    "wkid": 4326
		                }
		        })));
		    t.assertTrue(extentShrunk.contains(new esri.geometry.Point(
		        {
		            "x": -110.19058227539062,
		            "y": 35.91932678222656,
		            "spatialReference": 
		                {
		                    "wkid": 4326
		                }
		        })));
        }
    },	
    {
        name: "testContainsNot",
        timeout: 5000,
        runTest: function(t)
        {            
            t.assertFalse(extentShrunk.contains(new esri.geometry.Point(
                {
                    "x": -160.37826538085938,
                    "y": 72.31915283203125,
                    "spatialReference": 
                        {
                            "wkid": 4326
                        }
                })));
            t.assertFalse(extentShrunk.contains(new esri.geometry.Point(
                {
                    "x": -66.104736328125,
                    "y": 1.5,
                    "spatialReference": 
                        {
                            "wkid": 4326
                        }
                })));
            t.assertFalse(extentShrunk.contains(new esri.geometry.Point(
                {
                    "x": -200.6622314453125,
                    "y": 19.412841796875,
                    "spatialReference": 
                        {
                            "wkid": 4326
                        }
                })));
            t.assertFalse(extentShrunk.contains(new esri.geometry.Point(
                {
                    "x": 125.19538879394531,
                    "y": 51.85890197753906,
                    "spatialReference": 
                        {
                            "wkid": 4326
                        }
                })));
        }
    },	
    {
        name: "testIntersects",
        timeout: 5000,
        runTest: function(t)
        {            
		    t.assertTrue(extentShrunk.intersects(new esri.geometry.Extent(
		        {
		            "xmin": -164.53125,
		            "ymin": 23.0859375,
		            "xmax": -104.453125,
		            "ymax": 75.234375,
		            "spatialReference": 
		                {
		                    "wkid": 4326
		                }
		        })));
		    t.assertTrue(extentShrunk.intersects(new esri.geometry.Extent(
		        {
		            "xmin": -89.9609375,
		            "ymin": 35.9765625,
		            "xmax": -18.6328125,
		            "ymax": 77.34375,
		            "spatialReference": 
		                {
		                    "wkid": 4326
		                }
		        })));
		    t.assertTrue(extentShrunk.intersects(new esri.geometry.Extent(
		        {
		            "xmin": -104.296875,
		            "ymin": 32.5,
		            "xmax": -88.5546875,
		            "ymax": 42.0703125,
		            "spatialReference": 
		                {
		                    "wkid": 4326
		                }
		        })));
        }
    },	
    {
        name: "testIntersectsNot",
        timeout: 5000,
        runTest: function(t)
        {                       		
		    t.assertFalse(extentShrunk.intersects(new esri.geometry.Extent(
		        {
		            "xmin": -36.46875,
		            "ymin": 55.8984375,
		            "xmax": -13.359375,
		            "ymax": 70.046875,
		            "spatialReference": 
		                {
		                    "wkid": 4326
		                }
		        })));

		    t.assertFalse(extentShrunk.intersects(new esri.geometry.Extent(
		        {
		            "xmin": -254.046875,
		            "ymin": 72.953125,
		            "xmax": -165.5,
		            "ymax": 80.9296875,
		            "spatialReference": 
		                {
		                    "wkid": 4326
		                }
		        })));
        }
    }  	
    ],
	
	function() //setUp
    { 
	   var shrunkExt = new esri.geometry.Extent(-125.192864569718, 19.4163766870772, -66.1058240510347, 54.3182805228683, new esri.SpatialReference(
            {
                "wkid": 4326
            }));
			
       extentShrunk = shrunkExt.expand(0.5);	   
    }, 
	
	function() //tearDown
    { 
        extentShrunk = null;
    });
