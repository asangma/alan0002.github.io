define([
    "../Widget",
    "../_Tooltip",

    "./_DelayedUpdate",
    "./colorRampUtil",
    "./schemeUtil",

    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dijit/a11yclick",

    "dojo/_base/array",
    "../../core/declare",
    "dojo/_base/lang",
    "dojo/dom-class",
    "dojo/dom-construct",
    "dojo/dom-style",
    "dojo/on",
    "dojo/query",

    "dojo/i18n!../../nls/jsapi",

    "dojo/text!./templates/ColorRampPicker.html",

    "dojo/NodeList-dom",

    "dijit/form/Button"
  ],
  function (
    Widget, TooltipMixin,
    BatchUpdateMixin, colorRampUtil, schemeUtil,
    TemplatedMixin, WidgetsInTemplateMixin, a11yclick,
    array, declare, lang, domClass, domConstruct, domStyle, on, query,
    nlsJsapi,
    template
  ) {

    var ColorRampPicker = declare("esri.widgets.SymbolStyler.ColorRampPicker",
      [ Widget, TemplatedMixin, WidgetsInTemplateMixin, BatchUpdateMixin, TooltipMixin ],
      {
        baseClass: "esriColorRampPicker",

        templateString: template,

        labels: nlsJsapi.widgets.symbolEditor,

        css: {
          item: "esriItem",
          selected: "esriSelected",
          container: "esriContainer",
          list: "esriList",
          preview: "esriPreview",
          flipper: "esriFlipper",
          viewport: "esriViewport"
        },

        schemes: null,
        selected: null,
        numStops: 0,

        _schemesChanged: false,
        _selectedChanged: false,
        _numStopsChanged: false,
        _orientationChanged: false,

        _commitPropsTrigger: null,

        _colorRampSurfaces: null,
        _previewRampSurface: null,

        _rampsAndSchemes: null,

        constructor: function () {
          this._colorRampSurfaces = [];
          this._commitPropsTrigger = this.createUpdateTrigger(this._commitProperties, this);
        },

        _commitProperties: function () {
          var rampsAndSchemes,
              hasStops;

          if (this._schemesChanged || this._numStopsChanged) {
            this._schemesChanged = false;
            this._numStopsChanged = false;

            rampsAndSchemes = schemeUtil.getColorRampsWithSchemes(this.schemes, this.numStops);
            hasStops = this._hasStops();
            this._rampsAndSchemes = rampsAndSchemes;

            domConstruct.empty(this.dap_colorRampPicker);

            this._colorRampSurfaces = [];

            array.forEach(rampsAndSchemes, function (rampAndScheme) {
              this._createColorRampItem({
                colors: rampAndScheme.colors,
                hasStops: hasStops
              });
            }, this);

            this._renderSuggestions();
          }

          if (this._selectedChanged) {
            this._selectedChanged = false;
            this._renderSelected();
          }

          if(this._orientationChanged) {
            this._orientationChanged = false;

            this._renderSelected();
            this._renderSuggestions();
          }

          if (!this.selected) {
            this.set("selected", this._rampsAndSchemes[0]);
          }
        },

        _hasStops: function () {
          return this.numStops > 0;
        },

        _createColorRampItem: function (opts) {
          var colors = opts.colors,
              numClasses = opts.numClasses,

              colorRampNode = domConstruct.create("div", {
                className: this.css.item,
                tabIndex: 0
              }, this.dap_colorRampPicker),

              rampHeight = domStyle.get(colorRampNode, "height"),
              rampWidth = domStyle.get(colorRampNode, "width"),

              ramp = colorRampUtil.createColorRamp({
                node: colorRampNode,
                width: rampWidth,
                height: rampHeight,
                colors: colors,
                numClasses: numClasses
              });

          this._colorRampSurfaces.push(ramp);
        },

        _renderSuggestions: function () {
          var colorRampSurfaces = this._colorRampSurfaces,
              rampsAndSchemes = this._rampsAndSchemes,
              hasStops = this._hasStops();

          array.forEach(colorRampSurfaces, function (surface, index) {
            colorRampUtil.updateColorRamp({
              ramp: surface,
              colors: rampsAndSchemes[index].colors,
              hasStops: hasStops
            });
          });
        },

        _renderSelected: function () {
          var ramp = this.selected.colors,
              previewRamp = this.dap_previewRamp,
              height = domStyle.get(previewRamp, "height"),
              width = domStyle.get(previewRamp, "width"),
              colors = ramp,
              hasStops = this._hasStops();

          if (this._previewRampSurface) {
            colorRampUtil.updateColorRamp({
              ramp: this._previewRampSurface,
              colors: colors,
              hasStops: hasStops
            });
          }
          else {
            this._previewRampSurface =
            colorRampUtil.createColorRamp({
              node: previewRamp,
              height: height,
              width: width,
              colors: colors,
              hasStops: hasStops
            });
          }
        },

        getStyle: function() {
          return this.get("selected");
        },

        _setSchemesAttr: function (schemes) {
          this._schemesChanged = true;
          this._set("schemes", schemeUtil.cloneScheme(schemes));
          this._commitPropsTrigger();
        },

        _getSelectedAttr: function () {
          var selected = this.selected,
              selectedClone = {
                colors: schemeUtil._createColors(selected.colors)
              };

          if (selected.scheme) {
            selectedClone.scheme = schemeUtil.cloneScheme(selected.scheme);
          }

          return selectedClone;
        },

        _setSelectedAttr: function (selected) {
          if (lang.isArray(selected)) {
            selected = {
              colors: selected
            };
          }

          this._selectedChanged = true;
          this._set("selected", selected);
          this._commitPropsTrigger();
          this.emit("color-ramp-change", this.get("selected"));
        },

        _getSuggestions: function () {
          return array.map(this._rampsAndSchemes, function (rampAndScheme) {
            return rampAndScheme.colors;
          });
        },

        _setNumStopsAttr: function (numStops) {
          numStops = numStops > 0 ? numStops : 0;

          this._numStopsChanged = true;
          this._set("numStops", numStops);
          this._commitPropsTrigger();
        },

        postCreate: function () {
          this.inherited(arguments);

          this._addHandlers();

          this.createTooltips([
            {
              node: this.dap_colorFlipper,
              label: this.labels.flipColorsTooltip
            },
            {
              node: this.dap_colorRampPicker,
              label: this.labels.selectRampTooltip
            }
          ]);
        },

        _addHandlers: function () {
          var itemSelector = "." + this.css.item;

          this.own(
            on(this.dap_colorRampPicker,
              on.selector(itemSelector, a11yclick),
              lang.partial(this._rampClickHandler, this)
            )
          );

          this.own(
            on(this.dap_colorFlipper, a11yclick, lang.hitch(this, function () {
              this.flipColors();
            }))
          );
        },

        _rampClickHandler: function (picker) {
          var selectedCssClass = picker.css.selected,
              itemSelector = "." + picker.css.item,
              itemNode = this,
              index = query("." + picker.css.item, picker.dap_colorRampPicker).indexOf(itemNode);

          query(itemSelector, picker.dap_colorRampPicker).removeClass(selectedCssClass);
          domClass.add(itemNode, selectedCssClass);

          picker.set("selected", picker._rampsAndSchemes[index]);
        },

        flipColors: function () {
          var rampsAndSchemes = this._rampsAndSchemes,
              selected = this.selected,
              customSelection = array.indexOf(this._getSuggestions(), selected.colors) === -1;

          if (customSelection) {
            selected.colors.reverse();
          }

          array.forEach(rampsAndSchemes, function (rampAndScheme) {
            schemeUtil.flipColors(rampAndScheme.scheme);
          });

          this._orientationChanged = true;
          this.set("selected", selected);
          this._commitPropsTrigger();
        },

        destroy: function () {
          this.inherited(arguments);

          //TODO: destroy ramp parent surfaces
          array.forEach(this._colorRampSurfaces, function (surface) {
            surface.destroy();
          });

          if (this._previewRampSurface) {
            this._previewRampSurface.destroy();
          }
        }
      });

    return ColorRampPicker;
  });
