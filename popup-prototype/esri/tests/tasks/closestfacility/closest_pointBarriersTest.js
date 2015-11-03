dojo.provide("esri.tests.tasks.closestfacility.closest_pointBarriersTest");

dojo.require("esri.tasks.closestfacility");

var closestTask, closestParams;

doh.registerGroup("tasks.closestfacility.closest_pointBarriersTest", [{
    name: "closest_pointBarriersTest",
    timeout: 3000,
    runTest: function(){
        closestParams = new esri.tasks.ClosestFacilityParameters();
		closestParams.returnPointBarriers = true;
		
        
        var facilitiesGraphicsLayer = new esri.layers.GraphicsLayer();
        
        
        facilitiesGraphicsLayer.add(new esri.Graphic(new esri.geometry.Point(-122.42172718048096, 37.804598808288574, new esri.SpatialReference({
            wkid: 4326
        }))));
        facilitiesGraphicsLayer.add(new esri.Graphic(new esri.geometry.Point(-122.41846561431885, 37.801337242126465, new esri.SpatialReference({
            wkid: 4326
        }))));
        facilitiesGraphicsLayer.add(new esri.Graphic(new esri.geometry.Point(-122.41451740264893, 37.79854774475098, new esri.SpatialReference({
            wkid: 4326
        }))));
        facilitiesGraphicsLayer.add(new esri.Graphic(new esri.geometry.Point(-122.41288661956787, 37.79854774475098, new esri.SpatialReference({
            wkid: 4326
        }))));
        facilitiesGraphicsLayer.add(new esri.Graphic(new esri.geometry.Point(-122.41434574127197, 37.80215263366699, new esri.SpatialReference({
            wkid: 4326
        }))));
        
        
        var facilities = new esri.tasks.FeatureSet();
        facilities.features = facilitiesGraphicsLayer.graphics;
        
        closestParams.facilities = facilities;
        //add incidents
        var graphicFeatures = [];
        var graphic1 = new esri.Graphic(new esri.geometry.Point(-122.41649150848389, 37.80125141143799, new esri.SpatialReference({
            wkid: 4326
        })));
        graphicFeatures[0] = graphic1;
        var incidents = new esri.tasks.FeatureSet();
        
        incidents.features = graphicFeatures;
        closestParams.incidents = incidents;
        
		
		//add point barriers
        
        var pointBarriersFeatures = [];
        var graphic2 = new esri.Graphic(new esri.geometry.Point(-122.40769386291504,37.804856300354004, new esri.SpatialReference({
            wkid: 4326
        })));
        pointBarriersFeatures[0] = graphic2;
        var pointBarriers = new esri.tasks.FeatureSet();
        
        pointBarriers.features = pointBarriersFeatures;
        closestParams.pointBarriers = pointBarriers;
        var d = new doh.Deferred();
        
        
        function showResults(solveResult){
            
            if (solveResult == null || solveResult.length == 0) {
            
                doh.assertTrue(false);
            }
            else {
				
				
                try {
						
						doh.assertEqual("point",solveResult.pointBarriers[0].geometry.type);
						doh.assertEqual("-122.407693863",solveResult.pointBarriers[0].geometry.x);
						doh.assertEqual("37.8048563",solveResult.pointBarriers[0].geometry.y);
						
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
