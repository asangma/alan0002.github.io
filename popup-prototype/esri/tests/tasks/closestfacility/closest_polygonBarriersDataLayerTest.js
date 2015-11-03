dojo.provide("esri.tests.tasks.closestfacility.closest_polygonBarriersDataLayerTest");

dojo.require("esri.tasks.closestfacility");

var closestParams;

doh.registerGroup("tasks.closestfacility.closest_polygonBarriersDataLayerTest", [{
    name: "closest_polygonBarriersDataLayerTest",
    timeout: 5000,
    runTest: function(){
        closestParams = new esri.tasks.ClosestFacilityParameters();
		
		closestParams.returnPolygonBarriers = true;
		
		     
        var d = new doh.Deferred();
                
        function showResults(solveResult){
            
            if (solveResult == null || solveResult.length == 0) {
            
                doh.assertTrue(false);
            }
            else {
				
				
                try {
						
						
						doh.assertEqual("polygon",solveResult.polygonBarriers[0].geometry.type);
						doh.assertEqual("-122.423687217", solveResult.polygonBarriers[0].geometry.rings[0][0][0]);
                    	doh.assertEqual("37.7902418040001", solveResult.polygonBarriers[0].geometry.rings[0][0][1]);
                    
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
