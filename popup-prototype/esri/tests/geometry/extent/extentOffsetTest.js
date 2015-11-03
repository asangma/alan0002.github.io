dojo.provide("esri.tests.geometry.extent.extentOffsetTest");

dojo.require("esri.geometry");

var extentOffset = null;

var extentOffsetResponse = 
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
                "xmin": -105.192864569718,
                "ymin": 9.4163766870772,
                "xmax": -46.1058240510347,
                "ymax": 44.3182805228683,
				"spatialReference": 
                    {
                        "wkid": 4326
                    }
            },
        "fullExtent": 
            {
		        "xmin": -105.192864569718,
		        "ymin": 9.4163766870772,
		        "xmax": -46.1058240510347,
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

var extentOffsetJson = 
    {
		"xmin": -105.192864569718,
        "ymin": 9.4163766870772,
        "xmax": -46.1058240510347,
        "ymax": 44.3182805228683,
        "spatialReference": 
            {
                "wkid": 4326
            }			
     };	 
 
doh.registerGroup("geometry.extent.extentOffsetTest", [
    {
        name: "testMinXYMaxXY",
        timeout: 5000,
        runTest: function(t)
        {
		    var responseExt = extentOffsetResponse.initialExtent;
		    t.assertEqual(responseExt.xmin, extentOffset.xmin);
		    t.assertEqual(responseExt.ymin, extentOffset.ymin);
		    t.assertEqual(responseExt.xmax, extentOffset.xmax);
		    t.assertEqual(responseExt.ymax, extentOffset.ymax);
        }
    },
    {
        name: "testToJson",
        timeout: 5000,
        runTest: function(t)
        {
			t.assertEqual(extentOffsetJson, extentOffset.toJSON());
        }
    },	
    /*{
        name: "testToString",
        timeout: 5000,
        runTest: function(t)
        {		
			t.assertEqual("esri.geometry.Extent(-105.192864569718, 9.4163766870772, -46.1058240510347, 44.3182805228683, esri.SpatialReference(wkid = 4326))", extentOffset.toString());
        }
    },*/
	{
        name: "testSpatialReference",
        timeout: 5000,
        runTest: function(t)
        {
            t.assertEqual(extentOffsetResponse.spatialReference.wkid, extentOffset.spatialReference.wkid);
        }
    },
    {
        name: "testGetCenter",
        timeout: 5000,
        runTest: function(t)
        {
		    var center = extentOffset.getCenter();
			console.log(center.x + ", " + center.y);
		    t.assertEqual(
		        {
		            "x": -75.64934431037635,
		            "y": 26.867328604972748,
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
            t.assertEqual(59.087040518683295, extentOffset.getWidth());
        }
    },
    {
        name: "testGetHeight",
        timeout: 5000,
        runTest: function(t)
        {
            t.assertEqual(34.9019038357911, extentOffset.getHeight());
        }
    },	
    {
        name: "testContains",
        timeout: 5000,
        runTest: function(t)
        {
		    t.assertTrue(extentOffset.contains(new esri.geometry.Point(
		        {
		            "x": -104.68623352050781,
		            "y": 44.31640625,
		            "spatialReference": 
		                {
		                    "wkid": 4326
		                }
		        })));
		    t.assertTrue(extentOffset.contains(new esri.geometry.Point(
		        {
		            "x": -56.10696792602539,
		            "y": 38.75904083251953,
		            "spatialReference": 
		                {
		                    "wkid": 4326
		                }
		        })));
		    t.assertTrue(extentOffset.contains(new esri.geometry.Point(
		        {
		            "x": -63.79739761352539,
		            "y": 9.427947998046875,
		            "spatialReference": 
		                {
		                    "wkid": 4326
		                }
		        })));
		    t.assertTrue(extentOffset.contains(new esri.geometry.Point(
		        {
		            "x": -100.19058227539062,
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
            t.assertFalse(extentOffset.contains(new esri.geometry.Point(
                {
                    "x": -190.37826538085938,
                    "y": 44.31915283203125,
                    "spatialReference": 
                        {
                            "wkid": 4326
                        }
                })));
            t.assertFalse(extentOffset.contains(new esri.geometry.Point(
                {
                    "x": -16.106736328125,
                    "y": 6.7327880859375,
                    "spatialReference": 
                        {
                            "wkid": 4326
                        }
                })));
            t.assertFalse(extentOffset.contains(new esri.geometry.Point(
                {
                    "x": -9.6622314453125,
                    "y": 9.312841796875,
                    "spatialReference": 
                        {
                            "wkid": 4326
                        }
                })));
            t.assertFalse(extentOffset.contains(new esri.geometry.Point(
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
//"xmin": -105.192864569718,
//        "ymin": 9.4163766870772,
//        "xmax": -46.1058240510347,
//        "ymax": 44.3182805228683,         		
        name: "testIntersects",
        timeout: 5000,
        runTest: function(t)
        {            
		    //intersects
		    t.assertTrue(extentOffset.intersects(new esri.geometry.Extent(
		        {
		            "xmin": -115.53125,
		            "ymin": 10.0859375,
		            "xmax": -80.453125,
		            "ymax": 40.234375,
		            "spatialReference": 
		                {
		                    "wkid": 4326
		                }
		        })));
		    t.assertTrue(extentOffset.intersects(new esri.geometry.Extent(
		        {
		            "xmin": -50.9609375,
		            "ymin": 1.9765625,
		            "xmax": -30.6328125,
		            "ymax": 11.34375,
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
		    t.assertFalse(extentOffset.intersects(new esri.geometry.Extent(
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
		    t.assertFalse(extentOffset.intersects(new esri.geometry.Extent(
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
		  /*  t.assertFalse(extentOffset.intersects(new esri.geometry.Extent(
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
		    t.assertFalse(extentOffset.intersects(new esri.geometry.Extent(
		        {
		            "xmin": -113.046875,
		            "ymin": -46.953125,
		            "xmax": -57.5,
		            "ymax": 7.9296875,
		            "spatialReference": 
		                {
		                    "wkid": 4326
		                }
		        })));*/
        }
    }  	
    ],
	
	function() //setUp
    {		 
	   var offsetExt = new esri.geometry.Extent(-125.192864569718, 19.4163766870772, -66.1058240510347, 54.3182805228683, new esri.SpatialReference(
            {
			
                "wkid": 4326
            }));
			
        extentOffset = offsetExt.offset(20, -10);			
		console.log(extentOffset.xmin + ", " + extentOffset.ymin + ", " + extentOffset.xmax + ", " + extentOffset.ymax);	   
    }, 
	
	function() //tearDown
    { 
        extentOffset = null;
    });
