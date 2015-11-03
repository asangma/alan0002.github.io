dojo.provide("esri.tests.geometry.point.setSpatialReferenceTest");


dojo.require("esri.geometry");

doh.registerGroup("geometry.point.setSpatialReferenceTest", [
    {
        name: "setSpatialReference",
        timeout: 5000,
        runTest: function(t)
        {
			var point = new esri.geometry.Point([20,40]);
			point.setSpatialReference(new esri.SpatialReference({wkid:4326}));
			t.assertEqual(4326,point.spatialReference.wkid);
			point.update(-20,-40);
			t.assertEqual(point.x,-20);
			t.assertEqual(point.y,-40);		
                
        }
    }, 	 
    
    ]);

