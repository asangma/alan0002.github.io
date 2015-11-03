define([
    "../../core/declare",
    "dojo/_base/lang",
    "dojo/dom-class",
    "./_Wizard",
    "../../tasks/geoenrichment/EnrichParameters",
    "../../tasks/geoenrichment/RingBuffer",
    "./EnrichOptionsPage",
    "./DataBrowser",
    "dojo/i18n!../../nls/jsapi"

], function (
    declare,
    lang,
    domClass,
    _Wizard,
    EnrichParameters,
    RingBuffer,
    EnrichOptionsPage,
    DataBrowser,
    nls
    ) {
    var DATA_BROWSER = "d";
    var OPTIONS = "o";

    var EnrichConfig = declare("esri.widgets.geoenrichment.EnrichConfig", [_Wizard], {

        enrichParams: null,
        geomType: null,
        fields: null,
        fieldsMap: null,
        allowNewColumns: true,
        allowFieldTypeMismatch: false,
        studyAreaCount: null,
        showBackButton: true,
        title: nls.geoenrichment.dijit.EnrichConfig.title,

        _nextButton: null,
        _dataCollections: null,

        _eventMap: {
            "back": true,
            "finish": ["params", "fieldsMap", "dataCollections"]
        },

        selectedIDs: null,

        constructor: function () {
            this.selectedIDs = [];
        },

        startup: function () {
            this.inherited(arguments);

            if (!this.enrichParams) {
                this.enrichParams = new EnrichParameters();
            }
            this.enrichParams.studyAreaOptions = new RingBuffer();
            domClass.add(this.domNode, "EnrichConfig");

            var dataBrowser = this.pages[DATA_BROWSER] = new DataBrowser({
                countryID: this.enrichParams.countryID,
                countryBox: true,
                multiSelect: true,
                okButton: nls.geoenrichment.dijit.WizardButtons.next,
                title: this.title
            });
            dataBrowser.on("back,cancel", lang.hitch(this, this._onBack));
            dataBrowser.on("ok", lang.hitch(this, this._applyVariables));

            this._loadDataBrowser();
        },

        _onDataCollectionSelect: function () {
            var any = false;
            var selection = this.pages[DATA_BROWSER].get("selection");
            for (var id in selection) {
                if (selection[id]) {
                    any = true;
                    break;
                }
            }
            this._nextButton.disabled = !any;
        },

        _loadDataBrowser: function () {
            this.pages[DATA_BROWSER].set("selection", this.selectedIDs);
            this.loadPage(DATA_BROWSER);
        },

        _applyVariables: function () {
            this._dataCollections = this.pages[DATA_BROWSER].dataCollections[this.enrichParams.countryID];


            if (!this.pages[OPTIONS]) {
                this.pages[OPTIONS] = new EnrichOptionsPage({
                    buffer: this.enrichParams.studyAreaOptions,
                    geomType: this.geomType,
                    fields: this.fields,
                    allowNewColumns: this.allowNewColumns,
                    allowFieldTypeMismatch: this.allowFieldTypeMismatch,
                    studyAreaCount: this.studyAreaCount,

                    onBack: lang.hitch(this, function () {
                        this.fieldsMap = this.pages[OPTIONS].get("fieldsMap");
                        this._loadDataBrowser();
                    }),
                    onFinish: lang.hitch(this, this._finish)
                });
            }

            this.pages[OPTIONS].set("dataCollections", this._dataCollections);

            var oldFieldsMap = this.fieldsMap || {};
            var newFieldsMap = {};
            var selection = this.selectedIDs = this.pages[DATA_BROWSER].get("selection");
            for (var i = 0; i < selection.length; i++) {
                var fullName = selection[i];
                newFieldsMap[fullName] = oldFieldsMap[fullName] || "";
                            }

            this.fieldsMap = newFieldsMap;
            this.pages[OPTIONS].set("fieldsMap", newFieldsMap);
            this.loadPage(OPTIONS);
        },

        _onBack: function () {
            this.onBack();
        },
        onBack: function () { },

        _finish: function () {

            this.enrichParams.countryID = this.pages[DATA_BROWSER].get("countryID");
            this.enrichParams.studyAreaOptions = this.pages[OPTIONS].get("buffer");
            var fieldsMap = this.fieldsMap = this.pages[OPTIONS].get("fieldsMap");

            var dataCollections = [];
            this.enrichParams.variables = [];
            var j;
            for (var i = 0; i < this._dataCollections.length; i++) {
                var dc = this._dataCollections[i];
                var wholeDataCollection = true;
                var variables = [];
                for (j = 0; j < dc.variables.length; j++) {
                    var fullName = dc.id + "." + dc.variables[j].id;
                    if (lang.isString(fieldsMap[fullName])) {
                        variables.push(fullName);
                    }
                    else {
                        wholeDataCollection = false;
                    }
                }
                if (wholeDataCollection) {
                    this.enrichParams.variables.push(dc.id + ".*");
                    dataCollections.push(dc);
                }
                else {
                    if (variables.length > 0) {
                        for (j = 0; j < variables.length; j++) {
                            this.enrichParams.variables.push(variables[j]);
                        }
                        dataCollections.push(dc);
                    }
                }
            }

            this.onFinish(this.enrichParams, fieldsMap, dataCollections);
        },
        onFinish: function (enrichParams, fieldsMap, dataCollections) { }

    });

    return EnrichConfig;
});