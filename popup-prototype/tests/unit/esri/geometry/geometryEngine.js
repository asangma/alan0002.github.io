define(["intern!object", 
        "intern/chai!assert", 
        "esri/geometry/geometryEngine",
        "esri/geometry/Geometry",
        "esri/geometry/Polygon",
        "esri/geometry/Polyline",
        "esri/geometry/Point",
        "esri/geometry/support/graphicsUtils",
        "esri/layers/FeatureLayer",
        "esri/geometry/SpatialReference"
       ], function(registerSuite, assert, GeometryEngine, Geometry, Polygon, Polyline, Point, graphicsUtils, FeatureLayer, SpatialReference){
    var pointGeoms;
    registerSuite({
        name: "esri/geometry/geometryEngine",
        
        setup: function(){
             var sr = new SpatialReference(102100);   //3857 should work
             pointGeoms = [
                new Point(-13056370, 6077571, sr),
                new Point(-13056380, 6077570, sr),
                new Point(-13056388, 6077561, sr),
                new Point(-13056398, 6077552, sr),
                new Point(-13056386, 6077543, sr),
                new Point(-13056370, 6077552, sr),
                new Point(-13056371, 6077534, sr),
                new Point(-13056371, 6077517, sr)
            ];
        },
        
        buffer: function(){
            
        },
        
        clip: function(){
            
        },
        
        contains: function(){
            
        },
        
        convexHull: function(){
            
        },
        
        crosses: function(){
            
        },
        
        cut: function(){
            
        },
        
        densify: function(){
            
        },
        
        difference: function(){
            
        },
        
        disjoint: function(){
            
        },
        
        distance: function(){
            
        },
        
        equals: function(){
            
        },
        
        extendedSpatialReference: function(){
            
        },
        
        flipHorizontal: function(){
            
        },
        
        flipVertical: function(){
            
        },
        
        generalize: function(){
            
        },
        
        geodesicArea: function(){
            
        },
        
        geodesicBuffer: function(){
            var distances = [100,200,300,400];
            var pointBuffers100Ft = GeometryEngine.geodesicBuffer(pointGeoms, 100, "feet");  //feet
            var pointBuffers123400Ft = GeometryEngine.geodesicBuffer(pointGeoms, distances, "feet");  //100, 200, 300, 400 ft buffers
            var pointBuffers100Ft = GeometryEngine.geodesicBuffer(pointGeoms, 100, 9001);  //meters
            
            assert.equal(pointBuffers100Ft.length, pointGeoms.length, 'The lenth of the buffers should equal the length of the points');
            assert.equal(pointGeoms.length, 8, 'The length of the buffers should equal 8');  
        },
        
        geodesicLength: function(){
            
        },
        
        intersect: function(){
            
        },
        
        intersects: function(){
            
        },
        
        isSimple: function(){
            
        },
        
        nearestCoordinate: function(){
            
        },
        
        nearestVertex: function(){
            
        },
        
        nearestVertices: function(){
            
        },
        
        offset: function(){
            
        },
        
        overlaps: function(){
            
        },
        
        planarArea: function(){
            
        },
        
        planarLength: function(){
            
        },
        
        relate: function(){
            
        },
        
        rotate: function(){
            
        },
        
        simplify: function(){
            
        },
        
        symmetricDifference: function(){
            
        },
        
        touches: function(){
            
        },
        
        union: function(){
            
        },
        
        within: function(){
            
        }
    });
});
