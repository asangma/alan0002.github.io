dojo.provide("esri.tests.tasks.closestfacility.closest_polylineBarriersTest");

dojo.require("esri.tasks.closestfacility");

var closestTask, closestParams;

doh.registerGroup("tasks.closestfacility.closest_polylineBarriersTest", [{
    name: "closest_polylineBarriersTest",
    timeout: 3000,
    runTest: function(){
        closestParams = new esri.tasks.ClosestFacilityParameters();
        closestParams.returnPolylineBarriers = true;
        
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
		
		//add polylineBarriers
        var polylineBarriers = new esri.tasks.FeatureSet();
        var polylineFeatures = [];
        var polylineJson = {
            "paths": [[[-122.417821884,37.804512978],[-122.41353035,37.801680565]]],
            "spatialReference": {
                "wkid": 4326
            }
        };
        
        var polylineGraphic = new esri.Graphic(new esri.geometry.Polyline(polylineJson));
        polylineFeatures[0] = polylineGraphic;
        polylineBarriers.features = polylineFeatures;
        
        closestParams.polylineBarriers = polylineBarriers;
        
        
        var d = new doh.Deferred();
        
        
        function showResults(solveResult){
        
            if (solveResult == null || solveResult.length == 0) {
            
                doh.assertTrue(false);
            }
            else {
                try {
					doh.assertEqual("polyline",solveResult.polylineBarriers[0].geometry.type);
					doh.assertEqual("-122.417821884",solveResult.polylineBarriers[0].geometry.paths[0][0][0]);
					doh.assertEqual("37.804512978",solveResult.polylineBarriers[0].geometry.paths[0][0][1]);
					
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
