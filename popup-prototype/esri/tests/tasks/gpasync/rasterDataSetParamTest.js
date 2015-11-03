dojo.provide("esri.tests.tasks.gpasync.rasterDataSetParamTest");

dojo.require("esri.tasks.gp");

var gpTask;

doh.registerGroup("tasks.gpasync.rasterDataSetParamTest", [{
    name: "gpAsync",
    timeout: 6000,
    runTest: function(t){
        //create input param
        var rasterData = new esri.tasks.RasterData();
        rasterData.format = "tif";
        rasterData.url = "http://jsmatrix:8080/10/lake.tif";
        params = {
            "Input_Raster_Dataset": rasterData,
        
        };
        gpTask.setOutputSpatialReference({
            wkid: 4326
        });
        gpTask.setProcessSpatialReference({
            wkid: 4326
        });
        
        
        var d = new doh.Deferred();
        function statusCallback(jobInfo){
        	console.log(jobInfo.jobStatus);
         
        }
        function showResult(jobInfo){
        	gpTask.getResultData(jobInfo.jobId, "Output_Slope_Grid");
        }
        function getData(result){
            t.assertEqual(result.paramName,"Output_Slope_Grid");
			t.assertEqual(result.dataType,"GPRasterDataLayer");
			if (result.value.url.substr(result.value.url.length - 3, 3) === "tif") {
                t.assertTrue(true);
            };
         	t.assertEqual(result.value.format,"tif");
			d.callback(true);
			
        }
        dojo.connect(gpTask, "onGetResultDataComplete", getData);
        gpTask.submitJob(params, showResult, statusCallback);
		return d;
        
    }
}], function()//setUp()
{
    gpTask = new esri.tasks.Geoprocessor("http://servery/ArcGIS/rest/services/GPServices/byVal_async/GPServer/RasterDataSetParamTest");
}, function()//tearDown
{
    gpTask = null;
});

