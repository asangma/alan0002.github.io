dojo.provide("esri.tests.tasks.locator.geocodeAddressCandidateTest");

dojo.require("esri.tasks.locator");

var locator,address, expectedCandidate;

//this is testing AddressCandidate class

doh.registerGroup("tasks.locator.geocodeAddressCandidateTest",
	[
		{
			name: "address",
			timeout: 3000,
			runTest: function(t)
			{
			
				
				var d = new doh.Deferred();
									
				function showResults(candidates)
				
				{
					console.log(candidate);
					if(candidates==null|| candidates.length == 0)
					{
						t.assertTrue(false);						
					}
					else
					{
						
         					var candidate = candidates[0];
							t.assertEqual(expectedCandidate.address,candidate.address); 
         								
					}
					d.callback(true);
				}
				locator.addressToLocations(address, ["StreetName","User_fld"],showResults);				
				return d;
			}
		},
		
		{
			name: "location",
			timeout: 3000,
			runTest: function(t)
			{
				
				
				var d = new doh.Deferred();
									
				function showResults(candidates)
				{
					if(candidates==null|| candidates.length == 0)
					{
						t.assertTrue(false);						
					}
					else
					{
						
         					var candidate = candidates[0];
         					t.assertEqual(expectedCandidate.location.x+","+expectedCandidate.location.y,candidate.location.x+","+candidate.location.y);
         					
						
					}
					d.callback(true);
				}
				
				
				locator.addressToLocations(address, ["StreetName","User_fld"],showResults);				

				return d;
			}
		},
		{
			name: "score",
			timeout: 3000,
			runTest: function(t)
			{
				
				
				var d = new doh.Deferred();
									
				function showResults(candidates)
				{
					if(candidates==null|| candidates.length == 0)
					{
						t.assertTrue(false);						
					}
					else
					{
						
         					var candidate = candidates[0];
         					t.assertEqual(expectedCandidate.score,candidate.score);
         				
						
					}
					d.callback(true);
				}
				
				
				locator.addressToLocations(address, ["StreetName","User_fld"],showResults);				
				return d;
			}
		},
		{
			name: "attributes",
			timeout: 3000,
			runTest: function(t)
			{
								
				var d = new doh.Deferred();
									
				function showResults(candidates)
				{
					if(candidates==null|| candidates.length == 0)
					{
						t.assertTrue(false);						
					}
					else
					{
						
         					var candidate = candidates[0];
         					t.assertEqual(dojo.toJson(expectedCandidate.attributes),dojo.toJson(candidate.attributes));
						
					}
					d.callback(true);
				}
				
				
				locator.addressToLocations(address, ["StreetName","User_fld"],showResults);				

				return d;
			}
		}			
	],
	function()//setUp()
    {
        //initialize locator
        locator = new esri.tasks.Locator("http://servery/ArcGIS/rest/services/California/Street/GeocodeServer");
		expectedCandidate = {
            "address": "380 New York St, Redlands, CA 92373",
            "location": {
                "type": "point",
                "x": -117.19568260875207,
                "y": 34.05759391430058,
                "spatialReference": {
                    "wkt": "GEOGCS[\"Lat Long WGS84\",DATUM[\"D_WGS_1984\",SPHEROID[\"WGS_1984\",6378137.0,298.257223563]],PRIMEM[\"Greenwich\",0.0],UNIT[\"Degree\",0.0174532925199433]]",
                    "wkid": null,
                    "_info": {
                        "102113": {
                            "wkTemplate": "PROJCS[\"WGS_1984_Web_Mercator\",GEOGCS[\"GCS_WGS_1984_Major_Auxiliary_Sphere\",DATUM[\"D_WGS_1984_Major_Auxiliary_Sphere\",SPHEROID[\"WGS_1984_Major_Auxiliary_Sphere\",6378137.0,0.0]],PRIMEM[\"Greenwich\",0.0],UNIT[\"Degree\",0.0174532925199433]],PROJECTION[\"Mercator\"],PARAMETER[\"False_Easting\",0.0],PARAMETER[\"False_Northing\",0.0],PARAMETER[\"Central_Meridian\",${Central_Meridian}],PARAMETER[\"Standard_Parallel_1\",0.0],UNIT[\"Meter\",1.0]]",
                            "valid": [-20037508.342788905, 20037508.342788905],
                            "origin": [-20037508.342787, 20037508.342787]
                        },
                        "102100": {
                            "wkTemplate": "PROJCS[\"WGS_1984_Web_Mercator_Auxiliary_Sphere\",GEOGCS[\"GCS_WGS_1984\",DATUM[\"D_WGS_1984\",SPHEROID[\"WGS_1984\",6378137.0,298.257223563]],PRIMEM[\"Greenwich\",0.0],UNIT[\"Degree\",0.0174532925199433]],PROJECTION[\"Mercator_Auxiliary_Sphere\"],PARAMETER[\"False_Easting\",0.0],PARAMETER[\"False_Northing\",0.0],PARAMETER[\"Central_Meridian\",${Central_Meridian}],PARAMETER[\"Standard_Parallel_1\",0.0],PARAMETER[\"Auxiliary_Sphere_Type\",0.0],UNIT[\"Meter\",1.0]]",
                            "valid": [-20037508.342788905, 20037508.342788905],
                            "origin": [-20037508.342787, 20037508.342787]
                        },
                        "3857": {
                            "wkTemplate": "PROJCS[\"WGS_1984_Web_Mercator_Auxiliary_Sphere\",GEOGCS[\"GCS_WGS_1984\",DATUM[\"D_WGS_1984\",SPHEROID[\"WGS_1984\",6378137.0,298.257223563]],PRIMEM[\"Greenwich\",0.0],UNIT[\"Degree\",0.0174532925199433]],PROJECTION[\"Mercator_Auxiliary_Sphere\"],PARAMETER[\"False_Easting\",0.0],PARAMETER[\"False_Northing\",0.0],PARAMETER[\"Central_Meridian\",${Central_Meridian}],PARAMETER[\"Standard_Parallel_1\",0.0],PARAMETER[\"Auxiliary_Sphere_Type\",0.0],UNIT[\"Meter\",1.0]]",
                            "valid": [-20037508.342788905, 20037508.342788905],
                            "origin": [-20037508.342787, 20037508.342787]
                        },
                        "4326": {
                            "wkTemplate": "GEOGCS[\"GCS_WGS_1984\",DATUM[\"D_WGS_1984\",SPHEROID[\"WGS_1984\",6378137.0,298.257223563]],PRIMEM[\"Greenwich\",${Central_Meridian}],UNIT[\"Degree\",0.0174532925199433]]",
                            "altTemplate": "PROJCS[\"WGS_1984_Plate_Carree\",GEOGCS[\"GCS_WGS_1984\",DATUM[\"D_WGS_1984\",SPHEROID[\"WGS_1984\",6378137.0,298.257223563]],PRIMEM[\"Greenwich\",0.0],UNIT[\"Degree\",0.0174532925199433]],PROJECTION[\"Plate_Carree\"],PARAMETER[\"False_Easting\",0.0],PARAMETER[\"False_Northing\",0.0],PARAMETER[\"Central_Meridian\",${Central_Meridian}],UNIT[\"Degrees\",111319.491]]",
                            "valid": [-180, 180],
                            "origin": [-180, 180]
                        }
                    },
                    "declaredClass": "esri.SpatialReference"
                },
                "declaredClass": "esri.geometry.Point"
            },
            "score": 100,
            "attributes": {
                "StreetName": "New York",
                "User_fld": "0"
            },
            "declaredClass": "esri.tasks.AddressCandidate"
        };
        
		address = {				
            street: "380 New York Street",
            city: "Redlands",
            state: "CA",
            zip: "92373"
        };
    },
    
    function()//tearDown
    {
        locator = null;
    }
);
