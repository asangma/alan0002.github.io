dojo.provide("esri.tests.tasks.servicearea.servicearea_onSolveCompleteTest");

dojo.require("esri.tasks.servicearea");

var serviceTask, serviceTaskParams;

doh.registerGroup("tasks.servicearea.servicearea_onSolveCompleteTest", [{
    name: "servicearea_onSolveCompleteTest",
    timeout: 3000,
    runTest: function(){
        serviceTaskParams = new esri.tasks.ServiceAreaParameters();
               
        
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
            console.log("in show");
            if (solveResult == null || solveResult.length == 0) {
            
                doh.assertTrue(false);
            }
            else {
                try {
					console.log(solveResult.serviceAreaPolygons);
					
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
        dojo.connect(serviceTask,"onSolveComplete",showResults);
		dojo.connect(serviceTask, "onError", errorHandler);
		
		serviceTask.solve(serviceTaskParams);
        return d;
    }
}], function()//setUp()
{

}, function()//tearDown
{
});
