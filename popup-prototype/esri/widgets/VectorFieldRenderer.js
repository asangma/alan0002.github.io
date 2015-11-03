define([
  "../core/declare",
  "dojo/_base/lang",
  "dojo/_base/array",

  "dojo/i18n!../nls/jsapi",
  "dojo/text!./templates/VectorFieldRenderer.html",
  "dojo/store/Memory",
  "dojo/data/ObjectStore",
  "dojo/query",
  "dojo/topic",
  "dojo/dom-style",
  "dojo/dom-construct",

  "../renderers/VectorFieldRenderer",
  "../Color",
  "../core/lang",
  "../core/screenUtils",

  "dijit/_WidgetBase",
  "dijit/_TemplatedMixin",
  "dijit/_WidgetsInTemplateMixin",

  "dijit/form/HorizontalSlider",
  "dijit/form/HorizontalRuleLabels",
  "dojox/form/HorizontalRangeSlider",
  "dojox/gfx",
  "require",

  "dijit/form/FilteringSelect",
  "dijit/form/RadioButton",
  "dijit/form/Select",
  "./ColorPicker",
  "dijit/form/DropDownButton",
  "dijit/TitlePane",
  "dijit/form/NumberTextBox",
  "dijit/form/Button"
],

function (
  declare, lang, array, jsapiBundle,
  template, Memory, ObjectStore, query, topic, domStyle, domConstruct,
  VectorFieldRenderer, Color, esriLang, screenUtils,
  _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin,
  HorizontalSlider, HorizontalRuleLabels, HorizontalRangeSlider, gfx, require
  ) {
  var Widget = declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {

    templateString: template,
    declaredClass: "esri.widgets.VectorFieldRenderer",
    widgetsInTemplate: true,
    layer: null, //layer on which the vector field renderer is set
    map: null, //map object
    _rendererTypes: ["simpleScalar", "singleArrow", "windBarbs", "beaufort", "oceanCurrentKnots", "oceanCurrentMps", "classifiedArrow"],
    _rendererTypeData: [],
    _vfrObject: null, //VectorFieldRenderer object
    _defaultVFRName: "classifiedArrow",
    propertiesChanged: true,
    resetAvailable: true,

    constructor: function (options) {
      declare.safeMixin(this, options);
      this._i18n = jsapiBundle;
      this._setupDefaults();
    },

    startup: function (args) {
      this.inherited(arguments);
      var _self = this;
      this._arrowSymbolButtonNode = query(".dijitButtonNode", query(".esriVFRColorButton")[0])[0];
      this.symbolColorPicker.onColorChange = function (evt) {
        _self._updateArrowSymbolButton();
        _self.propertiesChanged = true;
      };

      topic.subscribe("onVectorFieldRendererApply", lang.hitch(this, "_onClickApplyVectorFieldRenderer"));
      topic.subscribe("onVectorFieldRendererReset", lang.hitch(this, "_onClickResetVectorFieldRenderer"));
      this.startupCalled = true;
    },

    postCreate: function (args) {
      this.inherited(arguments);
      var _self = this;

      this.advancedSettingsPane.set("title", this._i18n.widgets.vectorFieldRenderer.advancedOptionsTitle);
      this.minMagnitudeInput.set("invalidMessage", this._i18n.widgets.vectorFieldRenderer.invalidNumberMessage);
      this.maxMagnitudeInput.set("invalidMessage", this._i18n.widgets.vectorFieldRenderer.invalidNumberMessage);
      domStyle.set(this.symbolColorPicker.dap_transparencySection, "display", "none");
      this._popuplateRendererList();
      this._createTileSizeSlider();
      this._createSymbolSizeSlider();

      if (this.hideApplyButton) {
        domStyle.set(this.applyButton.domNode, "display", "none");
      }

      if (this.layer.loaded) {
        this._loadVFRArguments();
      } else {
        this.layer.on("load", function () {
          _self._loadVFRArguments();
        });
      }
    },

    _setLayerAttr: function (value) {
      if (!value || !this.startupCalled) {
        return;
      }
      var _self = this;
      this.layer = value;
      this.inherited(arguments);
      this.advancedSettingsPane.set("open", false);
      if (this.layer.loaded) {
        this._loadVFRArguments();
      } else {
        this.layer.on("load", function () {
          _self._loadVFRArguments();
        });
      }
    },

    _addRendererTypeToList: function (name, desc, id, sampleImgUrl) {
      var item = {};
      item.label = "<html><body><section><table><tr><td colspan='2'><b>" +
              name +
              "<b></td></tr><tr>"+ "<td><img src='" +
              sampleImgUrl +
              "' height='90' width='90'></td>" +
              "<td><p style='white-space:pre-wrap;width:35ex;'><i>" +
              desc + 
              "</i></p><td></tr></table></section></body></html>";
      item.name = name;
      item.desc = desc;
      item.id = id;

      this._rendererTypeData.push(item);
    },

    _popuplateRendererList: function () {
      var _self = this;

      array.forEach(this._rendererTypes, function (type) {
        var name = _self._i18n.widgets.vectorFieldRenderer[type + "LabelTitle"];
        var desc = _self._i18n.widgets.vectorFieldRenderer[type + "Desc"];
        var sampleImgUrl = require.toUrl("./images/vfr_" + type + ".png");
        _self._addRendererTypeToList(name, desc, type, sampleImgUrl);
      });

      this._rendererTypeStore = new Memory({
        data: this._rendererTypeData
      });

      this.rendererTypeSelect.set("store", this._rendererTypeStore);
      this.rendererTypeSelect.set("labelAttr", "label");
      this.rendererTypeSelect.set("labelType", "html");
    },

    _createTileSizeSlider: function () {
      var _self = this, labels = [], i, nTicks = 80;

      var symbolDensityLabelsNode = domConstruct.create("div");
      this.symbolDensitySliderDiv.appendChild(symbolDensityLabelsNode);

      for (i = 0; i < nTicks; i++) {
        if (i === 0) {
          labels.push(this._i18n.widgets.vectorFieldRenderer.sparseTileSizeAlias);
        } else if (i === (nTicks - 1)) {
          labels.push(this._i18n.widgets.vectorFieldRenderer.denseTileSizeAlias);
        } else {
          labels.push("");
        }
      }

      var symbolDensityLabels = new HorizontalRuleLabels({
        labels: labels,
        labelStyle: "font-size: 75%"
      }, symbolDensityLabelsNode);

      this._symbolDensitySlider = new HorizontalSlider({
        value: 1 / 50,
        minimum: 1 / 100,
        maximum: 1 / 20,
        intermediateChanges: false,
        discreteValues: 81,
        style: "width: 100%",
        onChange: function (value) {
          _self._setPropertiesChanged();
        }
      }, this.symbolDensitySliderDiv);

    },

    _createSymbolSizeSlider: function () {
      var _self = this, labels = [], i, nTicks = 100;

      var symbolSizeLabelsNode = domConstruct.create("div");
      this.symbolSizeSliderDiv.appendChild(symbolSizeLabelsNode);

      for (i = 0; i < nTicks; i++) {
        if (i === 0) {
          labels.push(this._i18n.widgets.vectorFieldRenderer.minSymbolSizeAlias);
        } else if (i === (nTicks - 1)) {
          labels.push(this._i18n.widgets.vectorFieldRenderer.maxSymbolSizeAlias);
        } else {
          labels.push("");
        }
      }

      var symbolSizeLabels = new HorizontalRuleLabels({
        labels: labels,
        labelStyle: "font-size: 75%"
      }, symbolSizeLabelsNode);

      this._symbolSizeSlider = new HorizontalRangeSlider({
        value: [20, 80],
        minimum: 0,
        maximum: 100,
        discreteValues: 101,
        intermediateChanges: false,
        style: "width: 100%",
        onChange: function (value) {
          _self._setPropertiesChanged();
        }
      }, this.symbolSizeSliderDiv);
    },

    _selectRendererStyle: function (value) {
      if (value === "singleArrow") {
        this._showColorPickerButton();
      } else {
        this._hideColorPickerButton();
      }
      this._refreshOutputUnitSelect();
      if (!this.layer.getFlowRepresentation()) {
        if (value === "beaufort" || value === "windBarbs") {
          this.flowAngleSelect.set("value", "FLOW_FROM");
        } else if (value === "oceanCurrent") {
          this.flowAngleSelect.set("value", "FLOW_TO");
        }
      }
      this.propertiesChanged = true;
    },

    _showColorPickerButton: function () {
      var color = this.singleArrowDefaultColor;
      
      if (this.layer.renderer && this.layer.renderer.renderer && this.layer.renderer.renderer.defaultSymbol &&
          this.layer.rendererStyle == VectorFieldRenderer.STYLE_SINGLE_ARROW){ 
        this.layer.renderer.renderer.defaultSymbol.color;
      }
                   
      this.symbolColorPicker.set("color", color);
      domStyle.set(this.colorPickerButton.domNode, "display", "block");
    },

    _hideColorPickerButton: function () {
      domStyle.set(this.colorPickerButton.domNode, "display", "none");
    },

    _setupDefaults: function () {
      this.singleArrowDefaultColor = new Color([0, 92, 230]);
    },

    _loadVFRArguments: function () {
      if (!(this.layer && this.layer.renderer)) {
        return console.log("Layer not present");
      }
      this._loadVFRStyle();
      this._loadSymbolSizeValues();
      this._loadTileSizeValue();
      this._loadMinMaxValues();
      this._loadAngleDirection();
      this._loadColor();
      this._loadUnits();
    },

    _loadVFRStyle: function () {
      switch (this.layer.renderer.style) {
        case VectorFieldRenderer.STYLE_SCALAR:
          this.rendererTypeSelect.set("value", this._rendererTypes[0]);
          break;
        case VectorFieldRenderer.STYLE_SINGLE_ARROW:
          this.rendererTypeSelect.set("value", this._rendererTypes[1]);
          this._loadColor();
          break;
        case VectorFieldRenderer.STYLE_BEAUFORT_KN:
        case VectorFieldRenderer.STYLE_BEAUFORT_METER:
        case VectorFieldRenderer.STYLE_BEAUFORT_MILE:
        case VectorFieldRenderer.STYLE_BEAUFORT_FEET:
        case VectorFieldRenderer.STYLE_BEAUFORT_KM:
          this.rendererTypeSelect.set("value", this._rendererTypes[3]);
          break;
        case VectorFieldRenderer.STYLE_OCEAN_CURRENT_M:
          this.rendererTypeSelect.set("value", this._rendererTypes[5]);
          break;
        case VectorFieldRenderer.STYLE_OCEAN_CURRENT_KN:
          this.rendererTypeSelect.set("value", this._rendererTypes[4]);
          break;
        case VectorFieldRenderer.STYLE_CLASSIFIED_ARROW:
          this.rendererTypeSelect.set("value", this._rendererTypes[6]);
          break;
        case VectorFieldRenderer.STYLE_WIND_BARBS:
          this.rendererTypeSelect.set("value", this._rendererTypes[2]);
          break;
        default:
          this.rendererTypeSelect.set("value", this._rendererTypes[1]);
          break;
      }
    },

    _loadSymbolSizeValues: function () {
      var minPercentTileSize = 20,
          maxPercentTileSize = 80,
          sizeInfoVariable;

      var visualVariables = this.layer.renderer.visualVariables;
      array.forEach(visualVariables, function (variable) {
        if (variable.type === "sizeInfo") {
          sizeInfoVariable = variable;
        }
      });

      if (sizeInfoVariable && sizeInfoVariable.minSize && sizeInfoVariable.maxSize && this.layer.graphics.length) {
        minPercentTileSize = sizeInfoVariable.minSize / this.layer.symbolTileSize * 100;
        maxPercentTileSize = sizeInfoVariable.maxSize / this.layer.symbolTileSize * 100; 
      }

      this._symbolSizeSlider.set("value", [minPercentTileSize, maxPercentTileSize]);
    },

    _loadTileSizeValue: function () {
      this._symbolDensitySlider.set("value", this.layer.symbolTileSize ? (1 / this.layer.symbolTileSize) : 1 / 50);
    },

    _loadMinMaxValues: function () {
      var sizeInfoVariable;
      var visualVariables = this.layer.renderer.visualVariables;
      array.forEach(visualVariables, function (variable) {
        if (variable.type === "sizeInfo") {
          sizeInfoVariable = variable;
        }
      });

      this.minMagnitudeInput.set("value", sizeInfoVariable && esriLang.isDefined(sizeInfoVariable.minDataValue) ? sizeInfoVariable.minDataValue : "");
      this.maxMagnitudeInput.set("value", sizeInfoVariable && esriLang.isDefined(sizeInfoVariable.maxDataValue) ? sizeInfoVariable.maxDataValue : "");
    },

    _loadAngleDirection: function () {
      var layerFlowRepresentation = this.layer.getFlowRepresentation();
      var isKeyPropertyAvailable = layerFlowRepresentation ? true : false;
      var flowRepresentationVal = "FLOW_FROM";
      if (isKeyPropertyAvailable) {
        flowRepresentationVal = layerFlowRepresentation == VectorFieldRenderer.FLOW_TO ? "FLOW_TO" : "FLOW_FROM";
      } else {
        flowRepresentationVal = this.layer.renderer.flowRepresentation == VectorFieldRenderer.FLOW_TO ? "FLOW_TO" : "FLOW_FROM";
      }

      this.flowAngleSelect.set("value", flowRepresentationVal);
      this.flowAngleSelect.set("disabled", isKeyPropertyAvailable);
    },

    _loadColor: function () {
      if (this.layer.renderer && this.layer.renderer.renderer && this.layer.renderer.renderer.defaultSymbol && this.startupCalled) {
        this.symbolColorPicker.set("color", this.layer.renderer.renderer.defaultSymbol.color);
        this._updateArrowSymbolButton();
      }
    },

    _loadUnits: function () {
      if (this.layer.vectorFieldPixelFilter) {
        if (this.layer.vectorFieldPixelFilter.inputUnit) {
          this.inputDataUnitSelect.set("value", this.layer.vectorFieldPixelFilter.inputUnit);
        } else {
          this.inputDataUnitSelect.set("value", "NO_UNIT");
        }
        if (this.layer.vectorFieldPixelFilter.outputUnit) {
          this.outputDataUnitSelect.set("value", this.layer.vectorFieldPixelFilter.outputUnit);
        }
      }
    },

    _onOutputUnitChange: function (value) {
      if (value && value != "NO_UNIT") {
        this.dataValueRangeUnit.innerHTML = " in <strong>" + this._i18n.widgets.vectorFieldRenderer[value] + "</strong>.";
      } else {
        this.dataValueRangeUnit.innerHTML = ".";
      }
      this.propertiesChanged = true;

    },

    _onClickApplyVectorFieldRenderer: function () {
      if (!this.propertiesChanged) {
        return;
      }
      var rendererType = VectorFieldRenderer.STYLE_SINGLE_ARROW, minSymbolSize, maxSymbolSize,
        symbolTileSize, singleArrowColor, min, max, flowRepresentation, singleArrowSymbol;

      symbolTileSize = Math.floor(1 / this._symbolDensitySlider.value);
      minSymbolSize = screenUtils.px2pt(this._symbolSizeSlider.value[0] / 100 * symbolTileSize);
      maxSymbolSize = screenUtils.px2pt(this._symbolSizeSlider.value[1] / 100 * symbolTileSize);
      min = !isNaN(this.minMagnitudeInput.value) ? this.minMagnitudeInput.value : null;
      max = !isNaN(this.maxMagnitudeInput.value) ? this.maxMagnitudeInput.value : null;
      flowRepresentation = VectorFieldRenderer[this.flowAngleSelect.value];

      if (this.rendererTypeSelect.value == "singleArrow") {
        rendererType = VectorFieldRenderer.STYLE_SINGLE_ARROW;
        singleArrowColor = this.symbolColorPicker.color;
      } else if (this.rendererTypeSelect.value == "simpleScalar") {
        rendererType = VectorFieldRenderer.STYLE_SCALAR;
      } else if (this.rendererTypeSelect.value == "beaufort") {
        if (this.outputDataUnitSelect.value == "esriKnots") {
          rendererType = VectorFieldRenderer.STYLE_BEAUFORT_KN;
        } else if (this.outputDataUnitSelect.value == "esriMetersPerSecond"){
          rendererType = VectorFieldRenderer.STYLE_BEAUFORT_METER;
        } else if (this.outputDataUnitSelect.value == "esriMilesPerHour"){
          rendererType = VectorFieldRenderer.STYLE_BEAUFORT_MILE;
        } else if (this.outputDataUnitSelect.value == "esriKilometersPerHour"){
          rendererType = VectorFieldRenderer.STYLE_BEAUFORT_KM;
        }
      } else if (this.rendererTypeSelect == "oceanCurrentKnots") {
          rendererType = VectorFieldRenderer.STYLE_OCEAN_CURRENT_KN;
      } else if (this.rendererTypeSelect == "oceanCurrentMps") {
          rendererType = VectorFieldRenderer.STYLE_OCEAN_CURRENT_M;
      } else if (this.rendererTypeSelect == "classifiedArrow") {
        rendererType = VectorFieldRenderer.STYLE_CLASSIFIED_ARROW;
      } else if (this.rendererTypeSelect == "windBarbs") {
        rendererType = VectorFieldRenderer.STYLE_WIND_BARBS;
      }

      if (this.symbolColorPicker && this.symbolColorPicker.color) {
        singleArrowSymbol = this.layer.renderer._getDefaultSymbol(new Color(this.symbolColorPicker.color));
      }

      var inputUnit = this.inputDataUnitSelect.value !== "NO_UNIT" ? this.inputDataUnitSelect.value : "",
        outputUnit = this.outputDataUnitSelect.value !== "NO_UNIT" ? this.outputDataUnitSelect.value : "";

      this.layer.vectorFieldPixelFilter.setUnits(inputUnit, outputUnit);
      this.layer.rendererStyle = rendererType;
      
     
      var sizeInfoVar = {
        type: "sizeInfo",
        minSize: minSymbolSize,
        maxSize: maxSymbolSize,
        minDataValue: min,
        maxDataValue: max
      };
      
      var visualVariables = [];
      visualVariables.push(sizeInfoVar);

      var renderer = new VectorFieldRenderer({
        style: rendererType,
        visualVariables: visualVariables,
        flowRepresentation: flowRepresentation,
        singleArrowSymbol: singleArrowSymbol || null,
        outputUnit: outputUnit,  // NIK: need to handle this seperately...
        inputUnit: inputUnit
      });

      this.layer.setRenderer(renderer);
      
      if (this.layer.symbolTileSize !== symbolTileSize){
        this.layer.symbolTileSize = symbolTileSize;
        this.layer.refresh();
      } else {
        this.layer.redraw();
      }

      this._loadVFRStyle();
      this.propertiesChanged = false;
      this.resetAvailable = true;
      
    },

    _onClickResetVectorFieldRenderer: function () {
      if (!this.layer || (!this.propertiesChanged && !this.resetAvailable)) {
        return;
      }
      // NIK: I think we should just set the default style on the layer and let it handle the defaults for VFR
      var _self = this;
      this.layer.symbolTileSize = 50;
      this.layer.setVectorRendererStyle(VectorFieldRenderer.STYLE_SINGLE_ARROW);
      var symbolTileSize = Math.floor(1 / this._symbolDensitySlider.value);
      if (this.layer.vectorFieldPixelFilter) {
        this.layer.vectorFieldPixelFilter.setUnits(null, null);
      }
      if (this.layer.symbolTileSize !== symbolTileSize){
        this.layer.refresh();
      } else {
        this.layer.redraw();
      }
      this._loadVFRArguments();
      this.propertiesChanged = false;
      this.resetAvailable = false;
      setTimeout(function(){ 
        _self.propertiesChanged = false; 
      }, 500);
    },

    _updateArrowSymbolButton: function (color) {
      this._arrowSymbolButtonNode.innerHTML = "";
      var sWidth = 24, sHeight = 24;
      var surface = gfx.createSurface(this._arrowSymbolButtonNode, 24, 24);

      var gfxShape = surface.createShape({
        type: "path",
        path: "M14,32 14,18 9,23 16,3 22,23 17,18 17,32 z"
      }).setFill(color ? color : this.symbolColorPicker.color);

      var dim = surface.getDimensions();
      var transform = {
        dx: 0,
        dy: 0
      };

      var bbox = gfxShape.getBoundingBox(), width = bbox.width, height = bbox.height;
      if (width < sWidth || height < sHeight) {
        var actualSize = width;
        var refSize = sWidth;
        var scaleBy = (actualSize + 5) / refSize;
        lang.mixin(transform, {
          xx: scaleBy,
          yy: scaleBy
        });
      }

      gfxShape.applyTransform(transform);
      return surface;
    },

    _onInputUnitChange: function (value) {
      if (value != "NO_UNIT" || this.rendererTypeSelect.value == "beaufort" || this.rendererTypeSelect.value == "oceanCurrent") {
        this.outputDataUnitSelect.set("disabled", false);
      } else {
        this.outputDataUnitSelect.set("value", "NO_UNIT");
        this.outputDataUnitSelect.set("disabled", true);
      }
      this.propertiesChanged = true;
    },

    _refreshOutputUnitSelect: function () {
      this._outputUnits = [];
      if (this.rendererTypeSelect.value != "oceanCurrentMps") {
        this._outputUnits.push({ id: "esriKnots", label: this._i18n.widgets.vectorFieldRenderer.esriKnots });
      }
      if (this.rendererTypeSelect.value != "oceanCurrentKnots" && this.rendererTypeSelect.value != "windBarbs"){
        this._outputUnits.push({ id: "esriMetersPerSecond", label: this._i18n.widgets.vectorFieldRenderer.esriMetersPerSecond });
        if (this.rendererTypeSelect.value != "oceanCurrentMps") {
          this._outputUnits.push({ id: "esriKilometersPerHour", label: this._i18n.widgets.vectorFieldRenderer.esriKilometersPerHour });
          this._outputUnits.push({ id: "esriMilesPerHour", label: this._i18n.widgets.vectorFieldRenderer.esriMilesPerHour});
          if (this.rendererTypeSelect.value != "beaufort") {
            this._outputUnits.push({ id: "esriFeetPerSecond", label: this._i18n.widgets.vectorFieldRenderer.esriFeetPerSecond });
            this._outputUnits.push({ id: "NO_UNIT", label: " ", selected: true });
          }
        }
      }
      var outputUnitsStore = new Memory({
        data: this._outputUnits
      });

      var outputUnitsObjectStore = new ObjectStore({ objectStore: outputUnitsStore });
      
      this.outputDataUnitSelect.set("store", outputUnitsObjectStore);
      if (this.rendererTypeSelect.value === "oceanCurrentKnots" || this.rendererTypeSelect.value === "beaufort") {
        this.outputDataUnitSelect.set("value", "esriKnots");
      } else if (this.rendererTypeSelect.value === "oceanCurrentMps") {
        this.outputDataUnitSelect.set("value", "esriMetersPerSecond");
      }
    },
    
    _setPropertiesChanged: function(){
       this.propertiesChanged = true;
    }

  });

  return Widget;
});
