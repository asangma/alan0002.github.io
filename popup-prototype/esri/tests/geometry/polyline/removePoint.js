dojo.provide("esri.tests.geometry.polyline.removePoint");

dojo.require("esri.geometry");


doh.registerGroup("geometry.polyline.removePoint", [
    {
		name: "removePoint",
		timeout: 5000,
		runTest: function(t){
			var spatialRefJson ={"spatialReference":{" wkid":4326 }};
			var polyline  = new esri.geometry.Polyline(new esri.SpatialReference(spatialRefJson));
			polyline.addPath([new esri.geometry.Point(10,10), new esri.geometry.Point(20,20), new esri.geometry.Point(30,30)]);
			polyline.addPath([new esri.geometry.Point(40,40), new esri.geometry.Point(50,50), new esri.geometry.Point(60,60)]);
			polyline.removePoint(0,0);
			console.log(polyline.paths[0][0]);
			t.assertEqual([20,20], polyline.paths[0][0]);
						
		}
	}
    ]
	);

