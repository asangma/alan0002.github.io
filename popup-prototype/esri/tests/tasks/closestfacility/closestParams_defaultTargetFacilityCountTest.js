dojo.provide("esri.tests.tasks.closestfacility.closestParams_defaultTargetFacilityCountTest");

dojo.require("esri.tasks.closestfacility");

var closestTask, closestParams;

doh.registerGroup("tasks.closestfacility.closestParams_defaultTargetFacilityCountTest", [{
    name: "closestParams_defaultTargetFacilityCountTest",
    timeout: 3000,
    runTest: function(){
        closestParams = new esri.tasks.ClosestFacilityParameters();
		console.log(closestParams.defaultTargetFacilityCount);
        closestParams.defaultTargetFacilityCount = 2;     
        
        var facilitiesGraphicsLayer = new esri.layers.GraphicsLayer();
        
        
        facilitiesGraphicsLayer.add(new esri.Graphic(new esri.geometry.Point(-13625960, 4549921, new esri.SpatialReference({
            wkid: 102100
        }))));
        facilitiesGraphicsLayer.add(new esri.Graphic(new esri.geometry.Point(-13626184, 4549247, new esri.SpatialReference({
            wkid: 102100
        }))));
        facilitiesGraphicsLayer.add(new esri.Graphic(new esri.geometry.Point(-13626477, 4549415, new esri.SpatialReference({
            wkid: 102100
        }))));
        facilitiesGraphicsLayer.add(new esri.Graphic(new esri.geometry.Point(-13625385, 4549659, new esri.SpatialReference({
            wkid: 102100
        }))));
        facilitiesGraphicsLayer.add(new esri.Graphic(new esri.geometry.Point(-13624374, 4548254, new esri.SpatialReference({
            wkid: 102100
        }))));
        facilitiesGraphicsLayer.add(new esri.Graphic(new esri.geometry.Point(-13624891, 4548565, new esri.SpatialReference({
            wkid: 102100
        }))));
        
        var facilities = new esri.tasks.FeatureSet();
        facilities.features = facilitiesGraphicsLayer.graphics;
        
        closestParams.facilities = facilities;
        //add incidents
        var graphicFeatures = [];
        var graphic1 = new esri.Graphic(new esri.geometry.Point(-13626184.532082686, 4549246.050456947, new esri.SpatialReference({
            wkid: 102100
        })));
        graphicFeatures[0] = graphic1;
        var incidents = new esri.tasks.FeatureSet();
        
        incidents.features = graphicFeatures;
        closestParams.incidents = incidents;
        closestParams.outSpatialReference = new esri.SpatialReference({
            wkid: 102100
        });
        
        var d = new doh.Deferred();
        
        
        function showResults(solveResult){
            
            if (solveResult == null || solveResult.length == 0) {
            
                doh.assertTrue(false);
            }
            else {
                try {
					if(solveResult.routes[0].geometry.paths.length>=1){
						doh.assertTrue(true);
					}
                   
                   	doh.assertEqual(2,closestParams.defaultTargetFacilityCount);
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
        esriConfig.request.proxyUrl = "../../proxy.jsp";
        closestTask = new esri.tasks.ClosestFacilityTask("http://sampleserver3.arcgisonline.com/ArcGIS/rest/services/Network/USA/NAServer/Closest Facility");
        closestTask.solve(closestParams, showResults, errorHandler);
        return d;
    }
}], function()//setUp()
{

}, function()//tearDown
{
});
