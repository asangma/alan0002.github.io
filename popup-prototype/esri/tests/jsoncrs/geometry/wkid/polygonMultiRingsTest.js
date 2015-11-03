dojo.provide("esri.tests.jsoncrs.geometry.wkid.polygonMultiRingsTest");


var polygon;
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
doh.registerGroup("jsoncrs.geometry.wkid.polygonMultiRingsTest", [{
	name: "testToJson",
	timeout: 3000,
	runTest: function(t){
		console.log(dojo.toJson(polygon.toJSON()));
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
		t.assertFalse(found);
	}
} ], 


function()//setUp()
{
    	
	polygon = new esri.geometry.Polygon(new esri.SpatialReference({wkid:4326}));
   	polygon.addRing([[[null, 32.837], [null, null], [, 32.834], 
		[,], []], [[-97.06326, 32.759], [-97.06298, 32.755], 
		[-97.06153, 32.749], [-97.06326, 32.759]]]);
   
    
}, function()//tearDown
{
    polygon = null;
});
