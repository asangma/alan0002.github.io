dojo.provide("esri.tests.tasks.gpsync.outTblViewParamTest");

dojo.require("esri.tasks.gp");

var gpTask;

doh.registerGroup("tasks.gpsync.outTblViewParamTest", [{
    name: "gpSync",
    timeout: 6000,
    runTest: function(t){
        //create input param
         var params = {
            			
        };
		
		var d = new doh.Deferred();
		function showResult(result){
			t.assertEqual(result[0].paramName,"Output_Table_View");
			t.assertEqual(result[0].dataType,"GPRecordSet");
			t.assertTrue(result[0].value.features.length>0);
			d.callback(true);
				
		}
        gpTask.execute(params, showResult);
		return d;
               
    }
}], function()//setUp()
{
    gpTask = new esri.tasks.Geoprocessor("http://servery/ArcGIS/rest/services/GPServices/byVal_sync/GPServer/OutTblViewParamTests");
}, function()//tearDown
{
    gpTask = null;
});
