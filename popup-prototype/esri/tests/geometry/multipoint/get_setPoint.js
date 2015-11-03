dojo.provide("esri.tests.geometry.multipoint.get_setPoint");

dojo.require("esri.geometry");

doh.registerGroup("geometry.multipoint.get_setPoint", [
    {
		name: "get_setPoint",
		timeout: 5000,
		runTest: function(t){
			var mpJson ={"points":[[-122.63,45.51],[-122.56,45.51],[-122.56,45.55]],"spatialReference":({" wkid":4326 })};
			var multipoint = new esri.geometry.Multipoint(mpJson);
			var point = new esri.geometry.Point(-118.15, 33.80, new esri.SpatialReference({ wkid: 4326 }));
			multipoint.setPoint(multipoint.length,point);
			var returnedPoint =multipoint.getPoint(multipoint.length);
			t.assertEqual(-118.15,returnedPoint.x);
			t.assertEqual(33.80,returnedPoint.y);
			
		}
	}
    ]
	);

