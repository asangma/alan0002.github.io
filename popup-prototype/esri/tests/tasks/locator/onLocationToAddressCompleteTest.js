dojo.provide("esri.tests.tasks.locator.onLocationToAddressCompleteTest");

dojo.require("esri.tasks.locator");

doh.registerGroup("tasks.locator.onLocationToAddressCompleteTest",
	[
		
		{
			name: "reverseGeocode",
			timeout: 3000,
			runTest: function(t)
			{
				var location = new esri.geometry.Point(-117.19568260875207, 34.057593914300583);
				
				var expectedResultJSON ={"address":{"Street":"381 New York St","City":"Redlands",
				"State":"CA","ZIP":"92373","Match_time":0},"location":{"x":-117.19568260881162,
				"y":34.057593914267962,"spatialReference":{"wkt":"GEOGCS[\"Lat Long WGS84\",DATUM[\"D_WGS_1984\",SPHEROID[\"WGS_1984\",6378137.0,298.257223563]],PRIMEM[\"Greenwich\",0.0],UNIT[\"Degree\",0.0174532925199433]]"}}};
				var expectedResultsAddress = expectedResultJSON.address; 
				var d = new doh.Deferred();
									
				function showResults(address)
				{  
					if(address==null)
					{   
						
						t.assertTrue(false);
											
					}
					else
					{	
						var candidateAddress = address.address;
         				t.assertEqual(dojo.toJson(expectedResultsAddress),dojo.toJson(candidateAddress));
					}					
					d.callback(true);
				}
				
				
				dojo.connect(locator,"onLocationToAddressComplete",showResults);
				locator.locationToAddress(location, 2);				

				return d;
			}
		}
		
	],
	function()//setUp()
    {
        //initialize locator
        locator = new esri.tasks.Locator("http://servery/ArcGIS/rest/services/California/Street/GeocodeServer");				
    },
    
    function()//tearDown
    {
        locator = null;
    }
);

