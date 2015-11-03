dojo.provide("esri.tests.tasks.route.returnDirectionsTest");

dojo.require("esri.tasks.route");

var routeTask;

doh.registerGroup("tasks.route.returnDirectionsTest", [
  {
    name: "returnDirections",
    timeout: 3000,
    runTest: function(t)
    {
		var expectedString = "Location 1 - Location 2";
      	var inputPoint1,inputPoint2, inputPoint3,graphic1,graphic2, routeParams;
      	inputPoint1 =new esri.geometry.Point(-117.21261978149414, 34.06301021532272, new esri.SpatialReference({ wkid: 4326 }));
      	inputPoint2 =new esri.geometry.Point(-117.19682693481445, 34.05828952745651, new esri.SpatialReference({ wkid: 4326 }));
					
		var graphicFeatures = [];
				
		graphic1 = new esri.Graphic(inputPoint1);
		graphic2 = new esri.Graphic(inputPoint2);
		
		graphicFeatures[0] = graphic1;
		graphicFeatures[1] = graphic2;
		
		
		routeParams = new esri.tasks.RouteParameters();
		routeParams.stops = new esri.tasks.FeatureSet();
		
		routeParams.stops.features=graphicFeatures;
				
		routeParams.returnDirections = true;		
		
		var d = new doh.Deferred();
		
		
		function showResults(routeResults)
		{
		    if (routeResults == null || routeResults.length == 0) 
        {
          t.assertTrue(false);
        }
        else 
        {
          console.debug(routeResults.length);
          console.debug(dojo.toJson(routeResults));
          //console.debug(routeResults[0].routeName);
          //t.assertEqual(expectedString, routeResults[0].routeName);
        }
        
        d.callback(true);
		 	
		}
			
		
        routeTask = new esri.tasks.RouteTask("http://servery/ArcGIS/rest/services/USA/NA_TA/NAServer/Route");
       		
		routeTask.solve(routeParams,showResults);
		
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
