/******************************************
 * esri/widgets/analysis/ConnectOriginsToDestinations
 ******************************************/
define(
[ 
  "require",
  "../../core/declare",
  "dojo/_base/lang",
  "dojo/_base/array",
  "dojo/_base/connect",
  "dojo/_base/fx",
  "dojo/has",
  "dojo/string",
  "dojo/dom-style",
  "dojo/dom-attr",
  "dojo/dom-construct",
  "dojo/query",
  "dojo/dom-class",
  "dojo/fx/easing",
  "dojo/number",
  
  "dijit/_WidgetBase",
  "dijit/_TemplatedMixin",
  "dijit/_WidgetsInTemplateMixin",
  "dijit/_OnDijitClickMixin",
  "dijit/_FocusMixin",
  "dijit/registry",
  "dijit/form/Button",
  "dijit/form/CheckBox",
  "dijit/form/Form",
  "dijit/form/Select",
  "dijit/form/TextBox",
  "dijit/form/ValidationTextBox",
  "dijit/layout/ContentPane",
  "dijit/form/ComboBox",
  
  "../../kernel",
  "../../core/lang",
  "./AnalysisBase",
  "./_AnalysisOptions",
  "./CreditEstimator",
  "./utils",
  "./TrafficTime",
  "dojo/i18n!../../nls/jsapi",
  "dojo/text!./templates/ConnectOriginsToDestinations.html"
], function(require, declare, lang, array, connection, fx, has, string, domStyle, domAttr, domConstruct, query, domClass, easing, number, _WidgetBase,
   _TemplatedMixin, _WidgetsInTemplateMixin,  _OnDijitClickMixin, _FocusMixin, registry, Button, CheckBox, Form, Select, TextBox, ValidationTextBox, ContentPane, ComboBox, esriKernel, esriLang, AnalysisBase, _AnalysisOptions, CreditEstimator, AnalysisUtils, TrafficTime, jsapiBundle, template) {
    var ConnectOriginsToDestinations = declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin,  _OnDijitClickMixin, _FocusMixin, _AnalysisOptions, AnalysisBase], {
        declaredClass: "esri.widgets.analysis.ConnectOriginsToDestinations",
  
        templateString: template,
        basePath: require.toUrl("."),      
        widgetsInTemplate: true,
        
        originsLayer : null,
        destinationsLayer: null,
        measurementType:"DrivingTime",
        
        outputLayerName: null,
        distanceDefaultUnits: "Miles",
        originsLayerRouteIDField : null,
        destinationsLayerRouteIDField: null,
        enableTravelModes: true,
        
        i18n: null,
        
        toolName: "ConnectOriginsToDestinations",
        helpFileName: "ConnectOriginsToDestinations",
        resultParameter:["routesLayer", "unassignedOriginsLayer", "unassignedDestinationsLayer"],

       
        /************
         * Overrides
         ************/
        constructor: function(params, srcNodeRef){
          this._pbConnects = [];
          if (params.containerNode) {
            this.container = params.containerNode;
          }
        },
        
        destroy: function(){
          this.inherited(arguments);
          array.forEach(this._pbConnects, connection.disconnect);
          delete this._pbConnects;
        },
        
        postMixInProperties: function(){
          this.inherited(arguments);
          //bufferTool
          lang.mixin(this.i18n, jsapiBundle.common);
          lang.mixin(this.i18n, jsapiBundle.bufferTool);
          lang.mixin(this.i18n, jsapiBundle.driveTimes);
          lang.mixin(this.i18n, jsapiBundle.routeOriginDestinationPairsTool);
        },
        
        postCreate: function(){
          this.inherited(arguments);
          domClass.add(this._form.domNode, "esriSimpleForm");
          this._outputLayerInput.set("validator", lang.hitch(this, this.validateServiceName));
          this._buildUI();
        },
        
        startup: function() {},
    
        /*****************
         * Event Listeners
         *****************/
        
        _onClose: function(save){
          if (save) {
            this._save();
            this.emit("save", {"save": true});//event
          }
          this.emit("close", {"save": save}); //event
        },
        
        _handleShowCreditsClick: function(e) {
          e.preventDefault();
          var jobParams = {};
          if(!this._form.validate()) {
            return;
          }
          jobParams.originsLayer  =  JSON.stringify(AnalysisUtils.constructAnalysisInputLyrObj(this.originsLayer ));
          jobParams.destinationsLayer = JSON.stringify(AnalysisUtils.constructAnalysisInputLyrObj(this.get("destinationsLayer")));
          jobParams.measurementType = this.get("measurementType");
          if(domStyle.get(this._routeIdRow, "display") !== "none") {
            jobParams.originsLayerRouteIDField  = this.get("originsLayerRouteIDField");
            jobParams.destinationsLayerRouteIDField = this.get("destinationsLayerRouteIDField");
          }          
          if(this._trafficTimeWidget.get("checked")) {
            jobParams.timeOfDay = this._trafficTimeWidget.get("timeOfDay");
            if(this._trafficTimeWidget.get("timeZoneForTimeOfDay") === "UTC") {
              jobParams.timeZoneForTimeOfDay = this._trafficTimeWidget.get("timeZoneForTimeOfDay");
            }
          }
          //outputLayer
          if(!this.returnFeatureCollection) {
            jobParams.OutputName = JSON.stringify({
              serviceProperties : {
                name: this._outputLayerInput.get("value")
              }
            });
          }
  
          if(this.showChooseExtent) {
            if(this._useExtentCheck.get("checked")) {
              jobParams.context = JSON.stringify({
                extent: this.map.extent._normalize(true)
              });
            }
          }
          //console.log(jobParams);
          this.getCreditsEstimate(this.toolName, jobParams).then(lang.hitch(this, function(result){
            this._usageForm.set("content", result);
            this._usageDialog.show();
          }));
        },
        
        _handleSaveBtnClick: function(e) {
          //construct job params object
          var jobParams = {}, executeObj = {}, contextObj;
          if(!this._form.validate()) {
            return;
          }
          this._saveBtn.set("disabled", true);
          jobParams.originsLayer  =  JSON.stringify(AnalysisUtils.constructAnalysisInputLyrObj(this.originsLayer ));
          jobParams.destinationsLayer = JSON.stringify(AnalysisUtils.constructAnalysisInputLyrObj(this.get("destinationsLayer")));
          jobParams.measurementType = this.get("measurementType");
          if(domStyle.get(this._routeIdRow, "display") !== "none") {
            jobParams.originsLayerRouteIDField  = this.get("originsLayerRouteIDField");
            jobParams.destinationsLayerRouteIDField = this.get("destinationsLayerRouteIDField");
          }
          if(this._trafficTimeWidget.get("checked")) {
            jobParams.timeOfDay = this._trafficTimeWidget.get("timeOfDay");
            if(this._trafficTimeWidget.get("timeZoneForTimeOfDay") === "UTC") {
              jobParams.timeZoneForTimeOfDay = this._trafficTimeWidget.get("timeZoneForTimeOfDay");
            }
          }
          //outputLayer
          if(!this.returnFeatureCollection) {
            jobParams.OutputName = JSON.stringify({
              serviceProperties : {
                name: this._outputLayerInput.get("value")
              }
            });
          }
  
          if(this.showChooseExtent) {
            if(this._useExtentCheck.get("checked")) {
              jobParams.context = JSON.stringify({
                extent: this.map.extent._normalize(true)
              });
            }
          }
          if(this.returnFeatureCollection) {
             contextObj = {
               outSR: this.map.spatialReference
             };
             if(this.showChooseExtent) {
               if(this._useExtentCheck.get("checked")) {
                 contextObj.extent = this.map.extent._normalize(true);
               }
             }
             jobParams.context = JSON.stringify(contextObj);
          }
          //console.log(jobParams);        
          
          executeObj.jobParams  = jobParams;
          
          executeObj.itemParams = { 
            "description" : string.substitute(this.i18n.itemDescription, { layername: this.originsLayer.name, distance_field: jobParams.Distances || jobParams.Field , units: jobParams.Units }),
            "tags": string.substitute(this.i18n.itemTags, {layername: this.originsLayer.name, destnlayername: this.destinationsLayer.name}),
            "snippet": this.i18n.itemSnippet
          };
          if(this.showSelectFolder) {
            executeObj.itemParams.folder = this.get("folderId");
          }        
          //console.log(executeObj);
          //AnalysisBase submit method
          //this._saveBtn.set("disabled", false);
          this.execute(executeObj);
        },

        _save: function() {},
          
        _buildUI: function() {
           var override = true;
           AnalysisUtils.initHelpLinks(this.domNode, this.showHelp);
           domStyle.set(this._chooseFolderRow, "display", this.showSelectFolder === true? "block" : "none");
           if(this.showSelectFolder) {
             this.getFolderStore().then(lang.hitch(this, function(folderStore) {
                this.folderStore = folderStore;
                AnalysisUtils.setupFoldersUI({
                  folderStore: this.folderStore,
                  folderId: this.folderId,
                  folderName: this.folderName,
                  folderSelect: this._webMapFolderSelect,
                  username: this.portalUser ? this.portalUser.username: ""
                });
              }));        
           }
           
           domStyle.set(this._chooseExtentDiv, "display", this.showChooseExtent === true? "inline-block" : "none");
           if(!this.get("enableTravelModes")) {
             this._updateTravelModes(this.enableTravelModes);
           }           
           if(this.measurementType) {
             this._measureMethodSelect.set("value", this.measurementType);
             this._handleMeasurementTypeChange(this.measurementType);
           }
           if(this.get("showSelectAnalysisLayer")) {
             if(!this.get("originsLayer") && this.get("originsLayers")) {
               this.set("originsLayer", this.originsLayers[0]);
             }
             AnalysisUtils.populateAnalysisLayers(this, "originsLayer", "originsLayers");
           }
           if(this.outputLayerName) {
              this._outputLayerInput.set("value", this.outputLayerName);
              override = false;
           }
           if(this.originsLayer) {
             this._updateAnalysisLayerUI(override);
           }
           AnalysisUtils.addReadyToUseLayerOption(this, [this._analysisSelect, this._destPointLyrSelect]);          
           this._loadConnections();
         },
      
         _updateAnalysisLayerUI: function(override) {
           domAttr.set(this._tripCalToolDescription, "innerHTML", string.substitute(this.i18n.toolDefine, {layername: this.originsLayer.name}));
           if(this.featureLayers) {
             //re-filter 
             this.set("featureLayers", this.featureLayers);
             this._destPointLyrSelect.removeOption(this._destPointLyrSelect.getOptions());
             array.forEach(this.featureLayers, function(layer , index) {
               this._destPointLyrSelect.addOption({value:index+1, label:layer.name});
               if(this.destinationsLayer && this.destinationsLayer === layer) {
                 this._destPointLyrSelect.set("value", this.destinationsLayer);
               }
             }, this);
             this._destPointLyrSelect.addOption({type:"separator", value:""});
             this._destPointLyrSelect.addOption({value:"browse", label: this.i18n.browseAnalysisTitle});  
           }
           if(!this.destinationsLayer) {
             this._destPointLyrSelect.set("value", 1);
             this.set("destinationsLayer", this.featureLayers[0]);  
           }
           if((this.originsLayer  && this.originsLayer.graphics && this.originsLayer.graphics.length <= 1) || (this.destinationsLayer && this.destinationsLayer.graphics && this.destinationsLayer.graphics.length <= 1)) {
             domStyle.set(this._routeIdRow, "display", "none");
           }
           else {
             domStyle.set(this._routeIdRow, "display", "table");
           }
           if((this.originsLayer  && this.originsLayer.graphics && this.originsLayer.graphics.length > 1) || this.originsLayer.analysisReady) {
             var fields = this.originsLayer.fields;
             this._originRouteIdSelect.removeOption(this._originRouteIdSelect.getOptions());
             array.forEach(fields, function(field, index) {
               if(array.indexOf(["esriFieldTypeSmallInteger", "esriFieldTypeInteger", "esriFieldTypeSingle", "esriFieldTypeString", "esriFieldTypeDate"], field.type) !== -1 ) {
                 this._originRouteIdSelect.addOption({value:field.name, label:esriLang.isDefined(field.alias) && field.alias !== ""? field.alias : field.name});
               }
             } , this);
             if(this.originsLayerRouteIDField ) {
               this._orginRouteIdSelect.set("value", this.originsLayerRouteIDField );
             }
           }
           if(override && this._destPointLyrSelect.get("value") && this._destPointLyrSelect.get("value") !== "browse") {
             this.set("outputLayerName", string.substitute(this.i18n.outputLayerName, {
               layername: this.originsLayer.name,
               destnlayername: this.featureLayers[this._destPointLyrSelect.get("value") - 1].name
             }));             
           }
         },
      
        _handleAnalysisLayerChange: function(value) {
          var newOrginsLayer, copyFLayers, isCurLayerPresent;
          if(value === "browse") {
            if(!this._analysisquery) {
              this._analysisquery = this._browsedlg.browseItems.get("query");
            }        
            this._browsedlg.browseItems.set("query", this._analysisquery + " AND tags:\"point\"");
            this._isAnalysisSelect = true;
            this._browsedlg.show();
          }
          else {
            newOrginsLayer = this.originsLayers[value];
            copyFLayers = this.featureLayers.slice();
            isCurLayerPresent = array.some(copyFLayers, function(layer) {
              return layer === this.originsLayer;
            }, this);
            if(!isCurLayerPresent) {
              copyFLayers.push(this.originsLayer);
            }
            this.originsLayer = newOrginsLayer;
            this.set("featureLayers", copyFLayers);
            this.destinationsLayer = null;
            this.originsLayerRouteIDField = null;
            this.outputLayerName = null;
            this._updateAnalysisLayerUI(true);
          }
        },
         
        //setters/getters
        _setAnalysisGpServerAttr: function(url) {
          if(!url) {
            return;
          }
          this.analysisGpServer = url;
          this.set("toolServiceUrl", this.analysisGpServer +  "/" + this.toolName);
        },
      
        _setOriginsLayerAttr: function(layer) {
          if(esriLang.isDefined(layer) && layer.geometryType === "esriGeometryPoint") {
           this.originsLayer  = layer;
          }
        },
        
        _getOriginsLayerAttr: function() {
          return this.originsLayer;
        },
      
        _setOriginsLayersAttr: function(layers) {
           this.originsLayers  = layers;
        },
        
        _setFeatureLayersAttr: function(layers) {
          this.featureLayers = array.filter(layers, function(layer) {
            var isOriginsLayer = esriLang.isDefined(this.originsLayer) ? (layer === this.originsLayer) : false;
            if(!isOriginsLayer && layer && layer.geometryType && layer.geometryType === "esriGeometryPoint") {
              return true;
            }
          }, this);
        },
        
        _getFeatureLayersAttr: function(layers) {
          return this.featureLayers;
        },

        _setDisableRunAnalysisAttr: function(value){
          this._saveBtn.set("disabled", value);
        },
            
        validateServiceName: function(value) {
          return AnalysisUtils.validateServiceName(value, {textInput: this._outputLayerInput});
        },
        
        _setMeasurementTypeAttr: function(type) {
          //console.log("type is", type);
          this.measurementType = type;
        },

        _getMeasurementTypeAttr: function() {
          return this.measurementType;
        },    

        _setDistanceDefaultUnitsAttr: function(value) {
          this.distanceDefaultUnits = value;
        },
          
        _getDistanceDefaultUnitsAttr: function() {
          return this.distanceDefaultUnits;
        }, 
        
        _setDestinationsLayerAttr: function(value) {
          this.destinationsLayer = value;
        },
          
        _getDestinationsLayerAttr: function() {
          if(this._destPointLyrSelect) {
            this.destinationsLayer = this.featureLayers[this._destPointLyrSelect.get("value") - 1];
          }
          return this.destinationsLayer;
        },
        
        _setOriginsLayerRouteIDFieldAttr: function(value) {
          this.originsLayerRouteIDField  = value;
        },
          
        _getOriginsLayerRouteIDFieldAttr: function() {
          if(this._originRouteIdSelect && this._isRouteIdAvailable()) {
            this.originsLayerRouteIDField  = this._originRouteIdSelect.get("value");
          }
          return this.originsLayerRouteIDField;
        },
        
        _setDestinationsLayerRouteIDFieldAttr: function(value) {
          this.destinationsLayerRouteIDField = value;
        },
          
        _getDestinationsLayerRouteIDFieldAttr: function() {
          if(this._destnRouteIdSelect && this._isRouteIdAvailable) {
            this.destinationsLayerRouteIDField = this._destnRouteIdSelect.get("value");
          }
          return this.destinationsLayerRouteIDField;
        },
        
        _setOutputLayerNameAttr: function(str) {
           this.outputLayerName = str;
           if(this._outputLayerInput) {
             this._outputLayerInput.set("value", this.outputLayerName);
           }
        },
        
        _setEnableTravelModesAttr: function(value) {
          this._set("enableTravelModes", value);
        },
      
        _setFolderIdAttr: function(value) {
          this.folderId = value;
        },

        _getFolderIdAttr: function() {
          if(this._webMapFolderSelect && this.folderStore) {
            this.folderId = this._webMapFolderSelect.item ? this.folderStore.getValue(this._webMapFolderSelect.item, "id") : "";
          }
          return this.folderId;
        },

        _setFolderNameAttr: function(value) {
          this.folderName = value;
        },

        _getFolderNameAttr: function() {
          if(this._webMapFolderSelect && this.folderStore && this._webMapFolderSelect.item) {
            this.folderName = this.folderStore.getValue(this._webMapFolderSelect.item, "name");
          }
          return this.folderName;
        },
        ////////////////////////////
        // Helpers
        ////////////////////////////
        _loadConnections: function(){
          this.on("start", lang.hitch(this, "_onClose", true));
          this._connect(this._closeBtn, "onclick", lang.hitch(this, "_onClose", false));
          connection.connect(this._measureMethodSelect, "onChange", lang.hitch(this, this._handleMeasurementTypeChange)); 
          this.watch("enableTravelModes", lang.hitch(this, function(prop, oldValue, value) {
            this._updateTravelModes(value);
          }));
        },

        _connect: function(node, evt, func){
          this._pbConnects.push(connection.connect(node, evt, func));
        },
      
        _handleBrowseItemsSelect: function(value) {
          if(value && value.selection) {
            AnalysisUtils.addAnalysisReadyLayer({
              item: value.selection,
              layers:  this._isAnalysisSelect? this.originsLayers : this.featureLayers,
              layersSelect: this._isAnalysisSelect? this._analysisSelect : this._destPointLyrSelect,
              posIncrement: this._isAnalysisSelect? 0: 1,
              browseDialog: this._browsedlg
            }).always(lang.hitch(this, function() {
              this._handleAnalysisLayerChange(this._analysisSelect.get("value"));
            }));
          }
        },      
        
        _handleDestnRouteIdChange: function(value) {
          if(!this._autoSelRtId) {
            if(esriLang.isDefined(this._originRouteIdSelect.getOptions(value))) {
              this._autoSelRtId = true;
              this._originRouteIdSelect.set("value", value);
            }
          }        
        },
      
        _handleOriginRouteIdChange: function(value) {
          if(!this._autoSelRtId) {
            if(esriLang.isDefined(this._destnRouteIdSelect.getOptions(value))) {
              this._autoSelRtId = true;
              this._destnRouteIdSelect.set("value", value);
            }
          }
        },

        _handleMeasurementTypeChange: function(type){
          var isDrivingTime = (type === "DrivingTime");
          this.set("measurementType", type);
          domStyle.set(this._useTrafficLabelRow, "display", isDrivingTime? "" : "none");
          this._trafficTimeWidget.set("disabled", !isDrivingTime);
          this._trafficTimeWidget.set("reset", !isDrivingTime);
        },
        
        _handleDestinationLayerChange: function(value) {
          //console.log("detLayer", value);
          var fields;
          if(value === "browse") {
            if(!this._analysisquery) {
              this._analysisquery = this._browsedlg.browseItems.get("query");
            }
            this._browsedlg.browseItems.set("query", this._analysisquery + " AND tags:\"point\"");
            this._isAnalysisSelect = false;
            this._browsedlg.show();
          }
          else {
            if(this._autoSelRtId) {
              this._autoSelRtId = false;
            }
            this._destnRouteIdSelect.removeOption(this._destnRouteIdSelect.getOptions());
            if((this.originsLayer.graphics && this.originsLayer.graphics.length > 1 && this.featureLayers[value-1].graphics.length > 1) || this.originsLayer.analysisReady) {
              if(this.featureLayers[value-1].graphics && this.originsLayer.graphics && this.featureLayers[value-1].graphics.length !== this.originsLayer.graphics.length) {
                //console.log("Layers must have the same number of records, or one layer must have one record only.");
                this._showMessages(this.i18n.inValidNumberRecordsMsg);
                this.set("disableRunAnalysis", true);
                domStyle.set(this._routeIdRow, "display", "none");
              }
              else {
                this._handleCloseMsg();
                domStyle.set(this._routeIdRow, "display", "table");
                this.set("disableRunAnalysis", false);
                //console.log(this.featureLayers[value-1].fields);
                fields = this.featureLayers[value-1].fields;
                array.forEach(fields, function(field, index) {
                  if(array.indexOf(["esriFieldTypeSmallInteger", "esriFieldTypeInteger", "esriFieldTypeSingle", "esriFieldTypeString", "esriFieldTypeDate"], field.type) !== -1 ) {
                    this._destnRouteIdSelect.addOption({value:field.name, label:esriLang.isDefined(field.alias) && field.alias !== ""? field.alias : field.name});
                  }
                } , this);
              }
            }
            else {
              domStyle.set(this._routeIdRow, "display", "none");
              this.set("disableRunAnalysis", false);
              this._handleCloseMsg();
            }
            this._outputLayerInput.set("value", string.substitute(this.i18n.outputLayerName, {
              layername: this.originsLayer.name,
              destnlayername: this.featureLayers[value-1].name
            }));
          }
        },
        
        _isRouteIdAvailable: function() {
          var isAvailable = false;
          if(this.originsLayer.graphics && this.originsLayer.graphics.length > 1 && this.featureLayers[this._destPointLyrSelect.get("value") - 1].graphics.length > 1) {
            if(this.originsLayer.graphics && this.originsLayer.graphics.length === this.featureLayers[this._destPointLyrSelect.get("value") - 1].graphics.length) {
              isAvailable = true;
            }
          }
          else if(this.originsLayer.analysisReady || this.featureLayers[this._destPointLyrSelect.get("value") - 1]) {
            isAvailable = true;
          }
          return isAvailable;
        },
        
        _showMessages: function(msg) {
          domAttr.set(this._bodyNode, "innerHTML", msg);
          fx.fadeIn({
            node: this._errorMessagePane,
            easing: easing.quadIn,
            onEnd: lang.hitch(this, function() {
              domStyle.set(this._errorMessagePane, {display: ""});
            })
          }).play();
          //window.setTimeout(lang.hitch(this, this._handleCloseMsg), 3000);
        },
      
        _handleCloseMsg: function(e) {
          if(e) {
            e.preventDefault();
          }
          fx.fadeOut({
            node: this._errorMessagePane,
            easing: easing.quadOut,
            onEnd: lang.hitch(this, function() {
              domStyle.set(this._errorMessagePane, {display: "none"});
            })
          }).play();
        },

        _updateTravelModes: function(enable) {
          var allOptions = this._measureMethodSelect.getOptions();
          array.forEach(allOptions, function(opt) {
            if(opt.value !== "StraightLine") {
              opt.disabled = !enable;
            }
          });
          this._measureMethodSelect.updateOption(allOptions);      
        }      
  });
  
  
  return ConnectOriginsToDestinations; 
});  
    
