define([
    "./ColorPicker",
    "../core/domUtils",
    "../kernel",
    "../symbols/PictureMarkerSymbol",
    "../symbols/SimpleMarkerSymbol",

    "./Widget",
    "./_Tooltip",
    "./ColorPicker/colorUtil",
    "./SymbolStyler/_DelayedUpdate",
    "./SymbolStyler/IconSelect",
    "./SymbolStyler/MarkerSymbolPicker",
    "./SymbolStyler/schemeUtil",
    "./SymbolStyler/stylerUtil",
    "./SymbolStyler/symbolUtil",

    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dijit/a11yclick",
    "dijit/form/CheckBox",

    "dojo/_base/array",
    "../core/declare",
    "dojo/_base/lang",
    "dojo/dom-class",
    "dojo/dom-construct",
    "dojo/has",
    "dojo/keys",
    "dojo/on",
    "dojo/string",

    "dojo/i18n!esri/nls/jsapi",

    "dojo/text!./SymbolStyler/templates/SymbolStyler.html",

    "./HorizontalSlider",

    "./SymbolStyler/MarkerSymbolPicker",
    "./SymbolStyler/ColorRampPicker",

    "dijit/form/Button",
    "dijit/form/ComboBox",
    "dijit/form/NumberSpinner",
    "dijit/form/Select",
    "dijit/form/TextBox",
    "dijit/layout/BorderContainer",
    "dijit/layout/ContentPane",
    "dijit/layout/StackController",
    "dijit/layout/StackContainer"
  ],
  function (
    ColorPicker, domUtils, esriKernel, PictureMarkerSymbol, SimpleMarkerSymbol,
    Widget, TooltipMixin, colorUtil, BatchUpdateMixin, IconSelect, MarkerSymbolPicker, schemeUtil, stylerUtil, symbolUtil,
    TemplatedMixin, WidgetsInTemplateMixin, a11yclick, CheckBox,
    array, declare, lang, domClass, domConstruct, has, keys, on, string,
    nlsJsapi,
    template
  ) {

    var SymbolStyler = declare([
      Widget, TemplatedMixin, WidgetsInTemplateMixin, BatchUpdateMixin, TooltipMixin
    ], {

      _RECENT_FILL_COLORS_ITEM_KEY: "symbolStyler/recent/fill/colors",
      _RECENT_OUTLINE_COLORS_ITEM_KEY: "symbolStyler/recent/outline/colors",

      _defaultMinLineWidthInPx: 0,
      _defaultMinShapeSizeInPx: 1,
      _defaultMaxLineWidthInPx: 18,
      _defaultMaxShapeSizeInPx: 120,

      declaredClass: "esri.widgets.SymbolStyler",

      baseClass: "esriSymbolStyler",

      templateString: template,

      labels: null,

      css: {
        symbolPreviewContainer: "esriSymbolPreviewContainer",
        symbolPreview: "esriSymbolPreview",
        tabBar: "esriTabBar",
        content: "esriContent",
        link: "esriLink",
        label: "esriLabel",
        shapeImageUrlContainer: "esriShapeImageUrlContainer",
        urlInput: "esriUrlInput",
        addIcon: "esriAddIcon",
        errorDisplay: "esriErrorDisplay",
        symbolSizeInput: "esriSymbolSizeInput",
        inlineInput: "esriInlineInput",
        text: "esriText",
        hidden: "esriHidden",
        lineWidthInput: "esriLineWidthInput",
        linePattern: "esriLinePattern",
        linePatternInput: "esriLinePatternInput",
        alt: "esriAlt",
        disabled: "esriDisabled"
      },

      _originalSymbol: null,

      _editedSymbol: null,

      _activeTabName: null,

      _externalSizing: false,

      _delayedCommitPropsTrigger: null,

      _symbolPreviewSurface: null,

      _linePatternSelect: null,

      _symbolPicker: null,

      _customImageSymbol: null,

      _optimizationSection: null,

      _optimizationCheckBox: null,

      _isPreppingEdit: null,

      constructor: function (opts) {
        opts = opts ? opts : {};

        this._delayedCommitPropsTrigger = this.createUpdateTrigger(this._commitProperties, this);
        this._initOptimizationControls();
      },

      _initOptimizationControls: function() {

        // optimization controls will be injected based on certain conditions
        var checkBox = new CheckBox(),
            section  = domConstruct.create("div", {
              className: ColorPicker.prototype.css.section
            });

        domConstruct.create("label", {
          "for": checkBox.id,
          className: this.css.label,
          innerHTML: nlsJsapi.widgets.symbolEditor.autoAdjustOutline
        }, section);

        checkBox.on("change", lang.hitch(this, function(checked) {

          // sync color picker
          var color = this.dap_outlineColorPicker.get("color");
          color.a = checked ? 0.5 : 1;
          this.dap_outlineColorPicker.set("color", color);

          this._delayedCommitPropsTrigger();
        }));

        checkBox.placeAt(section, "first");

        this._optimizationSection = section;
        this._optimizationCheckBox = checkBox;
      },

      postMixInProperties: function () {
        this.inherited(arguments);

        this.labels = lang.mixin({}, nlsJsapi.common, nlsJsapi.widgets.symbolEditor);
      },

      _toggleOutlineColorControls: function(symbol) {
        var colorRampPicker = this.dap_outlineColorRampPicker,
            colorPicker     = this.dap_outlineColorPicker;

        if (this._shouldShowOutlineColorRamp(symbol)) {
          this._show(colorRampPicker);
          this._hide(colorPicker);
        }
        else {
          this._show(colorPicker);
          this._hide(colorRampPicker);
        }
      },

      _shouldShowOutlineColorRamp: function (symbol) {
        var su = symbolUtil;

        return this._hasColorRamp() &&
               (su.isLine(symbol) ||
                su.isPoint(symbol) && su.hasPureOutlineStyle(symbol));
      },

      _setUpColorControls: function (schemes, colorRamp) {
        var outlineColorRampPicker = this.dap_outlineColorRampPicker,
            outlineColorPicker = this.dap_outlineColorPicker,

            fillColorRampPicker = this.dap_fillColorRampPicker,
            fillColorPicker = this.dap_fillColorPicker,

            colorRampSelection;

        if (colorRamp) {
          colorRampSelection = {
            colors: colorRamp.colors
          };

          if (colorRamp.scheme) {
            colorRampSelection.scheme = colorRamp.scheme;
          }

          if (this._isLine()) {
            outlineColorRampPicker.set({
              schemes: schemes,
              selected: colorRampSelection,
              numStops: colorRamp.numStops
            });
            this._hide(outlineColorPicker);
            this._show(outlineColorRampPicker);
          }
          else {
            if (this._isPoint()) {
              // set up outline color ramps for + and x symbols
              outlineColorRampPicker.set({
                schemes: schemes,
                selected: colorRampSelection,
                numStops: colorRamp.numStops
              });
            }

            fillColorRampPicker.set({
              schemes: schemes,
              selected: colorRampSelection,
              numStops: colorRamp.numStops
            });

            this._show(fillColorRampPicker);
            this._show(outlineColorPicker);

            this._hide(fillColorPicker);
            this._hide(outlineColorRampPicker);
          }

          this._updateSuggestedColors(outlineColorPicker,
            schemeUtil.getOutlineColors(schemes));

          return;
        }

        this._show(fillColorPicker);
        this._show(outlineColorPicker);

        this._hide(fillColorRampPicker);
        this._hide(outlineColorRampPicker);

        this._updateSuggestedColors(fillColorPicker,
          schemeUtil.getFillColors(schemes));
        this._updateSuggestedColors(outlineColorPicker,
          schemeUtil.getOutlineColors(schemes));
      },

      edit: function (symbol, opts) {
        var symbolToEdit = symbolUtil.cloneSymbol(symbol),
            colorRamp;

        opts = opts || {};

        colorRamp = opts.colorRamp;

        this._isPreppingEdit = true;
        this._colorRamp = colorRamp;
        this._originalSymbol = symbol;
        this._editedSymbol = symbolToEdit;
        this._activeTabName = opts.activeTab;
        this._externalSizing = opts.externalSizing;
        this._tabOptions = opts.tabOptions || {};

        this._optimizationOptions = typeof opts.optimizeOutline === "boolean" ?
                                    { value: opts.optimizeOutline } :
                                    undefined;

        this._setUpColorControls(opts.schemes, colorRamp);
        this._assimilateSymbol(symbolToEdit);
        this._toggleSizingControls(this._externalSizing);
        this._updateSymbolPicker();

        // TODO: incorporate into color-control-setup logic
        this._toggleOutlineColorControls(symbolToEdit);

        this._toggleOptimizationOptions();
      },

      _toggleOptimizationOptions: function() {
        var options             = this._optimizationOptions,
            optimizationSection = this._optimizationSection;

        // applicable only for polygons for now
        if (symbolUtil.isPolygon(this._editedSymbol) && options) {
          this._optimizationCheckBox.set("value", options.value);

          // inject checkbox into the color picker above the transparency section
          domConstruct.place(optimizationSection,
                             this.dap_outlineColorPicker.dap_recentColorSection);
        }
        else if (optimizationSection.parentNode) {
          domConstruct.empty(optimizationSection.parentNode);
        }
      },

      _importRecentColors: function () {
        this.dap_fillColorPicker.loadRecentColors(this._RECENT_FILL_COLORS_ITEM_KEY);
        this.dap_outlineColorPicker.loadRecentColors(this._RECENT_OUTLINE_COLORS_ITEM_KEY);
      },

      _hasColorRamp: function () {
        return !!this._colorRamp;
      },

      _toggleSizingControls: function (externalSizing) {
        var sizeDisabled = false,
            widthDisabled = false;

        if (externalSizing) {
          if (this._isLine()) {
            widthDisabled = true;
          }
          else {
            sizeDisabled = true;
          }
        }

        this._toggleLabeledControls({
          labels: this.dap_lineWidthLabel,
          controls: [
            this.dap_lineWidthTextBox,
            this.dap_lineWidthSlider
          ],
          disabled: widthDisabled
        });

        this._toggleLabeledControls({
          labels: this.dap_shapeSizeLabel,
          controls: [
            this.dap_shapeSizeTextBox,
            this.dap_shapeSizeSlider
          ],
          disabled: sizeDisabled
        });
      },

      _toggleLabeledControls: function(params) {
        var labels   = params.labels,
            controls = params.controls,
            disabled = params.disabled;

        if (lang.isArray(labels)) {
          array.forEach(labels, function(label) {
            domClass.toggle(label, this.css.disabled, disabled);
          }, this);
        }
        else {
          domClass.toggle(labels, this.css.disabled, disabled);
        }

        if (lang.isArray(controls)) {
          array.forEach(controls, function(control) {
            control.set("disabled", disabled);
          });
        }
        else {
          controls.set("disabled", disabled);
        }
      },

      _updateSymbolPicker: function () {
        var hasOverride = !!this._tabOptions.symbolDisplayMode;
        var displayMode = hasOverride ?
                          this._tabOptions.symbolDisplayMode :
                          this._isPoint() && this._hasColorRamp() ? "default" : "portal";

        if (displayMode === "portal") {
          domUtils.show(this.dap_useImageContent);
        }
        else {
          domUtils.hide(this.dap_useImageContent);
        }

        this._symbolPicker.set("displayMode", displayMode);

        this._symbolPicker.clearSelection();
      },

      shapeSymbol: null,

      _setShapeSymbolAttr: function (symbol) {
        this._adjustOutlineProperties(this._editedSymbol, symbol);

        this._set("shapeSymbol", symbol);
        this._editedSymbol = symbol;
        this._toggleTabs(symbol);
        this._toggleOutlineColorControls(symbol);

        this._delayedCommitPropsTrigger();
      },

      _adjustOutlineProperties: function (beforeSymbol, afterSymbol) {
        var fillColorPicker = this.dap_fillColorPicker,
            outlineColorPicker = this.dap_outlineColorPicker,
            fillColorRampPicker = this.dap_fillColorRampPicker,
            outlineColorRampPicker = this.dap_outlineColorRampPicker,
            minDarkOutlineAlpha = 0.1,
            minBrightAlpha = 0.2,
            outline,
            isBright,
            outlineColor;

        if (this._switchedFromPmsToSms(beforeSymbol, afterSymbol)) {

          // when switching a picture marker symbol a simple marker symbol,
          // we do not have fill and outline properties (color, width, style),
          // so we get them from the simple marker symbol

          fillColorPicker.set("color", afterSymbol.color);

          outline = symbolUtil.getOutline(afterSymbol);

          outlineColorPicker.set("color", outline.color);
          this.dap_lineWidthSlider.set("value", outline.width);
          this._linePatternSelect.set("value", outline.style);

          return;
        }

        if (this._switchedPureOutlineToSmsStyle(beforeSymbol, afterSymbol)) {
          if (this._hasColorRamp()) {
            fillColorRampPicker.set("selected", outlineColorRampPicker.get("selected"));
            return;
          }
        }

        if (this._switchedSmsStyleToPureOutline(beforeSymbol, afterSymbol)) {
          if (this._hasColorRamp()) {
            outlineColorRampPicker.set("selected", fillColorRampPicker.get("selected"));
            return;
          }

          // if a simple marker symbol's outline color has high transparency or is null
          // we have to tweak the outline color to show something in the preview

          outline = symbolUtil.getOutline(beforeSymbol);
          outlineColor = outlineColorPicker.get("color");

          if (!outline.color) {
            outlineColorPicker.set("color", afterSymbol.color);
            return;
          }

          isBright = colorUtil.isBright(outline.color);

          if (isBright && outline.color.a < minBrightAlpha) {
            outlineColor.a = minBrightAlpha;
            outlineColorPicker.set("color", outlineColor);
          }
          else if (!isBright && outline.color.a < minDarkOutlineAlpha) {
            outlineColor.a = minDarkOutlineAlpha;
            outlineColorPicker.set("color", outlineColor);
          }
        }
      },

      _switchedFromPmsToSms: function(beforeSymbol, afterSymbol) {
        return symbolUtil.isType(beforeSymbol, "picturemarker") &&
               symbolUtil.isType(afterSymbol, "simplemarker");
      },

      _switchedSmsStyleToPureOutline: function(beforeSymbol, afterSymbol) {
        return symbolUtil.isType(beforeSymbol, "simplemarker") &&
               symbolUtil.isType(afterSymbol, "simplemarker") &&
               symbolUtil.hasPureOutlineStyle(beforeSymbol) &&
               symbolUtil.hasPureOutlineStyle(afterSymbol);
      },

      _switchedPureOutlineToSmsStyle: function(beforeSymbol, afterSymbol) {
        return this._switchedSmsStyleToPureOutline(afterSymbol, beforeSymbol);
      },

      shapeSize: null,

      _setShapeSizeAttr: function (size) {
        this._set("shapeSize", size);

        this._delayedCommitPropsTrigger();
      },

      _shapeImageUrl: null,

      _setShapeImageUrlAttr: function (url) {
        this._set("shapeImageUrl", url);

        this._delayedCommitPropsTrigger();
      },

      fillColor: null,

      _setFillColorAttr: function (color) {
        color = color === ColorPicker.NO_COLOR ? null : color; //TODO: extract
        this._set("fillColor", color);

        this._delayedCommitPropsTrigger();
      },

      fillColorRamp: null,

      _setFillColorRampAttr: function (color) {
        this._set("fillColorRamp", color);

        this._delayedCommitPropsTrigger();
      },

      outlineColorRamp: null,

      _setOutlineColorRampAttr: function (color) {
        this._set("outlineColorRamp", color);

        this._delayedCommitPropsTrigger();
      },

      outlineWidth: null,

      _setOutlineWidthAttr: function (width) {
        this._set("outlineWidth", width);

        this._delayedCommitPropsTrigger();
      },

      outlineColor: null,

      _setOutlineColorAttr: function (color) {
        color = color === ColorPicker.NO_COLOR ? null : color; //TODO: extract

        var willOptimizeOutline = !!this._optimizationOptions && this._optimizationCheckBox.checked;
        if (color && willOptimizeOutline) {
          color.a = 0.5;
          this.dap_outlineColorPicker.set("color", color, false);
        }

        this._set("outlineColor", color);

        this._delayedCommitPropsTrigger();
      },

      outlinePattern: null,

      _setOutlinePatternAttr: function (pattern) {
        this._set("outlinePattern", pattern);

        this._delayedCommitPropsTrigger();
      },

      _getTabContainer: function (tab) {
        return tab === "fill" ? this.dap_fillContainer :
               tab === "outline" ? this.dap_outlineContainer :
               this.dap_shapeContainer;
      },

      _storeRecentFillColors: function () {
        this._storeRecentColors(this.dap_fillColorPicker, this._RECENT_FILL_COLORS_ITEM_KEY);
      },

      _storeRecentOutlineColors: function () {
        this._storeRecentColors(this.dap_outlineColorPicker, this._RECENT_OUTLINE_COLORS_ITEM_KEY);
      },

      _storeRecentColors: function (colorPicker, key) {
        var cp = colorPicker;

        cp.addRecentColor(cp.get("color"));
        cp.saveRecentColors(key);
      },

      _isPoint: function () {
        return symbolUtil.isPoint(this._editedSymbol);
      },

      _isLine: function () {
        return symbolUtil.isLine(this._editedSymbol);
      },

      _isPolygon: function () {
        return symbolUtil.isPolygon(this._editedSymbol);
      },

      _addHandlers: function () {
        this.own(
          this.dap_shapeContainer.on("show", lang.hitch(this, function () {
            this._symbolPicker._updateTemplatePickerIfHeightless();
          }))
        );

        this._linePatternSelect.on("change", lang.hitch(this, function (value) {
          this.set("outlinePattern", value);
        }));

        this.own(
          on(this.dap_loadShapeImageUrl, a11yclick, lang.hitch(this, function () {
            this._loadImage(this.dap_shapeImageUrlInput.get("value"));
          }))
        );

        this.own(
          on(this.dap_addImage, a11yclick, lang.hitch(this, function () {
            domUtils.show(this.dap_shapeImageUrlContainer);
            this.dap_shapeImageUrlInput.focus();
          }))
        );

        this.dap_shapeImageUrlInput.on("input", lang.hitch(this, function (e) {
          if (e.keyCode === keys.ENTER) {
            this._loadImage(this.dap_shapeImageUrlInput.get("value"));
          }
        }));

        this.dap_shapeImageUrlInput.on("change",
          lang.hitch(this, function (value) {
            this.set("shapeImageUrl", value);
          }));

        this.dap_shapeSizeSlider.on("change",
          lang.hitch(this, function (value) {
            this.set("shapeSize", value);
          }));

        this.dap_fillColorPicker.on("color-change",
          lang.hitch(this, function (e) {
            this.set("fillColor", e.color);
          }));

        this.dap_fillColorRampPicker.on("color-ramp-change",
          lang.hitch(this, function (e) {
            this.set("fillColorRamp", e.colors);
          }));

        this.dap_outlineColorRampPicker.on("color-ramp-change",
          lang.hitch(this, function (e) {
            this.set("outlineColorRamp", e.colors);
          }));

        this.dap_lineWidthSlider.on("change",
          lang.hitch(this, function (value) {
            this.set("outlineWidth", value);
          }));

        this.dap_outlineColorPicker.on("color-change",
          lang.hitch(this, function (e) {
            this.set("outlineColor", e.color);
          }));

        stylerUtil.bindSliderAndTextBox(this.dap_lineWidthSlider, this.dap_lineWidthTextBox);
        stylerUtil.bindSliderAndTextBox(this.dap_shapeSizeSlider, this.dap_shapeSizeTextBox);

        this._symbolPicker.on("symbol-select", lang.hitch(this, function (e) {
          this._hideImageUrlInput();
          this.set("shapeSymbol", e.selection);
        }));

        this.dap_shapeSizeSlider.on("change", lang.hitch(this, this._onSizeChange));
        this.dap_fillColorPicker.on("color-change", lang.hitch(this, this._onFillColorChange));
        this.dap_outlineColorPicker.on("color-change", lang.hitch(this, this._onOutlineColorChange));
        this.dap_lineWidthSlider.on("change", lang.hitch(this, this._onWidthChange));
      },

      getStyle: function() {
        var symbol = symbolUtil.cloneSymbol(this._editedSymbol),
            style  = {
              symbol: symbol
            },
            shouldUseOutlineColors,
            colorRampPicker;

        if (this._hasColorRamp()) {
          shouldUseOutlineColors = symbolUtil.isLine(symbol) ||
                                   (symbolUtil.isPoint(symbol) && symbolUtil.hasPureOutlineStyle(symbol));

          colorRampPicker = shouldUseOutlineColors ?
                            this.dap_outlineColorRampPicker :
                            this.dap_fillColorRampPicker;

          lang.mixin(style, colorRampPicker.getStyle());
        }

        if (this._optimizationOptions) {
          style.optimizeOutline = this._optimizationCheckBox.checked;
        }

        return style;
      },

      storeColors: function () {
        this._storeRecentFillColors();
        this._storeRecentOutlineColors();
      },

      postCreate: function () {
        this.inherited(arguments);

        var selectBaseClass = IconSelect.prototype.baseClass,
            linePatternSelect = new IconSelect({
              baseClass: selectBaseClass + " " + this.baseClass + " " + this.css.linePatternInput
            }, this.dap_linePatternSelect);

        this._linePatternSelect = linePatternSelect;

        domUtils.hide(this.dap_shapeImageUrlContainer);

        this.dap_shapeImageUrlInput.set("placeholder", this.labels.imageUrlInputPlaceholder);

        this.dap_lineWidthTextBox.selectOnClick = true;
        this.dap_shapeSizeTextBox.selectOnClick = true;

        this.dap_lineWidthSlider.intermediateChanges = true;
        this.dap_lineWidthTextBox.intermediateChanges = true;
        this.dap_shapeSizeSlider.intermediateChanges = true;
        this.dap_shapeSizeTextBox.intermediateChanges = true;

        this.dap_fillColorPicker.trackColors = false;
        this.dap_outlineColorPicker.trackColors = false;

        this._linePatternSelect.addIconOptions([
          "solid",
          "dot",
          "dash",
          "dashdot",
          "dashdotdot"
        ], this.css.linePattern);

        this._importRecentColors();

        this.createTooltips([
          {
            node: this.dap_shapeImageUrlContainer,
            label: this.labels.imageUrlInputTooltip
          },
          {
            node: this.dap_addImage,
            label: this.labels.useImageTooltip
          },
          {
            node: this.dap_symbolSizeOptions
          },
          {
            node: this.dap_lineWidthOptions
          }
        ]);

        // hijack color picker's transparency logic since we handle it
        this.dap_outlineColorPicker._enableTransparencySlider = function() {};
        this.dap_outlineColorPicker._disableTransparencySlider = function() {};
       },

      _updateSliderAndTextBoxConstraints: function (params) {
        var min = params.minimum;
        var max = params.maximum;

        params.textBox.set("constraints", {
          min: min,
          max: max
        });

        params.slider.set({
          minimum: min,
          maximum: max,
          discreteValues: (Math.round(max) - Math.round(min)) + 1
        });
      },

      _loadImage: function (url) {
        this._clearUrlImageErrorDisplay();

        symbolUtil.testImageUrl(url).then(lang.hitch(this, function () {
          var customImageSymbol,
              size;

          customImageSymbol = this._customImageSymbol;
          size = this.shapeSize;

          if (customImageSymbol) {
            customImageSymbol.url = url;
            customImageSymbol.height = size;
            customImageSymbol.width = size;
          }
          else {
            customImageSymbol = new PictureMarkerSymbol(url, size, size);
            this._customImageSymbol = customImageSymbol;
          }

          this.set("shapeSymbol", customImageSymbol);

        }), lang.hitch(this, function () {
          this._showUrlImageErrorDisplay(this.labels.imageLoadError);
        }));
      },

      _showUrlImageErrorDisplay: function (message) {
        this.dap_shapeImageUrlErrorDisplay.innerHTML = message;
      },

      _clearUrlImageErrorDisplay: function () {
        this.dap_shapeImageUrlErrorDisplay.innerHTML = "";
      },

      _getActiveTabAttr: function () {
        var activeTab = this.dap_stackContainer.selectedChildWidget;

        return activeTab === this.dap_outlineContainer ? "outline" :
               activeTab === this.dap_fillContainer ? "fill" :
               "shape";
      },

      _updateTabs: function (symbol) {
        this._toggleTabs(symbol);
        this._showRelevantTabs(symbol);
        this._selectActiveTab();
        stylerUtil.ensureEnabledChildSelection(this.dap_stackContainer);
      },

      _supportsPattern: function (symbol) {
        return symbolUtil.isLine(symbol) || symbolUtil.isPolygon(symbol);
      },

      _toggleTabs: function (symbol) {
        if (this._shouldShowShapeTab(symbol)) {
          this._enableTab("shape");
        }
        else {
          this._disableTab("shape");
        }

        if (this._shouldShowFillTab(symbol)) {
          this._enableTab("fill");
        }
        else {
          this._disableTab("fill");
        }

        if (this._shouldShowOutlineTab(symbol)) {
          this._enableTab("outline");

          if(this._supportsPattern(symbol)) {
            domUtils.show(this.dap_linePatternSelectLabel);
            domUtils.show(this._linePatternSelect.domNode);
          }
          else{
            domUtils.hide(this.dap_linePatternSelectLabel);
            domUtils.hide(this._linePatternSelect.domNode);
          }
        }
        else {
          this._disableTab("outline");
        }
      },

      _shouldShowShapeTab: function (symbol) {
        return symbol.type === "simplemarkersymbol" ||
               symbol.type === "picturemarkersymbol";
      },

      _enableTab: function (tab) {
        stylerUtil.enable(this._getTabContainer(tab));
      },

      _disableTab: function (tab) {
        stylerUtil.disable(this._getTabContainer(tab));
      },

      _shouldShowFillTab: function (symbol) {
        return (symbol.type === "simplemarkersymbol" && symbol.style === SimpleMarkerSymbol.STYLE_CIRCLE) ||
               (symbol.type === "simplemarkersymbol" && symbol.style === SimpleMarkerSymbol.STYLE_SQUARE) ||
               (symbol.type === "simplemarkersymbol" && symbol.style === SimpleMarkerSymbol.STYLE_DIAMOND) ||
               symbol.type === "simplefillsymbol";
      },

      _shouldShowOutlineTab: function (symbol) {
        return symbol.type === "simplemarkersymbol" ||
               symbol.type === "simplefillsymbol" ||
               symbol.type === "cartographiclinesymbol" ||
               symbol.type === "simplelinesymbol";
      },

      _syncControls: function (symbol) {
        var size,
            outline;

        this._hideImageUrlInput();
        this._updateSizingConstraints();

        if (this._shouldShowShapeTab(symbol)) {
          size = symbolUtil.getMarkerLength(symbol);

          this.set("shapeSize", size);
          stylerUtil.silentlyUpdateIntermediateChangingValueWidget(this.dap_shapeSizeSlider, size);
          stylerUtil.silentlyUpdateIntermediateChangingValueWidget(this.dap_shapeSizeTextBox, size);
        }

        if (this._shouldShowFillTab(symbol)) {
          this.set("fillColor", symbol.color);
          this.dap_fillColorPicker.set("color", symbol.color, false);
        }

        if (this._shouldShowOutlineTab(symbol)) {
          outline = symbolUtil.getOutline(symbol);

          this.set("outlineColor", outline.color);
          this.set("outlineWidth", outline.width);
          this.set("outlinePattern", outline.style);

          this.dap_outlineColorPicker.set("color", outline.color, false);

          stylerUtil.silentlyUpdateIntermediateChangingValueWidget(this.dap_lineWidthSlider, outline.width);
          stylerUtil.silentlyUpdateIntermediateChangingValueWidget(this.dap_lineWidthTextBox, outline.width);

          this._linePatternSelect.set("value", outline.style, false);
        }
      },

      _updateSizingConstraints: function () {
        var outline = symbolUtil.getOutline(this._editedSymbol),

            maxLineWidth = outline &&
                           outline.width > this._defaultMaxLineWidthInPx ?
                           Math.ceil(outline.width) :
                           this._defaultMaxLineWidthInPx,

            shapeSize = symbolUtil.getMarkerLength(this._editedSymbol),

            maxShapeSize = shapeSize > this._defaultMaxShapeSizeInPx ?
                           Math.ceil(shapeSize) :
                           this._defaultMaxShapeSizeInPx;

        this._updateSliderAndTextBoxConstraints({
          textBox: this.dap_lineWidthTextBox,
          slider: this.dap_lineWidthSlider,
          minimum: this._defaultMinLineWidthInPx,
          maximum: maxLineWidth
        });

        this.findTooltip(this.dap_lineWidthOptions).set("label", string.substitute(this.labels.lineWidthTooltip, {
          min: this._defaultMinLineWidthInPx,
          max: maxLineWidth
        }));

        this._updateSliderAndTextBoxConstraints({
          textBox: this.dap_shapeSizeTextBox,
          slider: this.dap_shapeSizeSlider,
          minimum: this._defaultMinShapeSizeInPx,
          maximum: maxShapeSize
        });

        this.findTooltip(this.dap_symbolSizeOptions).set("label", string.substitute(this.labels.symbolSizeTooltip, {
          min: this._defaultMinShapeSizeInPx,
          max: maxShapeSize
        }));
      },

      _assimilateSymbol: function (symbol) {
        this._updateTabs(symbol);
        this._syncControls(symbol);
      },

      startup: function () {
        this.inherited(arguments);

        var symbolPicker = new MarkerSymbolPicker(this._getSymbolPickerParams(), this.dap_symbolPicker);
        symbolPicker.startup();
        this._symbolPicker = symbolPicker;

        this._addHandlers();
      },

      _getSymbolPickerParams: function() {
        return {
          portal: this.portal || this.portalSelf || this.portalUrl
        };
      },

      _hideImageUrlInput: function () {
        this._clearUrlImageErrorDisplay();
        domUtils.hide(this.dap_shapeImageUrlContainer);
        this.dap_shapeImageUrlInput.set("value", "");
      },

      _showRelevantTabs: function () {
        var stackContainer = this.dap_stackContainer,
            shapeContainer = this.dap_shapeContainer,
            fillContainer = this.dap_fillContainer,
            outlineContainer = this.dap_outlineContainer,
            containersToAdd = {};

        array.forEach(stackContainer.getChildren(), function (child) {
          stackContainer.removeChild(child);
        });

        // we mark containers to be added to avoid unnecessary DOM manipulations

        // mark included
        if (this._isPoint()) {
          containersToAdd.shape = true;
          containersToAdd.fill = true;
          containersToAdd.outline = true;
        }

        if (this._isLine()) {
          containersToAdd.outline = true;
        }

        if (this._isPolygon()) {
          containersToAdd.fill = true;
          containersToAdd.outline = true;
        }

        // mark excluded
        var excluded = this._tabOptions.excluded || [];
        if (excluded.indexOf("shape") > -1) {
          containersToAdd.shape = false;
        }

        if (excluded.indexOf("outline") > -1) {
          containersToAdd.outline = false;
        }

        if (excluded.indexOf("fill") > -1) {
          containersToAdd.fill = false;
        }

        // add containers to DOM
        if (containersToAdd.shape) {
          stackContainer.addChild(shapeContainer);
        }

        if (containersToAdd.fill) {
          stackContainer.addChild(fillContainer);
        }

        if (containersToAdd.outline) {
          stackContainer.addChild(outlineContainer);
        }

        var isSingleTabActive = stackContainer.getChildren().length === 1;
        if (isSingleTabActive) {
          domUtils.hide(this.dap_stackController.domNode);
        }
        else {
          domUtils.show(this.dap_stackController.domNode);
        }
      },

      _selectActiveTab: function () {
        var activeTab = this._getTabContainer(this._activeTabName),
            tabInTabBar = this.dap_stackContainer.getIndexOfChild(activeTab) > -1;

        if (tabInTabBar) {
          this.dap_stackContainer.selectChild(activeTab);
        }
      },

      _onFillColorChange: function (e) {
        this.set("fillColor", e.color);
      },

      _onOutlineColorChange: function (e) {
        this.set("outlineColor", e.color);
      },

      _getFillColor: function () {
        if (!this._isLine() && this._hasColorRamp()) {
          return this._getMiddleItem(this.fillColorRamp);
        }

        return this.fillColor;
      },

      _getMiddleItem: function (items) {
        var middleIndex = Math.floor((items.length - 1) * 0.5);

        return items[middleIndex];
      },

      _getOutlineColor: function () {
        if (this._shouldShowOutlineColorRamp(this._editedSymbol)) {
          return this._getMiddleItem(this.outlineColorRamp);
        }

        return this.outlineColor;
      },

      _commitProperties: function () {
        var symbol = this._editedSymbol;

        if (this._shouldShowShapeTab(symbol)) {
          this._updateShapeSize();
        }

        if (this._shouldShowFillTab(symbol)) {
          symbolUtil.setFillColor(symbol, this._getFillColor());

          if (!this._isPreppingEdit) {
            this._ensureSupportedSfsStyle(symbol);
          }
        }

        if (this._shouldShowOutlineTab(symbol)) {
          symbolUtil.setOutlineColor(symbol, this._getOutlineColor());

          this._updateOutlinePattern();
          this._updateOutlineWidth();
        }

        this._updatePreviewSymbol();

        this._toggleOutlineOptions();

        this._isPreppingEdit = false;
        this.emit("style-update");
      },

      _ensureSupportedSfsStyle: function(symbol) {
        if (symbol.type === "simplefillsymbol" &&
            (symbol.style !== "none" || symbol.style !== "solid")) {
          symbol.style = "solid";
        }
      },

      _toggleOutlineOptions: function() {
        var willOptimizeOutline = !!this._optimizationOptions && this._optimizationCheckBox.checked,
            hasOutlineColor     = this.outlineColor,
            isLine              = this._isLine();

        var shouldDisableWidth        = this._externalSizing && isLine || !hasOutlineColor || willOptimizeOutline,
            shouldDisableTransparency = willOptimizeOutline || !hasOutlineColor,
            shouldDisablePattern      = !hasOutlineColor;

        this._toggleLabeledControls({
          labels: this.dap_lineWidthLabel,
          controls: [
            this.dap_lineWidthTextBox,
            this.dap_lineWidthSlider
          ],
          disabled: shouldDisableWidth
        });

        this._toggleLabeledControls({
          labels: this.dap_linePatternSelectLabel,
          controls: this._linePatternSelect,
          disabled: shouldDisablePattern
        });

        this._toggleLabeledControls({
          labels: [
            this.dap_outlineColorPicker.dap_transparencyLabel
          ],
          controls: [
            this.dap_outlineColorPicker.dap_transparencySlider
          ],
          disabled: shouldDisableTransparency
        });
      },

      _updatePreviewSymbol: function () {
        var symbol = this._editedSymbol,
            altCssClass = this.css.alt,
            previewNode = this.dap_symbolPreview;

        if (this._symbolPreviewSurface) {
          this._symbolPreviewSurface.destroy();
        }

        domClass.toggle(previewNode, altCssClass, this._blendsIntoBackground(symbol));

        this._symbolPreviewSurface =
        symbolUtil.renderOnSurface(symbol, previewNode);
      },

      _blendsIntoBackground: function (symbol) {
        return symbolUtil.hasColor(symbol.outline) ?
               this._isWhitish(symbol.outline.color) :
               this._isWhitish(symbol.color);
      },

      _isWhitish: function (color) {
        return color &&
               color.r > 246 &&
               color.g > 246 &&
               color.b > 246;
      },

      destroy: function() {
        if (this._symbolPreviewSurface) {
          this._symbolPreviewSurface.destroy();
        }

        // destroy here as these may not be added to the DOM when destroyed
        domConstruct.destroy(this._optimizationSection);
        this._optimizationCheckBox.destroy();

        // destroy here as our adding/removing of containers may leave orphans
        this.dap_shapeContainer.destroy();
        this.dap_fillContainer.destroy();
        this.dap_outlineContainer.destroy();

        this.inherited(arguments);
      },

      _updateSuggestedColors: function (colorPicker, colors) {
        colorPicker.set("suggestedColors", colors);
      },

      _updateOutlineWidth: function () {
        symbolUtil.setOutlineWidth(this._editedSymbol, this.outlineWidth);
      },

      _onWidthChange: function (val) {
        this.set("outlineWidth", val);
      },

      _onSizeChange: function (val) {
        this.set("shapeSize", val);
      },

      _updateShapeSize: function () {
        symbolUtil.setSize(this._editedSymbol, this.shapeSize);
      },

      _updateOutlinePattern: function () {
        if (!this._shouldShowOutlineTab(this._editedSymbol)) {
          return;
        }

        symbolUtil.setOutlineStyle(this._editedSymbol, symbolUtil.toFullLineStyle(this.outlinePattern));
      },

      _show: function (node) {
        //TODO: util candidate
        domClass.remove(domUtils.getNode(node), this.css.hidden);
      },

      _hide: function (node) {
        //TODO: util candidate
        domClass.add(domUtils.getNode(node), this.css.hidden);
      },

      popUp: function (node) {
        stylerUtil.popUp(this, node);
      }
    });

    return SymbolStyler;
  });
