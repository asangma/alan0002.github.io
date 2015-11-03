dojo.provide("esri.tests.tasks.find.findResultTest");

dojo.require("esri.tasks.find");  

var frFindTask, frFindParameters;

var frSRJson = 
    {
	   "wkid": 102726
    }
	
doh.registerGroup("tasks.find.findResultTest",
	[
		{
			name: "testLayerId",
			timeout: 3000,
			runTest: function(t)
			{			
				var d = new doh.Deferred();			
				d.addCallback(showResults);
				
				function dCallback(findResults) 
				{
					d.callback(findResults);
				}
							
				function showResults(findResults) 
				{
					t.assertEqual(3, findResults[0].layerId);
					return findResults;
				}
				
				frFindTask.execute(frFindParameters, dCallback);																				 
				return d;

			}
		},
        {
            name: "testLayerName",
            timeout: 3000,
            runTest: function(t)
            {           
                var d = new doh.Deferred();         
                d.addCallback(showResults);
                
                function dCallback(findResults) 
                {
                    d.callback(findResults);
                }
                            
                function showResults(findResults) 
                {
                    t.assertEqual("Houses", findResults[0].layerName);
                    return findResults;
                }
                
                frFindTask.execute(frFindParameters, dCallback);                                                                                 
                return d;

            }
        },
        {
            name: "testDisplayFieldName",
            timeout: 3000,
            runTest: function(t)
            {           
                var d = new doh.Deferred();         
                d.addCallback(showResults);
                
                function dCallback(findResults) 
                {
                    d.callback(findResults);
                }
                            
                function showResults(findResults) 
                {
                    t.assertEqual("Name", findResults[0].displayFieldName);
                    return findResults;
                }
                
                frFindTask.execute(frFindParameters, dCallback);                                                                                 
                return d;

            }
        },
        {
            name: "testFoundFieldName",
            timeout: 3000,
            runTest: function(t)
            {           
                var d = new doh.Deferred();         
                d.addCallback(showResults);
                
                function dCallback(findResults) 
                {
                    d.callback(findResults);
                }
                            
                function showResults(findResults) 
                {
                    t.assertEqual("DISTRICT", findResults[0].foundFieldName);
                    return findResults;					
                }
                
                frFindTask.execute(frFindParameters, dCallback);                                                                                 
                return d;

            }
        },
        {
            name: "testFeature",
            timeout: 3000,
            runTest: function(t)
            {           
                var d = new doh.Deferred();         
                d.addCallback(showResults);
                
                function dCallback(findResults) 
                {
                    d.callback(findResults);
                }
                            
                function showResults(findResults) 
                {
                    var featureJson = 
                        {
                            "attributes": 
                                {
                                    "FID": "28",
                                    "Shape": "Point",
                                    "AREA": "0",
                                    "NAME": "Cedar Mill ES",
                                    "ADDRESS": "10265 NW Cornell Rd",
                                    "CITY": "Portland",
                                    "STATE": "OR",
                                    "ZIPCODE": "97229",
                                    "DISTRICT": "Beaverton",
                                    "PHONE": "591 4546",
                                    "DIST_NO": "48J",
                                    "LEVEL_NO": "1",
                                    "LEVEL": "Elementary School",
                                    "TYPE": "Public"
                                }
                        };
                    t.assertEqual(dojo.toJson(featureJson), dojo.toJson(findResults[0].feature.toJSON()));
                    return findResults;
                }
                
                frFindTask.execute(frFindParameters, dCallback);                                                                                 
                return d;

            }
        }		
	],
		
	function()//setUp()
	{
		frFindTask = new esri.tasks.FindTask("http://servery/arcgis/rest/services/Portland/PortlandMap/MapServer");
		
		frFindParameters = new esri.tasks.FindParameters();
        frFindParameters.contains = false;
        frFindParameters.returnGeometry = false;
        frFindParameters.layerIds = [3];//houses layer
        frFindParameters.searchFields = ["DISTRICT"];
        frFindParameters.searchText = "Beaverton";
        frFindParameters.outSpatialReference = new esri.SpatialReference(frSRJson);;				
	},
	
	function()//tearDown
	{
		frFindTask = null;
	}
);
