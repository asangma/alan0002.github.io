dojo.provide("esri.tests.json.renderer.classBreaksRendererTest");


var classBreaksRendererJson, classBreaksRenderer;
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
doh.registerGroup("json.renderer.classBreaksRendererTest", [{
    name: "testClassBreaksRenderer",
    timeout: 3000,
    runTest: function(t){
        
        t.assertEqual("Shape.area", classBreaksRenderer.attributeField);
        t.assertEqual([[10.3906320193541, 1000], [1000, 5000]], classBreaksRenderer.breaks);
		t.assertEqual("10.0 - 1000.000000", infos.label);
        t.assertEqual("10 to 1000", infos.description);
      
        var infos = classBreaksRenderer.infos[0];
		
		t.assertEqual(10.3906320193541, infos.minValue);
		t.assertEqual(1000, infos.maxValue);
		var symbol = infos.symbol;
        t.assertEqual("esriSFS", symbol.type);
		t.assertEqual("esriSFSSolid", symbol.style);
		t.assertEqual(236, symbol.color.r);
        t.assertEqual(252, symbol.color.g);
        t.assertEqual(204, symbol.color.b);
        t.assertEqual(255 / 255, symbol.color.a);
		t.assertEqual(dojox.gfx.pt2px(0.4),symbol.outline.width);
		t.assertEqual(110,symbol.outline.color.r);
		t.assertEqual(110,symbol.outline.color.g);
		t.assertEqual(110,symbol.outline.color.b);
		t.assertEqual(255/255,symbol.outline.color.a);
        
        
    },

}, {
    name: "testToJson",
    timeout: 3000,
    runTest: function(t){
        console.log(dojo.toJson(classBreaksRenderer.toJSON()));
        t.assertEqual(classBreaksRendererJson, classBreaksRenderer.toJSON());

        //added undefined test
        var json = classBreaksRenderer.toJSON();
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

    classBreaksRendererJson = {
        "type": "classBreaks",
        "field": "Shape.area",
        "minValue": 10.3906320193541,
        "classBreakInfos": [{
            "classMaxValue": 1000,
            "label": "10.0 - 1000.000000",
            "description": "10 to 1000",
            "symbol": {
                "type": "esriSFS",
                "style": "esriSFSSolid",
                
                "color": [236, 252, 204, 255],
                "outline": {
                    "type": "esriSLS",
                    "style": "esriSLSSolid",
                    
                    "color": [110, 110, 110, 255],
                    "width": 0.4
                }
            }
        }, {
            "classMaxValue": 5000,
            "label": "1000.000001 - 5000.000000",
            "description": "1000 to 5000",
            "symbol": {
                "type": "esriSFS",
                "style": "esriSFSSolid",
                
                "color": [218, 240, 158, 255],
                "outline": {
                    "type": "esriSLS",
                    "style": "esriSLSSolid",
                    
                    "color": [110, 110, 110, 255],
                    "width": 0.4
                }
            }
        }]
    };
    classBreaksRenderer = new esri.renderer.ClassBreaksRenderer(classBreaksRendererJson);
    
    
}, function()//tearDown
{
    classBreaksRenderer = null;
});
