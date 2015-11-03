dojo.provide("esri.tests.geometry.extent.intersectsOnePathPolylineTest");

dojo.require("esri.geometry");

var extent;
doh.registerGroup("geometry.extent.intersectsOnePathPolylineTest", [
    {
		name: "WithinExtent",
		timeout: 5000,
		runTest: function(t){
			var polylineJson ={"paths":[[[-107.4069714110756,29.342447260525418],[-96.90349120111787,40.943305999881716]]],"spatialReference":{"wkid":4326}};
			var polyline = new esri.geometry.Polyline(polylineJson);
			t.assertTrue(extent.intersects(polyline));
							
		}
	},
	{
		name: "onePointOnExtentLine",
		timeout: 5000,
		runTest: function(t){
			var polylineJson ={"paths":[[[-96.27641775574726,17.114515075798508],[-76.36683586523037,37.337633689000704]]],"spatialReference":{"wkid":4326}};
			var polyline = new esri.geometry.Polyline(polylineJson);
			t.assertTrue(extent.intersects(polyline));
							
		}
	},
	{
		name: "pointsOutSideExtent",
		timeout: 5000,
		runTest: function(t){
			var polylineJson ={"paths":[[[-139.70125384766206,37.49440205034335],[-122.45673409997026,59.59874099965738]]],"spatialReference":{"wkid":4326}};
			var polyline = new esri.geometry.Polyline(polylineJson);
			t.assertFalse(extent.intersects(polyline));
							
		}
	},
    ], function()//setUp()
{
    extent = new esri.geometry.Extent(-115.40215783955088,20.56341902533687,-80.44281326013935,47.68434553761578, new esri.SpatialReference({
        wkid: 4326
    }));
    
    
}, function()//tearDown
{
    extent = null;
    
}
	
	
	);

