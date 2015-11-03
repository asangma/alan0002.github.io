dojo.provide("esri.tests.tasks.gpsync.fileParamTest");

dojo.require("esri.tasks.gp");

var gpTask;

doh.registerGroup("tasks.gpsync.fileParamTest", [{
    name: "gpSync",
    timeout: 6000,
    runTest: function(t){
        //create input param
		var dataFile = new esri.tasks.DataFile();
		dataFile.url ="http://jsmatrix:8080/10/panda.jpg";
        var params = {
            "Input_File":dataFile,
				
        };
		
		var d = new doh.Deferred();
		function showResult(result){
			
			t.assertEqual(result[0].paramName,"Output_File");
			t.assertEqual(result[0].dataType,"GPDataFile");
			if(result[0].value.url.substr(result[0].value.url.length-3,3) === "jpg"){
				t.assertTrue(true);
			};
			
			d.callback(true);
				
		}
        gpTask.execute(params, showResult);
		return d;
            
    }
}], function()//setUp()
{
    gpTask = new esri.tasks.Geoprocessor("http://servery/ArcGIS/rest/services/GPServices/byVal_sync/GPServer/FileParamTest");
}, function()//tearDown
{
    gpTask = null;
});
