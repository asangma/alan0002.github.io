dojo.provide("esri.tests.jsoncrs.graphic.multiPointTest");


var multiPointGraphicJson, multiPointGraphic;
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
doh.registerGroup("jsoncrs.graphic.multiPointTest", [ {
    name: "testToJson",
    timeout: 3000,
    runTest: function(t){
		console.log(dojo.toJson(multiPointGraphic.toJSON()));
       	var json = multiPointGraphic.toJSON();
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

    multiPointGraphicJson = {
        
        "symbol": {
            "color": [255, 255, 255, 64],
            "size": 12,
            "angle": 0,
            "xoffset": 0,
            "yoffset": 0,
            "type": "esriSMS",
            "style": "esriSMSCircle",
            "outline": {
                "color": [0, 0, 0, 255],
                "width": 1,
                "type": "esriSLS",
                "style": "esriSLSSolid"
            }
        }
    };
    
    
    multiPointGraphic = new esri.Graphic(multiPointGraphicJson);
    
    
}, function()//tearDown
{
    multiPointGraphic = null;
});
