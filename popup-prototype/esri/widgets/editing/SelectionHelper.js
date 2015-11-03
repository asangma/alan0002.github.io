define(
[
  "dojo/_base/lang",
  "dojo/_base/connect",
  "dojo/_base/array",

  "../../core/declare",
  "../../core/promiseList",

  "../../geometry/Extent",
  "../../geometry/Point",
  "../../geometry/ScreenPoint",

  "../../layers/FeatureLayer",

  "../../tasks/support/Query"
],
function(
  lang, connect, array,
  declare, promiseList,
  Extent, Point, ScreenPoint,
  FeatureLayer,
  Query
) {
    var SH = declare(null, {
        declaredClass: "esri.widgets.editing.SelectionHelper",
        
        constructor: function(settings) {
            this._settings = settings || {};
            this._sConnects = [];
            this._mapServiceCount = 0;
            this._map = this._settings.map;
            this._tolerance = this._settings.singleSelectionTolerance;
            this._initMapServiceInfos(this._settings.layers);
        },
        
        destroy: function(){
            var conn;
            for(conn in this._sConnects){
                if (this._sConnects.hasOwnProperty(conn)){
                    connect.disconnect(this._sConnects[conn]);
                }
            }
        },

        selectFeatures : function(layers, query, selectionMethod, callback) {
            // Reset if doing a new selection
            if (selectionMethod === FeatureLayer.SELECTION_NEW){
                this._resetMapServiceInfos();
                this.getSelection(layers);
            }
            
            // Select features across layers
            var deferreds = [];
            array.forEach(layers,function(layer) {
              if (layer.visible === true && layer._isMapAtVisibleScale() === true){
                  var selMethod = selectionMethod;
                  if (layer._isSelOnly && selMethod === FeatureLayer.SELECTION_NEW){
                      selMethod = FeatureLayer.SELECTION_ADD;
                  }
                  deferreds.push(layer.selectFeatures(query, selMethod));
              }
            });
            promiseList(deferreds).then(lang.hitch(this, function(response) {
              var features = [];
              array.forEach(response, function(set, idx) {
                  array.forEach(set[1], function(feature) {
                    var objectId = feature.attributes[layers[idx].objectIdField];
                    feature = layers[idx]._mode._getFeature(objectId) || null;
                    if (feature){
                        features.push(feature);
                    }
                  }, this);
              }, this);

              if (!this._mapServiceCount){
                  callback(features);
                  return;
              }
              
              // Create layer definitions
              var subtract = selectionMethod === FeatureLayer.SELECTION_SUBTRACT;
              if (subtract){
                  this._resetMapServiceInfos();
                  this._createLayerDefs(this._getLayerInfosFromSelection(layers));
              } else {
                  this._createLayerDefs(this._getLayerInfosFromFeatures(features));
              }
              //Update layerDefs (for selection only layers)
              this._updateLayerDefs(this._mapServiceInfos, false, !((features && features.length) || subtract), lang.hitch(this, callback, features));
            }));
        },

        selectFeaturesByGeometry : function(layers, geometry, selectionMethod, callback) {
            var selGeom = geometry;
            if (geometry.declaredClass.indexOf("Extent") !== -1){
              if (geometry.xmax === geometry.xmin && geometry.ymax === geometry.ymin){
                  selGeom = new Point(geometry.xmax, geometry.ymax, geometry.spatialReference);
              }
            }
            selGeom = (selGeom.declaredClass.indexOf("Point") !== -1) ? this._extentFromPoint(selGeom) : selGeom;
            var query = new Query();
            query.geometry = selGeom;
            this.selectFeatures(layers, query, selectionMethod, callback);
        },

        clearSelection: function(doNotRefresh) {
            var nonSelOnlyLayers = this._nonSelOnlyLayers;
            array.forEach(nonSelOnlyLayers, function(item) {
              if ( item.clearSelection ) { 
                item.clearSelection(); 
              }
            });
            if (!this._mapServiceCount){ return; }
            this._resetMapServiceInfos();
            var lInfos = this._getLayerInfosFromSelection(this._settings.layers);
            var selection = array.some(lInfos, function(item) {
              return item.oids && item.oids.length;
            });
            if (selection){
                this._createLayerDefs(lInfos);
                this._updateLayerDefs(this._mapServiceInfos, true, doNotRefresh || false);
            }
        },

        findMapService: function (layer) {
            var map = this._map,
                layerIds = map.layerIds,
                layerUrl = (layer && layer._url) ? layer._url.path.toLowerCase() : "",
                mapService,
                layerId, tstUrl;
            
            for (layerId in layerIds) {
                if (layerIds.hasOwnProperty(layerId)){
                    mapService = map.getLayer(layerIds[layerId]);
                    tstUrl = mapService._url ? mapService._url.path.toLowerCase().replace("mapserver", "featureserver") : "";
                    
                    if (layerUrl.substr(0, tstUrl.length) === tstUrl && mapService.declaredClass === "esri.layers.ArcGISDynamicMapServiceLayer") {
                        return mapService;
                    }
                }
            }
        },
        
        getSelection: function(layers){
            var layerInfos = [];
            array.forEach(layers, function(layer){ 
              if (layer._isSelOnly){ 
                layerInfos.push(this._createLayerInfo(layer)); 
              }
            }, this);
            array.forEach(layerInfos, function(layerInfo){
                var mapServiceInfo = this._createMapServiceInfo(this.findMapService(layerInfo.layer));
                if (mapServiceInfo){ mapServiceInfo.layerInfos[layerInfo.layer.layerId] = layerInfo; }
            }, this);
        },

        //// Internal Methods
        _initMapServiceInfos: function(layers) {
            this._nonSelOnlyLayers = [];
            this._mapServiceInfos  = [];
             array.forEach(layers, function(layer){ 
               var mapServiceInfo = this.findMapService(layer);
               if (mapServiceInfo){
                   this._mapServiceCount++;
                   this._createMapServiceInfo(mapServiceInfo);
                   if (mapServiceInfo){ mapServiceInfo.setDisableClientCaching(true); }
               } else {
                   this._nonSelOnlyLayers.push(layer);
               }
             }, this);
        },

        _createMapServiceInfo: function(mapService){
            if (!mapService){ return null; }
            var mapServiceInfos = this._mapServiceInfos;
            var mapServiceInfo = mapServiceInfos[mapService.id];
            if (!mapServiceInfo) {
                mapServiceInfo = mapServiceInfos[mapService.id] = { mapService: mapService, layerInfos:[], layerDefs: lang.mixin([], mapService.layerDefinitions || []), origLayerDefs: lang.mixin([], mapService.layerDefinitions || []) };
            }
            return mapServiceInfo;
        },

        _resetMapServiceInfo: function(mapServiceInfo){
            array.forEach(mapServiceInfo.layerInfos, this._resetLayerInfo);
            mapServiceInfo.layerDefs = lang.mixin([], mapServiceInfo.origLayerDefs || []);
        },
        
        _resetMapServiceInfos: function() {
              var mapServiceInfos = this._mapServiceInfos,
                  mapServiceInfo;
              
              for (mapServiceInfo in mapServiceInfos){
                  if (mapServiceInfos.hasOwnProperty(mapServiceInfo)){
                      this._resetMapServiceInfo(mapServiceInfos[mapServiceInfo]);
                  }
              }
        },

        _createLayerInfo: function(layer, doNotSelect){
            var oidField = layer.objectIdField;
            var features = doNotSelect ? [] : layer.getSelectedFeatures();
            return { 
              layer: layer, 
              selectedFeatures: features || [], 
              oids: array.map(features, function(feature){ 
                return feature.attributes[oidField]; 
              }) 
            };
        },

        _resetLayerInfo: function(layerInfo){
            if (!layerInfo){ return; }
            layerInfo.selectedFeatures = [];
            layerInfo.oids = [];
        },

        _updateLayerDefs: function(mapServiceInfos, resetLayerDefs, doNotRefresh, callback){
            var mapServiceId;
            
            for (mapServiceId in mapServiceInfos){
                if (mapServiceInfos.hasOwnProperty(mapServiceId)){
                    var mapServiceInfo = mapServiceInfos[mapServiceId];
                    var mapService = mapServiceInfo.mapService;
                    var layerDefs = mapServiceInfo.layerDefs = (resetLayerDefs ? lang.mixin([], mapServiceInfo.origLayerDefs || []) : mapServiceInfo.layerDefs);
                    
                    if (layerDefs){
                        if (!doNotRefresh){
                            this._sConnects[mapService.id] = (connect.connect(mapService, "onUpdateEnd", lang.hitch(this, "_onMapServiceUpdate", mapServiceInfo, resetLayerDefs, callback)));
                        } else if (callback) { 
                            callback(); 
                        }
                        mapService.setLayerDefinitions(layerDefs, doNotRefresh || false);
                    } else if (callback){
                        callback();
                    }
                }
            }
        },

        _onMapServiceUpdate: function(mapServiceInfo, resetLayerDefs, callback){
            connect.disconnect(this._sConnects[mapServiceInfo.mapService.id]);
            array.forEach(mapServiceInfo.layerInfos, function(layerInfo){
              if (resetLayerDefs){
                if (layerInfo){ layerInfo.layer.clearSelection(); }
              } else {
                var query = new Query();
                query.objectIds = layerInfo ? layerInfo.oids : [];
                if (query.objectIds.length){
                    layerInfo.layer.selectFeatures(query, FeatureLayer.SELECTION_SUBTRACT);
                }
              }
            }, this);
            if (resetLayerDefs){
              this._resetMapServiceInfo(mapServiceInfo);
            }
            if (callback){
              callback();
            }
        },

        _createLayerDefs: function(layerInfos){
            array.forEach(layerInfos, function(layerInfo){
                var layer = layerInfo.layer;
                var mapServiceInfo = this._createMapServiceInfo(this.findMapService(layerInfo.layer));
                if (!mapServiceInfo){ return; }
                var mapService = mapServiceInfo.mapService;
                var layerDefs = mapServiceInfo.layerDefs;
                var oidFld = layer.objectIdField;
                var layerId = layer.layerId;
                var layerDef = "(\"" + oidFld +  "\" NOT IN (";
                var oids = layerInfo.oids;
                if (oids && oids.length){
                    array.forEach(layerInfo.oids, function(oid, idx){ 
                      oids = true; 
                      if (idx) { layerDef += ','; } 
                      layerDef += "'" + oid + "'"; 
                    });
                    layerDef += "))";
                    if (layerDefs.length && (layerDefs[layerId] && layerDefs[layerId].length)){
                        layerDefs[layerId] += " AND" + layerDef;
                    } else {
                        layerDefs[layerId] = layerDef;
                    }
              }
                
            }, this);
        },

        _getLayerInfosFromFeatures: function(features) {
            var layers = [];
            array.forEach(features, function(feature){
                var layer = feature.getLayer();
                if (layer && layer._isSelOnly){
                    if (!layers[layer.id]) { layers[layer.id] = this._createLayerInfo(layer, true); }
                    layers[layer.id].selectedFeatures.push(feature);
                    layers[layer.id].oids.push(feature.attributes[layer.objectIdField]);
                }
            }, this);
            
            var layerInfos = [], layerId;
            
            for (layerId in layers){
              if (layers.hasOwnProperty(layerId)){
                layerInfos.push(layers[layerId]);
              }
            }
            return layerInfos;
          },
          
          _getLayerInfosFromSelection: function(layers) {
            var layerInfos = [];
            array.forEach(layers, function(layer){
                if (layer._isSelOnly){
                  layerInfos.push(this._createLayerInfo(layer, false));
                }
            }, this);
            return layerInfos;
          },

        _extentFromPoint : function(geometry){
            var tolerance = this._tolerance;
            var map = this._map;
            //Get a screen point representing the selection point to apply the tolerance on
            var scrPnt = map.toScreen(geometry);

            //Calculate new extent to be passed to the server
            var pnt1 = new ScreenPoint(scrPnt.x - tolerance, scrPnt.y + tolerance);
            var pnt2 = new ScreenPoint(scrPnt.x + tolerance, scrPnt.y - tolerance);

            //Convert the points back into map points
            var mapPnt1 = map.toMap(pnt1);
            var mapPnt2 = map.toMap(pnt2);

            //Calculate the extent used for querying
            return new Extent(mapPnt1.x, mapPnt1.y, mapPnt2.x, mapPnt2.y, map.spatialReference);
        }
    });

    

    return SH;
});
