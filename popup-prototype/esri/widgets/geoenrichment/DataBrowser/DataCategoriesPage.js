define([
    "../../../core/declare",
    "dojo/string",
    "dojo/_base/lang",
    "dojo/aspect",
    "dojo/dom-class",
    "dojo/dom-construct",
    "dojo/dom-geometry",
    "dojo/on",
    "dojo/has",
    "dojo/i18n!../../../nls/jsapi",
    "dojo/text!./templates/DataCategoriesPage.html",
    "../../../tasks/geoenrichment/GeoenrichmentTask",
    "../config",
    "../_WizardPage",
    "../Pagination",
    "../AnimationHelper",
    "dojo/store/Memory",

    "dijit/layout/ContentPane",
    "dijit/form/FilteringSelect",
    "./SearchTextBox"
    
], function (
    declare,
    string,
    lang,
    aspect,
    domClass,
    domConstruct,
    domGeom,
    on,
    has,
    nls,
    template,
    GeoenrichmentTask,
    config,
    _WizardPage,
    Pagination,
    AnimationHelper,
    Memory
    )
{
    nls = nls.geoenrichment.dijit.DataCategoriesPage;

    var GLOBAL = "_";

    return declare([_WizardPage], {
        templateString: template,
        nls: nls,
        baseClass: "DataCategoriesPage",

        items: null,

        countryID: null,
        countryBox: true,
        dataCollections: {},
        rowsPerPage: 8,

        _task: null,
        _list: null,

        _pageCount: 0,
        _pageSize: 0,
        currentPage: 0,

        shoppingCart: null,
        selection: null,

        flyAnim: null,
        scrollAnim: null,

        constructor: function () {
            this._task = new GeoenrichmentTask(config.server);
            this._task.token = config.token;
            this.scrollAnim = new AnimationHelper();
            this._ltr = domGeom.isBodyLtr();
        },

        buildRendering: function () {
            this.inherited(arguments);

            this.pagination.createItemContainer = this._createItemContainer;
            this.pagination.updateItemContainer = this._updateItemContainer;
            
            aspect.after(this.layoutGrid, "resize", lang.hitch(this.pagination, this.pagination.resize));
        },

        startup: function () {
            this.inherited(arguments);
            
            if (this.countryBox) {
                this.countrySelect.set("labelAttr", "label");
                this.countrySelect.set("searchAttr", "label");
                this.countrySelect.store.idProperty = "value";
                this.countrySelect.set("item", { value: GLOBAL, label: nls.loading }, null, nls.loading);

                this.countrySelect.set("disabled", true);
                this.showProgress(this._task.getAvailableCountries(), "_onCountriesResponse");
            }
            else {
                domConstruct.destroy(this.countryDiv);//this.countrySelect.domNode.style.visibility = "hidden";
                this._loadDataCollections();
            }
        },

        _createItemContainer: function () {
            var node = domConstruct.create("div", { "class": "DataCategoriesPage_Item" });
            domConstruct.create("span", null, node);
            return node;
        },

        _updateItemContainer: function (node, item) {
            node.childNodes[0].innerHTML = item.name;
            node.className = "DataCategoriesPage_Item DataBrowser_Clickable DataCategoriesPage_Item_" + item.id.replace(/ /g, "_");
            node.data = item;
        },

        _onItemClick: function (node) {
            if (this.flyAnim) {
                if (!this._ltr) {
                    var pos = domGeom.position(node);
                    var right = window.innerWidth - pos.x - pos.w;
                    node.style.right = "" + right + "px";
                }

                var clone = this.flyAnim.fly(node, "Breadcrumb_SelectCategory");
                clone.innerHTML = "";
                domClass.remove(clone, "DataBrowser_Clickable");
                if (!this._ltr) {
                    node.style.right = "auto";
                }
            }

            this.onSelect(node.data);
        },

        _coerceCurrentPage: function (currentPage) {
            if (currentPage < 0) {
                currentPage = 0;
            }
            else if (currentPage >= this._pageCount) {
                currentPage = this._pageCount - 1;
            }
            return currentPage;
        },

        _back: function () {
            this.set("currentPage", this.currentPage - 1);
        },

        _forward: function () {
            this.set("currentPage", this.currentPage + 1);
        },

        _onCountriesResponse: function (countries) {
            this.countrySelect.set("disabled", false);
            
            var options = [{
                value: GLOBAL,
                label: nls.global
            }];
            for (var i = 0; i < countries.length; i++) {
                options.push({
                    value: countries[i].id,
                    label: countries[i].name
                });
            }

            var memory = new Memory({ data: options, idProperty: "value" });
            this.countrySelect.set("store", memory);
            
            this.countrySelect.set("value", this.countryID || GLOBAL);
        },

        _onCountryChanged: function () {
            var countryID = this.countrySelect.get("value");
            if (countryID == GLOBAL) {
                countryID = null;
            }
            this._set("countryID", countryID);
            this._loadDataCollections();
        },

        _setCountryIDAttr: function (countryID) {
            if (this.countryID == countryID) {
                return;
            }
            this._set("countryID", countryID);
            if (this._started) {
                this._loadDataCollections();
            }
        },

        _loadDataCollections: function () {
            this.cancelProgress("_onDataCollectionsResponse");
            this.showProgress(this._task.getDataCollections(this.countryID, null, ["id", "alias", "type", "description", "popularity", "fieldCategory", "vintage", "filteringTags"]), "_onDataCollectionsResponse");
        },

        _onDataCollectionsResponse: function (dataCollections) {
            if (!this.dataCollections) {
                this.dataCollections = {};
            }
            this.dataCollections[this.countryID] = dataCollections ? dataCollections : {};

            var categories = {};
            var previouslySelectedVariables = [];
            var selection = this.selection;

            var k;

            for (var i = 0; i < dataCollections.length; i++) {
                var dataCollection = dataCollections[i];
                dataCollection.fieldCategories = {};
                //Workaround server bugs
                if (dataCollection.metadata.filters) {
                    for (k = 0; k < dataCollection.metadata.filters.length; k++) {
                        dataCollection.metadata.filters[k].id = dataCollection.metadata.filters[k].id.replace("Diposable", "Disposable");
                    }
                }

                if (dataCollection.metadata.categories) {

                    if (dataCollection.variables) {
                        for (var l = 0; l < dataCollection.variables.length; l++) {
                            dataCollection.variables[l].id2 = dataCollection.id + "." + dataCollection.variables[l].id;
                            dataCollection.variables[l].hidden = 0;

                            //dataCollection.variables[l].idDesc = JSON.stringify({ id: dataCollection.variables[l].id, label: dataCollection.variables[l].description });
                            dataCollection.variables[l].idDesc = dataCollection.variables[l].id + "." + dataCollection.variables[l].description;

                            //Workaround server bugs
                            for (k = 0; k < dataCollection.variables[l].filteringTags; k++) {
                                dataCollection.variables[l].filteringTags[k].value = dataCollection.variables[l].filteringTags[k].value.replase("$", "");
                            }

                            if (selection && selection.length) {
                                for (k = 0; k < selection.length; k++) {
                                    if (selection[k] === dataCollection.variables[l].id2) {
                                        previouslySelectedVariables.push(dataCollection.variables[l]);
                                        break;
                                    }
                                }
                            }

                        }
                    }

                    for (var j = 0; j < dataCollection.metadata.categories.length; j++) {
                        var category = dataCollection.metadata.categories[j];
                        var categoryId = category.id.toLowerCase();

                        if (categories[categoryId]) {
                            categories[categoryId].dataCollections.push(dataCollection);
                        } else {
                            categories[categoryId] = {
                                id: categoryId,
                                name: category.alias,
                                dataCollections: [dataCollection],
                                displayOrder: category.displayOrder
                            };
                        }
                    }
                }
            }

            this.shoppingCart.setVariables(previouslySelectedVariables);

            var categoriesArray = [];
            for (category in categories) {
                if (categories.hasOwnProperty(category)) {
                categories[category].dataCollections.sort(
                    function (a, b) { return b.metadata.title < a.metadata.title ? 1 : -1; }
                );
                categoriesArray.push(categories[category]);
            }
            }
            categoriesArray.sort(function (a, b) {
                return b.displayOrder - a.displayOrder;
            });

            this.set("items", categoriesArray);
        },

        _setItemsAttr: function (items) {
            this._set("items", items);
            this.pagination.set("items", items);

            if (this._started) {
                this.resize();
            }
        },

        onSelect: function (category) { },

        _search:function () {
            if (!this.txbSearch.get("value")) {
                return;
            }

            var key = this.txbSearch.get("value");

            var categories = this.get("items");
            var matchCollections = [];

            var collection;
            var sourceCollection;

            for (var i = 0; i < categories.length; i++) {

                for (var j = 0; j < categories[i].dataCollections.length; j++) {
                    sourceCollection = categories[i].dataCollections[j];
                    collection = {
                        "id": sourceCollection.id,
                        "metadata": sourceCollection.metadata,
                        "keywords": sourceCollection.keywords,
                        "variables": []
                    };

                    for (var l = 0; l < sourceCollection.variables.length; l++) {
                        if (this._match(sourceCollection.variables[l], key)) {
                            collection.variables.push(sourceCollection.variables[l]);
                        }
                    }


                    if (collection.variables.length > 0) {
                        matchCollections.push(collection);
                    }
                }
            }

            if (matchCollections.length > 0) {
                this._set("selectedCollections", matchCollections);
                this.onSearch("'" + key + "'");
            } else {
                var keyValue = { seachKey: key };
                this.txbSearch.showTooltip(string.substitute(nls.noResults, keyValue));
            }
        },

        _match: function (variable, key) {
            return (variable.alias && variable.alias.toLowerCase().indexOf(key.toLowerCase()) !== -1) ||
                (variable.description && variable.description.toLowerCase().indexOf(key.toLowerCase()) !== -1) ||
                (variable.fieldCategory && variable.fieldCategory.toLowerCase().indexOf(key.toLowerCase()) !== -1)
            ;
        },

        onSearch: function () { }
    });

});