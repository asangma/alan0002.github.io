dojo.provide("esri.tests.geometry.polygon.setSpatialReferenceTest");


dojo.require("esri.geometry");

doh.registerGroup("geometry.polygon.setSpatialReferenceTest", [{
    name: "setSpatialReference",
    timeout: 5000,
    runTest: function(t){
        var polygon = new esri.geometry.Polygon();
        polygon.setSpatialReference(new esri.SpatialReference({
            wkid: 4326
        }));
        var rings = [[-122.63, 45.52], [-122.57, 45.53], [-122.52, 45.50], [-122.49, 45.48], [-122.64, 45.49], [-122.63, 45.52], [-122.63, 45.52]];
        polygon.addRing(rings);
        
        t.assertEqual(4326, polygon.spatialReference.wkid);
		t.assertTrue(polygon.contains(new esri.geometry.Point(-122.60,45.5)));
		//t.assertTrue(polygon.contains(new esri.geometry.Point(-122.57, 45.53)));
		t.assertFalse(polygon.contains(new esri.geometry.Point(-123.57, 46)));
		t.assertEqual(polygon.getPoint(0,2).x,-122.52);
		t.assertEqual(polygon.getPoint(0,2).y,45.50);
		
		//insertPoint and remove
		polygon.insertPoint(0,0, new esri.geometry.Point(-180,180));
		t.assertEqual(polygon.getPoint(0,0).x,-180);
		t.assertEqual(polygon.getPoint(0,0).y,180);
		polygon.removePoint(0,0);
		t.assertEqual(polygon.getPoint(0,0).x,-122.63);
		t.assertEqual(polygon.getPoint(0,0).y,45.52);
		
		//setPoint
		polygon.setPoint(0,0, new esri.geometry.Point(-90,90));
		t.assertEqual(polygon.getPoint(0,0).x,-90);
		t.assertEqual(polygon.getPoint(0,0).y,90);
		
		//remove ring
		polygon.removeRing(0);
		t.assertEqual(0,polygon.rings.length);
		
        
        
        
    }
}, ]);

