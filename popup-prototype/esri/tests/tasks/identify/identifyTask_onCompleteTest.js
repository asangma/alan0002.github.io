dojo.provide("esri.tests.tasks.identify.identifyTask_onCompleteTest");

dojo.require("esri.tasks.identify");  

var identifyTask, identifyParams;


doh.registerGroup("tasks.identify.identifyTask_onCompleteTest",
	[
		{
			name: "testPointLayer",
			timeout: 3000,
			runTest: function(t)
			{	
						
				identifyParams.geometry = new esri.geometry.Point(7617572.00013928,664093.562355682, new esri.SpatialReference({ wkid: 102726 }));
			    identifyParams.layerIds = [3];//houses layer
				
				var expectedResultJSON = {results:[{"geometry":{"x":7617572,"y":664093.5625,
				"spatialReference":{"wkid":102726}},"attributes":
				{"FID":"29","Shape":"Point","AREA":"0","NAME":"McKay ES",
				"ADDRESS":"7485 SW Scholls Ferry Road","CITY":"Beaverton",
				"STATE":"OR","ZIPCODE":"97005","DISTRICT":"Beaverton",
				"PHONE":"591 4528","DIST_NO":"48J","LEVEL_NO":"1","LEVEL":"Elementary School",
				"TYPE":"Public"}}]};
								
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
				      	console.debug(results.length);
				      	for (var i=0; i<results.length;  i++) 
						{
				          	var feature = results[i].feature;
				          	var expectedresult = expectedResultsArray[i];
				          	t.assertEqual(dojo.toJson(expectedresult),dojo.toJson(feature.toJSON()));
				           	
				        }
				    }
			        		        			
					d.callback(true);
				}
				dojo.connect(identifyTask,"onComplete",showResults);
				identifyTask.execute(identifyParams);	
																				 
				return d;
			}
		},
		/**
		{
			name: "testMultipointLayer",
			timeout: 3000,
			runTest: function(t)
			{
				/**		
				var x = [7653476.7327916, 7653480.63042161, 7653542.18738511, 7653548.50331736, 7653597.45171027, 7653602.38280277];
				var y = [666501.720925182, 666552.393067941, 666465.066142857, 666547.171949774, 666460.815167099, 666524.918713436];
				
				//{"points":[[7653476.7327916, 666501.720925182], [7653480.63042161, 666552.393067941], [7653542.18738511, 666465.066142857], [7653548.50331736, 666547.171949774], [7653597.45171027, 666460.815167099], [7653602.38280277, 666524.918713436]]}				
				
				var SRJson = {"wkid": 102726};
				var multipoint = new esri.geometry.Multipoint(new esri.SpatialReference());
				var point1 =  new esri.geometry.Point(7653476.7327916, 666501.720925182, new esri.SpatialReference(SRJson));
				var point2 = new esri.geometry.Point(7653480.63042161, 666552.393067941, new esri.SpatialReference(SRJson));
				multipoint.addPoint(point1);
				multipoint.addPoint(point2);
				
					
				identifyParams.geometry = multipoint;
				identifyParams.layerIds = [2];//animals layer
				
				var d = new doh.Deferred();
				
				
				function showResults(results)
				{
					if (results == null || results.length == 0) 
					{
						console.log("results: " + results);
						t.assertTrue(false);//"NULL returned for results in test " + name, 
					}
					else 
					{
						console.debug(results.length);
					}
					
					d.callback(true);
				}
				
				identifyTask.execute(identifyParams, showResults);
				return d;
			}
		},
		
		{
			name: "testPolylineLayer",
			timeout: 3000,
			runTest: function(t)
			{
				var expectedResultJSON = {results:[{"geometry":{"paths":
				[[[7626761.5814776,647203.410760681],[7626687.22963234,647267.714349498],
				[7626627.09997149,647327.842766074],[7626617.60555908,647381.64224105],
				[7626623.93444285,647448.100513909],[7626647.20977924,647555.428235463]]],
				"spatialReference":{"wkid":102726}},"attributes":
				{"FID":"2472","Shape":"Polyline","LENGTH":"414.54889","PREFIX":"",
				"STREETNAME":"I5","FTYPE":"RAMP","TYPE":"1121"}},
				{"geometry":{"paths":[[[7626761.5814776,647203.410760681],
				[7626510.82380721,647304.37949131]]],"spatialReference":{"wkid":102726}},
				"attributes":{"FID":"2473","Shape":"Polyline","LENGTH":"270.3222",
				"PREFIX":"","STREETNAME":"KRUSE","FTYPE":"WAY","TYPE":"1200"}}]};
				
				var x = [7626761.58149761, 7626510.82379702];
				var y = [647203.410768598, 647304.379398689];
				
				var polyline = new esri.geometry.Polyline();
				var spatRef = new esri.SpatialReference();
				spatRef.wkid = 102726;				
				var points = [];
				for (var i = 0; i < x.length; i++) 
				{
					var point = new esri.geometry.Point();
					point.x = x[i];
					point.y = y[i];
					point.spatialReference = spatRef;
					points.push(point);
					point = null;
				}				
				
				polyline.addPath(points);
				polyline.spatialReference = spatRef;
						
				identifyParams.geometry = polyline;
				identifyParams.layerIds = [4];//major roads layer
												
				var d = new doh.Deferred();
				
				var expectedResultsArray =expectedResultJSON.results; 
								
				function showResults(results)
				{
					if (results == null || results.length == 0) 
					{
						t.assertTrue(false);
					}
					else 
					{
						for (var i=0; i<results.length;  i++) 
						{
				          	var feature = results[i].feature;
				          	
				          	var expectedresult = expectedResultsArray[i];
				          	t.assertEqual(dojo.toJson(expectedresult),dojo.toJson(feature.toJSON()));
				           	
				        }
					}
					
					d.callback(true);
				}
				
				identifyTask.execute(identifyParams, showResults);
				return d;
			}
		},
		{
			name: "testPolygonLayer",
			timeout: 3000,
			runTest: function(t)
			{
				var base = [];
				base.push("7655650.94399436,661388.116323024");
				base.push("7655648.56899911,661338.366422519");
				base.push("7655653.3189896,661338.428758353");
				base.push("7655649.69399686,661239.866291434");
				base.push("7655646.44400336,661191.36638844");
				base.push("7655554.19353169,661192.991057098");
				base.push("7655544.69355069,661341.553424016");
				base.push("7655543.06855394,661391.928651348");
				base.push("7655650.94399436,661388.116323024");		
													
				var x = [7655650.94399436, 7655648.56899911, 7655653.3189896, 7655649.69399686, 7655646.44400336, 7655554.19353169, 7655544.69355069, 7655543.06855394, 7655650.94399436];
				var y = [661388.116323024, 661338.366422519, 661338.428758353, 661239.866291434, 661191.36638844, 661192.991057098, 661341.553424016, 661391.928651348, 661388.116323024];
				
				var polygon = new esri.geometry.Polygon();
				var spatRef = new esri.SpatialReference();
				spatRef.wkid = 102726;				
				var points = [];
				for (var i = 0; i < x.length; i++) 
				{
					var point = new esri.geometry.Point();
					point.x = x[i];
					point.y = y[i];
					point.spatialReference = spatRef;
					points.push(point);
					point = null;
				}				
				
				polygon.addRing(points);
				polygon.spatialReference = spatRef;
						
				identifyParams.geometry = polygon;
				identifyParams.layerIds = [8];//zoning layer
					
				var d = new doh.Deferred();			
								
				function showResults(results) 
				{
					if(results == null || results.length == 0)
					{
				    	t.assertTrue(false);					
				    }
				    else
				    {		
			          	for (var i=0; i<results.length;  i++) 
						{
				          	var feature = results[i].feature;
				          	//console.debug(dojo.toJson(feature.toJSON()));
				          	//var expectedresult = expectedResultsArray[i];
				          	//t.assertEqual(dojo.toJson(expectedresult),dojo.toJson(feature.toJSON()));
				           	
				        }
				    }
					d.callback(true);
				}				
				
				identifyTask.execute(identifyParams, showResults);																				 
				return d;
			}
		}
		**/
	],
		
	function()//setUp()
	{
        identifyTask = new esri.tasks.IdentifyTask("http://servery/arcgis/rest/services/Portland/PortlandMap/MapServer");

		identifyParams = new esri.tasks.IdentifyParameters();	
       
        identifyParams.returnGeometry = true;
        identifyParams.tolerance = 1;
        identifyParams.mapExtent = new esri.geometry.Extent(7600793.3140665, 639807.32018124, 7686119.41017921, 704484.822413567, new esri.SpatialReference({ wkid: 102726 }));		
	},
	
	function()//tearDown
	{
		identifyTask = null;
		identifyParams = null;
	}
);
