dojo.provide("esri.tests.geometry.extent.extentExpandTest");

dojo.require("esri.geometry");

var extentExpand = null;

var extentExpandResponse = 
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
                "xmin": -154.73638482905966,
                "ymin": 1.9654247691816487,
                "xmax": -36.562303791693054,
                "ymax": 71.76923244076386,
                "spatialReference": 
                    {
                        "wkid": 4326
                    }
            },
        "fullExtent": 
            {
                "xmin": -154.73638482905966,
                "ymin": 1.9654247691816487,
                "xmax": -36.562303791693054,
                "ymax": 71.76923244076386,
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
	
var extentExpandJson = 
    {
		"xmin": -154.73638482905966,
        "ymin": 1.9654247691816487,
        "xmax": -36.562303791693054,
        "ymax": 71.76923244076386,
        "spatialReference": 
            {
                "wkid": 4326
            }
     };
 
doh.registerGroup("geometry.extent.extentExpandTest", [
    {
        name: "testMinXYMaxXY",
        timeout: 5000,
        runTest: function(t)
        {
		    var responseExt = extentExpandResponse.initialExtent;
		    t.assertEqual(responseExt.xmin, extentExpand.xmin);
		    t.assertEqual(responseExt.ymin, extentExpand.ymin);
		    t.assertEqual(responseExt.xmax, extentExpand.xmax);
		    t.assertEqual(responseExt.ymax, extentExpand.ymax);
        }
    },
    {
        name: "testToJson",
        timeout: 5000,
        runTest: function(t)
        {
			t.assertEqual(extentExpandJson, extentExpand.toJSON());
        }
    },	
	{
        name: "testSpatialReference",
        timeout: 5000,
        runTest: function(t)
        {
            t.assertEqual(extentExpandResponse.spatialReference.wkid, extentExpand.spatialReference.wkid);
        }
    },
    {
        name: "testGetCenter",
        timeout: 5000,
        runTest: function(t)
        {
		    var center = extentExpand.getCenter();
		    t.assertEqual(
		        {
		            "x": -95.64934431037636,
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
            t.assertEqual(118.1740810373666, extentExpand.getWidth());			
        }
    },
    {
        name: "testGetHeight",
        timeout: 5000,
        runTest: function(t)
        {
            t.assertEqual(69.8038076715822, extentExpand.getHeight());
        }
    },	
    {
        name: "testContains",
        timeout: 5000,
        runTest: function(t)
        {
		   //contains
		    t.assertTrue(extentExpand.contains(new esri.geometry.Point(
		        {
		            "x": -117.68623352050781,
		            "y": 54.31640625,
		            "spatialReference": 
		                {
		                    "wkid": 4326
		                }
		        })));
		    t.assertTrue(extentExpand.contains(new esri.geometry.Point(
		        {
		            "x": -66.10696792602539,
		            "y": 48.75904083251953,
		            "spatialReference": 
		                {
		                    "wkid": 4326
		                }
		        })));
		    t.assertTrue(extentExpand.contains(new esri.geometry.Point(
		        {
		            "x": -73.79739761352539,
		            "y": 19.427947998046875,
		            "spatialReference": 
		                {
		                    "wkid": 4326
		                }
		        })));
		    t.assertTrue(extentExpand.contains(new esri.geometry.Point(
		        {
		            "x": -125.19058227539062,
		            "y": 51.91932678222656,
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
            t.assertFalse(extentExpand.contains(new esri.geometry.Point(
                {
                    "x": -160.37826538085938,
                    "y": 72.31915283203125,
                    "spatialReference": 
                        {
                            "wkid": 4326
                        }
                })));
            t.assertFalse(extentExpand.contains(new esri.geometry.Point(
                {
                    "x": -66.104736328125,
                    "y": 1.5,
                    "spatialReference": 
                        {
                            "wkid": 4326
                        }
                })));
            t.assertFalse(extentExpand.contains(new esri.geometry.Point(
                {
                    "x": -200.6622314453125,
                    "y": 19.412841796875,
                    "spatialReference": 
                        {
                            "wkid": 4326
                        }
                })));
            t.assertFalse(extentExpand.contains(new esri.geometry.Point(
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
		    //intersects
		    t.assertTrue(extentExpand.intersects(new esri.geometry.Extent(
		        {
		            "xmin": -164.53125,
		            "ymin": 53.0859375,
		            "xmax": -124.453125,
		            "ymax": 75.234375,
		            "spatialReference": 
		                {
		                    "wkid": 4326
		                }
		        })));
		    t.assertTrue(extentExpand.intersects(new esri.geometry.Extent(
		        {
		            "xmin": -69.9609375,
		            "ymin": -5.9765625,
		            "xmax": -18.6328125,
		            "ymax": 77.34375,
		            "spatialReference": 
		                {
		                    "wkid": 4326
		                }
		        })));
		    t.assertTrue(extentExpand.intersects(new esri.geometry.Extent(
		        {
		            "xmin": -134.296875,
		            "ymin": 22.5,
		            "xmax": -68.5546875,
		            "ymax": 72.0703125,
		            "spatialReference": 
		                {
		                    "wkid": 4326
		                }
		        })));
		    t.assertTrue(extentExpand.intersects(new esri.geometry.Extent(
		        {
		            "xmin": -111.09375,
		            "ymin": 24.609375,
		            "xmax": -72.0703125,
		            "ymax": 42.5390625,
		            "spatialReference": 
		                {
		                    "wkid": 4326
		                }
		        })));
		    t.assertTrue(extentExpand.intersects(new esri.geometry.Extent(
		        {
		            "xmin": -138.1640625,
		            "ymin": -5.2734375,
		            "xmax": -33.3984375,
		            "ymax": 66.4453125,
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
		    t.assertFalse(extentExpand.intersects(new esri.geometry.Extent(
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

		    t.assertFalse(extentExpand.intersects(new esri.geometry.Extent(
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
	   var expandExt = new esri.geometry.Extent(-125.192864569718, 19.4163766870772, -66.1058240510347, 54.3182805228683, new esri.SpatialReference(
            {
                "wkid": 4326
            }));
       extentExpand = expandExt.expand(2);	   
    }, 
	
	function() //tearDown
    { 
        extentExpand = null;
    });
