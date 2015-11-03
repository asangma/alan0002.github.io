/******************************************
 * esri/widgets/analysis/PlanRoutes
 ******************************************/
define(
[ 
  "require",
  "../../core/declare",
  "dojo/_base/lang",
  "dojo/_base/array",
  "dojo/_base/Color",
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
  "dijit/form/NumberSpinner",
  "dijit/form/TimeTextBox",
  "dijit/form/DateTextBox",
  
  "../../kernel",
  "../../core/lang",
  "../../Graphic",
  "./AnalysisBase",
  "./_AnalysisOptions",
  "./CreditEstimator",
  "./utils",
  "./TrafficTime",
  "../../toolbars/draw",
  "../../PopupTemplate",
  "../../layers/FeatureLayer",
  "../../symbols/PictureMarkerSymbol",
  "dojo/i18n!../../nls/jsapi",
  "dojo/text!./templates/PlanRoutes.html"
], function(require, declare, lang, array, Color, connection, fx, has, string, domStyle, domAttr, domConstruct, query, domClass, easing, number, _WidgetBase,
   _TemplatedMixin, _WidgetsInTemplateMixin,  _OnDijitClickMixin, _FocusMixin, registry, Button, CheckBox, Form, Select, TextBox, ValidationTextBox, ContentPane, ComboBox, NumberSpinner, TimeTextBox, DateTextBox, 
   esriKernel, esriLang, Graphic, AnalysisBase, _AnalysisOptions, CreditEstimator, AnalysisUtils, TrafficTime, Draw, PopupTemplate, FeatureLayer, PictureMarkerSymbol, jsapiBundle, template) {
    var PlanRoutes = declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin,  _OnDijitClickMixin, _FocusMixin, _AnalysisOptions, AnalysisBase], {
        declaredClass: "esri.widgets.analysis.PlanRoutes",
  
        templateString: template,
        basePath: require.toUrl("."),
        esriDijitPath: require.toUrl(".."),
        widgetsInTemplate: true,
        
        stopsLayer: null,
        outputLayerName: null,
        
        distanceDefaultUnits: "Miles",
        returnToStart: true,
        limitMaxTimePerRoute: true,
        routeCount: null,
        maxStopsPerRoute: null,
        startLayer: null,
        endLayer: null,
        
        
        i18n: null,
        
        toolName: "PlanRoutes",
        helpFileName: "PlanRoutes",
        resultParameter:["routesLayer", "assignedStopsLayer", "unassignedStopsLayer"],
        getResultLyrInfos: true,
       
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
          lang.mixin(this.i18n, jsapiBundle.planRoutesTool);
          lang.mixin(this.i18n, jsapiBundle.toolbars);
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
        
        _onClose: function(undo){
         //if (undo) {
          //remove FCollection layer from map
          if(this._startDrawPointfLayer) {
            this.map.removeLayer(this._startDrawPointfLayer);
          }          
          if(this._endDrawPointfLayer) {
            this.map.removeLayer(this._endDrawPointfLayer);
          }
        //}
        this._startToolbar.deactivate();
        this._endToolbar.deactivate();
        this.emit("close", {"save": !undo}); //event
        },
        
        clear: function() {
          //remove FCollection layer from map
          if(this._startDrawPointfLayer) {
            this.map.removeLayer(this._startDrawPointfLayer);
          }          
          if(this._endDrawPointfLayer) {
            this.map.removeLayer(this._endDrawPointfLayer);
          }
          this._startToolbar.deactivate();
          this._endToolbar.deactivate();          
        },
        
        _toUpperFirstLetter: function(str) {
          return (str.slice(0,1).toUpperCase() + str.slice(1));
        },
        
        _handleShowCreditsClick: function(e) {
          e.preventDefault();
          var jobParams = {}, sLayer, eLayer;
          sLayer = this.get("startLayer");
          eLayer = this.get("returnToStart") || this.get("endLayer");
          //console.log(sLayer);
          //console.log(eLayer);
          if(!this._form.validate()) {
            return;
          }
          //stops point layer url or featureset
           
          jobParams.stopsLayer =  JSON.stringify(AnalysisUtils.constructAnalysisInputLyrObj(this.stopsLayer));
          jobParams.routeStartTime = this.get("routeStartTime");
          jobParams.routeCount = this.get("routeCount");  
          if(this.get("startLayer")) {
            jobParams.startLayer = JSON.stringify(AnalysisUtils.constructAnalysisInputLyrObj(this.get("startLayer")));
          }
          if(this._startLayerSelect.get("value") !== "DRAW") {
            jobParams.startLayerRouteIDField = this.get("startLayerRouteIDField");
          }
          jobParams.maxStopsPerRoute = this.get("maxStopsPerRoute");
          jobParams.maxRouteTime = this.get("maxRouteTime");  
          jobParams.stopServiceTime = this.get("stopServiceTime"); 
          jobParams.returnToStart = this.get("returnToStart");
          jobParams.travelMode = this._travelModeSelect.get("value");
          if(this.get("endLayer")) {
            jobParams.endLayer = JSON.stringify(AnalysisUtils.constructAnalysisInputLyrObj(this.get("endLayer")));
          }
          if(this._endLayerSelect.get("value") !== "DRAW") {
            jobParams.endLayerRouteIDField = this.get("endLayerRouteIDField");
          }
          //outputLayer
          if(!this.returnFeatureCollection) {
            jobParams.OutputName = JSON.stringify({
              serviceProperties : {
                name: this.get("outputLayerName")
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
          console.log(jobParams);        
          this.getCreditsEstimate(this.toolName, jobParams).then(lang.hitch(this, function(result){
            //cost: 2.12, Total records: 2120
            this._usageForm.set("content", result);
            this._usageDialog.show();
          }));
        },
        
        _handleSaveBtnClick: function(e) {
          //construct job params object
          var jobParams = {}, executeObj = {}, contextObj, sLayer, eLayer;
          sLayer = this.get("startLayer");
          eLayer = this.get("returnToStart") || this.get("endLayer");
          //console.log(sLayer);
          //console.log(eLayer);
          if(!this._form.validate() || !esriLang.isDefined(sLayer) || !esriLang.isDefined(eLayer)) {
            if(!esriLang.isDefined(sLayer) || !esriLang.isDefined(eLayer)) {
              this._showMessages(this.i18n.startEndPtsValidMsg);
            }
            return;
          }
          this._saveBtn.set("disabled", true);
          //stops point layer url or featureset 
          jobParams.stopsLayer =  JSON.stringify(AnalysisUtils.constructAnalysisInputLyrObj(this.stopsLayer));
          jobParams.routeStartTime = this.get("routeStartTime");
          jobParams.routeCount = this.get("routeCount");
          if(this.get("startLayer")) {  
            jobParams.startLayer = JSON.stringify(AnalysisUtils.constructAnalysisInputLyrObj(this.get("startLayer")));
          }
          if(this._startLayerSelect.get("value") !== "DRAW") {
            jobParams.startLayerRouteIDField = this.get("startLayerRouteIDField");
          }
          jobParams.maxStopsPerRoute = this.get("maxStopsPerRoute");
          jobParams.maxRouteTime = this.get("maxRouteTime");  
          jobParams.stopServiceTime = this.get("stopServiceTime"); 
          jobParams.returnToStart = this.get("returnToStart");
          jobParams.travelMode = this._travelModeSelect.get("value");
          if(this.get("endLayer")) {
            jobParams.endLayer = JSON.stringify(AnalysisUtils.constructAnalysisInputLyrObj(this.get("endLayer")));
          }
          if(this._endLayerSelect.get("value") !== "DRAW") {
            jobParams.endLayerRouteIDField = this.get("endLayerRouteIDField");
          }
          //outputLayer
          if(!this.returnFeatureCollection) {
            jobParams.OutputName = JSON.stringify({
              serviceProperties : {
                name: this.get("outputLayerName")
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
          console.log(jobParams);        
          
          executeObj.jobParams  = jobParams;
          
          executeObj.itemParams = { 
            "description" : string.substitute(this.i18n.itemDescription, { layername: this.stopsLayer.name, distance_field: jobParams.Distances || jobParams.Field , units: jobParams.Units }),
            "tags": string.substitute(this.i18n.itemTags, {layername: this.stopsLayer.name}),
            "snippet": this.i18n.itemSnippet
          };
          if(this.showSelectFolder) {
            executeObj.itemParams.folder = this.get("folderId");
          }        
          //console.log(executeObj);
          //AnalysisBase submit method
          this.execute(executeObj);
      
        },
        
        _handleResultLyrInputChange: function(value) {
          this.set("outputLayerName", value);
        },
        
        _save: function() {},
          
        _buildUI: function() {
           var override= true;
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
           if(this.get("showSelectAnalysisLayer")) {
             if(!this.get("stopsLayer") && this.get("stopsLayers")) {
               this.set("stopsLayer", this.stopsLayers[0]);
             }
             AnalysisUtils.populateAnalysisLayers(this, "stopsLayer", "stopsLayers");
           }
          AnalysisUtils.addReadyToUseLayerOption(this, [this._analysisSelect]);          
           if(this.outputLayerName) {
              this.outputLayerInput.set("value", this.outputLayerName);
              override = false;
           }
           if(this.stopsLayer) {
             this._updateAnalysisLayerUI(override);
           }          
           if(this.returnToStart) {
             this._returnStartCheck.set("value", this.returnToStart);
           }
           //this._handleEndLayerChange()
           //this._handleStartLayerChange()
           //this._endPointDrawBtn.set("disabled", true);
           //this._startPointDrawBtn.set("disabled", true);
           
           this._limitMaxTimeCheck.set("value", this.limitMaxTimePerRoute);
           this._handleLimitMaxTimeCheckChange(this.limitMaxTimePerRoute);
           
           //this._startTime.set("value", this._addMinutes(new Date(), 15));
           
           if(this.routeCount){
             this._routesInput.set("value", this.routeCount);
             //this._handleRoutesInputChange(this.routeCount);  
             //this._maxPtsRouteInput.set("value", this._calculatePointsPerRoute(this.routeCount));
           }
           if(this.maxStopsPerRoute) {
             this._maxPtsRouteInput.set("value", this.maxStopsPerRoute);
           }
           //@tbd
           /*if(this.stopServiceTime) {
           }
           if(this.routeStartTime) {
           }
           if (this.maxRouteTime) {
           }*/
           
           this._loadConnections();
         },
        
        _updateAnalysisLayerUI: function(override) {
          var startOptions = [
            {value: "DRAW", label: this.i18n.createStartLoc}
           ],
           stopOptions = [
             {value: "DRAW", label: this.i18n.createEndLoc}
           ];
           if(esriLang.isDefined(this.stopsLayer.queryCount)) {
             AnalysisUtils.getLayerFeatureCount(this.stopsLayer, {}).then(lang.hitch(this, function(count){
               this._stopsLayerCount = count;
               domAttr.set(this._numStopsLabel, "innerHTML", string.substitute(this.i18n.stopsLabel, {numStops: count}));  
             }), function(error) {
               console.log(error);
             });
           }
           if(override) {
             this.outputLayerName = string.substitute(this.i18n.outputLayerName, {layername: this.stopsLayer.name});
           }
           this._updateStops();
           this._handleExtentCheckChange(this.showChooseExtent);
           domAttr.set(this._toolDescription, "innerHTML", string.substitute(this.i18n.toolDefine, {layername: this.stopsLayer.name}));
           if(this.outputLayerName) {
             this._outputLayerInput.set("value", this.outputLayerName); 
           }
           if(this.featureLayers) {
             this._startLayerSelect.removeOption(this._startLayerSelect.getOptions());
             this._endLayerSelect.removeOption(this._endLayerSelect.getOptions());
             array.forEach(this.featureLayers, function(layer , index) {
               //select box 0,1
               startOptions.push({value:index+1, label:layer.name});
               stopOptions.push({value:index+1, label:layer.name});
             }, this);
             this._startLayerSelect.addOption(startOptions);
             this._endLayerSelect.addOption(stopOptions);
     
           }
           if(this.startLayer ) {
             this._startLayerSelect.set("value", this.startLayer );
             domStyle.set(this._startRouteIdRow, "display", "");
           }
           else {
             this._startLayerSelect.set("value", "DRAW");
             domStyle.set(this._startRouteIdRow, "display", "none");
           }
           if(this.endLayer ) {
             this._endLayerSelect.set("value", this.endLayer);
             domStyle.set(this._endRouteIdRow, "display", "");
           }
           else {
             this._endLayerSelect.set("value", "DRAW");
             domStyle.set(this._endRouteIdRow, "display", "none");
           }          
        },
      
        _handleAnalysisLayerChange: function(value) {
          var newStopsLayer, copyFLayers, isCurLayerPresent;
          if(value === "browse") {
            if(!this._analysisquery) {
              this._analysisquery = this._browsedlg.browseItems.get("query");
            }        
            this._browsedlg.browseItems.set("query", this._analysisquery + " AND tags:\"point\"");
            this._isAnalysisSelect = true;
            this._browsedlg.show();
          }
          else {
            newStopsLayer = this.stopsLayers[value];
            copyFLayers = this.featureLayers.slice();
            isCurLayerPresent = array.some(copyFLayers, function(layer) {
              return layer === this.stopsLayer;
            }, this);
            if(!isCurLayerPresent) {
              copyFLayers.push(this.stopsLayer);
            }
            this.stopsLayer = newStopsLayer;
            this.set("featureLayers", copyFLayers);
            this._updateAnalysisLayerUI(true);
          }
        },
          
        _addMinutes: function(date, minutes) {
          return new Date(date.getTime() + minutes*60000);
        },
        
        
        _loadConnections: function(){
          this.on("start", lang.hitch(this, "_onClose", false));
          this._connect(this._closeBtn, "onclick", lang.hitch(this, "_onClose", true));
        },
      
        _handleBrowseItemsSelect: function(value) {
          if(value && value.selection) {
            AnalysisUtils.addAnalysisReadyLayer({
              item: value.selection,
              layers:  this.stopsLayers,
              layersSelect:  this._analysisSelect,
              browseDialog: this._browsedlg
            }).always(lang.hitch(this, function() {
              this.set("stopsLayer", this.stopsLayers[this._analysisSelect.get("value")]);
              this._updateAnalysisLayerUI(true);
            }));
          }
        },      
        
        //sets the tool gp task url
        _setAnalysisGpServerAttr: function(url) {
          if(!url) {
            return;
          }
          this.analysisGpServer = url;
          this.set("toolServiceUrl", this.analysisGpServer +  "/" + this.toolName);
        },
      
        _setStopsLayerAttr: function(layer) {
          if(esriLang.isDefined(layer) && layer.geometryType === "esriGeometryPoint") {
           this.stopsLayer = layer;
          }
        },
        
        _getStopsLayerAttr: function() {
          return this.stopsLayer;
        },
      
        _setStopsLayersAttr: function(value) {
          this.stopLayers = value;
        },
      
        _setFeatureLayersAttr: function(layers) {
          this.featureLayers = array.filter(layers, function(layer) {
            //console.log("********************", this.stopsLayer);
            if((esriLang.isDefined(layer) && layer !== this.stopsLayer) && layer.geometryType === "esriGeometryPoint") {
              return true;
            }
          }, this);
          //console.log(this.featureLayers);
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
                    
        _setMapAttr: function(map) {
          this.map = map;
          this._startToolbar = new Draw(this.map);
          this._endToolbar = new Draw(this.map);
          connection.connect(this._startToolbar, "onDrawEnd", lang.hitch(this, this._addStartFeatures));
          connection.connect(this._endToolbar, "onDrawEnd", lang.hitch(this, this._addEndFeatures));
          this.map.on("extent-change", lang.hitch(this, this._updateStops));  
        },
        
        _getMapAttr: function() {
          return this.map;
        },   
        
        _setDistanceDefaultUnitsAttr: function(value) {
          this.distanceDefaultUnits = value;
        },
          
        _getDistanceDefaultUnitsAttr: function() {
          return this.distanceDefaultUnits;
        }, 

        _setReturnToStartAttr: function(val) {
          this.returnToStart = val;
        },
        
        _getReturnToStartAttr: function() {
          if(this._returnStartCheck) {
            this.returnToStart = this._returnStartCheck.get("checked");
          }
          return this.returnToStart;
        },
        
        _setStartLayerAttr: function(value) {
          this.startLayer  = value;
        },
          
        _getStartLayerAttr: function() {
          if(this._startLayerSelect) {
            if(this._startLayerSelect.get("value") === "DRAW") {
              if(this._startDrawPointfLayer && this._startDrawPointfLayer.graphics.length > 0) {
                this.startLayer = this._startDrawPointfLayer;
              }
              else {
                //this._startLayerSelect.set("value", "");
                this._startLayerSelect.validate();
              }
            }
            else if(this._startLayerSelect.get("value")) {
              this.startLayer = this.featureLayers[this._startLayerSelect.get("value") - 1];
            }
          }
          return this.startLayer ;
        },          
        
        
        _setEndLayerAttr: function(value) {
          this.endLayer = value;
        },
          
        _getEndLayerAttr: function() {
          if(this.get("returnToStart")) {
            this.endLayer = null; // automatically set the GP tool
          }
          else if(!this.get("returnToStart") && this._endLayerSelect) {
            if(this._endLayerSelect.get("value") === "DRAW") {
              if(this._endDrawPointfLayer && this._endDrawPointfLayer.graphics.length > 0) {
                this.endLayer = this._endDrawPointfLayer;
              }
              else {
                //this._endLayerSelect.set("value", "");
                this._endLayerSelect.validate();
              }              
            }
            else if(this._endLayerSelect.get("value")){
              this.endLayer = this.featureLayers[this._endLayerSelect.get("value") - 1];
            }
          }
          return this.endLayer;
        },
        
        _setLimitMaxTimePerRouteAttr: function(value) {
          this.limitMaxTimePerRoute = value;
        },
          
        _getLimitMaxTimePerRouteAttr: function() {
          if(this._limitMaxTimeCheck) {
            this.limitMaxTimePerRoute = this._limitMaxTimeCheck.get("value");
          }          
          return this.limitMaxTimePerRoute;
        },
        
        _setRouteCountAttr: function(value) {
          this.routeCount = value;
        },
          
        _getRouteCountAttr: function() {
          if(this._routesInput) {
            this.routeCount = this._routesInput.get("value");
          }
          return this.routeCount;
        },
        
        _setMaxStopsPerRouteAttr: function(value) {
          this.maxStopsPerRoute = value;
        },
          
        _getMaxStopsPerRouteAttr: function() {
          if(this._maxPtsRouteInput) {
            this.maxStopsPerRoute = this._maxPtsRouteInput.get("value");
          }
          return this.maxStopsPerRoute;
        },
        
        _setStopServiceTimeAttr: function(value) {
          this.stopServiceTime = value;
        },
          
        _getStopServiceTimeAttr: function() {
          if(this._servStopMinutesInput) {//_servStopMinutesInput _servStopsSecondsInput
            this.stopServiceTime = this._servStopMinutesInput.get("value") + (this._servStopsSecondsInput.get("value") / 60);
          }
          return this.stopServiceTime;
        },
        
        _setMaxRouteTimeAttr: function(value) {
          this.maxRouteTime = value;
        },
          
        _getMaxRouteTimeAttr: function() {
          if(this._limitMaxTimeCheck.get("checked")) {
            this.maxRouteTime  = this._hoursInput.get("value") * 60 + this._minutesInput.get("value");
          }
          return this.maxRouteTime ;
        },
        
        _setRouteStartTimeAttr: function(value) {
          this.routeStartTime = value;
        },
          
        _getRouteStartTimeAttr: function() {
          if(this._startDay) {
            var startDay, startTime, startDayStr, startTimeStr, utcRouteStartStr, utcRouteStartTime;
            startDay = this._startDay.get("value");
            startTime = this._startTime.get("value");
            startDayStr = startDay.toDateString();
            startTimeStr = startTime.toTimeString();
            if(startTimeStr.indexOf("GMT") !== -1) {
              utcRouteStartStr =  startDayStr + " " + startTimeStr.substring(0, startTimeStr.indexOf("GMT") + "GMT".length);
            }
            else {
              //startTimeStr "18:20:00 PST" in IE8/9 date format strings are different
              utcRouteStartStr =  startDayStr + " " + startTimeStr.split(" ")[0]+ " GMT";
            }
            /*console.log(startDay);
            console.log(startDayStr);
            console.log(startTime);
            console.log(startTimeStr);
            console.log(utcRouteStartStr);*/
            utcRouteStartTime = new Date(utcRouteStartStr);
            this.routeStartTime = utcRouteStartTime.getTime();
            /*console.log(this.routeStartTime);
            console.log(new Date(this.routeStartTime));*/
            
          }
          return this.routeStartTime ;
        },

        _setEndLayerRouteIDFieldAttr: function(value) {
          this.endLayerRouteIDField = value;
        },
          
        _getEndLayerRouteIDFieldAttr: function() {
          if(!this.get("returnToStart")) {
            this.endLayerRouteIDField  = this._endRouteIdSelect.get("value");
          }
          return this.endLayerRouteIDField;
        },
        
        _setStartLayerRouteIDFieldAttr: function(value) {
          this.startLayerRouteIDField = value;
        },
          
        _getStartLayerRouteIDFieldAttr: function() {
          if(this._startRouteIdSelect) {
            this.startLayerRouteIDField  = this._startRouteIdSelect.get("value");
          }
          return this.startLayerRouteIDField;
        },
      
        _getOutputLayerNameAttr: function() {
          if(this._outputLayerInput) {
            this.outputLayerName = this._outputLayerInput.get("value");
          }
          return this.outputLayerName;
        },

        _setOutputLayerNameAttr: function(value) {
          this.outputLayerName = value;
        },       
      
        _setFolderIdAttr: function(value) {
          this.folderId = value;
        },

        _getFolderIdAttr: function() {
          if(this._webMapFolderSelect && this.folderStore && this._webMapFolderSelect.item) {
            this.folderId = this._webMapFolderSelect.item ? this.folderStore.getValue(this._webMapFolderSelect.item, "id") : "";
          }
          return this.folderId;
        },

        _setFolderNameAttr: function(value) {
          this.folderName = value;
        },

        _getFolderNameAttr: function() {
          if(this._webMapFolderSelect && this.folderStore) {
            this.folderName = this.folderStore.getValue(this._webMapFolderSelect.item, "name");
          }
          return this.folderName;
        },        
                        
            
        ////////////////////////////
        // Helpers
        ////////////////////////////
        _connect: function(node, evt, func){
          this._pbConnects.push(connection.connect(node, evt, func));
        },
        
        _handleStartDrawBtnChange : function(value) {
          if(value) {
            this.emit("drawtool-activate", {});
            this._endPointDrawBtn.set("checked", false); //reset
            this.i18n.draw.addPoint = this.i18n.addPoint;
            if(!this._startDrawPointfLayer) {
              this._startDrawPointfLayer = this._createPointFeatColl("startDrawPoint");
            }
            else {
              if(this._startDrawPointfLayer.graphics.length) {
                this.i18n.draw.addPoint = this.i18n.movePoint;  
              }
            }
            this._startToolbar.activate(Draw.POINT);
          }
          else {
            this._startToolbar.deactivate();
            if(!this._endPointDrawBtn.get("checked")) {
              this.emit("drawtool-deactivate", {});
            }

          }
        },        
        
        _handleEndDrawBtnChange : function(value) {
          if(value) {
            this.emit("drawtool-activate", {});
            this._startPointDrawBtn.set("checked", false); //reset
            this.i18n.draw.addPoint = this.i18n.addPoint;
            if(!this._endDrawPointfLayer) {
              this._endDrawPointfLayer = this._createPointFeatColl("endDrawPoint");
            }
            else {
              if(this._endDrawPointfLayer.graphics.length) {
                this.i18n.draw.addPoint = this.i18n.movePoint;
              }
            }          
            this._endToolbar.activate(Draw.POINT);
          }
          else {
            this._endToolbar.deactivate();
            if(!this._startPointDrawBtn.get("checked")) {
              this.emit("drawtool-deactivate", {});
            }
          }
        },
        
        _handleStartLayerChange: function(value) {
          //console.log("startlayer" , value);
          var fields;
          if(value && value !== "DRAW" && this.featureLayers[value-1].graphics && this.featureLayers[value-1].graphics.length > 1) {
            if(this.map.getLayer("startDrawPoint")) {
              this.map.getLayer("startDrawPoint").hide();
            }
            domStyle.set(this._startRouteIdRow, "display", "");
            this._startPointDrawBtn.set("disabled", true);
            this._startPointDrawBtn.set("checked", false);
            //console.log(this.featureLayers[value-1].fields);
            fields = this.featureLayers[value-1].fields;
            this._startRouteIdSelect.removeOption(this._startRouteIdSelect.getOptions());
            array.forEach(fields, function(field, index) {
              if(array.indexOf(["esriFieldTypeSmallInteger", "esriFieldTypeInteger", "esriFieldTypeSingle", "esriFieldTypeString", "esriFieldTypeDate"], field.type) !== -1 ) {
                this._startRouteIdSelect.addOption({value:field.name, label:esriLang.isDefined(field.alias) && field.alias !== ""? field.alias : field.name});
              }
            } , this);
          }
          else if(value && value === "DRAW") {
            if(this.map.getLayer("startDrawPoint")) {
              this.map.getLayer("startDrawPoint").show();
            }
            this._startPointDrawBtn.set("disabled", false);
            domStyle.set(this._startRouteIdRow, "display", "none");
          }
          else {
            this._startPointDrawBtn.set("disabled", true);
            domStyle.set(this._startRouteIdRow, "display", "none");
            if(this.map.getLayer("startDrawPoint")) {
              this.map.getLayer("startDrawPoint").hide();
            }            
          }
          this._startLayerSelect.validate(true);
        },
        
        _handleEndLayerChange: function(value) {
          //console.log("endLayer", value);
          var fields, returnToStart;
          returnToStart = this.get("returnToStart");
          if(value && value !== "DRAW" && this.featureLayers[value-1].graphics && this.featureLayers[value-1].graphics.length > 1) {
            domStyle.set(this._endRouteIdRow, "display", "");
            this._endPointDrawBtn.set("disabled", true);
            this._endPointDrawBtn.set("checked", false);
            if(this.map.getLayer("endDrawPoint")) {
              this.map.getLayer("endDrawPoint").hide();
            }            
            //console.log(this.featureLayers[value-1].fields);
            fields = this.featureLayers[value-1].fields;
            this._endRouteIdSelect.removeOption(this._endRouteIdSelect.getOptions());
            array.forEach(fields, function(field, index) {
              if(array.indexOf(["esriFieldTypeSmallInteger", "esriFieldTypeInteger", "esriFieldTypeSingle", "esriFieldTypeString", "esriFieldTypeDate"], field.type) !== -1 ) {
                this._endRouteIdSelect.addOption({value:field.name, label:esriLang.isDefined(field.alias) && field.alias !== ""? field.alias : field.name});
              }
            } , this);
          }
          else if(value && value === "DRAW") {
            if(this.map.getLayer("endDrawPoint")) {
              this.map.getLayer("endDrawPoint").show();
            }
            this._endPointDrawBtn.set("disabled", returnToStart); 
            domStyle.set(this._endRouteIdRow, "display", "none");
          }
          else {
            this._endPointDrawBtn.set("disabled", true);
            domStyle.set(this._endRouteIdRow, "display", "none");
            if(this.map.getLayer("endDrawPoint")) {
              this.map.getLayer("endDrawPoint").hide();
            }             
          }
          this._endLayerSelect.set("disabled", returnToStart);
          this._endRouteIdSelect.set("disabled", returnToStart);
          if(returnToStart) {
            domStyle.set(this._endRouteIdRow, "display", "none");
          }
          this._endLayerSelect.validate(true);

        },
        
        /*_calculatePointsPerRoute: function(routes) {
          //console.log("stopsLayer feature count ==> ", this.stopsLayer.graphics.length);
          //console.log("no. of routes ==> ", routes);
          //console.log(Math.ceil(this.stopsLayer.graphics.length/routes));
          return Math.ceil(this._stopsLayerCount/routes);
        },*/
        
        _handleRoutesInputChange: function(value) {
          //this._maxPtsRouteInput.set("value", this._calculatePointsPerRoute(value));
        },
        
        _handleReturnStartCheckChange: function(value) {
          //console.log("param val", value);
          this._handleEndLayerChange( this._endLayerSelect.get("value"));
        },
        
        _handleLimitMaxTimeCheckChange: function(value) {
          this._hoursInput.set("disabled", !value);
          this._minutesInput.set("disabled", !value);
        },
        
        _handleExtentCheckChange: function(value) {
          domClass.toggle(this._numStopsExtentLabel, "disabled", !value);
        },
        
        _createPointFeatColl: function(layerName) {
          var popupTemplate , featureCollection, flayer;
          featureCollection = {
            "layerDefinition": null,
            "featureSet": {
              "features": [],
              "geometryType": "esriGeometryPoint"
            }
          };
          featureCollection.layerDefinition = {
            "currentVersion": 10.11,
            "copyrightText": "",
            "defaultVisibility": true,
            "relationships": [],
            "isDataVersioned": false,
            "supportsRollbackOnFailureParameter": true,
            "supportsStatistics": true,
            "supportsAdvancedQueries": true,
            "geometryType": "esriGeometryPoint", 
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
          popupTemplate = new PopupTemplate({
            title: "{title}",
            description:"{description}"
          });
          
          //create a feature layer based on the feature collection
          flayer = new FeatureLayer(featureCollection, {
            id: layerName
          });
          this.map.addLayer(flayer);
          //associate the features with the popup on click
          connection.connect(flayer,"onClick",lang.hitch(this, function(evt){
             this.map.popup.setFeatures([evt.graphic]);
          }));
          return flayer;
        },
      
        _addStartFeatures: function(geometry) {
          //this.emit("drawtool-deactivate", {});
          //this._startToolbar.deactivate();
          var features = [], attr, startSymbol, graphic, curFeatures = [];
          attr = {};
          startSymbol = new PictureMarkerSymbol({
                    "url": this.esriDijitPath + "/images/Directions/greenPoint.png",
                    "height": 21.75,
                    "width": 15.75,
                    "imageData": "iVBORw0KGgoAAAANSUhEUgAAABUAAAAdCAYAAABFRCf7AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyRpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYxIDY0LjE0MDk0OSwgMjAxMC8xMi8wNy0xMDo1NzowMSAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNS4xIE1hY2ludG9zaCIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo4OTI1MkU2ODE0QzUxMUUyQURFMUNDNThGMTA3MjkzMSIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDo4OTI1MkU2OTE0QzUxMUUyQURFMUNDNThGMTA3MjkzMSI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOjg5MjUyRTY2MTRDNTExRTJBREUxQ0M1OEYxMDcyOTMxIiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOjg5MjUyRTY3MTRDNTExRTJBREUxQ0M1OEYxMDcyOTMxIi8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+iVNkdQAABJlJREFUeNp0VltvG0UUnpkdr72261CnCQWEIA9FqOKlqooARUKCtAUhoA+VoBVRhfgFXKSKJ97goRL8ARCIclGgL0VUkBBAoBaVoggEQQVSAhFS06SJje3Y3t25cc7srL3YjddHs3N85pvvfOfMyJRs83n8o+P7POI9yQibooTeBa68ISbSRv+hifpCGHX2s6dnfrrRWjroOPzB0T0+zZ0q8uDRSrniF/MB8X2fADhR8IRRRDphh7Q6rbgtOucU0Sdnj59Z2hb00PtHD+Zp/p2x6uitO4o7iLYP8DMafjVE2wXUboALm50W2ahtXO3q8MTX02fnh0Affu/IkSAXnL55dLzMPU6kURZMIZQhFtRk2VBKcpQTIQVZ21hrdUX4zDcnPv2kBzr59mP3BLnChfGx8YrHPKIAELSzMPhQk+ydzpOvIYwywjFeK7K+vt6IlZw8/+y5RZ4gm9eCUrGCmkUyBkCV0Sd5UlBtTLIhRWQE9ixwsVwe6dY3X4WwJ+j9bx7a7/v5i6O7qlxisFZJAvBF7Rjty56CWlmszilj6BNgXd+syTCO7uNK62nuezyUkWWASTPHDtOjbgOHkJTOsbXAyJhIC+rlODdROM211gcQKBJxoh+EKAs4AGqybHVfBvdICNIU/IDHYbcJiS6le4wwbW1B9UDXJcg9QBxtbglh1BlAJzjoUxIGQZFRwtAypgnjtH0spDG9MWVs34xrN5uBLnEoTKQUgDLgZ6hliLunBaIDhy4LYhyotptZlphGyLUhfyspxxj3AIpaVqikdgyzoGn7p0xNj71rNamweCscWC0qoQ8YRm3K2OgpeFoc+j9FSUYKB+4OgxIK4RcZUJ6RsUgqCrShxWzza9035aw/lzYGY5P4xFSMR5vMcFpm87opL4HjXsr76dLhC2xYhgx3I0BfoS7RCp+3K/e8vn+Ke2zWK+cYofQG9yMlw1eK1aAni9oSWil9eOmFhXkPnbXZ1eXqwVsirfQU9Vynm75lymLbxvpSP4yqI4iR5uWlFxdOI56Xbro5t3qhOrW7ZmL1EOFwp7k6pRXuWaZgBmuwJSIl1fNXXvrxjRTLy2ZTm1v9YeTBXedNbCYZZ1U4pdt+NGiomuKKEvKp5ZM/f5z9zctc1vju1b9cv5q/M/icBd4+KNztlnGWKfYjAMqm+K7zZ/PYP6d+X3TrafbmR8N71QcrOPMLd5RGdj838WFup393orNLWRki6vFv197661i40m6AKwYLneG79BzDPNhNYFWwnfguGyKgPl32bwseoTnKekVpS9n49vorWwv1JsSVwAJHCHcW2Agsk3rBBZXBihhcn11biTfDixpPik1bEZyj34EVXXzJrUccWwrbZo5+B6ztRpvO1kLjjO5qW3YccZ5JeTAecQxqqV0Q6hM5KVIrNL5a/77yQPUyLbK9qiMv49zFhW6MMnPE0dwxlQ48ckXDNHJOq0C2xByreHtxhPk1sK4DEI5dut7+QWCZCyj9MXKLWmD/gl1Xtfhd6F2CI86dv+XiIrdOpeeCDd0VyW7KGbLptn9p/mrgNsIxwzKN0QO3IvlPgAEA3AQhIZtaN54AAAAASUVORK5CYII=",
                    "contentType": "image/png",
                    "type": "esriPMS"
                }).setOffset(0, 10.875);
          graphic = new Graphic(geometry, startSymbol);
          this.map.graphics.add(graphic);
          attr.description = "blayer desc";
          attr.title = "blayer";
          graphic.setAttributes(attr);
          features.push(graphic);
          if(this._startDrawPointfLayer.graphics.length > 0) {
            curFeatures = this._startDrawPointfLayer.graphics;
          }
          this._startDrawPointfLayer.applyEdits(features, null, curFeatures);
        },
        
        _addEndFeatures: function(geometry) {
          //this.emit("drawtool-deactivate", {});
          //this._endToolbar.deactivate();
          var features = [], attr, endSymbol, graphic, curFeatures = [];
          attr = {};
          endSymbol = new PictureMarkerSymbol({
                    "url": this.esriDijitPath + "/images/Directions/redPoint.png",
                    "height": 21.75,
                    "width": 15.75,
                    "imageData": "iVBORw0KGgoAAAANSUhEUgAAABUAAAAdCAYAAABFRCf7AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyRpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYxIDY0LjE0MDk0OSwgMjAxMC8xMi8wNy0xMDo1NzowMSAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNS4xIE1hY2ludG9zaCIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDoyNEZDQTg5MTE0QzYxMUUyQURFMUNDNThGMTA3MjkzMSIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDoyNEZDQTg5MjE0QzYxMUUyQURFMUNDNThGMTA3MjkzMSI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOjg5MjUyRTZBMTRDNTExRTJBREUxQ0M1OEYxMDcyOTMxIiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOjI0RkNBODkwMTRDNjExRTJBREUxQ0M1OEYxMDcyOTMxIi8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+pmgrrgAABHNJREFUeNqEVU2IHEUUflVd3fO/P3FWRPAQ0EVWL2FZFBS8REgQXD0GDILg0Zsgbg7ezCFXb15iFCUigkJAzF5y0RgQPUyIRBFz2SxusszO7uxMd1e953vV1TM9m6gF31S96qqvvvdTNerH9RWQFtUSUCYCRWwkddAAJ8iYdVD6JIJa5tkaAKUK8bZCexWc/QYJflXO8jADcsRAz2XgwfYU4wI1Wqebnfmk1mhCnNSYWwFZB3meLo0Phy+M9gcbcLh/hde+x/i9SnCU9GWXNC8udLuPN9sdYBo+PQcYsxIivyDmLmk2oNNsJMNB4/X+/XvPKZu9yZ82H0b6mo7rn3aXum1jYqDDAyBEJitcgkDKA/+rlIZmLYaEBezu2K/taPQGT39bJX2WVPTJ4tx828coTZnQFQRCptSE2B9STjGxYgGLC4udnSy7BA5f5NmeQSZRcXy+02rOKbJAo5FXyDsKqFlSD/6O3CsZRxp0ZKDTas33x/c+JGtfFaWrURSdqvFHPBwWhJ5DsRDt1UzaRCmDM83BAZULcQR1HUFkzGlr7aoh587WtTaUjv3igrQgJNRTlWXzXkgCOTwcIpTD2Vs5nInNAdFZw1ldY42AWeozrLzLvI1JJRmeVFAmqlSLQYDYIEJYqfA4WhOlxyPLsdQhL56ECWWTJ62onBQAToiLsZzrIPJn4HHDdovyHFCrEMciOQV5KKcJM01DMFFMRTjYxiKJLYPWpSRKhcTHUQiwIC8KcjamvgKguAyEwUZvyzVFpLFRSH9Z65Zizr4vESjJS8KH+F+WFk1VinrHqpnvDpcU9XKHawZKlzkEhLNk1TqtHEAz5AC58zHuac7W5bHF4EVwwbtRAZePx4yNfq3fE/YKD5K6rLsRbubO3citmyTA9+j+A/gAZH+OeEP4pJAcB+PcAc/4U0u4CsIlmtqzEPX71gf1nPCVd3Azc7ixl/Fjwq5R6dpRhPAUISrC4RiDjFU62iifv0k2Np9/VMrzHa6kC3NG1yIF/9tYNAwsps7hu/ywfHTy+t8zVT3J85XVYy/FWn88H+snE/3vzOwZ7Fn6g6P29is/716r3De+rtMrI+Po87ujrZWW+Y7VnkgUPBGV5VlBxhJ3c/rhl73szFu9fm/6Tk7JVHisE0Y9IHmmbebPL8998VgSPW0qgi2Tbmfut/dvD87cPLB7IpoxDpCxjYJC/qeEBcYxxqKMdzJs1BT8udzQp+r8Dhd3naCfO/vl9viDq/ezAa9rMRpBkBydl9kvXa+HRW1GUxZf3Brd2UrxeuqKApdebJkPZM2wvhX2RxCedfK1Wsg/ZAxD791hRV8NnX80QXqxKy4fXe//2Ix/kopFEp80hKJE/bPt0U/rjyS32lqt7GV4S+ywbhz6tGILD5qg1AbyNCRN3IhDrBp9S98vIa1Iz/Y2YxQI8qCu3O//a3TlTSs/pmHTPqPP2LmbuUsST+nFDvP7YV0a9rmyVvWRmqZwmgsQNaNr/fwmP+MgfUVluQarhS/tHwEGAEyHOx7EoDsBAAAAAElFTkSuQmCC",
                    "contentType": "image/png",
                    "type": "esriPMS"
                }).setOffset(0, 10.875);
          graphic = new Graphic(geometry, endSymbol);
          this.map.graphics.add(graphic);
          attr.description = "blayer desc";
          attr.title = "blayer";
          graphic.setAttributes(attr);
          features.push(graphic);
          if(this._endDrawPointfLayer.graphics.length > 0) {
            curFeatures = this._endDrawPointfLayer.graphics;
          }          
          this._endDrawPointfLayer.applyEdits(features, null, curFeatures);  
        },
        
        _updateStops: function () {
          //if(this._useExtentCheck.get("checked")) {
            var params = {};
            params = {
              geometry: this.map.extent.getExtent()
            };
            if(esriLang.isDefined(this.stopsLayer) && esriLang.isDefined(this.stopsLayer.queryCount)) {
              AnalysisUtils.getLayerFeatureCount(this.stopsLayer, params).then(lang.hitch(this, function(count){
                console.log(count);
                domAttr.set(this._numStopsExtentLabel, "innerHTML", string.substitute(this.i18n.stopsLabelByExtent, {numStops: count}));  
              }), function(error) {
                console.log(error);
              });
            }
          //}
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
        }
  });
  
  
  return PlanRoutes; 
});  
    



