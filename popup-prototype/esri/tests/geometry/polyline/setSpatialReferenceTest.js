dojo.provide("esri.tests.geometry.polyline.setSpatialReferenceTest");


dojo.require("esri.geometry");

doh.registerGroup("geometry.polyline.setSpatialReferenceTest", [{
    name: "setSpatialReference",
    timeout: 5000,
    runTest: function(t){
        var polyline = new esri.geometry.Polyline();
        polyline.setSpatialReference(new esri.SpatialReference({
            wkid: 4326
        }));
        var paths = [[-122.63, 45.52], [-122.57, 45.53], [-122.52, 45.50], [-122.49, 45.48], [-122.64, 45.49], [-122.63, 45.52]];
        polyline.addPath(paths);
        
        t.assertEqual(4326, polyline.spatialReference.wkid);
		polyline.insertPoint(0,0, new esri.geometry.Point(-180,180));
		t.assertEqual(polyline.getPoint(0,0).x, -180);
		t.assertEqual(polyline.getPoint(0,0).y, 180);
		
		polyline.removePoint(0,0);
		t.assertEqual(polyline.getPoint(0,3).x, -122.49);
		t.assertEqual(polyline.getPoint(0,3).y, 45.48);
		
		polyline.setPoint(0,1, new esri.geometry.Point(-180,180));
		t.assertEqual(polyline.getPoint(0,1).x, -180);
		t.assertEqual(polyline.getPoint(0,1).y, 180);
		
		
    }
}, ]);

