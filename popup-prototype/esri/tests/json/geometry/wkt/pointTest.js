dojo.provide("esri.tests.json.geometry.wkt.pointTest");


var pointJson, point;
doh.registerGroup("json.geometry.wkt.pointTest", [{
    name: "testPoint",
    timeout: 3000,
    runTest: function(t){
        
		t.assertEqual("GEOGCS[\"GCS_WGS_1984\",DATUM[\"D_WGS_1984\",SPHEROID[\"WGS_1984\",6378137,298.257223563]],PRIMEM[\"Greenwich\",0],UNIT[\"Degree\",0.017453292519943295]]",point.spatialReference.wkt);
		t.assertEqual("point",point.type);
		t.assertEqual(-118.15,point.x);
		t.assertEqual(33.80,point.y);
		
    },
	
},{
	name: "testToJson",
	timeout: 3000,
	runTest: function(t){
		t.assertEqual(pointJson, point.toJSON());
	}
} ], 


function()//setUp()
{
    
	pointJson = {"x" : -118.15, "y" : 33.80, "spatialReference" : {"wkt" : "GEOGCS[\"GCS_WGS_1984\",DATUM[\"D_WGS_1984\",SPHEROID[\"WGS_1984\",6378137,298.257223563]],PRIMEM[\"Greenwich\",0],UNIT[\"Degree\",0.017453292519943295]]"}
    };
	point = new esri.geometry.Point(pointJson);
   
    
}, function()//tearDown
{
    point = null;
});
