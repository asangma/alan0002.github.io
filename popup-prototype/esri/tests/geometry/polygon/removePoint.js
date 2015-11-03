dojo.provide("esri.tests.geometry.polygon.removePoint");

dojo.require("esri.geometry");


doh.registerGroup("geometry.polygon.removePoint", [
    {
		name: "removePoint",
		timeout: 5000,
		runTest: function(t){
			var polygonJson  = {"rings":[[[-122.63,45.52],[-122.57,45.53],[-122.52,45.50],[-122.49,45.48],
  			[-122.64,45.49],[-122.63,45.52],[-122.63,45.52]]],"spatialReference":{" wkid":4326 }};
			var polygon = new esri.geometry.Polygon(polygonJson);
			polygon.removePoint(0,0);
			console.log(polygon.rings[0][0]);
			t.assertEqual([-122.57,45.53], polygon.rings[0][0]);
						
		}
	}
    ]
	);

