dojo.provide("esri.tests.json.graphic.pointTest");


var pointGraphicJson, pointGraphic;
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
doh.registerGroup("json.graphic.pointTest", [{
    name: "testPoint",
    timeout: 3000,
    runTest: function(t){
    
        t.assertEqual(4326, pointGraphic.geometry.spatialReference.wkid);
        t.assertEqual("point", pointGraphic.geometry.type);
        t.assertEqual(-104.4140625, pointGraphic.geometry.x);
        t.assertEqual(69.2578125, pointGraphic.geometry.y);
		
		t.assertEqual( -104.4140625, pointGraphic.attributes.XCoord);
		t.assertEqual(69.2578125, pointGraphic.attributes.YCoord);
		t.assertEqual("Mesa Mint", pointGraphic.attributes.Plant);
		
		t.assertEqual("Latitude: ${YCoord} <br/>Longitude: ${XCoord} <br/> Plant Name:${Plant}", pointGraphic.infoTemplate.content);
		t.assertEqual("Vernal Pool Locations",pointGraphic.infoTemplate.title);
        
    }

}, {
    name: "testToJson",
    timeout: 3000,
    runTest: function(t){
        t.assertEqual(pointGraphicJson, pointGraphic.toJSON());

        //added undefined test
        var json = pointGraphic.toJSON();
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

    pointGraphicJson = {
        "geometry": {
            "x": -104.4140625,
            "y": 69.2578125,
            "spatialReference": {
                "wkid": 4326
            }
        },
        "attributes": {
            "XCoord": -104.4140625,
            "YCoord": 69.2578125,
            "Plant": "Mesa Mint"
        },
        "symbol": {
            "color": [255, 0, 0, 128],
            "size": 12,
            "angle": 0,
            "xoffset": 0,
            "yoffset": 0,
            "type": "esriSMS",
            "style": "esriSMSSquare",
            "outline": {
                "color": [0, 0, 0, 255],
                "width": 1,
                "type": "esriSLS",
                "style": "esriSLSSolid"
            }
        },
        "infoTemplate": {
            "title": "Vernal Pool Locations",
            "content": "Latitude: ${YCoord} <br/>Longitude: ${XCoord} <br/> Plant Name:${Plant}"
        }
    };
    
    pointGraphic = new esri.Graphic(pointGraphicJson);
    
    
}, function()//tearDown
{
    pointGraphic = null;
});
