dojo.provide("esri.tests.tasks.closestfacility.closest_polylineBarriersDataLayerTest");

dojo.require("esri.tasks.closestfacility");

var closestParams;

doh.registerGroup("tasks.closestfacility.closest_polylineBarriersDataLayerTest", [{
    name: "closest_polylineBarriersDataLayerTest",
    timeout: 5000,
    runTest: function(){
        closestParams = new esri.tasks.ClosestFacilityParameters();
		
		closestParams.returnPolylineBarriers = true;
		
		     
        var d = new doh.Deferred();
                
        function showResults(solveResult){
            
            if (solveResult == null || solveResult.length == 0) {
            
                doh.assertTrue(false);
            }
            else {
				
				
                try {
						
						doh.assertEqual("polyline",solveResult.polylineBarriers[0].geometry.type);
						doh.assertEqual("-122.424351424",solveResult.polylineBarriers[0].geometry.paths[0][0][0]);
						doh.assertEqual("37.7919697130001",solveResult.polylineBarriers[0].geometry.paths[0][0][1]);
												
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
        var closestTask = new esri.tasks.ClosestFacilityTask("http://dexter2k8/ArcGIS/rest/services/NA_TA/NAServer/Closest Facility/solveClosestFacility");
		closestTask.solve(closestParams, showResults, errorHandler);
        return d;
    }
}], function()//setUp()
{

}, function()//tearDown
{
});
