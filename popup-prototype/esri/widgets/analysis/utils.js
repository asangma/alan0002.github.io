define(
 [
  "../../core/declare",
  "dojo/_base/lang",
  "dojo/_base/array",
  "dojo/_base/connect",
  "dojo/_base/event",
  "dojo/dom-attr",
  "dojo/has",
  "dojo/i18n",
  "dojo/io-query",
  "dojo/i18n!../../nls/jsapi",
  "dojo/string",
  "dojo/query",
  "dojo/dom-style",
  "dojo/dom-class",
  "dojo/dom-construct", 
  "dojo/Deferred",
 
  "dojo/data/ItemFileWriteStore",
  
  "dijit/registry",
  "dijit/Dialog", 
   
  "../../kernel",
  "../../core/lang",
  "../../request",
  "./HelpWindow",
  "../../tasks/support/Query",
   "../../widgets/BrowseItems", 
   "./PluginAnalysisLayers"
  
 ], function(declare, lang, array, connection, event, domAttr, has, i18n, ioQuery, jsapiBundle, string, query, domStyle, domClass, domConstruct, Deferred, ItemFileWriteStore, registry, Dialog, esriNS, esriLang, esriRequest, HelpWindow, Query, BrowseItems, PluginAnalysisLayers) {
   
  var analysisUtils = {};
  lang.mixin(analysisUtils, { 
    _helpDialog: null,
    i18n: null,
    initHelpLinks: function(widgetNode, showHelp, params) {
      //console.log(widgetNode, "help");
      if(!this._helpDialog) {
        this._helpDialog = new HelpWindow();
      }
      if (!widgetNode) {
        //widgetNode = dojo.body();
        return;
      }
      var widget = registry.byNode(widgetNode), 
          helpFileName = widget ? widget.get("helpFileName") : (params && params.helpFileName) ? params.helpFileName : null;
      query("[esriHelpTopic]", widgetNode).forEach(function(node, index, nodeList){
         //console.log(index, node);
        if (node) {
          domStyle.set(node, "display", !esriLang.isDefined(showHelp) || showHelp === true? "" : "none");
          /*connection.connect(node, connection.mouse.enter, dojo.hitch(esri.arcgisonline.map.main, function(event){ 
              esri.widgets._helpDialog.show(event, dojo.attr(node,"esriHelpTopic"));
           }));*/
           connection.connect(node, "onclick", lang.hitch(this, function(e){
              event.stop(e); 
              //singleton object to be removed using esri. 
              this._helpDialog.show(e, {
                    helpId: domAttr.get(node,"esriHelpTopic"), 
                    helpFileName: helpFileName, 
                    analysisGpServer: (params && params.analysisGpServer)? params.analysisGpServer : null,
                    helpParentNode: widgetNode
                });
           }));        
           //connection.connect(node, connection.mouse.leave, lang.hitch(esri.arcgisonline.map.main, function(event){ 
           //   esri.widgets.main._helpDialog.close(event);
           //}));
        }       
      }, this);    
    }, 
    
    constructAnalysisFeatColl: function(lobj) {
      var  obj = {}, propt;
      obj.featureCollection = lobj.layerDefinition;
      for (propt in obj.featureCollection) {
        if ((obj.featureCollection).hasOwnProperty(propt)) {
          if(propt === "objectIdField") {
            obj.featureCollection.objectIdFieldName = lang.clone(obj.featureCollection.objectIdField);
            delete obj.featureCollection.objectIdField;
          }
        }
      }
      obj.featureCollection.features = lobj.featureSet.features;
      return obj;
    },
    
    constructAnalysisInputLyrObj : function(flayer) {
      var obj = {}, query, queryObject;
      // using the feature layer _collection to determine if its feature collection
      // just checking url is not enough for layers which extend FeatureLayer like CSVLayer which has url property
      if(flayer.url && !flayer._collection) {
        obj = {
          url:flayer.url
        };
        if(flayer.getDefinitionExpression && flayer.getDefinitionExpression()) {
          //get filter
          obj.filter = flayer.getDefinitionExpression(); 
        }
        else if(esriLang.isDefined(flayer.definitionExpression) && flayer.definitionExpression !== "") {
          //get filter
          obj.filter = flayer.definitionExpression; 
        }
        
        if(flayer.credential) {
          //get token for secured feature layer
          obj.serviceToken = flayer.credential.token; 
        }
        if(flayer.analysisReady) {
          obj.analysisReady = true;
        }
        if(obj.url.indexOf("?") !== -1) {
          query = obj.url.substring(obj.url.indexOf("?") + 1, obj.url.length);
          queryObject = ioQuery.queryToObject(query);        
          lang.mixin(obj, queryObject);
          obj.url = obj.url.substring(0, obj.url.indexOf("?"));
        }
      }
      else if(!flayer.url || flayer._collection) {
        obj = flayer.toJSON();
      }            
      return obj;
    },
    
        buildReport: function(reportArray, i18nBundle) {
      var reportStr = "";
      if(!i18nBundle) {
        i18nBundle = {};
        lang.mixin(i18nBundle, jsapiBundle.analysisMsgCodes);        
      }
      array.forEach(reportArray, function(msgObj, index) {
         var msg, curStr, keyArr;
         if(typeof msgObj.message === "string") {
          msg = esriLang.isDefined(i18nBundle[msgObj.messageCode]) ? i18nBundle[msgObj.messageCode] : msgObj.message;
          reportStr += msgObj.style.substring(0,msgObj.style.indexOf("</")) + (!this._isEmptyObject(msgObj.params)? string.substitute(msg, msgObj.params) : msg)  + msgObj.style.substring(msgObj.style.indexOf("</"));
         }
         else if(lang.isArray(msgObj.message)){
           keyArr = [];
           curStr = lang.clone(msgObj.style); 
           array.forEach(msgObj.message, function(message, index) {
             curStr = curStr.replace(/<\//, "${" + index +"}");
             msg = esriLang.isDefined(i18nBundle[msgObj.messageCode+ "_" + index]) ? i18nBundle[msgObj.messageCode+ "_" + index] : message;
             msg = (!this._isEmptyObject(msgObj.params)? string.substitute(msg, msgObj.params) : msg);
             keyArr.push(msg + "<\/");
           }, this);
           curStr = string.substitute(curStr, keyArr);
           //console.log(curStr);         
           reportStr+= curStr;
         }
      }, this);
      //console.log("*******************************");
      //console.log(reportStr);
      //console.log("*******************************");
      return reportStr;        
    },
    
    getLayerFeatureCount: function(layer, params) {
      var query = new Query();
      query.geometry= params.geometry || "";
      query.where = params.where || "1=1";
      query.geometryType = params.geometryType || "esriGeometryEnvelope";
      return layer.queryCount(query);
    }, 
    
    createPolygonFeatureCollection: function(layerName) {
        var featureCollection;
        featureCollection = {
          "layerDefinition": null,
          "featureSet": {
            "features": [],
            "geometryType": "esriGeometryPolygon"
          }
        };
        featureCollection.layerDefinition = {
          "currentVersion": 10.2,
          "copyrightText": "",
          "defaultVisibility": true,
          "relationships": [],
          "isDataVersioned": false,
          "supportsRollbackOnFailureParameter": true,
          "supportsStatistics": true,
          "supportsAdvancedQueries": true,
          "geometryType": "esriGeometryPolygon", 
          "minScale": 0,
          "maxScale": 0,     
          "objectIdField": "OBJECTID",
          "templates": [],
          "type": "Feature Layer",
          "displayField": "TITLE",
          "visibilityField": "VISIBLE",
          "name": layerName,
          "hasAttachments": false,
          "typeIdField": "TYPEID", 
          "capabilities": "Query",
          "allowGeometryUpdates": true,
          "htmlPopupType": "",
          "hasM": false,
          "hasZ": false,
          "globalIdField": "",
          "supportedQueryFormats": "JSON",
          "hasStaticData": false,
          "maxRecordCount": -1,
          "indexes": [],
          "types": [],     
          "drawingInfo": {
             "renderer": {
               "type": "simple",
                "symbol": {
                    "color": [
                      0,
                      0,
                      0,
                      255
                    ],
                    "outline": {
                      "color": [
                        0,
                        0,
                        0,
                        255
                      ],
                      "width": 3,
                      "type": "esriSLS",
                      "style": "esriSLSSolid"
                    },
                    "type": "esriSFS",
                    "style": "esriSFSNull"
              },
              "label": "",
              "description": ""                          
            },
            "transparency": 0,
            "labelingInfo": null,
            "fixedSymbols": true          
            },      
           "fields": [
                  {
                    "alias": "OBJECTID",
                    "name": "OBJECTID",
                    "type": "esriFieldTypeOID",
                    "editable": false
                  },
                  {
                    "alias": "Title",
                    "name": "TITLE",
                    "length": 50,
                    "type": "esriFieldTypeString",
                    "editable": true
                  },
                  {
                    "alias": "Visible",
                    "name": "VISIBLE",
                    "type": "esriFieldTypeInteger",
                    "editable": true
                  },
                  {
                    "alias": "Description",
                    "name": "DESCRIPTION",
                    "length": 1073741822,
                    "type": "esriFieldTypeString",
                    "editable": true
                  },
                  {
                    "alias": "Type ID",
                    "name": "TYPEID",
                    "type": "esriFieldTypeInteger",
                    "editable": true
                  }
                ]
        };
      
        //define a popup template
        /*popupTemplate = new PopupTemplate({
          title: "{title}",
          description:"{description}"
        }); */     
      return featureCollection;
    }, 
    
    createPointFeatureCollection: function(layerName) {
      var featureCollection;
      featureCollection = {
      "layerDefinition": null,
        "featureSet": {
          "features": [],
          "geometryType": "esriGeometryPoint"
        }
      };
      featureCollection.layerDefinition =  {
        "objectIdField": "OBJECTID",
        "templates": [],
        "type": "Feature Layer",
        "drawingInfo": {"renderer": {
          "field1": "TYPEID",
          "type": "simple",
          "symbol": {
              "height": 24,
              "xoffset": 0,
              "yoffset": 12,
              "width": 24,
              "contentType": "image/png",
              "type": "esriPMS",
              "url": "http://static.arcgis.com/images/Symbols/Basic/GreenStickpin.png"
            },
            "description": "",
            "value": "0",
            "label": "Stickpin"
        }},
        "displayField": "TITLE",
        "visibilityField": "VISIBLE",
        "name": layerName,
        "hasAttachments": false,
        "typeIdField": "TYPEID",
        "capabilities": "Query",
        "types": [],
        "geometryType": "esriGeometryPoint",
        "fields": [
            {
              "alias": "OBJECTID",
              "name": "OBJECTID",
              "type": "esriFieldTypeOID",
              "editable": false
            },
            {
              "alias": "Title",
              "name": "TITLE",
              "length": 50,
              "type": "esriFieldTypeString",
              "editable": true
            },
            {
              "alias": "Visible",
              "name": "VISIBLE",
              "type": "esriFieldTypeInteger",
              "editable": true
            },
            {
              "alias": "Description",
              "name": "DESCRIPTION",
              "length": 1073741822,
              "type": "esriFieldTypeString",
              "editable": true
            },
            {
              "alias": "Type ID",
              "name": "TYPEID",
              "type": "esriFieldTypeInteger",
              "editable": true
            }
          ]
      };
      return featureCollection;
    },
        
    createFolderStore: function(folders, username) {
      var folderStore = new ItemFileWriteStore({data: {identifier: "id", label:"name", items:[]}});
      folderStore.newItem({name: username, id:""});
      //console.log(folders);
      array.forEach(folders,function(folder){
        folderStore.newItem({name:folder.title, id:folder.id});
      });  
      return folderStore;
    },
    
    setupFoldersUI: function(params) {
      params.folderSelect.set("store", params.folderStore);
      if(esriLang.isDefined(params.folderId)) {
        params.folderStore.get(params.folderId).then(lang.hitch(this, function(folder) {
          if(esriLang.isDefined(folder)) {
            params.folderSelect.set("value",folder.name);
          }
          else {
            params.folderStore.get("").then(function(item) {
              params.folderSelect.set("value", item.name);
            }, this);            
          }
        }));
      }
      else if(params.folderName) {
        params.folderStore.fetch({
          query: {
            name: params.folderName
          }, 
          onComplete: lang.hitch(this, function(items) {
            if(esriLang.isDefined(items) && items.length > 0) {
              params.folderSelect.set("value",items[0].name);
            }
            else {
              params.folderStore.get("").then(function(item) {
                params.folderSelect.set("value", item.name);
              }, this);              
            }
          })
        });  
      }
      else if(params.username){
        params.folderSelect.set("value", params.username); 
      }
      else {
        params.folderStore.get("").then(function(item) {
          params.folderSelect.set("value", item.name);
        }, this);
      }
    },
    
    _isEmptyObject: function(obj) {
      var name;
      for (name in obj) {
        if(obj.hasOwnProperty(name)) {
          return false;
        }
      }
      return true;
    },
    
    validateServiceName: function(value, params) {
      var isMatch = /(:|&|<|>|%|#|\?|\\|\"|\/|\+)/.test(value),
          isValid = true,
          msg, textInput;
      if(esriLang.isDefined(params) && params.textInput) {
        textInput = params.textInput;
      }
      this.initI18n();
      if(value.length === 0 || ((string.trim(value)).length === 0)) {
        msg = this.i18n.requiredValue;
        isValid = false;
      }
      else if (isMatch){
        msg = this.i18n.invalidServiceName;
        isValid = false;
      }
      else if(value.length > 98 || encodeURIComponent(value).length > 170) {
        msg = this.i18n.invalidServiceNameLength;
        isValid = false;
      }
      if(textInput && !isValid) {
         textInput.set("invalidMessage", msg); 
      }
      return isValid;
    },
    
    getStepNumber: function(domNode) {
      query(".esriAnalysisNumberLabel", domNode).forEach(function(node, index) { 
          var str= this._getNumberLabel(index);
          domAttr.set(node, "innerHTML", str);
      }, this);
    },
    
    _getNumberLabel: function(index) {
      var str = "";
      this.initI18n();
      switch(index) {
        case 0: 
                 str = this.i18n.oneLabel;
                 break;
        case 1: 
                 str = this.i18n.twoLabel;
                 break;
        case 2: 
                 str = this.i18n.threeLabel; 
                 break;
        case 3: 
                 str = this.i18n.fourLabel; 
                 break;
        case 4: 
                 str = this.i18n.fiveLabel; 
                 break;
        case 5: 
                 str = this.i18n.sixLabel; 
                 break;
        case 6: 
                 str = this.i18n.sevenLabel; 
                 break;
        case 7: 
                 str = this.i18n.eightLabel; 
                 break;
        case 8: 
                 str = this.i18n.nineLabel; 
                 break;
      }
      return str;
    },
    
    populateAnalysisLayers: function(widget, layerPropertyName, layersPropertyName, params) {
        if(!widget) {
          return;  
        }
        var analysisOptions =[], 
            analysisLayer = widget.get(layerPropertyName);
        if(widget._titleRow) {
          domStyle.set(widget._titleRow, "display", "none"); 
        }
        if(widget._analysisLabelRow) {
          domStyle.set(widget._analysisLabelRow, "display", "table-row");
        }
        if(widget._selectAnalysisRow) {
          domStyle.set(widget._selectAnalysisRow, "display", "table-row");
          domClass.add(widget._analysisSelect.domNode, "esriTrailingMargin3");
          domStyle.set(widget._analysisSelect.domNode.parentNode, "padding-bottom", "1em");
        }
        if(widget.domNode) {
          this.getStepNumber(widget.domNode);
        }
        if(esriLang.isDefined(params) && params.chooseLabel) {
          analysisOptions.push({value:-1, label: this.i18n.chooseLabel});
        }
        array.forEach(widget.get(layersPropertyName), function(layer , index) {
           var obj = {
             value: esriLang.isDefined(params) && params.chooseLabel? index + 1 : index, 
             label:layer.name
           };
           if(analysisLayer && layer.name === analysisLayer.name) {
             obj.selected = true;
           }
           analysisOptions.push(obj);
        }, this);
        widget._analysisSelect.addOption(analysisOptions);
        widget._analysisSelect.set("required", true);
    },
    
    isValidAnalysisLayer: function(params) {
      var toolName, featureLayers, analysisLayer, toolHelpId, isPoly, isPoint, analysisToolBundle,
          message = "",
          isValid = true,
          result = {
            isValid: isValid,
            validationMessage: message
          }, 
          anyPoint, anyLine, ptCount = 0, areaCount = 0, lineCount = 0, isSameType;      
      if(!esriLang.isDefined(params) || !esriLang.isDefined(params.toolName)) {
        return result;
      }
      this.initI18n();
      toolName = params.toolName;
      featureLayers = params.featureLayers;
      analysisLayer = params.analysisLayer;
      toolHelpId = toolName.charAt(0).toLowerCase() + toolName.substring(1);
      analysisToolBundle = this.i18n;
      array.forEach(featureLayers, function(lyr) {
        if(lyr.geometryType === "esriGeometryPoint") {
          isPoint = true;
          ptCount++;
        }
        if(lyr.geometryType === "esriGeometryPoint" || lyr.geometryType === "esriGeometryMultipoint") {
          anyPoint = true;
        }
        if(lyr.geometryType === "esriGeometryPolyline") {
          anyLine = true;
          lineCount++;
        }
        if(lyr.geometryType === "esriGeometryPolygon") {
          isPoly = true;
          areaCount++;
        }        
      }, this);
      if((array.indexOf(["CreateDriveTimeAreas", "PlanRoutes", "ConnectOriginsToDestinations"], toolName) !== -1) && (!isPoint || (analysisLayer && analysisLayer.geometryType !== "esriGeometryPoint"))) {
        message = string.substitute(this.i18n.selectPointLayer, {toolName: analysisToolBundle[toolHelpId]});   
        isValid = false;
      }
      else if((toolName === "AggregatePoints" || toolName === "InterpolatePoints") && ((analysisLayer && !(analysisLayer.geometryType === "esriGeometryPoint" || analysisLayer.geometryType === "esriGeometryMultipoint")) || !anyPoint)) {
        message = string.substitute(this.i18n.selectPointLayer, {toolName: analysisToolBundle[toolHelpId]});   
        isValid = false;
      }
      else if((toolName === "CalculateDensity") && ((!anyPoint && !anyLine) || (analysisLayer && !(analysisLayer.geometryType === "esriGeometryPoint" || analysisLayer.geometryType === "esriGeometryMultipoint" || analysisLayer.geometryType === "esriGeometryPolyline")))) {
        message = string.substitute(this.i18n.areaFeatureInvalidMsg, {toolName: analysisToolBundle[toolHelpId]});   
        isValid = false;
      }    
      else if( (toolName === "FindHotSpots") && ( !(anyPoint || isPoly)||(analysisLayer && !(analysisLayer.geometryType === "esriGeometryPoint" || analysisLayer.geometryType === "esriGeometryMultipoint" || analysisLayer.geometryType === "esriGeometryPolygon"))) ) {
        message =  string.substitute(this.i18n.hotspotsLineFeatureMsg, {toolName: analysisToolBundle[toolHelpId]});
        isValid = false;
      }
      else if((toolName === "OverlayLayers" || toolName === "AggregatePoints" || toolName === "SummarizeWithin" || toolName === "SummarizeNearby" || toolName === "FindNearest" || toolName === "MergeLayers") && (featureLayers.length === 0  || (featureLayers.length === 1 && (featureLayers[0] === analysisLayer || !esriLang.isDefined(analysisLayer))))) {
         message = string.substitute(this.i18n.overlayValidationMsg, {toolName: analysisToolBundle[toolHelpId]});
         isValid = false;
      }      
      else if((toolName === "ConnectOriginsToDestinations") && (featureLayers.length === 0  || ptCount < 2)) {
         message = string.substitute(this.i18n.odPointMsg, {toolName: analysisToolBundle[toolHelpId]});
         isValid = false;
      }    
      else if(toolName === "AggregatePoints" && featureLayers.length >1) {
        isPoly = array.some(featureLayers, function(lyr) {
           return lyr.geometryType === "esriGeometryPolygon";
        });
        if(!isPoly) {
         message = string.substitute(this.i18n.aggregatePolyMsg, {toolName: analysisToolBundle[toolHelpId]});
         isValid = false;
        }
      }   
      else if(toolName === "MergeLayers" && featureLayers.length > 1) {
        isSameType = (ptCount > 1 || lineCount > 1 || areaCount > 1);
        if(!isSameType) {
         message = this.i18n.mergeValidationMsg;
         isValid = false;
        }
      }   
      else if ((toolName === "SummarizeWithin" || toolName === "DissolveBoundaries") && ((analysisLayer && analysisLayer.geometryType !== "esriGeometryPolygon") || !isPoly)) {
        message = string.substitute(this.i18n.selectPolyLayer, {toolName: analysisToolBundle[toolHelpId]});   
        isValid = false;
      }  
      else if(toolName === "ExtractData") {
        isValid = array.some(featureLayers, function(layer){
          return (layer.capabilities.indexOf("Extract") !== -1);
        });
        if(!isValid) {
          message = string.substitute(this.i18n.extractValidationMsg);  
        }

      }
      else if(toolName === "ConnectOriginsToDestinations" && featureLayers.length >1) {
        isPoint = array.some(featureLayers, function(lyr) {
           var isAnalysisLayer = esriLang.isDefined(analysisLayer) && analysisLayer.id === lyr.id;
           return lyr.geometryType === "esriGeometryPoint" && !isAnalysisLayer;
        });
        if(!isPoint) {
         message = string.substitute(this.i18n.odPointMsg, {toolName: analysisToolBundle[toolHelpId]});
         isValid = false;
        }
      }
      result = {
        isValid: isValid,
        validationMessage: message
      };
      return result;
    },
    
    initI18n: function() {
      if(!this.i18n) {
        this.i18n = {};
        lang.mixin(this.i18n, jsapiBundle.common);
        lang.mixin(this.i18n, jsapiBundle.analysisTools);
        lang.mixin(this.i18n, jsapiBundle.analysisMsgCodes); 
        lang.mixin(this.i18n, jsapiBundle.browseLayersDlg);
      }        
    },
    
    addBrowseAnalysisDialog: function(params) {
      var items = [];
      if(!params || !params.widget) {
        return;
      }
      if(!this.i18n) {
        this.initI18n();
      }
      items.push({
        label: this.i18n.categoryAll,
        value: ""
      });

      items.push({
        label: this.i18n.categoryHistoricalMaps,
        value: "historical"
      });

      items.push({
        label: this.i18n.categoryDemographics,
        value: "demographics"
      });
      items.push({
        label: "&nbsp;&nbsp;&nbsp;&nbsp;" + this.i18n.subCategoryIncome,
        value: "income"
      });
      items.push({
        label: "&nbsp;&nbsp;&nbsp;&nbsp;" + this.i18n.subCategoryPopulation,
        value: "population"
      });
      items.push({
        label: "&nbsp;&nbsp;&nbsp;&nbsp;" + this.i18n.subCategorySegmentation,
        value: "behaviors"
      });
      items.push({
        label: "&nbsp;&nbsp;&nbsp;&nbsp;" + this.i18n.subCategoryBusiness,
        value: "business"
      });
      items.push({
        label: "&nbsp;&nbsp;&nbsp;&nbsp;" + this.i18n.subCategoryAtRisk,
        value: "\"at risk\""
      });

      items.push({
        label: this.i18n.categoryLandscape,
        value: "landscape"
      });
      items.push({
        label: "&nbsp;&nbsp;&nbsp;&nbsp;" + this.i18n.subCategoryClimate,
        value: "climate"
      });
      items.push({
        label: "&nbsp;&nbsp;&nbsp;&nbsp;" + this.i18n.subCategoryEcology,
        value: "ecology"
      });
      items.push({
        label: "&nbsp;&nbsp;&nbsp;&nbsp;" + this.i18n.subCategorySpecies,
        value: "species"
      });
      items.push({
        label: "&nbsp;&nbsp;&nbsp;&nbsp;" + this.i18n.subCategoryDisturbance,
        value: "disturbance"
      });
      items.push({
        label: "&nbsp;&nbsp;&nbsp;&nbsp;" + this.i18n.subCategoryElevation,
        value: "elevation"
      });
      items.push({
        label: "&nbsp;&nbsp;&nbsp;&nbsp;" + this.i18n.subCategoryLand,
        value: "landcover"
      });
      items.push({
        label: "&nbsp;&nbsp;&nbsp;&nbsp;" + this.i18n.subCategoryHazards,
        value: "hazards"
      });
      items.push({
        label: "&nbsp;&nbsp;&nbsp;&nbsp;" + this.i18n.subCategoryOceans,
        value: "oceans"
      });
      items.push({
        label: "&nbsp;&nbsp;&nbsp;&nbsp;" + this.i18n.subCategorySoils,
        value: "soils"
      });
      items.push({
        label: "&nbsp;&nbsp;&nbsp;&nbsp;" + this.i18n.subCategorySubsurface,
        value: "subsurface"
      });
      items.push({
        label: "&nbsp;&nbsp;&nbsp;&nbsp;" + this.i18n.subCategoryWater,
        value: "water"
      });

      items.push({
        label: this.i18n.categoryEarthObservations,
        value: "\"earth observations\""
      });

      items.push({
        label: this.i18n.categoryUrbanSystems,
        value: "urban"
      });
      items.push({
        label: "&nbsp;&nbsp;&nbsp;&nbsp;" + this.i18n.subCategory3DCities,
        value: "3D"
      });
      items.push({
        label: "&nbsp;&nbsp;&nbsp;&nbsp;" + this.i18n.subCategoryMovement,
        value: "movement"
      });
      items.push({
        label: "&nbsp;&nbsp;&nbsp;&nbsp;" + this.i18n.subCategoryParcels,
        value: "parcels"
      });
      items.push({
        label: "&nbsp;&nbsp;&nbsp;&nbsp;" + this.i18n.subCategoryPeople,
        value: "people"
      });
      items.push({
        label: "&nbsp;&nbsp;&nbsp;&nbsp;" + this.i18n.subCategoryPlanning,
        value: "planning"
      });
      items.push({
        label: "&nbsp;&nbsp;&nbsp;&nbsp;" + this.i18n.subCategoryPublic,
        value: "public"
      });
      items.push({
        label: "&nbsp;&nbsp;&nbsp;&nbsp;" + this.i18n.subCategoryWork,
        value: "work"
      });

      items.push({
        label: this.i18n.categoryTransportation,
        value: "transportation"
      });

      items.push({
        label: this.i18n.categoryBoundaries,
        value: "boundaries"
      });
      items.push({
        label: "&nbsp;&nbsp;&nbsp;&nbsp;" + this.i18n.subCategoryBoundaries,
        value: "boundaries"
      });
      items.push({
        label: "&nbsp;&nbsp;&nbsp;&nbsp;" + this.i18n.subCategoryPlaces,
        value: "places"
      });

      var browseNode = new BrowseItems({
        portalUrl: params.widget.get("portalUrl"),
        message: "", 
        plugin: "esri/dijit/analysis/PluginAnalysisLayers",
        sortDescending: true,
        sort: "title",
        categories: items,
        categoryType: "tags",
        pagingLinks: 3,
        itemsPerPage: 6,
        "class": "esriBrowseAnalysisLayers itemsGallery",
        galleryTemplate:
      "<div style='opacity:1;' class='grid-item gallery-view galleryNode'>" +
        "${item:_formatItemTitle}" +
        "${item:_formatThumbnail}" +
        "<div class=\"linksDiv\" style='display:none;'><div class=\"esriItemLinks\"><div class=\"esriFloatLeading\">"+
        "<a style=\"text-decoration: none;\"><span>Add layer to analysis</span><div class=\"dijitReset dijitInline esriArrows\">"+
  "</div></a></div></div></div>",
        formatThumbnail: function (item) {
          var thmbSrc = item.thumbnailUrl || this._portal.staticImagesUrl + "/desktopapp.png";
          return "<img class='grid-item galleryThumbnail' width='120px' height='80px' alt='' src='" + thmbSrc + "'>";
        },
        formatItemTitle: function(item) {
          return "<div class=\"galleryLabelContainer\">" + "<span alt='"+ (item.title || item.name || "<No Title>") + "'>" + (item.title.replace(/_/g, " ")|| item.name.replace(/_/g, " ") || "<No Title>") + "</span></div>";
        },
        style: "width:600px;height:100%;"
      }, domConstruct.create("div", {"style": "width:100%"}, params.widget.domNode, "last"));
      var dlg = new Dialog({"title": this.i18n.browseAnalysisTitle, 
                        "content" :browseNode.domNode,
                         doLayout: true,
                         browseItems: browseNode
                       });
      return dlg;
    },
    
    addAnalysisReadyLayer: function(params) {
      if(!esriLang.isDefined(params) || !esriLang.isDefined(params.item) || !esriLang.isDefined(params.layersSelect) || !esriLang.isDefined(params.layers) || !esriLang.isDefined(params.browseDialog)) {
        return;
      }
      params.browseDialog.browseItems._closePopup();//without this there is flickr
      params.browseDialog.hide();

      var itemObj = {
         url: params.item.url + "/0",
         itemId: params.item.id,
         title: params.item.title,
         analysisReady: true
      },
      index,
      isAdded = array.some(params.layers, function(player, i) {
        var isSameItem = player.analysisReady  && itemObj.analysisReady && player.itemId === itemObj.itemId;
        if(isSameItem) {
          index = i;
        }
        return isSameItem;
      }),
      browseOption, pos, options,
      def = new Deferred();

      if(!isAdded) {
        def = esriRequest({url: itemObj.url, "content": {f: "json"}});
        def.then(lang.hitch(this, function(linfo) {
          lang.mixin(itemObj, linfo);
          itemObj.title = itemObj.title.replace(/_/g, " ");
          itemObj.name = itemObj.title;
          options = params.layersSelect.getOptions();
          browseOption = options.splice(options.length - 2 , 2);
          //console.log(browseOption);
          params.layersSelect.removeOption(browseOption);
          pos =  params.layers.length;
          //console.log(pos);
          if(params.posIncrement) {
            pos = pos + params.posIncrement;
          }
          browseOption.unshift({value:pos, 
                                         label: itemObj.title,
                                         selected: true});
          //console.log(browseOption);
          params.layersSelect.addOption(browseOption);
          params.layersSelect.set("value", pos);
          params.layers.push(itemObj);
          params.browseDialog.browseItems.clear();
        }));
      }
      else {
        if(params.posIncrement) {
          index = index + params.posIncrement;
        }
        params.layersSelect.set("value", index);
        params.browseDialog.browseItems.clear();
        def.resolve();
      }
      return def.promise; 
    },
    
    addReadyToUseLayerOption: function(widget, selectboxes) {
      if(!widget) {
        return;
      }
      if(widget.showReadyToUseLayers) {
        if(!selectboxes) {
          selectboxes = [];
        }
        widget.signInPromise.then(lang.hitch(this, function() {
          widget._browsedlg = this.addBrowseAnalysisDialog({widget: widget});
          array.forEach(selectboxes, function(selectbox) {
             selectbox.addOption({type:"separator", value:""});
             selectbox.addOption({value:"browse", label: widget.i18n.browseAnalysisTitle});            
          }, this);
          widget.own(
            widget._browsedlg.browseItems.on("select-change", lang.hitch(widget, widget._handleBrowseItemsSelect)),
            widget._browsedlg.on("hide", lang.hitch(widget, function() {
              array.forEach(selectboxes, function(selectbox) {
                if(selectbox.get("value") === "browse") {
                  selectbox.reset();
                }
              });
            }))
          );
        }));
      }      
    }
    
  });
  
    
  return analysisUtils;  
  
});
