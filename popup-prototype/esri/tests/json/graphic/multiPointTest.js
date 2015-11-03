dojo.provide("esri.tests.json.graphic.multiPointTest");


var multiPointGraphicJson, multiPointGraphic;
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
doh.registerGroup("json.graphic.multiPointTest", [{
    name: "testmultiPoint",
    timeout: 3000,
    runTest: function(t){
    
        t.assertEqual(4326, multiPointGraphic.geometry.spatialReference.wkid);
        t.assertEqual("multipoint", multiPointGraphic.geometry.type);
        t.assertEqual(-92.109375, multiPointGraphic.geometry.getPoint(0).x);
        t.assertEqual(44.296875, multiPointGraphic.geometry.getPoint(0).y);
        
        t.assertEqual(0, multiPointGraphic.symbol.xoffset);
        t.assertEqual(0, multiPointGraphic.symbol.yoffset);
        t.assertEqual("esriSMS", multiPointGraphic.symbol.type);
        t.assertEqual("circle", multiPointGraphic.symbol.style);
        t.assertEqual(255, multiPointGraphic.symbol.color.r);
        t.assertEqual(255, multiPointGraphic.symbol.color.g);
        t.assertEqual(255, multiPointGraphic.symbol.color.b);
        t.assertEqual(64 / 255, multiPointGraphic.symbol.color.a);
        t.assertEqual("solid", multiPointGraphic.symbol.outline.style);
        t.assertEqual(dojox.gfx.pt2px(1), multiPointGraphic.symbol.outline.width);
        t.assertEqual(0, multiPointGraphic.symbol.outline.color.r);
        t.assertEqual(0, multiPointGraphic.symbol.outline.color.g);
        t.assertEqual(0, multiPointGraphic.symbol.outline.color.b);
        t.assertEqual(255 / 255, multiPointGraphic.symbol.outline.color.a);
        
    }

}, {
    name: "testToJson",
    timeout: 3000,
    runTest: function(t){
		console.log(dojo.toJson(multiPointGraphic.toJSON()));
        t.assertEqual(multiPointGraphicJson, multiPointGraphic.toJSON());

        //added undefined test
        var json = multiPointGraphic.toJSON();
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

    multiPointGraphicJson = {
        "geometry": {
			"points": [[-92.109375, 44.296875], [-86.1328125, 31.9921875], [-73.4765625, 45.703125]],
			"spatialReference": {
				"wkid": 4326
			}
		},
        "symbol": {
            "color": [255, 255, 255, 64],
            "size": 12,
            "angle": 0,
            "xoffset": 0,
            "yoffset": 0,
            "type": "esriSMS",
            "style": "esriSMSCircle",
            "outline": {
                "color": [0, 0, 0, 255],
                "width": 1,
                "type": "esriSLS",
                "style": "esriSLSSolid"
            }
        }
    };
    
    
    multiPointGraphic = new esri.Graphic(multiPointGraphicJson);
    
    
}, function()//tearDown
{
    multiPointGraphic = null;
});
