dojo.provide("esri.tests.json.featurecollection.arcgisonline.deleteTest");

dojo.require("esri.layers.FeatureLayer");
var featureCollectionUrl, token, _url, re, itemDataUrl;

doh.registerGroup("json.featurecollection.arcgisonline.deleteTest", [{
    name: "delete",
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
				var graphics = featureLayer.graphics;
				var graphic = graphics[0];
				console.log("..."+graphics.length);
				console.log(graphic);
				
				
				
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
