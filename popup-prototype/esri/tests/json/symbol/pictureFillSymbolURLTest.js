dojo.provide("esri.tests.json.symbol.pictureFillSymbolURLTest");


var pictureFillSymbolURLJson, pictureFillSymbolURL;
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
                console.log(prop+"_"+dojo.toJson(value));
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
doh.registerGroup("json.symbol.pictureFillSymbolURLTest", [{
    name: "testPictureFillSymbolURL",
    timeout: 3000,
    runTest: function(t){
		t.assertEqual(dojox.gfx.pt2px(63),pictureFillSymbolURL.height);
		t.assertEqual(dojox.gfx.pt2px(63),pictureFillSymbolURL.width);
		t.assertEqual("866880A0",pictureFillSymbolURL.url);
		t.assertEqual(0,pictureFillSymbolURL.angle);
		t.assertEqual(0,pictureFillSymbolURL.xoffset);
		t.assertEqual(0,pictureFillSymbolURL.yoffset);
		t.assertEqual(1,pictureFillSymbolURL.xscale);
		t.assertEqual(1,pictureFillSymbolURL.yscale);
		
		t.assertEqual("esriPFS",pictureFillSymbolURL.type);
		t.assertEqual(null,pictureFillSymbolURL.color);
		t.assertEqual("solid",pictureFillSymbolURL.outline.style);
		t.assertEqual(dojox.gfx.pt2px(1),pictureFillSymbolURL.outline.width);
		t.assertEqual(110,pictureFillSymbolURL.outline.color.r);
		t.assertEqual(110,pictureFillSymbolURL.outline.color.g);
		t.assertEqual(110,pictureFillSymbolURL.outline.color.b);
		t.assertEqual(255/255,pictureFillSymbolURL.outline.color.a);
		t.assertEqual("esriSLS",pictureFillSymbolURL.outline.type);
		
				
        
    }

}, {
    name: "testToJson",
    timeout: 3000,
    runTest: function(t){
		console.log(dojo.toJson(pictureFillSymbolURL.toJSON()));
        t.assertEqual(pictureFillSymbolURLJson, pictureFillSymbolURL.toJSON());

        //added undefined test
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
        console.log(found);
        t.assertFalse(found);
    }
}], function()//setUp()
{

    pictureFillSymbolURLJson = {
	"type" : "esriPFS", 
	"url" : "866880A0", 
	"imageData" : "testOnly", 
	"contentType" : "image/png", 
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
	"yscale" : 1
  };


    pictureFillSymbolURL = new esri.symbol.PictureFillSymbol(pictureFillSymbolURLJson);
    
    
}, function()//tearDown
{
    pictureFillSymbolURL = null;
	
});
