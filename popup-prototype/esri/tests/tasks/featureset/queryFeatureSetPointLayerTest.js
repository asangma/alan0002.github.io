dojo.provide("esri.tests.tasks.featureset.queryFeatureSetPointLayerTest");

dojo.require("esri.tasks.query");

var queryTask, query;

doh.registerGroup("tasks.featureset.queryFeatureSetPointLayerTest", [
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
			//console.log(featureSet.displayFieldName);
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
      
      var expectedString = "esriGeometryPoint";
      
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
      
      var expectedString = "ADDRESS,CITY,DISTRICT,NAME,STATE,ZIPCODE";
      
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
				fieldAliases.ADDRESS + "," + fieldAliases.CITY + "," + fieldAliases.DISTRICT + "," + 
				fieldAliases.NAME + "," + fieldAliases.STATE + "," + fieldAliases.ZIPCODE;
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
      
      var expectedResultJSON = {"geometry":{"x":7617466.5,"y":677547.125,
	  "spatialReference":{"wkid":102726}},"attributes":{"NAME":"Ridgewood ES",
	  "ADDRESS":"10100 SW Inglewood Street","CITY":"Portland","STATE":"OR","ZIPCODE":"97225",
	  "DISTRICT":"Beaverton"}};
	  
      
      var d = new doh.Deferred();
            
      function showResults(featureSet)
      {
        if (featureSet == null || featureSet.features.length == 0) 
        {
          t.assertTrue(false);
        }
        else 
        {
         //console.debug(dojo.toJson(featureSet.features[0].toJSON()));
         t.assertEqual(dojo.toJson(expectedResultJSON), dojo.toJson(featureSet.features[0].toJSON()));
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
	 queryTask = new esri.tasks.QueryTask("http://servery/ArcGIS/rest/services/Portland/PortlandMap/MapServer/3");
     query = new esri.tasks.Query();
     query.where = "NAME='Ridgewood ES'";
     query.returnGeometry = true;
     query.useFieldAliases = true;
     query.outFields = ["NAME", "ADDRESS", "CITY", "STATE", "ZIPCODE", "DISTRICT"];
  }, 
  
  function()//tearDown
  {
    queryTask = null;
    query = null;
    
  });
