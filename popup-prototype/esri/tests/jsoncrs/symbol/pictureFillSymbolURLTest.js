dojo.provide("esri.tests.jsoncrs.symbol.pictureFillSymbolURLTest");


var pictureFillSymbolURLJson, pictureFillSymbolURL;
function hasUndefined(queue){

    var obj = queue.shift(), value;
    
    if (dojo.isArray(obj)) {
        for (var i = 0; i < obj.length; i++) {
            value = obj[i];
            console.log("value in array:" + value);
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
            console.log("value in object:" + value);
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

doh.registerGroup("jsoncrs.symbol.pictureFillSymbolURLTest", [{
    name: "testToJson",
    timeout: 3000,
    runTest: function(t){
        console.log(dojo.toJson(pictureFillSymbolURL.toJSON()));
        var json = pictureFillSymbolURL.toJSON();
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

    pictureFillSymbolURLJson = {        
         "type" : "esriPFS",
         "url" : "866880A0",
         "imageData" : "testOnly",
         "contentType" : "image/png",
		 /**
         "color" : null,
         "outline" :
         {
         "type" : "esriSLS",
         "style" : "esriSLSSolid",
         "color" : [110,110,110,255],
         "width" : 1
         },
         "width" : 63,
         "height" : 63,
         "angle" : 0,
         "xoffset" : 0,
         "yoffset" : 0,
         "xscale" : 1,
         "yscale" : **/
    };
    
    
    pictureFillSymbolURL = new esri.symbol.PictureFillSymbol(pictureFillSymbolURLJson);
    
    
}, function()//tearDown
{
    pictureFillSymbolURL = null;
    
});
