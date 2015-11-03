dojo.provide("esri.tests.tasks.gpasync.fileParamOnCompleteTest");

dojo.require("esri.tasks.gp");

var gpTask;

doh.registerGroup("tasks.gpasync.fileParamOnCompleteTest", [{
    name: "gpAsync",
    timeout: 6000,
    runTest: function(t){
        //create input param
        var dataFile = new esri.tasks.DataFile();
        dataFile.url = "http://jsmatrix:8080/10/panda.jpg";
        var params = {
            "Input_File": dataFile,
        
        };
        
        var d = new doh.Deferred();
        function statusCallback(jobInfo){
        	console.log(jobInfo.jobStatus);
         
        }
        function showResult(jobInfo){
        	gpTask.getResultData(jobInfo.jobId, "Output_File");
        }
        function getData(result){
            t.assertEqual(result.paramName,"Output_File");
			t.assertEqual(result.dataType,"GPDataFile");
			if(result.value.url.substr(result.value.url.length-3,3) === "jpg"){
				t.assertTrue(true);
			};
			d.callback(true);
			
        }
        dojo.connect(gpTask, "onGetResultDataComplete", getData);
		dojo.connect(gpTask, "onJobComplete", showResult);
        gpTask.submitJob(params);
		return d;
        
    }
}], function()//setUp()
{
    gpTask = new esri.tasks.Geoprocessor("http://servery/ArcGIS/rest/services/GPServices/byVal_async/GPServer/FileParamTest");
}, function()//tearDown
{
    gpTask = null;
});

