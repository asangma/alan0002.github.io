dojo.provide("esri.tests.json.symbol.simpleFillSymbolTest");


var simpleFillSymbolJson, simpleFillSymbol;
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
doh.registerGroup("json.symbol.simpleFillSymbolTest", [{
    name: "testSimpleFillSymbol",
    timeout: 3000,
    runTest: function(t){
    
        t.assertEqual("esriSFS", simpleFillSymbol.type);
		t.assertEqual("esriSFSSolid", simpleFillSymbol.style);
        t.assertEqual(115, simpleFillSymbol.color.r);
        t.assertEqual(76, simpleFillSymbol.color.g);
        t.assertEqual(0, simpleFillSymbol.color.b);
        t.assertEqual(255/255, simpleFillSymbol.color.a);
		t.assertEqual("solid",simpleFillSymbol.outline.style);
		t.assertEqual(dojox.gfx.pt2px(1),simpleFillSymbol.outline.width);
		t.assertEqual(110,simpleFillSymbol.outline.color.r);
		t.assertEqual(110,simpleFillSymbol.outline.color.g);
		t.assertEqual(110,simpleFillSymbol.outline.color.b);
		t.assertEqual(255/255,simpleFillSymbol.outline.color.a);
		t.assertEqual("esriSLS",simpleFillSymbol.outline.type);
		
	      
        
        
    }

}, {
    name: "testToJson",
    timeout: 3000,
    runTest: function(t){
       
        t.assertEqual(simpleFillSymbolJson, simpleFillSymbol.toJSON());
        //added undefined test
        var json = simpleFillSymbol.toJSON();
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

    simpleFillSymbolJson = {
        "type": "esriSFS",
        "style": "esriSFSSolid",
        "color": [115, 76, 0, 255],
        "outline": {
            "type": "esriSLS",
            "style": "esriSLSSolid",
            "color": [110, 110, 110, 255],
            "width": 1
        }
    };
    simpleFillSymbol = new esri.symbol.SimpleFillSymbol(simpleFillSymbolJson);
    
    
}, function()//tearDown
{
    simpleFillSymbol = null;
});
