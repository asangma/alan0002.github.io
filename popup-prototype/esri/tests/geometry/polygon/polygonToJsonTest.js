dojo.provide("esri.tests.geometry.polygon.polygonToJsonTest");

dojo.require("esri.tasks.query");
dojo.require("esri.geometry");

var query = null;
var queryTask = null;

var sr = 
    {
        "wkid": 102726
    } 

doh.registerGroup("geometry.polygon.polygonToJsonTest", [
    {
        name: "testInstanceOf",
        timeout: 10000,
        runTest: function(t)
        {
            var d = new doh.Deferred();         
            d.addCallback(showResults);
            
            function dCallback(featureSet) 
            {
                d.callback(featureSet);
            }
                            
            function showResults(featureSet) 
            {       
                var pg = featureSet.features[0].geometry;
				
                var polygon = new esri.geometry.Polygon(pg.toJSON());
                var result = polygon instanceof esri.geometry.Polygon; 
				t.assertTrue(result);             
                                            
                return featureSet;
            }            
			    
            //use zoning layer from Portland Map service
            var qTask = new esri.tasks.QueryTask("http://servery/ArcGIS/rest/services/Portland/PortlandMap/MapServer/8");           
            var q = new esri.tasks.Query();
            q.returnGeometry = true;
            q.where = "FID = 1";       
            qTask.execute(q, dCallback); 				   
			                                                                             
            return d;             
        }
    }, 	
    {
        name: "testAddRing_PointArray",
        timeout: 5000,
        runTest: function(t)
        {
            var d = new doh.Deferred();         
            d.addCallback(showResults);
            
            function dCallback(featureSet) 
            {
                d.callback(featureSet);
            }
                            
            function showResults(featureSet) 
            {       
                var features = featureSet.features;
				var points = [];
				
			    for(var i = 0, i1 = features.length; i < i1; i++)
                {
					points[i] = features[i].geometry;
                }
                
				//create polygon           
                var pg = new esri.geometry.Polygon(sr);
				pg.addRing(points);
				
				//create another polygon from above polygon's JSON
                var polygon = new esri.geometry.Polygon(pg.toJSON());
				
				//verify num of rings         
                t.assertEqual(1, polygon.rings.length);
				
				//verify ring points
				var rings = polygon.rings;
				for (var k = 0, k1 = rings.length; k < k1; k++) 
				{
					for (var j = 0, j1 = rings[k].length; j < j1; j++) 
					{
                        t.assertEqual(points[j].x + "," + points[j].y, rings[k][j][0] + "," + rings[k][j][1]);	
					}
				}
				
                return featureSet;
            }            
                
            queryTask.execute(query, dCallback);   
                                                                                         
            return d;             
        }
    },
    {
        name: "testAddRing_NumberArray",
        timeout: 5000,
        runTest: function(t)
        {
            var d = new doh.Deferred();         
            d.addCallback(showResults);
            
            function dCallback(featureSet) 
            {
                d.callback(featureSet);
            }
                            
            function showResults(featureSet) 
            {       
                var features = featureSet.features;
                var points = [];
				var xyCoords = [];
                
                for(var i = 0, i1 = features.length; i < i1; i++)
                {
                    points[i] = features[i].geometry;
					var xy = [];
					xy[0] = points[i].x;
					xy[1] = points[i].y; 
					xyCoords[i] = xy;  					
                }
				
                //create polygon           
                var pg = new esri.geometry.Polygon(sr);
				
                //create another polygon from above polygon's JSON
                var polygon = new esri.geometry.Polygon(pg.toJSON());
				
				//adding ring after creating polygon from json
				polygon.addRing(xyCoords);				
                
                //verify num of rings         
                t.assertEqual(1, polygon.rings.length);
                
                //verify ring points
                var rings = polygon.rings;
                for (var k = 0, k1 = rings.length; k < k1; k++) 
                {
                    for (var j = 0, j1 = rings[k].length; j < j1; j++) 
                    {
                        t.assertEqual(xyCoords[j][0] + "," + xyCoords[j][1], rings[k][j][0] + "," + rings[k][j][1]);  
                    }
                }				
				
                return featureSet;
            }            
                
            queryTask.execute(query, dCallback);   
                                                                                         
            return d;             
        }
	},
	{
        name: "testAddRing_PointJsonArray",
        timeout: 5000,
        runTest: function(t)
        {
            var d = new doh.Deferred();         
            d.addCallback(showResults);
            
            function dCallback(featureSet) 
            {
                d.callback(featureSet);
            }
                            
            function showResults(featureSet) 
            {       
                var features = featureSet.features;
                var points = [];
                
                for(var i = 0, i1 = features.length; i < i1; i++)
                {
                    points[i] = new esri.geometry.Point(features[i].geometry.toJSON());
                }
                
                //create polygon           
                var pg = new esri.geometry.Polygon(sr);
                pg.addRing(points);
				
                //create another polygon from above polygon's JSON
                var polygon = new esri.geometry.Polygon(pg.toJSON());
                
                //verify num of rings         
                t.assertEqual(1, polygon.rings.length);
                
                //verify ring points
                var rings = polygon.rings;
                for (var k = 0, k1 = rings.length; k < k1; k++) 
                {
                    for (var j = 0, j1 = rings[k].length; j < j1; j++) 
                    {
                        t.assertEqual(points[j].x + "," + points[j].y, rings[k][j][0] + "," + rings[k][j][1]);  
                    }
                }
				
				return featureSet;
            }            
                
            queryTask.execute(query, dCallback);   
                                                                                         
            return d;             
        }		
    },	
    {
        name: "testGetExtent",
        timeout: 5000,
        runTest: function(t)
        {
            var d = new doh.Deferred();         
            d.addCallback(showResults);
            
            function dCallback(featureSet) 
            {
                d.callback(featureSet);
            }
                            
            function showResults(featureSet) 
            {       
                var features = featureSet.features;
                var points = [];
                
                for(var i = 0, i1 = features.length; i < i1; i++)
                {
                    points[i] = new esri.geometry.Point(features[i].geometry.toJSON());
                }
                
                //create polygon           
                var pg = new esri.geometry.Polygon(sr);
				
                //create another polygon from above polygon's JSON
                var polygon = new esri.geometry.Polygon(pg.toJSON());
                polygon.addRing(points);
                
                var extent = polygon.getExtent();
				t.assertEqual(7611014, extent.xmin);
				t.assertEqual(657370.375, extent.ymin);
				t.assertEqual(7624517.5, extent.xmax);
				t.assertEqual(686948.4375, extent.ymax);
				
                return featureSet;
            }            
                
            queryTask.execute(query, dCallback);   
                                                                                         
            return d;             
        }       
    },	
    {
        name: "testGetPoint",
        timeout: 5000,
        runTest: function(t)
        {
            var d = new doh.Deferred();         
            d.addCallback(showResults);
            
            function dCallback(featureSet) 
            {
                d.callback(featureSet);
            }
                            
            function showResults(featureSet) 
            {       
                var features = featureSet.features;
                var points = [];
                
                for(var i = 0, i1 = features.length; i < i1; i++)
                {
                    points[i] = new esri.geometry.Point(features[i].geometry.toJSON());
                }
                
                //create polygon           
                var pg = new esri.geometry.Polygon(sr);
                pg.addRing(points);
				
                //create another polygon from above polygon's JSON
                var polygon = new esri.geometry.Polygon(pg.toJSON());
                
                //retrieve a point         
                var pt = polygon.getPoint(0, 2);
				t.assertEqual(dojo.toJson(points[2].toJSON()), dojo.toJson(pt.toJSON()));
                
                return featureSet;
            }            
                
            queryTask.execute(query, dCallback);   
                                                                                         
            return d;             
        }       
    },
    {
        name: "testRemoveRing",
        timeout: 5000,
        runTest: function(t)
        {
            var d = new doh.Deferred();         
            d.addCallback(showResults);
            
            function dCallback(featureSet) 
            {
                d.callback(featureSet);
            }
                            
            function showResults(featureSet) 
            {       
                var features = featureSet.features;
                var points = [];
                
                for(var i = 0, i1 = features.length; i < i1; i++)
                {
                    points[i] = new esri.geometry.Point(features[i].geometry.toJSON());
                }
                
                //create polygon           
                var pg = new esri.geometry.Polygon(sr);
                pg.addRing(points);
				
                //create another polygon from above polygon's JSON
                var polygon = new esri.geometry.Polygon(pg.toJSON());
                
                //verify num of rings before removing ring         
                t.assertEqual(1, polygon.rings.length);
				
				//remove the 1st and only ring from polygon
				var removedPoints = polygon.removeRing(0);
				
				//verify num of rings before removing ring         
                t.assertEqual(0, polygon.rings.length);
                
                //verify removed points
                t.assertEqual(points.length, removedPoints.length);				
                for (var k = 0, k1 = points.length; k < k1; k++) 
                {
					t.assertEqual(dojo.toJson(points[k].toJSON()), dojo.toJson(removedPoints[k].toJSON()));
                }
                
                return featureSet;
            }            
                
            queryTask.execute(query, dCallback);   
                                                                                         
            return d;             
        }       
    },		
    {
        name: "testGetType",
        timeout: 5000,
        runTest: function(t)
        {       
            var d = new doh.Deferred();         
            d.addCallback(showResults);
            
            function dCallback(featureSet) 
            {
                d.callback(featureSet);
            }
                            
            function showResults(featureSet)
            {
                //get point from query
                var features = featureSet.features;
                var pg = features[0].geometry;                    
                            
                var polygon = new esri.geometry.Polygon(pg.toJSON());
                //verify
                t.assertEqual("polygon", polygon.type);
                                            
                return featureSet;
            }           
            
            //query houses layer and retrieve point data
            queryTask.execute(query, dCallback);
            
            return d;         
        }
    },
	{
        name: "testSR",
        timeout: 5000,
        runTest: function(t)
        {       
            var d = new doh.Deferred();         
            d.addCallback(showResults);
            
            function dCallback(featureSet) 
            {
                d.callback(featureSet);
            }
                            
            function showResults(featureSet)
            {
                //get point from query
                var features = featureSet.features;
                var points = [];
                
                for(var i = 0, i1 = features.length; i < i1; i++)
                {
                    points[i] = features[i].geometry;
                }
                
                //create polygon           
                var pg = new esri.geometry.Polygon(sr);
				
                //create another polygon from above polygon's JSON
                var polygon = new esri.geometry.Polygon(pg.toJSON());
                polygon.addRing(points);				
				                
                //verify
                t.assertEqual(sr.wkid, polygon.spatialReference.wkid);								

                return featureSet;
            }           
            
            //query houses layer and retrieve point data               
            queryTask.execute(query, dCallback);
            
            return d;         
        }
    },
    {
        name: "testJson",
        timeout: 5000,
        runTest: function(t)
        {       
            var d = new doh.Deferred();         
            d.addCallback(showResults);
            
            function dCallback(featureSet) 
            {
                d.callback(featureSet);
            }
                            
            function showResults(featureSet)
            {
                //get point from query
                var features = featureSet.features;
                var points = [];
                
                for(var i = 0, i1 = features.length; i < i1; i++)
                {
                    points[i] = features[i].geometry;
                }
                
                //create polygon           
                var pg = new esri.geometry.Polygon(sr);
				
                //create another polygon from above polygon's JSON
                var polygon = new esri.geometry.Polygon(pg.toJSON());
                polygon.addRing(points);
				
                var json = 
                    {"rings":[[[7617572,664093.5625],[7613755,665362.6875],[7613947,674652.4375],[7611419,670480.9375],[7611014,669185.5625],[7617109.5,663404.25],[7611380,686948.4375],[7620179.5,671201.8125],[7611183.5,657370.375],[7611469.5,659923.0625],[7624517.5,667638.3125],[7623320.5,667346.1875],[7622974.5,670062.4375]]],"spatialReference":{"wkid":102726}};
								
                t.assertEqual(dojo.toJson(json), dojo.toJson(polygon.toJSON()));
				
                return featureSet;
            }           
            
            //query houses layer and retrieve polygon data
            queryTask.execute(query, dCallback);
            
            return d;         
        }
    }/*,   	
    {
        name: "testToString",
        timeout: 5000,
        runTest: function(t)
        {       
            var d = new doh.Deferred();         
            d.addCallback(showResults);
            
            function dCallback(featureSet) 
            {
                d.callback(featureSet);
            }
                            
            function showResults(featureSet)
            {
                //get polygon from query
                var features = featureSet.features;
                var points = [];
                
                for(var i = 0, i1 = features.length; i < i1; i++)
                {
                    points[i] = features[i].geometry;
                }
                
                //create polygon           
                var pg = new esri.geometry.Polygon(sr);
				pg.addRing(points);
				
				//create another polygon from above polygon's JSON
                var polygon = new esri.geometry.Polygon(pg.toJSON());
				
                var str = "esri.geometry.Polygon(7617572.00013928,664093.562355682,7613754.99989927,665362.687442109,7613946.99984336,674652.43756336,7611418.99997811,670480.937376186,7611014.00013193,669185.562342271,7617109.50008002,663404.250086024,7611380.0000561,686948.437577605,7620179.49984552,671201.812574849,7611183.50012103,657370.375014693,7611469.49987711,659923.062494606,7624517.50002778,667638.312484026,7623320.50012518,667346.187412098,7622974.50016102,670062.437557027, esri.SpatialReference(wkid = 102726))";				                   
                t.assertEqual(str, polygon.toString());				
				
                return featureSet;
            }           
            
            //query houses layer and retrieve polygon data
            queryTask.execute(query, dCallback);
            
            return d;         
        }
    }*/
    ],
	
    function()//setUp
    {  
		query = new esri.tasks.Query();
        query.returnGeometry = true;
        query.where = "CITY = 'Beaverton'";   
		
		//use houses layer from Portland Map service
        queryTask = new esri.tasks.QueryTask("http://servery/ArcGIS/rest/services/Portland/PortlandMap/MapServer/3");		    		
    }, 
	
	function() //tearDown
	{
        query = null;
		queryTask = null;
	});
