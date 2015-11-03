dojo.provide("esri.tests.geometry.extent.extentIntersectsTest");

dojo.require("esri.tasks.query");
dojo.require("esri.geometry");
dojo.require("esri.geometry"); 

var query, queryTask;
 
doh.registerGroup("geometry.extent.extentIntersectsTest", [	
    {
		//pgs 3573 and 3555 are far apart. their extents do not even touch. should return null.
        name: "testIntersect_Null",
        timeout: 5000,
        runTest: function(t)
        {     
			var d = new doh.Deferred();
			
			function showResults(featureSet)
			{
                var graphics = featureSet.features;             
                
                var pg3555 = graphics[0].geometry;
                var pg3573 = graphics[1].geometry;
                
                var extent3555 = pg3555.getExtent();
                var extent3573 = pg3573.getExtent();
				                        
                var intExtent = extent3573.intersects(extent3555);
								
                t.assertEqual(null, intExtent);		
				d.callback(true);		
			}
        
		    query.where = "FID = 3555 OR FID = 3573";
            queryTask.execute(query, showResults);    		      
            return d;
        }			
    },	
    {
        //pgs 3569 and 3570 touch along one edge only. But from x, y values, extents appear to intersect
        name: "testIntersect_TouchingPgs",
        timeout: 5000,
        runTest: function(t)
        {         
            var d = new doh.Deferred();
            
            
            function showResults(featureSet)
            {
                var graphics = featureSet.features;             
                
                var pg3569 = graphics[0].geometry;
                var pg3570 = graphics[1].geometry;
                
                var extent3569 = pg3569.getExtent();
                var extent3570 = pg3570.getExtent();
                        
                var intExtent = extent3569.intersects(extent3570);
				
                t.assertEqual(null, intExtent);  
				d.callback(true);                       
            }
        
            query.where = "FID = 3569 OR FID = 3570";
            queryTask.execute(query, showResults);                  
            return d;
        }
    },
    {
        //pgs 3554 and 3573 intersect and return geometry
        name: "testIntersect_IntersectingPgs",
        timeout: 5000,
        runTest: function(t)
        {            
            var d = new doh.Deferred();
            
            
            function showResults(featureSet)
            {
                var graphics = featureSet.features;             
                
                var pg3554 = graphics[0].geometry;
                var pg3573 = graphics[1].geometry;
                
                var extent3554 = pg3554.getExtent();
                var extent3573 = pg3573.getExtent();

	            var intExtent = extent3554.intersects(extent3573);
				console.log(intExtent);
				
	           	t.assertEqual(extent3573.xmin, intExtent.xmin);
	            t.assertEqual(extent3554.ymin, intExtent.ymin);
	            t.assertEqual(extent3573.xmax, intExtent.xmax);
	            t.assertEqual(extent3573.ymax, intExtent.ymax); 
	            
				d.callback(true);                                         
            }
        
            query.where = "FID = 3554 OR FID = 3573";
            queryTask.execute(query, showResults);                  
            return d;		
        }
    },
    {
		//pg 3574 is completely inside pg 3573. should return 3574's extent
		name: "testIntersect_PgInsidePg",
		timeout: 5000,
		runTest: function(t)
		{
			var d = new doh.Deferred();
			
			
			function showResults(featureSet)
			{
                var graphics = featureSet.features;             
                
				var pg3573 = graphics[0].geometry;
                var pg3574 = graphics[1].geometry;                
				
				var extent3573 = pg3573.getExtent();				
	            var extent3574 = pg3574.getExtent();
	            
                var intExtent = extent3574.intersects(extent3573);
            
	            t.assertEqual(extent3574.xmin, intExtent.xmin);
	            t.assertEqual(extent3574.ymin, intExtent.ymin);
	            t.assertEqual(extent3574.xmax, intExtent.xmax);
	            t.assertEqual(extent3574.ymax, intExtent.ymax);
				d.callback(true);
			}
			
            query.where = "FID = 3573 OR FID = 3574";
            queryTask.execute(query, showResults);                  
            return d;       
		}
	}
    ],
	
	function() //setUp
    { 
        query = new esri.tasks.Query();
        query.returnGeometry = true;
		query.outFields = ["FID"];
        
        //use Zoning layer from Portland Map service
        queryTask = new esri.tasks.QueryTask("http://servery/ArcGIS/rest/services/Portland/PortlandMap/MapServer/8");
    }, 
	
	function() //tearDown
    { 
        query = null;
		queryTask = null;
    });
