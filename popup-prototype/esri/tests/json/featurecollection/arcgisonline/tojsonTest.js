dojo.provide("esri.tests.json.featurecollection.arcgisonline.tojsonTest");

dojo.require("esri.layers.FeatureLayer");
var featureCollectionUrl, token, _url, re, itemDataUrl;

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
doh.registerGroup("json.featurecollection.arcgisonline.tojsonTest", [{
    name: "testToJson",
    timeout: 3000,
    runTest: function(t){
    
        esri.request({
            url: itemDataUrl,
            content: {
                f: "json",
                token: token
            },
            callbackParamName: "callback",
            load: function(response){
                
                var featureCollectionJson = response;
                var featureLayer = new esri.layers.FeatureLayer(featureCollectionJson);

				
				console.log("featureset1:"+featureCollectionJson.featureSet.features.length);
				console.log("featureset2:"+featureLayer.toJSON().featureSet.features.length);
				t.assertEqual(featureCollectionJson.featureSet.features.length,featureLayer.toJSON().featureSet.features.length);
				t.assertEqual(dojo.toJson(featureCollectionJson.layerDefinition),dojo.toJson(featureLayer.toJSON().layerDefinition));
                //t.assertEqual(dojo.toJson(featureCollectionJson),dojo.toJson(featureLayer.toJSON()));

                //added undefined test
                var q = [featureCollectionJson], found = false;

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
                t.assertFalse(found);
               
            },
            error: function(error){
                console.error("Unable to load data: ", error);
            }
        });
        
        
        
        
    }
}], function()//setUp()
{

    featureCollectionUrl = "http://dev.arcgisonline.com/sharing/content/users/gwtest4/28115d053966468ab7aa90955b3c02b7/items/d5546dfc902847e19cdbae7d4c1c92e7";
    //jsapibuild IP address based token
    token = "jW9BMx9vjK4UwMF0j7LDqdSJn8tuQ-OOIutTIPuhGRo2pmwLQLFb0jS-Kn9VCHqG";
    _url = esri.urlToObject(featureCollectionUrl);
     re = new RegExp("users\/" + "gwtest4" + "\/[^\/]+\/items", "i");
    itemDataUrl = _url.path.replace(re, "items") + "/data";
    
    
    
    
    
    
    
    
    
}, function()//tearDown
{

});
