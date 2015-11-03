define([
    "../../core/declare",
    "dojo/_base/fx",
    "dojo/_base/lang",
    "dojo/aspect",
    "dojo/dom-construct",
    "dojo/dom-geometry",
    "dojo/dom-style",
    "dojo/fx",
    "dojo/has",
    "dojox/gesture/swipe",
    "dojox/mvc/Templated",
    "dojo/text!./templates/InfographicsCarousel.html",
    "./Infographic",
    "dojo/on",
    "dojo/dom-class",
    "./InfographicsOptions",
    "./theme",
    "../../tasks/geoenrichment/GeoenrichmentTask",
    "../../tasks/geoenrichment/GeometryStudyArea",
    "./config",
    "../Widget",

    "dijit/layout/BorderContainer",
    "dijit/layout/ContentPane",
    "dijit/form/Select"

], function (
    declare,
    basefx,
    lang,
    aspect,
    domContruct,
    domGeom,
    domStyle,
    dojofx,
    has,
    swipe,
    Templated,
    template,
    Infographic,
    on,
    domClass,
    InfographicsOptions,
    theme,
    GeoenrichmentTask,
    GeometryStudyArea,
    config,
    Widget,
    UserError
) {

    var FADE = "f";
    var SLIDE_FORWARD = "sf";
    var SLIDE_BACK = "sb";

    function animate(node, effect, duration) {
        if (!effect || !duration) {
            return;
        }

        function createAnim(node, prop, start, end, units) {
            var props = {};
            props[prop] = { start: start, end: end };
            if (units) {
                props[prop].units = units;
            }
            return basefx.animateProperty({
                node: node,
                properties: props,
                duration: duration
            });
        }

        var clone = node.cloneNode(true);
        node.parentNode.insertBefore(clone, node);

        var anim;

        if (!domGeom.isBodyLtr()) {
            switch (effect) {
                case SLIDE_FORWARD:
                    effect = SLIDE_BACK;
                    break;
                case SLIDE_BACK:
                    effect = SLIDE_FORWARD;
                    break;

            }
        }

        switch (effect) {
            case FADE:
                anim = dojofx.combine([
                    createAnim(clone, "opacity", 1, 0),
                    createAnim(node, "opacity", 0, 1)
                ]);
                break;

            case SLIDE_FORWARD:
                anim = dojofx.combine([
                    createAnim(clone, "left", 0, -100, "%"),
                    createAnim(node, "left", 100, 0, "%")
                ]);
                break;

            case SLIDE_BACK:
                anim = dojofx.combine([
                    createAnim(clone, "left", 0, 100, "%"),
                    createAnim(node, "left", -100, 0, "%")
                ]);
                break;
        }

        aspect.after(anim, "onEnd", function () {
            domContruct.destroy(clone);
        });

        anim.play();
    }

    var SwipeGesture = declare(swipe.Swipe, {
        _process: function (element, phase, e) {
            e._locking = e._locking || {};
            if (e._locking[this.defaultEvent] || this.isLocked(e.currentTarget)) {
                return;
            }
            //e.preventDefault();
            e._locking[this.defaultEvent] = true;
            this[phase](element.data, e);
        }
    });

    var Swiper = declare([], {
        _swipe: null,
        _node: null,
        _rtl: null,
        _ltr: null,
        _distance: 50,

        constructor: function (node, fromRightToLeftHandler, fromLeftToRightHandler, distance) {
            this._node = node;
            this._rtl = fromRightToLeftHandler;
            this._ltr = fromLeftToRightHandler;

            if (distance) {
                this._distance = distance;
            }

            this._swipe = new SwipeGesture();
            on(this._node, this._swipe, function () { });
            on(this._node, this._swipe.end, lang.hitch(this, "_end"));
        },

        _end: function (e) {
            var d = e.dx;

            if (Math.abs(d) < this._distance) {
                return;
            }

            if (d < 0 && this._rtl) {
                this._rtl();
            }
            else if (this._ltr) {
                this._ltr();
            }
        }
    });

    var InfographicsCarousel = declare("esri.widgets.geoenrichment.InfographicsCarousel", [Templated, Widget], {
        templateString: template,

        studyArea: null,
        outSR: null,
        studyAreaTitle: null,
        selectedIndex: 0,
        options: null,
        expanded: true,
        returnGeometry: false,
        animDuration: 200,

        _items: null,
        _loading: null,
        _infographic: null,
        _getCountryPromise: null,
        _countryForStudyArea: false,
        _pendingAnimation: null,
        _pendingReload: true,

        _eventMap: {
            "resize": ["size"],
            "data-ready": ["provider"],
            "data-error": ["error"]
        },

        postCreate: function () {
            this.inherited(arguments);
            setTimeout(lang.hitch(this, this._onResize), 0);

            if (has("touch")) {
                /* jshint -W031 */
                new Swiper(this._container, lang.hitch(this, "_slideForward"), lang.hitch(this, "_slideBack"));
                /* jshint +W031 */
            }

            //Workaround to allow scrolling into popup in the case of ipad.
            if (has("esri-touch")) {
                on(this.domNode, "touchmove", function (e) {
                    e.stopPropagation();
                });
            }
        },

        startup: function () {
            this.inherited(arguments);
            if (!this.options) {
                this.set("options", new InfographicsOptions());
            }
        },

        _setReturnGeometryAttr: function (returnGeometry) {
            this._set("returnGeometry", returnGeometry);
            this._infographic.set("returnGeometry", returnGeometry);
        },

        _setStudyAreaAttr: function (studyArea) {
            this._countryForStudyArea = false;
            this._set("studyArea", studyArea);

            if (!this._getCountryPromise) {
                if (this._infographic.get("countryID")) {
                    this._infographic.set("studyArea", studyArea);
                }
                else {
                    this._getCountry();
                }
            }
            this._updateSubtitle();
        },

        _setOutSR: function (outSR) {
            this._set("outSR", outSR);
            this._infographic.set("outSR", outSR);
        },


        _getCountry: function () {
            if (this._getCountryPromise) {
                return;
            }
            var task = new GeoenrichmentTask(config.server);
            task.token = config.token;
            var studyArea = this.get("studyArea");
            this._getCountryPromise = task.getCountries(studyArea.geometry);
            this._getCountryPromise.always(lang.hitch(this, function () {
                this._getCountryPromise = null;
            }));
            this._getCountryPromise.then(lang.hitch(this, this._onGetCountryComplete, studyArea), lang.hitch(this, this._onDataError));
        },

        _onGetCountryComplete: function (studyArea, countries) {
            if (this.studyArea === studyArea) {
                this._countryForStudyArea = true;
            }
            this._infographic.set("countryID", countries[0]);
            this._infographic.set("studyArea", this.studyArea);
            this._getReports();
        },

        _setStudyAreaTitleAttr: function (studyAreaTitle) {
            this._set("studyAreaTitle", studyAreaTitle);
            this._updateSubtitle();
        },

        _updateSubtitle: function () {
            var subtitle;

            if (this.studyArea instanceof GeometryStudyArea) {
                if (this.studyArea.geometry.type == "polygon") {
                    if (this.studyAreaTitle) {
                        subtitle = this.studyAreaTitle;
                    }
                    else {
                        subtitle = "${name}"; //"This area"
                    }
                }
                else {
                    if (this.studyAreaTitle) {
                        subtitle = "<div>${address}</div><div>" + this.studyAreaTitle + " (${name})</div>";
                    }
                    else {
                        subtitle = "<div>${address}</div><div>${name}</div>"; //default subtitle
                    }
                }
            }
            else {
                subtitle = "<div>${address}</div><div>${name}</div>"; //default subtitle
            }
            this._infographic.set("subtitle", subtitle);
        },

        _setOptionsAttr: function (options) {
            this._set("options", options);
            this._getReports();
            theme.set(this.domNode, this.options.theme);
        },

        _getReports: function () {
            if (!this.options) {
                return;
            }
            var countryID = this._infographic.get("countryID");
            if (!countryID) {
                return;
            }
            this._pendingReload = true;
            this._showProgress();
            this.options.getItems(countryID).then(lang.hitch(this, this._fillReports), lang.hitch(this, this._onDataError));
        },
        _fillReports: function (reports) {
            this._items = [];
            this._select.removeOption(this._select.getOptions());
            for (var i = 0; i < reports.length; i++) {
                if (reports[i].isVisible) {
                    var item = reports[i];
                    this._items.push(item);
                    this._select.addOption({ value: (this._items.length - 1).toString(), label: item.title });
                }
            }
            this._infographic.set("cacheLimit", this._items.length);
            this._titlePane.style.visibility = "";
            this._updateSelection();
            this._infographic.set("studyAreaOptions", this.options.studyAreaOptions);
        },

        _setExpandedAttr: function (expanded) {
            this._set("expanded", expanded);
            if (expanded) {
                domClass.remove(this.domNode, "Collapsed");
            }
            else {
                domClass.add(this.domNode, "Collapsed");
            }
            this._infographic.set("expanded", expanded);
            this._pendingReload = true;
        },

        _setSelectedIndexAttr: function (selectedIndex) {
            if (this.selectedIndex == selectedIndex) {
                return;
            }
            this._set("selectedIndex", selectedIndex);
            this._updateSelection();
        },

        _updateSelection: function () {
            if (!this._items) {
                return;
            }
            if (!this._pendingAnimation) {
                this._pendingAnimation = FADE;
            }
            this._pendingReload = true;
            var item = this._items[this.selectedIndex];
            this._select.set("value", this.selectedIndex);
            this._infographic.set("type", item.type);
            this._infographic.set("variables", item.variables);
        },

        _onDataReady: function (provider) {

            var hasData = false;
            var data = provider.getData();
            var rowCount = data.features.length;
            if (rowCount > 0) {
                var feature = data.features[0];
                for (var i = 0; i < data.fields.length; i++) {
                    if (!data.fields[i].fullName) {
                        continue;
                    }
                    if (feature.attributes[data.fields[i].name]) {
                        hasData = true;
                        break;
                    }
                }
            }

            if (hasData) {
                animate(this._infographic.domNode, this._pendingAnimation, this.animDuration);
                this._pendingAnimation = null;
                this.onDataReady(provider);
            }
            else if (!this._countryForStudyArea) {
                //
                //Incorrect country - detect it again.
                //Clear variables to ensure no more requests are made for this country
                //
                this._infographic.set("variables", null);
                provider.stop();
                this._getCountry();
            }
        },
        onDataReady: function (provider) { },

        _onDataLoad: function () {
            if (this._getCountryPromise) {
                return;
            }
            this._hideProgress();
            this.onDataLoad();
        },
        onDataLoad: function () { },

        _onDataError: function (error) {
            this._hideProgress();
            this.onDataError(error);
        },
        onDataError: function (error) { },

        _showProgress: function () {
            if (this._pendingReload) {
                domStyle.set(this._reloadProgress, "display", "");
                this._pendingReload = false;
            }
            else {
                domStyle.set(this._updateProgress, "display", "");
            }
        },

        _hideProgress: function () {
            domStyle.set(this._reloadProgress, "display", "none");
            domStyle.set(this._updateProgress, "display", "none");
        },

        _slideBack: function () {
            this._pendingAnimation = SLIDE_BACK;
            this._infographic.set("effect", "slideBack");
            var selectedIndex = this.get("selectedIndex") - 1;
            if (selectedIndex < 0) {
                selectedIndex = this._items.length - 1;
            }
            this.set("selectedIndex", selectedIndex);
        },

        _slideForward: function () {
            this._pendingAnimation = SLIDE_FORWARD;
            var selectedIndex = this.get("selectedIndex") + 1;
            if (selectedIndex >= this._items.length) {
                selectedIndex = 0;
            }
            this.set("selectedIndex", selectedIndex);
        },

        _onSelectChange: function () {
            this.set("selectedIndex", +this._select.get("value"));
        },

        _onResize: function () {
            this.onResize([this.domNode.scrollWidth, this.domNode.scrollHeight]);
        },
        onResize: function (size) { },

        _getCountryIDAttr: function () {
            return this._infographic.get("countryID");
        }

    });

    return InfographicsCarousel;
});
