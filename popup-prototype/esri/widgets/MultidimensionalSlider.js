define(
[
  "../core/declare",
  "../core/lang",
  "../core/promiseList",

  "../layers/support/DimensionalDefinition",
  "../layers/support/MosaicRule",

  "./Widget",

  "dijit/_Templated",
  "dijit/_Widget",

  "dijit/form/HorizontalRule",
  "dijit/form/HorizontalRuleLabels",
  "dijit/form/HorizontalSlider",
  "dijit/form/VerticalRule",
  "dijit/form/VerticalRuleLabels",
  "dijit/form/VerticalSlider",

  "dojo/_base/array",
  "dojo/_base/lang",

  "dojo/Deferred",
  "dojo/dom-class",
  "dojo/dom-geometry",
  "dojo/dom-style",
  "dojo/has",
  "dojo/on",

  "dojox/form/HorizontalRangeSlider",
  "dojox/form/VerticalRangeSlider",

  "dojox/timing/_base",

  "dojo/i18n!../nls/jsapi",

  "dojo/text!./templates/MultidimensionalSlider_horizontal.html",
  "dojo/text!./templates/MultidimensionalSlider_vertical.html"
],
function (
  declare, esriLang, promiseList,
  DimensionalDefinition, MosaicRule,
  Widget,
  _Templated, _Widget,
  HorizontalRule, HorizontalRuleLabels, HorizontalSlider, VerticalRule, VerticalRuleLabels, VerticalSlider,
  array, lang,
  Deferred, domClass, domGeom, domStyle, has, on,
  HorizontalRangeSlider, VerticalRangeSlider,
  timingBase,
  jsapiBundle,
  widgetTemplate_horizontal, widgetTemplate_vertical
) {

  var sliderLayouts = {
    LAYOUT_VERTICAL: "vertical",
    LAYOUT_HORIZONTAL: "horizontal"
  };

  var MDS = declare([Widget, _Widget, _Templated], {
    declaredClass: "esri.widgets.MultidimensionalSlider",
    widgetsInTemplate: true,
    templateString: widgetTemplate_vertical,
    nLabels: 10,
    thumbCount: 1,
    loop: true,
    useLayersDimSlices: true, 
    prefetch: true,
    prefetchedValues: {},
    showPlayButton: true,
    prefetchFactor: 3,
    _hasUnitConflict: false,
    unitSymbols: {
      //Standard scientific data symbols
      meter: "m",
      pascal: "Pa"
    },
    
    _eventMap: {
      'dimension-value-change': true,
      'play': true,
      'pause': true,
      'next': true,
      'previous': true,
      'change': true,
      'dimension-array-create': true 
    },
    /*****************
     * Events
     *****************/

    onChange: function () {
    },
    
    onPlay: function () {
    },
    
    onPause: function () {
    },
    
    onDimensionValueChange: function () {
    },
    
    _onPlay: function () {
      this.playing = !this.playing;
      this._updateUI();
      if (this.playing) {
        this._timer.start();
        this.onPlay();
      } else {
        this._timer.stop();
        this.onPause();
      }
    },
    
    constructor: function (params, srcNodeRef) {
      declare.safeMixin(this, params);
      this.playing = false;
      this._iconClass = "mdsButton mdsPlayButton";
      if (this.map) {
        this._getImageLayers();
      }
      if (this.layout === sliderLayouts.LAYOUT_HORIZONTAL) {
        this.templateString = widgetTemplate_horizontal;
      }
      this.thumbMovingRate = this.thumbMovingRate || 3000;
      this.prefetchImgNode = new Image();
      this._i18n = jsapiBundle;
    },
    
    postCreate: function () {
      this.inherited(arguments);
      
    },
    
    startup: function () {
      this.inherited(arguments);
      
      var _this = this;
      this._getAllLayersMDInfo().then(function (results) {
        _this._sortDimensionValues();
        _this.dimensionValues = (_this.dimensionValues && _this.dimensionValues.length && !_this.useLayersDimValues) ? _this.dimensionValues : _this._mapSortedDimensionValues;
        _this.getUnit();
        _this._setupSlider(true);
      });
      if (!this.showPlayButton) {
        //domStyle.set(this.playPauseBtn.domNode, "display", "none");
        domStyle.set(this.playPauseBtn.domNode, "display", "none");
        if (this.playPauseBtnRow) {
          domStyle.set(this.playPauseBtnRow, "display", "none");
        }
      } else {
        domStyle.set(this.playPauseBtn.domNode, "display", "block");
      }

      this._timer = new timingBase.Timer();
      this._timer.setInterval(this.thumbMovingRate);
      this._timer.onTick = lang.hitch(this, "_bumpSlider", 1);
      if (this.layout === sliderLayouts.LAYOUT_VERTICAL){
        this.computeSliderStyle();
        this.on("resize", lang.hitch(this, "computeSliderStyle"));
      }
    },
    
    testLog: function () {
    },
    
    _setDimensionAttr: function (dimensionArgs) {
      //var readMosaicRule = !esriLang.isDefined(this.slider);
      if (this._slider){
        if (dimensionArgs.dimension){
          this.dimension = dimensionArgs.dimension;
        }
        if (dimensionArgs.dimensionValues && dimensionArgs.dimensionValues.length){
          this.dimensionValues = dimensionArgs.dimensionValues;
        } else {
          this.dimensionValues = [];
        }
        this.update(false);
      }
    },
    
    update: function (persistValue) {
      var _this = this;
      this._mapSortedDimensionValues = [];
      this._getImageLayers();

      this.value = persistValue ? this.dimensionValues[this._slider.value] : null;
      this._getAllLayersMDInfo().then(function (results) {
        _this._sortDimensionValues();
        _this.getUnit();
        if(!_this.dimensionValues || !_this.dimensionValues.length || _this.useLayersDimSlices){
        _this.dimensionValues = _this._mapSortedDimensionValues;
      }
        _this._setupSlider(persistValue);
      });
    },
    
    pause: function () {
      this.playing = false;
      this._updateUI();
      this._timer.stop();
    },
    
    play: function () {
      if (this.playing === true) {
        return;
      }

      this.playing = false;
      this._onPlay();
    },
    
    _setupSlider: function(readMosaicRule){
      this._destroySlider();
      if (this.dimensionValues && this.dimensionValues.length) {
        this.sliderNode = document.createElement("div");
        this._getDimensionAlias();
        if (this._layers && this._layers.length && this._layers.length === 1 && readMosaicRule){
          this._readMosaicRule();
        }
        this._createRule();
        this._createLabels();
        this._createSlider();
        this._slider.onChange(this._slider.value);
      }
    },
    
    _createLabels: function(){
      if (this.layout === sliderLayouts.LAYOUT_HORIZONTAL) {
        this._createHorizontalLabels();
      } else {
        this._createVerticalLabels();  
      }
    },
    
    _createRule: function(){
      if (this.layout === sliderLayouts.LAYOUT_HORIZONTAL) {
        this._createHorizontalRule();
      } else {
        this._createVerticalRule();
      }
    },
    
    _createVerticalLabels: function () {
      this.labelsNode = document.createElement("div");
      this.sliderNode.appendChild(this.labelsNode);
      this._sliderLabels = new VerticalRuleLabels({
        labels: this._filterLabels(),
        labelStyle: "font-size: 75%; padding-left: 5px;"
      }, this.labelsNode);
    },
    
    _createVerticalRule: function () {
      this.rulesNode = document.createElement('div');
      this.sliderNode.appendChild(this.rulesNode);
      if (this.dimensionValues.length <= 100) {
        this._sliderRules = new VerticalRule({
          count: this.dimensionValues.length - 1,
          style: "width:5px;"
        }, this.rulesNode);
        this._sliderRules.startup();
      }
    },
    
    _createHorizontalLabels: function() {
      this.labelsNode = document.createElement("div");
      this.sliderNode.appendChild(this.labelsNode);
      this._sliderLabels = new HorizontalRuleLabels({
        labels: this._filterLabels(),
        labelStyle: "font-size: 75%"
      }, this.labelsNode);
    },
    
    _createHorizontalRule: function() {
      this.rulesNode = document.createElement('div');
      this.sliderNode.appendChild(this.rulesNode);
      if (this.dimensionValues.length <= 100) {
        this._sliderRules = new HorizontalRule({
          count: this.dimensionValues.length - 1,
          style: "height:5px;"
        }, this.rulesNode);
        this._sliderRules.startup();
      }
    },
    
    _createHorizontalSingleSlider: function(sliderValue) {
      var _this = this;
      this._slider = new HorizontalSlider({
        name: "horizontal",
        minimum: 0,
        maximum: this.dimensionValues.length - 1,
        intermediateChanges: false,
        discreteValues: this.dimensionValues.length,
        style: "width: 100%;",
        increment: lang.hitch(this, "_bumpSlider", 1),
        decrement: lang.hitch(this, "_bumpSlider", -1),
        value: sliderValue || 0,
        onChange: function (value) {
          var dimensionValue = _this.dimensionValues[value];
          _this.setDimensionInfoText(dimensionValue);
          array.forEach(_this._layers, function (layer) {
            _this._updateMosaicRule(layer, dimensionValue);
            if(_this.prefetch && _this.playing) {
              _this._prefetchData(value, layer);
            }
          });
          _this.onChange(dimensionValue);
        }
      }, _this.sliderNode);
      this._slider.startup();
    },
    
    _createHorizontalRangeSlider: function(sliderValue) {
      var _this = this;
      this._slider = new HorizontalRangeSlider({
        name: "horizontal",
        minimum: 0,
        maximum: this.dimensionValues.length - 1,
        intermediateChanges: false,
        discreteValues: this.dimensionValues.length,
        style: "width:100%;",
        increment: lang.hitch(this, "_bumpSlider", 1),
        decrement: lang.hitch(this, "_bumpSlider", -1),
        value: sliderValue || [0, 1],
        onChange: function (value) {
          var dimensionValues = [_this.dimensionValues[value[1]], _this.dimensionValues[value[0]]];
          _this.setDimensionInfoText(dimensionValues);
          array.forEach(_this._layers, function (layer) {
            _this._updateMosaicRule(layer, dimensionValues);
            if(_this.prefetch && _this.playing) {
              _this._prefetchData(value, layer);
            }
            _this.onChange(dimensionValues);
          });
        }
      }, _this.sliderNode);
      this._slider.startup();
      on(this._slider.incrementButton, "click", this._slider.increment);
      on(this._slider.decrementButton, "click", this._slider.decrement);
      this._slider._typematicCallback = function(){};
    },
    
    _createVerticalSingleSlider: function (sliderValue) {
      var _this = this;
      this._slider = new VerticalSlider({
        name: "vertical",
        minimum: 0,
        maximum: this.dimensionValues.length - 1,
        intermediateChanges: false,
        discreteValues: this.dimensionValues.length,
        style: this.computeSliderStyle(),
        increment: lang.hitch(this, "_bumpSlider", 1),
        decrement: lang.hitch(this, "_bumpSlider", -1),
        value: sliderValue || 0,
        onChange: function (value) {
          var dimensionValue = _this.dimensionValues[value];
            _this.setDimensionInfoText(dimensionValue);
          //var dd = _this._createDimensionalDefinition(_this.dimensionValues[value]);
          array.forEach(_this._layers, function (layer) {
            _this._updateMosaicRule(layer, dimensionValue);
            if(_this.prefetch && _this.playing) {
              _this._prefetchData(value, layer);
            }
          });
          _this.onChange(dimensionValue);
        }
      }, _this.sliderNode);
      this._slider.startup();
    },
    
    _createVerticalRangeSlider: function(sliderValue){
      var _this = this;
      this._slider = new VerticalRangeSlider({
        name: "vertical",
        minimum: 0,
        maximum: this.dimensionValues.length - 1,
        intermediateChanges: false,
        discreteValues: this.dimensionValues.length,
        style: this.computeSliderStyle(),
        increment: lang.hitch(this, "_bumpSlider", 1),
        decrement: lang.hitch(this, "_bumpSlider", -1),
        value: sliderValue || [0, 1],
        onChange: function (value) {
          var dimensionValues = [_this.dimensionValues[value[1]], _this.dimensionValues[value[0]]];
          dimensionValues.sort();
          _this.setDimensionInfoText(dimensionValues);
          //var dd = _this._createDimensionalDefinition(_this.dimensionValues[value]);
          array.forEach(_this._layers, function (layer) {
            _this._updateMosaicRule(layer, dimensionValues);
            if(_this.prefetch && _this.playing) {
              _this._prefetchData(value, layer);
            }
          });
          _this.onChange(dimensionValues);
        }
      }, _this.sliderNode);
      this._slider.startup();
      this._slider._typematicCallback = function(){};
    },
    
    _destroySlider: function(){
      if (this._slider) {
        this._slider.destroy();
        this._slider = null;
      }
    },
    
    _createSlider: function () {
      var sliderValue;
      this.mdSliderCell.appendChild(this.sliderNode);
      
      if (this.value && this.value.length) {
        if (array.indexOf(this.dimensionValues, this.value[0]) >= 0 && array.indexOf(this.dimensionValues, this.value[1]) >= 0) {
          sliderValue = [array.indexOf(this.dimensionValues, this.value[0]), array.indexOf(this.dimensionValues, this.value[1])];
        } else {
          sliderValue = [0,1];
        }
      } else if (this.value) {
        if (array.indexOf(this.dimensionValues, this.value) >= 0){
          sliderValue = array.indexOf(this.dimensionValues, this.value);
        } else {
          sliderValue = 0;
        }
      }
      
      if (this.thumbCount === 2) {
        if (this.layout === sliderLayouts.LAYOUT_HORIZONTAL) {
          this._createHorizontalRangeSlider(sliderValue);
        } else {
          this._createVerticalRangeSlider(sliderValue);
        }
      } else {
        if (this.layout === sliderLayouts.LAYOUT_HORIZONTAL) {
          this._createHorizontalSingleSlider(sliderValue);
        } else {
          this._createVerticalSingleSlider(sliderValue);
        }
      }
    },
    
    _getMultidimensionalInfo: function (layer) {
      var dfd = new Deferred();

      function getMDInfo () {
        layer.getMultidimensionalInfo().then(
          function (mdInfo) {
            layer.multidimensionalInfo = mdInfo;
            dfd.resolve(layer);
          },
          function (error) {
            dfd.reject(error);
        });
      }

      if (layer.multidimensionalInfo) {
        dfd.resolve(layer);
      } else {
        if (layer.loaded) {
          getMDInfo();
        } else {
          layer.on("load", function () {
            getMDInfo();
          });
        }
      }

      return dfd.promise;
    },
    
    _getAllLayersMDInfo: function () {
      var dfds = [], _this = this;

      array.forEach(this._layers, function (layer) {
        dfds.push(_this._getMultidimensionalInfo(layer));
      });

      return promiseList(dfds);
    },
    
    _getImageLayers: function () {
      var mapLayerIds = this.map.layerIds.concat(this.map.graphicsLayerIds), _this = this, layer;
      this._layers = [];
      array.forEach(mapLayerIds, function (layerId) {
        layer = _this.map.getLayer(layerId);
        if (layer.declaredClass === "esri.layers.ArcGISImageServiceLayer" || layer.declaredClass === "esri.layers.ArcGISImageServiceVectorLayer") {
          _this._layers.push(layer);
        }
      });
    },
    
    _sortDimensionValues: function () {
      var _this = this, i = 0;
      function merge (left, right) {
        var result = [],
                il = 0,
                ir = 0;

        while (il < left.length && ir < right.length) {
          if (left[il] < right[ir]) {
            result.push(left[il++]);
          } else if (left[il] > right[ir]) {
            result.push(right[ir++]);
          } else {
            result.push(right[ir++]);
            il++;
          }
        }

        return result.concat(left.slice(il)).concat(right.slice(ir));
      }

      var layerDimensionObjects = [];
      this._layers = this._filterLayers();

      array.forEach(this._layers, function (layer) {
        if (layer.multidimensionalInfo) {
          array.some(layer.multidimensionalInfo.variables, function (variable) {
            array.some(variable.dimensions, function (dimension) {
              if (dimension.name === _this.dimension && !dimension.hasRanges) {
                layerDimensionObjects.push(dimension);
              }
            });
          });
        }
      });

      if (layerDimensionObjects.length === 1) {
        this._mapSortedDimensionValues = layerDimensionObjects[0].values;
      } else if (layerDimensionObjects.length > 1) {
        this._mapSortedDimensionValues = layerDimensionObjects[0].values;
        for (i = 1; i < layerDimensionObjects.length; i++) {
          this._mapSortedDimensionValues = merge(this._mapSortedDimensionValues, layerDimensionObjects[i].values);
        }
      }
      
    },
    
    _createDimensionalDefinition: function (value, variableName) {
      var values = (value.constructor === Array) ? value : [value];
      var dd = new DimensionalDefinition({
        variableName: variableName,
        dimensionName: this.dimension,
        values: values,
        isSlice: (values.length === 1)
      });
      return dd;
    },
    
    _updateMosaicRule: function (layer, dimensionValues) {
      var _this = this, updatedMosaicRule = false;
      var mosaicRule = layer.mosaicRule || layer.defaultMosaicRule || new MosaicRule({multidimensionalDefinition: []});
      var multidimensionalDefinition = mosaicRule.multidimensionalDefinition || [];

      if (dimensionValues.length) {
        dimensionValues.sort(function(a,b){
          return a-b;
        });
      }

      array.forEach(multidimensionalDefinition, function (dimensionalDef) {
        if (dimensionalDef.dimensionName === _this.dimension) {
          dimensionalDef.values = dimensionValues.length ? dimensionValues : [dimensionValues];
          dimensionalDef.isSlice = !esriLang.isDefined(dimensionValues.length);
          updatedMosaicRule = true;
        }
      });
      
      if (!updatedMosaicRule) {
        if (array.some(layer.multidimensionalInfo.variables, function (variable) {
          if (array.some(variable.dimensions, function (dimension) {
            if (dimension.name === _this.dimension) {
              return true;
            }
          })) {
            return true;
          }
        })) {
          multidimensionalDefinition.push(_this._createDimensionalDefinition(dimensionValues, ""));
          updatedMosaicRule = true;
        }
      }

      if (updatedMosaicRule) {
        mosaicRule.multidimensionalDefinition = multidimensionalDefinition;
        layer.setMosaicRule(mosaicRule);
      }
    },
    
    _prefetchData: function (sliderValue, layer) {
      if (layer && layer.mosaicRule) { 
        var i, params, mosaicRule, _this = this, fetchValue = false;
        if (!this.prefetchedValues[layer.id]) {
          this.prefetchedValues[layer.id] = [];
        }
        params = lang.clone(layer._params);
        mosaicRule = lang.clone(layer.mosaicRule);
        for (i = 1; i <= this.prefetchFactor; i++) {
          fetchValue = false;
          array.forEach(mosaicRule.multidimensionalDefinition, function (def) {
            if (def.dimensionName === this.dimension) {
              if (sliderValue.length) {
                def.values = [this.dimensionValues[(sliderValue[0] + i) % this.dimensionValues.length],
                  this.dimensionValues[(sliderValue[1] + i) % this.dimensionValues.length]];
                def.values.sort(function(a,b){
                  return a-b;
                });
              } else {
                def.values = [this.dimensionValues[(sliderValue + i) % this.dimensionValues.length]];
              }
              if (!array.some(this.prefetchedValues[layer.id], function(value){
                if (JSON.stringify(value) === JSON.stringify(def.values)){
                  return true;
                }
              })){
                fetchValue = true;
                this.prefetchedValues[layer.id].push(def.values);
              }
            }
          }, this);
          if (fetchValue) {
            params.mosaicRule = JSON.stringify(mosaicRule.toJSON());
            layer.getImageUrl(this.map.extent, this.map.width, this.map.height, function (url) {
              _this.prefetchImgNode.src = url;
            }, params);
          }
        }
      }
    },
    
    setDimensionInfoText: function (dimensionValue) {
      if (!esriLang.isDefined(dimensionValue)) {
        return;
      }
      var unitSymbol = this.unitSymbol || this.unit;
      if (typeof dimensionValue !== "number"){
        var range = dimensionValue.sort();
        if ((range[0] % 1 !== 0) || (range[1] % 1 !== 0)){
          range[0] = parseFloat(range[0].toFixed(2));
          range[1] = parseFloat(range[1].toFixed(2));
        }
        dimensionValue = "[" + range[0] + ", " + range[1] + "]"; 
      } else {
        if (dimensionValue % 1 !== 0){
          dimensionValue = dimensionValue.toFixed(2);
        }
      }
      if (this.unitSymbol) {
        this.dimensionInfo.innerHTML = "<label style='font-weight:700;'>" + this.dimensionAlias + " (" + unitSymbol + ")</label>";
      } else {
        this.dimensionInfo.innerHTML = "<label style='font-weight:700;'>" + this.dimensionAlias + "</label>";
      }
      
      
      if (this.layout === sliderLayouts.LAYOUT_HORIZONTAL) {
        this.dimensionInfo.innerHTML += ": " + dimensionValue;
      } else {
        this.dimensionInfo.innerHTML += "<br/> " + dimensionValue;
      }
       
    },
    
    setLabels: function (labels) {

    },
    
    _filterLabels: function () {
      if (this.nLabels && this.dimensionValues && this.dimensionValues.length){
        var labelInterval = Math.ceil(this.dimensionValues.length/this.nLabels);
        var labels = array.map(this.dimensionValues, function (value, i) {
          if (i % labelInterval === 0 || i === (this.dimensionValues.length - 1)) {
            if ((value%1) != 0) {
              value = parseFloat(value.toFixed(2));
            }
            return value;
          }
          return "";
        }, this);
        return labels;
      }
    },
    
    _filterLayers: function () {
      var _this = this;
      return array.filter(this._layers, function (layer) {
        if(layer.multidimensionalInfo && layer.visible && layer.useMapDimensionValue/* && (array.indexOf(layer.activeMapDimensions, _this.dimension) >= 0)*/) {
          if(array.some(layer.multidimensionalInfo.variables, function(variable){
            if (array.some(variable.dimensions, function(dimension){
              if ((dimension.name == _this.dimension) && !dimension.hasRanges){
                return true;
              }
            })){
              return true;
            }
          })){
            return true;
          }
        }
        
        //return (layer.hasMultidimensions && layer.useMapDimensionValue);
      });
    },
    
    hasMdLayers: function () {
    },
    
    hasVisibleMdLayers: function () {
    },
    
    _updateUI: function () {
      domClass.remove(this.playPauseBtn.iconNode, this._iconClass);
      this._iconClass = this.playing ? "mdsButton mdsPauseButton" : "mdsButton mdsPlayButton";
      domClass.add(this.playPauseBtn.iconNode, this._iconClass);
    },
    
    _bumpSlider: function (dir) {
      var sliderVal = this._slider.value;
      //console.log("_bumpSlider");

      if (dir > 0) {
        if (sliderVal < 0 || sliderVal >= (this.dimensionValues.length - 1) || sliderVal[0] >= (this.dimensionValues.length - 1) || sliderVal[1] >= (this.dimensionValues.length - 1)) {
          if (this._timer.isRunning) {
            if (this.loop) {
              this._timer.stop();
              this.prefetchedValues = {};
              if (this.thumbCount === 2){
                this._slider.set("value", [0, Math.abs(sliderVal[0] - sliderVal[1])]);
              } else {
                this._slider.set("value", 0);
              }
              this._timer.start();
              this.playing = true;
            } else {
              this.pause();
            }
          }
        } else if (this.thumbCount === 2 && (sliderVal[0] < (this.dimensionValues.length - 1) && sliderVal[1] < (this.dimensionValues.length - 1))) {
          this._slider.set("value", [sliderVal[0] + 1, sliderVal[1] + 1]);
        }
        else if (this.thumbCount === 1 && (sliderVal < (this.dimensionValues.length - 1))){
          this._slider.set("value", sliderVal + 1);
        }
      } else if (dir < 0 && (sliderVal >= 0 || sliderVal[1] >= 0)) {
        if (this.thumbCount === 2 && (sliderVal[1] > 0 && sliderVal[0] > 0)) {
          this._slider.set("value", [sliderVal[0] - 1, sliderVal[1] - 1]);
        }
        else if (this.thumbCount === 1 && (sliderVal > 0)) {
          this._slider.set("value", sliderVal - 1);
        }
      }
    },
    
    setThumbMovingRate: function (thumbMovingRate) {
      this.thumbMovingRate = thumbMovingRate;
      if (this._timer) {
        this._timer.setInterval(this.thumbMovingRate);
      }
    },
    
    getFullDimensionRange: function () {
      if (this._mapSortedDimensionValues && this._mapSortedDimensionValues.length) {
        return [this._mapSortedDimensionValues[0], this._mapSortedDimensionValues[this._mapSortedDimensionValues.length - 1]];
      } 
    },
    
    setThumbCount: function(thumbCount){
      this.thumbCount = (thumbCount == 2) ? 2 : 1;
      this.value = this.dimensionValues[this._slider.value];
      this._setupSlider();
    },
    
    clearDimensionalDefinition: function(layer){
      var mdDefinition, updatedMdDefinition = [], mosaicRule;
      
      if (layer && layer.mosaicRule && layer.mosaicRule.multidimensionalDefinition) {
        mosaicRule = layer.mosaicRule;
        mdDefinition = mosaicRule.multidimensionalDefinition;
      
      array.forEach(mdDefinition, function(dimensionalDefinition) {
        if (dimensionalDefinition.dimensionName !== this.dimension) {
          updatedMdDefinition.push(dimensionalDefinition); 
        }
      }, this);
      
      mosaicRule.multidimensionalDefinition = updatedMdDefinition;
      layer.setMosaicRule(mosaicRule);
      }
    },
    
    getUnit: function() {
      var unit = null, unitConflict = false;
      this.unit = null;
      array.forEach(this._layers, function(layer){
        if (layer.multidimensionalInfo) {
          array.forEach (layer.multidimensionalInfo.variables, function(variable){
            array.forEach (variable.dimensions, function (dimension) {
              if (dimension.name === this.dimension && dimension.unit) {
                if (unit == null && !unitConflict) {
                 unit = dimension.unit.replace("esri", "");
               } else if (esriLang.isDefined(dimension.unit) && (dimension.unit.replace("esri", "").toLowerCase() != unit.toLowerCase())) {
                 unit = null;
                 unitConflict = true;
                 return;
               }
              }
            }, this);
          }, this );
        }
      }, this);
      if (unit) {
        unit = unit.replace("esri", "");
      }
      this.unit = unit;
      this.unitSymbol = this.getUnitSymbol();
      this._hasUnitConflict = unitConflict;
      return unit;
    },
    
    _getDimensionAlias: function(){
      this.dimensionAlias = this.dimension;
      array.some(this._layers, function(layer){
        if(layer.fields && layer.fields.length && array.some(layer.fields, function(field){
          if ((field.name && field.name === this.dimension) && field.alias) {
            this.dimensionAlias = field.alias;
            return true;
          }
        }, this)) {
          return true;
        }
      }, this);
    },
    
    _readMosaicRule: function() {
      //console.log("getDimensionValue");
      var dimensionValue, valueIdx, sliderIdx = [];
      array.forEach(this._layers, function(layer){
        if (layer.mosaicRule && layer.mosaicRule.multidimensionalDefinition) {
          array.forEach (layer.mosaicRule.multidimensionalDefinition, function(definition){
            if (definition.dimensionName === this.dimension) {
              dimensionValue = definition.values;
            }
          }, this);
        }
      }, this);
      
      if (dimensionValue) {
      if (dimensionValue.length === 1) {
        this.thumbCount = 1;
        this.value = dimensionValue[0];
      } else {
        this.thumbCount = 2;
        this.value = dimensionValue;
      }
    }
  },
  
  hasUnitConflict: function() {
    this.getUnit();
    return this._hasUnitConflict;
  },
  
  computeSliderStyle: function(){
    var sliderHeight, sliderStyle;
    sliderHeight = domGeom.getContentBox(this.mdSliderTable).h - domGeom.getContentBox(this.dimensionInfo).h ;
    
    if (has("ie") <= 10) {
      sliderHeight -= 53;
    } 
    if (this.showPlayButton) {
      sliderHeight -= 35;
    }
    
    sliderStyle = ("height: " + sliderHeight + "px;");
    if (this._slider && this._slider.domNode) {
      domStyle.set(this._slider.domNode, "height", sliderHeight + "px");
    }
    
    return sliderStyle;
  },
  
  getUnitSymbol: function(){
    if (!esriLang.isDefined(this.unit)) {
      return null;
    } else {
      var unitString = this.unit.toLowerCase();
      if (unitString === "meters" || unitString === "meter") {
        return this.unitSymbols["meter"];
      } else if ((unitString === "pascal" || unitString === "pascals")) {
        return this.unitSymbols["pascal"];
      }
    }
   }
    
  });
  
  lang.mixin(MDS, sliderLayouts);
  
   

  return MDS;
});
