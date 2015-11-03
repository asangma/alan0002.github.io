dojo.provide("esri.tests.geometry.namespace.getLineIntersectionTest");

doh.registerGroup("geometry.namespace.getLineIntersectionTest", [{
    name: "getLineIntersection",
    timeout: 3000,
    runTest: function(t){
        var expectedPoint = new esri.geometry.Point(2.5, 2.5);
        var intersectionPoint = esri.geometry.getLineIntersection(new esri.geometry.Point(0, 0), new esri.geometry.Point(5, 5), new esri.geometry.Point(5, 0), new esri.geometry.Point(0, 5));
        t.assertEqual(intersectionPoint.type,expectedPoint.type); 
		t.assertEqual(2.5,expectedPoint.x); 
		t.assertEqual(2.5,expectedPoint.y); 
		  
    }
    
}]);
