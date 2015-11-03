dojo.provide("esri.tests.geometry.extent.contains");

var extent;

doh.registerGroup("geometry.extent.contains", [{
    name: "contains_point",
    timeout: 5000,
    runTest: function(t){
        console.log("extent: " + extent);
        var point = new esri.geometry.Point(20, 20);
        t.assertTrue(extent.contains(point));
        
        
    }
}, {
    name: "contains_extent",
    timeout: 5000,
    runTest: function(t){
        var extent_ = new esri.geometry.Extent(20, 10, 80, 80, new esri.SpatialReference({
            wkid: 4326
        }));
        t.assertTrue(extent.contains(extent_));
        
    }
}, ], function()//setUp()
{
    extent = new esri.geometry.Extent(10, 10, 100, 100, new esri.SpatialReference({
        wkid: 4326
    }));
    
    
}, function()//tearDown
{
    extent = null;
    
});

