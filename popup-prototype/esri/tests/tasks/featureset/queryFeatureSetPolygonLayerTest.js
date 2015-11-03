dojo.provide("esri.tests.tasks.featureset.queryFeatureSetPolygonLayerTest");

dojo.require("esri.tasks.query");

var queryTask, query;

doh.registerGroup("tasks.featureset.queryFeatureSetPolygonLayerTest", [
  {
    name: "displayFieldName",
    timeout: 3000,
    runTest: function(t)
    {
      
      var expectedString = "Name";
      
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
      
      var expectedString = "esriGeometryPolygon";
      
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
      
      var expectedString = "FID,EZONE";
      
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
				fieldAliases.FID+","+fieldAliases.EZONE;
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
      
      var expectedResultJSON ={"geometry":{"rings":[[[7622314.802661523,659007.8714116067],
	  [7622314.802661523,659002.0587591827],[7622296.302698523,659002.4964223504],
	  [7622295.802699521,658996.5587701797],[7622295.30270052,658990.5587821901],
	  [7622314.302662522,658989.9964473546],[7622313.80266352,658981.6214641035],
	  [7622313.80266352,658971.7464838475],[7622273.802743524,658972.8711535186],
	  [7622273.802743524,658983.6211320162],[7622274.302742526,658997.0587691814],
	  [7622274.302414447,659008.3087466806],[7622274.802413449,659021.1837209314],
	  [7622315.302660525,659020.2463868558],[7622314.802661523,659007.8714116067]]],
	  "spatialReference":{"wkid":102726}},
	  "attributes":{"FID":0,"EZONE":" "}};
      
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
         	//console.debug(dojo.toJson(featureSet.features[0].toJSON()));
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
	 queryTask = new esri.tasks.QueryTask("http://servery/ArcGIS/rest/services/Portland/PortlandMap/MapServer/6");
     query = new esri.tasks.Query();
     query.where = "FID=0"; 
     query.returnGeometry = true;
     query.useFieldAliases = true;
     query.outFields = ["FID","EZONE"];
  }, 
  
  function()//tearDown
  {
    queryTask = null;
    query = null;
    
  });
