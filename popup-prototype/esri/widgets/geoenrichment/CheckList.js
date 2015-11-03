define([
    "../../core/declare",
    "dojo/dom-construct",
    "dojo/dom-class",
    "dojo/_base/lang",
    "dojo/query",
    "dojo/store/Memory",
    "dgrid/List",
    "dgrid/Selection",

    "dijit/layout/ContentPane"

], 
function (
    declare,
    domConstruct,
    domClass,
    lang,
    query,
    Memory,
    List,
    Selection
    )
{

    function renderCheckBox(label, multiSelect) {
        var root = domConstruct.create("div", { "class": "TrimWithEllipses" });
        if (multiSelect) {
            domConstruct.create("div", { "class": "dijit dijitInline dijitCheckBox VarCheck" }, root);
        }
        domConstruct.create("span", { "class": "VarLabel", innerHTML: label }, root);
        return root;
    }

    var CheckList = declare("esri.widgets.geoenrichment.CheckList", [List, Selection], {
        selectionMode: "toggle",
        store: null,
        selectedItems: null,
        useTouchScroll: false,

        _setStore: function (store) {
            this.store = store;
            this.refresh(); //clear
            this.renderArray(store.data);
        },

        _setItems: function (items) {
            var store = new Memory({ data: items });
            this.set("store", store);
            this.refresh(); //clear
            this.renderArray(store.data);
        },


        buildRendering: function(){
            this.inherited(arguments);
            //Selection
            var onSelect = lang.hitch(this, this._onSelect);
            this.on("dgrid-select", onSelect);
            this.on("dgrid-deselect", lang.hitch(this, this._onDeselect));
        },

        select: function (row) {
            this.inherited(arguments);
            var element = this.row(row).element;
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
        
        renderRow: function (item, options) {
            return renderCheckBox(item.description ? item.description : item.alias, this.selectionMode != "single");
        },

        _setSelection:function () {
            this.selection = this.get("selection");

            this.selectedItems = [];

            if (this.selection && this.store.data) {
                var items = this.store.data;
                for (var i = 0; i < items.length; i++) {
                    if (this.selection[items[i].id]) {
                        //this.selectedItem = items[i];
                        this.selectedItems.push(items[i]);
                    }
                }
            }
        },

        _onSelect: function (event) {
            this._setSelection();
            this.onSelect(event);
        },

        _onDeselect: function (event) {
            this._setSelection();
            this.onDeselect(event);
        },
        
        onDeselect: function (event) { },

        onSelect: function (event) { }

    });

    CheckList.renderCheckBox = renderCheckBox;

    return CheckList;
});