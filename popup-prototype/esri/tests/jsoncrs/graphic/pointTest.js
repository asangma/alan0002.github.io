dojo.provide("esri.tests.jsoncrs.graphic.pointTest");


var pointGraphicJson, pointGraphic;
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
doh.registerGroup("jsoncrs.graphic.pointTest", [ {
    name: "testToJson",
    timeout: 3000,
    runTest: function(t){
        console.log(dojo.toJson(pointGraphic.toJSON()));
		var json = pointGraphic.toJSON();
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

    pointGraphicJson = {
        
        "attributes": {
            "XCoord": -104.4140625,
            "YCoord": 69.2578125,
            "Plant": "Mesa Mint"
        },
        "symbol": {
            "color": [255, 0, 0, 128],
            "size": 12,
            "angle": 0,
            "xoffset": 0,
            "yoffset": 0,
            "type": "esriSMS",
            "style": "esriSMSSquare",
            "outline": {
                "color": [0, 0, 0, 255],
                "width": 1,
                "type": "esriSLS",
                "style": "esriSLSSolid"
            }
        },
        "infoTemplate": {
            "title": "Vernal Pool Locations",
            "content": "Latitude: ${YCoord} <br/>Longitude: ${XCoord} <br/> Plant Name:${Plant}"
        }
    };
    
    pointGraphic = new esri.Graphic(pointGraphicJson);
    
    
}, function()//tearDown
{
    pointGraphic = null;
});
