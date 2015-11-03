dojo.provide("esri.tests.tasks.gpsync.outRasterLayerParamTest");

dojo.require("esri.tasks.gp");

var gpTask;

doh.registerGroup("tasks.gpsync.outRasterLayerParamTest", [{
    name: "gpSync",
    timeout: 6000,
    runTest: function(t){
        //create input param
         var params = {
            			
        };
		var d = new doh.Deferred();
		function showResult(result){
			
			t.assertEqual(result[0].paramName,"Output_Raster_Layer");
			t.assertEqual(result[0].dataType,"GPRasterDataLayer");
			t.assertTrue(result[0].value.url.substr(result[0].value.url.length-3,3) === "tif");
			
			d.callback(true);	
		}
        gpTask.execute(params, showResult);
		return d;
               
    }
}], function()//setUp()
{
    gpTask = new esri.tasks.Geoprocessor("http://servery/ArcGIS/rest/services/GPServices/byVal_sync/GPServer//OutRasterLayerParamTest");
}, function()//tearDown
{
    gpTask = null;
});
