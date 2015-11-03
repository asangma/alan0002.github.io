dojo.provide("esri.tests.jsoncrs.renderer.uniqueValueRendererTest");


var uniqueValueRendererJson, uniqueValueRenderer;
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
doh.registerGroup("jsoncrs.renderer.uniqueValueRendererTest", [{
    name: "testToJson",
    timeout: 3000,
    runTest: function(t){
        console.log(dojo.toJson(uniqueValueRenderer.toJSON()));
       var json = uniqueValueRenderer.toJSON();
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

    uniqueValueRendererJson = {
        "type": "uniqueValue",
        "field1": "SubtypeCD",
        "field2": null,
        "field3": null,
        "fieldDelimiter": ", ",
        "defaultSymbol": {
            "type": "esriSLS",
            "style": "esriSLSSolid",
            
            "color": [130, 130, 130, 255],
            "width": 1
        },
        "defaultLabel": "\u003cOther values\u003e",
		/**
        "uniqueValueInfos": [{
            "value": "1",
            "label": "Duct Bank",
            "description": "Duct Bank description",
            "symbol": {
                "type": "esriSLS",
                "style": "esriSLSDash",
                
                "color": [76, 0, 163, 255],
                "width": 1
            }
        }, {
            "value": "2",
            "label": "Trench",
            "description": "Trench description",
            "symbol": {
                "type": "esriSLS",
                "style": "esriSLSDot",
                
                "color": [115, 76, 0, 255],
                "width": 1
            }
        }]**/
    };
    uniqueValueRenderer = new esri.renderer.UniqueValueRenderer(uniqueValueRendererJson);
    
    
}, function()//tearDown
{
    uniqueValueRenderer = null;
});
