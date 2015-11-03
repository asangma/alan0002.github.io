dojo.provide("esri.tests.tasks.servicearea.serviceparam_attributeParameterValuesTest");

dojo.require("esri.tasks.servicearea");

var serviceTask, serviceTaskParams;

doh.registerGroup("tasks.servicearea.serviceparam_attributeParameterValuesTest", [{
    name: "serviceparam_attributeParameterValuesTest",
    timeout: 3000,
    runTest: function(){
        serviceTaskParams = new esri.tasks.ServiceAreaParameters();
        serviceTaskParams.attributeParameterValues = [
          {
            attributeName: "Time",
            parameterName: "15 MPH",
            value: 15
          },
          {
            attributeName: "Time",
            parameterName: "20 MPH",
            value: 20
          }
        ];
;

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
            wkid: 4140
        });   
       
       
        
        var d = new doh.Deferred();
        
        
        function showResults(solveResult){
            console.log("in show");
            if (solveResult == null || solveResult.length == 0) {
            
                doh.assertTrue(false);
            }
            else {
                try {
					console.log(serviceTaskParams.attributeParameterValues);
					doh.assertEqual([
          {
            attributeName: "Time",
            parameterName: "15 MPH",
            value: 15
          },
          {
            attributeName: "Time",
            parameterName: "20 MPH",
            value: 20
          }
        ],serviceTaskParams.attributeParameterValues);
					
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
