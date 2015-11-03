dojo.provide("esri.tests.json.graphic.polygonTest");


var polygonGraphicJson, polygonGraphic;
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
doh.registerGroup("json.graphic.polygonTest", [{
    name: "testpolygon",
    timeout: 3000,
    runTest: function(t){
    
        t.assertEqual(4326, polygonGraphic.geometry.spatialReference.wkid);
        t.assertEqual("polygon", polygonGraphic.geometry.type);
        
        t.assertEqual(1, polygonGraphic.geometry.paths.length);
        t.assertEqual(-91.40625, polygonGraphic.geometry.getPoint(0, 0).x);
        t.assertEqual(6.328125, polygonGraphic.geometry.getPoint(0, 0).y);
        t.assertEqual(0, polygonGraphic.symbol.color.r);
        t.assertEqual(0, polygonGraphic.symbol.color.g);
        t.assertEqual(0, polygonGraphic.symbol.color.b);
        t.assertEqual(255 / 255, polygonGraphic.symbol.color.a);
        t.assertEqual(dojox.gfx.pt2px(1), polygonGraphic.symbol.width);
        t.assertEqual("esriSLS", polygonGraphic.symbol.type);
        t.assertEqual("esriSLSSolid", polygonGraphic.symbol.style);
        
        
    }

}, {
    name: "testToJson",
    timeout: 3000,
    runTest: function(t){
        t.assertEqual(polygonGraphicJson, polygonGraphic.toJSON());

        //added undefined test
        var json = polygonGraphic.toJSON();
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

    polygonGraphicJson = {
        "geometry": {
            "rings": [[[-115.3125, 37.96875], [-111.4453125, 37.96875], [-99.84375, 36.2109375], [-99.84375, 23.90625], [-116.015625, 24.609375], [-115.3125, 37.96875]]],
            "spatialReference": {
                "wkid": 4326
            }
        },
        "symbol": {
            "color": [0, 0, 0, 64],
            "outline": {
                "color": [0, 0, 0, 255],
                "width": 1,
                "type": "esriSLS",
                "style": "esriSLSSolid"
            },
            "type": "esriSFS",
            "style": "esriSFSSolid"
        }
    };
    
    
    polygonGraphic = new esri.Graphic(polygonGraphicJson);
    
    
}, function()//tearDown
{
    polygonGraphic = null;
});
