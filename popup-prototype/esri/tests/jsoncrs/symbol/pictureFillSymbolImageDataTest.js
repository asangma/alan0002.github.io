dojo.provide("esri.tests.jsoncrs.symbol.pictureFillSymbolImageDataTest");


var pictureFillSymbolImageDataJson, pictureFillSymbolImageData;
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
doh.registerGroup("jsoncrs.symbol.pictureFillSymbolImageDataTest", [{
    name: "testToJson",
    timeout: 3000,
    runTest: function(t){
        console.log(dojo.toJson(pictureFillSymbolImageData.toJSON()));
        var json = pictureFillSymbolImageData.toJSON();
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

    pictureFillSymbolImageDataJson = {
        "type": "esriPFS",
        "url": "866880A0",
		/**
        "imageData": "iVBORw0KGgoAAAANSUhEUgAAAFQAAABUCAYAAAAcaxDBAAAAAXNSR0IB2cksfwAAAAlwSFlzAAAOxAAADsQBlSsOGwAAAM9JREFUeJzt0EEJADAMwMA96l/zTBwUSk5ByLxQsx1wTUOxhmINxRqKNRRrKNZQrKFYQ7GGYg3FGoo1FGso1lCsoVhDsYZiDcUaijUUayjWUKyhWEOxhmINxRqKNRRrKNZQrKFYQ7GGYg3FGoo1FGso1lCsoVhDsYZiDcUaijUUayjWUKyhWEOxhmINxRqKNRRrKNZQrKFYQ7GGYg3FGoo1FGso1lCsoVhDsYZiDcUaijUUayjWUKyhWEOxhmINxRqKNRRrKNZQrKFYQ7GGYh/hIwFRFpnZNAAAAABJRU5ErkJggg==",
        "contentType": "image/png",
        "color": null,
        "outline": {
            "type": "esriSLS",
            "style": "esriSLSSolid",
            "color": [110, 110, 110, 255],
            "width": 1
        },
        "width": 63,
        "height": 63,
        "angle": 0,
        "xoffset": 0,
        "yoffset": 0,
        "xscale": 1,
        "yscale": 1
        **/
    };
    
    
    pictureFillSymbolImageData = new esri.symbol.PictureFillSymbol(pictureFillSymbolImageDataJson);
    
    
}, function()//tearDown
{
    pictureFillSymbolImageData = null;
    
});
