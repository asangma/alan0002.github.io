dojo.provide("esri.tests.jsoncrs.graphic.polygonTest");


var polygonGraphicJson, polygonGraphic;
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
doh.registerGroup("jsoncrs.graphic.polygonTest", [{
    name: "testToJson",
    timeout: 3000,
    runTest: function(t){
        console.log(dojo.toJson(polygonGraphic.toJSON()));
		var json = polygonGraphic.toJSON();
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

    polygonGraphicJson = {
        
        "symbol": {
            "color": [0, 0, 0, 64],
            "outline": {
                "color": [0, 0, 0, 255],
                "width": 1,
                "type": "esriSLS",
                "style": "esriSLSSolid"
            },
            "type": "esriSFS",
            "style": "esriSFSSolid"
        }
    };
    
    
    polygonGraphic = new esri.Graphic(polygonGraphicJson);
    
    
}, function()//tearDown
{
    polygonGraphic = null;
});
