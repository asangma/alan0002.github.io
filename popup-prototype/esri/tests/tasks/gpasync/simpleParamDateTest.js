dojo.provide("esri.tests.tasks.gpasync.simpleParamDateTest");

dojo.require("esri.tasks.gp");

var gpTask;

doh.registerGroup("tasks.gpasync.simpleParamDateTest", [{
    name: "gpAsync",
    timeout: 3000,
    runTest: function(t){
        //create input param
         var params = {
            "Input_String": "test",
            "Input_Long": 123456,
			"Input_Double":123.456,
			"Input_Boolean":false,
			"Input_Date":1199145600000,
			"Input_Linear_Unit":"",
				
        };
		
		var d = new doh.Deferred();
        function statusCallback(jobInfo){
        	console.log(jobInfo.jobStatus);
         
        }
        function showResult(jobInfo){
        	gpTask.getResultData(jobInfo.jobId, "Output_Date");
        }
        function getData(result){
            t.assertEqual(result.dataType,"GPDate");
			t.assertEqual(result.value,"Mon Dec 31 2007 16:00:00 GMT-0800 (Pacific Standard Time)");
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
