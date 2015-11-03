dojo.provide("esri.tests.geometry.extent.extentToJsonTest");

dojo.require("esri.geometry");

var jsonExtent = null;

var jsonExtentResponse = 
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
                "xmin": -125.192864569718,
                "ymin": 19.4163766870772,
                "xmax": -66.1058240510347,
                "ymax": 54.3182805228683,
                "spatialReference": 
                    {
                        "wkid": 4326
                    }
            },
        "fullExtent": 
            {
                "xmin": -125.192864569718,
                "ymin": 19.4163766870772,
                "xmax": -66.1058240510347,
                "ymax": 54.3182805228683,
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

var jsonExtentJson = 
    {
        "xmin": -125.192864569718,
        "ymin": 19.4163766870772,
        "xmax": -66.1058240510347,
        "ymax": 54.3182805228683,
        "spatialReference": 
            {
                "wkid": 4326
            }
    };

 
doh.registerGroup("geometry.extent.extentToJsonTest", [
    {
        name: "testMinXYMaxXY",
        timeout: 5000,
        runTest: function(t)
        {
		    var responseExt = jsonExtentResponse.initialExtent;
		    t.assertEqual(responseExt.xmin, jsonExtent.xmin);
		    t.assertEqual(responseExt.ymin, jsonExtent.ymin);
		    t.assertEqual(responseExt.xmax, jsonExtent.xmax);
		    t.assertEqual(responseExt.ymax, jsonExtent.ymax);
        }
    },
    {
        name: "testToJson",
        timeout: 5000,
        runTest: function(t)
        {
			t.assertEqual(jsonExtentJson, jsonExtent.toJSON());
        }
    },	
    /*{
        name: "testToString",
        timeout: 5000,
        runTest: function(t)
        {
			t.assertEqual("esri.geometry.Extent(-125.192864569718, 19.4163766870772, -66.1058240510347, 54.3182805228683, esri.SpatialReference(wkid = 4326))", jsonExtent.toString());
        }
    },*/
	{
        name: "testSpatialReference",
        timeout: 5000,
        runTest: function(t)
        {
            t.assertEqual(jsonExtentResponse.spatialReference.wkid, jsonExtent.spatialReference.wkid);
        }
    },
    {
        name: "testGetCenter",
        timeout: 5000,
        runTest: function(t)
        {
		    var center = jsonExtent.getCenter();
		    t.assertEqual(
		        {
		            "x": -95.64934431037635,
		            "y": 36.86732860497275,
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
            t.assertEqual(59.087040518683295, jsonExtent.getWidth());
        }
    },
    {
        name: "testGetHeight",
        timeout: 5000,
        runTest: function(t)
        {
            t.assertEqual(34.9019038357911, jsonExtent.getHeight());
        }
    },	
    {
        name: "testContains",
        timeout: 5000,
        runTest: function(t)
        {
		   //contains
		    t.assertTrue(jsonExtent.contains(new esri.geometry.Point(
		        {
		            "x": -117.68623352050781,
		            "y": 54.31640625,
		            "spatialReference": 
		                {
		                    "wkid": 4326
		                }
		        })));
		    t.assertTrue(jsonExtent.contains(new esri.geometry.Point(
		        {
		            "x": -66.10696792602539,
		            "y": 48.75904083251953,
		            "spatialReference": 
		                {
		                    "wkid": 4326
		                }
		        })));
		    t.assertTrue(jsonExtent.contains(new esri.geometry.Point(
		        {
		            "x": -73.79739761352539,
		            "y": 19.427947998046875,
		            "spatialReference": 
		                {
		                    "wkid": 4326
		                }
		        })));
		    t.assertTrue(jsonExtent.contains(new esri.geometry.Point(
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
            t.assertFalse(jsonExtent.contains(new esri.geometry.Point(
                {
                    "x": -110.37826538085938,
                    "y": 54.31915283203125,
                    "spatialReference": 
                        {
                            "wkid": 4326
                        }
                })));
            t.assertFalse(jsonExtent.contains(new esri.geometry.Point(
                {
                    "x": -66.104736328125,
                    "y": 36.7327880859375,
                    "spatialReference": 
                        {
                            "wkid": 4326
                        }
                })));
            t.assertFalse(jsonExtent.contains(new esri.geometry.Point(
                {
                    "x": -100.6622314453125,
                    "y": 19.412841796875,
                    "spatialReference": 
                        {
                            "wkid": 4326
                        }
                })));
            t.assertFalse(jsonExtent.contains(new esri.geometry.Point(
                {
                    "x": -125.19538879394531,
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
		    t.assertTrue(jsonExtent.intersects(new esri.geometry.Extent(
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
		    t.assertTrue(jsonExtent.intersects(new esri.geometry.Extent(
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
		    t.assertTrue(jsonExtent.intersects(new esri.geometry.Extent(
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
		    t.assertTrue(jsonExtent.intersects(new esri.geometry.Extent(
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
		    t.assertTrue(jsonExtent.intersects(new esri.geometry.Extent(
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
		    t.assertFalse(jsonExtent.intersects(new esri.geometry.Extent(
		        {
		            "xmin": -147.3046875,
		            "ymin": 54.4921875,
		            "xmax": -126.2109375,
		            "ymax": 71.3671875,
		            "spatialReference": 
		                {
		                    "wkid": 4326
		                }
		        })));
		    t.assertFalse(jsonExtent.intersects(new esri.geometry.Extent(
		        {
		            "xmin": -105.46875,
		            "ymin": 55.8984375,
		            "xmax": -13.359375,
		            "ymax": 78.046875,
		            "spatialReference": 
		                {
		                    "wkid": 4326
		                }
		        })));
		    t.assertFalse(jsonExtent.intersects(new esri.geometry.Extent(
		        {
		            "xmin": -64.3359375,
		            "ymin": 20.7421875,
		            "xmax": 98.4375,
		            "ymax": 54.140625,
		            "spatialReference": 
		                {
		                    "wkid": 4326
		                }
		        })));
		    t.assertFalse(jsonExtent.intersects(new esri.geometry.Extent(
		        {
		            "xmin": -123.046875,
		            "ymin": -56.953125,
		            "xmax": -67.5,
		            "ymax": 17.9296875,
		            "spatialReference": 
		                {
		                    "wkid": 4326
		                }
		        })));
        }
    }  	
/*    {
        name: "ExtentContructor_minxy_maxxy_sr",
        timeout: 5000,
        runTest: function(t)
        {
            var jsonExtent = new esri.geometry.Extent(-125.192864569718, 19.4163766870772, -66.1058240510347, 54.3182805228683, new esri.SpatialReference(
                {
                    "wkid": 4326
                }));

            compareExtentResults(t, jsonExtentResponse, jsonExtentJson, jsonExtent);
            compareExtentResults(t, jsonExtentResponse, jsonExtentJson, new esri.geometry.Extent(jsonExtent.toJSON()));
        }
    }, 

    {
        name: "ExtentContructor_json",
        timeout: 5000,
        runTest: function(t)
        {
            var jsonExtent = new esri.geometry.Extent(
                {
                    xmin: -125.192864569718,
                    ymin: 19.4163766870772,
                    xmax: -66.1058240510347,
                    ymax: 54.3182805228683,
                    spatialReference: 
                        {
                            wkid: 4326
                        }
                });
            
            compareExtentResults(t, jsonExtentResponse, jsonExtentJson, jsonExtent);
            compareExtentResults(t, jsonExtentResponse, jsonExtentJson, new esri.geometry.Extent(jsonExtent.toJSON()));
        }
    }, 

    {
        name: "ExtentContructor_empty_update",
        timeout: 5000,
        runTest: function(t)
        {
            var jsonExtent = new esri.geometry.Extent();
            jsonExtent.update(-125.192864569718, 19.4163766870772, -66.1058240510347, 54.3182805228683, new esri.SpatialReference(
                {
                    "wkid": 4326
                }));
            
            compareExtentResults(t, jsonExtentResponse, jsonExtentJson, jsonExtent);
            compareExtentResults(t, jsonExtentResponse, jsonExtentJson, new esri.geometry.Extent(jsonExtent.toJSON()));
        }\
    }*/
    ],
	
	function() //setUp
    { 
	   var ext = new esri.geometry.Extent(-125.192864569718, 19.4163766870772, -66.1058240510347, 54.3182805228683, new esri.SpatialReference(
            {
                "wkid": 4326
            }));
       jsonExtent = new esri.geometry.Extent(ext.toJSON());
    }, 
	
	function() //tearDown
    { 
        jsonExtent = null;
    });
