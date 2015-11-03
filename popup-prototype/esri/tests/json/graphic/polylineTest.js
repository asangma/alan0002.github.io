dojo.provide("esri.tests.json.graphic.polylineTest");


var polylineGraphicJson, polylineGraphic;
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
doh.registerGroup("json.graphic.polylineTest", [{
    name: "testpolyline",
    timeout: 3000,
    runTest: function(t){
    
        t.assertEqual(4326, polylineGraphic.geometry.spatialReference.wkid);
        t.assertEqual("polyline", polylineGraphic.geometry.type);
       
		t.assertEqual(1,polylineGraphic.geometry.paths.length);
		t.assertEqual(-91.40625,polylineGraphic.geometry.getPoint(0,0).x);
		t.assertEqual(6.328125,polylineGraphic.geometry.getPoint(0,0).y);
        t.assertEqual(0,polylineGraphic.symbol.color.r);
	    t.assertEqual(0,polylineGraphic.symbol.color.g);
		t.assertEqual(0,polylineGraphic.symbol.color.b);
		t.assertEqual(255/255,polylineGraphic.symbol.color.a);
		t.assertEqual(dojox.gfx.pt2px(1),polylineGraphic.symbol.width);
		t.assertEqual("esriSLS",polylineGraphic.symbol.type);
		t.assertEqual("esriSLSSolid",polylineGraphic.symbol.style);
            
        
    }

}, {
    name: "testToJson",
    timeout: 3000,
    runTest: function(t){
        t.assertEqual(polylineGraphicJson, polylineGraphic.toJSON());

        //added undefined test
        var json = polylineGraphic.toJSON();
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

    polylineGraphicJson = {
        geometry: {
            "paths": [[[-91.40625, 6.328125], [6.328125, 19.3359375]]],
            "spatialReference": {
                "wkid": 4326
            }
        },
        "symbol": {
            "color": [0, 0, 0, 255],
            "width": 1,
            "type": "esriSLS",
            "style": "esriSLSSolid"
        }
    };
    
    
    polylineGraphic = new esri.Graphic(polylineGraphicJson);
    
    
}, function()//tearDown
{
    polylineGraphic = null;
});
