dojo.provide("esri.tests.tasks.gpsync.rasterDataSetParamTest");

dojo.require("esri.tasks.gp");

var gpTask;

doh.registerGroup("tasks.gpsync.rasterDataSetParamTest", [{
    name: "gpSync",
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
        function showResult(result){
			console.log(result[0]);
        
            t.assertEqual(result[0].paramName, "Output_Slope_Grid");
            t.assertEqual(result[0].dataType, "GPRasterDataLayer");
			
            if (result[0].value.url.substr(result[0].value.url.length - 3, 3) === "tif") {
                t.assertTrue(true);
            };
         
			t.assertEqual(result[0].value.format,"tif");
           
            d.callback(true);
            
        }
        gpTask.execute(params, showResult);
        return d;
        
    }
}], function()//setUp()
{
    gpTask = new esri.tasks.Geoprocessor("http://servery/ArcGIS/rest/services/GPServices/byVal_sync/GPServer/RasterDataSetParamTest");
}, function()//tearDown
{
    gpTask = null;
});
