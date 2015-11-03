dojo.provide("esri.tests.tasks.find.findParam_returnGeometryTest");

dojo.require("esri.tasks.find");  

var findTask, params;

doh.registerGroup("tasks.find.findParam_returnGeometryTest",
	[
		{
			name: "testPointLayer",
			timeout: 5000,
			runTest: function(t)
			{		
				var expectedResultJSON = {results:[{"geometry":{"x":7617108,"y":686473.5625,
					"spatialReference":{"wkid":102726}},"attributes":{"FID":"28","Shape":
					"Point","AREA":"0","NAME":"Cedar Mill ES","ADDRESS":"10265 NW Cornell Rd",
					"CITY":"Portland","STATE":"OR","ZIPCODE":"97229","DISTRICT":"Beaverton",
					"PHONE":"591 4546","DIST_NO":"48J","LEVEL_NO":"1","LEVEL":"Elementary School",
					"TYPE":"Public"}},
					{"geometry":{"x":7617572,"y":664093.5625,"spatialReference":
					{"wkid":102726}},"attributes":{"FID":"29","Shape":"Point","AREA":"0",
					"NAME":"McKay ES","ADDRESS":"7485 SW Scholls Ferry Road","CITY":"Beaverton",
					"STATE":"OR","ZIPCODE":"97005","DISTRICT":"Beaverton","PHONE":"591 4528",
					"DIST_NO":"48J","LEVEL_NO":"1","LEVEL":"Elementary School","TYPE":"Public"}},
					{"geometry":{"x":7613755,"y":665362.6875,"spatialReference":
					{"wkid":102726}},"attributes":{"FID":"30","Shape":"Point","AREA":"0",
					"NAME":"Vose ES","ADDRESS":"11350 SW Denny Road","CITY":"Beaverton",
					"STATE":"OR","ZIPCODE":"97005","DISTRICT":"Beaverton","PHONE":"592 4538",
					"DIST_NO":"48J","LEVEL_NO":"1","LEVEL":"Elementary School","TYPE":"Public"}},
					{"geometry":{"x":7613947,"y":674652.4375,"spatialReference":
					{"wkid":102726}},"attributes":{"FID":"31","Shape":"Point","AREA":"0","NAME":
					"Arts & Communication HS","ADDRESS":"11375 SW Center St","CITY":"Beaverton",
					"STATE":"OR","ZIPCODE":"97005","DISTRICT":"Beaverton","PHONE":"259-4700",
					"DIST_NO":"48J","LEVEL_NO":"3","LEVEL":"High School","TYPE":"Public"}},
					{"geometry":{"x":7617109.5,"y":663404.25,"spatialReference":
					{"wkid":102726}},"attributes":{"FID":"35","Shape":"Point","AREA":"0","NAME":"Whitford MS",
					"ADDRESS":"7935 SW Scholls Ferry Road","CITY":"Beaverton","STATE":"OR","ZIPCODE":"97005-6665",
					"DISTRICT":"Beaverton","PHONE":"591 4660","DIST_NO":"48J","LEVEL_NO":"2",
					"LEVEL":"Middle or Jr. High School","TYPE":"Public"}},
					{"geometry":{"x":7623760.5,"y":674056.5625,"spatialReference":
					{"wkid":102726}},"attributes":{"FID":"36","Shape":"Point","AREA":"0","NAME":
					"Raleigh Park ES","ADDRESS":"3670 SW 78th Avenue","CITY":"Portland","STATE":"OR",
					"ZIPCODE":"97225","DISTRICT":"Beaverton","PHONE":"591 4552","DIST_NO":"48J","LEVEL_NO":"1",
					"LEVEL":"Elementary School","TYPE":"Public"}},
					{"geometry":{"x":7621141,"y":682096.9375,"spatialReference":
					{"wkid":102726}},"attributes":{"FID":"40","Shape":"Point","AREA":"0",
					"NAME":"West Tualatin View ES","ADDRESS":"8800 SW Leahy Road","CITY":"Portland",
					"STATE":"OR","ZIPCODE":"97225","DISTRICT":"Beaverton","PHONE":"591 4556","DIST_NO":"48J",
					"LEVEL_NO":"1","LEVEL":"Elementary School","TYPE":"Public"}},
					{"geometry":{"x":7617466.5,"y":677547.125,"spatialReference":
					{"wkid":102726}},"attributes":{"FID":"42","Shape":"Point","AREA":"0",
					"NAME":"Ridgewood ES","ADDRESS":"10100 SW Inglewood Street","CITY":"Portland",
					"STATE":"OR","ZIPCODE":"97225","DISTRICT":"Beaverton","PHONE":"591 4554",
					"DIST_NO":"48J","LEVEL_NO":"1","LEVEL":"Elementary School","TYPE":"Public"}},
					{"geometry":{"x":7614822.5,"y":678931.75,"spatialReference":
					{"wkid":102726}},"attributes":{"FID":"43","Shape":"Point","AREA":"0","NAME":"Cedar Park MS",
					"ADDRESS":"11100 SW Park Way","CITY":"Portland","STATE":"OR","ZIPCODE":"97225",
					"DISTRICT":"Beaverton","PHONE":"591 4610","DIST_NO":"48J","LEVEL_NO":"2","LEVEL":
					"Middle or Jr. High School","TYPE":"Public"}},
					{"geometry":{"x":7612457.5,"y":677361.5625,"spatialReference":
					{"wkid":102726}},"attributes":{"FID":"44","Shape":"Point","AREA":"0","NAME":
					"Walker ES","ADDRESS":"11940 SW Lynnfield Lane","CITY":"Portland","STATE":"OR",
					"ZIPCODE":"97225-4555","DISTRICT":"Beaverton","PHONE":"591 4540","DIST_NO":"48J",
					"LEVEL_NO":"1","LEVEL":"Elementary School","TYPE":"Public"}},
					{"geometry":{"x":7611183.5,"y":657370.375,"spatialReference":
					{"wkid":102726}},"attributes":{"FID":"48","Shape":"Point","AREA":"0",
					"NAME":"Conestoga MS","ADDRESS":"12250 SW Conestoga Dr","CITY":"Beaverton",
					"STATE":"OR","ZIPCODE":"97005","DISTRICT":"Beaverton","PHONE":"591-4379",
					"DIST_NO":"48J","LEVEL_NO":"2","LEVEL":"Middle or Jr. High School",
					"TYPE":"Public"}},
					{"geometry":{"x":7611469.5,"y":659923.0625,"spatialReference":{"wkid":102726}},
					"attributes":{"FID":"49","Shape":"Point","AREA":"0","NAME":"Greenway ES",
					"ADDRESS":"9150 SW Downing Drive","CITY":"Beaverton","STATE":"OR",
					"ZIPCODE":"97005-8282","DISTRICT":"Beaverton","PHONE":"591 4520",
					"DIST_NO":"48J","LEVEL_NO":"1","LEVEL":"Elementary School","TYPE":"Public"}},
					{"geometry":{"x":7624517.5,"y":667638.3125,"spatialReference":{"wkid":102726}},
					"attributes":{"FID":"62","Shape":"Point","AREA":"0","NAME":"Montclair ES",
					"ADDRESS":"7250 SW Vermont Street","CITY":"Beaverton","STATE":"OR","ZIPCODE":
					"97223","DISTRICT":"Beaverton","PHONE":"591 4548","DIST_NO":"48J",
					"LEVEL_NO":"1","LEVEL":"Elementary School","TYPE":"Public"}},
					{"geometry":{"x":7622974.5,"y":670062.4375,"spatialReference":
					{"wkid":102726}},"attributes":{"FID":"64","Shape":"Point","AREA":"0",
					"NAME":"Raleigh Hills ES","ADDRESS":"5225 SW Scholls Ferry Road",
					"CITY":"Beaverton","STATE":"OR","ZIPCODE":"97225-1611","DISTRICT":"Beaverton",
					"PHONE":"591 4550","DIST_NO":"48J","LEVEL_NO":"1","LEVEL":"Elementary School",
					"TYPE":"Public"}}
					]};
	
		      	params.layerIds = [3];//houses layer
		      	params.searchFields = ["DISTRICT"];
		      	params.searchText = "Beaverton";
				
				var d = new doh.Deferred();			
				var expectedResultsArray =expectedResultJSON.results; 
							
				function showResults(results) 
				{
					
					if(results == null || results.length == 0)
					{
				    	t.assertTrue(false);					
				    }
				    else
				    {			
						for (var i=0; i<results.length; i++) 
						{
				          	var feature = results[i].feature;
				          	var expectedresult = expectedResultsArray[i];
				          	//console.debug(dojo.toJson(expectedresult));
				          	//console.debug(dojo.toJson(feature.toJSON()));
				          	t.assertEqual(dojo.toJson(expectedresult),dojo.toJson(feature.toJSON()));
				           	
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
				var expectedResultJSON = {results:[{"geometry":{"points":[[7645630.89156692,661222.646265564],
					[7645654.27872602,661304.501322406],[7645697.15518436,661296.705602707],
					[7645713.30418851,661176.861475788],[7645728.33806316,661398.049958797],
					[7645755.62308211,661359.071360301],[7645772.06265963,661263.677483413],
					[7645787.09295667,661300.62730754],[7645790.70382075,661199.259106466]],
					"spatialReference":{"wkid":102726}},"attributes":{"FID":"0","Shape":"Multipoint",
					"Id":"0","animalnum":"9","species":"deer"}},
					{"geometry":{"points":[[7646153.20478677,659386.754276391],[7646254.54914286,659289.30778015],
					[7646258.44700271,659347.775677895],[7646262.34486256,659402.345715789],
					[7646266.06039388,659265.090096154],[7646328.60848,659453.017893835],
					[7646331.16519849,659260.749775847],[7646336.61949201,659342.564178609]],
					"spatialReference":{"wkid":102726}},"attributes":{"FID":"1","Shape":"Multipoint",
					"Id":"1","animalnum":"8","species":"deer"}},
					{"geometry":{"points":[[7649677.30318637,658955.824215238],[7649720.17964471,658948.028495539],
					[7649731.87322426,658990.904953885],[7649748.63372433,658903.479789],
					[7649762.0042837,658952.505173363],[7649769.66592387,658980.597853991],
					[7649786.44326216,659022.087832682],[7649794.23898185,658897.356317494],
					[7649817.62614095,658944.130635689],[7649826.25305432,659038.011749547]],
					"spatialReference":{"wkid":102726}},"attributes":{"FID":"3","Shape":"Multipoint",
					"Id":"3","animalnum":"10","species":"deer"}},
					{"geometry":{"points":[[7653476.73271778,666501.720862304],
					[7653480.63057763,666552.393040349],[7653542.18743257,666465.066271591],
					[7653548.5032628,666547.172064568],[7653597.45185276,666460.815162346],
					[7653602.38289777,666524.918747547]],"spatialReference":{"wkid":102726}},
					"attributes":{"FID":"5","Shape":"Multipoint","Id":"5","animalnum":"6","species":"deer"}}
					
				]};       						        
	
				var d = new doh.Deferred();			
				var expectedResultsArray =expectedResultJSON.results; 	
				params.layerIds = [2];//animals layer
		      	params.searchFields = ["species"];
		      	params.searchText = "deer";	 						
				function showResults(results) 
				{
					if(results == null || results.length == 0)
					{
				    	t.assertTrue(false);					
				    }
				    else
				    {		
						for (var i=0; i<results.length; i++) 
						{
				          	var feature = results[i].feature;
				          	var expectedresult = expectedResultsArray[i];
				          	//console.debug(dojo.toJson(expectedresult));
				          	//console.debug(dojo.toJson(feature.toJSON()));
				          	t.assertEqual(dojo.toJson(expectedresult),dojo.toJson(feature.toJSON()));
				           	
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
				var expectedResultJSON = {results:[{"geometry":{"paths":[[[7626761.5814776,647203.410760681],
					[7626510.82380721,647304.37949131]]],"spatialReference":{"wkid":102726}},
					"attributes":{"FID":"2473","Shape":"Polyline","LENGTH":"270.3222","PREFIX":"",
					"STREETNAME":"KRUSE","FTYPE":"WAY","TYPE":"1200"}},
					{"geometry":{"paths":[[[7626974.19397585,647096.820648376],
					[7626761.5814776,647203.410760681]]],"spatialReference":{"wkid":102726}},
					"attributes":{"FID":"2474","Shape":"Polyline","LENGTH":"237.83508","PREFIX":"",
					"STREETNAME":"KRUSE","FTYPE":"WAY","TYPE":"1300"}},
					{"geometry":{"paths":[[[7627295.59739898,646972.274088018],
					[7626974.19397585,647096.820648376]]],"spatialReference":{"wkid":102726}},
					"attributes":{"FID":"2477","Shape":"Polyline","LENGTH":"344.69117","PREFIX":"",
					"STREETNAME":"KRUSE","FTYPE":"WAY","TYPE":"1300"}},
					{"geometry":{"paths":[[[7629103.90224707,646742.776175158],
					[7628323.7016483,646759.640771235],[7628202.71637434,646771.296385406],
					[7628127.86239098,646780.234095819],[7627978.67929086,646802.021371708],
					[7627841.62314555,646826.950737561],[7627830.34747889,646829.001686932],
					[7627756.5572505,646844.429211371],[7627683.04756012,646861.14217695],
					[7627536.95909129,646898.403679286],[7627464.42484367,646918.940855334],
					[7627295.59739898,646972.274088018]]],"spatialReference":{"wkid":102726}},
					"attributes":{"FID":"2489","Shape":"Polyline","LENGTH":"1832.81902","PREFIX":"",
					"STREETNAME":"KRUSE","FTYPE":"WAY","TYPE":"1300"}},
					{"geometry":{"paths":[[[7631122.97099117,646529.804289919],
					[7630993.20766357,646575.155623731],[7630908.53123708,646602.499655195],
					[7630823.39047138,646628.361734257],[7630733.70907444,646652.807079253],
					[7630654.83419782,646671.161061555],[7630575.36679755,646686.75121716],
					[7630495.40375476,646699.558540772],[7630415.04246531,646709.567435885],
					[7630293.96808265,646719.30798112],[7630213.04028802,646722.274937969],
					[7630091.57782239,646721.426233714],[7629103.90224707,646742.776175158]]],
					"spatialReference":{"wkid":102726}},"attributes":{"FID":"2502","Shape":"Polyline",
					"LENGTH":"2044.12566","PREFIX":"","STREETNAME":"KRUSE","FTYPE":"WAY","TYPE":"1300"}},
					{"geometry":{"paths":[[[7631138.97316226,646524.21163776],
					[7631122.97099117,646529.804289919]]],"spatialReference":{"wkid":102726}},
					"attributes":{"FID":"2503","Shape":"Polyline","LENGTH":"16.95132","PREFIX":"",
					"STREETNAME":"KRUSE","FTYPE":"WAY","TYPE":"1200"}},
					{"geometry":{"paths":[[[7631635.51322392,646271.492028435],
					[7631138.97316226,646524.21163776]]],"spatialReference":{"wkid":102726}},
					"attributes":{"FID":"2512","Shape":"Polyline","LENGTH":"557.15279","PREFIX":"",
					"STREETNAME":"KRUSE","FTYPE":"WAY","TYPE":"1300"}},
					{"geometry":{"paths":[[[7632309.00495717,645928.710852726],
					[7631635.51322392,646271.492028435]]],"spatialReference":{"wkid":102726}},
					"attributes":{"FID":"2519","Shape":"Polyline","LENGTH":"755.705","PREFIX":"",
					"STREETNAME":"KRUSE","FTYPE":"WAY","TYPE":"1300"}},
					{"geometry":{"paths":[[[7633197.2905018,645459.855564817],[7632530.0109099,645816.227247814],
					[7632309.00495717,645928.710852726]]],"spatialReference":{"wkid":102726}},
					"attributes":{"FID":"2530","Shape":"Polyline","LENGTH":"1004.46481","PREFIX":"",
					"STREETNAME":"KRUSE","FTYPE":"WAY","TYPE":"1300"}}]};
					
					var expectedResultsArray =expectedResultJSON.results; 
								
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
						for (var i=0; i<results.length; i++) 
						{
				          	var feature = results[i].feature;
				           	var expectedresult = expectedResultsArray[i];
				          	//console.debug(dojo.toJson(expectedresult));
				          	//console.debug(dojo.toJson(feature.toJSON()));
				          	t.assertEqual(dojo.toJson(expectedresult),dojo.toJson(feature.toJSON()));
				           	
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
						for (var i=0; i<results.length; i++) 
						{
				          	var feature = results[i].feature;
				           	//console.debug(dojo.toJson(feature.toJSON()));
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
		params.returnGeometry = true;					
	},
	
	function()//tearDown
	{
		findTask = null;
		params = null;
	}
);
