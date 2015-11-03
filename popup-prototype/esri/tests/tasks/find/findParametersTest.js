dojo.provide("esri.tests.tasks.find.findParametersTest");

dojo.require("esri.tasks.find");

var fpFindParameter;

var fpSRJson = 
    {
        "wkid": 102726
    };

doh.registerGroup("tasks.find.findParametersTest",
	[
		{
			name: "testSearchText",
			timeout: 5000,
			runTest: function(t)
			{		
                t.assertEqual("Beaverton", fpFindParameter.searchText);
			}
		},
        {
            name: "testContains",
            timeout: 5000,
            runTest: function(t)
            {       
                t.assertFalse(fpFindParameter.contains);
            }
        },	
        {
            name: "testSearchFields",
            timeout: 5000,
            runTest: function(t)
            {       
                t.assertEqual(["DISTRICT"], fpFindParameter.searchFields);
            }
        },
        {
            name: "testSpatialReference",
            timeout: 5000,
            runTest: function(t)
            {       
                t.assertEqual(new esri.SpatialReference(fpSRJson), fpFindParameter.outSpatialReference);
            }
        },
        {
            name: "testLayerIDs",
            timeout: 5000,
            runTest: function(t)
            {       
                t.assertEqual([3], fpFindParameter.layerIds);
            }
        },
        {
            name: "testReturnGeometry",
            timeout: 5000,
            runTest: function(t)
            {       
                t.assertFalse(fpFindParameter.returnGeometry);
            }
        }
	],
		
	function()//setUp()
	{
		fpFindParameter = new esri.tasks.FindParameters();
		fpFindParameter.contains = false;
		fpFindParameter.returnGeometry = false;
        fpFindParameter.layerIds = [3];//houses layer
        fpFindParameter.searchFields = ["DISTRICT"];
        fpFindParameter.searchText = "Beaverton";
		fpFindParameter.outSpatialReference = new esri.SpatialReference(fpSRJson);;
	},
	
	function()//tearDown
	{
		fpFindParameter = null;
	}
);