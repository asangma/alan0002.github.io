dojo.provide("esri.tests.tasks.identify.identifyTaskTest");

dojo.require("esri.tasks.identify");  

var identifyTask, identifyParams;

/*function getPoint(whereClause)
{
	var point = "";
	var queryTask = new esri.tasks.QueryTask("http://servery/arcgis/rest/services/Portland/PortlandMap/MapServer/5");
	var query = new esri.tasks.Query();
	query.returnGeometry = true;								
	query.where = whereClause;
	queryTask.execute(query, function(results)
	{
		console.log(results.features.length + " " + results.geometryType);
      	var graphic = results.features[0];
		point = graphic.geometry;
	});
	
	console.log("point: " + point.x + ", " + point.y);
	return point;					
}*/

doh.registerGroup("tasks.identify.identifyTaskTest",
	[
		{
			name: "testPoint",
			timeout: 3000,
			runTest: function(t)
			{		
				var base = [];
				base.push("7617572, 664093.5625");
				
				//create input point
				var inputPoint = new esri.geometry.Point();
				inputPoint.x = 7617572.00013928;
				inputPoint.y = 664093.562355682;
				var spatRef = new esri.SpatialReference();
				spatRef.wkid = 102726;
				inputPoint.spatialReference = spatRef;
					
				identifyParams.geometry = inputPoint;
			    identifyParams.layerIds = [3];//houses layer
								
				var d = new doh.Deferred();			
				d.addCallback(showResults);
				
				function dCallback(results) 
				{
					d.callback(results);
				}
							
				function showResults(results) 
				{
					if(results == null || results.length == 0)
					{
				    	t.assertTrue(false);					
				    }
				    else
				    {			
				      	var graphic = results[0].feature;
						var point = graphic.geometry;
						t.assertEqual(base[0], point.x + ", " + point.y);
				    }
			        		        			
					return results;
				}
				
				identifyTask.execute(identifyParams, dCallback);	
																				 
				return d;
			}
		},
		{
			name: "testMultipoint",
			timeout: 3000,
			runTest: function(t)
			{
				var base = [];
				base.push("7653476.73271778, 666501.720862304");
				base.push("7653480.63057763, 666552.393040349");
				base.push("7653542.18743257, 666465.066271591");
				base.push("7653548.5032628, 666547.172064568");
				base.push("7653597.45185276, 666460.815162346");
				base.push("7653602.38289777, 666524.918747547");
								
				//get multipoint from map service
				var x = [7653476.7327916, 7653480.63042161, 7653542.18738511, 7653548.50331736, 7653597.45171027, 7653602.38280277];
				var y = [666501.720925182, 666552.393067941, 666465.066142857, 666547.171949774, 666460.815167099, 666524.918713436];
				
				//{"points":[[7653476.7327916, 666501.720925182], [7653480.63042161, 666552.393067941], [7653542.18738511, 666465.066142857], [7653548.50331736, 666547.171949774], [7653597.45171027, 666460.815167099], [7653602.38280277, 666524.918713436]]}				
				
				var multipoint = new esri.geometry.Multipoint();
				var spatRef = new esri.SpatialReference();
				spatRef.wkid = 102726;				
				for (var i = 0; i < x.length; i++) 
				{
					var point = new esri.geometry.Point();
					point.x = x[i];
					point.y = y[i];
					point.spatialReference = spatRef;
					
					multipoint.addPoint(point);
					point = null;
				}				
				
				multipoint.spatialReference = spatRef;		
				identifyParams.geometry = multipoint;
				identifyParams.layerIds = [2];//animals layer
				
				var d = new doh.Deferred();
				d.addCallback(showResults);
				function dCallback(results)
				{
					d.callback(results);
				}
				
				function showResults(results)
				{
					if (results == null || results.length == 0) 
					{
						console.log("results: " + results);
						t.assertTrue(false);//"NULL returned for results in test " + name, 
					}
					else 
					{
						var graphic = results[0].feature;
						var multipoint = graphic.geometry;
						var points = multipoint.points;
						for (var i = 0; i < points.length; i++) 
						{
							t.assertEqual(base[i], points[i][0] + ", " + points[i][1]);
						}
					}
					
					return results;
				}
				
				identifyTask.execute(identifyParams, dCallback);
				return d;
			}
		},
		{
			name: "testPolyline",
			timeout: 3000,
			runTest: function(t)
			{
				var base = [];
				base.push("7626510.82380721,647304.37949131");
				base.push("7626647.20977924,647555.428235463");
				base.push("7626627.09997149,647327.842766074");
				base.push("7626617.60555908,647381.64224105");
				base.push("7626623.93444285,647448.100513909");
				base.push("7626647.20977924,647555.428235463");
				
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
				d.addCallback(showResults);
				function dCallback(results)
				{
					d.callback(results);
				}
				
				function showResults(results)
				{
					if (results == null || results.length == 0) 
					{
						t.assertTrue(false);
					}
					else 
					{
						var graphic = results[0].feature;
						var polyline = graphic.geometry;
						var paths = polyline.paths;
						for (var i = 0; i < paths[0].length; i++) 
						{
							t.assertEqual(base[i], paths[0][i]);
						}
					}
					
					return results;
				}
				
				identifyTask.execute(identifyParams, dCallback);
				return d;
			}
		},
		{
			name: "testPolygon",
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
				
				//7655650.94405498,661388.116297908,
				//7655648.56904395,661338.366294196,
				//7655653.3190618,661338.428806773,
				//7655649.69404401,661239.866302252,
				//7655646.44402975,661191.366296098,
				//7655554.19368363,661192.991051527,
				//7655544.69365363,661341.553519015,
				//7655543.0686494,661391.9285122,
				//7655650.94405498,661388.116297908					
									
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
				d.addCallback(showResults);
				
				function dCallback(results) 
				{
					d.callback(results);
				}
							
				var testResult = false;
				function showResults(results) 
				{
					if(results == null || results.length == 0)
					{
				    	t.assertTrue(false);					
				    }
				    else
				    {		
			          	var graphic = results[2].feature;
						var polygon = graphic.geometry;								
						var rings = polygon.rings;
						
						for (var i = 0; i < rings[0].length; i++) 
						{
							//testResult = base[i]== rings[0][i];
							//console.log(rings[0][i]);
							//assertTrue();
						}
				    }
					return results;
				}				
				
				identifyTask.execute(identifyParams, dCallback);																				 
				return d;
			}
		}
	],
		
	function()//setUp()
	{
        identifyTask = new esri.tasks.IdentifyTask("http://servery/arcgis/rest/services/Portland/PortlandMap/MapServer");

		identifyParams = new esri.tasks.IdentifyParameters();	
        identifyParams.layerOption = esri.tasks.IdentifyParameters.LAYER_OPTION_TOP;
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