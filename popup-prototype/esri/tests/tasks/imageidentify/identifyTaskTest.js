dojo.provide("esri.tests.tasks.imageidentify.identifyTaskTest");

dojo.require("esri.tasks.imageserviceidentify");

var identifyTask, identifyParams;


doh.registerGroup("tasks.imageidentify.identifyTaskTest", [{
    name: "imageServiceIdentifyTask",
    timeout: 3000,
    runTest: function(t){
    
        identifyParams.geometry = new esri.geometry.Point(7617572.00013928, 664093.562355682, new esri.SpatialReference({
            wkid: 102726
        }));
        
        
        var d = new doh.Deferred();
        
        function showResults(result){
            if (result == null) {
                t.assertTrue(false);
                
            }
            else {
				console.log(result.catalogItems.objectIdFieldName);
                t.assertEqual("OBJECTID",result.catalogItems.objectIdFieldName);             
                                
            }
            
            d.callback(true);
        }
        
        identifyTask.execute(identifyParams,showResults);
        
        return d;
    }
}, ], function()//setUp()
{
    identifyTask = new esri.tasks.ImageServiceIdentifyTask("http://servery/ArcGIS/rest/services/World/Temperature/ImageServer");
    
    identifyParams = new esri.tasks.ImageServiceIdentifyParameters();
    identifyParams.geometry = new esri.geometry.Point(10, 60, new esri.SpatialReference({
        wkid: 4328
    }));
    identifyParams.pixelSizeX = 0.5;
    identifyParams.pixelSizeY = 0.5;
    var mr = new esri.layers.MosaicRule();
    mr.method = esri.layers.MosaicRule.METHOD_LOCKRASTER;
    mr.lockRasterIds = [32, 454, 14];
    identifyParams.mosaicRule = mr;
}, function()//tearDown
{
    identifyTask = null;
    identifyParams = null;
});
