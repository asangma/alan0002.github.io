dojo.provide("esri.tests.geometry.extent.intersects");


var extent;

doh.registerGroup("geometry.extent.intersects", [{
    name: "intersects_point",
    timeout: 5000,
    runTest: function(t){
        var point = new esri.geometry.Point(20, 20);
        t.assertTrue(extent.intersects(point));
        
        
        
    }
}, {
    name: "intersects_multipoints",
    timeout: 5000,
    runTest: function(t){
        var mpJson = {
            "points": [[20, 20], [30, 30], [40, 40]],
            "spatialReference": ({
                " wkid": 4326
            })
        };
        var multipoint = new esri.geometry.Multipoint(mpJson);
        t.assertTrue(extent.intersects(multipoint));
        
    }
}, {
    name: "intersects_polyline",
    timeout: 5000,
    runTest: function(t){
        var polyline = new esri.geometry.Polyline(new esri.SpatialReference({
            wkid: 4326
        }));
        polyline.addPath([new esri.geometry.Point(10, 10), new esri.geometry.Point(20, 20), new esri.geometry.Point(30, 30)]);
        t.assertTrue(extent.intersects(polyline));
        
    }
}, {
    name: "intersects_polygon",
    timeout: 5000,
    runTest: function(t){
        var polygonJson = {
            "rings": [[[10, 20], [20, 20], [30, 30], [40, 30], [40, 40], [50, 50], [60, 60]]],
            "spatialReference": {
                " wkid": 4326
            }
        };
        var polygon = new esri.geometry.Polygon(polygonJson);
        t.assertTrue(extent.intersects(polygon));
        
    }
}, {
    name: "intersects_extent",
    timeout: 5000,
    runTest: function(t){
        var extent_ = new esri.geometry.Extent(20, 10, 80, 80, new esri.SpatialReference({
            wkid: 4326
        }));
        t.assertTrue(extent.intersects(extent_));
        
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

