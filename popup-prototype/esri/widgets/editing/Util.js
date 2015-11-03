define(
[
    "dojo/_base/lang", 
    "dojo/_base/array", 
    "dojo/has", 
    "../../kernel"
], function(
    lang, array, has, esriKernel
) {
    var util = {};
    util = {
        findFeatures : function(ids, layer, callback){
            var oidFld   = layer.objectIdField;
            var graphics = layer.graphics;
            var features = array.filter(graphics, function(graphic){
                return array.some(ids, function(id){
                    return graphic.attributes[oidFld] === id.objectId;
                });
            });        
            if (callback){
                callback(features);
            } else {        
                return features;
            }
        },

        getSelection : function(layers) {
            var selectedFeatures = [];                    
            array.forEach(layers, function(layer){            
                var selection = layer.getSelectedFeatures();                        
                array.forEach(selection, function(feature){
                    selectedFeatures.push(feature);       
                });            
            });        
            return selectedFeatures;             
        }
    };

    

    // return util.LayerHelper;
    return util;
});
