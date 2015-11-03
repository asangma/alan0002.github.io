dojo.provide("esri.tests.tasks.query.queryOutFieldsTest");

dojo.require("esri.tasks.query");

var queryTask, query;

doh.registerGroup("tasks.query.queryOutFieldsTest", [
  {
    name: "queryPointLayer",
    timeout: 3000,
    runTest: function(t)
    {
      
      var expectedName ="Ridgewood ES";
      var expectedFID ="42";   
            
      //query park layer
      queryTask = new esri.tasks.QueryTask("http://servery/arcgis/rest/services/Portland/PortlandMap/MapServer/3");
      var query = new esri.tasks.Query();
      query.where = "NAME='Ridgewood ES'";
	   
      query.outFields = ["NAME","FID"];
      var d = new doh.Deferred();
            
      function showResults(results)
      {
        if (results == null || results.length == 0) 
        {
          t.assertTrue(false);
        }
        else 
        {
          
		  t.assertEqual(expectedName,results.features[0].attributes.NAME);
		  t.assertEqual(expectedFID,results.features[0].attributes.FID);
        }
        
        d.callback(true);
      }
      
      queryTask.execute(query, showResults);
      return d;
      
    }
  },  
  {
    name: "queryMuitiPointLayer",
    timeout: 3000,
    runTest: function(t)
    {
      
      var expectedId = 2;
	  var expectedFID="2",
     
            
      //query park layer
       queryTask = new esri.tasks.QueryTask("http://servery/arcgis/rest/services/Portland/PortlandMap/MapServer/2");
      var query = new esri.tasks.Query();//have to create a local variable, otherwise it fails,looks like the same queryTask object can't take a new created obj
      
      query.where = "Id=2";   
	     
      query.outFields = ["ID","FID"];
      
      var d = new doh.Deferred();
      
      
      function showResults(results)
      {
        if (results == null || results.length == 0) 
        {
          t.assertTrue(false);
        }
        else 
        { 
			
         t.assertEqual(expectedId,results.features[0].attributes.Id);
		 t.assertEqual(expectedFID,results.features[0].attributes.FID);
        }
        
        d.callback(true);
      }
      
      queryTask.execute(query, showResults);
      return d;
      
    }
  } ,
 
  
  
  {
    name: "queryPolylineLayer",
    timeout: 3000,
    runTest: function(t)
    {
      
     var expectedSTREETNAME = "I5 FWY-BARBUR BLVD";
	 var expectedFID =21285;
	
   
      //query park layer
      queryTask = new esri.tasks.QueryTask("http://servery/arcgis/rest/services/Portland/PortlandMap/MapServer/5");
      var query = new esri.tasks.Query();//have to create a local variable, otherwise it fails,looks like the same queryTask object can't take a new created obj
      query.where="STREETNAME='I5 FWY-BARBUR BLVD'";

       
      query.outFields = ["STREETNAME","FID"];
      
      var d = new doh.Deferred();
      
      function showResults(results)
      {
        if (results == null || results.length == 0) 
        {
          t.assertTrue(false);
        }
        else 
        {
         t.assertEqual(expectedSTREETNAME,results.features[0].attributes.STREETNAME);
		 t.assertEqual(expectedFID,results.features[0].attributes.FID);
        }
        
        d.callback(true);
      }
      
      queryTask.execute(query, showResults);
      return d;
    }
  },
  {
    name: "queryPolygonLayer",
    timeout: 3000,
    runTest: function(t)
    {
      var expectedAREA =1725.816;
	  var expectedFID=0;
          
      //query park layer
      queryTask = new esri.tasks.QueryTask("http://servery/arcgis/rest/services/Portland/PortlandMap/MapServer/6");
      var query = new esri.tasks.Query();//have to create a local variable, otherwise it fails,looks like the same queryTask object can't take a new created obj
      
     query.where = "NAME=' '"; 

      
      query.outFields = ["*"];
      
      var d = new doh.Deferred();
      
      
      function showResults(results)
      {
        if (results == null || results.length == 0) 
        {
          t.assertTrue(false);
        }
        else 
        {
         t.assertEqual(expectedAREA,results.features[0].attributes.AREA);
		 t.assertEqual(expectedFID,results.features[0].attributes.FID);
        
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
	//QueryTask is being created inside the test function because it needs a different URL for every test					
	query = new esri.tasks.Query();
	query.returnGeometry = false;
  }, 
  
  function()//tearDown
  {
    query = null;
    
  });
