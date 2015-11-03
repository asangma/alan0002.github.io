dojo.provide("esri.tests.jsoncrs.symbol.pictureMarkerSymbolURLTest");


var pictureMarkerSymbolURLJson, pictureMarkerSymbolURL;
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
doh.registerGroup("jsoncrs.symbol.pictureMarkerSymbolURLTest", [ {
    name: "testToJson",
    timeout: 3000,
    runTest: function(t){
		console.log(dojo.toJson(pictureMarkerSymbolURL.toJSON()));
		
        var json = pictureMarkerSymbolURL.toJSON();
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

    pictureMarkerSymbolURLJson = {
	"type" : "esriPMS", 
	//"url" : "471E7E31",
	"imageData" : "testonly", 
	"contentType" : "image/png", 
	"color" : null, 
	"width" : 19.5, 
	"height" : 19.5, 
	"angle" : 0, 
	"xoffset" : 0, 
	"yoffset" : 0
};

    pictureMarkerSymbolURL = new esri.symbol.PictureMarkerSymbol(pictureMarkerSymbolURLJson);
    
    
}, function()//tearDown
{
    pictureMarkerSymbolURL = null;
});
