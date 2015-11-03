dojo.provide("esri.tests.tasks.locator.setOutSpaticalRefTest");

dojo.require("esri.tasks.locator");

var locator;
doh.registerGroup("tasks.locator.setOutSpaticalRefTest",
	[
		{
			name: "geocode_setOutSpaticalRef",
			timeout: 3000,
			runTest: function(t)
			{
				var address = 
				{
					street: "380 New York Street",
					city: "Redlands",
					state: "CA",
					zip: "92373"
				};
				
				
				var d = new doh.Deferred();
									
				function showResults(candidates)
				{
					
					if(candidates==null|| candidates.length == 0)
					{
						t.assertTrue(false);						
					}
					else
					{
						t.assertEqual("http://servery/ArcGIS/rest/services/California/Street/GeocodeServer",locator.url);
						t.assertEqual(32662,locator.outSpatialReference.wkid);
					}
					
					d.callback(true);
				}
				
				
				locator.addressToLocations(address, ["StreetName","User_fld"],showResults);				

				return d;
			}
		},
		
		
		{
			name: "reverseGeocode_setOutSpaticalRef",
			timeout: 3000,
			runTest: function(t)
			{
				var location = new esri.geometry.Point(-117.19568260875207, 34.057593914300583);
				
				
				var d = new doh.Deferred();
									
				function showResults(address)
				{  
					if(address==null|| address.length == 0)
					{
						t.assertTrue(false);						
					}
					else
					{
						t.assertEqual("http://servery/ArcGIS/rest/services/California/Street/GeocodeServer",locator.url);
						t.assertEqual(32662,locator.outSpatialReference.wkid);
					}
					
					d.callback(true);
				}
				
				
				locator.locationToAddress(location, 2, showResults);				

				return d;
			}
		}
		
	],
	function()//setUp()
    {
        //initialize locator
        locator = new esri.tasks.Locator("http://servery/ArcGIS/rest/services/California/Street/GeocodeServer");	
		locator.setOutSpatialReference(new esri.SpatialReference({wkid:32662}));			
    },
    
    function()//tearDown
    {
        locator = null;
    }
);

