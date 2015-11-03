dojo.provide("esri.tests.json.geometry.wkid.pointTest");


var pointJson, point;
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
doh.registerGroup("json.geometry.wkid.pointTest", [{
    name: "testPoint",
    timeout: 3000,
    runTest: function(t){
        
		t.assertEqual(4326,point.spatialReference.wkid);
		t.assertEqual("point",point.type);
		t.assertEqual(-118.15,point.x);
		t.assertEqual(33.80,point.y);
		
    }
	
},{
	name: "testToJson",
	timeout: 3000,
	runTest: function(t){
		t.assertEqual(pointJson, point.toJSON());

        //added undefined test
        var json = point.toJSON();
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
    
	pointJson = {"x" : -118.15, "y" : 33.80, "spatialReference" : {"wkid" : 4326}
    };
	point = new esri.geometry.Point(pointJson);
   
    
}, function()//tearDown
{
    point = null;
});
