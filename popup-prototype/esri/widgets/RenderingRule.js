define([
  "../core/declare",
  "dojo/_base/lang",
  "dojo/_base/array",
  "dojo/on",
  "dojo/topic",
  
  "dojo/i18n!../nls/jsapi",
  "dojo/text!./templates/RenderingRule.html",
  "dojo/store/Memory",

  "../layers/support/RasterFunction",
  "../geometry/Extent",
  
  "dijit/_WidgetBase", 
  "dijit/_TemplatedMixin", 
  "dijit/_WidgetsInTemplateMixin", 
 
  "dijit/Tooltip",
  "dijit/form/HorizontalSlider",
  "dijit/form/HorizontalRuleLabels",
  "dijit/form/FilteringSelect"
], 
  
function(
  declare, lang, array, on, topic,
  jsapiBundle, template, Memory, RasterFunction, Extent,
  _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, Tooltip
  ) {
  var Widget = declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
    declaredClass: "esri.widgets.RenderingRule",
    templateString : template,
    widgetsInTemplate : true,
    layer : null, //layer on which the rendering rule is set
    map : null, //map object
    hideApplyButton: false,
    _renderingRuleObject : null, //Rendering rule object
    _rasterFunctionData : [],
    _rasterFunctionStore : null,
    _cachedFunctionList : [],
    _cachedkeyProperties : {},
    _pendingDfds : {},
    _redBandIdStore : null,
    _greenBandIdStore : null,
    _blueBandIdStore : null,
    _donotSaveChanges : false,
    _resetBandCombination : false,
    _serviceBandCount : 3,
    _defaultBandCombinationFncName : "User Defined Renderer",
    _firstFncInRenderingRuleList : null, // This is used as the default in case of a 1 band service
    _gammaSliderTooltip : null,

    constructor : function(options) {
      declare.safeMixin(this, options);
      this._i18n = jsapiBundle;
      this._defaultBandCombinationFncName = this._i18n.widgets.renderingRule.userDefinedRendererTitle;
      this._renderingRuleObject = new RasterFunction();
    },
  
    startup : function() {
      this.inherited(arguments);
      this.rasterFunctionList.on("change", lang.hitch(this, "_onRasterFunctionChange"));
      this.stretchMethodList.on("change", lang.hitch(this, "_onStretchMethodChange"));
      this.gammaSlider.on("change", lang.hitch(this, "_onGammaChange"));
      this.gammaSlider.on("mouseleave", lang.hitch(this, "_onGammaMouseLeave"));
      on(this._apply, "click", lang.hitch(this, "_onClickApplyRenderingRule"));
      topic.subscribe("onRenderingRuleApply", lang.hitch(this, "_onClickApplyRenderingRule"));
      topic.subscribe("onRenderingRuleReset", lang.hitch(this, "_onClickResetRenderingRule"));
      //this.msgLabel.style.display = "none";
      if (this.hideApplyButton) {
        this._apply.style.display = "none";
      }
      //this.rasterFunctionList.style.width = "100%";
    },
      
    destroy: function() {
      this._pendingDfds = null;
      if (this._gammaSliderTooltip){
        this._gammaSliderTooltip.destroy();
        this._gammaSliderTooltip = null;
      }       
      this.inherited(arguments);
    },      

    _setLayerAttr : function(value) {
      if(!value) {
        return;
      }

      this.inherited(arguments);
      this.layer = value;
      this._donotSaveChanges = true;
      this._firstFncInRenderingRuleList = null;
      this._fillStretchMehodList();
      this._hideStretch();

      var setupDefaults = lang.hitch(this, "_setupDefaults");
      if (this.layer.loaded) {
        this._setupDefaults();
      }
      else {
        this.layer.on("load", setupDefaults);
      }

      this._donotSaveChanges = false;
    },
  
    _setupDefaults: function() {
      // setup default bandIds from the layer. RasterFunction default will be set in the callback
      this._setupBandIdDefaults();
      this._setupStretchDefaults();
      this._setupRenderingRuleDefaults();      
    },
      
    _setupRenderingRuleDefaults : function() {
      if(!this.layer) {
        return;
      }

      this._rasterFunctionData = [];
      var i;
      for( i = 0; i < this._cachedFunctionList.length; i++) {
        var rfDataItem = this._cachedFunctionList[i];
        if(rfDataItem && this.layer === rfDataItem.layer) {
          this._rasterFunctionData = rfDataItem.data;
          this._setupFunctionStore();
          return;
        }
      }

      this._fillRasterFunctionList(this.layer);
    },
  
    _setupFunctionStore : function() {
      if (!this.layer) {
        console.log("Could not populate renderers as the layer does not exists");
        return;
      }

      this._rasterFunctionStore = new Memory({
        data : this._rasterFunctionData,
        idProperty : 'name'
      });

      this.rasterFunctionList.set('store', this._rasterFunctionStore);
      this.rasterFunctionList.set('labelAttr', "label");
      this.rasterFunctionList.set('labelType', "html");

      //Match and set this as the current selected item
      var defaultRFunctionName = "";
      if(this.layer.renderingRule && this.layer.renderingRule.functionName) {
        if (this.layer.renderingRule.functionName.toLowerCase() !== "stretch") {
          defaultRFunctionName = this.layer.renderingRule.functionName;
        } else {
          defaultRFunctionName = this._defaultBandCombinationFncName;
        }
      } else if (this._firstFncInRenderingRuleList && this._firstFncInRenderingRuleList.toLowerCase() !== "none") {
        defaultRFunctionName = this._firstFncInRenderingRuleList;
      } else {
        defaultRFunctionName = this._defaultBandCombinationFncName;
      }

      if(defaultRFunctionName && this._rasterFunctionStore.get(defaultRFunctionName)) {
        this.rasterFunctionList.set('value', defaultRFunctionName);
        this._onRasterFunctionChange();
      }

      return;
    },
  
    _fillRasterFunctionList : function(layer) {
      if(!this.layer) {
        return;
      }

      // clear the data store
      this._rasterFunctionData = [];
      if(layer === null || layer.extent === null) {
        return;
      }

      // add raster functions to the list if this was not loaded before
      var layerExtent = new Extent(layer.extent.xmin, layer.extent.ymin, layer.extent.xmax, layer.extent.ymax, layer.extent.spatialReference);
      var width = layerExtent.getWidth();
      var height = layerExtent.getHeight();
      if ((width/height >= 2.0) || (height/width >= 2.0)) { // Fix for non-square services...
        var sideLength = (Math.min(width, height)) / 2.0;
        var center = layerExtent.getCenter();
        layerExtent.update(center.x - sideLength, center.y - sideLength, center.x + sideLength, center.y + sideLength, layer.extent.spatialReference);
      }
      var layerExtentStr = layerExtent.xmin + "," + layerExtent.ymin + "," + layerExtent.xmax + "," + layerExtent.ymax;
      var token = layer._getToken();
      var tokenStr = "";
      if (token) {
        tokenStr = "&token=" + token;
      }      
      var exportImageCall = this.layer.url + "/exportImage?bbox=" + layerExtentStr + tokenStr + "&imageSize=400,400&f=image&renderingRule=";      

      // Add RGB renderer for 3 or more band services
      //if(this.layer.bandCount >= 3) {
        var bands = this.layer.bandIds;
        var exportImageCallForBands = exportImageCall;
        if (bands && bands.length >= 3) {
          exportImageCallForBands = exportImageCall + "&bandIds=" + bands[0] + "," + bands[1] + "," + bands[2];
        }

        this._addFunctionItemToList(this._defaultBandCombinationFncName, this._defaultBandCombinationFncName, this._i18n.widgets.renderingRule.userDefinedRendererDesc, exportImageCallForBands, "");
        //this._setupBandIdDefaults();
      //}

      if(layer.rasterFunctionInfos && layer.rasterFunctionInfos.length > 0) {
        array.forEach(layer.rasterFunctionInfos, lang.hitch(this, function(rFunction) {
          if (this._firstFncInRenderingRuleList === null) {
            this._firstFncInRenderingRuleList = rFunction.name;
          }          
          if (rFunction.name.toLowerCase() !== "none") { // exclude none. it's confusing and has no meaning...
            var renderingRule = "{\"rasterFunction\":\"" + rFunction.name + "\"}";
            this._addFunctionItemToList(rFunction.name, rFunction.name, rFunction.description, exportImageCall, renderingRule);
          }
        }));
      }

      // cache this function data item
      var cachedItem = {};
      cachedItem.layer = this.layer;
      cachedItem.data = this._rasterFunctionData;
      this._cachedFunctionList.push(cachedItem);

      this._setupFunctionStore();
      return;
    },
  
    _addFunctionItemToList : function(name, id, description, exportImagePars, renderingRule) {
      var fncItem = {};
      fncItem.name = name;
      fncItem.id = id;
      var desc = description;
      if(desc.length > 200) {
        desc = desc.substring(0, 200) + "...";
      }
      fncItem.description = desc;
      // fncItem.label = "<html><body><section><h4><u>" + name + ":</u></h4></br><img src='" + exportImagePars + renderingRule + "' height='100' width='100'></br><p style='white-space:pre-wrap;width:60ex'><i>" + fncItem.description + "</i></p></section></body></html>";
      fncItem.label = "<html><body><section><h4>" + name + ":</h4><table cellspacing='5'><tr><td><img src='" + exportImagePars + renderingRule + "' height='100' width='100'></td><td><p style='white-space:pre-wrap;width:40ex'><i>" + desc + "</i></p></td></tr></table></section></body></html>";
      this._rasterFunctionData.push(fncItem);
    },
  
    _setupBandIdDefaults : function() {
      if(!this.layer) {
        return;
      }

      var bandCount = 3;
      bandCount = this.layer.bandCount;
      
      var layerId = this.layer.id;
      var layerKeyProperties = this._cachedkeyProperties[layerId];
      if (!layerKeyProperties && bandCount > 1) { // no need for requesting key properties for single band services
        this.msgLabel.style.display = "";
        this.msgLabel.innerHTML = "<i>" + this._i18n.widgets.renderingRule.bandNamesRequestMsg + "</i>";    
        var dfd = this.layer.getKeyProperties();
        this._pendingDfds[layerId] = 1;
        dfd.addBoth(lang.partial(this._fillBandIdList, this, this.layer));
      } else {
        this._fillBandIdList(this, this.layer, layerKeyProperties);
      }
      
      if (bandCount < 3) {
        this._hideBandIds();
      } else {
        this._showBandIds();
      }
    },
  
    _fillBandIdList : function(self, layer, keyProperties) {
      
      if (!self.layer || self.layer !== layer) {
        return;
      }
      
      var dfds = self._pendingDfds, layerId = self.layer.id;
      if (dfds && dfds[layerId]) {
        delete dfds[layerId];
      }
      
      self.msgLabel.style.display = "none";
      self.msgLabel.innerHTML = "";   

      var bandCount = 3;
      bandCount = self.layer.bandCount;
      
      var bandProperties;
      if (keyProperties && keyProperties.BandProperties && keyProperties.BandProperties.length > 0) {
          bandProperties = keyProperties.BandProperties;
      }
    
      // Add RED band
      var redBandIdData = self._getBandIdList(bandCount, bandProperties, "");
      self._redBandIdStore = new Memory({
        data : redBandIdData,
        idProperty : 'name'
      });

      self.bandIdsRedList.set('store', self._redBandIdStore);
      self.bandIdsRedList.set('labelAttr', "label");
      self.bandIdsRedList.set('labelType', "html");

      // Add Green band
      var greenBandIdData = self._getBandIdList(bandCount, bandProperties, "");
      self._greenBandIdStore = new Memory({
        data : greenBandIdData,
        idProperty : 'name'
      });

      self.bandIdsGreenList.set('store', self._greenBandIdStore);
      self.bandIdsGreenList.set('labelAttr', "label");
      self.bandIdsGreenList.set('labelType', "html");

      // Add Blue band
      var blueBandIdData = self._getBandIdList(bandCount, bandProperties, "");
      self._blueBandIdStore = new Memory({
        data : blueBandIdData,
        idProperty : 'name'
      });

      self.bandIdsBlueList.set('store', self._blueBandIdStore);
      self.bandIdsBlueList.set('labelAttr', "label");
      self.bandIdsBlueList.set('labelType', "html");

      var bands = self.layer.bandIds;
      if(bands && bands.length > 2) {
        self.bandIdsRedList.set('value', self._getBandName(self._redBandIdStore, bands[0]));
        self.bandIdsGreenList.set('value', self._getBandName(self._greenBandIdStore, bands[1]));
        self.bandIdsBlueList.set('value', self._getBandName(self._blueBandIdStore, bands[2]));
      } else if (self._redBandIdStore.data.length > 0 && self._greenBandIdStore.data.length > 1 && self._blueBandIdStore.data.length > 2) {
        var redIdx = self._getRedBandIndex(bandProperties);
        var greenIdx = self._getGreenBandIndex(bandProperties);
        var blueIdx = self._getBlueBandIndex(bandProperties);
        self.bandIdsRedList.set('value', self._redBandIdStore.data[redIdx].name);
        self.bandIdsGreenList.set('value', self._greenBandIdStore.data[greenIdx].name);
        self.bandIdsBlueList.set('value', self._blueBandIdStore.data[blueIdx].name);
      }

      // cache this keyProperties
      self._cachedkeyProperties[layerId] = keyProperties;
      
      var selFunctionName = self.rasterFunctionList.get('value');
      if (selFunctionName === self._defaultBandCombinationFncName) {
        self._enableBandIds();
      }
      
      return;
    },
  
    _getRedBandIndex: function (bandProperties) {
      if (!this.layer || !bandProperties) {
        return 0;
      }

      var i;
      for (i = 0; i < bandProperties.length; i++) {
        if (bandProperties[i] && bandProperties[i].hasOwnProperty("BandName") && bandProperties[i].BandName.toLowerCase() === "red") {
          return i;
        }
      }

      return 0;
    },
    
    _getGreenBandIndex: function (bandProperties) {
      if (!this.layer || !bandProperties) {
        return 1;
      }

      var i;
      for (i = 0; i < bandProperties.length; i++) {
        if (bandProperties[i] && bandProperties[i].hasOwnProperty("BandName") && bandProperties[i].BandName.toLowerCase() === "green") {
          return i;
        }
      }

      return 1;
    },
      
    _getBlueBandIndex: function (bandProperties) {
      if (!this.layer || !bandProperties) {
        return 2;
      }

      var i;
      for (i = 0; i < bandProperties.length; i++) {
        if (bandProperties[i] && bandProperties[i].hasOwnProperty("BandName") && bandProperties[i].BandName.toLowerCase() === "blue") {
          return i;
        }
      }

      return 2;
    },
          
    _getBandIdList : function(bandCount, bandProperties, fontColor) {
      if(!this.layer) {
        return;
      }

      // clear the data store
      var bandIdData = [];
      if(!fontColor) {
        fontColor = "Black";
      }

      var bandNameExist = false;
      if(bandProperties && bandCount === bandProperties.length) {
        bandNameExist = true;
      }

      var i;
      for( i = 0; i < bandCount; i++) {
        var bandAlias = i;
        var bandValue = i;

        if(bandNameExist && bandProperties[i] && bandProperties[i].BandName) {
          bandAlias = bandProperties[i].BandName;
        } else {// use band index
          bandAlias++;
        }

        var fncItem = {};
        fncItem.name = bandAlias;
        fncItem.index = bandValue;
        fncItem.label = "<html><body><span value=" + bandValue + "><font color=" + fontColor + ">" + bandAlias + "</font></span></body></html>";
        bandIdData.push(fncItem);
      }

      return bandIdData;
    },
  
    _getBandName : function(bandStore, bandIndex) {
      if(!bandStore || !bandStore.data) {
        return;
      }

      var i;
      for( i = 0; i < bandStore.data.length; i++) {
        var item = bandStore.data[i];
        if(item.index === bandIndex) {
          return item.name;
        }
      }

      return "";
    },
  
    _setupStretchDefaults : function() {
      if(!this.layer) {
        return;
      }

      if(this.layer.renderingRule && this.layer.renderingRule.functionName && this.layer.renderingRule.functionName.toLowerCase() === "stretch") {
        this._loadStretchFunction();
      } else {
        //this.stretchMethodList.selectedIndex = 0;
        this.stretchMethodList.set('value', "0");
        this._onStretchMethodChange();
        this.numStdDevText.value = 2.0;
        this.minPercentText.value = 2.0;
        this.maxPercentText.value = 2.0;
        this.gammaSlider.setValue(0.0);
        if (this.layer.minValues && this.layer.minValues.length > 0 && this.layer.maxValues && this.layer.maxValues.length > 0) {
          // If stats are available then check dra ON and disable it...
          this.draCheckbox.checked = false;
          this.draCheckbox.disabled = false;
          this.draLabel.style.color = "Black";
        } else {
          this.draCheckbox.checked = true;
          this.draCheckbox.disabled = true;
          this.draLabel.style.color = "Gray";
        }
      }
      
      // setup tooltip
      if (!this._gammaSliderTooltip){
        this._gammaSliderTooltip = new Tooltip({
          connectId: ["gammaSliderID"],
          position: ['below', 'above'],
          id: "gammaSliderTooltipID"
        });
      }
      
    },
    
    _loadStretchFunction : function() {
      var rRule = this.layer.renderingRule;
      if (!rRule || !rRule.functionName || rRule.functionName.toLowerCase() !== "stretch") {
        return;
      }
      
      var args = rRule.functionArguments;
      var stretchMethod = args.StretchType;
      this.stretchMethodList.set('value', stretchMethod.toString());
      this._onStretchMethodChange();
      
      if (args.NumberOfStandardDeviations) {
        this.numStdDevText.value = args.NumberOfStandardDeviations;
      }

      this.draCheckbox.checked = args.DRA ? true : false;
      if (args.UseGamma) {
        var gamma = args.Gamma;
        if (args.Gamma.length > 0) {
          gamma = args.Gamma[0];
        }
        var sliderVal = Math.log(gamma) / Math.log(10);
        if (sliderVal) {
          this.gammaSlider.setValue(sliderVal);
        }
      }
      
      if (args.MinPercent) {
        this.minPercentText.value = args.MinPercent;
      }
      
      if (args.MaxPercent) {
        this.maxPercentText.value = args.MaxPercent;
      }
    },
      
    _fillStretchMehodList : function() {
      this.stretchMethodList.removeOption(this.stretchMethodList.getOptions());
      this.stretchMethodList.addOption([
        {value:"0", label: this._i18n.widgets.renderingRule.noneStretchAlias},
        {value:"5", label: this._i18n.widgets.renderingRule.minMaxStretchAlias},
        {value:"3", label: this._i18n.widgets.renderingRule.stdDevStretchAlias},
        {value:"6", label: this._i18n.widgets.renderingRule.percentClipStretchAlias}
      ]);
      
      this.stretchMethodList.set('value', "0");
      this._onStretchMethodChange();      
    },
      
    _onRasterFunctionChange : function() {
      var selFunctionName = this.rasterFunctionList.get('value');
      if (selFunctionName) {
        var mDesc = this._rasterFunctionStore.get(selFunctionName).description;
        this.rasterFunctionList.set('title', mDesc);
        // this is for tooltip

        var layerId = this.layer.id;        
        if (selFunctionName === this._defaultBandCombinationFncName) {
          this.rasterFunctionRow.width = "";
          if (this.layer.bandCount > 1) {
            this._showBandIds();
            if (!this._pendingDfds[layerId]) {
              this._enableBandIds();
            } else {
              this._disableBandIds();
            }
          } else {
            this._hideBandIds();
          }
        } else {
          if (this.domNode.clientWidth > 0) {
            this.rasterFunctionRow.width = this.domNode.clientWidth;
          }
          this._hideBandIds();
        }
        
        if (selFunctionName === this._defaultBandCombinationFncName) {
          this.imageEnhancementLabel.style.display = "";
          this.stretchMethodLabel.style.display = "";
          this.stretchDescLabel.style.display = "";
          this.stretchMethodList.domNode.style.display = "";
          this._onStretchMethodChange(); 
        } else {
          this._hideStretch();
        }
        
      }
    },
        
    _onStretchMethodChange : function() {
      if (this.stretchMethodList.getOptions.length < 1) {
        return;
      }
      
      var currentStretchMethod = this.stretchMethodList.get("value");
      if (currentStretchMethod === "0") {
        this._hideStretchOptions(true);
      } else {
        this._hideStretchOptions(false);
      }
      switch (currentStretchMethod) {
        case "0": //none
          this.stretchMethodNoneDescBlock.style.display = "";         
          break;
        case "3": //std dev
          this.numStdDevBlock.style.display = "";         
          break;          
        case "5": //min max
          this.stretchMethodMinMaxDescBlock.style.display = "";         
          break;
        case "6": // percent clip
          this.minMaxPercentDescBlock.style.display = "";
          this.minPercentBlock.style.display = "";
          this.maxPercentBlock.style.display = "";
          break;
      }
     
     
    },
  
    _onClickApplyRenderingRule : function() {
      var selFunctionName = this.rasterFunctionList.get('value');
      if (selFunctionName !== this._defaultBandCombinationFncName) {
        this._onRasterFunctionApply();
        // Do not refresh for User defined band combination. This is not a real renderer
      } else {
        this._onBandIdsApply();
      }
    },
      
    _onClickResetRenderingRule: function () {
      if (!this.layer) {
        return;
      }

      this.layer.renderingRule = null;
      this.layer.bandIds = null;
      //this._mosaicRule.options.length = 0;
      //this._orderField.options.length = 0;
      this._setupDefaults();
      this._onClickApplyRenderingRule();
    },      
      
    _onRasterFunctionApply : function() {
      if(this._donotSaveChanges) {
        return;
      }

      if(!this.layer) {
        return;
      }

      // apply renderer
      var selFunctionName = this.rasterFunctionList.get('value');
      var rasterFunction = new RasterFunction();
      rasterFunction.functionName = selFunctionName;
      var bandIds = [];
      // take out band id selection when rendering rule is set...
      this.layer.setBandIds(bandIds, true);
      this.layer.setRenderingRule(rasterFunction);
    },
  
    _onBandIdsApply : function() {
      if(this._donotSaveChanges) {
        return;
      }

      if(!this.layer) {
        return;
      }

      if(!this._redBandIdStore || !this.bandIdsGreenList || !this.bandIdsBlueList) {
        this._onStretchApply(false);
        return;
      }

      var bandIds = [];
      var redBand = this._redBandIdStore.get(this.bandIdsRedList.value);
      var greenBand = this._greenBandIdStore.get(this.bandIdsGreenList.value);
      var blueBand = this._blueBandIdStore.get(this.bandIdsBlueList.value);
      if (redBand && greenBand && blueBand) {
        bandIds.push(redBand.index);
        bandIds.push(greenBand.index);
        bandIds.push(blueBand.index);
      }

      this._onStretchApply(true);
      this.layer.setBandIds(bandIds);
    },

    _onStretchApply : function(dontRefreshLayer) {
      if(this._donotSaveChanges) {
        return;
      }

      if(!this.layer) {
        return;
      }
      
      var currentStretchMethod = this.stretchMethodList.get("value");
      var rasterFunction = null;
      if (currentStretchMethod !== "0") {
        rasterFunction = new RasterFunction();
        rasterFunction.functionName = "Stretch";
        this._buildStretchFunction(rasterFunction);
      }
      
      this.layer.setRenderingRule(rasterFunction, dontRefreshLayer);
    },
    
    _buildStretchFunction : function(rasterFunction) {
      rasterFunction.functionName = "Stretch";
      var currentStretchMethod = this.stretchMethodList.get("value");
      var args = {};
      args.StretchType = parseInt(currentStretchMethod, 10);
      args.DRA = this.draCheckbox.checked ? true : false;
      var gammaVal = Math.exp(this.gammaSlider.value * Math.log(10));
      gammaVal = parseFloat(parseFloat(gammaVal).toFixed(2)); // Use only two decinal places and convert to number
      var gammaValArr = [];
      gammaValArr.push(gammaVal);
      if (this.layer.bandCount > 1) {
        gammaValArr.push(gammaVal);
        gammaValArr.push(gammaVal);
      }
      
      args.Gamma = gammaValArr;
      args.UseGamma = true;
      
      if (currentStretchMethod === "3") {
        args.NumberOfStandardDeviations = this.numStdDevText.value;
        rasterFunction.outputPixelType = "U8";
      } else if (currentStretchMethod === "6") {
        args.MinPercent = parseFloat(this.minPercentText.value);
        args.MaxPercent = parseFloat(this.maxPercentText.value);
        rasterFunction.outputPixelType = "U8";
      } else if (currentStretchMethod === "5") {
          rasterFunction.outputPixelType = "U8";
      }
        
      rasterFunction.functionArguments = args;
    },
      
    _onGammaChange: function(value) {
      var tooltipNode = this._gammaSliderTooltip;
      if (tooltipNode){
        var gammaVal = Math.exp(value * Math.log(10));
        if (gammaVal) {
          tooltipNode.label = parseFloat(gammaVal).toFixed(2);
        } else {
          tooltipNode.label = value;
        }
        tooltipNode.open("gammaSliderID");
      }
    },
      
    _onGammaMouseLeave: function(){
      this.gammaTooltipClose();
    },
      
    _disableBandIds : function() {
      this.bandIdsRedList.set('disabled', true);
      this.bandIdsGreenList.set('disabled', true);
      this.bandIdsBlueList.set('disabled', true);
      this.bandIdsLabel.style.color = "Gray";
    },
  
    _enableBandIds : function() {
      this.bandIdsRedList.set('disabled', false);
      this.bandIdsGreenList.set('disabled', false);
      this.bandIdsBlueList.set('disabled', false);
      if(this.bandIdsRedList.value === "") {
        this.bandIdsRedList.set('value', "1");
        //this.bandIdsRedList.set('value', this._getDefaultRedBandIndex());
      }

      if(this.bandIdsGreenList.value === "") {
        this.bandIdsGreenList.set('value', "2");
      }

      if(this.bandIdsBlueList.value === "") {
        this.bandIdsBlueList.set('value', "3");
      }

      this.bandIdsLabel.style.color = "Black";
    },
      
    _showBandIds : function() {
      this.bandIdsLabelBlock.style.display = "";
      this.bandIdsBlock.style.display = "";
      this.bandIdsMsgBlock.style.display = "";
    },
  
    _hideBandIds : function() {
      this.bandIdsLabelBlock.style.display = "none";
      this.bandIdsBlock.style.display = "none";
      this.bandIdsMsgBlock.style.display = "none";
    },
  
    _hideStretch : function() {
      this.imageEnhancementLabel.style.display = "none";
      this.stretchDescLabel.style.display = "none";
      this.stretchMethodLabel.style.display = "none";
      this.stretchMethodList.domNode.style.display = "none";
      this._hideStretchOptions(true);
    },
      
    _hideStretchOptions : function(all) {
      var displayVal = "";
      if (all) {
        displayVal = "none";
      }
      this.gammaBlock.style.display = displayVal;
      this.draBlock.style.display = displayVal;
      //this.gammaLabel.style.display = displayVal;
      //this.gammaSlider.domNode.style.display = displayVal;
      //this.draLabel.style.display = displayVal;
      //this.draCheckbox.style.display = displayVal;
      
      this.stretchMethodNoneDescBlock.style.display = "none";
      this.stretchMethodMinMaxDescBlock.style.display = "none";
      this.numStdDevBlock.style.display = "none";
      this.minMaxPercentDescBlock.style.display = "none";
      this.minPercentBlock.style.display = "none";
      this.maxPercentBlock.style.display = "none";
    },
      
    _getDefaultRedBandIndex : function() {
      var index;
      if(this._redBandIdStore) {
        index = this._redBandIdStore.get("Red");
      }
      if(!index) {
        index = 1;
      }

      return index;
    },
    
    gammaTooltipClose : function() {
      if (this._gammaSliderTooltip){
        this._gammaSliderTooltip.close();
      }
    }
  });

  return Widget;
});
