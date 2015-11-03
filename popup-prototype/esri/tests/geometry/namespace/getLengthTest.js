dojo.provide("esri.tests.geometry.namespace.getLengthTest");

doh.registerGroup("geometry.namespace.getLengthTest", [{
    name: "getLength",
    timeout: 3000,
    runTest: function(t){
       t.assertEqual(5,esri.geometry.getLength(new esri.geometry.Point(0,0),
	   new esri.geometry.Point(5,0)));
	   t.assertEqual(5,esri.geometry.getLength(new esri.geometry.Point(0,0),
	   new esri.geometry.Point(0,5)));
	    t.assertEqual(5,esri.geometry.getLength(new esri.geometry.Point(0,0),
	   new esri.geometry.Point(-5,0)));
	   t.assertEqual(5,esri.geometry.getLength(new esri.geometry.Point(0,0),
	   new esri.geometry.Point(0,-5)));
	    t.assertEqual(Math.sqrt(50),esri.geometry.getLength(new esri.geometry.Point(0,0),
	   new esri.geometry.Point(5,5)));
     
    }
    
}]);
