dojo.provide("esri.tests.tasks.route.directionsFeatureSet_propertiesTest");

dojo.require("esri.tasks.route");

var routeTask;

doh.registerGroup("tasks.route.directionsFeatureSet_propertiesTest", [{
    name: "directionsFeatureSet_propertiesTest",
    timeout: 3000,
    runTest: function(){
        var expectedString = "Location 1 - Location 2";
        var inputPoint1, inputPoint2, inputPoint3, graphic1, graphic2, routeParams;
        inputPoint1 = new esri.geometry.Point(-117.21261978149414, 34.06301021532272, new esri.SpatialReference({
            wkid: 4326
        }));
        inputPoint2 = new esri.geometry.Point(-117.19682693481445, 34.05828952745651, new esri.SpatialReference({
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
        
        routeParams.returnDirections = true;
        
        var d = new doh.Deferred();
        
        
        function showResults(solveResult){
            if (solveResult == null || solveResult.length == 0) {
            
                doh.assertTrue(false);
            }
            else {
                try {
                    var directions = solveResult.routeResults[0].directions;
                    doh.assertEqual("Location 1 - Location 2", directions.routeName);
                    doh.assertEqual("1", directions.routeId);
                    //doh.assertEqual(1.03058327277333, directions.totalLength);
					doh.assertEqual(1.03074970265326, directions.totalLength);
                    //doh.assertEqual(1.9, directions.totalTime);
					doh.assertEqual(1.88333333333333, directions.totalTime);
                    //doh.assertEqual(1.89342313363057, directions.totalDriveTime);
					doh.assertEqual(1.89101346116513, directions.totalDriveTime);
                    //doh.assertEqual(-117.212621667493, directions.extent.xmin);
					doh.assertEqual(-117.212621688097, directions.extent.xmin);
                    doh.assertEqual("polyline", directions.mergedGeometry.type);
					d.callback(true);
                    
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
        routeTask.solve(routeParams, showResults, errorHandler);
        return d;
    }
}], function()//setUp()
{

}, function()//tearDown
{
});
