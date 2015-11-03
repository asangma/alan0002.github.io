dojo.provide("esri.tests.tasks.find.findResult_displayFieldNameTest");

dojo.require("esri.tasks.find");  

var findTask, params;

doh.registerGroup("tasks.find.findResult_displayFieldNameTest",
	[
		{
			name: "testPointLayer",
			timeout: 5000,
			runTest: function(t)
			{		
				var expectedResultString = "Name";
	
		      	params.layerIds = [3];//houses layer
		      	params.searchFields = ["DISTRICT"];
		      	params.searchText = "Beaverton";
				
				var d = new doh.Deferred();			
				
							
				function showResults(results) 
				{
					if(results == null || results.length == 0)
					{
				    	t.assertTrue(false);					
				    }
				    else
				    {			
						for (var i=0; i<results.length;  i++) {
						//console.debug(results[i].displayFieldName);
				      	t.assertEqual(expectedResultString, results[i].displayFieldName);
				      	}
				    }
			        		        			
					d.callback(true);
				}
				
				findTask.execute(params, showResults);																				 
				return d;

			}
		},
		{
			name: "testMultipointLayer",
			timeout: 3000,
			runTest: function(t)
			{
				var expectedResultString = "Id";
				
				params.layerIds = [2];//animals layer
		      	params.searchFields = ["species"];
		      	params.searchText = "deer";	        						        
	
				var d = new doh.Deferred();			
											
				function showResults(results) 
				{
					if(results == null || results.length == 0)
					{
				    	t.assertTrue(false);					
				    }
				    else
				    {		
						for (var i=0; i<results.length;  i++) {
						//console.debug(results[i].displayFieldName);
				      	t.assertEqual(expectedResultString, results[i].displayFieldName);
				      	}		    	
				    }
			        		        			
					d.callback(true);
				}
				
				findTask.execute(params, showResults);																				 
				return d;
			}
		},
		{
			name: "testPolylineLayer",
			timeout: 3000,
			runTest: function(t)
			{
				var expectedResultString = "STREETNAME";
							
				params.layerIds = [4];//major roads layer
		      	params.searchFields = ["FTYPE"];
		      	params.searchText = "WAY";		
	
				var d = new doh.Deferred();			
											
				function showResults(results) 
				{
					if(results == null || results.length == 0)
					{
				    	t.assertTrue(false);					
				    }
				    else
				    {
						for (var i=0; i<results.length;  i++) {
				      		t.assertEqual(expectedResultString, results[i].displayFieldName);
				      	}
			        }
			        		        			
					d.callback(true);
				}
				
				findTask.execute(params, showResults);																				 
				return d;		
			}
		},		
		{
			name: "testPolygonLayer",
			timeout: 3000,
			runTest: function(t)
			{
				var expectedResultString = "CITY";
	
				params.layerIds = [8];//zoning layer
		      	params.searchFields = ["CITY"];
		      	params.searchText = "Lake Oswego";
		      		
				var d = new doh.Deferred();			
											
				function showResults(results) 
				{		
					if(results == null || results.length == 0)
					{
						alert(attribs.CITY + " " + attribs.ZONE + " " + attribs.ZONEGEN_C + " " + attribs.AREA);
						t.assertTrue(false);					
				    }
				    else
				    {
						for (var i=0; i<results.length;  i++) {
				      		t.assertEqual(expectedResultString, results[i].displayFieldName);
				      	}		    	
				    }
			        		        			
					d.callback(true);
				}
				
				
				findTask.execute(params, showResults);																				 
				return d;				
			}		
		}
	],
		
	function()//setUp()
	{
		findTask = new esri.tasks.FindTask("http://servery/arcgis/rest/services/Portland/PortlandMap/MapServer");
		
		params = new esri.tasks.FindParameters();
		params.contains = false;				
		params.returnGeometry = false;					
	},
	
	function()//tearDown
	{
		findTask = null;
		params = null;
	}
);