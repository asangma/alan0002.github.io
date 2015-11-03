dojo.provide("esri.tests.geometry.point.pointTest");

dojo.require("esri.tasks.query");
dojo.require("esri.geometry");

var query = null;
var queryTask = null;

doh.registerGroup("geometry.point.pointTest", [
    {
        name: "testInstanceOf",
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
                var pt = featureSet.features[0].geometry;
				
                var point = new esri.geometry.Point(pt.x, pt.y, pt.spatialReference);
                var result = point instanceof esri.geometry.Point;
                t.assertTrue(result);                
                                            
                return featureSet;
            }            
			    
            queryTask.execute(query, dCallback);   
			                                                                             
            return d;             
        }
    }, 	 
    {
        name: "testGetXY",
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
				var pt = features[0].geometry;                    
                              
                var point = new esri.geometry.Point(pt.x, pt.y, pt.spatialReference);
                //verify
				t.assertEqual(7667299, point.x);
				t.assertEqual(691389.9375, point.y);
                                            
                return featureSet;
            }
			
            //query houses layer and retrieve point data
            queryTask.execute(query, dCallback);
			
			return d;
		}         
    },	
    {
        name: "testSetXY",
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
                var pt = features[0].geometry;
				
                var point = new esri.geometry.Point(pt.x, pt.y, pt.spatialReference);
				point.setX(100);
				t.assertEqual(100, point.x);                    
                              
                point.setY(100);
                t.assertEqual(100, point.y);                    
                                            
                return featureSet;
			}			
			
            //query houses layer and retrieve point data
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
                var pt = features[0].geometry;                    
                            
                var point = new esri.geometry.Point(pt.x, pt.y, pt.spatialReference);
                //verify
                t.assertEqual("point", point.type);
                                            
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
                var pt = features[0].geometry;                    
                
				var point = new esri.geometry.Point(pt.x, pt.y, pt.spatialReference);
                var sr = 
                    {
                        "wkid": 102726
                    } 
 
                //verify
                t.assertEqual(sr.wkid, point.spatialReference.wkid);								

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
                var pt = features[0].geometry;       
				
				var point = new esri.geometry.Point(pt.x, pt.y, pt.spatialReference);                               
                var json = 
                    {"x":7667299,"y":691389.9375,"spatialReference":{"wkid":102726}};
								
                t.assertEqual(dojo.toJson(json), dojo.toJson(point.toJSON()));
				
                return featureSet;
            }           
            
            //query houses layer and retrieve point data
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
                //get point from query
                var features = featureSet.features;
                var pt = features[0].geometry;
				
				var point = new esri.geometry.Point(pt.x, pt.y, pt.spatialReference);                   
                var str = "esri.geometry.Point(7667299.00009452, 691389.937552854, esri.SpatialReference(wkid = 102726))";
                t.assertEqual(str, point.toString());				
				
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
        query.where = "FID = 1";   
		
        queryTask = new esri.tasks.QueryTask("http://servery/ArcGIS/rest/services/Portland/PortlandMap/MapServer/3");		    		
    }, 
	
	function() //tearDown
	{
        query = null;
		queryTask = null;
	});
