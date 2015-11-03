/******************************************
 * esri/widgets/analysis/CreateDriveTimeAreas
 ******************************************/
define(
[ 
  "require",
  "../../core/declare",
  "dojo/_base/lang",
  "dojo/_base/array",
  "dojo/_base/connect",
  "dojo/has",
  "dojo/string",
  "dojo/dom-style",
  "dojo/dom-attr",
  "dojo/dom-construct",
  "dojo/query",
  "dojo/dom-class",
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
  "dojo/text!./templates/CreateDriveTimeAreas.html"
], function(require, declare, lang, array, connection, has, string, domStyle, domAttr, domConstruct, query, domClass, number, _WidgetBase,
   _TemplatedMixin, _WidgetsInTemplateMixin,  _OnDijitClickMixin, _FocusMixin, registry, Button, CheckBox, Form, Select, TextBox, ValidationTextBox, ContentPane, ComboBox, esriKernel, esriLang, AnalysisBase, _AnalysisOptions, CreditEstimator, AnalysisUtils, TrafficTime, jsapiBundle, template) {
    var CreateDriveTimeAreas = declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin,  _OnDijitClickMixin, _FocusMixin, AnalysisBase, _AnalysisOptions], {
        declaredClass: "esri.widgets.analysis.CreateDriveTimeAreas",
  
        templateString: template,
        basePath: require.toUrl("."),      
        widgetsInTemplate: true,
        
        inputLayer: null,
        inputType: null,
        outputLayerName: null,
        breakValues: null,
        overlapPolicy: "Overlap",
        distanceDefaultUnits: "Miles",
        travelMode: "Driving",
        i18n: null,
        
        toolName: "CreateDriveTimeAreas",
        helpFileName: "CreateDriveTimeAreas",
        resultParameter:"DriveTimeAreasLayer",
       
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
          lang.mixin(this.i18n, jsapiBundle.bufferTool);
          lang.mixin(this.i18n, jsapiBundle.driveTimes);
        },
        
        postCreate: function(){
          this.inherited(arguments);
          domClass.add(this._form.domNode, "esriSimpleForm");
          //domAttr.set(this._closeImg, "src" , this.basePath + "/images/close.gif");
          this._breakValuesInput.set("validator", lang.hitch(this, this.validateDistance));
          this.outputLayerInput.set("validator", lang.hitch(this, this.validateServiceName));
          //this._trafficTime.set("validator", lang.hitch(this, this.validateTime));
          this.breakValues = [];
          this.breakValues.push(this._breakValuesInput.get("value"));
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
        
        _toUpperFirstLetter: function(str) {
          return (str.slice(0,1).toUpperCase() + str.slice(1));
        },
        
        _handleShowCreditsClick: function(e) {
          e.preventDefault();
          var jobParams = {};
          if(!this._form.validate()) {
            return;
          }
          //this._saveBtn.set("disabled", true);
          //input point layer url or featureset 
          jobParams.InputLayer =  JSON.stringify(AnalysisUtils.constructAnalysisInputLyrObj(this.inputLayer));
          
          jobParams.BreakValues = JSON.stringify(this.get("breakValues"));
          jobParams.Breakunits = this.get("breakUnits");
          jobParams.OverlapPolicy = this.get("overlapPolicy");
          
          if(this._trafficTimeWidget.get("checked")) {
            jobParams.timeOfDay = this._trafficTimeWidget.get("timeOfDay");
            //console.log(jobParams.timeOfDay);
            if(this._trafficTimeWidget.get("timeZoneForTimeOfDay") === "UTC") {
              jobParams.timeZoneForTimeOfDay = this._trafficTimeWidget.get("timeZoneForTimeOfDay");
            }
          }
          //outputLayer
          if(!this.returnFeatureCollection) {
            jobParams.OutputName = JSON.stringify({
              serviceProperties : {
                name: this.outputLayerInput.get("value")
              }
            });
          }
  
          if(this.showChooseExtent) {
            //console.log("showextent ux", this.showChooseExtent);
            //console.log(this._useExtentCheck.get("checked"));
            if(this._useExtentCheck.get("checked")) {
              jobParams.context = JSON.stringify({
                //outSr: this.map.spatialReference,
                extent: this.map.extent._normalize(true)
              });
            }
          }
          //console.log(jobParams);        
          this.getCreditsEstimate(this.toolName, jobParams).then(lang.hitch(this, function(result){
            //cost: 2.12, Total records: 2120
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
          //input point layer url or featureset 
          jobParams.InputLayer =  JSON.stringify(AnalysisUtils.constructAnalysisInputLyrObj(this.inputLayer));
          
          jobParams.BreakValues = this.get("breakValues");
          jobParams.Breakunits = this.get("breakUnits");
          jobParams.OverlapPolicy = this.get("overlapPolicy");
          jobParams.travelMode = this.get("travelMode");
          
          if(this._trafficTimeWidget.get("checked")) {
            jobParams.timeOfDay = this._trafficTimeWidget.get("timeOfDay");
            //console.log(jobParams.timeOfDay);
            if(this._trafficTimeWidget.get("timeZoneForTimeOfDay") === "UTC") {
              jobParams.timeZoneForTimeOfDay = this._trafficTimeWidget.get("timeZoneForTimeOfDay");
            }
          }
          //outputLayer
          if(!this.returnFeatureCollection) {
            jobParams.OutputName = JSON.stringify({
              serviceProperties : {
                name: this.outputLayerInput.get("value")
              }
            });
          }
  
          if(this.showChooseExtent) {
            //console.log("showextent ux", this.showChooseExtent);
            //console.log(this._useExtentCheck.get("checked"));
            if(this._useExtentCheck.get("checked")) {
              jobParams.context = JSON.stringify({
                //outSr: this.map.spatialReference,
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
            "description" : string.substitute(this.i18n.itemDescription, { layername: this.inputLayer.name, distance_field: jobParams.Distances || jobParams.Field , units: jobParams.Units }),
            "tags": string.substitute(this.i18n.itemTags, {layername: this.inputLayer.name}),
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
        
        _handleDistValueChange: function() {
          this.set("outputLayerName");
        },
        
        _handleDistUnitsChange: function(value) {
           this.set("breakUnits", value);
           this.set("outputLayerName");
         
        },
        
        _handleDistanceTypeChange: function(value){
          //console.log(value);
          var mode, type, arr;
          arr = value.split("-");
          mode = arr[0].toLowerCase();
          type = arr[1].toLowerCase();
          this.set("travelMode", arr[0]);
          //domClass.remove(this._drivingTime, "selected");
          //domClass.remove(this._drivingDistance, "selected");
          if(type) {
            //domClass.add((type === "time") ? this._drivingTime : this._drivingDistance, "selected");
            domStyle.set(this._useTrafficLabelRow, "display", type === "time" &&  mode === "driving"? "" : "none");
            this._trafficTimeWidget.set("disabled", type !== "time" && mode !== "driving");
            this._trafficTimeWidget.set("reset", type !== "time" && mode !== "driving");
          }
          
          // show the correct units
          if (type === "time") {
            this._distanceUnitsSelect.removeOption(this._distanceUnitsSelect.getOptions());
            this._distanceUnitsSelect.addOption([
              {value:"Seconds", label: this.i18n.seconds},
              {value:"Minutes", label: this.i18n.minutes, selected:"selected"},
              {value:"Hours", label: this.i18n.hours}
            ]); 
            this.set("breakUnits",this._distanceUnitsSelect.get("value"));
            //console.log(this.breakUnits);
          } else {
            //get the current units
            if(this.get("distanceDefaultUnits")) {
              this.set("breakUnits", this.get("distanceDefaultUnits"));
            }
                        
            this._distanceUnitsSelect.removeOption(this._distanceUnitsSelect.getOptions());
            this._distanceUnitsSelect.addOption([
              {value:"Miles", label: this.i18n.miles},
              {value:"Yards", label: this.i18n.yards},
              {value:"Feet", label: this.i18n.feet},
              {type:"separator"},
              {value:"Kilometers", label: this.i18n.kilometers},
              {value:"Meters", label: this.i18n.meters}
            ]);  
            //set the current units
            this._distanceUnitsSelect.set("value", this.breakUnits);        
          }
          this.set("outputLayerName");
       },
     
        _handleOverlapPolicyChange: function( type, value ){
          this.set("overlapPolicy", value);
          domClass.remove(this._Overlap, "selected");
          domClass.remove(this._Dissolve, "selected");
          domClass.remove(this._Split, "selected");
          domClass.add(type, "selected");
        },
      
        _save: function() {},
          
        _buildUI: function() {
          var override = true;
          AnalysisUtils.initHelpLinks(this.domNode, this.showHelp);
          if(this.get("showSelectAnalysisLayer")) {
            if(!this.get("inputLayer") && this.get("inputLayers")) {
              this.set("inputLayer", this.inputLayers[0]);
            }
            AnalysisUtils.populateAnalysisLayers(this, "inputLayer", "inputLayers");
          }
          AnalysisUtils.addReadyToUseLayerOption(this, [this._analysisSelect]);
          if(this.outputLayerName) {
            this.outputLayerInput.set("value", this.outputLayerName);
            override = false;
          }
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
           if(this.distanceDefaultUnits) {
             this._distanceUnitsSelect.set("value", this.distanceDefaultUnits);
           }
           domStyle.set(this._chooseExtentDiv, "display", this.showChooseExtent === true? "inline-block" : "none");
           //this._handleDistanceTypeChange("time");//default 
           this._drivingModeSelect.set("value", "Driving-Time");
           this._handleDistanceTypeChange("Driving-Time");//default 
           if(this.inputLayer) {
             this._updateAnalysisLayerUI(override);
           }
           this._loadConnections();
           
         },
      
        _updateAnalysisLayerUI: function(override) {
          if(this.inputLayer) {
            domAttr.set(this._driveTimeDescription, "innerHTML", string.substitute(this.i18n.toolDefine, {layername: this.inputLayer.name}));
            if(override) {
              this.set("outputLayerName");
            }
          }
        },
      
        _handleAnalysisLayerChange: function(value) {
          if(value === "browse") {
            if(!this._analysisquery) {
              this._analysisquery = this._browsedlg.browseItems.get("query");
            }        
            this._browsedlg.browseItems.set("query", this._analysisquery + " AND tags:\"point\"");
            this._browsedlg.show();
          }
          else {
            this.inputLayer = this.inputLayers[value];
            this.outputLayerName = null;
            this._updateAnalysisLayerUI(true);
          }
        },

        _handleBrowseItemsSelect: function(value) {
          if(value && value.selection) {
            AnalysisUtils.addAnalysisReadyLayer({
              item: value.selection,
              layers:  this.inputLayers,
              layersSelect: this._analysisSelect,
              browseDialog: this._browsedlg
            }).always(lang.hitch(this, this._updateAnalysisLayerUI, true));
          }
        },
        
        validateTime: function() {} ,
         
        validateDistance: function() {
          var self = this, val, passes = [], vstring, match;
          this.set("breakValues");
          val = lang.trim(this._breakValuesInput.get("value")).split(" ");
          if (val.length === 0) {
            return false;
          }
          //console.log(val);
          array.forEach(val, function(v){
            v = number.parse(v);
            //console.log(v);
            if (isNaN(v)) {
              passes.push(0);
              return false;
            }
            vstring = number.format(v,{locale:"root"});
            if(!esriLang.isDefined(vstring)) {
              vstring = number.format(v,{locale:"en"});
            }
            else if(!esriLang.isDefined(vstring)) {
              vstring = number.format(v,{locale:"en-us"});
            }             
            if(esriLang.isDefined(vstring)) {
              match = lang.trim(vstring).match(/\D/g);
            }    
            if (match){
              array.forEach(match, function( m ){
                if (m === "." || m === ",") {
                  passes.push(1);
                } else if (m === "-" && self.inputType === "polygon") {
                  passes.push(1);
                }
                else {
                  passes.push(0);
                }
              });
            }
          });
          //console.log(passes);
          if (array.indexOf(passes, 0) !== -1) {
            return false;
          }
          return true;
        },
          
        _loadConnections: function(){
          this.on("start", lang.hitch(this, "_onClose", true));
          this._connect(this._closeBtn, "onclick", lang.hitch(this, "_onClose", false));
          connection.connect(this._drivingModeSelect, "onChange", lang.hitch(this, "_handleDistanceTypeChange")); 
          //connection.connect(this._drivingTime, "onclick", lang.hitch(this, "_handleDistanceTypeChange", "time")); 
          connection.connect(this._Overlap, "onclick", lang.hitch(this, "_handleOverlapPolicyChange", this._Overlap, "Overlap")); 
          connection.connect(this._Dissolve, "onclick", lang.hitch(this, "_handleOverlapPolicyChange", this._Dissolve, "Dissolve")); 
          connection.connect(this._Split, "onclick", lang.hitch(this, "_handleOverlapPolicyChange", this._Split, "Split"));
        },
            
            
        //sets the tool gp task url
        _setAnalysisGpServerAttr: function(url) {
          if(!url) {
            return;
          }
          this.analysisGpServer = url;
          this.set("toolServiceUrl", this.analysisGpServer +  "/" + this.toolName);
        },
      
        _setInputLayerAttr: function(layer) {
          if(esriLang.isDefined(layer) && layer.geometryType === "esriGeometryPoint") {
           this.inputLayer = layer;
          }
        },
        
        _getInputLayerAttr: function() {
          return this.inputLayer;
        },
      
        _setInputLayersAttr: function(layers) {
          this.inputLayers = layers;
        },
        
        _setOverlapPolicyAttr: function(value) {
          this.overlapPolicy = value;
        },
        
        _getOverlapPolicyAttr: function() {
          return this.overlapPolicy;
        },
        
        _setBreakValuesAttr: function(value) {
          if (value) {
            this.breakValues = value;  
          }
          var val = lang.trim(this._breakValuesInput.get("value")).split(" "), darray = [];
          array.forEach(val, function(v){
            darray.push(number.parse(v));
          });
          this.breakValues = darray;
           
        },
        
        _getBreakValuesAttr: function() {
          return this.breakValues;
        },    
          
        _setDisableRunAnalysisAttr: function(value){
          this._saveBtn.set("disabled", value);
        },
      
        _getTravelModeAttr: function() {
          return this.travelMode;
        },
      
        _setTravelModeAttr: function(value) {
          this._set("travelMode", value);
        },
      
            
        validateServiceName: function(value) {
          return AnalysisUtils.validateServiceName(value, {textInput: this.outputLayerInput});
        },
        
        _setBreakUnitsAttr: function(value) {
          this.breakUnits = value;
        },
          
        _getBreakUnitsAttr: function() {
          return this.breakUnits;
        }, 

        _setDistanceDefaultUnitsAttr: function(value) {
          this.distanceDefaultUnits = value;
        },
          
        _getDistanceDefaultUnitsAttr: function() {
          return this.distanceDefaultUnits;
        }, 

        _setOutputLayerNameAttr: function(str) {
          var outNameSubStr, curTemplateRsltStr, units, unitsSubStr, i18nUnits, unitlabel, modeArr;
          units = ["Seconds", "Minutes", "Hours", "Miles", "Meters", "Kilometers", "Feet", "Yards"];
          i18nUnits = [this.i18n.seconds, this.i18n.minutes, this.i18n.hours, this.i18n.miles, this.i18n.meters, this.i18n.kilometers, this.i18n.feet, this.i18n.yards];
          //console.log(i18nUnits);
          unitlabel = this._distanceUnitsSelect.getOptions(this._distanceUnitsSelect.get("value")).label; 
          if(str) {
            this.outputLayerName = str;
            this.outputLayerInput.set("value", str);
          }
          else if(this._breakValuesInput) {
            if(!this.outputLayerName && this.inputLayer) {
              //console.log(this.get("travelMode"));
              this.outputLayerName = string.substitute(this.i18n.outputModeLayerName, {
                mode: this.i18n[this.get("travelMode").toLowerCase()],
                layername: this.inputLayer.name, 
                breakValues: this._breakValuesInput.get("value"), 
                breakUnits: unitlabel
              }); 
            }
            else {
              this.outputLayerName = this.outputLayerInput.get("value");
              modeArr = [this.i18n.driving, this.i18n.trucking, this.i18n.walking];
              var curModeStr = this.outputLayerName.substr(0, this.outputLayerName.indexOf(" "));
              if(curModeStr !== this.i18n[this.travelMode.toLowerCase()]){
                this.outputLayerName = this.outputLayerName.replace(curModeStr, this.i18n[this.travelMode.toLowerCase()]);
              }
              
              if(this.outputLayerName.lastIndexOf("(") !== -1) {
                outNameSubStr = this.outputLayerName.substring(0,this.outputLayerName.lastIndexOf("("));
                unitsSubStr = string.trim(this.outputLayerName.substring(this.outputLayerName.lastIndexOf(" "), this.outputLayerName.lastIndexOf(")")));
                //console.log(unitsSubStr);
                //console.log(unitsSubStr);
                // 5 10 15 Minutes;
                //unit = (unitsSubStr.substring(unitsSubStr.indexOf(this._breakValuesInput.get("value")) + 1)).trim();
                //console.log(unit);
                //unit = unitsSubStr.split(" ")[1];
                if(array.indexOf(i18nUnits,unitsSubStr) !== -1) {
                  //convention followed
                  curTemplateRsltStr = outNameSubStr + "(${breakValues} ${breakUnits})";
                  //console.log(curTemplateRsltStr);
                  this.outputLayerName = string.substitute(curTemplateRsltStr, {
                    breakValues: this._breakValuesInput.get("value"), 
                    breakUnits: unitlabel
                  });
                } 
              }
            }
            this.outputLayerInput.set("value", this.outputLayerName);
          }
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
        _connect: function(node, evt, func){
          this._pbConnects.push(connection.connect(node, evt, func));
        }
  });
  
  
  return CreateDriveTimeAreas; 
});  
    


