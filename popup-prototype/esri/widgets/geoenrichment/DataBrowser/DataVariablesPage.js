define([
    "../../../core/declare",
    "dojo/_base/lang",
    "dojo/dom-class",
    "dojo/dom-construct",
    "dojo/dom-geometry",
    "dojo/Stateful",
    "dojo/query",
    "dojo/i18n!../../../nls/jsapi",
    "dojo/text!./templates/DataVariablesPage.html",
    "../_WizardPage",
    "../_Invoke",
    "../CheckList",
    "dojo/store/Memory",
    "dojo/data/ObjectStore",
    "dgrid/Tree",
    "dgrid/OnDemandGrid",
    "dgrid/extensions/DijitRegistry",
    "dgrid/Selection",
    "dojo/aspect",
    "dijit/Tooltip",
	"dojo/on",
    "dijit/registry",

    "dijit/layout/ContentPane"

], function (
    declare,
    lang,
    domClass,
    domConstruct,
    domGeom,
    Stateful,
    query,
    nls,
    template,
    _WizardPage,
    _Invoke,
    CheckList,
    Memory,
    ObjectStore,
    Tree,
    OnDemandGrid,
    DijitRegistry,
    Selection,
    aspect,
    Tooltip,
    on,
    registry
    )
{
    nls = nls.geoenrichment.dijit.DataVariablesPage;

    var ItemView = declare([Stateful], {

        checked: true,

        getLabel: function () { },

        getClass: function () {
            return "";
        }

    });

    var ViewStore = declare([ObjectStore], {

        getChildren: function (view) {
            return view.getChildren();
        },

        mayHaveChildren: function (view) {
            return !!view.getChildren;
        }

    });

    var CustomGrid = declare([OnDemandGrid, DijitRegistry, Selection, _Invoke], {
        selectionMode: "toggle",
        shoppingCart: null,
        variableInfo: null,
        useTouchScroll: false,

        _lockAnimation: false,

        constructor: function(){
            this._ltr = domGeom.isBodyLtr();
        },

        removeRow: function (rowElement, justCleanup) {
            var dijits = registry.findWidgets(rowElement);
            if (dijits) {
                for (var i = 0; i < dijits.length; i++) {
                    dijits[i].destroy();
                }
            }
            this.inherited(arguments);
        },

        buildRendering: function () {
            this.inherited(arguments);
                //Selection
            this.on("dgrid-select", lang.hitch(this, this._onSelect));
            this.on("dgrid-deselect", lang.hitch(this, this._onDeselect));
        },

        select: function (row, toRow, value) {
            var element = this.row(row).element;
            if (value === null || value === undefined) {
                value = !domClass.contains(element, "dgrid-selected");
            }

            var data = this.row(row).data;

            if (data && data._children) {
                var children = data.getChildren();
                var childrenRow;

                //If branch have data of children but have no elements - construct hidden rows for this children
                if (children.length > 0 && !this.row(children[0]).element) {
                    this.expand(this.row(row), false, true);
                }

                this._lockAnimation = true;

                for (var i = 0; i < children.length; i++) {
                    childrenRow = this.row(children[i]);
                    this.select(childrenRow, toRow, value);
                }
                this._lockAnimation = false;


                if (element) {
                    if (value) {
                        domClass.add(element, "dgrid-selected");
                        this.flyAnim.fly(query(".VarLabel", element)[0], "DataBrowser_SelectVar", ["top", this._ltr ? "right" : "left"]);

                    } else {
                        domClass.remove(element, "dgrid-selected");
                    }
                }
            }

            this.inherited(arguments);

            if (element) {
                var check = query(".dijitCheckBox", element)[0];
                if (check) {
                    if (domClass.contains(element, "dgrid-selected")) {
                        domClass.add(check, "dijitCheckBoxChecked");
                    }
                    else {
                        domClass.remove(check, "dijitCheckBoxChecked");
                    }
                }
            }

        },

        syncOneBranchWithShoppingCart: function (rows) {
            var shoppingCartContent = this.shoppingCart.content;

            for (var j = 0; j < rows.length; j++) {
                this.select(rows[j], null, !!shoppingCartContent[rows[j].idDesc]);
            }
        },


        _setSelection: function (event) {
            this.selection = this.get("selection");

            this.selectedItems = [];

            if (this.selection && this.store.data) {
                var items = this.store.data;
                var children;
                for (var i = 0; i < items.length; i++) {
                    children = items[i].getChildren();
                    for (var j = 0; j < children.length; j++) {
                        if (this.selection[children[j].id]) {
                            this.selectedItems.push(children[j]);
                        }
                    }
                }
            }
        },

        _onSelect: function (event) {
            //
            //Non-empty event.parentType indicates that selection was triggered by user clicking on the row rather than programmatically.
            //
            if (!this._lockAnimation && this.flyAnim && event.parentType) {
                var row = this.row(event.rows[0]).element;
                this.flyAnim.fly(query(".VarLabel", row)[0], "DataBrowser_SelectVar", ["top", this._ltr ? "right" : "left"]);
            }
            this._setSelection(event);
            this.onSelect(event);
        },

        _onDeselect: function (event) {
            this._setSelection(event);
            this.onDeselect(event);
        },

        onDeselect: function (event) {
            for (var i = 0; i < event.rows.length; i++) {
                this.shoppingCart.removeVariable(event.rows[i].data.idDesc);
            }
        },

        onSelect: function () {
            this.invoke("_addVariablesToCart");
        },

        _addVariablesToCart: function () {
            this.shoppingCart.addVariables(this.selectedItems);
        }

    });

    var FieldCategoryView = declare([ItemView], {

        variables: null,
        _updateChildren: true,
        _label:null,

        constructor: function (label, variables) {
            this.set("id", "" + label);
            this._label = label;
            this._children = [];
            this.variables = [];
            for (var idDesc in variables) {
                if (variables.hasOwnProperty(idDesc)) {
                    this.variables.push(variables[idDesc]);
                    this._children.push(variables[idDesc]);
                }
            }
        },

        getLabel: function () {
            return this._label;
        },

        getChildren: function () {
            return this._children;
        }

    });

    return declare([_WizardPage, _Invoke], {
        templateString: template,
        nls: nls,
        baseClass: "DataVariablesPage",
        varTree:null,
        varTitle:null,

        _grid: null,
        _model: null,

        selectedCollection: null,
        store: null,
        storeModel:null,
        multiSelect: true,
        filtration:null,

        shoppingCart: null,
        _icon:null,

        flyAnim: null,

        _setSelectedCollectionsAttr: function (selectedCollections) {
            this._set("selectedCollections", selectedCollections);
            if (!selectedCollections) {
                return;
            }
            //this.divHeaderCollection.innerHTML =
            //    selectedCollections.length == 1
            //    ? "<span>" + selectedCollections[0].metadata.title + "</span>"
            //    : nls.allVariables;

            //Filtration
            /*
            //this.filtration = new VariableFiltration({collections: selectedCollections, divLocaiton: this.divFiltration});
            this.filtration = new VariableFiltration();
            this.filtration.collections = selectedCollections;
            this.filtration.divLocaiton = this.divFiltration;
            this.filtration.apply = lang.hitch(this, this._refreshGrid),
            this.filtration.construct();
            */

            var vars = 0;
            this._model = [];
            var fieldCategories = {};
            var sourceVariable;
            var idDesc;

            for (var i = 0; i < selectedCollections.length; i++) {
                
                if (selectedCollections[i].variables) {
                    for (var l = 0; l < selectedCollections[i].variables.length; l++) {
                        sourceVariable = selectedCollections[i].variables[l];
                        var fieldCategoryName = sourceVariable.fieldCategory;
                        idDesc = sourceVariable.idDesc;
                        if (!fieldCategories[fieldCategoryName]) {
                            fieldCategories[fieldCategoryName] = {};
                        }

                        fieldCategories[fieldCategoryName][idDesc] = sourceVariable;
                    }
                }

            }

            for (var fieldCategory in fieldCategories) {
                if (fieldCategories.hasOwnProperty(fieldCategory)) {
                    for (idDesc in fieldCategories[fieldCategory]) {
                        if (fieldCategories[fieldCategory].hasOwnProperty(idDesc)) {
                            vars++;
                        }
                    }

                    this._model.push(new FieldCategoryView(
                        fieldCategory,
                        fieldCategories[fieldCategory]
                    ));
                }
            }

            this.spnVarsQuant.innerHTML = vars.toString();
            this.spnVarTitle.innerHTML = this.varTitle.toString();

            var memory = new Memory({data: this._model});

            var store = new ViewStore(memory);

            if (!this._grid) {
                var columns = [
                    Tree({
                        label: " ",
                        field: "expander",
                        shouldExpand: lang.hitch(this, this._shouldExpand)
                    }),
                    {
                        label: "Variables",//nls.varName,
                        field: "alias",//"varName",
                        sortable: false,
                        renderCell: lang.hitch(this, this._renderCheckBox)
                    }
                ];

                this._grid = new CustomGrid({
                    store: store,
                    columns: columns,
                    showHeader: false,
                    shoppingCart: this.shoppingCart,
                    selectionMode: this.multiSelect ? "toggle" : "single",
                    selectionDelegate: this.multiSelect ? ".TrimWithEllipses" : ".dgrid-row",
                    flyAnim: this.flyAnim
                }, this.divTree);

                //If branch expanding first time it shoulb be synchronized with ShoppingCart
                //Syntetic inheritance
                var treeExpand = lang.hitch(this._grid, this._grid.expand);
                this._grid.expand = function (target, expand, noTransition) {
                    var row = target.element ? target : this.row(target);
                    var data = this.row(row).data;

                    var children = null;
                    var wasExpanded = false;

                    if (data.getChildren) {
                        children = data.getChildren();
                        wasExpanded = !!this.row(children[0]).element;
                    }

                    var promise = treeExpand(target, expand, noTransition);

                    if (children && expand !== false) {
                        if (children.length > 0 && !wasExpanded) {
                            this.syncOneBranchWithShoppingCart(data.variables);
                        }
                    }

                    return promise;
                };
                
                aspect.after(this._grid, "expand", lang.hitch(this, this.invoke, "resize"));

                this._grid.startup();
                
            }else {
                this._grid.set("store", store);
            }

       },


        _refreshGrid: function () {
            var vars = 0;

            for (var i = 0; i < this._model.length; i++) {
                this._model[i]._children = [];
                for (var j = 0; j < this._model[i].variables.length; j++) {
                    if (this._model[i].variables[j].hidden === 0) {
                        this._model[i]._children.push(this._model[i].variables[j]);
                    }
                }

                vars += this._model[i]._children.length;
            }

            this._grid.store = new ViewStore(new Memory({ data: this._model }));

            this.spnVarsQuant.innerHTML = vars.toString();


            this._grid.refresh();
            this._grid.resize();
        },
        
        _shouldExpand: function (row, level, previouslyExpanded) {
            if (previouslyExpanded !== undefined) {
                return previouslyExpanded;
            }
            return this._model.length == 1;
        },

        _renderCheckBox: function (object, value, node, options) {
            var isVar = !object.variables;
            var label;
            if (isVar) {
                label = object.description || object.alias;
            }
            else {
                label = object.getLabel();
            }

            var root = domConstruct.create("div", { "class": "TrimWithEllipses VariableRowRoot" });
            if (this.multiSelect) {
                domConstruct.create("div", { "class": "dijit dijitInline dijitCheckBox VarCheck" }, root);
            }
            if (isVar) {
                domClass.add(root.children[0], "DataVariablesPage_VarCheck");
                var icon = domConstruct.create("div", { "class": "DataBrowserInfoIcon"}, root);
                on(icon, "click", lang.hitch(this, this._toggleTooltip, icon, object));
                on(icon, "mouseenter", lang.hitch(this, this._showTooltip, icon, object));
                on(icon, "mouseover", lang.hitch(this, this._showTooltip, icon, object));
                on(icon, "mouseleave", lang.hitch(this, this._hideTooltip, icon, object));

                //Prevent selection
                on(icon, "mousedown,touchstart,MSPointerDown,dgrid-cellfocusin", function (event) {
                    if (event.stopPropagation) {
                        event.stopPropagation();
                    }
                });
            }

            domConstruct.create("span", { "class": "VarLabel", innerHTML: label }, root);

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

        onRemoveElementFromShoppingCart: function (idDesc) {
            var row;

            for (var i = 0; i < this._grid.store.data.length; i++) {
                for (var j = 0; j < this._grid.store.data[i].variables.length; j++) {
                    if (idDesc === this._grid.store.data[i].variables[j].idDesc) {
                        row = this._grid.store.data[i].variables[j];
                        break;
                    }
                }
                if (row) {
                    break;
                }
            }

            if (row) {
                this._grid.select(row, null, false);
            }
        },


        syncWithShoppingCart: function () {
            var row;
            var shoppingCartContent = this.shoppingCart.content;
            var varIsSelected = false;
            var branchIsSelected = false;

            if (this._grid) {
                for (var i = 0; i < this._grid.store.data.length; i++) {
                    branchIsSelected = true;
                    for (var j = 0; j < this._grid.store.data[i].variables.length; j++) {
                        row = this._grid.store.data[i].variables[j];
                        varIsSelected = !!shoppingCartContent[row.idDesc];
                        this._grid.select(row, null, varIsSelected);
                        if (!varIsSelected) {
                            branchIsSelected = false;
                        }
                    }

                    if (branchIsSelected) {
                        var element = this._grid.row(this._grid.store.data[i]).element;
                        if (element) {
                            domClass.add(element, "dgrid-selected");
                            var check = query(".dijitCheckBox", element)[0];
                            if (check) {
                                domClass.add(check, "dijitCheckBoxChecked");
                            }
                        }
                    }
                }
            }
        },

        onSelect: function () { }
    });

});
