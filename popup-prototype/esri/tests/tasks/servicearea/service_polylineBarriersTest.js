dojo.provide("esri.tests.tasks.servicearea.service_polylineBarriersTest");

dojo.require("esri.tasks.servicearea");

var serviceTask, serviceTaskParams;

doh.registerGroup("tasks.servicearea.service_polygonlineTest", [{
    name: "service_polylineBarriersTest",
    timeout: 3000,
    runTest: function(){
        serviceTaskParams = new esri.tasks.ServiceAreaParameters();
        serviceTaskParams.returnFacilities = true;
        serviceTaskParams.returnPolylineBarriers = true;
        
        //add incidents
        var graphicFeatures = [];
        var graphic1 = new esri.Graphic(new esri.geometry.Point(-13632129.748908881, 4548070.369884981, new esri.SpatialReference({
            wkid: 102100
        })));
        graphicFeatures[0] = graphic1;
        var facilities = new esri.tasks.FeatureSet();
        
        facilities.features = graphicFeatures;
        serviceTaskParams.facilities = facilities;
		
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
        
        serviceTaskParams.polylineBarriers = polylineBarriers;
        
        
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
        serviceTask = new esri.tasks.ServiceAreaTask("http://sampleserver3.arcgisonline.com/ArcGIS/rest/services/Network/USA/NAServer/Service Area");
        serviceTask.solve(serviceTaskParams, showResults, errorHandler);
        return d;
    }
}], function()//setUp()
{

}, function()//tearDown
{
});
