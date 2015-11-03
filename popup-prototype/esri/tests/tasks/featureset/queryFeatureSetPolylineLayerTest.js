dojo.provide("esri.tests.tasks.featureset.queryFeatureSetPolylineLayerTest");

dojo.require("esri.tasks.query");

var queryTask, query;

doh.registerGroup("tasks.featureset.queryFeatureSetPolylineLayerTest", [
  {
    name: "displayFieldName",
    timeout: 3000,
    runTest: function(t)
    {
      
      var expectedString = "STREETNAME";
      
      var d = new doh.Deferred();
            
      function showResults(featureSet)
      {
        if (featureSet == null || featureSet.features.length == 0) 
        {
          t.assertTrue(false);
        }
        else 
        {
         console.debug(featureSet.displayFieldName);
         t.assertEqual(expectedString, featureSet.displayFieldName);
         }
                
        d.callback(true);
      }
      
      
      queryTask.execute(query, showResults);
      
      return d;
      
    }
  },
  {
    name: "geometryType",
    timeout: 3000,
    runTest: function(t)
    {
      
      var expectedString = "esriGeometryPolyline";
      
      var d = new doh.Deferred();
            
      function showResults(featureSet)
      {
        if (featureSet == null || featureSet.features.length == 0) 
        {
          t.assertTrue(false);
        }
        else 
        {
         console.debug(featureSet.geometryType);
         t.assertEqual(expectedString, featureSet.geometryType);
         }
                
        d.callback(true);
      }
      
      
      queryTask.execute(query, showResults);
      
      return d;
      
    }
  },
  {
    name: "spatialReference",
    timeout: 3000,
    runTest: function(t)
    {
      
      var expectedSRJson =  {
        "wkid": 102726
      };
      
      var d = new doh.Deferred();
            
      function showResults(featureSet)
      {
        if (featureSet == null || featureSet.features.length == 0) 
        {
          t.assertTrue(false);
        }
        else 
        {
         
         t.assertEqual(new esri.SpatialReference(expectedSRJson), featureSet.spatialReference);
         }
                
        d.callback(true);
      }
      
      
      queryTask.execute(query, showResults);
      
      return d;
      
    }
  },
  {
    name: "fieldAliases",
    timeout: 3000,
    runTest: function(t)
    {
      
      var expectedString = "LOCALID";
      
      var d = new doh.Deferred();
            
      function showResults(featureSet)
      {
        if (featureSet == null || featureSet.features.length == 0) 
        {
          t.assertTrue(false);
        }
        else 
        {
         var fieldAliases = featureSet.fieldAliases; 
         var resultString =   
				fieldAliases.LOCALID;
		 t.assertEqual(expectedString,resultString);
         }
                
        d.callback(true);
      }
      
      
      queryTask.execute(query, showResults);
      
      return d;
      
    }
  },
  {
    name: "features",
    timeout: 3000,
    runTest: function(t)
    {
      
      var expectedResultJSON = {"geometry":{"paths":[[[7641156.973,665234.497],
	  [7641047.392,665234.144],[7640990.171,665231.872],[7640948.322,665241.719],
	  [7640934.37,665272.03],[7640929.446,665307.724],[7640938.062,665344.649],
	  [7640977.309,665407.533]]],"spatialReference":{"wkid":102726}},
	  "attributes":{"LOCALID":151180}};
	  
      
      var expectedResultsArray =expectedResultJSON.results; 
      var d = new doh.Deferred();
            
      function showResults(featureSet)
      {
        if (featureSet == null || featureSet.features.length == 0) 
        {
          t.assertTrue(false);
        }
        else 
        {
         //for(var i=0;i<featureSet.features.length;i++){
         	console.debug(dojo.toJson(featureSet.features[0].toJSON()));
         	//console.debug(dojo.toJson(featureSet.features[i].toJSON()));
         	//console.debug(dojo.toJson(expectedResultsArray[i]));
         	t.assertEqual(expectedResultJSON, featureSet.features[0].toJSON());
         //} 
        }
                
        d.callback(true);
      }
      
      
      queryTask.execute(query, showResults);
      
      return d;
      
    }
  }
  ], 
  
  function()//setUp()
  {
	 queryTask = new esri.tasks.QueryTask("http://servery/ArcGIS/rest/services/Portland/PortlandMap/MapServer/5");
     query = new esri.tasks.Query();
     query.where = "STREETNAME='I5 FWY-BARBUR BLVD'";
     query.returnGeometry = true;
     query.useFieldAliases = true;
     query.outFields = ["LOCALID"];
  }, 
  
  function()//tearDown
  {
    queryTask = null;
    query = null;
    
  });
