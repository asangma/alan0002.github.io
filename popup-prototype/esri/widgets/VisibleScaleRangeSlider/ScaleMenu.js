define([
    "../Widget",
    "../_Tooltip",

    "./recommendedScales",
    "./ScaleRanges",

    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",

    "../../core/declare",
    "dojo/_base/array",
    "dojo/_base/lang",

    "dojo/dom-class",
    "dojo/dom-construct",
    "dojo/dom-prop",
    "dojo/dom-style",
    "dojo/keys",
    "dojo/number",
    "dojo/on",
    "dojo/query",
    "dojo/string",

    "dojox/html/entities",
    "dojox/lang/functional/object",

    "dojo/i18n!../../nls/jsapi",
    "dojo/text!./templates/ScaleMenu.html",

    "dijit/form/TextBox"
  ],
  function (
    Widget, TooltipMixin,
    recommendedScales, ScaleRanges,
    TemplatedMixin, WidgetsInTemplateMixin,
    declare, array, lang,
    domClass, domConstruct, domProp, domStyle, keys, number, on, query, string,
    entities, object,
    nlsJsapi,
    widgetTemplate
  ) {
    var ScaleMenu = declare([ Widget, TemplatedMixin, WidgetsInTemplateMixin, TooltipMixin ], {

      declaredClass: "esri.dijit.VisibleScaleRangeSlider.ScaleMenu",

      templateString: widgetTemplate,

      baseClass: "esriScaleMenu",

      labels: nlsJsapi.widgets.visibleScaleRangeSlider,

      css: {
        header: "esriHeader",
        section: "esriSection",
        content: "esriContent",
        current: "esriCurrent",
        input: "esriInput",
        list: "esriList",
        item: "esriItem",
        inline: "esriInline",
        selectable: "esriSelectable",
        hidden: "esriHidden"
      },

      _elementValueMap: null,

      _elements: null,

      _scaleRangeCategories: null,

      _scaleRanges: null,

      _originalScaleInputValue: null,

      _rangeToScaleAndNodeLookup: null,

      constructor: function () {
        this._scaleRanges = new ScaleRanges();

      },

      buildRendering: function () {
        this.inherited(arguments);

        // TODO: RENAME
        // TODO: used to filter out applicable suggested scales
        // TODO: could use an array and just doc that the first one is the current
        this._rangeToScaleAndNodeLookup = {
          current: {
            scale: null, // will be set dynamically
            node: this.dap_currentScaleItem
          }
        };

        var labels = this.labels,
            scaleLabels = labels.featuredScaleLabels,
            allRecommendedScales = recommendedScales.all(),
            selectableMenuItemCssClass= this.css.item + " " + this.css.selectable,
            oldValue;

        array.forEach(object.keys(allRecommendedScales), function (key) {
          oldValue = scaleLabels[key];

          var recommendedScale = allRecommendedScales[key],
              label = string.substitute(oldValue, {
                scaleLabel: this._formatScale(recommendedScale)
              });

          var li = domConstruct.create("li", {
            innerHTML: label,
            className: selectableMenuItemCssClass
          }, this.dap_recommendedScales);

          this._rangeToScaleAndNodeLookup[key] = {
            scale: recommendedScale,
            node: li
          };

        }, this);

        var setToSpan = domConstruct.create("span", {
          innerHTML: labels.setTo,
          className: this.css.inline
        });

        var selectOneSpan = domConstruct.create("span", {
          innerHTML: labels.selectOne,
          className: this.css.inline
        });

        domProp.set(this.dap_scaleListHeader, "innerHTML",
          string.substitute(labels.setToSelectOne,
            {
              setTo: setToSpan.outerHTML,
              selectOne: selectOneSpan.outerHTML
            })
        );
      },

      _formatScale: function (scale) {
        return "1:" + number.format(scale);
      },

      postCreate: function () {
        this.inherited(arguments);

        var selectableMenuItemSelector = "." + this.css.item + "." + this.css.selectable;

        this.own(
          on(this.domNode, on.selector(selectableMenuItemSelector, "click"),
            lang.hitch(this, function (e) {
              this._emitScaleSelected(this._parseScale(e.target.innerHTML));
            })
          )
        );

        this.dap_scaleInput.on("keyDown", lang.hitch(this, function (e) {
          if (e.keyCode === keys.ENTER) {
            this._handleCustomScaleInput();
          }
        }));

        this.createTooltip(this.dap_scaleInput, this.labels.customScaleInputTooltip);
      },

      _emitScaleSelected: function (scale) {
        this.emit("scale-selected", {
          scale: scale
        });
      },

      _handleCustomScaleInput: function () {
        var scale = this._parseScale(this.dap_scaleInput.get("value"));

        if (!isNaN(scale)) {
          this._emitScaleSelected(this._scaleRanges.clampScale(scale));
        }
      },

      _parseScale: function (scaleText) {
        var nonDigitPeriodAndWhiteSpacePattern = /[^0-9.\s]/g,
            scaleValue = entities.decode(scaleText)
              .replace(/.*\(/, "")
              .replace(/\).*$/, "")
              .replace(/.*1:/, "")
              .replace(nonDigitPeriodAndWhiteSpacePattern, "");

        return number.parse(scaleValue);
      },

      _setCurrentScaleAttr: function (params) {
        var scale = params.scale,
            currentScale = this._formatScale(scale.current);

        this._rangeToScaleAndNodeLookup.current.scale = scale.current;

        domProp.set(this.dap_currentScaleLabel, "innerHTML", params.label);
        this.dap_scaleInput.set("value", currentScale, false);
        this._originalScaleInputValue = currentScale;

        var label = string.substitute(this.labels.featuredScaleLabels.current, {
          scaleLabel: this._formatScale(scale.map)
        });

        domProp.set(this.dap_currentScaleItem, "innerHTML", label);

        this._scaleRanges.set("scaleRangeBounds", {
          minScale: scale.min,
          maxScale: scale.max
        });

        this._hideOutOfScaleRanges();
      },

      _hideOutOfScaleRanges: function () {
        var listItemSelector = "." + this.css.item + "." + this.css.selectable,
            scaleItems = query(listItemSelector, this.dap_recommendedScales),
            ranges = this._scaleRanges,
            scale;

        array.forEach(object.keys(this._rangeToScaleAndNodeLookup), function (key) {
          var pair = this._rangeToScaleAndNodeLookup[key];

          scale = pair.scale;

          domClass.toggle(pair.node, this.css.hidden, !ranges.contains(pair.scale));
        }, this);

        var allHidden = scaleItems.every(function(item) {
          return domStyle.get(item, "display") === "none";
        });

        domClass.toggle(this.dap_recommendedScaleSection, this.css.hidden, allHidden);
      }

    });

    return ScaleMenu;
  });
