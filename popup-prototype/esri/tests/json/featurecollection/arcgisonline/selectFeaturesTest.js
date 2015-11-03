dojo.provide("esri.tests.json.featurecollection.arcgisonline.selectFeaturesTest");

dojo.require("esri.layers.FeatureLayer");
var featureCollectionUrl, token, _url, re, itemDataUrl,query;

doh.registerGroup("json.featurecollection.arcgisonline.selectFeaturesTest", [{
    name: "queryFeatures",
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
				console.log(featureLayer.objectIdField);
				console.log(featureLayer.geometryType);
				console.log(query);
				featureLayer.selectFeatures(query, esri.layers.FeatureLayer.SELECTION_NEW,function(response){
					console.log(response);
				});

				
				
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
    
    var extent = new esri.geometry.Extent({"xmin":-95.27533799747107,"ymin":38.93402305294585,"xmax":-95.21525651553748,"ymax":38.97693839718413,"spatialReference":{"wkid":4326}});
    query = new esri.tasks.Query();
    query.geometry = extent;

    
    
    
    
    
    
}, function()//tearDown
{

});
