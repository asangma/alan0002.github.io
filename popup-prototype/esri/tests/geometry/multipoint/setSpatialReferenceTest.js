dojo.provide("esri.tests.geometry.multipoint.setSpatialReferenceTest");

dojo.require("esri.geometry");


doh.registerGroup("geometry.multipoint.setSpatialReferenceTest", [
    {
        name: "setSpatialReference",
        timeout: 5000,
        runTest: function(t)
        {
			var multiPoints = new esri.geometry.Multipoint();
			multiPoints.setSpatialReference(new esri.SpatialReference({wkid:4326}));
			multiPoints.points =  [[-122.63,45.51],[-122.56,45.51],[-122.56,45.55],[-122.62,45],[-122.59,45.53]];
			
			t.assertEqual(4326,multiPoints.spatialReference.wkid);
			t.assertEqual("multipoint",multiPoints.type);
			t.assertEqual(multiPoints.getExtent(),new esri.geometry.Extent(-122.63,45,-122.56,45.55,new esri.SpatialReference({wkid:4326}) ));
			multiPoints.setPoint(3,new esri.geometry.Point(-120,45));
			t.assertEqual(-120,multiPoints.getPoint(3).x);
			t.assertEqual(45,multiPoints.getPoint(3).y);

                
        }
    }, 	 
    
    ]);

