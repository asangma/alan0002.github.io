dojo.provide("esri.tests.geometry.util.normalizepcs.polygonTest");


dojo.require("esri.geometry");

var query = null;
var queryTask = null;

var sr = 
    {
        "wkid": 102726
    } 

doh.registerGroup("geometry.util.normalizepcs.polygonTest", [
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
				
                var polygon = new esri.geometry.Polygon(pg.spatialReference);				
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
