dojo.provide("esri.tests.tasks.locator.onAddressToLocationsCompleteTest");

dojo.require("esri.tasks.locator");

var locator;
doh.registerGroup("tasks.locator.onAddressToLocationsCompleteTest", [{
    name: "geocode",
    timeout: 3000,
    runTest: function(t){
        var address = {
            street: "380 New York Street",
            city: "Redlands",
            state: "CA",
            zip: "92373"
        };
        
        
        var expectedCandidate = {
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
        
        
        
        var d = new doh.Deferred();
        
        function showResults(candidates){
            
            if (candidates == null || candidates.length == 0) {
                t.assertTrue(false);
            }
            else {
            
                t.assertTrue(candidates.length > 0);
                var candidate = candidates[0];
                
                
                t.assertEqual(expectedCandidate.address, candidate.address);
                t.assertEqual(expectedCandidate.location.x + "," + expectedCandidate.location.y, candidate.location.x + "," + candidate.location.y);
                t.assertEqual(expectedCandidate.score, candidate.score);
                
                t.assertEqual(dojo.toJson(expectedCandidate.attributes), dojo.toJson(candidate.attributes));
                
                
            }
            
            d.callback(true);
        }
        dojo.connect(locator, "onAddressToLocationsComplete", showResults);
        locator.addressToLocations(address, ["StreetName", "User_fld"]);
        
        return d;
    }
}, ], function()//setUp()
{
    //initialize locator
    locator = new esri.tasks.Locator("http://servery/ArcGIS/rest/services/California/Street/GeocodeServer");
}, function()//tearDown
{
    locator = null;
});

