dojo.provide("esri.tests.geometry.multipoint.multipointToJsonTest");

dojo.require("esri.tasks.query");
dojo.require("esri.geometry");

var query = null;
var queryTask = null;

doh.registerGroup("geometry.multipoint.multipointToJsonTest", [
    {
        name: "testInstanceOf",
        timeout: 5000,
        runTest: function(t)
        {
            var d = new doh.Deferred();         
            
                            
            function showResults(featureSet) 
            {       
                var mp = featureSet.features[0].geometry;
				
				var multiPoint = new esri.geometry.Multipoint(mp.toJSON);
                var result = multiPoint instanceof esri.geometry.Multipoint;
                t.assertTrue(result);                
                                            
                d.callback(true);
            }            
			    
            var qTask = new esri.tasks.QueryTask("http://servery/ArcGIS/rest/services/Portland/PortlandMap/MapServer/2");           
            var q = new esri.tasks.Query();
            q.returnGeometry = true;
            q.where = "FID = 1";       
            qTask.execute(q, showResults);   
			                                                                             
            return d;             
        }
    }, 	 
    {
        name: "testAddPoint",
        timeout: 5000,
        runTest: function(t)
        {
            var d = new doh.Deferred();         
            
                            
            function showResults(featureSet) 
            {       
                //initialize a multipoint
                var mp = new esri.geometry.Multipoint(new esri.SpatialReference(
                    {
                        wkid: 102726
                    }));
                
                //add all points from query op to multipoint
                var features = featureSet.features;
                var pointsData = [];
                for(var i = 0,i1 = features.length; i < i1; i++)
                {
                    pointsData[i] = features[i].geometry;                    
                    mp.addPoint(pointsData[i]);
                }
            
                //console.log(mp.toJSON());
                var multiPoint = new esri.geometry.Multipoint(mp.toJSON());
                             
                //verify multipoint
                var result = true;
                var numPoints = multiPoint.points.length;             
                t.assertEqual(13, numPoints);
                for(var k = 0,k1 = numPoints; k < k1; k++)
                {
                    result = result && ((pointsData[k].x + ", " + pointsData[k].y) == (multiPoint.points[k][0] + ", " + multiPoint.points[k][1]));
                }                              

                t.assertTrue(result);               
                                            
                d.callback(true);
            }
			
            //query houses layer and retrieve point data
            queryTask.execute(query, showResults);
			
			return d;
		}         
    },	
    {
        name: "testAddPoint_XY",
        timeout: 5000,
        runTest: function(t)
		{
            var d = new doh.Deferred();         
                                       
            function showResults(featureSet)
			{
                //initialize a multipoint
                var mp = new esri.geometry.Multipoint(new esri.SpatialReference(
                    {
                        wkid: 102726
                    }));
                
                //add all points from query op to multipoint
                var features = featureSet.features;
                for(var i = 0,i1 = features.length; i < i1; i++)
                {
					var pointCoords = [];
                    pointCoords[0] = features[i].geometry.x;
					pointCoords[1] = features[i].geometry.y;
                    mp.addPoint(pointCoords);
                }
				
                var multiPoint = new esri.geometry.Multipoint(mp.toJSON());
                              
                //verify multipoint
                var result = true;
                var numPoints = multiPoint.points.length;				             
                t.assertEqual(13, numPoints);               
                for(var k = 0,k1 = numPoints; k < k1; k++)
                {
					var point = multiPoint.getPoint(k);
                    result = result && (point.x + "," + point.y == features[k].geometry.x + "," + features[k].geometry.y);
                }                      
        
                t.assertTrue(result);
				
				d.callback(true);				
			}			

			//query houses layer and retrieve point data
            queryTask.execute(query, showResults);
			
			return d;         
		}
    },
    {
        name: "testAddPoint_Json",
        timeout: 5000,
        runTest: function(t)
        {		
            var d = new doh.Deferred();         
                                        
            function showResults(featureSet)
			{
                //initialize a multipoint
                var mp = new esri.geometry.Multipoint(new esri.SpatialReference(
                    {
                        wkid: 102726
                    }));
                
                //add all points from query op to multipoint
                var features = featureSet.features;
                var pointsData = [];
                for(var i = 0,i1 = features.length; i < i1; i++)
                {
                    pointsData[i] = features[i].geometry;
                    mp.addPoint(pointsData[i].toJSON());
                }
				
                var multiPoint = new esri.geometry.Multipoint(mp.toJSON());
                              
                //verify multipoint
                var result = true;
                var numPoints = multiPoint.points.length;             
                t.assertEqual(13, numPoints);               
                for(var k = 0,k1 = numPoints; k < k1; k++)
                {
                     result = result && (pointsData[k].x + ", " + pointsData[k].y == multiPoint.points[k][0] + ", " + multiPoint.points[k][1]);
                }                      

                t.assertTrue(result);      				
				
				d.callback(true);
			}			
			
            //query houses layer and retrieve point data
            queryTask.execute(query, showResults);
			
			return d;         
        }
    },
    {
        name: "testRemovePoints",
        timeout: 5000,
        runTest: function(t)
        {       
            var d = new doh.Deferred();         
                      
            function showResults(featureSet)
            {
                //initialize a multipoint
                var mp = new esri.geometry.Multipoint(new esri.SpatialReference(
                    {
                        wkid: 102726
                    }));
                
                //add all points from query op to multipoint
                var features = featureSet.features;
                var pointsData = [];
                for(var i = 0,i1 = features.length; i < i1; i++)
                {
                    pointsData[i] = features[i].geometry;
                    mp.addPoint(pointsData[i].toJSON());
                }
				
                var multiPoint = new esri.geometry.Multipoint(mp.toJSON());
				
				var p1 = multiPoint.getPoint(1);
				var p2 = multiPoint.getPoint(3);
				
				//get original num of points
				var numPoints = multiPoint.points.length;
				t.assertEqual(13, numPoints);
				              
				//remove points from multipoint and verify they are instances of Point
				var rp1 = multiPoint.removePoint(1);
				t.assertTrue(rp1 instanceof esri.geometry.Point);
				
				var rp2 = multiPoint.removePoint(2);
				t.assertTrue(rp2 instanceof esri.geometry.Point);
				
				//compare removed points with previously obtained points
				t.assertEqual(p1, rp1);
				t.assertEqual(p2, rp2);
				
                //verify num of points in multipoint after removing 2 points                  
                t.assertEqual(13, multiPoint.points.length + 2);               
                
                d.callback(true);
            }           
            
            //query houses layer and retrieve point data
            queryTask.execute(query, showResults);
            
            return d;         
        }
    },
    {
        name: "testGetExtent",
        timeout: 5000,
        runTest: function(t)
        {       
            var d = new doh.Deferred();         
                                        
            function showResults(featureSet)
            {
                //initialize a multipoint
                var mp = new esri.geometry.Multipoint(new esri.SpatialReference(
                    {
                        wkid: 102726
                    }));
                
                //add all points from query op to multipoint
                var features = featureSet.features;
                var pointsData = [];
                for(var i = 0,i1 = features.length; i < i1; i++)
                {
                    pointsData[i] = features[i].geometry;
                    mp.addPoint(pointsData[i].toJSON());
                }
				
                var multiPoint = new esri.geometry.Multipoint(mp.toJSON());
				
                var ext = 
                    new esri.geometry.Extent({
                        "xmin": 7611014,
                        "ymin": 657370.375,
                        "xmax": 7624517.5,
                        "ymax": 686948.4375,
                        "spatialReference": 
                            {
                                "wkid": 102726
                            }
                    });
				t.assertEqual(ext, multiPoint.getExtent());
                
                d.callback(true);
            }           
            
            //query houses layer and retrieve point data
            queryTask.execute(query, showResults);
            
            return d;         
        }
    },
    {
        name: "testGetType",
        timeout: 5000,
        runTest: function(t)
        {       
            var d = new doh.Deferred();         
                                       
            function showResults(featureSet)
            {
                //initialize a multipoint
                var mp = new esri.geometry.Multipoint(new esri.SpatialReference(
                    {
                        wkid: 102726
                    }));
                
                //add all points from query op to multipoint
                var features = featureSet.features;
                var pointsData = [];
                for(var i = 0,i1 = features.length; i < i1; i++)
                {
                    pointsData[i] = features[i].geometry;
                    mp.addPoint(pointsData[i].toJSON());
                }
				
                var multiPoint = new esri.geometry.Multipoint(mp.toJSON());
                
                t.assertEqual("multipoint", multiPoint.type);
                
                d.callback(true);
            }           
            
            //query houses layer and retrieve point data
            queryTask.execute(query, showResults);
            
            return d;         
        }
    },	
	{
        name: "testSR",
        timeout: 5000,
        runTest: function(t)
        {       
            var d = new doh.Deferred();         
                                       
            function showResults(featureSet)
            {
                //initialize a multipoint
                var mp = new esri.geometry.Multipoint(new esri.SpatialReference(
                    {
                        wkid: 102726
                    }));
                
                //add all points from query op to multipoint
                var features = featureSet.features;
                var pointsData = [];
                for(var i = 0,i1 = features.length; i < i1; i++)
                {
                    pointsData[i] = features[i].geometry;
                    mp.addPoint(pointsData[i].toJSON());
                }
                
                var multiPoint = new esri.geometry.Multipoint(mp.toJSON());
				
                var sr = 
                    {
                        "wkid": 102726
                    } 
 
                t.assertEqual(sr.wkid, multiPoint.spatialReference.wkid);
                
                d.callback(true);
            }           
            
            //query houses layer and retrieve point data
            queryTask.execute(query, showResults);
            
            return d;         
        }
    },
    {
        name: "testJson",
        timeout: 5000,
        runTest: function(t)
        {       
            var d = new doh.Deferred();         
                                        
            function showResults(featureSet)
            {
                //initialize a multipoint
                var mp = new esri.geometry.Multipoint(new esri.SpatialReference(
                    {
                        wkid: 102726
                    }));
                
                //add all points from query op to multipoint
                var features = featureSet.features;
                var pointsData = [];
                for(var i = 0,i1 = features.length; i < i1; i++)
                {
                    pointsData[i] = features[i].geometry;
                    mp.addPoint(pointsData[i].toJSON());
                }
				
                var multiPoint = new esri.geometry.Multipoint(mp.toJSON());

                var json = 
                    {"points":[[7617572,664093.5625],[7613755,665362.6875],[7613947,674652.4375],[7611419,670480.9375],[7611014,669185.5625],[7617109.5,663404.25],[7611380,686948.4375],[7620179.5,671201.8125],[7611183.5,657370.375],[7611469.5,659923.0625],[7624517.5,667638.3125],[7623320.5,667346.1875],[7622974.5,670062.4375]],"spatialReference":{"wkid":102726}};
				
                t.assertEqual(dojo.toJson(json), dojo.toJson(multiPoint.toJSON()));
				
                d.callback(true);
            }           
            
            //query houses layer and retrieve point data
            queryTask.execute(query, showResults);
            
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
                //initialize a multipoint
                var mp = new esri.geometry.Multipoint(new esri.SpatialReference(
                    {
                        wkid: 102726
                    }));
                
                //add all points from query op to multipoint
                var features = featureSet.features;
                var pointsData = [];
                for(var i = 0,i1 = features.length; i < i1; i++)
                {
                    pointsData[i] = features[i].geometry;
                    mp.addPoint(pointsData[i].toJSON());
                }
				
                var multiPoint = new esri.geometry.Multipoint(mp.toJSON());
                                
                var str = "esri.geometry.Multipoint(7617572.00013928,664093.562355682,7613754.99989927,665362.687442109,7613946.99984336,674652.43756336,7611418.99997811,670480.937376186,7611014.00013193,669185.562342271,7617109.50008002,663404.250086024,7611380.0000561,686948.437577605,7620179.49984552,671201.812574849,7611183.50012103,657370.375014693,7611469.49987711,659923.062494606,7624517.50002778,667638.312484026,7623320.50012518,667346.187412098,7622974.50016102,670062.437557027, esri.SpatialReference(wkid = 102726))";
                t.assertEqual(str, multiPoint.toString());
                
                return featureSet;
            }           
            
            //query houses layer and retrieve point data
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
        
        queryTask = new esri.tasks.QueryTask("http://servery/ArcGIS/rest/services/Portland/PortlandMap/MapServer/3");                   
    }, 
    
    function() //tearDown
    {
        query = null;
        queryTask = null;
    });

