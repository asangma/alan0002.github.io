dojo.provide("esri.tests.geometry.polygon.containsPointTest");

dojo.require("esri.geometry");

var polygonJson ={"rings":[[[-116.31779605624247,47.02490104418031],[-88.22990009391198,46.67159417672961],[-87.16997949155989,12.930788335187962],[-118.08433039349596,15.05062953989215],[-116.14114262251712,47.378207911631016],[-116.31779605624247,47.02490104418031]]],"spatialReference":{"wkid":4326}};
var polygon = new esri.geometry.Polygon(polygonJson);
			
doh.registerGroup("geometry.polygon.containsPointTest", [
    {
		name: "pointWithinPolygon",
		timeout: 5000,
		runTest: function(t){
			var point = new esri.geometry.Point({"x":-106.42520376762292,"y":36.07238815320868,"spatialReference":{"wkid":4326}});
			t.assertTrue(polygon.contains(point));
							
		}
	},
	{
		name: "pointOnPolygonLine",
		timeout: 5000,
		runTest: function(t){
			
			var point = polygon.getPoint(0, 1);
			t.assertFalse(polygon.contains(point));
							
		}
	},
	{
		name: "pointOutSidePolygon",
		timeout: 5000,
		runTest: function(t){
			var point = new esri.geometry.Point({"x":-145.46561262092504,"y":62.04044291083498,"spatialReference":{"wkid":4326}});
			t.assertFalse(polygon.contains(point));
							
		}
	},
    ]
	
	
	);

