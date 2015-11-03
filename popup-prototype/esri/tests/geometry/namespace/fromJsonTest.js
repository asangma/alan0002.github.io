dojo.provide("esri.tests.geometry.namespace.fromJSONTest");

doh.registerGroup("geometry.namespace.fromJSONTest", [{
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
        var extent = new esri.geometry.Extent(extentJson);
        var geometry = esri.geometry.fromJSON(extentJson);
        t.assertEqual(geometry, extent);
        
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
        var multipoint = new esri.geometry.Multipoint(multipointJson);
        
        var geometry = esri.geometry.fromJSON(multipointJson);
        t.assertEqual(geometry, multipoint);
        
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
        t.assertEqual(geometry, point);
        
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
        var polyline = new esri.geometry.Polyline(polylineJson);
        
        var geometry = esri.geometry.fromJSON(polylineJson);
        t.assertEqual(geometry, polyline);
        
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
        var polyline = new esri.geometry.Polyline(polylineJson);
        
        var geometry = esri.geometry.fromJSON(polylineJson);
        t.assertEqual(geometry, polyline);
        
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
        var polygon = new esri.geometry.Polygon(polygonJson);
        
        var geometry = esri.geometry.fromJSON(polygonJson);
        t.assertEqual(geometry, polygon);
        
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
        var polygon = new esri.geometry.Polygon(polygonJson);
        
        var geometry = esri.geometry.fromJSON(polygonJson);
        t.assertEqual(geometry, polygon);
        
    }
    
}, ]);
