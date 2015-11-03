dojo.provide("esri.tests.tasks.route.returnPolygonBarriersTest");

dojo.require("esri.tasks.route");

var routeParams,routeTask;

doh.registerGroup("tasks.route.returnPolygonBarriersTest", [{
    name: "returnBarriers",
    timeout: 3000,
    runTest: function(){
        var expectedString = "Location 1 - Location 2";
             
        var inputPoint1 = new esri.geometry.Point(-117.21261978149414, 34.06301021532272, new esri.SpatialReference({
           wkid: 4326
        }));
        var inputPoint2 = new esri.geometry.Point(-117.19682693481445, 34.05828952745651, new esri.SpatialReference({
            wkid: 4326
        }));
        
        var graphicFeatures = [];
        
        graphic1 = new esri.Graphic(inputPoint1);
        graphic2 = new esri.Graphic(inputPoint2);
        
        graphicFeatures[0] = graphic1;
        graphicFeatures[1] = graphic2;
		
		routeParams = new esri.tasks.RouteParameters();
        routeParams.stops = new esri.tasks.FeatureSet();
        routeParams.stops.features = graphicFeatures;    
                 
        routeParams.returnPolygonBarriers = true;
		        
        var d = new doh.Deferred();
        
        
        function showResults(solveResult){
            if (solveResult == null || solveResult.length == 0) {
                doh.assertTrue(false);
            }
            else {
                try {
                
                    console.log(solveResult.polygonBarriers[0].geometry.rings.length);
					if (solveResult.polygonBarriers[0].geometry.rings.length >= 1) {
						doh.assertTrue(true);
						d.callback(true);
					}
                } 
                catch (e) {
                    d.errback(e);
                }
                
            }
        }
        function errorHandler(e){
            console.log(e);
            
        }
        routeTask = new esri.tasks.RouteTask("http://sampleserver3.arcgisonline.com/ArcGIS/rest/services/Network/USA/NAServer/Route");
        dojo.connect(routeTask, "onSolveComplete", showResults);
        dojo.connect(routeTask, "onError", errorHandler);
        routeTask.solve(routeParams);
        return d;
    }
}], function()//setUp()
{

}, function()//tearDown
{
});
