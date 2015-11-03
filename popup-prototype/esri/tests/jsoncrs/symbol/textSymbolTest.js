dojo.provide("esri.tests.jsoncrs.symbol.textSymbolTest");


var textSymbolJson, textSymbol;
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
doh.registerGroup("jsoncrs.symbol.textSymbolTest", [{
    name: "testToJson",
    timeout: 3000,
    runTest: function(t){
        console.log(dojo.toJson(textSymbol.toJSON()));
        var json = textSymbol.toJSON();
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

    textSymbolJson = {/**
        "type": "esriTS",
        "color": [78, 78, 78, 255],
        "backgroundColor": null,
        "borderLineColor": null,
        "verticalAlignment": "bottom",
        "horizontalAlignment": "left",
        "rightToLeft": false,
        "angle": 0,
        "xoffset": 0,
        "yoffset": 0,
        "font": {
            "family": "Arial",
            "size": 12,
            "style": "normal",
            "weight": "bold",
            "decoration": "none"
        }**/
    };
    textSymbol = new esri.symbol.TextSymbol(textSymbolJson);
    
    
}, function()//tearDown
{
    textSymbol = null;
});
