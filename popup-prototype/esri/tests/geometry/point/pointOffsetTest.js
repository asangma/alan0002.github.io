dojo.provide("esri.tests.geometry.point.pointOffsetTest");

dojo.require("esri.tasks.query");
dojo.require("esri.geometry");

var query = null;
var queryTask = null;

doh.registerGroup("geometry.point.pointOffsetTest", [
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
				
                var point = pt.offset(1750.25, 3500.85);
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
				
                var point = pt.offset(1500.25, -3000.75);
				
				//verify
				t.assertEqual(7668799.25, point.x);//orginal x value 7667299.00009452
				t.assertEqual(688389.1875, point.y);//original y value 691389.937552854
                                            
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

                var point = pt.offset(1500.25, -3000.75);				
				point.setX(1000.65);
				t.assertEqual(1000.65, point.x);                    
                              
                point.setY(3000.54);
                t.assertEqual(3000.54, point.y);                    
                                            
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
       
                var point = pt.offset(1500.25, -3000.75);
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

                var point = pt.offset(1500.25, -3000.75);
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
				
                var point = pt.offset(1500.25, -3000.75);
				
                var json = 
                    {"x":7668799.25,"y":688389.1875,"spatialReference":{"wkid":102726}};				
								
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
				
                var point = pt.offset(1500.25, -3000.75);
                   
                var str = "esri.geometry.Point(7668799.25009452, 688389.187552854, esri.SpatialReference(wkid = 102726))";
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
