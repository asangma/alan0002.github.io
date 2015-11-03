dojo.provide("esri.tests.tasks.gpasync.rSetTblParamTest");

dojo.require("esri.tasks.gp");

var gpTask;

doh.registerGroup("tasks.gpasync.rSetTblParamTest", [{
    name: "gpAsync",
    timeout: 6000,
    runTest: function(t){
        //create input param
        var inputRecordSetJson = {
            "features": [{
                "attributes": {
                    "OID": 1,
                    "TextFld": "SampleText",
                    "SIntFld": 200,
                    "LIntFld": 20000,
                    "DblFld": 12345.12345,
                    "DateFld": 229564800000
                }
            
            }],
           };
        
        var inputRecordSet = new esri.tasks.FeatureSet(inputRecordSetJson);
        var params = {
            "Input_Record_Set": inputRecordSet
        
        };
        
        var d = new doh.Deferred();
        function statusCallback(jobInfo){
            console.log(jobInfo.jobStatus);
            
        }
        function showResult(jobInfo){
            gpTask.getResultData(jobInfo.jobId, "Output_DBF");
        }
        function getData(result){
			switch (result.paramName) {
				case "Output_DBF":
					t.assertEqual(result.dataType, "GPRecordSet");
					t.assertTrue(result.value.features.length>0);
					break;
				case "Output_GDB_Table":
					t.assertEqual(result.dataType, "GPRecordSet");
					t.assertTrue(result.value.features.length>0);
			}
            d.callback(true);
            
        }
        dojo.connect(gpTask, "onGetResultDataComplete", getData);
		gpTask.submitJob(params, showResult, statusCallback);
        return d;
        
    }
}], function()//setUp()
{
    gpTask = new esri.tasks.Geoprocessor("http://servery/ArcGIS/rest/services/GPServices/byVal_async/GPServer/RSetTblParamTest");
}, function()//tearDown
{
    gpTask = null;
});

