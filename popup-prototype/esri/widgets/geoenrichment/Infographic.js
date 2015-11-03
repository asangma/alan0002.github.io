define([
    "require",
    "module",
    "../../core/declare",
    "dojo/_base/lang",
    "dojo/dom-construct",
    "dojo/Deferred",
    "../Widget",
    "./DataProvider",
    "./Geoenrichment",
    "./config",
    "dojo/on",
    "../../tasks/geoenrichment/GeoenrichmentTask",
    "../../tasks/geoenrichment/RingBuffer",
    "dojo/dom-class",
    "./_Invoke",
    "./utils"
], function (
    require,
    module,
    declare,
    lang,
    domConstruct,
    Deferred,
    Widget,
    DataProvider,
    Geoenrichment,
    config,
    on,
    GeoenrichmentTask,
    RingBuffer,
    domClass,
    _Invoke,
    utils
) {

    function infographicTitle(type, variables) {
        var d = new Deferred();
        var task = new GeoenrichmentTask(config.server);
        task.token = config.token;
        var pair = variables[0].split(".");
        task.getDataCollections(null, pair[0]).then(function (dataCollections) {
            if (type == "OneVar") {
                if (pair[1] == "*") {
                    d.resolve(dataCollections[0].variables[0].alias);
                }
                else {
                    var variables = dataCollections[0].variables;
                    for (var i = 0; i < variables.length; i++) {
                        if (variables[i].id == pair[1]) {
                            d.resolve(variables[i].alias);
                            return;
                        }
                    }
                    d.reject(new Error("Variable was not found within the data collection: " + variables[0]));
                }
            }
            else {
                d.resolve(dataCollections[0].metadata.title);
            }
        },
        function (error) {
            d.reject(error);
        });
        return d.promise;
    }

    var LocalDataProvider = declare([DataProvider], {

        _data: null,

        constructor: function (data, metadata) {
            this._data = data;
            lang.mixin(this.metadata, metadata);
        },

        getData: function () {
            return this._data;
        }

    });

    var Infographic = declare("esri.widgets.geoenrichment.Infographic", [Widget, _Invoke], {

        countryID: null,
        levels: config.levels,
        highestLevel: config.highestLevel,
        title: null,
        subtitle: "<div>${address}</div><div>${name}</div>",
        type: null,
        variables: null,
        studyArea: null,
        studyAreaOptions: null,
        outSR: null,
        expanded: true,
        returnGeometry: false,
        dataProvider: null,

        _data: null,
        _ge: null,

        _autoTitle: null,
        _autoTitlePromise: null,

        _eventMap: {
            "resize": ["size"],
            "data-request": true,
            "data-ready": ["provider"],
            "data-load": true,
            "data-error": ["error"]
        },

        constructor: function () {
            this.studyAreaOptions = new RingBuffer();
        },

        postMixInProperties: function () {
            this._ge = new Geoenrichment();
            this._ge.on("start", lang.hitch(this, this._onDataRequest));
            this._ge.on("data", lang.hitch(this, this._onDataReady));
            this._ge.on("end", lang.hitch(this, this._onDataLoad));
            this._ge.on("error", lang.hitch(this, this._onDataError));
            this.dataProvider = this._ge;

            //schedule initial load of the widget
            if (this.type) {
                this.invoke("_updateAutoTitle");
                this._updateReport();
            }
        },

        buildRendering: function () {
            this.inherited(arguments);
            this.domNode = domConstruct.create("div");
            if (!this.expanded) {
                domClass.add(this.domNode, "Collapsed");
            }
        },

        destroy: function () {
            this._destroyReportWidget();
            this._ge.stop();
            this.inherited(arguments);
        },

        _setReturnGeometryAttr: function (returnGeometry) {
            this._set("returnGeometry", returnGeometry);
            this._ge.returnGeometry = returnGeometry;
        },

        _setTitleAttr: function (title) {
            this._set("title", title);
            if (this._widget) {
                this._widget.title = title;
            }
        },

        _setSubtitleAttr: function (subtitle) {
            this._set("subtitle", subtitle);
            this._ge.setReturnAddress(/\$\{address\}/.test(subtitle));
            if (this._widget) {
                this._widget.subtitle = subtitle;
            }
        },

        _setTypeAttr: function (type) {
            if (this.type == type) {
                return;
            }
            this._set("type", type);

            //disconnect the currently loaded widget from data provider to make sure the widget is not updated anymore
            if (this._widget) {
                this._widget.setDataProvider(null);
            }

            this.invoke("_updateAutoTitle");
            //schedule reload of the widget
            this._updateReport();
        },

        _updateReport: function () {
            this._updateLevels();
            this.invoke("_requireReport");
        },
      
        _getAbsMid: function(relativeMid) {
            return require.toAbsMid ?
            
                // Dojo loader has toAbsMid
                require.toAbsMid(relativeMid) :
                
                // RequireJS loaded does not support toAbsMid but we can use 
                // module.id
                // http://wiki.commonjs.org/wiki/Modules/1.1
                (
                    module.id.replace(/\/[^\/]*$/ig, "/") + // returns folder containing this module
                    relativeMid
                );
        },

        _requireReport: function () {
            if (!this.type) {
                return;
            }
            require([this._getAbsMid("./" + this.type)],
                lang.hitch(this, this._createReportWidget, this.type));
        },

        _updateAutoTitle: function () {
            if (lang.isString(this.title) || !this.type || !this.variables) {
                return;
            }
            var self = this;
            this._autoTitlePromise = infographicTitle(this.type, this.variables);
            this._autoTitlePromise.then(function (title) {
                self._autoTitle = title;
            },
            function (error) {
                self._onDataError(error);
            });
            this._autoTitlePromise.always(function () {
                self._autoTitlePromise = null;
            });
        },

        _setCountryIDAttr: function (countryID) {
            this._set("countryID", countryID);
            this._ge.country = countryID;
        },

        _setVariablesAttr: function (variables) {
            var valid = true;
            if (lang.isArray(variables)) {
                for (var i = 0; i < variables.length; i++) {
                    if (variables[i].indexOf(".") <= 0) {
                        valid = false;
                        break;
                    }
                }
            }
            else if (variables != null) {
                valid = false;
            }
            if (!valid) {
                throw new Error("Invalid value for variables");
            }
            this._set("variables", variables);
            this._ge.setVariables(variables);
            this.invoke("_updateAutoTitle");
        },

        _setStudyAreaAttr: function (studyArea) {
            this._set("studyArea", studyArea);
            this._ge.setStudyArea(studyArea);
        },

        _setSpatialReference: function (outSR) {
            this._set("outSR", outSR);
            this._ge.setOutSR(outSR);
        },

        _setStudyAreaOptionsAttr: function (studyAreaOptions) {
            this._set("studyAreaOptions", studyAreaOptions);
            this._ge.setBuffer(studyAreaOptions);
        },

        _setExpandedAttr: function (expanded) {
            if (this.expanded == expanded) {
                return;
            }
            this._destroyReportWidget();
            this._set("expanded", expanded);
            if (expanded) {
                domClass.remove(this.domNode, "Collapsed");
            }
            else {
                domClass.add(this.domNode, "Collapsed");
            }
            this._updateReport();
        },

        _setCacheLimitAttr: function (limit) {
            this._ge.setCacheLimit(limit);
        },

        setData: function (data, metadata) {
            this.set("dataProvider", new LocalDataProvider(data, metadata));
        },

        _setDataProviderAttr: function (dataProvider) {
            if (this.dataProvider === dataProvider) {
                return;
            }
            this._set("dataProvider", dataProvider);
            if (this._ge) {
                this._ge.stop();
                this._ge = null;
            }
            if (this._widget) {
                this._widget.setDataProvider(dataProvider);
            }
        },

        _updateLevels: function () {
            var needLevels = utils.supportsComparison(this.type, this.expanded);
            if (needLevels) {
                this._ge.setGeoLevels(this.levels, this.highestLevel);
            }
            else {
                this._ge.setGeoLevels(null, null);
            }
        },

        _widget: null,

        _createReportWidget: function (type, WidgetClass) {
            if (this._destroyed || this.type != type) {
                return;
            }
            if (this._ge && this._ge.isBusy()) {

                //
                //Resolving race condition between GE service callback and dojo "require" callback. If the "require"
                //callback comes sooner then we need to wait for GE data before reloading the widget. If GE response
                //comes sooner then the newly created widget will pick up GE result inside setDataProvider method
                //
                on.once(this._ge, "end", lang.hitch(this, this._createReportWidget, this.type, WidgetClass));
                return;
            }
            if (this._autoTitlePromise) {

                //
                //Defer widget creation until after auto-title returns
                //
                this._autoTitlePromise.then(lang.hitch(this, this._createReportWidget, this.type, WidgetClass));
                return;
            }

            var temp = this._widget ? this._widget.getState("selectedComparison") : NaN;

            this._destroyReportWidget();
            if (!this.type) {
                return;
            }
            var widget = this._widget = new WidgetClass(this.domNode);
            widget.title = lang.isString(this.title) ? this.title : this._autoTitle;
            widget.subtitle = this.subtitle;
            widget.expanded = this.expanded;
            widget.on("resize", lang.hitch(this, this._onResize));
            if (!isNaN(temp)) {
                widget.setState({ "selectedComparison": temp });
            }
            widget.setDataProvider(this.dataProvider);
        },

        resize: function () {
            if (this._widget) {
                this._widget.resize();
            }
        },

        _destroyReportWidget: function () {
            if (this._widget) {
                this._widget.destroy();
                this._widget = null;
            }
        },

        _onResize: function (size) {
            this.onResize(size);
        },
        onResize: function (size) { },

        _onDataRequest: function () {
            this.onDataRequest();
        },
        onDataRequest: function () { },

        _onDataReady: function () {
            this.onDataReady(this._ge);
        },
        onDataReady: function (provider) { },

        _onDataLoad: function () {
            this.onDataLoad();
        },
        onDataLoad: function () { },

        _onDataError: function (error) {
            this.onDataError(error);
        },
        onDataError: function (error) { }
    });

    return Infographic;
});
