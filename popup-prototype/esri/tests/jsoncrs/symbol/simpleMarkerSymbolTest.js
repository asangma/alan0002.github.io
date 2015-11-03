dojo.provide("esri.tests.jsoncrs.symbol.simpleMarkerSymbolTest");


var simpleMarkerSymbolJson, simpleMarkerSymbol;
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
            if (value === undefined)  {
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
doh.registerGroup("jsoncrs.symbol.simpleMarkerSymbolTest", [{
    name: "testToJson",
    timeout: 3000,
    runTest: function(t){
		console.log(dojo.toJson(simpleMarkerSymbol.toJSON()));
        var json = simpleMarkerSymbol.toJSON();
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

    simpleMarkerSymbolJson = {
        "type": "esriSMS",
        "style": "esriSMSSquare",
		/**
        "color": [76, 115, 0, 255],
        "size": 8,
        "angle": 0,
        "xoffset": 0,
        "yoffset": 0,
        "outline": {
            "color": [152, 230, 0, 255],
            "width": 1
        }
        **/
    };
    simpleMarkerSymbol = new esri.symbol.SimpleMarkerSymbol(simpleMarkerSymbolJson);
    
    
}, function()//tearDown
{
    simpleMarkerSymbol = null;
});
