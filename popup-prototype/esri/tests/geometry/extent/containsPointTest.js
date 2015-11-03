dojo.provide("esri.tests.geometry.extent.containsPointTest");

dojo.require("esri.geometry");

var extent;
doh.registerGroup("geometry.extent.containsPointTest", [{
    name: "pointWithinExtent",
    timeout: 5000,
    runTest: function(t){
        var point = new esri.geometry.Point(-103.91354524691593, 38.42435196982797);
        t.assertTrue(extent.contains(point));
        
    }
}, {
    name: "pointOnExtentLine",
    timeout: 5000,
    runTest: function(t){
        var point = new esri.geometry.Point(-111.3393489869947, 29.321753836828186);
        t.assertFalse(extent.contains(point));
        
    }
}, {
    name: "pointOutSideExtent",
    timeout: 5000,
    runTest: function(t){
        var point = new esri.geometry.Point(-82.83384430733747, 40.34068841888056);
        t.assertFalse(extent.contains(point));
        
    }
} ], function()//setUp()
{
      extent = new esri.geometry.Extent(-111.3393489869947, 29.321753836828186, -93.61323683325827, 44.4129033731173, new esri.SpatialReference({
        wkid: 4326
    }));
    
    
}, function()//tearDown
{
    extent = null;
    
});

