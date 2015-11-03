dojo.provide("esri.tests.geometry.extent.extentCenterAtTest");

dojo.require("esri.geometry");

var centerExtent = null;

var centerExtentResponse = 
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
                "xmin": -115.192864569718,
                "ymin": 9.4163766870772,
                "xmax": -56.1058240510347,
                "ymax": 44.3182805228683,
                "spatialReference": 
                    {
                        "wkid": 4326
                    }
            },
        "fullExtent": 
            {
                "xmin": -115.192864569718,
                "ymin": 9.4163766870772,
                "xmax": -56.1058240510347,
                "ymax": 44.3182805228683,
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

var centerExtentJson = 
    {
		"xmin": -115.192864569718,
        "ymin": 9.4163766870772,
        "xmax": -56.1058240510347,
        "ymax": 44.3182805228683,
        "spatialReference": 
	        {
	            "wkid": 4326
	        }
     };
 
doh.registerGroup("geometry.extent.extentCenterAtTest", [
    {
        name: "testMinXYMaxXY",
        timeout: 5000,
        runTest: function(t)
        {
		    var responseExt = centerExtentResponse.initialExtent;
		    t.assertEqual(responseExt.xmin, centerExtent.xmin);
		    t.assertEqual(responseExt.ymin, centerExtent.ymin);
		    t.assertEqual(responseExt.xmax, centerExtent.xmax);
		    t.assertEqual(responseExt.ymax, centerExtent.ymax);
        }
    },
    {
        name: "testToJson",
        timeout: 5000,
        runTest: function(t)
        {
			t.assertEqual(centerExtentJson, centerExtent.toJSON());
        }
    },	
    /*{
        name: "testToString",
        timeout: 5000,
        runTest: function(t)
        {		
			t.assertEqual("esri.geometry.Extent(-115.192864569718, 9.4163766870772, -56.1058240510347, 44.3182805228683, esri.SpatialReference(wkid = 4326))", centerExtent.toString());
        }
    },*/
	{
        name: "testSpatialReference",
        timeout: 5000,
        runTest: function(t)
        {
            t.assertEqual(centerExtentResponse.spatialReference.wkid, centerExtent.spatialReference.wkid);
        }
    },
    {
        name: "testGetCenter",
        timeout: 5000,
        runTest: function(t)
        {
		    var center = centerExtent.getCenter();
			console.log("center: ");
			console.log(center.x + ", " + center.y);

		    t.assertEqual(
		        {
		            "x": -85.64934431037635,
		            "y": 26.867328604972748, //returns y value was 26.86732860497275
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
            t.assertEqual(59.087040518683295, centerExtent.getWidth());
        }
    },
    {
        name: "testGetHeight",
        timeout: 5000,
        runTest: function(t)
        {
            t.assertEqual(34.9019038357911, centerExtent.getHeight());
        }
    },	
    {
        name: "testContains",
        timeout: 5000,
        runTest: function(t)
        {
		   //contains
		    t.assertTrue(centerExtent.contains(new esri.geometry.Point(
		        {
		            "x": -107.68623352050781,
		            "y": 44.31640625,
		            "spatialReference": 
		                {
		                    "wkid": 4326
		                }
		        })));
		    t.assertTrue(centerExtent.contains(new esri.geometry.Point(
		        {
		            "x": -56.10696792602539,
		            "y": 38.75904083251953,
		            "spatialReference": 
		                {
		                    "wkid": 4326
		                }
		        })));
		    t.assertTrue(centerExtent.contains(new esri.geometry.Point(
		        {
		            "x": -63.79739761352539,
		            "y": 9.427947998046875,
		            "spatialReference": 
		                {
		                    "wkid": 4326
		                }
		        })));
		    t.assertTrue(centerExtent.contains(new esri.geometry.Point(
		        {
		            "x": -115.19058227539062,
		            "y": 41.91932678222656,
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
            t.assertFalse(centerExtent.contains(new esri.geometry.Point(
                {
                    "x": -90.37826538085938,
                    "y": 44.31915283203125,
                    "spatialReference": 
                        {
                            "wkid": 4326
                        }
                })));
            t.assertFalse(centerExtent.contains(new esri.geometry.Point(
                {
                    "x": -56.104736328125,
                    "y": 26.7327880859375,
                    "spatialReference": 
                        {
                            "wkid": 4326
                        }
                })));
            t.assertFalse(centerExtent.contains(new esri.geometry.Point(
                {
                    "x": -90.6622314453125,
                    "y": 9.412841796875,
                    "spatialReference": 
                        {
                            "wkid": 4326
                        }
                })));
            t.assertFalse(centerExtent.contains(new esri.geometry.Point(
                {
                    "x": -115.19538879394531,
                    "y": 41.85890197753906,
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
		    t.assertTrue(centerExtent.intersects(new esri.geometry.Extent(
		        {
		            "xmin": -154.53125,
		            "ymin": 43.0859375,
		            "xmax": -114.453125,
		            "ymax": 65.234375,
		            "spatialReference": 
		                {
		                    "wkid": 4326
		                }
		        })));
		    t.assertTrue(centerExtent.intersects(new esri.geometry.Extent(
		        {
		            "xmin": -59.9609375,
		            "ymin": -15.9765625,
		            "xmax": -28.6328125,
		            "ymax": 67.34375,
		            "spatialReference": 
		                {
		                    "wkid": 4326
		                }
		        })));
		    t.assertTrue(centerExtent.intersects(new esri.geometry.Extent(
		        {
		            "xmin": -124.296875,
		            "ymin": 12.5,
		            "xmax": -58.5546875,
		            "ymax": 62.0703125,
		            "spatialReference": 
		                {
		                    "wkid": 4326
		                }
		        })));
		    t.assertTrue(centerExtent.intersects(new esri.geometry.Extent(
		        {
		            "xmin": -111.09375,
		            "ymin": 14.609375,
		            "xmax": -62.0703125,
		            "ymax": 32.5390625,
		            "spatialReference": 
		                {
		                    "wkid": 4326
		                }
		        })));
		    t.assertTrue(centerExtent.intersects(new esri.geometry.Extent(
		        {
		            "xmin": -128.1640625,
		            "ymin": -15.2734375,
		            "xmax": -43.3984375,
		            "ymax": 56.4453125,
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
		    t.assertFalse(centerExtent.intersects(new esri.geometry.Extent(
		        {
		            "xmin": -137.3046875,
		            "ymin": 44.4921875,
		            "xmax": -126.2109375,
		            "ymax": 61.3671875,
		            "spatialReference": 
		                {
		                    "wkid": 4326
		                }
		        })));
		    t.assertFalse(centerExtent.intersects(new esri.geometry.Extent(
		        {
		            "xmin": -95.46875,
		            "ymin": 45.8984375,
		            "xmax": -3.359375,
		            "ymax": 68.046875,
		            "spatialReference": 
		                {
		                    "wkid": 4326
		                }
		        })));
		    t.assertFalse(centerExtent.intersects(new esri.geometry.Extent(
		        {
		            "xmin": -54.3359375,
		            "ymin": 10.7421875,
		            "xmax": 88.4375,
		            "ymax": 44.140625,
		            "spatialReference": 
		                {
		                    "wkid": 4326
		                }
		        })));
		    t.assertFalse(centerExtent.intersects(new esri.geometry.Extent(
		        {
		            "xmin": -113.046875,
		            "ymin": -46.953125,
		            "xmax": -57.5,
		            "ymax": 7.9296875,
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
	   var centerExt = new esri.geometry.Extent(-125.192864569718, 19.4163766870772, -66.1058240510347, 54.3182805228683, new esri.SpatialReference(
            {
                "wkid": 4326
            }));
	   var center = centerExt.getCenter();
       var newCenter = center.offset(10, -10);
       centerExtent = centerExt.centerAt(newCenter);
    }, 
	
	function() //tearDown
    { 
        centerExtent = null;
    });
