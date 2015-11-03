define([
    "../../core/declare",
    "dojo/_base/lang",
    "dojo/dom-class",
    "dojo/dom-construct",
    "dojo/when",
    "dojox/mvc/sync",
    "./_Wizard",
    "./DataBrowser/DataCategoriesPage",
    "./DataBrowser/DataCollectionsPage",
    "./DataBrowser/DataVariablesPage",
    "./DataBrowser/ShoppingCart",
    "./DataBrowser/VariableInfo",
    "./DataBrowser/Breadcrumb",
    "./DataBrowser/autoTooltip",
    "./AnimationHelper",
    "dojo/i18n!../../nls/jsapi"

], function (
    declare,
    lang,
    domClass,
    domConstruct,
    when,
    sync,
    _Wizard,
    DataCategoriesPage,
    DataCollectionsPage,
    DataVariablesPage,
    ShoppingCart,
    VariableInfo,
    Breadcrumb,
    autoTooltip,
    AnimationHelper,
    nls
    ) {
    nls = nls.geoenrichment.dijit;

    var DATA_CATEGORIES = "cat";
    var DATA_COLLECTIONS = "col";
    var VARIABLES = "var";

    var DataBrowser = declare("esri.widgets.geoenrichment.DataBrowser", [_Wizard], {
        // summary:
        //      Widget to browse and select variables available in Geoenrichment. This page demonstrates it in action: http://la.arcgis.com/databrowser

        // title: String
        //      Title to show in the top left hand corner. Defaults to "Data Browser".
        title: nls.DataBrowser.title,

        // okButton: String
        //      OK button text. Can be set to null which will hide the button. Defaults to "Apply".
        okButton: nls.WizardButtons.apply,

        // backButton: String
        //      Back button text. Can be set to null which will hide the button. Defaults to "Back".
        backButton: nls.WizardButtons.back,

        // cancelButton: String
        //      Cancel button text. Can be set to null which will hide the button. Defaults to "Cancel".
        cancelButton: nls.WizardButtons.cancel,

        // countryID: String
        //      Two-digit country code selected in the country drop down. Defaults to null which will show "Global" variables available for all countries.
        countryID: null,

        // countryBox: Boolean
        //      Show/hide country drop down. Defaults to true.
        countryBox: true,

        // selection: String[]
        //      Selected variables array. Each item is full name like "KeyGlobalFacts.TOTPOP"
        selection: null,

        shoppingCart: null,
        variableInfo:null,
        breadcrumb: null,

        dataCollections: null,
        previousPage: null,

        _titleNode: null,
        _flyAnim: null,
        _varTitle: null,

        constructor: function () {
            this.shoppingCart = new ShoppingCart();
            this.variableInfo = new VariableInfo();
            this.breadcrumb = new Breadcrumb({
                onCategoriesClick: lang.hitch(this, this.loadPage, DATA_CATEGORIES),
                onDCsClick: lang.hitch(this, this.loadPage, DATA_COLLECTIONS)
            });
        },

        buildRendering: function () {
            this.inherited(arguments);

            this._flyAnim = new AnimationHelper(this.domNode);
            this.breadcrumb.flyAnim = this._flyAnim;

            domClass.add(this.domNode, "DataBrowser");

            this.shoppingCart.placeAt(this.domNode);
            this.breadcrumb.placeAt(this.domNode);

            var titleContainer = domConstruct.create("div", { "style": "position: absolute;" }, this.domNode);
            this._titleNode = domConstruct.create("div", { "class": "DataBrowser_Title" }, titleContainer);

            autoTooltip(this.domNode);
        },


        startup: function () {
            this.inherited(arguments);

            this.shoppingCart.multiSelect = true;
            this.shoppingCart.onSelect = lang.hitch(this, this._onSelect);
            this.shoppingCart.startup();

            if (!this.dataCollections) {
                this.dataCollections = {};
            }

            this.pages[DATA_CATEGORIES] = new DataCategoriesPage({
                countryBox: this.countryBox,
                shoppingCart: this.shoppingCart,
                selection: this.selection,
                dataCollections: this.dataCollections,
                flyAnim: this._flyAnim,
                onSelect: lang.hitch(this, function (arg) { this.previousPage = DATA_CATEGORIES; this._loadCollectionsPage(arg); }),
                onSearch: lang.hitch(this, function (varTitle) { this._varTitle = varTitle; this.previousPage = DATA_CATEGORIES; this._loadVarsPage(); })
            });
            sync(this, "countryID",  this.pages[DATA_CATEGORIES], "countryID");
            var buttons = [];

            if (this.backButton) {
                buttons.push({ label: this.backButton, onClick: lang.hitch(this, this._onBack) });
            }
            if (this.cancelButton) {
                buttons.push({ label: this.cancelButton, onClick: lang.hitch(this, this._onCancel) });
            }

            this.addButtons(DATA_CATEGORIES, buttons);
            this.loadPage(DATA_CATEGORIES);
        },

        loadPage: function (pageId) {
            switch (pageId) {
                case DATA_CATEGORIES:
                    if (this.pages[DATA_COLLECTIONS]) {
                        this.pages[DATA_COLLECTIONS].set("selectedCategory", null);
                        this.pages[DATA_COLLECTIONS].set("selectedCollections", null);
                    }

                    if (this.pages[VARIABLES]) {
                        this.pages[VARIABLES].set("selectedCategory", null);
                        this.pages[VARIABLES].set("selectedCollections", null);
                    }

                    break;
                case DATA_COLLECTIONS:
                    if (this.pages[DATA_COLLECTIONS]) {
                        this.pages[DATA_COLLECTIONS].set("selectedCollections", null);
                    }
                    if (this.pages[VARIABLES]) {
                        this.pages[VARIABLES].set("selectedCollections", null);
                    }

                    break;
                case VARIABLES:
            }
            this.inherited(arguments);
            if (this._currentPage.syncWithShoppingCart) {
                this._currentPage.syncWithShoppingCart();
            }
            this._updateBreadcrumb(pageId);
        },

        _updateBreadcrumb: function (pageId) {
            switch (pageId) {
                case DATA_CATEGORIES:
                    this.breadcrumb.domNode.style.display = "none";
                    break;
                case DATA_COLLECTIONS:
                    this.breadcrumb.domNode.style.display = "";
                    this.breadcrumb.selectCategory(this.pages[DATA_COLLECTIONS].get("selectedCategory"));
                    break;
                case VARIABLES:
                    this.breadcrumb.domNode.style.display = "";
                    var selectedCollections = this.pages[VARIABLES].get("selectedCollections");
                    var selectedCategory = !this.pages[DATA_COLLECTIONS] ? null : this.pages[DATA_COLLECTIONS].get("selectedCategory");
                    if (selectedCollections.length === 1) {
                        this.breadcrumb.selectDataCollection(selectedCollections[0].metadata.title, selectedCategory);
                    }
                    else {
                        this.breadcrumb.selectDataCollection("All Variables", selectedCategory);
                    }
                    break;
            }
        },

        _loadCollectionsPage: function (selectedCategory) {
            if (!this.pages[DATA_COLLECTIONS]) {
                this.pages[DATA_COLLECTIONS] = new DataCollectionsPage({
                    onSelect: lang.hitch(this, function (selectedCategory, varTitle) { this._varTitle = varTitle; this.previousPage = DATA_COLLECTIONS; this._loadVarsPage(selectedCategory); }),
                    shoppingCart: this.shoppingCart,
                    variableInfo: this.variableInfo,
                    multiSelect: true,
                    flyAnim: this._flyAnim
                });

                var buttons = [{
                    label: nls.WizardButtons.back,
                    onClick: lang.hitch(this, this.loadPage, DATA_CATEGORIES)
                }];
                if (this.okButton) {
                buttons.push({
                    label: this.okButton,
                    onClick: lang.hitch(this, this._onOK)
                });
                }
                if (this.cancelButton) {
                buttons.push({
                    label: this.cancelButton,
                    onClick: lang.hitch(this, this._onCancel)
                });
                }
                this.addButtons(DATA_COLLECTIONS, buttons);
            }

            if (selectedCategory) {
                this.pages[DATA_COLLECTIONS].set("selectedCategory", selectedCategory);
                this.loadPage(DATA_COLLECTIONS);
                this.pages[DATA_COLLECTIONS].syncWithShoppingCart();
                this.shoppingCart.onRemoveElement =
                    lang.hitch(this.pages[DATA_COLLECTIONS], this.pages[DATA_COLLECTIONS].onRemoveElementFromShoppingCart);
            }
        },

        _loadVarsPage: function (selectedCategory) {
            if (!this.pages[VARIABLES]) {
                this.pages[VARIABLES] = new DataVariablesPage({
                    shoppingCart: this.shoppingCart,
                    variableInfo: this.variableInfo,
                    multiSelect: true,
                    flyAnim: this._flyAnim
                });

                var buttons = [{
                    label: nls.WizardButtons.back,
                    onClick: lang.hitch(this, function () { this.loadPage(this.previousPage); })
                }];
                if (this.okButton) {
                buttons.push({
                    label: this.okButton,
                    onClick: lang.hitch(this, this._onOK)
                });
                }
                if (this.cancelButton) {
                buttons.push({
                    label: this.cancelButton,
                    onClick: lang.hitch(this, this._onCancel)
                });
                }
                this.addButtons(VARIABLES, buttons);
            }

            this.pages[VARIABLES].varTitle = this._varTitle;
            //var selectedCategory = this.pages[DATA_CATEGORIES].get("selectedCategory");
            this.pages[VARIABLES].set("selectedCategory", selectedCategory);

            var selectedCollections = this.pages[this.previousPage].get("selectedCollections");


            if (selectedCollections) {
                this.pages[VARIABLES].set("selectedCollections", selectedCollections);
                this.loadPage(VARIABLES);
                this.pages[VARIABLES].syncWithShoppingCart();
                this.shoppingCart.onRemoveElement =
                    lang.hitch(this.pages[VARIABLES], this.pages[VARIABLES].onRemoveElementFromShoppingCart);
            }
        },

        _setTitleAttr: function (title) {
            this._set("title", title);
            this._titleNode.innerHTML = title;
        },

        _onSelect: function () {
            this.selection = this.shoppingCart.collectSelection();
            this.emit("select");
            this.onSelect();
        },
        onSelect: function () { },

        _onBack: function () {
            this.emit("back");
            this.onBack();
        },
        onBack: function() { },

        _onOK: function () {
            this.selection = this.shoppingCart.collectSelection();
            this.emit("ok");
            this.onOK();
        },
        onOK: function() { },

        _onCancel: function () {
            this.emit("cancel");
            this.onCancel();
        },
        onCancel: function() { }
    });

    return DataBrowser;
});