dojo.provide("esri.tests.tasks.featureset.queryFeatureSetMultiPointLayerTest");

dojo.require("esri.tasks.query");

var queryTask, query;

doh.registerGroup("tasks.featureset.queryFeatureSetMultiPointLayerTest", [
  {
    name: "displayFieldName",
    timeout: 3000,
    runTest: function(t)
    {
      
      var expectedString = "Id";
      
      var d = new doh.Deferred();
            
      function showResults(featureSet)
      {
        if (featureSet == null || featureSet.features.length == 0) 
        {
          t.assertTrue(false);
        }
        else 
        {
         //console.debug(featureSet.displayFieldName);
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
      
      var expectedString = "esriGeometryMultipoint";
      
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
      
      var expectedString = "animalnum,species";
      
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
				fieldAliases.animalnum + "," + fieldAliases.species;
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
      
      var expectedResultJSON = {"geometry":{"points":[[7646055.758290526,660485.9507539849],
	  [7646059.6561503755,660540.5207918795],[7646114.22618827,660478.1550342856],
	  [7646125.919767819,660575.6015305262],[7646180.489805714,660540.5207918795]],
	  "spatialReference":{"wkid":102726}},"attributes":{"animalnum":5,"species":"bison"}};
      
      var d = new doh.Deferred();
            
      function showResults(featureSet)
      {
        if (featureSet == null || featureSet.features.length == 0) 
        {
          t.assertTrue(false);
        }
        else 
        {
        //for (var i=0;i<featureSet.features.length;i++){
         //console.debug(featureSet.features.length);
         console.debug(dojo.toJson(featureSet.features[0].toJSON()));
        // }
         t.assertEqual(dojo.toJson(expectedResultJSON), dojo.toJson(featureSet.features[0].toJSON()));
         //this is only one record. We need to come back for the full loop. Fix it later.
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
	 queryTask = new esri.tasks.QueryTask("http://servery/ArcGIS/rest/services/Portland/PortlandMap/MapServer/2");
     query = new esri.tasks.Query();
     query.where = "Id=2";
     query.returnGeometry = true;
     query.useFieldAliases = true;
     query.outFields = ["animalnum","species"];
  }, 
  
  function()//tearDown
  {
    queryTask = null;
    query = null;
    
  });
