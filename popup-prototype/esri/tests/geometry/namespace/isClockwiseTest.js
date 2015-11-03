dojo.provide("esri.tests.geometry.namespace.isClockwiseTest");

doh.registerGroup("geometry.namespace.isClockwiseTest", [{
    name: "clockwise",
    timeout: 3000,
    runTest: function(t){
        var clockwiseRing = [[[-111.81843309925785, 44.05359028891994], [-97.56568075942923, 43.93381926085416], [-97.9249938436266, 30.040380005222907], [-112.17774618345521, 32.19625851040707], [-111.81843309925785, 44.05359028891994], [-111.81843309925785, 44.05359028891994]]];
        var clockwisePolygon = new esri.geometry.Polygon(new esri.SpatialReference({
            wkid: 4326
        }));
        clockwisePolygon.addRing(clockwiseRing[0]);
		t.assertTrue(esri.geometry.isClockwise(clockwisePolygon.rings[0]));
       
     
    }
    
}, {
    name: "countclockwise",
    timeout: 3000,
    runTest: function(t){
        var countClockwiseRing = [[[-101.75766674173178, 40.34068841888056], [-108.34507328535004, 40.460459446946345], [-107.50667608888953, 33.15442673493336], [-99.84133029267919, 33.274197762999144], [-101.99720879786335, 40.58023047501213], [-101.75766674173178, 40.34068841888056]]];
        var countClockwisePolygon = new esri.geometry.Polygon(new esri.SpatialReference({
            wkid: 4326
        }));
        countClockwisePolygon.addRing(countClockwiseRing[0]);
		t.assertFalse(esri.geometry.isClockwise(countClockwisePolygon.rings[0]));
        
    }
    
}]);
