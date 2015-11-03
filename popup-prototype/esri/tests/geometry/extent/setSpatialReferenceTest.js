dojo.provide("esri.tests.geometry.extent.setSpatialReferenceTest");

dojo.require("esri.geometry");


doh.registerGroup("geometry.extent.setSpatialReferenceTest", [
    {
		name: "setSpatialReference",
		timeout: 5000,
		runTest: function(t){
			var extent = new esri.geometry.Extent(20,20,100,100);
			extent.setSpatialReference(new esri.SpatialReference({wkid:4326}));
			t.assertEqual(4326,extent.spatialReference.wkid);
			t.assertEqual(extent,extent.getExtent());
								
		}
	}
    ]
	
	
	);

