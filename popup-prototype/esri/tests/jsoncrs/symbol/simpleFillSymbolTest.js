dojo.provide("esri.tests.jsoncrs.symbol.simpleFillSymbolTest");


var simpleFillSymbolJson, simpleFillSymbol;
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
doh.registerGroup("jsoncrs.symbol.simpleFillSymbolTest", [{
    name: "testToJson",
    timeout: 3000,
    runTest: function(t){
        console.log(dojo.toJson(simpleFillSymbol.toJSON()));
        var json = simpleFillSymbol.toJSON();
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

    simpleFillSymbolJson = {
        "type": "esriSFS",
        "style": "esriSFSSolid",
		/**
        "color": [115, 76, 0, 255],
        "outline": {
            "type": "esriSLS",
            "style": "esriSLSSolid",
            "color": [110, 110, 110, 255],
            "width": 1
        }
        **/
    };
    simpleFillSymbol = new esri.symbol.SimpleFillSymbol(simpleFillSymbolJson);
    
    
}, function()//tearDown
{
    simpleFillSymbol = null;
});
