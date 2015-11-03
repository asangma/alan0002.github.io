dojo.provide("esri.tests.jsoncrs.symbol.pictureMarkerSymbolImageDataTest");


var pictureMarkerSymbolImageDataJson, pictureMarkerSymbolImageData;
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
doh.registerGroup("jsoncrs.symbol.pictureMarkerSymbolImageDataTest", [{
    name: "testToJson",
    timeout: 3000,
    runTest: function(t){
		console.log(dojo.toJson(pictureMarkerSymbolImageData.toJSON()));
        var json = pictureMarkerSymbolImageData.toJSON();
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

    pictureMarkerSymbolImageDataJson = {
	"type" : "esriPMS", 
	"url" : "471E7E31", 
	/**
	"imageData" : "iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAYAAACpSkzOAAAAAXNSR0IB2cksfwAAAAlwSFlzAAAOxAAADsQBlSsOGwAAAMNJREFUSIntlcENwyAMRZ+lSMyQFcI8rJA50jWyQuahKzCDT+6h0EuL1BA1iip8Qg/Ex99fYuCkGv5bKK0EcB40YgSE7bnTxsa58LeOnMd0QhwGXkxB3L0w0IDxPaMqpBFxjLMuaSVmRjurWIcRDHxaiWZuEbRcEhpZpSNhE9O81GiMN5E0ZRt2M0iVjshek8UkTQfZy8JqGHYP/rJhODD4T6wehtbB9zD0MPQwlOphaAxD/uPLK7Z8MB5gFet+WKcJPQDx29XkRhqr/AAAAABJRU5ErkJggg==", 
	"contentType" : "image/png", 
	"color" : null, 
	"width" : 19.5, 
	"height" : 19.5, 
	"angle" : 0, 
	"xoffset" : 0, 
	"yoffset" : 0
	**/
};

    pictureMarkerSymbolImageData = new esri.symbol.PictureMarkerSymbol(pictureMarkerSymbolImageDataJson);
    
    
}, function()//tearDown
{
    pictureMarkerSymbolImageData = null;
});
