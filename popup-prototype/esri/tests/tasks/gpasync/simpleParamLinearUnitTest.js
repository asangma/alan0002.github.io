dojo.provide("esri.tests.tasks.gpasync.simpleParamLinearUnitTest");

dojo.require("esri.tasks.gp");

var gpTask;

doh.registerGroup("tasks.gpasync.simpleParamLinearUnitTest", [{
    name: "gpAsync",
    timeout: 3000,
    runTest: function(t){
        //create input param
		 var distUnit = new esri.tasks.LinearUnit();
		 distUnit.distance = 5;
		 distUnit.units = "esriMiles";
		 
         var params = {
            "Input_String": "test",
            "Input_Long": 123456,
			"Input_Double":123.456,
			"Input_Boolean":false,
			"Input_Date":1199145600000,
			"Input_Linear_Unit":distUnit,
				
        };
		
		var d = new doh.Deferred();
        function statusCallback(jobInfo){
        	console.log(jobInfo.jobStatus);
         
        }
        function showResult(jobInfo){
        	gpTask.getResultData(jobInfo.jobId, "Output_Linear_Unit");
        }
        function getData(result){
            t.assertEqual(result.dataType,"GPLinearUnit");
			t.assertEqual(result.value.distance,5);
			t.assertEqual(result.value.units,"esriMiles");
			d.callback(true);
			
        }
        dojo.connect(gpTask, "onGetResultDataComplete", getData);
        gpTask.submitJob(params, showResult, statusCallback);
		return d;
        
    }
}], function()//setUp()
{
    gpTask = new esri.tasks.Geoprocessor("http://servery/ArcGIS/rest/services/GPServices/byVal_async/GPServer/SimpleParamTest");
}, function()//tearDown
{
    gpTask = null;
});
