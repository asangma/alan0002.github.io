dojo.provide("esri.tests.jsoncrs.geometry.wkid.polylineMultiPathsTest");


var polyline;
function hasUndefined(queue){
	
    var obj = queue.shift(), value;
	    
    if (dojo.isArray(obj)) {
        for (var i = 0; i < obj.length; i++) {
            value = obj[i];
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
			if (value === undefined) {
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

doh.registerGroup("jsoncrs.geometry.wkid.polylineMultiPathsTest", [{
	name: "testToJson",
	timeout: 3000,
	runTest: function(t){
		console.log(dojo.toJson(polyline.toJSON()));
		var json = polyline.toJSON();
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
		t.assertFalse(found);
	}
} ], 


function()//setUp()
{
    
	polylineJson = {"paths" : [[ [-97.06138,32.837], [-97.06133,32.836], [-97.06124,32.834], 
	[-97.06127,32.832] ],[ [-97.06326,32.759], [-97.06298,32.755] ]],
	"spatialReference" : {"wkid" : 4326}
	};
	polyline = new esri.geometry.Polyline(new esri.SpatialReference({wkid:4326}));
    polyline.addPath([[ [null,32.837], [], [-97.06124,32.834], 
	[,32.832] ],[ [null,null], [-97.06298,null] ]]);
    
}, function()//tearDown
{
    polyline = null;
});
