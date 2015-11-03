dojo.provide("esri.tests.tasks.servicearea.service_areaPolylineTest");

dojo.require("esri.tasks.servicearea");

var serviceTask, serviceTaskParams;

doh.registerGroup("tasks.servicearea.service_areaPolylineTest", [{
    name: "service_areaPolylineTest",
    timeout: 3000,
    runTest: function(){
        serviceTaskParams = new esri.tasks.ServiceAreaParameters();
        serviceTaskParams.returnFacilities = true;
        
        
        //add incidents
        var graphicFeatures = [];
        var graphic1 = new esri.Graphic(new esri.geometry.Point(-13632129.748908881, 4548070.369884981, new esri.SpatialReference({
            wkid: 102100
        })));
        graphicFeatures[0] = graphic1;
        var facilities = new esri.tasks.FeatureSet();
        
        facilities.features = graphicFeatures;
        serviceTaskParams.facilities = facilities;
        serviceTaskParams.outSpatialReference = new esri.SpatialReference({
            wkid: 102100
        });
        
        var d = new doh.Deferred();
        
        
        function showResults(solveResult){
        
            
            if (solveResult == null || solveResult.length == 0) {
            
                doh.assertTrue(false);
            }
            else {
                try {
					console.log(solveResult.serviceAreaPolylines);
                    //doh.assertEqual("point", solveResult.facilities[0].type);
                    
                    
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
