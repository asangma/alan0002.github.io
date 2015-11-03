dojo.provide("esri.tests.geometry.extent.extentTest");

dojo.require("esri.geometry");

var extent = null;

var extentRequest = 
    {
        url: "http://sampleserver1.arcgisonline.com/ArcGIS/rest/services/Specialty/ESRI_StatesCitiesRivers_USA/MapServer",
        content: 
            {
                f: "json"
            },
        callbackParamName: "callback",
        load: function(response, io)
        {
            alert(response);
        }
    };

var extentResponse = 
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

var extentJson = 
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

 
function compareExtentResults(t, response, json, extent)
{
    t.assertTrue(extent instanceof esri.geometry.Extent);
    
    //xmin,ymin,xmax,ymax
    var responseExt = response.initialExtent;	
    t.assertEqual(responseExt.xmin, extent.xmin);
    t.assertEqual(responseExt.ymin, extent.ymin);
    t.assertEqual(responseExt.xmax, extent.xmax);
    t.assertEqual(responseExt.ymax, extent.ymax);
    
    //toJson, toString, spatialReference
    t.assertEqual(json, extent.toJSON());
    t.assertEqual("esri.geometry.Extent(-125.192864569718, 19.4163766870772, -66.1058240510347, 54.3182805228683, esri.SpatialReference(wkid = 4326))", extent.toString());
    t.assertEqual(response.spatialReference.wkid, extent.spatialReference.wkid);
    
    //getCenter, getWidth, getHeight
    var center = extent.getCenter();
    t.assertEqual(
        {
            "x": -95.64934431037635,
            "y": 36.86732860497275,
            "spatialReference": 
                {
                    "wkid": 4326
                }
        }, center.toJSON());
    t.assertEqual(59.087040518683295, extent.getWidth());
    t.assertEqual(34.9019038357911, extent.getHeight());
    
    //expand
    var expanded = extent.expand(2);
    t.assertEqual(
        {
            "xmin": -154.73638482905966,
            "ymin": 1.9654247691816487,
            "xmax": -36.562303791693054,
            "ymax": 71.76923244076386,
            "spatialReference": 
                {
                    "wkid": 4326
                }
        }, expanded.toJSON());
    t.assertEqual(118.1740810373666, expanded.getWidth());
    t.assertEqual(69.8038076715822, expanded.getHeight());
    
    var shrunked = extent.expand(0.5);
    t.assertEqual(
        {
            "xmin": -110.42110444004717,
            "ymin": 28.141852646024976,
            "xmax": -80.87758418070553,
            "ymax": 45.592804563920524,
            "spatialReference": 
                {
                    "wkid": 4326
                }
        }, shrunked.toJSON());
    t.assertEqual(29.543520259341648, shrunked.getWidth());
    t.assertEqual(17.450951917895548, shrunked.getHeight());
    
    //contains
    t.assertTrue(extent.contains(new esri.geometry.Point(
        {
            "x": -117.68623352050781,
            "y": 54.31640625,
            "spatialReference": 
                {
                    "wkid": 4326
                }
        })));
    t.assertTrue(extent.contains(new esri.geometry.Point(
        {
            "x": -66.10696792602539,
            "y": 48.75904083251953,
            "spatialReference": 
                {
                    "wkid": 4326
                }
        })));
    t.assertTrue(extent.contains(new esri.geometry.Point(
        {
            "x": -73.79739761352539,
            "y": 19.427947998046875,
            "spatialReference": 
                {
                    "wkid": 4326
                }
        })));
    t.assertTrue(extent.contains(new esri.geometry.Point(
        {
            "x": -125.19058227539062,
            "y": 51.91932678222656,
            "spatialReference": 
                {
                    "wkid": 4326
                }
        })));
    
    t.assertFalse(extent.contains(new esri.geometry.Point(
        {
            "x": -110.37826538085938,
            "y": 54.31915283203125,
            "spatialReference": 
                {
                    "wkid": 4326
                }
        })));
    t.assertFalse(extent.contains(new esri.geometry.Point(
        {
            "x": -66.104736328125,
            "y": 36.7327880859375,
            "spatialReference": 
                {
                    "wkid": 4326
                }
        })));
    t.assertFalse(extent.contains(new esri.geometry.Point(
        {
            "x": -100.6622314453125,
            "y": 19.412841796875,
            "spatialReference": 
                {
                    "wkid": 4326
                }
        })));
    t.assertFalse(extent.contains(new esri.geometry.Point(
        {
            "x": -125.19538879394531,
            "y": 51.85890197753906,
            "spatialReference": 
                {
                    "wkid": 4326
                }
        })));
    
    //intersects
    t.assertTrue(extent.intersects(new esri.geometry.Extent(
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
    t.assertTrue(extent.intersects(new esri.geometry.Extent(
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
    t.assertTrue(extent.intersects(new esri.geometry.Extent(
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
    t.assertTrue(extent.intersects(new esri.geometry.Extent(
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
    t.assertTrue(extent.intersects(new esri.geometry.Extent(
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
    
    t.assertFalse(extent.intersects(new esri.geometry.Extent(
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
    t.assertFalse(extent.intersects(new esri.geometry.Extent(
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
    t.assertFalse(extent.intersects(new esri.geometry.Extent(
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
    t.assertFalse(extent.intersects(new esri.geometry.Extent(
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
    
    //offset
    var offsetted = extent.offset(10, -10);
    t.assertEqual(
        {
            "xmin": -115.192864569718,
            "ymin": 9.4163766870772,
            "xmax": -56.1058240510347,
            "ymax": 44.3182805228683,
            "spatialReference": 
                {
                    "wkid": 4326
                }
        }, offsetted.toJSON());
    
    //union
    var unioned = extent.union(offsetted);
    t.assertEqual(
        {
            "xmin": -125.192864569718,
            "ymin": 9.4163766870772,
            "xmax": -56.1058240510347,
            "ymax": 54.3182805228683,
            "spatialReference": 
                {
                    "wkid": 4326
                }
        }, unioned.toJSON());
    
    //centerAt, getCenter, getWidth, getHeight, expand
    var newCenter = center.offset(10, -10);
    var centered = extent.centerAt(newCenter);
    
    t.assertEqual(
        {
            "xmin": -115.192864569718,
            "ymin": 9.4163766870772,
            "xmax": -56.1058240510347,
            "ymax": 44.3182805228683,
            "spatialReference": 
                {
                    "wkid": 4326
                }
        }, centered.toJSON());
    t.assertEqual(newCenter.toJSON(), centered.getCenter().toJSON());
    t.assertEqual(59.087040518683295, centered.getWidth());
    t.assertEqual(34.9019038357911, centered.getHeight());
    
    var centeredExpanded = centered.expand(2);
    t.assertEqual(118.1740810373666, centeredExpanded.getWidth());
    t.assertEqual(69.8038076715822, centeredExpanded.getHeight());
    
    var centeredShrunked = centered.expand(0.5);
    t.assertEqual(29.543520259341648, centeredShrunked.getWidth());
    t.assertEqual(17.450951917895548, centeredShrunked.getHeight());
}

doh.registerGroup("geometry.extent.extentTest", [
    {
        name: "testMinXYMaxXY",
        timeout: 5000,
        runTest: function(t)
        {
		    var responseExt = extentResponse.initialExtent;
		    t.assertEqual(responseExt.xmin, extent.xmin);
		    t.assertEqual(responseExt.ymin, extent.ymin);
		    t.assertEqual(responseExt.xmax, extent.xmax);
		    t.assertEqual(responseExt.ymax, extent.ymax);
        }
    },
    {
        name: "testToJson",
        timeout: 5000,
        runTest: function(t)
        {
			t.assertEqual(extentJson, extent.toJSON());
        }
    },	
    /*{
        name: "testToString",
        timeout: 5000,
        runTest: function(t)
        {		
		extentResponse
			t.assertEqual("esri.geometry.Extent(-125.192864569718, 19.4163766870772, -66.1058240510347, 54.3182805228683, esri.SpatialReference(wkid = 4326))", extent.toString());
        }
    },*/
	{
        name: "testSpatialReference",
        timeout: 5000,
        runTest: function(t)
        {
            t.assertEqual(extentResponse.spatialReference.wkid, extent.spatialReference.wkid);
        }
    },
    {
        name: "testGetCenter",
        timeout: 5000,
        runTest: function(t)
        {
		    var center = extent.getCenter();
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
            t.assertEqual(59.087040518683295, extent.getWidth());
        }
    },
    {
        name: "testGetHeight",
        timeout: 5000,
        runTest: function(t)
        {
            t.assertEqual(34.9019038357911, extent.getHeight());
        }
    },	
    {
        name: "testContains",
        timeout: 5000,
        runTest: function(t)
        {
		   //contains
		    t.assertTrue(extent.contains(new esri.geometry.Point(
		        {
		            "x": -117.68623352050781,
		            "y": 54.31640625,
		            "spatialReference": 
		                {
		                    "wkid": 4326
		                }
		        })));
		    t.assertTrue(extent.contains(new esri.geometry.Point(
		        {
		            "x": -66.10696792602539,
		            "y": 48.75904083251953,
		            "spatialReference": 
		                {
		                    "wkid": 4326
		                }
		        })));
		    t.assertTrue(extent.contains(new esri.geometry.Point(
		        {
		            "x": -73.79739761352539,
		            "y": 19.427947998046875,
		            "spatialReference": 
		                {
		                    "wkid": 4326
		                }
		        })));
		    t.assertTrue(extent.contains(new esri.geometry.Point(
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
            t.assertFalse(extent.contains(new esri.geometry.Point(
                {
                    "x": -110.37826538085938,
                    "y": 54.31915283203125,
                    "spatialReference": 
                        {
                            "wkid": 4326
                        }
                })));
            t.assertFalse(extent.contains(new esri.geometry.Point(
                {
                    "x": -66.104736328125,
                    "y": 36.7327880859375,
                    "spatialReference": 
                        {
                            "wkid": 4326
                        }
                })));
            t.assertFalse(extent.contains(new esri.geometry.Point(
                {
                    "x": -100.6622314453125,
                    "y": 19.412841796875,
                    "spatialReference": 
                        {
                            "wkid": 4326
                        }
                })));
            t.assertFalse(extent.contains(new esri.geometry.Point(
                {
                    "x": -125.19538879394531,
                    "y": 51.85890197753906,
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
        extent = new esri.geometry.Extent(-125.192864569718, 19.4163766870772, -66.1058240510347, 54.3182805228683, new esri.SpatialReference(
            {
                "wkid": 4326
            }));
    }, 
	
	function() //tearDown
    { 
        extent = null;
    });
