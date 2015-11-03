dojo.provide("esri.tests.geometry.extent.intersectsOneRingPolygonTest");

dojo.require("esri.geometry");

var extent;
doh.registerGroup("geometry.extent.intersectsOneRingPolygonTest", [{
    name: "WithinExtent",
    timeout: 5000,
    runTest: function(t){
        var polygonJson = {
            "rings": [[[-121.75521537747963, 45.74482942894437], [-113.32911290048963, 45.293431081962765], [-114.98424017275552, 34.45987075440417], [-121.45428314615856, 45.594363313283836], [-121.75521537747963, 45.74482942894437]]],
            "spatialReference": {
                "wkid": 4326
            }
        };
        
        var polygon = new esri.geometry.Polygon(polygonJson);
        t.assertTrue(extent.intersects(polygon));
        
    }
}, {
    name: "intersectExtentLine",
    timeout: 5000,
    runTest: function(t){
        var polygonJson = {
            "rings": [[[-88.80313604782226, 40.92991372780722], [-76.46491456365831, 40.92991372780722], [-77.96957572026368, 31.149616209872377], [-91.21059389839084, 30.848683978551307], [-88.9536021634828, 41.08037984346775], [-88.80313604782226, 40.92991372780722]]],
            "spatialReference": {
                "wkid": 4326
            }
        };
        var polygon = new esri.geometry.Polygon(polygonJson);
        t.assertTrue(extent.intersects(polygon));
    }
}, {
    name: "outSideExtent",
    timeout: 5000,
    runTest: function(t){
        var polygonJson = {
            "rings": [[[-117.3916980233241, 61.99516992028225], [-103.54881538255479, 62.5970343829244], [-103.39834926689426, 52.96720298065009], [-117.24123190766355, 61.99516992028225], [-117.3916980233241, 61.99516992028225]]],
            "spatialReference": {
                "wkid": 4326
            }
        };
        var polygon = new esri.geometry.Polygon(polygonJson);
        t.assertFalse(extent.intersects(polygon));
        
    }
}, ], function()//setUp()
{
    extent = new esri.geometry.Extent(-123.10941041842446, 22.57304761722183, -82.33309307441922, 48.75415174215509, new esri.SpatialReference({
        wkid: 4326
    }));
    
    
}, function()//tearDown
{
    extent = null;
    
});

