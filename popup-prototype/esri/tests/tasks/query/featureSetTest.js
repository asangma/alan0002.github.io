dojo.provide("esri.tests.tasks.query.featureSetTest");

dojo.require("esri.tasks.query");

var fsQuery, fsQueryTask;
var fsSRJson = 
    {
        "wkid": 102726
    };

doh.registerGroup("tasks.query.featureSetTest", 
[
    {
	    name: "testDisplayFieldName",
	    timeout: 3000,
	    runTest: function(t)
	    {
			var d = new doh.Deferred();
			d.addCallback(showResults);
			
			function dCallback(featureSet)
			{
				d.callback(featureSet);
			}
			
			function showResults(featureSet)
			{
				t.assertEqual("Name", featureSet.displayFieldName);
		        return featureSet;				
			}
			
			fsQueryTask.execute(fsQuery, dCallback);
			return d;
	    }
    },
    {
        name: "testFieldAliases",
        timeout: 1000,
        runTest: function(t)
        {
            var d = new doh.Deferred();
            d.addCallback(showResults);
            
            function dCallback(featureSet)
            {
                d.callback(featureSet);
            }
            
            function showResults(featureSet)
            {
				var fieldAliases = featureSet.fieldAliases; 
                t.assertEqual("ADDRESS,CITY,DISTRICT,NAME,STATE,ZIPCODE", 
				fieldAliases.ADDRESS + "," + fieldAliases.CITY + "," + fieldAliases.DISTRICT + "," + 
				fieldAliases.NAME + "," + fieldAliases.STATE + "," + fieldAliases.ZIPCODE);
				
                return featureSet;              
            }
            
            fsQueryTask.execute(fsQuery, dCallback);
            return d;			
        }
    },  
    {
        name: "testGeometryType",
        timeout: 1000,
        runTest: function(t)
        {
            var d = new doh.Deferred();
            d.addCallback(showResults);
            
            function dCallback(featureSet)
            {
                d.callback(featureSet);
            }
            
            function showResults(featureSet)
            {
                t.assertEqual("esriGeometryPoint", featureSet.geometryType); 
                return featureSet;              
            }
            
            fsQueryTask.execute(fsQuery, dCallback);
            return d;           
        }
    },    
    {
        name: "testSpatialReference",
        timeout: 1000,
        runTest: function(t)
        {           
            var d = new doh.Deferred();
            d.addCallback(showResults);
            
            function dCallback(featureSet)
            {
                d.callback(featureSet);
            }
            
            function showResults(featureSet)
            {
                t.assertEqual(new esri.SpatialReference(fsSRJson), featureSet.spatialReference); 
                return featureSet;              
            }
            
            fsQueryTask.execute(fsQuery, dCallback);
            return d;  			
        }
    },      
    {
        name: "testFeatures",
        timeout: 1000,
        runTest: function(t)
        {
            var d = new doh.Deferred();
            d.addCallback(showResults);
            
            function dCallback(featureSet)
            {
                d.callback(featureSet);
            }
            
            function showResults(featureSet)
            {
                var baseFeatureJson = 
                    {"geometry":{"x":7617572,"y":664093.5625,"spatialReference":{"wkid":102726}},"attributes":{"NAME":"McKay ES","ADDRESS":"7485 SW Scholls Ferry Road","CITY":"Beaverton","STATE":"OR","ZIPCODE":"97005","DISTRICT":"Beaverton"}};
                t.assertEqual(dojo.toJson(baseFeatureJson), dojo.toJson(featureSet.features[0].toJSON()));
				
                return featureSet;              
            }
            
            fsQueryTask.execute(fsQuery, dCallback);
            return d;  			
        }
    }	
  ], 
  
  function()//setUp()
  {
  	//Construct a QueryTask object using houses layer
	fsQueryTask = new esri.tasks.QueryTask("http://servery/arcgis/rest/services/Portland/PortlandMap/MapServer/3");
	
	//Construct a Query object					
	fsQuery = new esri.tasks.Query();
	fsQuery.outFields = ["NAME", "ADDRESS", "CITY", "STATE", "ZIPCODE", "DISTRICT"];
	fsQuery.useFieldAliases = true;
	fsQuery.outSpatialReference = new esri.SpatialReference(fsSRJson); 
	fsQuery.returnGeometry = true;
	fsQuery.spatialRelationship = esri.tasks.Query.SPATIAL_REL_INTERSECTS;
	fsQuery.text = "Testing Feature Set";
    fsQuery.where = "CITY = 'Beaverton'";
  }, 
  
  function()//tearDown
  {
  	fsQueryTask = null;
    fsQuery = null;
  });
