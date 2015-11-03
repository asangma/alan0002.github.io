dojo.provide("esri.tests.jsoncrs.geometry.wkid.multipointTest");


var  multipoint;
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

doh.registerGroup("jsoncrs.geometry.wkid.multipointTest", [{
	name: "testToJson",
	timeout: 3000,
	runTest: function(t){
		console.log(dojo.toJson(multipoint.toJSON()));
		var json = multipoint.toJSON();
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
    
	
	multipoint = new esri.geometry.Multipoint(new esri.SpatialReference({wkid:4326}));
   	multipoint.points =[[null,null],[]];
    
}, function()//tearDown
{
    multipoint = null;
});
