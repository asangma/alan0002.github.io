dojo.provide("esri.tests.tasks.locator.addressCandidateTest");

dojo.require("esri.tasks.locator");

var locator = null;

doh.registerGroup("tasks.locator.addressCandidateTest",
	[
		{
			name: "testAddress",
			timeout: 3000,
			runTest: function(t)
			{
				var points = [];							
				 
				var address = 
				{
					address: "7485 SW SCHOLLS FERRY RD",
					city: "BEAVERTON",
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
					t.assertEqual(address.zip, candidates[126].address);
					return candidates;
			     }
								
				locator.addressToLocations(address, null, dCallback);				

				return d;
			}
		},
        {
            name: "testLocation",
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
                    var point = 
                        {
                            "x": -122.811813,
                            "y": 45.49236
                        };					

					t.assertEqual(dojo.toJson(point), dojo.toJson(candidates[126].location.toJSON()));
                    return candidates;
                }
                             
                locator.addressToLocations(address, null, dCallback);               

                return d;
            }
        },
        {
            name: "testScore",
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
                    t.assertEqual(100, candidates[127].score);
                    return candidates;
                }
                
                locator.addressToLocations(address, null, dCallback);               

                return d;
            }
        }       		
	],
		
	function()//setUp()
	{
		locator = new esri.tasks.Locator("http://sampleserver1.arcgisonline.com/ArcGIS/rest/services/Locators/ESRI_Geocode_USA/GeocodeServer");
	},
	
	function()//tearDown
	{
		locator = null;
	}
);
