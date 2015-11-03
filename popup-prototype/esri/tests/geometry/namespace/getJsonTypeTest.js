dojo.provide("esri.tests.geometry.namespace.getJsonTypeTest");

doh.registerGroup("geometry.namespace.getJsonTypeTest", [{
    name: "testExtent",
    timeout: 3000,
    runTest: function(t){
        var extentJson = {
            "xmin": -109.55,
            "ymin": 25.76,
            "xmax": -86.39,
            "ymax": 49.94,
            "spatialReference": {
                "wkid": 4326
            }
        };
        
        var geometry = esri.geometry.fromJSON(extentJson);
        t.assertEqual(esri.geometry.getJsonType(geometry), "extent");
        
    }
    
}, {
    name: "testMultipoint",
    timeout: 3000,
    runTest: function(t){
        var multipointJson = {
            "points": [[-97.06138, 32.837], [-97.06133, 32.836], [-97.06124, 32.834], [-97.06127, 32.832]],
            "spatialReference": {
                "wkid": 4326
            }
        };
        
        var geometry = esri.geometry.fromJSON(multipointJson);
        t.assertEqual(esri.geometry.getJsonType(geometry), "multipoint");
        
    }
    
}, {
    name: "testPoint",
    timeout: 3000,
    runTest: function(t){
        var pointJson = {
            "x": -118.15,
            "y": 33.80,
            "spatialReference": {
                "wkid": 4326
            }
        };
        var point = new esri.geometry.Point(pointJson);
        var geometry = esri.geometry.fromJSON(pointJson);
        t.assertEqual(esri.geometry.getJsonType(geometry), "point");
    }
    
}, {
    name: "testPolylineSinglePath",
    timeout: 3000,
    runTest: function(t){
        var polylineJson = {
            "paths": [[[-97.06138, 32.837], [-97.06133, 32.836], [-97.06124, 32.834], [-97.06127, 32.832]]],
            "spatialReference": {
                "wkid": 4326
            }
        };
        
        var geometry = esri.geometry.fromJSON(polylineJson);
        t.assertEqual(esri.geometry.getJsonType(geometry), "polyline");
    }
    
}, {
    name: "testPolylineMultiPath",
    timeout: 3000,
    runTest: function(t){
        var polylineJson = {
            "paths": [[[-97.06138, 32.837], [-97.06133, 32.836], [-97.06124, 32.834], [-97.06127, 32.832]], [[-97.06326, 32.759], [-97.06298, 32.755]]],
            "spatialReference": {
                "wkid": 4326
            }
        };
        
        var geometry = esri.geometry.fromJSON(polylineJson);
        t.assertEqual(esri.geometry.getJsonType(geometry), "polyline");
        
        
    }
    
}, {
    name: "testPolygonSingleRing",
    timeout: 3000,
    runTest: function(t){
        var polygonJson = {
            "rings": [[[-97.06138, 32.837], [-97.06133, 32.836], [-97.06124, 32.834], [-97.06127, 32.832], [-97.06138, 32.837]]],
            "spatialReference": {
                "wkid": 4326
            }
        
        };
        
        var geometry = esri.geometry.fromJSON(polygonJson);
        t.assertEqual(esri.geometry.getJsonType(geometry), "polygon");        
        
    }
    
}, {
    name: "testPolygonMultiRing",
    timeout: 3000,
    runTest: function(t){
        var polygonJson = {
            "rings": [[[-97.06138, 32.837], [-97.06133, 32.836], [-97.06124, 32.834], [-97.06127, 32.832], [-97.06138, 32.837]], [[-97.06326, 32.759], [-97.06298, 32.755], [-97.06153, 32.749], [-97.06326, 32.759]]],
            "spatialReference": {
                "wkid": 4326
            }
        
        };
       
        var geometry = esri.geometry.fromJSON(polygonJson);
        t.assertEqual(esri.geometry.getJsonType(geometry), "polygon");
        
    }
    
}, ]);
