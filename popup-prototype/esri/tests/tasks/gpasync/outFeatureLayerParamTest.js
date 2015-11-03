dojo.provide("esri.tests.tasks.gpasync.outFeatureLayerParamTest");

dojo.require("esri.tasks.gp");

var gpTask;

doh.registerGroup("tasks.gpasync.outFeatureLayerParamTest", [{
    name: "gpAsync",
    timeout: 6000,
    runTest: function(t){
        //create input param
         var params = {            			
        };
		
		var d = new doh.Deferred();
        function showResult(jobInfo){
			console.log(jobInfo);
        	gpTask.getResultData(jobInfo.jobId, "Output_Feature_Layer");
        }
        function getData(result){
           
			t.assertEqual(result.dataType,"GPFeatureRecordSetLayer");
			t.assertTrue(result.value.features.length>0);
			d.callback(true);
			
        }
        dojo.connect(gpTask, "onGetResultDataComplete", getData);
		dojo.connect(gpTask, "onJobComplete", showResult);
        gpTask.submitJob(params);
		return d;
	}
}], function()//setUp()
{
    gpTask = new esri.tasks.Geoprocessor("http://servery/ArcGIS/rest/services/GPServices/byVal_async/GPServer/OutFeatureLayerParamTest");
}, function()//tearDown
{
    gpTask = null;
});
