dojo.provide("esri.tests.json.renderer.simpleRendererTest");


var simpleRendererJson, simpleRenderer;
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
doh.registerGroup("json.renderer.simpleRendererTest", [{
    name: "testSimpleRenderer",
    timeout: 3000,
    runTest: function(t){
        t.assertEqual("Test SimpleRenderer", simpleRenderer.label);
        t.assertEqual("This is for testing.", simpleRenderer.description);
        var symbol = simpleRenderer.symbol;
        t.assertEqual(symbol.type, "esriSMS");
        t.assertEqual(symbol.angle, 0);
        t.assertEqual(symbol.style, "esriSMSCircle");
        t.assertEqual(dojox.gfx.pt2px(5), symbol.size);
        t.assertEqual(0, symbol.xoffset);
        t.assertEqual(0, symbol.yoffset);
        t.assertEqual(255, symbol.color.r);
        t.assertEqual(0, symbol.color.g);
        t.assertEqual(0, symbol.color.b);
        t.assertEqual(255 / 255, symbol.color.a);
		t.assertEqual(dojox.gfx.pt2px(1),symbol.outline.width);
		t.assertEqual(0,symbol.outline.color.r);
		t.assertEqual(0,symbol.outline.color.g);
		t.assertEqual(0,symbol.outline.color.b);
		t.assertEqual(255/255,symbol.outline.color.a);
              
        
    },

}, {
    name: "testToJson",
    timeout: 3000,
    runTest: function(t){
        console.log(dojo.toJson(simpleRenderer.toJSON()));
        t.assertEqual(simpleRendererJson, simpleRenderer.toJSON());

        //added undefined test
        var json = simpleRenderer.toJSON();
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

    simpleRendererJson = {
        "type": "simple",
        "symbol": {
            "type": "esriSMS",
            "style": "esriSMSCircle",
            "color": [255, 0, 0, 255],
            "size": 5,
            "angle": 0,
            "xoffset": 0,
            "yoffset": 0,
            "outline": {
                "color": [0, 0, 0, 255],
                "width": 1
            }
        },
        "label": "Test SimpleRenderer",
        "description": "This is for testing."
    };
    simpleRenderer = new esri.renderer.SimpleRenderer(simpleRendererJson);
    
    
}, function()//tearDown
{
    simpleRenderer = null;
});
