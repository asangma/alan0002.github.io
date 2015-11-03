dojo.provide("esri.tests.tasks.servicearea.service_pointBarriersTest");

dojo.require("esri.tasks.servicearea");

var serviceTask, serviceTaskParams;

doh.registerGroup("tasks.servicearea.service_pointBarriersTest", [{
    name: "service_pointBarriersTest",
    timeout: 3000,
    runTest: function(){
        serviceTaskParams = new esri.tasks.ServiceAreaParameters();
        serviceTaskParams.returnPointBarriers = true;
        
        
        //add incidents
        var graphicFeatures = [];
        var graphic1 = new esri.Graphic(new esri.geometry.Point(-13632129.748908881, 4548070.369884981, new esri.SpatialReference({
            wkid: 102100
        })));
        graphicFeatures[0] = graphic1;
        var facilities = new esri.tasks.FeatureSet();
        
        facilities.features = graphicFeatures;
        serviceTaskParams.facilities = facilities;
        //add point barriers
        
        var pointBarriersFeatures = [];
        var graphic2 = new esri.Graphic(new esri.geometry.Point(-122.40769386291504,37.804856300354004, new esri.SpatialReference({
            wkid: 4326
        })));
        pointBarriersFeatures[0] = graphic2;
        var pointBarriers = new esri.tasks.FeatureSet();
        
        pointBarriers.features = pointBarriersFeatures;
        serviceTaskParams.pointBarriers = pointBarriers;
        
        var d = new doh.Deferred();
        
        
        function showResults(solveResult){
            console.log("in show");
            if (solveResult == null || solveResult.length == 0) {
            
                doh.assertTrue(false);
            }
            else {
                try {
					
					doh.assertEqual("point",solveResult.pointBarriers[0].type);
					doh.assertEqual("-122.407693863",solveResult.pointBarriers[0].x);
						doh.assertEqual("37.8048563",solveResult.pointBarriers[0].y);
					if(solveResult.serviceAreaPolygons.length>=1){
						doh.assertTrue(true);
					}
                   
                    
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
