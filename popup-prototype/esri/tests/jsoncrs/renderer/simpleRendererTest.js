dojo.provide("esri.tests.jsoncrs.renderer.simpleRendererTest");


var simpleRendererJson, simpleRenderer;
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
doh.registerGroup("jsoncrs.renderer.simpleRendererTest", [ {
    name: "testToJson",
    timeout: 3000,
    runTest: function(t){
        console.log(dojo.toJson(simpleRenderer.toJSON()));
       	var json = simpleRenderer.toJSON();
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
}], function()//setUp()
{

    simpleRendererJson = {
        /**"type": "simple",
        "symbol": {
            "type": "esriSMS",
            "style": "esriSMSCircle",
            "color": [255, 0, 0, 255],
            "size": 5,
            "angle": 0,
            "xoffset": 0,
            "yoffset": 0,
            "outline": {
                "color": [0, 0, 0, 255],
                "width": 1
            }
        },**/
        /**"label": "Test SimpleRenderer",**/
        "description": "This is for testing."
    };
    simpleRenderer = new esri.renderer.SimpleRenderer(simpleRendererJson);
    
    
}, function()//tearDown
{
    simpleRenderer = null;
});
