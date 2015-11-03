dojo.provide("esri.tests.tasks.find.findTaskTest_Contains");

dojo.require("esri.tasks.find");

doh.register("tasks.find.findTaskTest_Contains", 
[
	/*
		Test to find features using following values for FindParameter properties
		 -  contains = true
		 -  layerIds = [<1 layer id>];
		 -  outSpatialReference = not specified
		 -  returnGeometry = false;
		 -  searchFields = [<1 search field>];
		 -  searchText = <String value>;		
		*/
	{
		name: "findTaskTest_Contains_Point",
		timeout: 3000, // 2 seconds, defaults to half a second
	    setUp: function()
	    {
	    	console.log("setUp()" + this.name);
	    },
	      
		runTest: function(t)
		{
			var base = [];
			base.push("Cedar Mill ES 10265 NW Cornell Rd Portland OR 97229 Beaverton");
			base.push("McKay ES 7485 SW Scholls Ferry Road Beaverton OR 97005 Beaverton");
			base.push("Vose ES 11350 SW Denny Road Beaverton OR 97005 Beaverton");
			base.push("Arts & Communication HS 11375 SW Center St Beaverton OR 97005 Beaverton");
			base.push("Whitford MS 7935 SW Scholls Ferry Road Beaverton OR 97005-6665 Beaverton");
			base.push("Raleigh Park ES 3670 SW 78th Avenue Portland OR 97225 Beaverton");
			base.push("West Tualatin View ES 8800 SW Leahy Road Portland OR 97225 Beaverton");
			base.push("Ridgewood ES 10100 SW Inglewood Street Portland OR 97225 Beaverton");
			base.push("Cedar Park MS 11100 SW Park Way Portland OR 97225 Beaverton");
			base.push("Walker ES 11940 SW Lynnfield Lane Portland OR 97225-4555 Beaverton");
			base.push("Conestoga MS 12250 SW Conestoga Dr Beaverton OR 97005 Beaverton");
			base.push("Greenway ES 9150 SW Downing Drive Beaverton OR 97005-8282 Beaverton");
			base.push("Montclair ES 7250 SW Vermont Street Beaverton OR 97223 Beaverton");
			base.push("Raleigh Hills ES 5225 SW Scholls Ferry Road Beaverton OR 97225-1611 Beaverton");
			
			var findT = new esri.tasks.FindTask("http://servery/arcgis/rest/services/Portland/PortlandMap/MapServer");
			
			var params = new esri.tasks.FindParameters();
			params.contains = true;				
	      	params.layerIds = [3];//houses layer
	      	params.searchFields = ["DISTRICT"];
	      	params.searchText = "Beavert";//for "Beaverton"
	      	params.returnGeometry = false;
			
			var d = new doh.Deferred();			
			
						
			function showResults(results) 
			{
				for (var i=0, il=results.length; i<il; i++) 
				{
		          	var feature = results[i].feature;
		           	var attribs = feature.attributes;
		          	t.assertEqual(base[i], attribs.NAME + " " + attribs.ADDRESS + " " + attribs.CITY + " " + attribs.STATE + " " + attribs.ZIPCODE + " " + attribs.DISTRICT);
		        }
		        		        			
				d.callback(true);
			}
			
			findT.execute(params, showResults);
																				 
			return d;
		},
		
		tearDown: function()
        {
			console.log("tearDown()" + this.name);		
		}		
	},
	{
		name: "findTaskTest_Contains_Point_Error",
		timeout: 3000, // 2 seconds, defaults to half a second
	    setUp: function()
	    {
	    	console.log("setUp()" + this.name);
	    },
	      
		runTest: function(t)
		{			
			var findT = new esri.tasks.FindTask("http://servery/arcgis/rest/services/Portland/PortlandMap/MapServer");
			
			var params = new esri.tasks.FindParameters();
			params.contains = true;				
	      	params.layerIds = [3];//houses layer
	      	params.searchFields = ["DISTRICT"];
	      	params.searchText = "jeavert";//correct value any substring of "Beaverton"
	      	params.returnGeometry = false;
			
			var d = new doh.Deferred();			
			
						
			function showResults(results) 
			{
				if(results[0] == null)
				{
			    	t.assertTrue(true);					
			    }
			    else
			    {
		          	var feature = results[0].feature;
		           	var attribs = feature.attributes;
		          	//alert(attribs.NAME + " " + attribs.ADDRESS + " " + attribs.CITY + " " + attribs.STATE + " " + attribs.ZIPCODE + " " + attribs.DISTRICT);
					t.assertTrue(false);
			    }
			
				d.callback(true);
			}
			
			findT.execute(params, showResults);
																				 
			return d;
		},
		
		tearDown: function()
        {
			console.log("tearDown()" + this.name);		
		}		
	},
	{
		name: "findTaskTest_Contains_Multipoint",
		timeout: 3000, // 2 seconds, defaults to half a second
	    setUp: function()
	    {
			console.log("setUp()" + this.name);	    
	    },
	      
		runTest: function(t)
		{				
			var base = [];
			base.push("0 9 deer");
			base.push("1 8 deer");
			base.push("3 10 deer");
			base.push("5 6 deer");
			
			var findT = new esri.tasks.FindTask("http://servery/arcgis/rest/services/Portland/PortlandMap/MapServer");
			
			var params = new esri.tasks.FindParameters();
			params.contains = true;				
			params.layerIds = [2];//animals layer
	      	params.searchFields = ["species"];
	      	params.searchText = "de";//for "deer"
	      	params.returnGeometry = false;		        						        

			var d = new doh.Deferred();			
			
						
			function showResults(results) 
			{
				if(results[0] == null)
				{
			    	t.assertTrue(false);					
			    }
			    else
			    {			
					for (var i=0, il=results.length; i<il; i++) 
					{
			          	var feature = results[i].feature;
			           	var attribs = feature.attributes;
			          	t.assertEqual(base[i], attribs.Id + " " + attribs.animalnum + " " + attribs.species);						          	
			        }
			    }
		        		        			
				d.callback(true);
			}
			
			findT.execute(params, showResults);
																				 
			return d;
		},
		
		tearDown: function()
        {
        	console.log("tearDown()" + this.name);
		}
	},	
	{
		name: "findTaskTest_Contains_Multipoint_Error",
		timeout: 3000, // 2 seconds, defaults to half a second
	    setUp: function()
	    {
			console.log("setUp()" + this.name);	    
	    },
	      
		runTest: function(t)
		{				
			var base = [];
			base.push("0 9 deer");
			base.push("1 8 deer");
			base.push("3 10 deer");
			base.push("5 6 deer");
			var d = new doh.Deferred();
			
			var findT = new esri.tasks.FindTask("http://servery/arcgis/rest/services/Portland/PortlandMap/MapServer");
			
			var params = new esri.tasks.FindParameters();
			params.contains = true;				
			params.layerIds = [2];//animals layer
	      	params.searchFields = ["species"];
	      	params.searchText = "der";//for "deer"
	      	params.returnGeometry = false;		        						        

			
						
			function showResults(results) 
			{
				if(results[0] == null)
				{
			    	t.assertTrue(true);					
			    }
			    else
			    {
		          	var feature = results[0].feature;
		           	var attribs = feature.attributes;
		          	alert(attribs.NAME + " " + attribs.ADDRESS + " " + attribs.CITY + " " + attribs.STATE + " " + attribs.ZIPCODE + " " + attribs.DISTRICT);
					t.assertTrue(false);
			    }
		        		        			
				d.callback(true);
			}
			
			findT.execute(params, showResults);
																				 
			return d;
		},
		
		tearDown: function()
        {
        	console.log("tearDown()" + this.name);
		}
	},	
	{
		name: "findTaskTest_Contains_Polyline",
		timeout: 3000, // 2 seconds, defaults to half a second
	    setUp: function()
	    {
			console.log("setUp()" + this.name);	    
	    },
	      
		runTest: function(t)
		{		
			var base = [];
			base.push("270.3222 KRUSE WAY 1200");
			base.push("237.83508 KRUSE WAY 1300");
			base.push("344.69117 KRUSE WAY 1300");
			base.push("1832.81902 KRUSE WAY 1300");
			base.push("2044.12566 KRUSE WAY 1300");
			base.push("16.95132 KRUSE WAY 1200");
			base.push("557.15279 KRUSE WAY 1300");
			base.push("755.705 KRUSE WAY 1300");
			base.push("1004.46481 KRUSE WAY 1300");
			
			var findT = new esri.tasks.FindTask("http://servery/arcgis/rest/services/Portland/PortlandMap/MapServer");
			
			var params = new esri.tasks.FindParameters();
			params.contains = true;				
			params.layerIds = [4];//major roads layer
	      	params.searchFields = ["FTYPE"];
	      	params.searchText = "AY";//for "WAY"	
	      	params.returnGeometry = false;				        					

			var d = new doh.Deferred();			
			
						
			function showResults(results) 
			{
				if(results[0] == null)
				{
			    	t.assertTrue(false);					
			    }
			    else
			    {						
					for (var i=0, il=results.length; i<il; i++) 
					{
			          	var feature = results[i].feature;
			           	var attribs = feature.attributes;
			          	t.assertEqual(base[i], attribs.LENGTH + " " + attribs.STREETNAME + " " + attribs.FTYPE + " " + attribs.TYPE);						          	
			        }
			    }
		        		        			
				d.callback(true);
			}
			
			findT.execute(params, showResults);
																				 
			return d;
		},
		
		tearDown: function()
        {
			console.log("tearDown()" + this.name);		
		}		
	},
	{
		name: "findTaskTest_Contains_Polyline_Error",
		timeout: 3000, // 2 seconds, defaults to half a second
	    setUp: function()
	    {
			console.log("setUp()" + this.name);	    
	    },
	      
		runTest: function(t)
		{					
			var findT = new esri.tasks.FindTask("http://servery/arcgis/rest/services/Portland/PortlandMap/MapServer");
			
			var params = new esri.tasks.FindParameters();
			params.contains = true;				
			params.layerIds = [4];//major roads layer
	      	params.searchFields = ["FTYPE"];
	      	params.searchText = "BA";//for "WAY" //should "AY" from "WAY" be acceptable? it is.	
	      	params.returnGeometry = false;				        					

			var d = new doh.Deferred();			
			
						
			function showResults(results) 
			{
				if(results == null || results.length == 0)
				{
			    	t.assertTrue(true);					
			    }
			    else
			    {						
		          	var feature = results[0].feature;
		           	var attribs = feature.attributes;
		          	alert(attribs.LENGTH + " " + attribs.STREETNAME + " " + attribs.FTYPE + " " + attribs.TYPE);						          	
			    }
		        		        			
				d.callback(true);
			}
			
			findT.execute(params, showResults);
																				 
			return d;
		},
		
		tearDown: function()
        {
			console.log("tearDown()" + this.name);		
		}		
	},
	{
		name: "findTaskTest_Contains_Polygon",
		timeout: 3000, // 2 seconds, defaults to half a second
	    setUp: function()
	    {
	      	console.log("setUp()" + this.name);
	    },
	      
		runTest: function(t)
		{
			var base = [];
			base.push("Lake Oswego NC undefined 121907.02302");
			base.push("Lake Oswego R7.5 undefined 4353485.66152");
			base.push("Lake Oswego R0 undefined 398178.7207");
			base.push("Lake Oswego R3 undefined 630720.62687");
			base.push("Lake Oswego R0 undefined 629768.49975");
			base.push("Lake Oswego R0 undefined 2349512.3225");
			base.push("Lake Oswego R0 undefined 668120.38694");
			base.push("Lake Oswego R0 NC undefined 976570.30002");
			base.push("Lake Oswego R10 undefined 2131977.02838");
			base.push("Lake Oswego R7.5 undefined 885970.61476");

			var findT = new esri.tasks.FindTask("http://servery/arcgis/rest/services/Portland/PortlandMap/MapServer");
			
			var params = new esri.tasks.FindParameters();
			params.contains = true;				
			params.layerIds = [8];//zoning layer
	      	params.searchFields = ["CITY"];
	      	params.searchText = "lake osw";//for "lake oswego"
	      	params.returnGeometry = false;
	      		
			var d = new doh.Deferred();			
			
						
			function showResults(results) 			
			{
				
				for (var i=0, il=10; i<il; i++) 
				{
		          	var feature = results[i].feature;
		           	var attribs = feature.attributes;
					
		          	t.assertEqual(base[i], attribs.CITY + " " + attribs.ZONE + " " + attribs.ZONEGEN_C + " " + attribs.AREA);
		        }
		        		        			
				d.callback(true);
			}
			
			findT.execute(params, showResults);
																				 
			return d;
		},
		
		tearDown: function()
        {
        	console.log("tearDown()" + this.name);
		}		
	},
	{
		name: "findTaskTest_Contains_Polygon_Error",
		timeout: 3000, // 2 seconds, defaults to half a second
	    setUp: function()
	    {
	      	console.log("setUp()" + this.name);
	    },
	      
		runTest: function(t)
		{
			var findT = new esri.tasks.FindTask("http://servery/arcgis/rest/services/Portland/PortlandMap/MapServer");
			
			var params = new esri.tasks.FindParameters();
			params.contains = true;				
			params.layerIds = [8];//zoning layer
	      	params.searchFields = ["CITY"];
	      	params.searchText = "lake osa";//for "lake oswego"
	      	params.returnGeometry = false;
	      		
			var d = new doh.Deferred();			
									
			function showResults(results) 
			{
				if(results[0] == null)
				{
			    	t.assertTrue(true);					
			    }
			    else
			    {
		          	var feature = results[0].feature;
		           	var attribs = feature.attributes;
		          	alert(attribs.NAME + " " + attribs.ADDRESS + " " + attribs.CITY + " " + attribs.STATE + " " + attribs.ZIPCODE + " " + attribs.DISTRICT);
					t.assertTrue(false);
			    }
		        		        			
				d.callback(true);
			}
			
			findT.execute(params, showResults);
																				 
			return d;
		},
		
		tearDown: function()
        {
        	console.log("tearDown()" + this.name);
		}		
	},		
]);