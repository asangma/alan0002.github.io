define([
  "./Widget",
  "./_Tooltip",

  "./VisibleScaleRangeSlider/_RecommendedScaleRangeBounds",
  "./VisibleScaleRangeSlider/_SlideEvent",
  "./VisibleScaleRangeSlider/ScaleMenu",
  "./VisibleScaleRangeSlider/ScalePreview",
  "./VisibleScaleRangeSlider/ScaleRanges",

  "dijit/form/DropDownButton",
  "dijit/popup",

  "dojo/_base/array",
  "dojo/_base/lang",

  "dojo/aspect",
  "dojo/debounce",
  "dojo/Deferred",
  "dojo/dom-class",
  "dojo/dom-construct",
  "dojo/dom-geometry",
  "dojo/dom-style",
  "dojo/on",
  "dojo/string",

  "dojox/form/HorizontalRangeSlider",

  "dojo/i18n!../nls/jsapi"
],
function (
  Widget, TooltipMixin,
  RecommendedScaleRangeBounds, SlideEvent, ScaleMenu, ScalePreview, ScaleRanges,
  DropDownButton, popup,
  array, lang,
  aspect, debounce, Deferred, domClass, domConstruct, domGeometry, domStyle, on, string,
  HorizontalRangeSlider,
  nlsJsapi
) {

  var VisibleScaleRangeSlider = Widget.createSubclass([TooltipMixin], {

    declaredClass: "esri.dijit.VisibleScaleRangeSlider",

    baseClass: "esriVisibleScaleRangeSlider",

    css: {
      currentScaleIndicator: "esriCurrentScaleIndicator",
      currentScaleIndicatorContainer: "esriCurrentScaleIndicatorContainer",
      scaleIndicator: "esriScaleIndicator",
      scaleIndicatorContainer: "esriScaleIndicatorContainer"
    },

    map: null,
    layer: null,
    region: "en-US",

    minScale: 0,
    maxScale: 0,

    intermediateChanges: false,

    labels: nlsJsapi.widgets.visibleScaleRangeSlider,

    _slider: null,

    _currentScaleIndicator: null,

    _scalePreview: null,
    _maxScaleButton: null,

    _minScaleButton: null,

    _mapUpdateHandler: null,

    _scaleRanges: null,

    _scheduleScaleRangeChangeEmit: null,

    _getSliderIndexRange: function(sliderValue) {
      // tweak the upper bound so it matches the range mapping:
      // scale range min to max
      //        maps to
      // index to index + 0.99999
      var min = Math.floor(sliderValue),
          max = min + 0.99999;

      return {
        min: min,
        max: max
      };
    },

    _setMapAttr: function(map) {
      this._set("map", map);

      if (this._mapUpdateHandler) {
        this._mapUpdateHandler.remove();
      }

      this._slider.set("disabled", true);

      this._ensureMapIsReady()
        .then(this._updateFromMap);
    },

    _updateFromMap: function(map) {
      var minScale = map.getMinScale(),
          maxScale = map.getMaxScale(),
          sliderIndexRange,
          mapUpdateHandler;

      this._slider.set("disabled", false);

      this._scaleRanges.set("scaleRangeBounds", {
        minScale: minScale,
        maxScale: maxScale
      });

      sliderIndexRange = this._getSliderIndexRange(this._scaleRanges.length - 1);

      this._slider.set("maximum", sliderIndexRange.max);

      this._silentSliderUpdate({
        maxScale: maxScale,
        minScale: minScale
      });

      this._updateCurrentScaleIndicator();

      mapUpdateHandler = map.on("zoom-end",
        lang.hitch(this, function() {
          this._updateCurrentScaleIndicator();
        }));

      this.own(mapUpdateHandler);
      this._mapUpdateHandler = mapUpdateHandler;
    },

    _ensureMapIsReady: function() {
      return this._ensureLoadedResource(this.map);
    },

    _ensureLoadedResource: function(resource) {
      var deferred = new Deferred();

      if (!resource) {
        deferred.reject(new Error("could not load resource"));
      }
      else if (resource.loaded) {
        deferred.resolve(resource);
      }
      else {
        resource.on("load", function() {
          deferred.resolve(resource);
        });
      }

      return deferred.promise;
    },

    _updateCurrentScaleIndicator: function() {
      var mapScale          = this._scaleRanges.clampScale(this.map.getScale()),
          sliderTick        = this._mapScaleToSlider(mapScale),
          leftOffsetRatio = sliderTick / this._slider.maximum;

      if (!this.isLeftToRight()) {
        leftOffsetRatio = 1 - leftOffsetRatio;
      }

      domStyle.set(this._currentScaleIndicator, {
        left: leftOffsetRatio * 100 + "%"
      });
    },

    _setLayerAttr: function(layer) {
      this._set("layer", layer);

      this._ensureMapIsReady()
        .then(this._ensureLayerIsReady)
        .then(this._updateMinMaxScaleFromLayer);
    },

    _ensureLayerIsReady: function() {
      return this._ensureLoadedResource(this.layer);
    },

    _updateMinMaxScaleFromLayer: function(layer) {
      this.set({
        minScale: layer.minScale,
        maxScale: layer.maxScale
      });
    },

    _mapSliderToScale: function(value) {
      var sliderIndexRange = this._getSliderIndexRange(value),

          range            = this._scaleRanges.findScaleRangeByIndex(value),

          minScale         = range.minScale,
          maxScale         = range.maxScale;

      return this._mapToRange(value,
        sliderIndexRange.min,
        sliderIndexRange.max,
        minScale,
        maxScale);
    },

    _mapToRange: function(valueA,
                          rangeAMin,
                          rangeAMax,
                          rangeBMin,
                          rangeBMax) {
      return rangeBMin +
             (valueA - rangeAMin) * (rangeBMax - rangeBMin) /
             (rangeAMax - rangeAMin);
    },

    _setRegionAttr: function(region) {
      this._set("region", region);
      this._scalePreview.set("source",
        ScaleRanges.getScalePreviewSource(region));
    },

    _getMinimumAttr: function() {
      return this._mapSliderToScale(this._slider.minimum);
    },

    _getMaximumAttr: function() {
      return this._mapSliderToScale(this._slider.maximum);
    },

    _getActualMaxScaleAttr: function() {
      return this._scaleRanges.clampMaxScale(this.maxScale);
    },

    _setMaxScaleAttr: function(maxScale) {
      this._set("maxScale", maxScale);

      this._ensureMapIsReady()
        .then(lang.hitch(this, function() {
          maxScale = this._scaleRanges.clampMaxScale(maxScale);

          this._set("maxScale", this._layerConstrainedMaxScale(maxScale));

          this._silentSliderUpdate({
            maxScale: maxScale
          });

          this._scheduleScaleRangeChangeEmit();
        }));
    },

    _silentSliderUpdate: function(scales) {
      var minScale = scales.minScale,
          maxScale = scales.maxScale,
          ranges   = this._scaleRanges,
          slider   = this._slider,
          minVal,
          maxVal;

      if (minScale !== undefined) {
        minVal = this._mapScaleToSlider(ranges.clampMinScale(minScale));
        slider.set("value", minVal, false, false);
      }

      if (maxScale !== undefined) {
        maxVal = this._mapScaleToSlider(ranges.clampMaxScale(maxScale));
        slider.set("value", maxVal, false, true);
      }
    },

    _mapScaleToSlider: function(scale) {
      var sliderValue      = this._scaleRanges.scaleToRangeIndex(scale),
          sliderIndexRange = this._getSliderIndexRange(sliderValue),
          range            = this._scaleRanges.findScaleRangeByIndex(sliderValue),
          minScale         = range.minScale,
          maxScale         = range.maxScale;

      return this._mapToRange(scale,
        minScale,
        maxScale,
        sliderIndexRange.min,
        sliderIndexRange.max);
    },

    _getActualMinScaleAttr: function() {
      return this._scaleRanges.clampMinScale(this.minScale);
    },

    _setMinScaleAttr: function(minScale) {
      this._set("minScale", minScale);

      this._ensureMapIsReady()
        .then(lang.hitch(this, function() {
          minScale = this._scaleRanges.clampMinScale(minScale);

          this._set("minScale", this._layerConstrainedMinScale(minScale));

          this._silentSliderUpdate({
            minScale: minScale
          });

          this._scheduleScaleRangeChangeEmit();
        }));
    },

    _emitScaleRangeChange: function() {
      this.emit("scale-range-change", {
        minScale: this.minScale,
        maxScale: this.maxScale
      });
    },

    _layerConstrainedMinScale: function(minScale) {
      var lods = lang.getObject("tileInfo.lods", false, this.layer) || [],
          hasTiledLayer = lods.length > 0,
          layerMinScale;

      if (hasTiledLayer) {
        layerMinScale = lods[0].scale;
        return minScale > layerMinScale ? layerMinScale : minScale;
      }

      return this._scaleRanges.beyondMinScale(minScale) ? 0 : minScale;
    },

    _layerConstrainedMaxScale: function(maxScale) {
      var lods = lang.getObject("tileInfo.lods", false, this.layer) || [],
          hasTiledLayer = lods.length > 0,
          layerMaxScale;

      if (hasTiledLayer) {
        layerMaxScale = lods[lods.length - 1].scale;
        return maxScale < layerMaxScale ? layerMaxScale : maxScale;
      }

      return this._scaleRanges.beyondMaxScale(maxScale) ? 0 : maxScale;
    },

    constructor: function() {
      this._scaleRanges = new (ScaleRanges.createSubclass([RecommendedScaleRangeBounds]))();

      this._scheduleScaleRangeChangeEmit = debounce(lang.hitch(this, this._emitScaleRangeChange), 0);

      this._ensureMapIsReady = lang.hitch(this, this._ensureMapIsReady);
      this._ensureLayerIsReady = lang.hitch(this, this._ensureLayerIsReady);
      this._updateMinMaxScaleFromLayer = lang.hitch(this, this._updateMinMaxScaleFromLayer);
      this._updateFromMap = lang.hitch(this, this._updateFromMap);
    },

    buildRendering: function() {
      this.inherited(arguments);

      this._initSlider();
      this._initScalePreview();
      this._initScaleIndicators();
      this._initScaleMenus();
    },

    _initSlider: function() {
      var slider = new (HorizontalRangeSlider.createSubclass([SlideEvent]))({
        baseClass: "esriHorizontalSlider",
        showButtons: false,
        intermediateChanges: this.intermediateChanges,
        disabled: true
      });

      this._slider = slider;

      slider.placeAt(this.domNode);
      slider.startup();

      this.own(
        slider.on("slide-onmousemove, slidemax-onmousemove",
          lang.hitch(this, function(e) {
            this._updateScalePreview(e.movable.handle);
          })),

        slider.on("slide-onmovestop, slidemax-onmovestop",
          lang.hitch(this, function(e) {
            var contains = domClass.contains(e.movable.handle,
              "dijitSliderThumbHover");

            if (!contains) {
              this._closeScalePreview();
            }
          })),

        slider.on("change", lang.hitch(this, function() {
          var minScale = Math.round(this._mapSliderToScale(this._getSliderMin())),
              maxScale = Math.round(this._mapSliderToScale(this._getSliderMax()));

          this.set("minScale", minScale);
          this.set("maxScale", maxScale);
        })),

        aspect.after(slider, "_setValueAttr",
          lang.hitch(this, this._updateLabelMenus))
      );
    },

    _getSliderMin: function() {
      var values = this._slider.get("value");

      return this.isLeftToRight() ? values[0] : values[1];
    },

    _getSliderMax: function() {
      var values = this._slider.get("value");

      return this.isLeftToRight() ? values[1] : values[0];
    },

    _updateLabelMenus: function() {
      var minScaleButton = this._minScaleButton,
          maxScaleButton = this._maxScaleButton;

      minScaleButton.set("label",
        this._scaleRanges.getScaleRangeLabel(this._getSliderMin()));
      maxScaleButton.set("label",
        this._scaleRanges.getScaleRangeLabel(this._getSliderMax()));
    },

    _initScalePreview: function() {
      var scalePreview = new ScalePreview();

      scalePreview.startup();

      popup.moveOffScreen(scalePreview);

      array.forEach([
          this._slider._movable.handle,
          this._slider._movableMax.handle
        ],
        function(handle) {

          handle.onmouseenter = lang.hitch(this, function() {
            this._updateScalePreview(handle);
          });

          handle.onmouseleave = lang.hitch(this, function() {
            this._closeScalePreview();
          });

        }, this);

      this.own(scalePreview);

      this._scalePreview = scalePreview;
    },

    _closeScalePreview: function() {
      popup.close(this._scalePreview);
    },

    _updateScalePreview: function(handle) {
      var slider          = this._slider,
          scalePreview    = this._scalePreview,
          isMin           = handle === slider.sliderHandle,
          handleValue     = isMin ? this._getSliderMin() : this._getSliderMax(),
          handlePos       = domGeometry.position(handle),
          scalePreviewPos = domGeometry.position(scalePreview.domNode),
          sliderBarPos    = domGeometry.position(slider.sliderBarContainer),
          isLtr           = this.isLeftToRight(),
          popupOrientation,
          relativeHandleX,
          halfScalePreviewWidth;

      scalePreview.set("backgroundPosition",
        this._scaleRanges.getScalePreviewSpriteBackgroundPosition(handleValue));

      relativeHandleX = handlePos.x - sliderBarPos.x;
      halfScalePreviewWidth = scalePreviewPos.w * 0.5;

      if (relativeHandleX < halfScalePreviewWidth) {
        popupOrientation = isLtr ?
          [
            "above",
            "below"
          ] :
          [
            "above-alt",
            "below-alt"
          ];
      }
      else if (relativeHandleX < sliderBarPos.w - halfScalePreviewWidth) {
        popupOrientation = ["above-centered", "below-centered"];
      }
      else {
        popupOrientation = isLtr ?
          [
            "above-alt",
            "below-alt"
          ] :
          [
            "above",
            "below"
          ];
      }

      popup.open({
        parent: this,
        popup: scalePreview,
        around: handle,
        orient: popupOrientation
      });
    },

    _initScaleIndicators: function() {
      var currentScaleIndicatorContainer = domConstruct.create("div", {
        className: this.css.scaleIndicatorContainer +
                   " " +
                   this.css.currentScaleIndicatorContainer
      }, this._slider.sliderBarContainer);

      var currentScaleIndicator = domConstruct.create("div", {
        className: this.css.scaleIndicator +
                   " " +
                   this.css.currentScaleIndicator
      }, currentScaleIndicatorContainer);
      this._currentScaleIndicator = currentScaleIndicator;

      this.createTooltip(currentScaleIndicator);

      var currentScaleIndicatorMouseOverHandler = on(currentScaleIndicator,
        "mouseover",
        lang.hitch(this, function() {
          var tooltipText = string.substitute(this.labels.currentScaleTooltip,
            {
              scaleLabel: this._scaleRanges.getScaleRangeLabel(this._mapScaleToSlider(this.map.getScale()))
            });

          this.findTooltip(currentScaleIndicator).set("label", tooltipText);
        }));

      this.own(currentScaleIndicatorMouseOverHandler);
    },

    _initScaleMenus: function() {
      var minMenu = new ScaleMenu(),
          maxMenu = new ScaleMenu(),
          minScaleButton,
          maxScaleButton;

      this.own(
        minMenu.on("scale-selected", lang.hitch(this, function(e) {
          minScaleButton.closeDropDown();
          this.set("minScale", e.scale);
        }))
      );

      this.own(
        maxMenu.on("scale-selected", lang.hitch(this, function(e) {
          maxScaleButton.closeDropDown();
          this.set("maxScale", e.scale);
        }))
      );

      minScaleButton = new DropDownButton({
        baseClass: "esriScaleMenuButton esriMinScaleMenuButton",
        dropDown: minMenu,
        dropDownPosition: ["below", "above"]
      });

      // force popup to apply scale menu CSS class
      minScaleButton.toggleDropDown();
      minScaleButton.toggleDropDown();

      maxScaleButton = new DropDownButton({
        baseClass: "esriScaleMenuButton esriMaxScaleMenuButton",
        dropDown: maxMenu,
        dropDownPosition: ["below", "above"]
      });

      // force popup to apply scale menu CSS class
      maxScaleButton.toggleDropDown();
      maxScaleButton.toggleDropDown();

      this.own(
        aspect.before(minScaleButton, "openDropDown",
          lang.hitch(this, function() {
            var maxScale = this._scaleRanges.findScaleRange(this.get("actualMaxScale")).minScale;

            minMenu.set("currentScale", {
              label: minScaleButton.label,
              scale: {
                current: this.get("actualMinScale"),
                map: this.map.getScale(),
                min: this.get("minimum"),
                max: maxScale
              }
            });
          }))
      );

      this.own(
        aspect.before(maxScaleButton, "openDropDown",
          lang.hitch(this, function() {
            var minScale = this._scaleRanges.findScaleRange(this.get("actualMinScale")).maxScale;

            maxMenu.set("currentScale", {
              label: maxScaleButton.label,
              scale: {
                current: this.get("actualMaxScale"),
                map: this.map.getScale(),
                min: minScale,
                max: this.get("maximum")
              }
            });
          }))
      );

      minScaleButton.placeAt(this.domNode);
      maxScaleButton.placeAt(this.domNode);

      minMenu.startup();
      maxMenu.startup();

      minScaleButton.startup();
      maxScaleButton.startup();

      this._minScaleButton = minScaleButton;
      this._maxScaleButton = maxScaleButton;
    },

    startup: function() {
      this.inherited(arguments);

      this.watch("intermediateChanges", function(name, oldValue, newValue) {
        this._slider.set(name, newValue);
      });
    }
  });

  return VisibleScaleRangeSlider;
});
