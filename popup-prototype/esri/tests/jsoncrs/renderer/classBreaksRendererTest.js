dojo.provide("esri.tests.jsoncrs.renderer.classBreaksRendererTest");


var classBreaksRendererJson, classBreaksRenderer;
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
doh.registerGroup("jsoncrs.renderer.classBreaksRendererTest", [{
    name: "testToJson",
    timeout: 3000,
    runTest: function(t){
        console.log(dojo.toJson(classBreaksRenderer.toJSON()));
        var json = classBreaksRenderer.toJSON();
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

    classBreaksRendererJson = {
        "type": "classBreaks",
        /**"field": "Shape.area",**/
        "minValue": 10.3906320193541,
        "classBreakInfos": [{
            "classMaxValue": 1000,
            "label": "10.0 - 1000.000000",
            "description": "10 to 1000",
            "symbol": {
                "type": "esriSFS",
                "style": "esriSFSSolid",
                
                "color": [236, 252, 204, 255],
                "outline": {
                    "type": "esriSLS",
                    "style": "esriSLSSolid",
                    
                    "color": [110, 110, 110, 255],
                    "width": 0.4
                }
            }
        }, {
            "classMaxValue": 5000,
            "label": "1000.000001 - 5000.000000",
            "description": "1000 to 5000",
            "symbol": {
                "type": "esriSFS",
                "style": "esriSFSSolid",
                
                "color": [218, 240, 158, 255],
                "outline": {
                    "type": "esriSLS",
                    "style": "esriSLSSolid",
                    
                    "color": [110, 110, 110, 255],
                    "width": 0.4
                }
            }
        }]
    };
    classBreaksRenderer = new esri.renderer.ClassBreaksRenderer(classBreaksRendererJson);
    
    
}, function()//tearDown
{
    classBreaksRenderer = null;
});
