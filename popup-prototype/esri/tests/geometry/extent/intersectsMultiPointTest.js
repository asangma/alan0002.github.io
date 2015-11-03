dojo.provide("esri.tests.geometry.extent.intersectsMultiPointTest");

dojo.require("esri.geometry");

var extent;
doh.registerGroup("geometry.extent.intersectsMultiPointTest", [
    {
		name: "WithinExtent",
		timeout: 5000,
		runTest: function(t){
			var multiPointJson ={"points":[[-108.19081321778887,40.47300091585376],[-97.53056464648849,40.62976927719641],[-97.84410136917379,34.045498100805],[-105.05544599093581,32.47781448737847]],"spatialReference":{"wkid":4326}};
			
			var multiPoint = new esri.geometry.Multipoint(multiPointJson);
			t.assertTrue(extent.intersects(multiPoint));
							
		}
	},
	{
		name: "onePointOnExtentLine",
		timeout: 5000,
		runTest: function(t){
			var multiPointJson ={"points":[[-87.49738952055871,28.24506873112685],[-93.45458725157951,34.515803184832954],[-87.96769460458667,20.093113941308907]],"spatialReference":{"wkid":4326}};
			var multiPoint = new esri.geometry.Multipoint(multiPointJson);
			t.assertTrue(extent.intersects(multiPoint));
							
		}
	},
	{
		name: "pointsOutSideExtent",
		timeout: 5000,
		runTest: function(t){
			var multiPointJson ={"points":[[-64.29567204184612,44.078673226734765],[-64.76597712587407,31.22366759663725],[-75.2694573358318,37.0240969663154],[-69.93933305018162,23.385249529504613],[-72.13409010897875,30.596594151266636]],"spatialReference":{"wkid":4326}};
			var multiPoint = new esri.geometry.Multipoint(multiPointJson);
			t.assertFalse(extent.intersects(multiPoint));
							
		}
	},
    ], function()//setUp()
{
    extent = new esri.geometry.Extent(-114.93185275552293,25.893543310987056,-87.34062115921606,46.11666192418925, new esri.SpatialReference({
        wkid: 4326
    }));
    
    
}, function()//tearDown
{
    extent = null;
    
}
	
	
	);

