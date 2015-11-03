dojo.provide("esri.tests.jsoncrs.geometry.wkid.polylineSinglePathTest");


var  polyline;
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

doh.registerGroup("jsoncrs.geometry.wkid.polylineSinglePathTest", [{
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
    
	
	polyline = new esri.geometry.Polyline(new esri.SpatialReference({wkid:4326}));
	polyline.addPath([[null,45.53], [,],  [null,null],[-122.53,45.60]]);
   
    
}, function()//tearDown
{
    polyline = null;
});
