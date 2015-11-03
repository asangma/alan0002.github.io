dojo.provide("esri.tests.json.geometry.wkid.polygonMultiRingsTest");


var polygonJson, polygon;
function hasUndefined(queue){

    var obj = queue.shift(), value;

    if (dojo.isArray(obj)) {
        for (var i = 0; i < obj.length; i++) {
            value = obj[i];
            console.log("value in array:"+value);
            if (value === undefined) {

                return true;
            }
            else
            if (dojo.isObject(value)) {
                queue.push(value);

            }
        }
    }
    else { // assumed object
        for (var prop in obj) {
            value = obj[prop];
            console.log("value in object:"+value);
            if (value === undefined) {
                console.log(prop+"_"+dojo.toJson(value));
                return true;
            }
            else
            if (dojo.isObject(value)) {
                queue.push(value);
            }
        }
    }

    return false;
}
doh.registerGroup("json.geometry.wkid.polygonMultiRingsTest", [{
    name: "testPolygon",
    timeout: 3000,
    runTest: function(t){
        t.assertEqual(2, polygon.rings.length);
		t.assertEqual(-97.06138,polygon.getPoint(0,0).x);
		t.assertEqual(32.837,polygon.getPoint(0,0).y);
		t.assertEqual(4326,polygon.spatialReference.wkid);
		t.assertEqual("polygon",polygon.type);
    },
	
},{
	name: "testToJson",
	timeout: 3000,
	runTest: function(t){
		t.assertEqual(polygonJson, polygon.toJSON());

        //added undefined test
        var json = polygon.toJSON();
        var q = [json], found = false;

        do {
            found = hasUndefined(q);
        }
        while (!found && q.length > 0);

        if (found) {
            console.error("Test Failed");
        }
        else {
            console.info("Test Passed");
        }
        console.log(found);
        t.assertFalse(found);
	}
} ], 


function()//setUp()
{
    
	polygonJson = {
        "rings": [[[-97.06138, 32.837], [-97.06133, 32.836], [-97.06124, 32.834], 
		[-97.06127, 32.832], [-97.06138, 32.837]], [[-97.06326, 32.759], [-97.06298, 32.755], 
		[-97.06153, 32.749], [-97.06326, 32.759]]],
        "spatialReference": {
            "wkid": 4326
        }
	
    };
	polygon = new esri.geometry.Polygon(polygonJson);
   
    
}, function()//tearDown
{
    polygon = null;
});
