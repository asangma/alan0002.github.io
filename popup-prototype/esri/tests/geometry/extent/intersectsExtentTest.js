dojo.provide("esri.tests.geometry.extent.intersectsExtentTest");

dojo.require("esri.geometry");


var extent;
doh.registerGroup("geometry.extent.intersectsExtentTest", [{
    name: "WithinExtent",
    timeout: 5000,
    runTest: function(t){
        var extentJson = {
            "xmin": -121.0408022603234,
            "ymin": 33.753281875262296,
            "xmax": -104.0333162749817,
            "ymax": 45.96992673797253,
            "spatialReference": {
                "wkid": 4326
            }
        };
        var extentTest = new esri.geometry.Extent(extentJson);
        console.log(extent.intersects(extentTest));
        t.assertTrue(extent.intersects(extentTest));
        
    }
}, {
    name: "intersectExtentLine",
    timeout: 5000,
    runTest: function(t){
        var extentJson = {
            "xmin": -85.82812000898213,
            "ymin": 8.361823925315527,
            "xmax": -64.02979290100896,
            "ymax": 31.83694542620971,
            "spatialReference": {
                "wkid": 4326
            }
        };
        var extentTest = new esri.geometry.Extent(extentJson);
        t.assertTrue(extent.intersects(extentTest));
    }
}, {
    name: "outSideExtent",
    timeout: 5000,
    runTest: function(t){
        var extentJson = {
            "xmin": -49.65726953311457,
            "ymin": 13.15266504794699,
            "xmax": -6.53969942943138,
            "ymax": 49.08397346768298,
            "spatialReference": {
                "wkid": 4326
            }
        };
        var extentTest = new esri.geometry.Extent(extentJson);
        t.assertTrue(extent.intersects(extentTest)===null);
        
    }
}, ], function()//setUp()
{
    extent = new esri.geometry.Extent(-124.87347515842858, 14.350375328604855, -75.04872748306133, 49.8025996360777, new esri.SpatialReference({
        wkid: 4326
    }));
    
    
}, function()//tearDown
{
    extent = null;
    
});

