dojo.provide("esri.tests.tasks.gpsync.outFeatureLayerParamTest");

dojo.require("esri.tasks.gp");

var gpTask;

doh.registerGroup("tasks.gpsync.outFeatureLayerParamTest", [{
    name: "gpSync",
    timeout: 6000,
    runTest: function(t){
        //create input param
         var params = {
            			
        };
		var d = new doh.Deferred();
		function showResult(result){
			
			t.assertEqual(result[0].paramName,"Output_Feature_Layer");
			t.assertEqual(result[0].dataType,"GPFeatureRecordSetLayer");
			t.assertTrue(result[0].value.features.length>0);
				
			d.callback(true);
				
		}
        gpTask.execute(params, showResult);
        return d;       
    }
}], function()//setUp()
{
    gpTask = new esri.tasks.Geoprocessor("http://servery/ArcGIS/rest/services/GPServices/byVal_sync/GPServer/OutFeatureLayerParamTest");
}, function()//tearDown
{
    gpTask = null;
});
