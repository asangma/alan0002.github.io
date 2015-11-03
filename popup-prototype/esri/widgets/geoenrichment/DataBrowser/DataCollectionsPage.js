define([
    "../../../core/declare",
    "dojo/string",
    "dojo/_base/lang",
    "dojo/aspect",
    "dojo/dom-class",
    "dojo/dom-construct",
    "dojo/dom-geometry",
    "dojo/query",
    "dojo/i18n!../../../nls/jsapi",
    "dojo/text!./templates/DataCollectionsPage.html",
	"dojo/on",
    "../CheckList",
    "../_WizardPage",
    "../Pagination",
     "dojo/store/Memory",
    "dgrid/List",
    "dgrid/Selection",
    "dijit/_WidgetBase",
    "../AnimationHelper",
    "dijit/Tooltip",
    "dojo/has",

    "dijit/layout/ContentPane",
    "dijit/form/Select",
    "./SearchTextBox"

], function (
    declare,
    string,
    lang,
    aspect,
    domClass,
    domConstruct,
    domGeom,
    query,
    nls,
    template,
    on,
    CheckList,
    _WizardPage,
    Pagination,
    Memory,
    List,
    Selection,
    _WidgetBase,
    AnimationHelper,
    Tooltip,
    has
    ) {
    nls = nls.geoenrichment.dijit.DataCollectionsPage;

    return declare([_WizardPage], {
        templateString: template,
        nls: nls,
        baseClass: "DataCollectionsPage",

        _checkList: null,

        selectedCategory: null,

        selectedCollection: null,
        selectedVariables: [],

        shoppingCart: null,
        variableInfo:null,
        multiSelect: true,
        flyAnim: null,
        icon:null,

        constructor: function(){
            this._ltr = domGeom.isBodyLtr();
        },

        buildRendering: function () {
            this.inherited(arguments);
            this._checkList = new CheckList({ onSelect: lang.hitch(this, this._onSelectVariable), onDeselect: lang.hitch(this, this._onDeselectVariable), selectionMode: this.multiSelect ? "toggle" : "single" }, this.divVariables);
            this._checkList.renderRow = lang.hitch(this, this._renderRow);

            this.pagination.createItemContainer = this._createItemContainer;
            this.pagination.updateItemContainer = this._updateItemContainer;

            aspect.after(this.layoutGrid, "resize", lang.hitch(this.pagination, this.pagination.resize));
        },

        _createItemContainer: function () {
            var node = domConstruct.create("div", { "class": "DataCollectionButton DataBrowser_Clickable TrimWithEllipses" });
            return node;
        },

        _updateItemContainer: function (node, item) {
            node.innerHTML = item.metadata.title;
            node.data = item;
        },

        _renderRow: function (item, options) {

            var root = domConstruct.create("div", { "style": "width:100%" });

            var checkBox = domConstruct.create("div", { "class": "TrimWithEllipses" });
            if (this.selectionMode != "single") {
                domConstruct.create("div", { "class": "dijit dijitInline dijitCheckBox VarCheck" }, checkBox);
            }
            var icon = domConstruct.create("div", { "class": "DataBrowserInfoIcon"}, checkBox);
            domConstruct.create("span", { "class": "VarLabel", innerHTML: item.description ? item.description : item.alias }, checkBox);

            domConstruct.place(checkBox, root);

            on(icon, "click", lang.hitch(this, this._toggleTooltip, icon, item));
            on(icon, "mouseenter", lang.hitch(this, this._showTooltip, icon, item));
            on(icon, "mouseleave", lang.hitch(this, this._hideTooltip, icon, item));

            
            //Prevent selection
            on(icon, "mousedown,touchstart,MSPointerDown,dgrid-cellfocusin", function (event) {
                if (event.stopPropagation) {
                    event.stopPropagation();
                }
            });

            return root;
        },

        _toggleTooltip: function (icon, object, event) {
            if (event.stopPropagation) {
                event.stopPropagation();
            }
            if (!this._icon) {
                this._showTooltip(icon, object, event);
            } else {
                this._hideTooltip();
            }

        },

        _showTooltip: function (icon, object, event) {
            this._icon = icon;
            this.variableInfo.set("variable", object);
            Tooltip.show(this.variableInfo.domNode.outerHTML, icon, ["above", "below"]);


            if (event.stopPropagation) {
                event.stopPropagation();
            }

            on.once(document, "click", lang.hitch(this, this._hideTooltip));
        },

        _hideTooltip: function () {
            Tooltip.hide(this._icon);
            this._icon = null;
        },

        _setSelectedCategoryAttr: function (selectedCategory) {
            this._set("selectedCategory", selectedCategory);
            if (!selectedCategory) {
                return;
            }

            var map = { categoryName: selectedCategory.name };
            this.categoryName.innerHTML = string.substitute(nls.categoryName, map);

            this._checkList.set("store", new Memory({ data: this.theMostPopularVars(selectedCategory, 3) }));
            this.pagination.set("items", selectedCategory.dataCollections);

            this.spnShowAll.innerHTML = string.substitute(nls.showAll, map);

            if (this._started) {
                this.resize();
            }

            this._setState("done");
        },

        theMostPopularVars: function (category, quantity) {
            var result = [];

            if (category) {
                var vars = {};
                for (var i = 0; i < category.dataCollections.length; i++) {
                    for (var j = 0; j < category.dataCollections[i].variables.length; j++) {
                        var variable = category.dataCollections[i].variables[j];
                        vars[variable.idDesc] = variable;
                    }
                }

                for (var key in vars) {
                    if (vars.hasOwnProperty(key)) {
                        result.push(vars[key]);
                    }
                }
            
                result = result.sort(function (a, b) {
                    return (b.popularity ? b.popularity : 0) - (a.popularity ? a.popularity : 0);
                }).slice(0, quantity);
            }

            return result;
        },

        _onSelectVariable: function (event) {
            var selectedVariables = this._checkList.get("selectedItems");
            //non-empty event.parentType indicates that selection was triggered by user clicking on the row rather than programmatically
            if (this.flyAnim && event.parentType) {
                var row = this._checkList.row(event.rows[0]).element;
                this.flyAnim.fly(query(".VarLabel", row)[0], "DataBrowser_SelectVar", ["top", this._ltr ? "right" : "left"]);
            }
            this._set("selectedVariables", selectedVariables);

            for (var i = 0; i < selectedVariables.length; i++) {
                this.shoppingCart.addVariable(selectedVariables[i]);
            }
        },

        _onDeselectVariable: function (event) {
            this.shoppingCart.removeVariable(event.rows[0].data.idDesc);
        },

        _onSelectCollection: function (selectedCollectionNode) {
            var selectedCollection = selectedCollectionNode.data;
            
            if (this.flyAnim) {
                if (!this._ltr) {
                    var pos = domGeom.position(selectedCollectionNode);
                    var right = window.innerWidth - pos.x - pos.w;
                    selectedCollectionNode.style.right = "" + right + "px";
                }

                var clone = this.flyAnim.fly(selectedCollectionNode, "Breadcrumb_SelectDC", null, true);
                domClass.remove(clone, ["dgrid-row", "dgrid-selected", "TrimWithEllipses"]);

                if (!this._ltr) {
                    selectedCollectionNode.style.right = "auto";
                }

            }
            
            this._set("selectedCollections", [selectedCollection]);
            this.onSelect(this._get("selectedCategory"), selectedCollection.metadata.title);
        },

        _showAll: function () {
            this._set("selectedCollections", this._get("selectedCategory").dataCollections);
            this.onSelect(this._get("selectedCategory"), this._get("selectedCategory").name);
        },

        _gotoCategories: function () { this.gotoCategories();  },

        gotoCategories: function () { },

        syncWithShoppingCart: function () {
            var data = this._checkList.store.data;
            var shoppingCartContent = this.shoppingCart.content;

            for (var i = 0; i < data.length; i++) {
                this._checkList.select(data[i], null, !!shoppingCartContent[data[i].idDesc]);
            }
        },

        onRemoveElementFromShoppingCart: function (idDesc) {
            var data = this._checkList.store.data;

            for (var i = 0; i < data.length; i++) {
                if (idDesc === data[i].idDesc) {
                    this._checkList.select(data[i], null, false);
                    break;
                }
            }
        },       

        _search: function () {
            if (!this.txbSearch.get("value")) {
                return;
            }

            var key = this.txbSearch.get("value");

            var collections = this._get("selectedCategory").dataCollections;
            var matchCollections = [];

            var collection;

            for (var i = 0; i < collections.length; i++) {

                collection = {
                    "id": collections[i].id,
                    "metadata": collections[i].metadata,
                    "keywords": collections[i].keywords,
                    "variables": []
                };

                for (var j = 0; j < collections[i].variables.length; j++) {
                    if (this._match(collections[i].variables[j], key)) {
                        collection.variables.push(collections[i].variables[j]);
                    }
                }

                if (collection.variables.length > 0) {
                    matchCollections.push(collection);
                }
            }

            if (matchCollections.length > 0) {
                this._set("selectedCollections", matchCollections);
                this.onSelect(this._get("selectedCategory"), "'" + key + "' " + string.substitute(nls.from, {categoryName: this._get("selectedCategory").name} ));
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
        }

    });
});
