dojo.provide("esri.tests.tasks.locator.locatorTest");

dojo.require("esri.tasks.locator");

doh.registerGroup("tasks.locator.locatorTest",
	[
		{
			name: "testLocator",
			timeout: 3000,
			runTest: function(t)
			{
				var points = [];							
				 
				var address = 
				{
					address: "7485 SW Scholls Ferry Road",
					city: "Beaverton",
					state: "OR",
					zip: "97005"
				};
				
				var d = new doh.Deferred();
				d.addCallback(showResults);
				
				function dCallback(candidates)
				{
					d.callback(candidates);
				}
				
				function showResults(candidates)
				{
					if (candidates != null) 
					{
						t.assertEqual(candidates[26].location.x + ", " + candidates[26].location.y, "-122.83677, 45.4321840000001");
						t.assertEqual(candidates[27].location.x + ", " + candidates[27].location.y, "-122.838493, 45.4329760000001");
					}
					else 
					{
						t.assertTrue(false);						
					}
					
					return candidates;
				}
				
				var locator = new esri.tasks.Locator("http://sampleserver1.arcgisonline.com/ArcGIS/rest/services/Locators/ESRI_Geocode_USA/GeocodeServer");				
				locator.addressToLocations(address, null, dCallback);				

				return d;
			}
		}
	],
		
	function()//setUp()
	{
		
	},
	
	function()//tearDown
	{
		
	}
);

/*
 {
            name: "geocodeTest",
            timeout: 3000,
            runTest: function(t)
            {
                //query zoning layer
                var queryTask = new esri.tasks.QueryTask("http://orthogonal.esri.com/arcgis/rest/services/Portland/PortlandMap/MapServer/3");
                query = new esri.tasks.Query();
                query.returnGeometry = true;
                query.where = "NAME = 'McKay ES'";
                query.outFields = ["ADDRESS", "CITY", "STATE", "ZIPCODE"];
                
                var graphics = [];
                var result = true;
                queryTask.execute(query, function(featureSet)
                {
                    graphics = featureSet.features;
                    var attributes = graphics[0].attributes;                    
                                        
                    var address = 
                    {
                      address : attributes.ADDRESS,
                      city: attributes.CITY,
                      state: attributes.STATE,
                      zip: attributes.ZIPCODE
                    };
                    
                //  console.log("Locator Address: " + address.address + "," + address.city + "," + address.state + "," + address.zip);
                                                        
                    var d = new doh.Deferred();
                    d.addCallback(showResults);
                    
                    function dCallback(candidates)
                    {
                        d.callback(candidates);
                    }
                    
                    function showResults(candidates)
                    {
                        console.log("1: " + result);
                        if(candidates != null) 
                        {
                            //result = true;
                            console.log("1.5: " + result);
                            console.log(candidates[26].location.x + ", " + candidates[26].location.y);
                            console.log(candidates[27].location.x + ", " + candidates[27].location.y);
                            t.assertEqual("ad", "cd");
                            //t.assertEqual(candidates[26].location.x + ", " + candidates[26].location.y, "-122.83677, 45.4321840000009");
//                          alert(result);
//                          result = result & t.assertEqual(candidates[27].location, "esri.geometry.Point(-122.803997, 45.4868780000001)");
                            console.log(result);
                        }
                        else
                        {
                            console.log("1.6: " + result);
                            result = false;
                            
                        }
                        
                        console.log("2: " + result);
                        return results;
                    }
                    
                    var locator = new esri.tasks.Locator("http://sampleserver1.arcgisonline.com/ArcGIS/rest/services/Locators/ESRI_Geocode_USA/GeocodeServer");
                    locator.addressToLocations(address, dCallback);
                                            
                    return d;
                });
            }
        }
 */