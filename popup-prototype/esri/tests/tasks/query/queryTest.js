dojo.provide("esri.tests.tasks.query.queryTest");

dojo.require("esri.tasks.query");

var qQuery;
var qSRJson = 
    {
        "wkid": 102726
    };
var pointJson = 
    {
        "x": 7667299.00009452,
        "y": 691389.937552854,
        "spatialReference": 
            {
                "wkid": 102726
            }
    };

doh.registerGroup("tasks.query.queryTest", 
[
    {
	    name: "testOutFields",
	    timeout: 1000,
	    runTest: function(t)
	    {
			t.assertEqual(["NAME", "ADDRESS", "CITY", "STATE", "ZIPCODE", "DISTRICT"], qQuery.outFields);
	    }
    },
    {
        name: "testUseFieldAliases",
        timeout: 1000,
        runTest: function(t)
        {
            t.assertFalse(qQuery.useFieldAliases);			
        }
    },  
    {
        name: "testGeometry",
        timeout: 1000,
        runTest: function(t)
        {
            t.assertEqual(new esri.geometry.Point(pointJson), qQuery.geometry);
        }
    },    
    {
        name: "testSpatialReference",
        timeout: 1000,
        runTest: function(t)
        {
            t.assertEqual(new esri.SpatialReference(qSRJson), qQuery.outSpatialReference);
        }
    },      
    {
        name: "testReturnGeometry",
        timeout: 1000,
        runTest: function(t)
        {
            t.assertTrue(qQuery.returnGeometry);
        }
    },      
    {
        name: "testSpatialRelationship",
        timeout: 1000,
        runTest: function(t)
        {
            t.assertEqual(esri.tasks.Query.SPATIAL_REL_INTERSECTS, qQuery.spatialRelationship);
        }
    },      
    {
        name: "testText",
        timeout: 1000,
        runTest: function(t)
        {
            t.assertEqual("Testing Query", qQuery.text);
        }
    },	
    {
        name: "testWhere",
        timeout: 1000,
        runTest: function(t)
        {
            t.assertEqual("CITY = 'Beaverton'", qQuery.where);
        }
    }	
  ], 
  
  function()//setUp()
  {
	//Construct a Query object					
	qQuery = new esri.tasks.Query();
	qQuery.outFields = ["NAME", "ADDRESS", "CITY", "STATE", "ZIPCODE", "DISTRICT"];
	qQuery.useFieldAliases = false;
	qQuery.geometry = new esri.geometry.Point(pointJson);
	qQuery.outSpatialReference = new esri.SpatialReference(qSRJson); 
	qQuery.returnGeometry = true;
	qQuery.spatialRelationship = esri.tasks.Query.SPATIAL_REL_INTERSECTS;
	qQuery.text = "Testing Query";
    qQuery.where = "CITY = 'Beaverton'";
  }, 
  
  function()//tearDown
  {
    qQuery = null;
  });
