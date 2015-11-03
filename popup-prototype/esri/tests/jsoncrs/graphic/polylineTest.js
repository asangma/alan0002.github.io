dojo.provide("esri.tests.jsoncrs.graphic.polylineTest");


var polylineGraphicJson, polylineGraphic;
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
doh.registerGroup("jsoncrs.graphic.polylineTest", [{
    name: "testToJson",
    timeout: 3000,
    runTest: function(t){
      console.log(dojo.toJson(polylineGraphic.toJSON()));
		var json = polylineGraphic.toJSON();
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

    polylineGraphicJson = {
        
        "symbol": {
            "color": [0, 0, 0, 255],
            "width": 1,
            "type": "esriSLS",
            "style": "esriSLSSolid"
        }
    };
    
    
    polylineGraphic = new esri.Graphic(polylineGraphicJson);
    
    
}, function()//tearDown
{
    polylineGraphic = null;
});
