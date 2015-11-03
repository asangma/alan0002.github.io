dojo.provide("esri.tests.tasks.servicearea.service_polygonBarriersTest");

dojo.require("esri.tasks.servicearea");

var serviceTask, serviceTaskParams;

doh.registerGroup("tasks.servicearea.service_polygonBarriersTest", [{
    name: "service_polygonBarriersTest",
    timeout: 3000,
    runTest: function(){
        serviceTaskParams = new esri.tasks.ServiceAreaParameters();
        serviceTaskParams.returnFacilities = true;
        serviceTaskParams.returnPolygonBarriers = true;
        
        //add incidents
        var graphicFeatures = [];
        var graphic1 = new esri.Graphic(new esri.geometry.Point(-13632129.748908881, 4548070.369884981, new esri.SpatialReference({
            wkid: 102100
        })));
        graphicFeatures[0] = graphic1;
        var facilities = new esri.tasks.FeatureSet();
        
        facilities.features = graphicFeatures;
        serviceTaskParams.facilities = facilities;
		
         //add polygonBarriers
        var polygonBarriers = new esri.tasks.FeatureSet();
        var polygonFeatures = [];
        var polygonJson = {
            "rings": [[[-122.41610527, 37.8055858610001], [-122.412457466, 37.803225517], [-122.416148186, 37.8033542630001], [-122.41610527, 37.8055858610001]]],
            "spatialReference": {
                "wkid": 4326
            }
        };
        
        var polygonGraphic = new esri.Graphic(new esri.geometry.Polygon(polygonJson));
        polygonFeatures[0] = polygonGraphic;
        polygonBarriers.features = polygonFeatures;
        
        serviceTaskParams.polygonBarriers = polygonBarriers;
        var d = new doh.Deferred();
        
        
        function showResults(solveResult){
        
            
            if (solveResult == null || solveResult.length == 0) {
            
                doh.assertTrue(false);
            }
            else {
                try {
					
					doh.assertEqual("polygon", solveResult.polygonBarriers[0].geometry.type);
                    doh.assertEqual("-122.41610527", solveResult.polygonBarriers[0].geometry.rings[0][0][0]);
                    doh.assertEqual("37.8055858610001", solveResult.polygonBarriers[0].geometry.rings[0][0][1]);
                    
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
