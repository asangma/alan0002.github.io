dojo.provide("esri.tests.tasks.gpasync.outRasterLayerParamTest");

dojo.require("esri.tasks.gp");

var gpTask;

doh.registerGroup("tasks.gpasync.outRasterLayerParamTest", [{
    name: "gpAsync",
    timeout: 6000,
    runTest: function(t){
        //create input param
         var params = {
            			
        };
		var d = new doh.Deferred();
		 function showResult(jobInfo){
			console.log(jobInfo);
        	gpTask.getResultData(jobInfo.jobId, "Output_Raster_Layer");
        }
        function getData(result){
           
			t.assertEqual(result.dataType,"GPRasterDataLayer");
			t.assertTrue(result.value.url.substr(result.value.url.length-3,3) === "tif");
			d.callback(true);
			
        }
        dojo.connect(gpTask, "onGetResultDataComplete", getData);
		dojo.connect(gpTask, "onJobComplete", showResult);
        gpTask.submitJob(params);
		
		return d;
               
    }
}], function()//setUp()
{
    gpTask = new esri.tasks.Geoprocessor("http://servery/ArcGIS/rest/services/GPServices/byVal_async/GPServer//OutRasterLayerParamTest");
}, function()//tearDown
{
    gpTask = null;
});
