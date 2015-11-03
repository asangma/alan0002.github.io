dojo.provide("esri.tests.json.geometry.wkid.extentTest");


var extentJson, extent;
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

doh.registerGroup("json.geometry.wkid.extentTest", [{
    name: "testExtent",
    timeout: 3000,
    runTest: function(t){
        
		t.assertEqual(4326,extent.spatialReference.wkid);
		t.assertEqual("extent",extent.type);
		t.assertEqual(-109.55,extent.xmin);
		t.assertEqual(25.76,extent.ymin);
		t.assertEqual(-86.39,extent.xmax);
		t.assertEqual(49.94,extent.ymax);
		
    }
	
},{
	name: "testToJson",
	timeout: 3000,
	runTest: function(t){
		t.assertEqual(extentJson, extent.toJSON());

        //added undefined test
        var json = extent.toJSON();
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
    
	extentJson = {"xmin" : -109.55, "ymin" : 25.76, "xmax" : -86.39, "ymax" : 49.94,
	"spatialReference" : {"wkid" : 4326}
	};
	extent = new esri.geometry.Extent(extentJson);
   
    
}, function()//tearDown
{
    extent = null;
});
