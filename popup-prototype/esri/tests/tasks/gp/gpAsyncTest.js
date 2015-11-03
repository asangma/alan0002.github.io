dojo.provide("esri.tests.tasks.gp.gpAsyncTest");

dojo.require("esri.tasks.gp");

doh.registerGroup("tasks.gp.gpAsyncTest", [
  {
    name: "gpAsync",
    timeout: 3000,
    runTest: function(t)
    {
		var base = [];
        base.push("7617572.00013928, 664093.562355682");
      
		//create input point
		var inputPoint = new esri.geometry.Point();
		inputPoint.x = 7617572.00013928;
		inputPoint.y = 664093.562355682;
		var spatRef = new esri.SpatialReference();
		spatRef.wkid = 102726;
		inputPoint.spatialReference = spatRef;
		
		var graphicFeatures = [];
		
		var graphic = new esri.Graphic();
		graphic.geometry = inputPoint;
		graphicFeatures[0] = graphic;
		
		var featureSet = new esri.tasks.FeatureSet();
		featureSet.features = graphicFeatures;
		
		var distance = new esri.tasks.LinearUnit();
		distance.distance = 10.0;
		distance.units = "esriMiles";
		
		var params = 
		{
		  "InputPoints": featureSet,
		  "Distance": distance
		};
		
		var d = new doh.Deferred();
		d.addCallback(showResults);
		
		function dCallback(results)
		{
		  d.callback(results);
		}
		
		function showResults(results)
		{
			console.log("7");
			if (results.jobStatus == results.STATUS_FAILED) 
			{
			  var s = [];
			  var messages = results.messages;
			  for (var m = 0, m1 = message; m < m1; m++) 
			  {
			    s.push(messages[m].description);
			  }
			  console.log("Job failed: \n" + s.join("\n"));
			}
			else if (results.jobStatus == results.STATUS_SUCCEEDED) 
			{
			  console.log("8");
			  gp.getResultData(results.jobId, "output", displayResults);
			}
			
			return results;
		}
		
		function displayResults(result)
		{
			console.log("9");
			var features = result.value.features;
			for (var f = 0, f1 = features.length; f < f1; f++) 
			{
			  var feature = features[f];
			  var attribs = feature.attributes;
			  var resultString = attribs.FID + " " + attribs.ADDRESS + " " + attribs.CITY + " " + attribs.ZIPCODE + " " + attribs.BUFF_DIST;
			  console.log(resultString);
			  //t.assertTrue(true);
			  t.assertEqual("1     0 1", resultString);
			}
		}
			
		console.log("1");
        var gpTask = new esri.tasks.Geoprocessor("http://orthogonal.esri.com/arcgis/rest/services/Portland/PortlandMap/GPServer/BufferModel");
        console.log("2");
        gpTask.setOutputSpatialReference(
        {
            wkid: 102726
        });
		console.log("submitting job");     
        gpTask.submitJob(params, dCallback);		
		
		console.log("2");
		return d;
    }
  }
  ], 
  
  function()//setUp()
  {
    
  }, 
  
  function()//tearDown
  {
  });
