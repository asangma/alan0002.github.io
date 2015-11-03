dojo.provide("esri.tests.json.symbol.simpleMarkerSymbolTest");


var simpleMarkerSymbolJson, simpleMarkerSymbol;
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
doh.registerGroup("json.symbol.simpleMarkerSymbolTest", [{
    name: "testSimpleMarkerSymbol",
    timeout: 3000,
    runTest: function(t){
		
		t.assertEqual(0,simpleMarkerSymbol.angle);
		t.assertEqual(dojox.gfx.pt2px(8),simpleMarkerSymbol.size);
		t.assertEqual(0,simpleMarkerSymbol.xoffset);
		t.assertEqual(0,simpleMarkerSymbol.yoffset);
		t.assertEqual("esriSMS",simpleMarkerSymbol.type);
		t.assertEqual("square", simpleMarkerSymbol.style);
		t.assertEqual(76,simpleMarkerSymbol.color.r);
		t.assertEqual(115,simpleMarkerSymbol.color.g);
		t.assertEqual(0,simpleMarkerSymbol.color.b);
		t.assertEqual(255/255,simpleMarkerSymbol.color.a);
    	t.assertEqual("solid",simpleMarkerSymbol.outline.style);
		t.assertEqual(dojox.gfx.pt2px(1),simpleMarkerSymbol.outline.width);
		t.assertEqual(152,simpleMarkerSymbol.outline.color.r);
		t.assertEqual(230,simpleMarkerSymbol.outline.color.g);
		t.assertEqual(0,simpleMarkerSymbol.outline.color.b);
		t.assertEqual(255/255,simpleMarkerSymbol.color.a);
			
        t.assertEqual("",simpleMarkerSymbol.outline.type);
    
	        
    }

}, {
    name: "testToJson",
    timeout: 3000,
    runTest: function(t){
		console.log("lll"+dojo.toJson(simpleMarkerSymbol.toJSON()));
        t.assertEqual(simpleMarkerSymbolJson, simpleMarkerSymbol.toJSON());

        //added undefined test
        var json = simpleMarkerSymbol.toJSON();
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

    simpleMarkerSymbolJson = {
        "type": "esriSMS",
        "style": "esriSMSSquare",
        "color": [76, 115, 0, 255],
        "size": 8,
        "angle": 0,
        "xoffset": 0,
        "yoffset": 0,
        "outline": {
            "color": [152, 230, 0, 255],
            "width": 1
        }
    };
    simpleMarkerSymbol = new esri.symbol.SimpleMarkerSymbol(simpleMarkerSymbolJson);
    
    
}, function()//tearDown
{
    simpleMarkerSymbol = null;
});
