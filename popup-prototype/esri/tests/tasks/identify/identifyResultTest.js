dojo.provide("esri.tests.tasks.identify.identifyResultTest");

dojo.require("esri.tasks.identify");  

var irIdentifyTask, irIdentifyParameters;

var irSRJson = 
    {
	   "wkid": 102726
    }
	
var irPointJson = 
    {
        "x": 7667299.00009452,
        "y": 691389.937552854,
        "spatialReference": 
            {
                "wkid": 102726
            }
    };	
	
doh.registerGroup("tasks.identify.identifyResultTest",
	[
		{
			name: "testLayerId",
			timeout: 3000,
			runTest: function(t)
			{			
				var d = new doh.Deferred();			
				d.addCallback(showResults);
				
				function dCallback(identifyResults) 
				{
					d.callback(identifyResults);
				}
							
				function showResults(identifyResults) 
				{
					t.assertEqual(3, identifyResults[0].layerId);
					return identifyResults;
				}
				
				irIdentifyTask.execute(irIdentifyParameters, dCallback);																				 
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
                
                function dCallback(identifyResults) 
                {
                    d.callback(identifyResults);
                }
                            
                function showResults(identifyResults) 
                {
                    t.assertEqual("Houses", identifyResults[0].layerName);
                    return identifyResults;
                }
                
                irIdentifyTask.execute(irIdentifyParameters, dCallback);                                                                                 
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
                
                function dCallback(identifyResults) 
                {
                    d.callback(identifyResults);
                }
                            
                function showResults(identifyResults) 
                {
                    t.assertEqual("NAME", identifyResults[0].displayFieldName);
                    return identifyResults;
                }
                
                irIdentifyTask.execute(irIdentifyParameters, dCallback);                                                                                 
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
                
                function dCallback(identifyResults) 
                {
                    d.callback(identifyResults);
                }
                            
                function showResults(identifyResults) 
                {
                    var featureJson = 
                        {
                            "attributes": 
                                {
                                    "FID": "1",
                                    "Shape": "Point",
                                    "AREA": "0",
                                    "NAME": "Gregory Heights MS",
                                    "ADDRESS": "7334 NE Siskiyou Street",
                                    "CITY": "Portland",
                                    "STATE": "OR",
                                    "ZIPCODE": "97213-5866",
                                    "DISTRICT": "Portland",
                                    "PHONE": "916 5600",
                                    "DIST_NO": "1J",
                                    "LEVEL_NO": "2",
                                    "LEVEL": "Middle or Jr. High School",
                                    "TYPE": "Public"
                                }
                        };
						
					console.log("dojo.toJson(featureJson): ");
					console.log(dojo.toJson(featureJson));
					console.log("dojo.toJson(identifyResults[0].feature.toJSON()): ");
					console.log(dojo.toJson(identifyResults[0].feature.toJSON()));
                    t.assertEqual(dojo.toJson(featureJson), dojo.toJson(identifyResults[0].feature.toJSON()));
                    return identifyResults;
                }
                
                irIdentifyTask.execute(irIdentifyParameters, dCallback);                                                                                 
                return d;

            }
        }		
	],
		
	function()//setUp()
	{
		irIdentifyTask = new esri.tasks.IdentifyTask("http://servery/arcgis/rest/services/Portland/PortlandMap/MapServer");
		
		irIdentifyParameters = new esri.tasks.IdentifyParameters();
		irIdentifyParameters.geometry = new esri.geometry.Point(irPointJson);
        irIdentifyParameters.spatialReference = new esri.SpatialReference(irSRJson);
        irIdentifyParameters.layerIds = [3];//houses layer
        irIdentifyParameters.tolerance = 1;	
        irIdentifyParameters.mapExtent = new esri.geometry.Extent(7600793.3140665, 639807.32018124, 7686119.41017921, 704484.822413567, new esri.SpatialReference({ wkid: 102726 }));     
        irIdentifyParameters.width = 3000;
        irIdentifyParameters.height = 2500;
        irIdentifyParameters.dpi = 96;
        irIdentifyParameters.layerOption = esri.tasks.IdentifyParameters.LAYER_OPTION_TOP;                    
	},
	
	function()//tearDown
	{
		irIdentifyTask = null;
		irIdentifyParameters = null;
	}
);
