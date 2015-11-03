dojo.provide("esri.tests.json.symbol.pictureFillSymbolImageDataTest");


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
doh.registerGroup("json.symbol.pictureFillSymbolImageDataTest", [{
    name: "testPictureFillSymbolImageData",
    timeout: 3000,
    runTest: function(t){
        t.assertEqual(dojox.gfx.pt2px(63), pictureFillSymbolImageData.height);
        t.assertEqual(dojox.gfx.pt2px(63), pictureFillSymbolImageData.width);
        t.assertEqual("866880A0",pictureFillSymbolImageData.url);
        t.assertEqual(0, pictureFillSymbolImageData.angle);
        t.assertEqual(0, pictureFillSymbolImageData.xoffset);
        t.assertEqual(0, pictureFillSymbolImageData.yoffset);
        t.assertEqual(1, pictureFillSymbolImageData.xscale);
        t.assertEqual(1, pictureFillSymbolImageData.yscale);
       
        t.assertEqual("esriPFS",pictureFillSymbolImageData.type);
        t.assertEqual(null, pictureFillSymbolImageData.color);
        t.assertEqual("solid", pictureFillSymbolImageData.outline.style);
        t.assertEqual(dojox.gfx.pt2px(1), pictureFillSymbolImageData.outline.width);
        t.assertEqual(110, pictureFillSymbolImageData.outline.color.r);
        t.assertEqual(110, pictureFillSymbolImageData.outline.color.g);
        t.assertEqual(110, pictureFillSymbolImageData.outline.color.b);
        t.assertEqual(255 / 255, pictureFillSymbolImageData.outline.color.a);
        t.assertEqual("esriSLS", pictureFillSymbolImageData.outline.type);
        
        
        
    }

}, {
    name: "testToJson",
    timeout: 3000,
    runTest: function(t){
        console.log(dojo.toJson(pictureFillSymbolImageData.toJSON()));
        t.assertEqual(pictureFillSymbolImageDataJson, pictureFillSymbolImageData.toJSON());

        //added undefined test
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
        console.log(found);
        t.assertFalse(found);
    }
}], function()//setUp()
{

    pictureFillSymbolImageDataJson = {
        "type": "esriPFS",
        "url": "866880A0",
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
    };
    
    
    pictureFillSymbolImageData = new esri.symbol.PictureFillSymbol(pictureFillSymbolImageDataJson);
    
    
}, function()//tearDown
{
    pictureFillSymbolImageData = null;
    
});
