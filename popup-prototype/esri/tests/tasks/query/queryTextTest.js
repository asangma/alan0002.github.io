dojo.provide("esri.tests.tasks.query.queryTextTest");

dojo.require("esri.tasks.query");

var queryTask, query;

doh.registerGroup("tasks.query.queryTextTest", [
  {
    name: "queryPointLayer",
    timeout: 3000,
    runTest: function(t)
    {
      
      var expectedResultJSON = {results:[
      {"NAME": undefined ,"STATE":"OR","ZIPCODE": "97225"}] }
      
      var expectedResultsArray =expectedResultJSON.results; 
            
      //query park layer
      queryTask = new esri.tasks.QueryTask("http://servery/arcgis/rest/services/Portland/PortlandMap/MapServer/3");
      var query = new esri.tasks.Query();//have to create a local variable, otherwise it fails,looks like the same queryTask object can't take a new created obj
      query.text = "Ridgewood ES";
	   
      query.outFields = ["STATE","ZIPCODE"];
      var d = new doh.Deferred();
            
      function showResults(results)
	  
      {
	  	
        if (results == null || results.length == 0) 
        {
          t.assertTrue(false);
        }
        else 
        {
          for (var i = 0; i < results.features.length; i++) 
          
          {
            var feature = results.features[i];
            var attribs = feature.attributes;
            var resultString = attribs.NAME + " " +attribs.STATE + " "+attribs.ZIPCODE;
            
            var row = expectedResultsArray[i];
            var expectedString = row.NAME+" "+row.STATE+" "+row.ZIPCODE;
            console.debug(resultString);
            console.debug(expectedString);
            t.assertEqual(expectedString, resultString);
          }
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
      
      var expectedResultJSON = {results:[{"Id":undefined ,"animalnum":"5","species":"bison"}
     	]}
      
      var expectedResultsArray =expectedResultJSON.results; 
            
      //query park layer
       queryTask = new esri.tasks.QueryTask("http://servery/arcgis/rest/services/Portland/PortlandMap/MapServer/2");
      var query = new esri.tasks.Query();//have to create a local variable, otherwise it fails,looks like the same queryTask object can't take a new created obj
      
      query.text = "2";   
	     
      query.outFields = ["animalnum","species"];
      
      var d = new doh.Deferred();
      
      
      function showResults(results)
      {
        if (results == null || results.length == 0) 
        {
          t.assertTrue(false);
        }
        else 
        {
          for (var i = 0; i < results.features.length; i++) //there is a bug in the first record
          
          {
            var feature = results.features[i];
            var attribs = feature.attributes;
            var resultString = attribs.Id+" "+attribs.animalnum+" "+attribs.species;
            
            var row = expectedResultsArray[i];
            var expectedString =row.Id+" "+ row.animalnum+" "+
      		row.species;
            console.debug(resultString);
            console.debug(expectedString);
            t.assertEqual(expectedString, resultString);
          }
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
      
      var expectedResult = [];
      expectedResult.push("undefined 151180");
      expectedResult.push("undefined 151176");
      expectedResult.push("undefined 151178");
      expectedResult.push("undefined 151174");
      expectedResult.push("undefined 142711");
      expectedResult.push("undefined 142734");
      expectedResult.push("undefined 142729");
      expectedResult.push("undefined 142736");
      expectedResult.push("undefined 142759");
      expectedResult.push("undefined 190256");
      
      //query park layer
      queryTask = new esri.tasks.QueryTask("http://servery/arcgis/rest/services/Portland/PortlandMap/MapServer/5");
      var query = new esri.tasks.Query();//have to create a local variable, otherwise it fails,looks like the same queryTask object can't take a new created obj
      query.text="I5 FWY-BARBUR BLVD";

       
      query.outFields = ["LOCALID"];
      
      var d = new doh.Deferred();
      
      function showResults(results)
      {
        if (results == null || results.length == 0) 
        {
          t.assertTrue(false);
        }
        else 
        {
          for (var i = 0; i < results.features.length; i++) 
          {
            var feature = results.features[i];
            var attribs = feature.attributes;
            var resultString = attribs.STREETNAME + " " + attribs.LOCALID;
            console.debug(resultString);
            t.assertEqual(expectedResult[i], resultString);
          }
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
      var expectedResultJSON = {results:[{"NAME":undefined,"FID":"0","EZONE":" "},
     	{"NAME":undefined,"FID":"1","EZONE":"c"},{"NAME":undefined,"FID":"2","EZONE":"c"},
     	{"NAME":undefined,"FID":"3","EZONE":"p"},
     	{"NAME":undefined,"FID":"4","EZONE":"p"},
     	{"NAME":undefined,"FID":"5","EZONE":"p"},
     	{"NAME":undefined,"FID":"6","EZONE":"c"},
     	{"NAME":undefined,"FID":"7","EZONE":"c"},
     	{"NAME":undefined,"FID":"8","EZONE":"c"},
     	{"NAME":undefined,"FID":"9","EZONE":"p"},
     	{"NAME":undefined,"FID":"10","EZONE":"c"},
     	{"NAME":undefined,"FID":"11","EZONE":"p"},
     	{"NAME":undefined,"FID":"12","EZONE":"p"},
     	{"NAME":undefined,"FID":"13","EZONE":"c"},
     	{"NAME":undefined,"FID":"14","EZONE":"c"},
     	{"NAME":undefined,"FID":"15","EZONE":"c"},
     	{"NAME":undefined,"FID":"16","EZONE":"c"},
     	{"NAME":undefined,"FID":"17","EZONE":"c"},
     	{"NAME":undefined,"FID":"18","EZONE":"c"},
     	{"NAME":undefined,"FID":"19","EZONE":"c"},
     	{"NAME":undefined,"FID":"20","EZONE":"c"},
     	{"NAME":undefined,"FID":"21","EZONE":"p"},
     	{"NAME":undefined,"FID":"22","EZONE":"p"},
     	{"NAME":undefined,"FID":"23","EZONE":"p"},
     	{"NAME":undefined,"FID":"24","EZONE":"c"},
     	{"NAME":undefined,"FID":"25","EZONE":"c"},
     	{"NAME":undefined,"FID":"26","EZONE":"p"},
     	{"NAME":undefined,"FID":"27","EZONE":"p"},
     	{"NAME":undefined,"FID":"28","EZONE":"c"},
     	{"NAME":undefined,"FID":"29","EZONE":"p"},
     	{"NAME":undefined,"FID":"30","EZONE":"p"},]}
      
      var expectedResultsArray =expectedResultJSON.results; 
         
      
      //query park layer
      queryTask = new esri.tasks.QueryTask("http://servery/arcgis/rest/services/Portland/PortlandMap/MapServer/6");
      var query = new esri.tasks.Query();//have to create a local variable, otherwise it fails,looks like the same queryTask object can't take a new created obj
      
     query.text = " "; 

      
      query.outFields = ["FID","EZONE"];
      
      var d = new doh.Deferred();
      
      
      function showResults(results)
      {
        if (results == null || results.length == 0) 
        {
          t.assertTrue(false);
        }
        else 
        {
          for (var i = 0; i < results.features.length; i++) 
          {
            var feature = results.features[i];
            var attribs = feature.attributes;
            var resultString =attribs.NAME + " "+ attribs.FID + " " +  attribs.EZONE;
            var row = expectedResultsArray[i];
            var expectedString =row.NAME+" "+ row.FID+" "+row.EZONE;
            console.debug(resultString);
            t.assertEqual(expectedString, resultString);
          }
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
