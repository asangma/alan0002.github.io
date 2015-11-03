dojo.provide("esri.tests.geometry.extent.extentUnionTest");

dojo.require("esri.geometry");

var unionExtent = null;

var unionExtentResponse = 
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
		        "ymin": 9.4163766870772,
		        "xmax": -56.1058240510347,
		        "ymax": 54.3182805228683,
                "spatialReference": 
                    {
                        "wkid": 4326
                    }
            },
        "fullExtent": 
            {
                "xmin": -125.192864569718,
                "ymin": 9.4163766870772,
                "xmax": -56.1058240510347,
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

var unionExtentJson = 
    {
		"xmin": -125.192864569718,
        "ymin": 9.4163766870772,
        "xmax": -56.1058240510347,
        "ymax": 54.3182805228683,
        "spatialReference": 
            {
                "wkid": 4326
            }			
     };
 
doh.registerGroup("geometry.extent.extentUnionTest", [
    {
        name: "testMinXYMaxXY",
        timeout: 5000,
        runTest: function(t)
        {
		    var responseExt = unionExtentResponse.initialExtent;
		    t.assertEqual(responseExt.xmin, unionExtent.xmin);
		    t.assertEqual(responseExt.ymin, unionExtent.ymin);
		    t.assertEqual(responseExt.xmax, unionExtent.xmax);
		    t.assertEqual(responseExt.ymax, unionExtent.ymax);
        }
    },
    {
        name: "testToJson",
        timeout: 5000,
        runTest: function(t)
        {
			t.assertEqual(unionExtentJson, unionExtent.toJSON());
        }
    },	
    /*{
        name: "testToString",
        timeout: 5000,
        runTest: function(t)
        {		
			t.assertEqual("esri.geometry.Extent(-125.192864569718, 9.4163766870772, -56.1058240510347, 54.3182805228683, esri.SpatialReference(wkid = 4326))", unionExtent.toString());
        }
    },*/
	{
        name: "testSpatialReference",
        timeout: 5000,
        runTest: function(t)
        {
            t.assertEqual(unionExtentResponse.spatialReference.wkid, unionExtent.spatialReference.wkid);
        }
    },
    {
        name: "testGetCenter",
        timeout: 5000,
        runTest: function(t)
        {
		    var center = unionExtent.getCenter();
		    t.assertEqual(
		        {
		            "x": -90.64934431037635,
		            "y": 31.867328604972748, //returns y value 26.867328604972748
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
            t.assertEqual(69.0870405186833, unionExtent.getWidth());
        }
    },
    {
        name: "testGetHeight",
        timeout: 5000,
        runTest: function(t)
        {
            t.assertEqual(44.9019038357911, unionExtent.getHeight());
        }
    },	
    {
        name: "testContains",
        timeout: 5000,
        runTest: function(t)
        {
		   //contains
		    t.assertTrue(unionExtent.contains(new esri.geometry.Point(
		        {
		            "x": -107.68623352050781,
		            "y": 44.31640625,
		            "spatialReference": 
		                {
		                    "wkid": 4326
		                }
		        })));
		    t.assertTrue(unionExtent.contains(new esri.geometry.Point(
		        {
		            "x": -56.10696792602539,
		            "y": 38.75904083251953,
		            "spatialReference": 
		                {
		                    "wkid": 4326
		                }
		        })));
		    t.assertTrue(unionExtent.contains(new esri.geometry.Point(
		        {
		            "x": -63.79739761352539,
		            "y": 9.427947998046875,
		            "spatialReference": 
		                {
		                    "wkid": 4326
		                }
		        })));
		    t.assertTrue(unionExtent.contains(new esri.geometry.Point(
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
            t.assertFalse(unionExtent.contains(new esri.geometry.Point(
                {
                    "x": -190.37826538085938,
                    "y": 44.31915283203125,
                    "spatialReference": 
                        {
                            "wkid": 4326
                        }
                })));
            t.assertFalse(unionExtent.contains(new esri.geometry.Point(
                {
                    "x": -56.106736328125,
                    "y": 6.7327880859375,
                    "spatialReference": 
                        {
                            "wkid": 4326
                        }
                })));
            t.assertFalse(unionExtent.contains(new esri.geometry.Point(
                {
                    "x": -90.6622314453125,
                    "y": 9.312841796875,
                    "spatialReference": 
                        {
                            "wkid": 4326
                        }
                })));
            t.assertFalse(unionExtent.contains(new esri.geometry.Point(
                {
                    "x": -115.19538879394531,
                    "y": 55.85890197753906,
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
		    t.assertTrue(unionExtent.intersects(new esri.geometry.Extent(
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
		    t.assertTrue(unionExtent.intersects(new esri.geometry.Extent(
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
		    t.assertTrue(unionExtent.intersects(new esri.geometry.Extent(
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
		    t.assertTrue(unionExtent.intersects(new esri.geometry.Extent(
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
		    t.assertTrue(unionExtent.intersects(new esri.geometry.Extent(
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
		         //-125.192864569718, 19.4163766870772, -56.1058240510347, 54.3182805228683
		    t.assertFalse(unionExtent.intersects(new esri.geometry.Extent(
		        {
		            "xmin": -187.3046875,
		            "ymin": 54.4921875,
		            "xmax": -126.2109375,
		            "ymax": 61.3671875,
		            "spatialReference": 
		                {
		                    "wkid": 4326
		                }
		        })));
		    t.assertFalse(unionExtent.intersects(new esri.geometry.Extent(
		        {
		            /*"xmin": -95.46875,
		            "ymin": 45.8984375,
		            "xmax": -60.359375,
		            "ymax": 50.3080,*/ //contains or intersects
                    "xmin": -135.46875,
                    "ymin": 45.8984375,
                    "xmax": -130.359375,
                    "ymax": 50.3080,					
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
	   var unionExt = new esri.geometry.Extent(-125.192864569718, 19.4163766870772, -66.1058240510347, 54.3182805228683, new esri.SpatialReference(
            {
			
                "wkid": 4326
            }));
			
        var offsetExtent = unionExt.offset(10, -10);			
        unionExtent = unionExt.union(offsetExtent);
		console.log(unionExtent.xmin + ", " + unionExtent.ymin + ", " + unionExtent.xmax + ", " + unionExtent.ymax);	   
    }, 
	
	function() //tearDown
    { 
        unionExtent = null;
    });
