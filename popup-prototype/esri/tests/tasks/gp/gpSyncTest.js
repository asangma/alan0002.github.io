dojo.provide("esri.tests.tasks.gp.gpSyncTest");

dojo.require("esri.tasks.gp");

var gpTask;

doh.registerGroup("tasks.gp.gpSyncTest", [
  {
    name: "gpSync",
    timeout: 3000,
    runTest: function(t)
    {
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
        
        function dCallback(results, messages)
        {
			console.log("in dCallback");
            d.callback(results, messages);
			console.log("3");
        }
        
        function showResults(results, messages)
        {
	        console.log("7");
			console.log(messages.type);
			console.log(results[0]);
	        
	        return results;
        }
        
        console.log("1");
        gpTask.setOutputSpatialReference(
        {
            wkid: 102726
        });		
		console.log("1.5");
        gpTask.execute(params, dCallback);
        console.log("2");
        return d;
    }
  }  
  ], 
  
  function()//setUp()
  {
  	console.log("initing gp");
    gpTask = new esri.tasks.Geoprocessor("http://orthogonal.esri.com/arcgis/rest/services/Portland/PortlandMap/GPServer/BufferModel");
	console.log("done");
  }, 
  
  function()//tearDown
  {
  	gpTask = null;
  }
);
