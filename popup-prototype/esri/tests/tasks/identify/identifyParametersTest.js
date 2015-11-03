dojo.provide("esri.tests.tasks.identify.identifyParametersTest");

dojo.require("esri.tasks.identify");

var ipIdentifyParams;

var iSRJson = 
    {
        "wkid": 102726
    };
	
var identifyPointJson = 
    {
        "x": 7667299.00009452,
        "y": 691389.937552854,
        "spatialReference": 
            {
                "wkid": 102726
            }
    };

doh.registerGroup("tasks.identify.identifyParametersTest",
	[
		{
			name: "testGeometry",
			timeout: 3000,
			runTest: function(t)
			{
				t.assertEqual(new esri.geometry.Point(identifyPointJson), ipIdentifyParams.geometry);
			}
		},
        {
            name: "testSpatialReference",
            timeout: 3000,
            runTest: function(t)
            {
                t.assertEqual(new esri.SpatialReference(iSRJson), ipIdentifyParams.spatialReference);
            }
        },
        {
            name: "testLayerIDs",
            timeout: 3000,
            runTest: function(t)
            {
                t.assertEqual([3], ipIdentifyParams.layerIds);
            }
        },
        {
            name: "testTolerance",
            timeout: 3000,
            runTest: function(t)
            {
                t.assertEqual(1, ipIdentifyParams.tolerance);
            }
        },
        {
            name: "testReturnGeometry",
            timeout: 3000,
            runTest: function(t)
            {
                t.assertTrue(ipIdentifyParams.returnGeometry);
            }
        },
        {
            name: "testExtent",
            timeout: 3000,
            runTest: function(t)
            {
                var extent = ipIdentifyParams.mapExtent;
                t.assertEqual(7600793.3140665, extent.xmin);
                t.assertEqual(639807.32018124, extent.ymin);
                t.assertEqual(7686119.41017921, extent.xmax);
                t.assertEqual(704484.822413567, extent.ymax);
            }
        },
        {
            name: "testWidth",
            timeout: 3000,
            runTest: function(t)
            {
                t.assertEqual(3000, ipIdentifyParams.width);
            }
        },
        {
            name: "testHeight",
            timeout: 3000,
            runTest: function(t)
            {
                t.assertEqual(2500, ipIdentifyParams.height);
            }
        },
        {
            name: "testDPI",
            timeout: 3000,
            runTest: function(t)
            {
                t.assertEqual(96, ipIdentifyParams.dpi);
            }
        },
        {
            name: "testLayerOption",
            timeout: 3000,
            runTest: function(t)
            {
                t.assertEqual(esri.tasks.IdentifyParameters.LAYER_OPTION_TOP, ipIdentifyParams.layerOption);
            }
        }               		               						
	],
		
	function()//setUp()
	{
		ipIdentifyParams = new esri.tasks.IdentifyParameters();	
		ipIdentifyParams.geometry = new esri.geometry.Point(identifyPointJson);
        ipIdentifyParams.spatialReference = new esri.SpatialReference(iSRJson);
		ipIdentifyParams.layerIds = [3];//houses layer
		ipIdentifyParams.tolerance = 1;
        ipIdentifyParams.returnGeometry = true;
        ipIdentifyParams.mapExtent = new esri.geometry.Extent(7600793.3140665, 639807.32018124, 7686119.41017921, 704484.822413567, new esri.SpatialReference({ wkid: 102726 }));		
		ipIdentifyParams.width = 3000;
		ipIdentifyParams.height = 2500;
        ipIdentifyParams.dpi = 96;
        ipIdentifyParams.layerOption = esri.tasks.IdentifyParameters.LAYER_OPTION_TOP;						
	},
	
	function()//tearDown
	{
		ipIdentifyParams = null;
	}
);