define([
    "../Color",

    "./Widget",
    "./_Tooltip",
    "./ColorPicker/colorUtil",
    "./ColorPicker/HexPalette",

    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",

    "dojo/_base/array",
    "../core/declare",
    "dojo/_base/lang",
    "dojo/dom-class",
    "dojo/dom-construct",
    "dojo/on",
    "dojo/query",
    "dojo/sniff",
    "dojo/dom-style",

    "dojo/i18n!../nls/jsapi",

    "dojo/text!./ColorPicker/templates/ColorPicker.html",

    "./HorizontalSlider",

    "dijit/form/RadioButton",
    "dijit/form/TextBox",
    "dijit/form/ToggleButton",

    "dojo/NodeList-dom"
  ],
  function (
    Color, Widget, TooltipMixin, colorUtil, HexPalette,
    TemplatedMixin, WidgetsInTemplateMixin,
    array, declare, lang, domClass, domConstruct, on, query, has, domStyle,
    nlsJsapi,
    colorPickerTemplate
  ) {

    var NO_COLOR = "no-color",

        ColorPicker = declare("esri.widgets.ColorPicker",
          [ Widget, TemplatedMixin, WidgetsInTemplateMixin, TooltipMixin ],
          {
            _DEFAULT_COLORS_PER_ROW: 13,

            templateString: colorPickerTemplate,

            labels: nlsJsapi.widgets.colorPicker,

            baseClass: "esriColorPicker",

            css: {
              container: "esriContainer",
              header: "esriHeader",
              footer: "esriFooter",
              middle: "esriMiddle",
              swatch: "esriSwatch",
              swatchRow: "esriSwatchRow",
              swatchEmpty: "esriSwatchEmpty",
              swatchPreview: "esriSwatchPreview",
              swatchTransparencyBackground: "esriSwatchTransparencyBackground",
              palette: "esriPalette",
              paletteOptions: "esriPaletteOptions",
              paletteToggle: "esriPaletteToggle",
              label: "esriLabel",
              hexInput: "esriHexInput",
              recent: "esriRecent",
              suggested: "esriSuggested",
              selected: "esriSelected",
              disabled: "esriDisabled",
              section: "esriSection",
              displayNone: "esriDisplayNone",
              transparencySlider: "esriTransparencySlider",
              alt: "esriAlt"
            },

            color: null,

            trackColors: true,

            _required: false,

            _activePalette: null,

            recentColors: [],

            _showRecentColors: true,

            _showTransparencySlider: true,

            colorsPerRow: undefined,

            _brightsPalette: null,

            _pastelsPalette: null,

            _swatches: null,

            _colorInstance: null,

            _swatchCreator: null,

            _noColorSwatchNode: null,

            constructor: function (opts, srcRefNode) {
              opts = opts || {};

              this._colorInstance = new Color();

              this._brightsPalette = new HexPalette({
                colors: opts.palette
              });

              this._pastelsPalette = new HexPalette({
                colors: this._toPastels(this._brightsPalette.get("colors"))
              });

              this._activePalette = this._brightsPalette;

              this._swatchCreator = opts.swatchCreator || this._createSwatch;

              if (opts.hasOwnProperty("required")) {
                this._required = opts.required;
              }

              if (opts.hasOwnProperty("showRecentColors")) {
                this._showRecentColors = opts.showRecentColors;
              }

              if (opts.hasOwnProperty("showSuggestedColors")) {
                this._showSuggestedColors = opts.showSuggestedColors;
              }

              if (opts.hasOwnProperty("showTransparencySlider")) {
                this._showTransparencySlider = opts.showTransparencySlider;
              }

              if (opts.color) {
                opts.color = colorUtil.normalizeColor(opts.color);
              }

              this.colorsPerRow = opts.colorsPerRow > 0 ?
                                  opts.colorsPerRow :
                                  this._DEFAULT_COLORS_PER_ROW;

              this._swatches = {};
            },

            _toPastels: function (colors) {
              var colorInstance = this._colorInstance,
                  gray = new Color([238, 238, 238]);

              return array.map(colors,
                function (color) {
                  return Color.blendColors(colorInstance.setColor(color), gray, 0.2);
                },
                this);
            },

            _createSwatch: function (swatchOptions) {
              var swatchCssClass = swatchOptions.className,
                  hexColor = swatchOptions.hexColor || "transparent",
                  targetNode = swatchOptions.paletteNode,
                  span = domConstruct.create("span", {
                    className: swatchCssClass,
                    style: {
                      background: hexColor
                    }
                  }, targetNode);

              return span;
            },

            _createSwatches: function (paletteNode, palette) {
              var swatchCssClass = this.css.swatch,
                  swatchRowCssClass = this.css.swatchRow,
                  swatchesPerRow = this.colorsPerRow,
                  colors = palette.get("colors"),
                  swatchRow,
                  swatch;

              array.forEach(colors, function (cssColor, index) {
                if ((index % swatchesPerRow) === 0) {
                  swatchRow = domConstruct.create("div", {
                    className: swatchRowCssClass
                  }, paletteNode);
                }

                swatch = this._swatchCreator({
                  className: swatchCssClass,
                  hexColor: cssColor,
                  paletteNode: swatchRow
                });

                this._swatches[cssColor] = swatch;
              }, this);
            },

            _selectColor: function () {
              var selectedColor = this.color || this._activePalette.get("colors")[0];
              this.set("color", selectedColor);
            },

            _setColorWithCurrentAlpha: function(color) {
              if (color !== NO_COLOR && this.color !== NO_COLOR) {
                color = colorUtil.normalizeColor(color);
                color.a = this.color.a;
              }

              this.set("color", color);
            },

            _updatePreviewSwatch: function (color) {
              var emptySwatchCssClass = this.css.swatchEmpty,
                  previewSwatch = this.dap_previewSwatch,
                  contrast,
                  supportsRgba,
                  backgroundColorCss,
                  contrastColorCss,
                  styleProps;

              if (color === NO_COLOR) {
                domClass.add(previewSwatch, emptySwatchCssClass);
                domStyle.set(previewSwatch, {
                  backgroundColor: "",
                  borderColor: ""
                });
                return;
              }

              contrast = colorUtil.getContrastingColor(color);
              supportsRgba = has("ie") !== 8;

              domClass.remove(previewSwatch, emptySwatchCssClass);

              backgroundColorCss = color.toCss(supportsRgba);
              contrastColorCss = contrast.toCss(supportsRgba);

              styleProps = {
                backgroundColor: backgroundColorCss,
                borderColor: contrastColorCss
              };

              if (!supportsRgba) {
                styleProps.opacity = color.a;
              }

              domStyle.set(previewSwatch, styleProps);
            },

            _showBrights: function () {
              domClass.remove(this.dap_paletteContainer, this.css.alt);
              this._activePalette = this._brightsPalette;
            },

            _showPastels: function () {
              domClass.add(this.dap_paletteContainer, this.css.alt);
              this._activePalette = this._pastelsPalette;
            },

            _setColorFromSwatch: function (swatch) {
              var selectedColor = domStyle.get(swatch, "backgroundColor");

              this._setColorWithCurrentAlpha(selectedColor);
            },

            _checkSelection: function () {
              var selectedColor = this.get("color");

              if (this._activePalette.contains(selectedColor)) {
                this._highlightColor(selectedColor);
              }
              else {
                this._clearSelection();
              }
            },

            _addListeners: function () {
              var swatchSelector = "." + this.css.swatch,
                  emptySwatchSelector = "." + this.css.swatchEmpty;

              this.own(
                on(this.dap_paletteContainer,
                  on.selector(swatchSelector, "click"), lang.hitch(this, function (e) {
                    this._setColorFromSwatch(e.target);
                  }))
              );

              this.own(
                on(this.dap_recentColorPalette,
                  on.selector(swatchSelector, "click"), lang.hitch(this, function (e) {
                    this._setColorFromSwatch(e.target);
                  }))
              );

              this.own(
                on(this.dap_suggestedColorPalette,
                  on.selector(swatchSelector, "click"), lang.hitch(this, function (e) {
                    this._setColorFromSwatch(e.target);
                  }))
              );

              if (!this._required) {
                this.own(
                  on(this._noColorSwatchNode, "click", lang.hitch(this, function (e) {
                    this.set("color", NO_COLOR);
                  }))
                );
              }

              var hexInput = this.dap_hexInput;

              hexInput.on("blur", lang.hitch(this, function () {
                var hex = colorUtil.normalizeHex(hexInput.get("value"));

                if (colorUtil.isShorthandHex(hex)) {
                  this._setColorWithCurrentAlpha(hex);
                  return;
                }

                this._silentlyUpdateHexInput(this.color);
              }));

              hexInput.on("change", lang.hitch(this, function () {
                var hex = colorUtil.normalizeHex(hexInput.get("value"));

                if (colorUtil.isLonghandHex(hex)) {
                  if (this.color.toHex() !== hex) {
                    this._setColorWithCurrentAlpha(hex);
                  }
                }
              }));

              this.dap_transparencySlider.on("change", lang.hitch(this, function (transparency) {
                var currentColor = this.get("color"),
                    color;

                if (currentColor === NO_COLOR) {
                  return;
                }

                color = colorUtil.normalizeColor(this._colorInstance.setColor(currentColor));
                color.a = 1 - transparency;

                this._updatePreviewSwatch(color);
                this._silentlyUpdateHexInput(color);

                this.set("color", color);
              }));

              this.dap_paletteToggle.on("change", lang.hitch(this, this._togglePalette));
            },

            _togglePalette: function (showPastels) {
              this.dap_paletteToggle.set("checked", showPastels, false);

              if (showPastels) {
                this._showPastels();
              }
              else {
                this._showBrights();
              }

              this._checkSelection();
            },

            postCreate: function () {
              this.inherited(arguments);

              this._addListeners();
              this._selectColor();

              this.dap_hexInput.intermediateChanges = true;
              this.dap_transparencySlider.intermediateChanges = true;

              this.createTooltips([
                {
                  node: this.dap_paletteContainer,
                  label: this.labels.paletteTooltip
                },
                {
                  node: this.dap_hexInput,
                  label: this.labels.hexInputTooltip
                },
                {
                  node: this._noColorSwatchNode,
                  label: this.labels.noColorTooltip
                },
                {
                  node: this.dap_paletteToggle,
                  label: this.labels.moreColorsTooltip
                }
              ]);
            },

            buildRendering: function () {
              this.inherited(arguments);

              this._createPalettes();

              var swatchCssClass = this.css.swatch,
                  emptySwatchClass = this.css.swatchEmpty;

              if (!this._required) {
                this._noColorSwatchNode = domConstruct.create("div", {
                  className: swatchCssClass + " " + emptySwatchClass
                }, this.dap_hexInput.domNode, "after");
              }

              //TODO: improve part toggling (hide vs. destroy)?
              var hiddenClassName = this.css.displayNone;

              if (!this._showTransparencySlider) {
                domClass.add(this.dap_transparencySection, hiddenClassName);
              }

              //TODO: improve part toggling (hide vs. destroy)?
              if (!this._showRecentColors) {
                domClass.add(this.dap_recentColorSection, hiddenClassName);
              }

              if (!this._showSuggestedColors) {
                domClass.add(this.dap_suggestedColorSection, hiddenClassName);
              }
            },

            _createPalettes: function () {
              this._swatches = {};
              domConstruct.empty(this.dap_primaryPalette);
              domConstruct.empty(this.dap_secondaryPalette);

              this._createSwatches(this.dap_primaryPalette, this._brightsPalette);
              this._createSwatches(this.dap_secondaryPalette, this._pastelsPalette);
            },

            _silentlyUpdateHexInput: function (color) {
              var value = color === NO_COLOR ? "" : color.toHex();

              this._silentlyUpdateIntermediateChangingValueWidget(this.dap_hexInput, value);
            },

            _silentlyUpdateIntermediateChangingValueWidget: function (widget, value) {
              // workaround to prevent "change" event from firing when intermediateChanges = true
              widget.intermediateChanges = false;
              widget.set("value", value, false);
              widget.intermediateChanges = true;
            },

            addRecentColor: function (color) {
              if (!color || color === NO_COLOR) {
                return;
              }

              this._addRecentColor(colorUtil.normalizeColor(color).toHex());
            },

            _addRecentColor: function (hex) {
              if (!hex) {
                return;
              }

              var recentColors = this.recentColors,
                  hexIndex = array.indexOf(recentColors, hex);

              if (hexIndex > -1) {
                recentColors.splice(hexIndex, 1);
              }

              recentColors.unshift(hex);

              if (recentColors.length > this.colorsPerRow) {
                recentColors.pop();
              }

              this._renderRecentSwatches();
            },

            _renderRecentSwatches: function () {
              if (!this.recentColors) {
                return;
              }

              var recentCssClass = this.css.recent,
                  swatchCssClass = this.css.swatch,
                  selector = "." + recentCssClass + "." + swatchCssClass,
                  recentSwatches = query(selector, this.dap_recentColorPalette);

              array.forEach(this.recentColors, function (color, index) {
                if (index < this.colorsPerRow) {

                  if ((index + 1) > recentSwatches.length) {
                    var swatch = this._swatchCreator({
                      hexColor: color,
                      className: swatchCssClass + " " + recentCssClass,
                      paletteNode: this.dap_recentColorPalette
                    });

                    recentSwatches.push(swatch);
                  }

                  domStyle.set(recentSwatches[index], "backgroundColor", color);
                }
              }, this);
            },

            _renderSuggestedSwatches: function () {
              if (!this.suggestedColors) {
                return;
              }

              var recentCssClass = this.css.suggested,
                  swatchCssClass = this.css.swatch,
                  selector = "." + recentCssClass + "." + swatchCssClass,
                  suggestedSwatches = query(selector, this.dap_recentColorPalette);

              array.forEach(this.suggestedColors, function (color, index) {
                if (index < this.colorsPerRow) {

                  if ((index + 1) > suggestedSwatches.length) {
                    var swatch = this._swatchCreator({
                      hexColor: color,
                      className: swatchCssClass + " " + recentCssClass,
                      paletteNode: this.dap_suggestedColorPalette
                    });

                    suggestedSwatches.push(swatch);
                  }

                  domStyle.set(suggestedSwatches[index], "backgroundColor", color);
                }
              }, this);
            },

            _clearRecentSwatches: function () {
              domConstruct.empty(this.dap_recentColorPalette);
            },

            _clearSuggestedSwatches: function () {
              domConstruct.empty(this.dap_suggestedColorPalette);
            },

            _clearSelection: function () {
              var selectedCssClass = this.css.selected,
                  selector = "." + selectedCssClass;

              query(selector, this.dap_paletteContainer).removeClass(selectedCssClass);
            },

            _highlightColor: function (color) {
              var selectedCssClass = this.css.selected,
                  swatch = this._findColorSwatch(color),
                  contrastingColor;

              if (swatch) {
                color = colorUtil.normalizeColor(color);
                contrastingColor = colorUtil.getContrastingColor(color);
                domClass.add(swatch, selectedCssClass);
                domStyle.set(swatch, "borderColor", contrastingColor.toHex());
              }
            },

            _findColorSwatch: function (color) {
              var colors = this._activePalette.get("colors"),
                  hexColor = (this._colorInstance.setColor(color)).toHex(),
                  index = array.indexOf(colors, hexColor),
                  swatch;

              if (index > -1) {
                swatch = this._swatches[hexColor];
              }

              return swatch;
            },

            _getColorAttr: function () {
              return this.color === NO_COLOR ? NO_COLOR : new Color(this.color);
            },

            _previousColor: null,

            _enableTransparencySlider: function () {
              domClass.remove(this.dap_transparencyLabel, this.css.disabled);
              this.dap_transparencySlider.set("disabled", false);
            },

            _disableTransparencySlider: function () {
              domClass.add(this.dap_transparencyLabel, this.css.disabled);
              this.dap_transparencySlider.set("disabled", true);
            },

            _setColorAttr: function (value, priorityChange) {
              value = value || NO_COLOR;

              priorityChange = priorityChange || priorityChange === undefined;

              if (!this._required) {
                if (value === NO_COLOR) {
                  this._set("color", NO_COLOR);
                  this._previousColor = NO_COLOR;

                  this._disableTransparencySlider();
                  this._clearSelection();
                  this._silentlyUpdateHexInput(NO_COLOR);
                  this._updatePreviewSwatch(value);

                  domClass.add(this._noColorSwatchNode, this.css.selected);

                  if (priorityChange) {
                    this.emit("color-change", {
                      color: NO_COLOR
                    });
                  }

                  return;
                }
                else {
                  this._enableTransparencySlider();

                  domClass.remove(this._noColorSwatchNode, this.css.selected);
                }
              }

              var normalizedColor = colorUtil.normalizeColor(value),
                  previousColor = this._previousColor,
                  color = this._colorInstance,
                  selectedCssClass = this.css.selected,
                  hexColor;

              if (previousColor) {
                if (colorUtil.equal(previousColor, normalizedColor)) {
                  return;
                }

                var matchingSwatch = this._findColorSwatch(previousColor);
                if (matchingSwatch) {
                  domClass.remove(matchingSwatch, selectedCssClass);
                  domStyle.set(matchingSwatch, "borderColor", "");
                }
              }

              color.setColor(normalizedColor);
              hexColor = color.toHex();

              this._set("color", new Color(color));
              this._previousColor = normalizedColor;

              this._silentlyUpdateIntermediateChangingValueWidget(this.dap_transparencySlider, 1 - color.a);

              this._updatePreviewSwatch(color);
              this._checkSelection();
              this._silentlyUpdateHexInput(color);

              if (this.trackColors) {
                this._addRecentColor(hexColor);
              }

              if (priorityChange) {
                this.emit("color-change", {
                  color: new Color(color)
                });
              }
            },

            _getRecentColorsAttr: function () {
              return array.map(this.recentColors, function (color) {
                return colorUtil.normalizeColor(color);
              });
            },

            _setRecentColorsAttr: function (value) {
              this.recentColors = value || [];

              if (this._showRecentColors) {
                this.recentColors = array.map(this.recentColors, function (recent) {
                  return colorUtil.normalizeColor(recent).toHex();
                });
              }

              if (this.recentColors.length === 0) {
                this._clearRecentSwatches();
              }
              else {
                this._renderRecentSwatches();
              }
            },

            suggestedColors: null,

            _getSuggestedColorsAttr: function () {
              return array.map(this.suggestedColors, function (color) {
                return colorUtil.normalizeColor(color);
              });
            },

            _setSuggestedColorsAttr: function (value) {
              if (!this._showSuggestedColors) {
                return;
              }

              this._clearSuggestedSwatches();
              this.suggestedColors = value || [];

              this.suggestedColors = array.map(this.suggestedColors, function (suggested) {
                return colorUtil.normalizeColor(suggested).toHex();
              });

              if (this.suggestedColors.length > 0) {
                this._renderSuggestedSwatches();
              }
            },

            _setPaletteAttr: function (value) {
              var showingBrights = this._activePalette === this._brightsPalette;

              this._brightsPalette.set("colors", value);
              this._pastelsPalette.set("colors", this._toPastels(this._brightsPalette.get("colors")));

              this._activePalette = showingBrights ?
                                    this._brightsPalette :
                                    this._pastelsPalette;

              this._createPalettes();
              this._togglePalette(!showingBrights);
            },

            saveRecentColors: function (key) {
              localStorage.setItem(key, JSON.stringify(this.get("recentColors")));
            },

            loadRecentColors: function (key) {
              this.set("recentColors", JSON.parse(localStorage.getItem(key)));
            }
          });

    ColorPicker.NO_COLOR = NO_COLOR;

    return ColorPicker;
  });








